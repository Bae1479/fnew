const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

const FEEDS = {
  top: "https://apnews.com/index.rss"
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
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildReadingFromItems(items) {
  const intro =
    "Today’s reading is based on several major international headlines. " +
    "This passage connects key developments to help you understand the global context.";

  const body = items
    .map((item, index) => {
      const title = cleanText(item.title || "");
      const summary = cleanText(item.contentSnippet || item.content || "");

      return (
        `Story ${index + 1}: ${title}. ` +
        `${summary} ` +
        "This story shows how global events can quickly affect people across countries."
      );
    })
    .join("\n\n");

  const closing =
    "Taken together, these developments show that the modern world is highly interconnected. " +
    "Reading real news helps you build vocabulary and understand global issues in context.";

  const sources = items.map((item, i) => `${i + 1}. ${item.link}`).join("\n");

  return `${intro}\n\n${body}\n\n${closing}\n\n[Sources]\n${sources}`;
}

function pickBackTranslationSentences(reading) {
  const raw = splitSentences(reading).filter(
    (s) => s.length > 50 && !s.includes("http") && !s.startsWith("[Sources]")
  );

  const selected = [raw[1], raw[3], raw[5]].filter(Boolean).slice(0, 3);

  const korean = [
    "오늘의 리딩은 여러 국제 뉴스 핵심 이슈를 바탕으로 구성되어 있다.",
    "이 뉴스는 한 국가를 넘어 많은 사람들에게 영향을 줄 수 있다.",
    "실제 뉴스를 읽는 것은 어휘와 배경지식을 함께 키우는 데 도움이 된다."
  ];

  return selected.map((en, i) => ({
    id: i + 1,
    korean: korean[i] || "다음 문장을 영어로 바꿔 보세요.",
    english: en
  }));
}

function buildQuiz(items) {
  const firstTitle = cleanText(items[0]?.title || "the main headline");

  return [
    {
      q: "What is the main purpose of this passage?",
      options: [
        "To describe fiction",
        "To connect real news stories",
        "To teach grammar only",
        "To advertise"
      ],
      answer: 1
    },
    {
      q: "Why do these stories matter?",
      options: [
        "They affect only one city",
        "They influence people globally",
        "They are only for fun",
        "They are outdated"
      ],
      answer: 1
    },
    {
      q: "Which headline appeared?",
      options: [
        firstTitle,
        "School sports day",
        "Food blog review",
        "Novel release"
      ],
      answer: 0
    },
    {
      q: "What is a benefit of reading news?",
      options: [
        "No need to study",
        "Build vocabulary",
        "Perfect pronunciation",
        "Skip learning"
      ],
      answer: 1
    },
    {
      q: "The world is described as:",
      options: ["Isolated", "Interconnected", "Simple", "Static"],
      answer: 1
    }
  ];
}

function buildSummary() {
  return (
    "The passage highlights how global events are (interconnected). " +
    "Reading real news helps improve (vocabulary) and understand major (issues) " +
    "within a broader (context)."
  );
}

async function fetchNewsItems() {
  const feed = await parser.parseURL(FEEDS.top);

  const items = (feed.items || [])
    .slice(0, 5)
    .map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
      contentSnippet: item.contentSnippet || item.content || item.summary || ""
    }))
    .filter((i) => i.title && i.link);

  if (!items.length) {
    throw new Error("No news found");
  }

  return items;
}

async function build() {
  const items = await fetchNewsItems();

  const reading = buildReadingFromItems(items);
  const sentences = pickBackTranslationSentences(reading);
  const quiz = buildQuiz(items);
  const summary = buildSummary();

  const data = {
    date: new Date().toISOString(),
    source: "AP News RSS",
    headline: cleanText(items[0].title),
    reading,
    quiz,
    summary,
    sentences,
    newsItems: items.map((i) => ({
      title: cleanText(i.title),
      link: i.link,
      pubDate: i.pubDate
    }))
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("✅ todayReading.json updated");
}

build().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
