const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

function cleanText(text = "") {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text = "") {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function removeRepeatedSentences(text = "") {
  const seen = new Set();
  const result = [];

  for (const sentence of splitSentences(text)) {
    const normalized = sentence
      .toLowerCase()
      .replace(/["'“”‘’]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(sentence);
    }
  }

  return result.join(" ");
}

function normalizeForCompare(text = "") {
  return text
    .toLowerCase()
    .replace(/["'“”‘’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueItems(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = normalizeForCompare(item.title || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function isEconomyLike(item) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();

  const keywords = [
    "economy",
    "economic",
    "market",
    "markets",
    "inflation",
    "interest rate",
    "federal reserve",
    "fed",
    "tariff",
    "trade",
    "jobs",
    "labor",
    "oil",
    "stocks",
    "stock",
    "bond",
    "bonds",
    "consumer",
    "prices",
    "gdp",
    "business",
    "budget",
    "bank",
    "banks",
    "currency",
    "exports",
    "imports"
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function chooseThreeItems(items) {
  const economyItems = items.filter(isEconomyLike);
  const others = items.filter((item) => !isEconomyLike(item));
  const picked = [];

  if (economyItems.length > 0) picked.push(economyItems[0]);

  for (const item of [...others, ...economyItems.slice(1)]) {
    if (picked.length >= 3) break;
    if (!picked.find((p) => p.link === item.link)) {
      picked.push(item);
    }
  }

  return picked.slice(0, 3);
}

function shortenSummary(text = "", maxSentences = 4) {
  return splitSentences(text).slice(0, maxSentences).join(" ");
}

function mergeTitleAndSummary(item) {
  const title = cleanText(item.title || "");
  const summary = shortenSummary(
    item.contentSnippet || item.content || item.summary || "",
    4
  );

  if (!summary) return title;

  const titleNormalized = normalizeForCompare(title);
  const summaryNormalized = normalizeForCompare(summary);

  if (titleNormalized && summaryNormalized.includes(titleNormalized)) {
    return removeRepeatedSentences(summary);
  }

  return removeRepeatedSentences(`${title}. ${summary}`);
}

function buildReadingFromItems(items) {
  const selected = chooseThreeItems(items);

  return selected
    .map((item) => mergeTitleAndSummary(item))
    .filter(Boolean)
    .join("\n\n");
}

function buildBackTranslationSentences(reading) {
  const candidates = splitSentences(reading).filter((sentence) => sentence.length > 70);
  const selected = [candidates[0], candidates[2], candidates[4]]
    .filter(Boolean)
    .slice(0, 3);

  const koreanPrompts = [
    "첫 번째 핵심 뉴스 문장을 영어로 써 보세요.",
    "두 번째 핵심 뉴스 문장을 영어로 써 보세요.",
    "세 번째 핵심 뉴스 문장을 영어로 써 보세요."
  ];

  return selected.map((english, index) => ({
    id: index + 1,
    korean: koreanPrompts[index],
    english
  }));
}

function pickSummaryWords(reading) {
  const words = cleanText(reading)
    .toLowerCase()
    .match(/[a-z][a-z-]{3,}/g) || [];

  const banned = new Set([
    "that","with","from","this","have","will","they","their","about","into",
    "after","before","while","where","which","across","would","could","should",
    "there","because","through","today","major","headline","headlines"
  ]);

  const freq = new Map();

  for (const word of words) {
    if (banned.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 12);
}

function buildSummaryData(reading) {
  const sentences = splitSentences(reading);
  const summaryBase = sentences.slice(0, 3).join(" ");
  const pool = pickSummaryWords(reading);

  const answers = [];
  let clozeText = summaryBase;

  for (const word of pool) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (answers.length >= 3) break;
    if (regex.test(clozeText)) {
      clozeText = clozeText.replace(regex, `(${word})`);
      answers.push(word);
    }
  }

  const fallbackAnswers = answers.length ? answers : pool.slice(0, 3);

  const distractorPool = pool.filter((word) => !fallbackAnswers.includes(word));
  const summaryQuiz = fallbackAnswers.map((answer, index) => {
    const wrongs = distractorPool
      .filter((w) => w !== answer)
      .slice(index * 3, index * 3 + 3);

    const options = [answer, ...wrongs].slice(0, 4);

    while (options.length < 4) {
      options.push(`option${options.length + 1}`);
    }

    return {
      blank: index + 1,
      answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return {
    text: clozeText,
    quiz: summaryQuiz
  };
}

function buildQuiz(items) {
  const chosen = chooseThreeItems(items);
  const firstTitle = cleanText(chosen[0]?.title || "the first headline");
  const secondTitle = cleanText(chosen[1]?.title || "the second headline");

  return [
    {
      q: "Which headline appeared in today’s reading?",
      options: [
        firstTitle,
        "A local school festival",
        "A restaurant review",
        "A fictional movie release"
      ],
      answer: 0
    },
    {
      q: "How many news stories are mainly included in the reading?",
      options: ["One", "Two", "Three", "Five"],
      answer: 2
    },
    {
      q: "Which of the following also appeared in the reading?",
      options: [
        secondTitle,
        "A travel diary entry",
        "A recipe update",
        "A sports rumor"
      ],
      answer: 0
    },
    {
      q: "What is the reading mainly made of?",
      options: [
        "General commentary",
        "News summaries",
        "Grammar explanations",
        "Fictional scenes"
      ],
      answer: 1
    },
    {
      q: "What kind of article is prioritized among the three stories?",
      options: [
        "Entertainment",
        "Sports",
        "Economy-related news",
        "Weather only"
      ],
      answer: 2
    }
  ];
}

async function fetchNewsItems() {
  const feed = await parser.parseURL(FEEDS.top);

  const rawItems = (feed.items || []).map((item) => ({
    title: item.title || "",
    link: item.link || "",
    pubDate: item.pubDate || "",
    contentSnippet: item.contentSnippet || item.content || item.summary || ""
  }));

  const items = uniqueItems(rawItems)
    .filter((item) => item.title && item.link)
    .slice(0, 8);

  if (!items.length) {
    throw new Error("No news found");
  }

  return items;
}

async function build() {
  const items = await fetchNewsItems();
  const chosen = chooseThreeItems(items);
  const reading = buildReadingFromItems(items);
  const summaryData = buildSummaryData(reading);
  const sentences = buildBackTranslationSentences(reading);
  const quiz = buildQuiz(items);

  const data = {
    date: new Date().toISOString(),
    source: "PBS News RSS",
    headline: cleanText(chosen[0]?.title || items[0]?.title || "Daily News"),
    reading,
    quiz,
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    sentences,
    newsItems: chosen.map((item) => ({
      title: cleanText(item.title),
      link: item.link,
      pubDate: item.pubDate
    }))
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("✅ todayReading.json updated");
}

build().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
