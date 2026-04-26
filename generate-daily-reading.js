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

function cleanText(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text = "") {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
}

async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || []).map((item) => ({
      title: cleanText(item.title || ""),
      link: item.link || "",
      pubDate: item.pubDate || "",
      content: cleanText(
        item.contentSnippet || item.content || item.summary || ""
      )
    }));
  } catch {
    return [];
  }
}

function pickMainNews(newsItems) {
  return (
    newsItems
      .filter((n) => n.content && n.content.length > 200)
      .sort((a, b) => b.content.length - a.content.length)[0] ||
    newsItems[0] || {
      title: "Daily News Reading",
      content:
        "Today’s news focuses on a developing issue that affects public life. Officials, institutions, and ordinary people are watching how the situation changes. The details remain important because they help explain how one event can influence broader decisions."
    }
  );
}

function buildReading(mainNews) {
  const sentences = splitSentences(mainNews.content);

  const p1 = sentences.slice(0, 3).join(" ");
  const p2 = sentences.slice(3, 6).join(" ");
  const p3 = sentences.slice(6, 9).join(" ");
  const p4 = sentences.slice(9, 12).join(" ");

  const paragraphs = [p1, p2, p3, p4]
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return mainNews.content || mainNews.title;
  }

  return paragraphs.join("\n\n");
}

function buildSummary(reading) {
  const sentences = splitSentences(reading);

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
    "official",
    "people"
  ]);

  function pickWord(sentence) {
    const words = sentence.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [];
    return (
      words
        .map((w) => w.toLowerCase())
        .find((w) => !banned.has(w)) || "development"
    );
  }

  const answers = selected.map(pickWord).slice(0, 3);

  let text = selected.join(" ");

  answers.forEach((answer) => {
    text = text.replace(new RegExp(`\\b${answer}\\b`, "i"), "(____)");
  });

  const allWords = [
    ...new Set(
      (reading.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [])
        .map((w) => w.toLowerCase())
        .filter((w) => !banned.has(w))
    )
  ];

  const summaryQuiz = answers.map((answer, index) => {
    const options = [answer];

    for (const word of allWords) {
      if (options.length >= 4) break;
      if (!options.includes(word)) options.push(word);
    }

    while (options.length < 4) {
      const fallback = ["policy", "market", "pressure", "decision", "system"];
      const next = fallback.find((w) => !options.includes(w));
      options.push(next || `choice${options.length + 1}`);
    }

    return {
      blank: index + 1,
      answer,
      options: shuffleArray(options)
    };
  });

  return {
    text,
    quiz: summaryQuiz
  };
}

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeQuestion(q, correct, wrongs) {
  const options = shuffleArray([correct, ...wrongs]);
  return {
    q,
    options,
    answer: options.indexOf(correct)
  };
}

function buildQuiz(mainNews) {
  return [
    makeQuestion(
      "What is the main idea of the passage?",
      "The passage explains a real news development in detail.",
      [
        "The passage tells a fictional story.",
        "The passage only lists vocabulary words.",
        "The passage describes a personal diary."
      ]
    ),
    makeQuestion(
      "What can be inferred from the passage?",
      "The issue may have broader consequences beyond the immediate event.",
      [
        "The event has no wider meaning.",
        "The passage is unrelated to current events.",
        "The issue has already been fully resolved."
      ]
    ),
    makeQuestion(
      "Why are the details in the passage important?",
      "They help readers understand the development more clearly.",
      [
        "They are included only for entertainment.",
        "They replace the main idea.",
        "They are unrelated to the topic."
      ]
    ),
    makeQuestion(
      "What is the author’s purpose?",
      "To explain a real-world issue clearly.",
      [
        "To write a fictional narrative.",
        "To teach grammar rules only.",
        "To describe a private experience."
      ]
    ),
    makeQuestion(
      `The headline of the source news is closest to which idea?`,
      mainNews.title,
      [
        "A random entertainment update",
        "A fictional event",
        "A grammar lesson"
      ]
    )
  ];
}

async function build() {
  const topic = getTodayTopic();
  const newsItems = await fetchNews();
  const mainNews = pickMainNews(newsItems);
  const reading = buildReading(mainNews);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: mainNews.title,
    reading,
    quiz: buildQuiz(mainNews),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");

  console.log("✅ DONE:", mainNews.title);
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
