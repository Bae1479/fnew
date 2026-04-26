const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

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
    .filter((s) => s.length > 20);
}

async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || [])
      .map((item) => ({
        title: cleanText(item.title || ""),
        link: item.link || "",
        pubDate: item.pubDate || "",
        content: cleanText(
          item.contentSnippet || item.content || item.summary || ""
        )
      }))
      .filter((item) => item.title);
  } catch {
    return [];
  }
}

function pickMainNews(newsItems) {
  const usable = newsItems.filter(
    (item) => item.content && item.content.length > 80
  );

  return (
    usable.sort((a, b) => b.content.length - a.content.length)[0] ||
    newsItems[0] || {
      title: "Daily News Reading",
      content:
        "A recent news report describes an important public event. The report includes details about what happened, who was involved, and how officials responded."
    }
  );
}

function getWhoWhatWhere(title, content) {
  const text = `${title}. ${content}`;
  const sentences = splitSentences(text);

  return {
    first: sentences[0] || title,
    second: sentences[1] || "",
    third: sentences[2] || ""
  };
}

function buildReading(mainNews) {
  const { first, second, third } = getWhoWhatWhere(
    mainNews.title,
    mainNews.content
  );

  const title = mainNews.title;
  const content = mainNews.content;

  const p1 = first;

  const p2 = second
    ? `${second} This detail gives readers more information about the situation described in the report.`
    : `The report centers on ${title.toLowerCase()}. The event drew attention because it involved specific people, actions, and an immediate response.`;

  const p3 = third
    ? `${third} This part of the report helps explain how the event developed after the first details became clear.`
    : `The available details show that the situation was not simply a headline. The report describes what happened, how the people involved were affected, and how the response unfolded.`;

  const p4 =
    `The main facts of the report are connected by the same event: ${content} ` +
    `For readers, the important task is to follow the order of events and notice how each detail adds to the overall picture.`;

  const p5 =
    `The headline, "${title}," gives the main subject of the reading. ` +
    `The body of the report provides the details needed to understand the event more clearly.`;

  return [p1, p2, p3, p4, p5]
    .map((p) => cleanText(p))
    .filter(Boolean)
    .join("\n\n");
}

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
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
    "people",
    "readers",
    "report",
    "headline",
    "details"
  ]);

  function pickWord(sentence, usedWords) {
    const words = sentence.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [];

    return (
      words
        .map((word) => word.toLowerCase())
        .find((word) => !banned.has(word) && !usedWords.has(word)) ||
      "event"
    );
  }

  const usedWords = new Set();
  const answers = selected.map((sentence) => {
    const word = pickWord(sentence, usedWords);
    usedWords.add(word);
    return word;
  });

  let text = selected.join(" ");

  answers.forEach((answer) => {
    text = text.replace(new RegExp(`\\b${answer}\\b`, "i"), "(____)");
  });

  const allWords = [
    ...new Set(
      (reading.match(/\b[a-zA-Z][a-zA-Z-]{5,}\b/g) || [])
        .map((word) => word.toLowerCase())
        .filter((word) => !banned.has(word))
    )
  ];

  const summaryQuiz = answers.map((answer, index) => {
    const options = [answer];

    for (const word of allWords) {
      if (options.length >= 4) break;
      if (!options.includes(word)) options.push(word);
    }

    while (options.length < 4) {
      const fallback = ["security", "officials", "response", "event", "public"];
      const next = fallback.find((word) => !options.includes(word));
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
      "What is the passage mainly about?",
      mainNews.title,
      [
        "A fictional story about private life",
        "A grammar explanation with no news content",
        "A list of unrelated vocabulary words"
      ]
    ),
    makeQuestion(
      "What should readers follow while reading?",
      "The order of events and the details that explain the situation",
      [
        "Only the title without reading the body",
        "Random opinions unrelated to the report",
        "A fictional conversation between characters"
      ]
    ),
    makeQuestion(
      "Why are the details important?",
      "They help explain what happened and how the situation developed",
      [
        "They remove the need to understand the event",
        "They make the report fictional",
        "They are unrelated to the main subject"
      ]
    ),
    makeQuestion(
      "What is the author’s purpose?",
      "To explain a real news event clearly",
      [
        "To entertain with a made-up story",
        "To teach only grammar rules",
        "To describe a personal diary"
      ]
    ),
    makeQuestion(
      "Which source detail is used as the main subject?",
      mainNews.title,
      [
        "A random movie title",
        "A private travel plan",
        "A fictional school story"
      ]
    )
  ];
}

async function build() {
  const newsItems = await fetchNews();
  const mainNews = pickMainNews(newsItems);
  const reading = buildReading(mainNews);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: "daily-news",
    categoryLabel: "Daily News",
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
