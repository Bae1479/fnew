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
    subject: "interest rates, inflation, and market expectations",
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
    subject: "public pressure, policy decisions, and institutional response",
    keywords: [
      "court", "law", "election", "government", "congress", "policy",
      "school", "education", "health", "housing", "immigration", "crime",
      "police", "community", "rights", "justice", "workers", "families"
    ]
  },
  {
    key: "science",
    label: "Science and Technology",
    subject: "new technology, research, and public impact",
    keywords: [
      "science", "technology", "ai", "artificial intelligence", "space",
      "climate", "energy", "research", "medical", "health", "disease",
      "study", "nasa", "computer", "data", "drug", "vaccine"
    ]
  },
  {
    key: "world",
    label: "World Issues",
    subject: "international tension, diplomacy, and government response",
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
    .slice(0, 2)
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
  const subject = topic.subject;

  const sourceText = cores.join(" ");

  const intro =
    `${topic.label} is the focus of today’s reading, especially the issue of ${subject}. ` +
    `Recent news points to one main question: how this situation is changing and why people are paying attention to it now.`;

  const paragraph1 =
    `The background of the issue is becoming clearer. ${cores[0] || sourceText} ` +
    `The main point is not that many unrelated events happened, but that the same pressure is appearing in different parts of the same topic. ` +
    `This gives readers a reason to look beyond a single headline and follow the wider direction of the story.`;

  const paragraph2 =
    `The issue matters because it can influence decisions and expectations. ` +
    `${cores[1] || ""} ` +
    `When this kind of development appears, people often begin to adjust their plans, whether they are officials, companies, investors, families, or ordinary citizens. ` +
    `That is why the topic is important as a continuing news story rather than as a short update.`;

  const paragraph3 =
    `The recent details also show that the situation is still moving. ` +
    `${cores[2] || ""} ` +
    `The central question is whether the pressure will ease, remain stable, or create new problems. ` +
    `Readers should pay attention to the way each new detail changes the larger picture.`;

  const paragraph4 =
    `Another useful point is the effect this issue may have beyond the immediate event. ` +
    `${cores[3] || ""} ` +
    `Even when the news begins with one decision or one announcement, the consequences can spread through policy, markets, public opinion, or daily life. ` +
    `This is what makes the topic worth following carefully.`;

  const analysis =
    `This suggests that ${subject} may remain an important issue in the near term.`;

  return [
    intro,
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4,
    analysis
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
    "paragraph", "article", "issue", "issues", "main"
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
  let summaryText = sentences.slice(0, 5).join(" ");
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

  const distractors = candidateWords.filter(
    (word) => !finalAnswers.includes(word)
  );

  const summaryQuiz = finalAnswers.map((answer, index) => {
    const wrongs = distractors.slice(index * 3, index * 3 + 3);
    const options = [answer, ...wrongs].slice(0, 4);

    while (options.length < 4) {
      for (const fallback of [
        "policy",
        "market",
        "public",
        "change",
        "pressure",
        "decision"
      ]) {
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
  const selected = [candidates[1], candidates[3], candidates[5]]
    .filter(Boolean)
    .slice(0, 3);

  const koreanByIndex = [
    "이 문제는 하나의 고립된 사건이 아니라 더 넓은 흐름으로 보아야 한다.",
    "사람들은 새로운 변화가 나타나면 자신들의 계획을 조정하기 시작한다.",
    "독자는 새로운 세부 내용이 전체 그림을 어떻게 바꾸는지 살펴보아야 한다."
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

  return [
    {
      q: "What is the main focus of today’s reading?",
      options: [
        topic.label,
        "A fictional diary",
        "Grammar rules only",
        "Movie reviews"
      ],
      answer: 0
    },
    {
      q: "Which headline helped shape today’s reading?",
      options: [
        firstTitle,
        "A restaurant review",
        "A school concert",
        "A fantasy novel"
      ],
      answer: 0
    },
    {
      q: "How is the reading organized?",
      options: [
        "As one topic developed through related details",
        "As random vocabulary only",
        "As a fictional dialogue",
        "As unrelated jokes"
      ],
      answer: 0
    },
    {
      q: "What should readers pay attention to?",
      options: [
        "How new details change the larger picture",
        "Only the first sentence",
        "Only the title",
        "Unrelated entertainment news"
      ],
      answer: 0
    },
    {
      q: "Where does the analysis appear?",
      options: [
        "At the end in one sentence",
        "In every paragraph",
        "Only in the title",
        "It does not appear"
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
    headline: `${topic.label}: ${topic.subject}`,
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
