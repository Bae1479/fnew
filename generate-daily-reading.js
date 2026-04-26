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

    return (feed.items || []).slice(0, 5).map((item) => ({
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
 * 뉴스 1개 → 안정적으로 2~3문장
 */
function extractNewsBlock(news) {
  const s = splitSentences(news.content);

  // 👉 최소 5문장 확보 (부족하면 제목으로 보강)
  const extended = [...s];

  while (extended.length < 5) {
    extended.push(news.title);
  }

  return extended.slice(0, 5).join(" ");
}

/**
 * 🔥 핵심: 하나의 흐름으로 연결
 */
function buildReading(topic, newsItems) {
  const selected = newsItems.slice(0, 3);

  const intro = `${topic.label} is the focus of today’s reading. Several recent developments reported in the news highlight important changes in this area.`;

  const p1 = extractNewsBlock(selected[0]);
  const p2 = extractNewsBlock(selected[1]);
  const p3 = extractNewsBlock(selected[2]);

  return [intro, p1, p2, p3].join("\n\n");
}

/**
 * 🔥 요약 (항상 3 blanks)
 */
function buildSummary(reading) {
  const sentences = splitSentences(reading);

  const s1 = sentences[1];
  const s2 = sentences[Math.floor(sentences.length / 2)];
  const s3 = sentences[sentences.length - 2];

  const targets = [s1, s2, s3];

  const answers = targets.map((s) => {
    const words = s.match(/\b[a-zA-Z]{6,}\b/g) || [];
    return words[0]?.toLowerCase() || "system";
  });

  let text = `${s1} ${s2} ${s3}`;

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
          "Recent developments are interconnected.",
          "A personal story is described.",
          "A fictional event is presented.",
          "Grammar rules are explained."
        ],
        0
      )
    },
    {
      q: "What can be inferred?",
      ...shuffle(
        [
          "Events influence each other.",
          "Events are unrelated.",
          "Events are random.",
          "Events are fictional."
        ],
        0
      )
    },
    {
      q: "Which is true?",
      ...shuffle(
        [
          "Events are part of a larger system.",
          "Only one event matters.",
          "Events are independent.",
          "The passage is opinion-based."
        ],
        0
      )
    },
    {
      q: "What is the author's purpose?",
      ...shuffle(
        [
          "To analyze real-world developments.",
          "To entertain readers.",
          "To describe a story.",
          "To teach vocabulary."
        ],
        0
      )
    },
    {
      q: "What is the tone?",
      ...shuffle(
        [
          "Analytical",
          "Emotional",
          "Humorous",
          "Narrative"
        ],
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

  const reading = buildReading(topic, newsItems);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: `${topic.label} Reading`,
    reading,
    quiz: buildQuiz(),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE (stable version)");
}

build();
