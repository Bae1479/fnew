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

/**
 * 뉴스 가져오기
 */
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

/**
 * 문장 나누기
 */
function splitSentences(text = "") {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 뉴스 핵심 문장 추출
 */
function extractKeySentence(news) {
  const sentences = splitSentences(news.content);

  const valid = sentences.filter((s) => s.length > 80);

  return valid[0] || sentences[0] || news.title;
}

/**
 * 🔥 진짜 뉴스 기반 리딩 생성
 */
function buildReading(topic, newsItems) {
  const selected = newsItems.slice(0, 3);

  const intro = `${topic.label} is the focus of today’s reading. Several recent developments highlight important changes in this area.`;

  const body = selected
    .map((news) => extractKeySentence(news))
    .join(" ");

  const analysis = `These developments show that the situation is evolving through connected events rather than isolated cases. Understanding how these changes interact is important for interpreting what may happen next.`;

  return [intro, body, analysis].join("\n\n");
}

/**
 * 요약 (빈칸 3개)
 */
function buildSummary(reading) {
  const sentences = splitSentences(reading).slice(0, 3);

  const words = reading.match(/\b[a-zA-Z]{6,}\b/g) || [];
  const unique = [...new Set(words.map((w) => w.toLowerCase()))];

  const answers = unique.slice(0, 3);

  let summaryText = sentences.join(" ");

  answers.forEach((word) => {
    summaryText = summaryText.replace(
      new RegExp(`\\b${word}\\b`, "i"),
      "(____)"
    );
  });

  const summaryQuiz = answers.map((answer) => {
    const options = [answer];

    while (options.length < 4) {
      const pick = unique[Math.floor(Math.random() * unique.length)];
      if (!options.includes(pick)) options.push(pick);
    }

    return {
      answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return { text: summaryText, quiz: summaryQuiz };
}

/**
 * 퀴즈
 */
function buildQuiz(reading) {
  return [
    {
      q: "What is the main idea of the reading?",
      options: [
        "It explains recent real-world developments.",
        "It is a fictional story.",
        "It teaches grammar rules.",
        "It describes personal experiences."
      ],
      answer: 0
    },
    {
      q: "What do the events in the passage show?",
      options: [
        "They are connected developments.",
        "They are unrelated.",
        "They are random.",
        "They are fictional."
      ],
      answer: 0
    },
    {
      q: "What should readers understand?",
      options: [
        "How events influence each other.",
        "Only vocabulary meanings.",
        "Only individual facts.",
        "Only opinions."
      ],
      answer: 0
    },
    {
      q: "What is emphasized in the passage?",
      options: [
        "Interpretation of developments.",
        "Entertainment value.",
        "Personal feelings.",
        "Storytelling."
      ],
      answer: 0
    },
    {
      q: "What is the purpose of the reading?",
      options: [
        "To explain real events clearly.",
        "To create fiction.",
        "To list words.",
        "To describe a diary."
      ],
      answer: 0
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

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");

  console.log("✅ DONE (real news based)");
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
