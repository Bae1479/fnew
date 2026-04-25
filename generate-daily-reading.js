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

const TOPIC_ROTATION = [
  {
    key: "economy",
    label: "Economy",
    keywords: [
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
      "crypto",
      "bitcoin",
      "exports",
      "imports"
    ]
  },
  {
    key: "society",
    label: "Society and Politics",
    keywords: [
      "court",
      "law",
      "election",
      "government",
      "congress",
      "senate",
      "policy",
      "school",
      "education",
      "health",
      "housing",
      "immigration",
      "crime",
      "police",
      "community",
      "rights",
      "justice",
      "workers",
      "families"
    ]
  },
  {
    key: "science",
    label: "Science and Technology",
    keywords: [
      "science",
      "technology",
      "ai",
      "artificial intelligence",
      "space",
      "climate",
      "energy",
      "research",
      "medical",
      "health",
      "disease",
      "study",
      "nasa",
      "computer",
      "data",
      "robot",
      "drug",
      "vaccine"
    ]
  },
  {
    key: "world",
    label: "World Issues",
    keywords: [
      "war",
      "gaza",
      "ukraine",
      "russia",
      "china",
      "iran",
      "israel",
      "europe",
      "asia",
      "africa",
      "united nations",
      "conflict",
      "military",
      "diplomacy",
      "ceasefire",
      "border",
      "refugee",
      "foreign"
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

function removeRepeatedSentences(text = "") {
  const seen = new Set();
  const result = [];

  for (const sentence of splitSentences(text)) {
    const normalized = normalizeForCompare(sentence);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(sentence);
  }

  return result.join(" ");
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

function getTodayTopic() {
  const now = new Date();
  const dayNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return TOPIC_ROTATION[dayNumber % TOPIC_ROTATION.length];
}

function scoreItemForTopic(item, topic) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
  let score = 0;

  for (const keyword of topic.keywords) {
    if (text.includes(keyword)) score += 2;
  }

  if (text.length > 120) score += 1;
  return score;
}

function chooseTopicItems(items, topic) {
  const scored = items
    .map((item) => ({
      item,
      score: scoreItemForTopic(item, topic)
    }))
    .sort((a, b) => b.score - a.score);

  const topicMatches = scored
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.item);

  const fallback = scored.map((entry) => entry.item);

  const picked = [];
  for (const item of [...topicMatches, ...fallback]) {
    if (picked.length >= 5) break;
    if (!picked.find((p) => p.link === item.link)) picked.push(item);
  }

  return picked;
}

function getArticleCore(item) {
  const title = cleanText(item.title || "");
  const sentences = splitSentences(item.contentSnippet || item.content || item.summary || "");
  const summary = sentences.slice(0, 3).join(" ");

  if (!summary) return title;

  const titleKey = normalizeForCompare(title);
  const summaryKey = normalizeForCompare(summary);

  if (titleKey && summaryKey.includes(titleKey)) {
    return removeRepeatedSentences(summary);
  }

  return removeRepeatedSentences(`${title}. ${summary}`);
}

function topicContextSentence(topic, index) {
  const economy = [
    "The economic importance of this report lies in how it may affect prices, investment decisions, consumer confidence, or expectations about future policy.",
    "For markets and households, the story matters because economic pressure often spreads from one sector to another instead of staying in one place.",
    "This development also helps explain why investors, businesses, and ordinary consumers watch economic signals closely.",
    "Seen together with other financial news, it adds another piece to the larger question of where the economy may be heading.",
    "The longer-term issue is whether this kind of pressure becomes temporary noise or part of a more durable economic trend."
  ];

  const society = [
    "The social importance of this report comes from the way it affects public trust, local communities, and the decisions of major institutions.",
    "Stories like this often become larger debates because they touch everyday life, not only government offices or official statements.",
    "The issue also shows how social problems can move from local concern to national argument very quickly.",
    "For readers, the key question is how people and institutions respond when pressure builds in public life.",
    "The broader meaning depends on whether this event remains isolated or becomes part of a wider social pattern."
  ];

  const science = [
    "The scientific or technological importance of this report is that it may change how people understand risk, innovation, health, or the future use of new tools.",
    "Developments like this often matter beyond the laboratory or the company because they can influence daily life, regulation, and long-term planning.",
    "The story also reminds readers that science and technology rarely move separately from public policy and social expectations.",
    "For readers, the important point is not only the discovery or product itself, but also how it may be used and governed.",
    "The longer-term question is whether this development becomes a narrow technical update or part of a wider shift."
  ];

  const world = [
    "The international importance of this report lies in how it may affect diplomacy, security, alliances, or the choices of governments beyond one country.",
    "World news often develops through connected pressures, where one decision can influence negotiations, markets, and public opinion elsewhere.",
    "This story also shows why foreign affairs can rarely be understood as a single isolated event.",
    "For readers, the central issue is how leaders respond when local or regional developments carry wider consequences.",
    "The larger question is whether this event reduces tension or becomes part of a longer period of uncertainty."
  ];

  const bank = {
    economy,
    society,
    science,
    world
  };

  const list = bank[topic.key] || economy;
  return list[index % list.length];
}

function buildReadingFromItems(items, topic) {
  const selected = chooseTopicItems(items, topic).slice(0, 5);

  const opening =
    `${topic.label} is the focus of today’s reading. ` +
    `The passage follows several related news reports in the same area, so the reading feels like one connected topic rather than a mix of unrelated headlines.`;

  const bodyParagraphs = selected.map((item, index) => {
    const core = getArticleCore(item);
    const context = topicContextSentence(topic, index);
    return removeRepeatedSentences(`${core} ${context}`);
  });

  const synthesis =
    `Taken together, these ${topic.label.toLowerCase()} stories show a pattern rather than a single isolated event. ` +
    `Each report gives one piece of information, but the full reading becomes clearer when the stories are placed side by side. ` +
    `The shared theme is not only what happened today, but also what these developments suggest about pressure, risk, and change within the same field.`;

  const closing =
    `For a careful reader, the most useful approach is to compare the details across the reports. ` +
    `One story may show the immediate event, another may show the reaction, and another may reveal the broader consequence. ` +
    `That is why today’s reading should be read as one longer passage about ${topic.label.toLowerCase()}, not as separate short news items.`;

  return [opening, ...bodyParagraphs, synthesis, closing]
    .filter(Boolean)
    .join("\n\n");
}

function pickWordsForSummary(reading) {
  const words = cleanText(reading).toLowerCase().match(/[a-z][a-z-]{4,}/g) || [];

  const banned = new Set([
    "about",
    "after",
    "again",
    "because",
    "before",
    "between",
    "could",
    "every",
    "first",
    "from",
    "have",
    "important",
    "major",
    "more",
    "other",
    "rather",
    "reading",
    "report",
    "reports",
    "several",
    "should",
    "story",
    "stories",
    "their",
    "there",
    "these",
    "thing",
    "today",
    "together",
    "which",
    "while",
    "with",
    "would"
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

function buildSummaryData(reading, topic) {
  const sentences = splitSentences(reading);
  const base = sentences.slice(0, 5).join(" ");
  const words = pickWordsForSummary(base + " " + reading);

  const answers = words.slice(0, 3);
  let text = base;

  for (const answer of answers) {
    const regex = new RegExp(`\\b${answer}\\b`, "i");
    text = text.replace(regex, `(${answer})`);
  }

  const distractors = words.filter((word) => !answers.includes(word));

  const summaryQuiz = answers.map((answer, index) => {
    const wrongs = distractors.slice(index * 3, index * 3 + 3);
    const options = [answer, ...wrongs].slice(0, 4);

    while (options.length < 4) {
      const fallback = ["policy", "market", "public", "change", "pressure", "decision"];
      const next = fallback.find((word) => !options.includes(word));
      options.push(next || `choice${options.length + 1}`);
    }

    return {
      blank: index + 1,
      answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return {
    text,
    quiz: summaryQuiz
  };
}

function buildBackTranslationSentences(reading) {
  const candidates = splitSentences(reading).filter((sentence) => sentence.length > 80);
  const selected = [candidates[1], candidates[4], candidates[7]]
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
  const selected = chooseTopicItems(items, topic).slice(0, 5);
  const firstTitle = cleanText(selected[0]?.title || "the first headline");
  const secondTitle = cleanText(selected[1]?.title || "the second headline");

  return [
    {
      q: "What is the main focus of today’s reading?",
      options: [
        topic.label,
        "A mix of unrelated entertainment stories",
        "A fictional travel diary",
        "Grammar rules without news content"
      ],
      answer: 0
    },
    {
      q: "Which headline appeared in the reading?",
      options: [
        firstTitle,
        "A restaurant review",
        "A local school music festival",
        "A fictional movie release"
      ],
      answer: 0
    },
    {
      q: "How is the reading organized?",
      options: [
        "Around one topic using several related news reports",
        "As one short sentence",
        "As a list of vocabulary only",
        "As a fictional dialogue"
      ],
      answer: 0
    },
    {
      q: "Which of these was also included?",
      options: [
        secondTitle,
        "A recipe update",
        "A sports rumor with no article",
        "A fantasy story"
      ],
      answer: 0
    },
    {
      q: "What should readers do with the reports?",
      options: [
        "Compare them to understand the wider pattern",
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

  if (!items.length) {
    throw new Error("No news found");
  }

  return items;
}

async function build() {
  const topic = getTodayTopic();
  const items = await fetchNewsItems();
  const selected = chooseTopicItems(items, topic).slice(0, 5);
  const reading = buildReadingFromItems(items, topic);
  const summaryData = buildSummaryData(reading, topic);
  const sentences = buildBackTranslationSentences(reading);
  const quiz = buildQuiz(items, topic);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    source: "PBS News RSS",
    headline: `${topic.label}: ${cleanText(selected[0]?.title || items[0]?.title || "Daily News")}`,
    reading,
    quiz,
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    sentences,
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
