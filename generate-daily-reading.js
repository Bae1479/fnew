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

  const opening =
    `${topic.label} is the focus of today’s reading. Recent reports point to a wider story that is not limited to one headline. The main issue is how several related developments are shaping expectations, decisions, and public reactions in the same field.`;

  const paragraph1 =
    `${cores[0] || ""} This report gives the reading its starting point. It shows the immediate development and introduces the pressure that people, institutions, or markets are now trying to understand.`;

  const paragraph2 =
    `${cores[1] || ""} This second report adds another layer to the same topic. Rather than standing apart, it helps explain why the first development matters and why the issue may continue to influence decisions beyond the original event.`;

  const paragraph3 =
    `${cores[2] || ""} A third related report shows how the story is spreading into a broader conversation. It suggests that the issue is not only about one announcement or one group of people, but about how different parts of society, policy, or the economy respond to changing conditions.`;

  const paragraph4 =
    cores[3]
      ? `${cores[3]} This additional report gives the reading more context. It helps connect short-term news with longer-term questions about risk, confidence, and the direction of the topic.`
      : `The available reports also show that the issue is still developing. Readers should pay attention not only to the facts already reported, but also to the reactions that follow.`;

  const analysis =
    `Taken together, these reports form one connected news picture. The useful point is not simply that several events happened on the same day. The useful point is that each report adds a different angle: one shows the event, another shows the response, another shows the possible consequence, and another gives context. That is why today’s reading should be read as one longer article about ${topic.label.toLowerCase()}, not as a list of unrelated summaries.`;

  const closing =
    `For English practice, this kind of reading is helpful because it uses real news while still giving the reader a clear structure. The topic develops across several paragraphs, so the reader has to follow repeated ideas, compare details, and notice how the meaning becomes clearer as the article continues.`;

  return [
    opening,
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4,
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
    "useful", "point"
  ]);

  const freq = new Map();

  for (const word of words) {
    if (banned.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 16);
}

function buildSummaryData(reading) {
  const base = splitSentences(reading).slice(0, 5).join(" ");
  const words = pickWordsForSummary(base + " " + reading);
  const answers = words.slice(0, 3);

  let text = base;

  for (const answer of answers) {
    text = text.replace(new RegExp(`\\b${answer}\\b`, "i"), `(${answer})`);
  }

  const distractors = words.filter((word) => !answers.includes(word));

  const summaryQuiz = answers.map((answer, index) => {
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

  return { text, quiz: summaryQuiz };
}

function buildBackTranslationSentences(reading) {
  const candidates = splitSentences(reading).filter((s) => s.length > 80);
  const selected = [candidates[2], candidates[5], candidates[8]]
    .filter(Boolean)
    .slice(0, 3);

  const koreanPrompts = [
    "첫 번째 핵심 뉴스 문장을 영어로 써 보세요.",
    "두 번째 핵심 뉴스 문장을 영어로 써 보세요.",
    "세 번째 핵심 뉴스 문장을 영어로 써 보세요."
  ];

  return selected.map((english, index) => ({
    id: index + 1,
    korean: koreanPrompts[index] || "다음 문장을 영어로 바꿔 보세요.",
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
        "Around one topic using related news reports",
        "As one random sentence",
        "As vocabulary only",
        "As a fictional dialogue"
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
        "Compare them to understand a wider pattern",
        "Ignore the details",
        "Read only the title",
        "Treat them as unrelated jokes"
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
