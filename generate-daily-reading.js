const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

const TOPIC_ROTATION = [
  {
    key: "economy",
    label: "Economy",
    keywords: [
      "economy", "economic", "market", "markets", "inflation", "interest rate",
      "federal reserve", "fed", "tariff", "trade", "jobs", "labor", "oil",
      "stocks", "stock", "bond", "bonds", "consumer", "prices", "gdp",
      "business", "budget", "bank", "banks", "currency", "crypto", "bitcoin"
    ]
  },
  {
    key: "society",
    label: "Society",
    keywords: [
      "court", "law", "election", "government", "congress", "policy",
      "school", "education", "health", "housing", "immigration", "crime",
      "police", "community", "rights", "justice", "workers", "families"
    ]
  },
  {
    key: "science",
    label: "Science and Technology",
    keywords: [
      "science", "technology", "ai", "artificial intelligence", "space",
      "climate", "energy", "research", "medical", "health", "disease",
      "study", "nasa", "computer", "data", "drug", "vaccine"
    ]
  },
  {
    key: "world",
    label: "World Issues",
    keywords: [
      "war", "gaza", "ukraine", "russia", "china", "iran", "israel",
      "europe", "asia", "africa", "conflict", "military", "diplomacy",
      "ceasefire", "border", "refugee", "foreign"
    ]
  }
];

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

function normalizeForCompare(text = "") {
  return cleanText(text)
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

function removeRepeatedSentences(text = "") {
  const seen = new Set();
  const result = [];

  for (const sentence of splitSentences(text)) {
    const key = normalizeForCompare(sentence);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(sentence);
  }

  return result.join(" ");
}

function getTodayTopic() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPIC_ROTATION[dayNumber % TOPIC_ROTATION.length];
}

function scoreItemForTopic(item, topic) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
  let score = 0;

  for (const keyword of topic.keywords) {
    if (text.includes(keyword)) score += 3;
  }

  if ((item.contentSnippet || "").length > 120) score += 1;
  return score;
}

function chooseTopicItems(items, topic) {
  const scored = items
    .map((item) => ({ item, score: scoreItemForTopic(item, topic) }))
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((x) => x.score > 0).map((x) => x.item);
  const fallback = scored.map((x) => x.item);

  const picked = [];

  for (const item of [...matched, ...fallback]) {
    if (picked.length >= 4) break;
    if (!picked.find((p) => p.link === item.link)) picked.push(item);
  }

  return picked;
}

function getArticleCore(item) {
  const title = cleanText(item.title || "");
  const summary = splitSentences(
    item.contentSnippet || item.content || item.summary || ""
  )
    .slice(0, 3)
    .join(" ");

  if (!summary) return title;

  const titleKey = normalizeForCompare(title);
  const summaryKey = normalizeForCompare(summary);

  if (titleKey && summaryKey.includes(titleKey)) {
    return removeRepeatedSentences(summary);
  }

  return removeRepeatedSentences(`${title}. ${summary}`);
}

function buildReadingFromItems(items, topic) {
  const selected = chooseTopicItems(items, topic).slice(0, 4);
  const cores = selected.map(getArticleCore).filter(Boolean);

  const topicName = topic.label.toLowerCase();

  const opening =
    `${topic.label} is the focus of today’s reading. The main story is not one isolated headline, but a broader pattern that appears across several recent reports. Together, these reports show how pressure is building, how institutions are responding, and why the topic may continue to matter in the days ahead.`;

  const background =
    `The first point to understand is the background behind the issue. ${cores[0] || ""} This gives the reading its starting point because it shows the immediate event or decision that brought the topic into focus. It also gives readers a concrete example before the passage moves into wider analysis.`;

  const development =
    `The second part of the story shows how the issue is developing. ${cores[1] || ""} This matters because a single report rarely explains the whole situation. When another related report appears, it can reveal whether the issue is spreading, whether pressure is increasing, or whether public and institutional reactions are beginning to change.`;

  const consequence =
    `The third part of the reading is about possible consequences. ${cores[2] || ""} This report helps explain why the topic is not only a short-term news item. It may affect decisions, expectations, and future behavior. In that sense, the story is not just about what happened, but also about what people may do next.`;

  const widerContext =
    cores[3]
      ? `A final related report adds wider context. ${cores[3]} This detail helps connect the earlier points and makes the reading feel less like separate news summaries. It suggests that the same theme is appearing in more than one place, which is why the topic deserves a longer reading.`
      : `A final point is that the issue is still developing. Even when the available reports do not provide every answer, they show enough movement to make the topic worth watching. The important task for readers is to connect the details rather than memorize each headline separately.`;

  const analysis =
    `Taken together, the reports create one connected article about ${topicName}. One paragraph introduces the event, another shows development, another explains possible consequences, and another adds context. This structure is useful because it helps readers follow the logic of the news instead of jumping from headline to headline.`;

  const closing =
    `The larger meaning is that ${topicName} should be read as a continuing story. The details may change, but the pattern is what matters most: pressure builds, decisions follow, and people respond. For English practice, this kind of reading is useful because it combines real news with a clear structure, allowing learners to build vocabulary while also following a longer argument.`;

  return [
    opening,
    background,
    development,
    consequence,
    widerContext,
    analysis,
    closing
  ]
    .map(removeRepeatedSentences)
    .filter(Boolean)
    .join("\n\n");
}

function pickWordsForSummary(reading) {
  const words = cleanText(reading).toLowerCase().match(/[a-z][a-z-]{4,}/g) || [];
  const banned = new Set([
    "about", "after", "again", "because", "before", "between", "could",
    "every", "first", "from", "have", "important", "major", "more",
    "other", "rather", "reading", "report", "reports", "several",
    "should", "story", "stories", "their", "there", "these", "today",
    "together", "which", "while", "with", "would", "following",
    "useful", "point", "points", "topic", "headline", "headlines",
    "paragraph", "article"
  ]);

  const freq = new Map();

  for (const word of words) {
    if (banned.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 20);
}

function buildSummaryData(reading) {
  const sentences = splitSentences(reading);

  let summaryText = sentences.slice(0, 6).join(" ");
  const candidateWords = pickWordsForSummary(summaryText + " " + reading);

  const answers = [];
  const usedSentenceIndexes = new Set();

  for (const word of candidateWords) {
    if (answers.length >= 3) break;

    const sentenceIndex = sentences.findIndex((sentence, idx) => {
      if (usedSentenceIndexes.has(idx)) return false;
      return new RegExp(`\\b${word}\\b`, "i").test(sentence);
    });

    if (sentenceIndex === -1) continue;

    answers.push({ word, sentenceIndex });
    usedSentenceIndexes.add(sentenceIndex);
  }

  const finalAnswers = answers.map((a) => a.word);

  for (const answer of finalAnswers) {
    summaryText = summaryText.replace(
      new RegExp(`\\b${answer}\\b`, "i"),
      `(${answer})`
    );
  }

  const distractors = candidateWords.filter((word) => !finalAnswers.includes(word));

  const summaryQuiz = finalAnswers.map((answer, index) => {
    const wrongs = distractors.slice(index * 3, index * 3 + 3);
    const options = [answer, ...wrongs].slice(0, 4);

    while (options.length < 4) {
      for (const fallback of ["policy", "market", "public", "change", "pressure"]) {
        if (!options.includes(fallback)) {
          options.push(fallback);
          break;
        }
      }
    }

    return {
      blank: index + 1,
      answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return { text: summaryText, quiz: summaryQuiz };
}

function buildBackTranslationSentences(reading) {
  const candidates = splitSentences(reading).filter((s) => s.length > 70);
  const selected = [candidates[1], candidates[4], candidates[7]]
    .filter(Boolean)
    .slice(0, 3);

  const koreanByIndex = [
    "이 뉴스는 하나의 고립된 사건이 아니라 더 넓은 흐름으로 읽어야 한다.",
    "관련 보도가 하나 더 나오면 그 문제가 확산되고 있는지 알 수 있다.",
    "독자는 각각의 헤드라인을 따로 외우기보다 세부 내용을 연결해야 한다."
  ];

  return selected.map((english, index) => ({
    id: index + 1,
    korean: koreanByIndex[index] || "다음 문장을 영어로 써 보세요.",
    english
  }));
}

function buildQuiz(items, topic) {
  const selected = chooseTopicItems(items, topic).slice(0, 4);
  const firstTitle = cleanText(selected[0]?.title || "the first headline");
  const secondTitle = cleanText(selected[1]?.title || "the second headline");

  return [
    {
      q: "What is the main focus of today’s reading?",
      options: [topic.label, "A fictional diary", "Grammar rules only", "Movie reviews"],
      answer: 0
    },
    {
      q: "Which headline appeared in the reading?",
      options: [firstTitle, "A restaurant review", "A school concert", "A fantasy novel"],
      answer: 0
    },
    {
      q: "How is the reading organized?",
      options: [
        "As one topic developed through related reports",
        "As random vocabulary only",
        "As a fictional dialogue",
        "As unrelated jokes"
      ],
      answer: 0
    },
    {
      q: "Which of these was also included?",
      options: [secondTitle, "A recipe update", "A sports rumor", "A travel diary"],
      answer: 0
    },
    {
      q: "What should readers do with the reports?",
      options: [
        "Connect the details to understand the wider pattern",
        "Ignore the details",
        "Read only the title",
        "Treat them as unrelated"
      ],
      answer: 0
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
    .slice(0, 20);

  if (!items.length) throw new Error("No news found");
  return items;
}

async function build() {
  const topic = getTodayTopic();
  const items = await fetchNewsItems();
  const selected = chooseTopicItems(items, topic).slice(0, 4);
  const reading = buildReadingFromItems(items, topic);
  const summaryData = buildSummaryData(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    source: "PBS News RSS",
    headline: `${topic.label}: ${cleanText(selected[0]?.title || items[0]?.title || "Daily News")}`,
    reading,
    quiz: buildQuiz(items, topic),
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    sentences: buildBackTranslationSentences(reading),
    newsItems: selected.map((item) => ({
      title: cleanText(item.title),
      link: item.link,
      pubDate: item.pubDate
    }))
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ todayReading.json updated: ${topic.label}`);
}

build().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
