const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

const TOPICS = [
  { key: "economy", label: "Economy" },
  { key: "society", label: "Society" },
  { key: "science", label: "Science" },
  { key: "world", label: "World Issues" }
];

function getTodayTopic() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPICS[day % TOPICS.length];
}

async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || [])
      .slice(0, 5)
      .map((item) => ({
        title: item.title || "",
        content:
          item.contentSnippet ||
          item.content ||
          item.summary ||
          ""
      }));
  } catch {
    return [];
  }
}

function splitSentences(text = "") {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function extract(news) {
  const s = splitSentences(news.content);
  return [s[0], s[1], s[2]].filter(Boolean).join(" ");
}

/**
 * 🔥 기사형 리딩
 */
function buildReading(topic, newsItems) {
  const selected = newsItems.slice(0, 3);

  const intro = `${topic.label} is the focus of today’s reading. Recent developments reported in the news highlight changes that are shaping this area.`;

  const body = selected.map((n) => extract(n));

  const bridge = `These developments are not isolated. They reflect broader structural changes and shifting expectations across systems.`;

  const analysis = `This suggests that understanding ${topic.label.toLowerCase()} requires analyzing how individual events interact within a larger context.`;

  return [intro, ...body, bridge, analysis].join("\n\n");
}

/**
 * 요약 (핵심 문장 + 빈칸 3개)
 */
function buildSummary(reading) {
  const sentences = splitSentences(reading);

  const selected = [
    sentences[1],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 2]
  ];

  const words = reading.match(/\b[a-zA-Z]{6,}\b/g) || [];
  const unique = [...new Set(words.map((w) => w.toLowerCase()))];

  const answers = unique.slice(0, 3);

  let text = selected.join(" ");

  answers.forEach((w) => {
    text = text.replace(new RegExp(`\\b${w}\\b`, "i"), "(____)");
  });

  const quiz = answers.map((a) => {
    const opts = [a];

    while (opts.length < 4) {
      const pick = unique[Math.floor(Math.random() * unique.length)];
      if (!opts.includes(pick)) opts.push(pick);
    }

    return {
      answer: a,
      options: opts.sort(() => Math.random() - 0.5)
    };
  });

  return { text, quiz };
}

/**
 * 🔥 TOEFL 스타일 퀴즈
 */
function shuffle(options, correct) {
  const arr = options.map((o, i) => ({
    text: o,
    correct: i === correct
  }));

  const s = arr.sort(() => Math.random() - 0.5);

  return {
    options: s.map((x) => x.text),
    answer: s.findIndex((x) => x.correct)
  };
}

function buildQuiz(reading) {
  const sentences = splitSentences(reading);

  const vocabWord = (reading.match(/\b[a-zA-Z]{6,}\b/) || ["system"])[0];

  return [
    {
      q: "What is the main idea of the passage?",
      ...shuffle(
        [
          "The passage explains how recent developments are interconnected.",
          "The passage tells a fictional story.",
          "The passage focuses only on vocabulary.",
          "The passage describes personal experiences."
        ],
        0
      )
    },
    {
      q: "What can be inferred about the events described?",
      ...shuffle(
        [
          "They influence each other through broader factors.",
          "They occur independently.",
          "They are random and unpredictable.",
          "They are fictional examples."
        ],
        0
      )
    },
    {
      q: `The word "${vocabWord}" in the passage is closest in meaning to:`,
      ...shuffle(
        ["structure", "story", "emotion", "accident"],
        0
      )
    },
    {
      q: "Which of the following is true according to the passage?",
      ...shuffle(
        [
          "Events are connected within a larger context.",
          "Events are completely unrelated.",
          "Only one event matters.",
          "The passage describes a personal opinion."
        ],
        0
      )
    },
    {
      q: "What is the author's purpose?",
      ...shuffle(
        [
          "To explain and analyze real-world developments.",
          "To entertain with a story.",
          "To describe personal experiences.",
          "To teach grammar rules."
        ],
        0
      )
    }
  ];
}

async function build() {
  const topic = getTodayTopic();
  const newsItems = await fetchNews();

  const reading = buildReading(topic, newsItems);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: `${topic.label} Reading`,
    reading,
    quiz: buildQuiz(reading),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE: TOEFL-style reading generated");
}

build();
