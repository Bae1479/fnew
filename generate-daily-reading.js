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
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPIC_ROTATION[dayNumber % TOPIC_ROTATION.length];
}

function scoreItemForTopic(item, topic) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
  let score = 0;

  for (const keyword of topic.keywords) {
    if (text.includes(keyword)) score += 2;
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
    if (picked.length >= 5) break;
    if (!picked.find((p) => p.link === item.link)) picked.push(item);
  }

  return picked;
}

function getArticleCore(item) {
  const title = cleanText(item.title || "");
  const summary = splitSentences(
    item.contentSnippet || item.content || item.summary || ""
  )
    .slice(0, 4)
    .join(" ");

  if (!summary) return title;

  const titleKey = normalizeForCompare(title);
  const summaryKey = normalizeForCompare(summary);

  if (titleKey && summaryKey.includes(titleKey)) {
    return removeRepeatedSentences(summary);
  }

  return removeRepeatedSentences(`${title}. ${summary}`);
}

function contextSentence(topic, index) {
  const bank = {
    economy: [
      "The report matters because it may affect prices, market expectations, household budgets, or the way businesses plan for the months ahead.",
      "It also connects to the larger question of whether economic pressure is easing, spreading, or becoming more difficult for policymakers to manage.",
      "For investors and consumers, the important point is not only the immediate number or event, but also what it suggests about the next stage of the economy.",
      "The story shows how one economic signal can influence confidence, spending, and expectations across several parts of the market.",
      "Seen together with other financial news, it adds another clue about whether the economy is moving toward stability or renewed uncertainty."
    ],
    society: [
      "The report matters because it affects public trust, local communities, and the way institutions respond to pressure.",
      "It also shows how a social issue can move quickly from a local concern to a wider public debate.",
      "For ordinary people, the significance often lies in how decisions by officials or institutions change daily life.",
      "The story raises broader questions about fairness, responsibility, and how communities deal with conflict or uncertainty.",
      "Seen with related reports, it suggests that social change often develops through many smaller events rather than one single moment."
    ],
    science: [
      "The report matters because scientific or technological change can reshape health, regulation, energy use, or the way people live and work.",
      "It also shows how research and innovation rarely stay separate from public policy and social expectations.",
      "For readers, the key issue is not only the discovery or device itself, but also how it may be used, trusted, or controlled.",
      "The story points to the larger question of whether new knowledge will solve problems, create new risks, or do both at the same time.",
      "Seen with related reports, it shows how science and technology can gradually change the direction of society."
    ],
    world: [
      "The report matters because international events can affect diplomacy, security, migration, trade, and public opinion far beyond one country.",
      "It also shows how one decision or conflict can influence negotiations and reactions in other parts of the world.",
      "For readers, the central issue is how governments respond when local or regional events carry wider consequences.",
      "The story points to a larger question about whether tension will decrease, spread, or become part of a longer period of uncertainty.",
      "Seen with related reports, it reminds readers that world affairs are rarely isolated from economic and political pressure."
    ]
  };

  const list = bank[topic.key] || bank.economy;
  return list[index % list.length];
}

function buildReadingFromItems(items, topic) {
  const selected = chooseTopicItems(items, topic).slice(0, 5);

  const opening =
    `${topic.label} is the focus of today’s reading. ` +
    `The following reports are connected by the same broad theme, so the passage should be read as one longer news reading rather than as separate short items.`;

  const body = selected.map((item, index) => {
    const core = getArticleCore(item);
    return removeRepeatedSentences(`${core} ${contextSentence(topic, index)}`);
  });

  const synthesis =
    `Taken together, these reports show a wider pattern within ${topic.label.toLowerCase()}. ` +
    `One story may show the immediate event, another may show the response, and another may reveal the possible consequence. ` +
    `Reading them together gives a clearer picture than reading any single headline alone.`;

  const closing =
    `The main point is that today’s topic is developing through several connected signals. ` +
    `Each report adds detail, but the larger meaning comes from comparing the stories and noticing how pressure, decisions, and public reactions build across the same field.`;

  return [opening, ...body, synthesis, closing].filter(Boolean).join("\n\n");
}

function buildTranslation(reading, topic) {
  const paragraphs = reading.split(/\n\s*\n/).filter(Boolean);

  const translated = paragraphs.map((p, index) => {
    if (index === 0) {
      return `오늘의 리딩은 ${topic.label}을 중심 주제로 다룹니다. 아래의 여러 뉴스는 같은 큰 흐름 안에서 연결되어 있으므로, 각각의 짧은 기사로 따로 보기보다 하나의 긴 뉴스 지문으로 읽는 것이 좋습니다.`;
    }

    if (index === paragraphs.length - 2) {
      return `이 뉴스들을 함께 보면 ${topic.label} 분야 안에서 더 큰 흐름이 보입니다. 어떤 기사는 당장의 사건을 보여 주고, 어떤 기사는 그에 대한 반응을 보여 주며, 또 다른 기사는 앞으로의 영향을 드러냅니다. 하나의 헤드라인만 볼 때보다 여러 기사를 함께 읽을 때 전체 그림이 더 분명해집니다.`;
    }

    if (index === paragraphs.length - 1) {
      return `핵심은 오늘의 주제가 여러 연결된 신호를 통해 전개되고 있다는 점입니다. 각각의 기사는 세부 정보를 더해 주지만, 더 큰 의미는 여러 이야기들을 비교하고 그 안에서 압력, 결정, 대중의 반응이 어떻게 쌓이는지를 살펴볼 때 드러납니다.`;
    }

    return `이 문단은 오늘의 ${topic.label} 관련 뉴스 중 하나를 설명합니다. 기사에서 제시된 사건이나 발표는 단순한 개별 소식에 그치지 않고, 앞으로의 결정과 시장 또는 사회적 반응에 영향을 줄 수 있는 흐름으로 읽을 수 있습니다.`;
  });

  return translated.join("\n\n");
}

function pickWordsForSummary(reading) {
  const words = cleanText(reading).toLowerCase().match(/[a-z][a-z-]{4,}/g) || [];
  const banned = new Set([
    "about", "after", "again", "because", "before", "between", "could",
    "every", "first", "from", "have", "important", "major", "more",
    "other", "rather", "reading", "report", "reports", "several",
    "should", "story", "stories", "their", "there", "these", "today",
    "together", "which", "while", "with", "would", "following"
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
        "Around one topic using several related news reports",
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
  const selected = chooseTopicItems(items, topic).slice(0, 5);
  const reading = buildReadingFromItems(items, topic);
  const summaryData = buildSummaryData(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    source: "PBS News RSS",
    headline: `${topic.label}: ${cleanText(selected[0]?.title || items[0]?.title || "Daily News")}`,
    reading,
    translation: buildTranslation(reading, topic),
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
