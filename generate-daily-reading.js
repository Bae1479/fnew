const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

function clean(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function split(text = "") {
  return clean(text)
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 30);
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
        title: clean(item.title),
        content: clean(
          item.contentSnippet || item.content || item.summary || ""
        )
      }))
      .filter((n) => n.content.length > 50);
  } catch {
    return [];
  }
}

/**
 * 핵심 문장 추출 (뉴스당 1~2개)
 */
function extractCore(news) {
  const sentences = split(news.content);
  return sentences.slice(0, 2);
}

/**
 * 🔥 핵심: 요약 → 리딩 생성
 */
function buildReading(newsItems) {
  const selected = newsItems.slice(0, 3);

  const cores = selected.flatMap(extractCore);

  // 중복 제거
  const seen = new Set();
  const unique = cores.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 👉 핵심 내용을 자연스럽게 재구성
  const p1 = unique.slice(0, 2).join(" ");

  const p2 =
    unique.slice(2, 4).join(" ") ||
    "Additional reports provide further details about the situation and how it developed.";

  const p3 =
    unique.slice(4, 6).join(" ") ||
    "These developments show how the situation unfolded through a series of related events.";

  return [p1, p2, p3]
    .map((p) => clean(p))
    .filter(Boolean)
    .join("\n\n");
}

/**
 * 요약 (빈칸 3개)
 */
function buildSummary(reading) {
  const sentences = split(reading);

  const selected = [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ].filter(Boolean);

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
 * 퀴즈 (독해형)
 */
function shuffle(options, correctIndex) {
  const arr = options.map((o, i) => ({
    text: o,
    correct: i === correctIndex
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
          "The passage explains recent developments using multiple reports.",
          "The passage tells a fictional story.",
          "The passage focuses on grammar.",
          "The passage describes personal experiences."
        ],
        0
      )
    },
    {
      q: "What can be inferred?",
      ...shuffle(
        [
          "The events are connected across different reports.",
          "The events are unrelated.",
          "The events are fictional.",
          "The events are random."
        ],
        0
      )
    },
    {
      q: "How is the passage structured?",
      ...shuffle(
        [
          "It combines information from multiple sources.",
          "It lists vocabulary only.",
          "It tells a story.",
          "It gives instructions."
        ],
        0
      )
    },
    {
      q: "What is the author’s purpose?",
      ...shuffle(
        [
          "To explain real-world developments clearly.",
          "To entertain readers.",
          "To describe fiction.",
          "To teach grammar."
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
  const newsItems = await fetchNews();

  const reading = buildReading(newsItems);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: "daily-news",
    categoryLabel: "Daily News",
    headline: newsItems[0]?.title || "Daily News",
    reading,
    quiz: buildQuiz(),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE (summary-based reading)");
}

build();
