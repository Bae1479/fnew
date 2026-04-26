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

function splitSentences(text = "") {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 40);
}

/**
 * 뉴스 가져오기
 */
async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || []).map((item) => ({
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

/**
 * 🔥 가장 좋은 뉴스 선택 (핵심)
 */
function pickMainNews(newsItems) {
  return newsItems
    .filter((n) => n.content && n.content.length > 200)
    .sort((a, b) => b.content.length - a.content.length)[0] || newsItems[0];
}

/**
 * 🔥 하나의 뉴스 → 기사형 리딩
 */
function buildReading(topic, main) {
  const sentences = splitSentences(main.content);

  const intro = `${topic.label} is the focus of today’s reading. A recent report highlights an important development in this area.`;

  const p1 = sentences.slice(0, 2).join(" ");
  const p2 = sentences.slice(2, 4).join(" ");

  const explanation = `This development is important because it reflects broader changes that may influence decisions and expectations. The situation may continue to evolve depending on how key factors develop over time.`;

  const conclusion = `Overall, this case shows how a single event can provide insight into larger trends within ${topic.label.toLowerCase()}.`;

  return [intro, p1, p2, explanation, conclusion].join("\n\n");
}

/**
 * 🔥 요약 (항상 3 blanks)
 */
function buildSummary(reading) {
  const s = splitSentences(reading);

  const selected = [
    s[1],
    s[Math.floor(s.length / 2)],
    s[s.length - 2]
  ];

  const answers = selected.map((sentence) => {
    const words = sentence.match(/\b[a-zA-Z]{6,}\b/g) || [];
    return words[0]?.toLowerCase() || "system";
  });

  let text = selected.join(" ");

  answers.forEach((w) => {
    text = text.replace(
      new RegExp(`\\b${w}\\b`, "i"),
      "(____)"
    );
  });

  const quiz = answers.map((a) => ({
    answer: a,
    options: shuffleOptions(a)
  }));

  return { text, quiz };
}

function shuffleOptions(answer) {
  const pool = [
    "system",
    "policy",
    "market",
    "change",
    "pressure",
    "decision"
  ];

  const opts = [answer];

  while (opts.length < 4) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!opts.includes(pick)) opts.push(pick);
  }

  return opts.sort(() => Math.random() - 0.5);
}

/**
 * 🔥 TOEFL 스타일 퀴즈
 */
function shuffle(q, correct) {
  const arr = q.map((opt, i) => ({
    text: opt,
    correct: i === correct
  }));

  const s = arr.sort(() => Math.random() - 0.5);

  return {
    options: s.map((x) => x.text),
    answer: s.findIndex((x) => x.correct)
  };
}

function buildQuiz() {
  return [
    {
      q: "What is the main idea of the passage?",
      ...shuffle(
        [
          "The passage explains a real-world development.",
          "The passage tells a fictional story.",
          "The passage lists vocabulary.",
          "The passage describes a personal diary."
        ],
        0
      )
    },
    {
      q: "What can be inferred?",
      ...shuffle(
        [
          "The situation may continue to evolve.",
          "Nothing will change.",
          "The event is unrelated to others.",
          "The event is fictional."
        ],
        0
      )
    },
    {
      q: "Which is true?",
      ...shuffle(
        [
          "The event reflects broader trends.",
          "The event is isolated.",
          "The event is random.",
          "The event is irrelevant."
        ],
        0
      )
    },
    {
      q: "What is the author's purpose?",
      ...shuffle(
        [
          "To explain and analyze a real event.",
          "To entertain readers.",
          "To teach grammar.",
          "To describe a story."
        ],
        0
      )
    },
    {
      q: "What is the tone?",
      ...shuffle(
        ["Analytical", "Emotional", "Humorous", "Narrative"],
        0
      )
    }
  ];
}

/**
 * 실행
 */
async function build() {
  const topic = getTodayTopic();
  const newsItems = await fetchNews();

  const main = pickMainNews(newsItems);

  const reading = buildReading(topic, main);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: main.title,
    reading,
    quiz: buildQuiz(),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE (final stable version)");
}

build();
