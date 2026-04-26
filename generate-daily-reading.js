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
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function split(text = "") {
  return clean(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
}

async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || [])
      .slice(0, 6)
      .map((item) => ({
        title: clean(item.title || ""),
        link: item.link || "",
        pubDate: item.pubDate || "",
        content: clean(item.contentSnippet || item.content || item.summary || "")
      }))
      .filter((n) => n.title && n.content.length > 50);
  } catch {
    return [];
  }
}

function extractCore(news) {
  const sentences = split(news.content);
  return sentences.slice(0, 2);
}

function buildReading(newsItems) {
  const selected = newsItems.slice(0, 3);

  function makeBlock(news) {
    const sentences = split(news.content);
    const main = sentences.slice(0, 2).join(" ");
    const title = news.title || "";

    const context =
      title && !main.toLowerCase().includes(title.toLowerCase())
        ? `The headline, "${title}," gives the main context for this development.`
        : "";

    return [main, context].filter(Boolean).join(" ");
  }

  const blocks = selected.map(makeBlock).filter(Boolean);

  return blocks
    .map(clean)
    .filter(Boolean)
    .join("\n\n");
}

function shuffle(options, correctIndex) {
  const arr = options.map((text, index) => ({
    text,
    correct: index === correctIndex
  }));

  const shuffled = arr.sort(() => Math.random() - 0.5);

  return {
    options: shuffled.map((x) => x.text),
    answer: shuffled.findIndex((x) => x.correct)
  };
}

function buildQuiz(reading) {
  const sentences = split(reading);
  const detail = sentences[0] || "The passage describes a recent news event.";
  const mid = sentences[Math.floor(sentences.length / 2)] || detail;

  return [
    {
      q: "What is the main idea of the passage?",
      ...shuffle(
        [
          "It explains recent real-world developments.",
          "It tells a fictional story.",
          "It teaches grammar rules only.",
          "It describes a personal diary."
        ],
        0
      )
    },
    {
      q: "According to the passage, what happened?",
      ...shuffle(
        [
          detail,
          "Nothing significant occurred.",
          "The event was fictional.",
          "The passage describes a private conversation."
        ],
        0
      )
    },
    {
      q: "Which statement is best supported by the passage?",
      ...shuffle(
        [
          mid,
          "The passage gives no factual information.",
          "The passage is mainly about entertainment.",
          "The passage avoids current events."
        ],
        0
      )
    },
    {
      q: "What can be inferred from the passage?",
      ...shuffle(
        [
          "The situation may continue to receive attention.",
          "The story is unrelated to public events.",
          "The issue has no real-world significance.",
          "The passage is a fictional narrative."
        ],
        0
      )
    },
    {
      q: "What is the author’s purpose?",
      ...shuffle(
        [
          "To explain a real news event clearly.",
          "To entertain readers with fiction.",
          "To teach only vocabulary.",
          "To describe a personal memory."
        ],
        0
      )
    }
  ];
}

function buildSummary(reading) {
  const sentences = split(reading);

  const selected = [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ].filter(Boolean);

  const banned = new Set([
    "today",
    "reading",
    "because",
    "which",
    "their",
    "there",
    "these",
    "those",
    "about",
    "after",
    "before",
    "while",
    "where",
    "would",
    "could",
    "should",
    "people",
    "readers",
    "report",
    "headline",
    "details",
    "passage"
  ]);

  const used = new Set();

  function pickWord(sentence) {
    const words = sentence.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [];

    const word =
      words
        .map((w) => w.toLowerCase())
        .find((w) => !banned.has(w) && !used.has(w)) ||
      words[0]?.toLowerCase() ||
      "event";

    used.add(word);
    return word;
  }

  const blanks = selected.map((sentence) => {
    const answer = pickWord(sentence);

    return {
      answer,
      sentence: sentence.replace(new RegExp(`\\b${answer}\\b`, "i"), "(____)")
    };
  });

  const allWords = [
    ...new Set(
      (reading.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [])
        .map((w) => w.toLowerCase())
        .filter((w) => !banned.has(w))
    )
  ];

  const summaryQuiz = blanks.map((blank) => {
    const options = [blank.answer];

    for (const word of allWords) {
      if (options.length >= 4) break;
      if (!options.includes(word)) options.push(word);
    }

    while (options.length < 4) {
      const fallback = ["security", "officials", "response", "public", "event"];
      const next = fallback.find((w) => !options.includes(w));
      options.push(next || `choice${options.length + 1}`);
    }

    return {
      answer: blank.answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return {
    text: blanks.map((b) => b.sentence).join(" "),
    quiz: summaryQuiz
  };
}

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
    quiz: buildQuiz(reading),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("✅ DONE");
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
