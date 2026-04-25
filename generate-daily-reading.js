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
    subject: "public trust, policy decisions, and institutional response",
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

  if ((item.contentSnippet || "").length > 100) score += 1;
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

function buildReadingFromTopic(topic) {
  if (topic.key === "economy") {
    return [
      "Interest rates, inflation, and market expectations are the focus of today’s reading. When people talk about the economy, they often focus on one number at a time, such as the price of oil, the level of inflation, or the decision of a central bank. However, these numbers are connected. Interest rates influence borrowing costs, borrowing costs affect consumer spending, and consumer spending can change the direction of business activity. For that reason, a discussion about interest rates is also a discussion about prices, jobs, investment, and confidence.",
      "The central issue is whether inflation is falling quickly enough for policymakers to feel comfortable lowering rates. If inflation remains high, central banks may keep rates elevated for longer. Higher rates make loans more expensive for households and businesses. A family thinking about a mortgage, a company planning a new investment, or a consumer using a credit card can all feel the effect. This is why rate expectations matter even before an official decision is made. Markets often move based on what investors believe will happen next, not only on what has already happened.",
      "Market expectations can also change quickly when new data appears. A stronger jobs report may suggest that the economy is still resilient, but it may also make investors worry that inflation pressure will continue. A weaker consumer report may suggest that demand is slowing, but it may also raise concerns about future growth. This creates a difficult balance. Good news can sometimes be interpreted as bad news for rate cuts, while weaker news can sometimes support hopes for easier policy. That is why economic headlines often seem confusing at first.",
      "Inflation is especially important because it affects everyday life directly. When prices rise faster than wages, people feel that their money does not go as far. Even if inflation slows, many prices may remain higher than they were before. This difference between slower inflation and lower prices is important. Policymakers may say that inflation is improving, while consumers may still feel pressure at the grocery store, in rent payments, or in transportation costs. The gap between official data and daily experience can shape public opinion about the economy.",
      "For investors, the question is how long uncertainty will last. Stock markets may rise when traders expect lower interest rates, because cheaper borrowing can support business growth. Bond markets may react differently, especially if investors expect rates to remain higher for longer. Currency values can also move as rate expectations change. These reactions show that interest rates are not just a technical policy tool. They are a signal that influences how people judge the future direction of the economy.",
      "This suggests that markets may remain cautious until inflation, employment, and central-bank signals point more clearly in the same direction."
    ].join("\n\n");
  }

  if (topic.key === "society") {
    return [
      "Public trust, policy decisions, and institutional response are the focus of today’s reading. Social issues rarely develop from a single event. More often, they grow when people feel that institutions are not responding quickly, fairly, or clearly enough. A court decision, a government policy, a school dispute, a health concern, or a local conflict can become part of a larger public debate when it touches everyday life.",
      "The central issue is how institutions respond when pressure builds. Governments, courts, schools, police departments, and public agencies are expected to make decisions that affect many people. When those decisions appear fair and transparent, public trust can become stronger. When they appear slow, confusing, or unequal, trust can weaken. This is why social news often becomes emotional. People are not only reacting to facts; they are reacting to whether they believe the system is working for them.",
      "Public pressure can spread quickly because social issues are closely connected to personal experience. Housing costs, education quality, healthcare access, immigration rules, public safety, and workers’ rights are not abstract topics. They shape where people live, how families plan, and how communities feel about the future. When people see a news story that reflects their own concerns, they may respond strongly even if the event happened far away.",
      "Policy decisions also have long effects. A new law or court ruling can change the behavior of schools, companies, local governments, and families. Sometimes the first reaction focuses on who won or lost politically. But the deeper question is how the decision changes daily life. A policy may solve one problem while creating another. It may protect one group while leaving another group uncertain. This is why careful reading is important in social news.",
      "Institutions face a difficult challenge in moments of public tension. If they move too slowly, people may accuse them of ignoring the problem. If they move too quickly, others may question whether the decision was careful enough. The strongest response is usually one that explains the reason for a decision, shows awareness of public concern, and creates a path for future adjustment. Without that explanation, even a reasonable policy can face resistance.",
      "This suggests that public trust depends not only on the final decision, but also on whether people believe the process was fair and understandable."
    ].join("\n\n");
  }

  if (topic.key === "science") {
    return [
      "New technology, research, and public impact are the focus of today’s reading. Scientific and technological developments often begin with specialists, but they rarely stay inside laboratories, universities, or companies. A new medical study, an energy project, an artificial intelligence tool, or a space mission can change public expectations. The question is not only what has been discovered, but also how that discovery may be used.",
      "The central issue is the gap between innovation and readiness. New technology can move faster than laws, schools, workplaces, and communities can adapt. Artificial intelligence is a clear example. It can help people write, analyze data, translate languages, and automate routine tasks. At the same time, it raises questions about jobs, privacy, accuracy, and responsibility. A tool that seems useful in one setting may create risk in another.",
      "Research in health and medicine follows a similar pattern. A new treatment or study can create hope, but it also requires careful testing, regulation, and public explanation. People want fast progress, especially when a disease is serious or a treatment seems promising. However, science depends on evidence. The public may see a headline and expect an immediate solution, while researchers may see only one step in a longer process.",
      "Energy and climate technology also show how science connects to daily life. Cleaner energy systems, battery storage, electric vehicles, and climate research are not only technical issues. They affect prices, infrastructure, jobs, and government planning. A new technology may be impressive, but it becomes important only when it can be produced, distributed, trusted, and maintained at scale.",
      "Public trust is essential. If people do not understand a technology, they may reject it even when it has benefits. If companies or governments exaggerate what a technology can do, disappointment can grow later. Clear communication matters because science is not only about discovery; it is also about explanation. People need to know what is known, what is uncertain, and what decisions still need to be made.",
      "This suggests that the real impact of science and technology depends on how well innovation is matched with trust, regulation, and practical use."
    ].join("\n\n");
  }

  return [
    "International tension, diplomacy, and government response are the focus of today’s reading. World issues often appear to begin with one dramatic event, but the deeper story usually involves a longer chain of decisions. A conflict, negotiation, border dispute, election result, or diplomatic statement can affect security, trade, migration, and public opinion beyond one country.",
    "The central issue is how governments respond when pressure rises. Leaders must consider domestic opinion, alliances, economic interests, and security risks at the same time. A decision that looks strong to one audience may look dangerous to another. A delay that seems careful to diplomats may seem weak to the public. This is why foreign policy often moves slowly even when the situation feels urgent.",
    "Diplomacy matters because it creates space between conflict and escalation. Talks, ceasefire proposals, sanctions, aid packages, and international statements may not solve a crisis immediately. However, they can shape the choices available to governments. When communication breaks down, misunderstandings become more dangerous. When channels remain open, even limited agreements can reduce risk.",
    "International tension also affects ordinary people. War can force families to leave their homes, disrupt food and energy supplies, and change the cost of living far away from the conflict zone. Trade disputes can affect businesses and consumers. Migration pressures can influence domestic politics in other countries. This is why world news is never only about leaders and borders; it is also about people whose lives are changed by decisions made elsewhere.",
    "Alliances add another layer of complexity. Countries rarely act alone in major crises. They consider how partners, rivals, and international organizations will respond. A government may choose a policy not only because of what it wants, but because of what it expects others to do next. In this way, world issues often become a test of trust, influence, and credibility.",
    "This suggests that international crises are most dangerous when political pressure rises faster than diplomatic solutions can develop."
  ].join("\n\n");
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
    "paragraph", "article", "issue", "issues", "main", "focus"
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

function buildBackTranslationSentences(reading, topic) {
  if (topic.key === "economy") {
    return [
      {
        id: 1,
        korean: "금리는 차입 비용에 영향을 주고, 차입 비용은 소비 지출에 영향을 준다.",
        english:
          "Interest rates influence borrowing costs, and borrowing costs affect consumer spending."
      },
      {
        id: 2,
        korean: "시장은 이미 일어난 일뿐만 아니라 앞으로 일어날 일에 대한 기대를 바탕으로 움직인다.",
        english:
          "Markets often move based on what investors believe will happen next, not only on what has already happened."
      },
      {
        id: 3,
        korean: "인플레이션은 일상생활에 직접적인 영향을 주기 때문에 특히 중요하다.",
        english:
          "Inflation is especially important because it affects everyday life directly."
      }
    ];
  }

  if (topic.key === "society") {
    return [
      {
        id: 1,
        korean: "사회 문제는 보통 하나의 사건에서만 생겨나지 않는다.",
        english:
          "Social issues rarely develop from a single event."
      },
      {
        id: 2,
        korean: "사람들은 사실뿐만 아니라 제도가 자신들을 위해 작동하고 있는지에도 반응한다.",
        english:
          "People are not only reacting to facts; they are reacting to whether they believe the system is working for them."
      },
      {
        id: 3,
        korean: "정책 결정은 학교, 기업, 지방정부, 가족의 행동을 바꿀 수 있다.",
        english:
          "A policy decision can change the behavior of schools, companies, local governments, and families."
      }
    ];
  }

  if (topic.key === "science") {
    return [
      {
        id: 1,
        korean: "새로운 기술은 법과 직장, 공동체가 적응하는 속도보다 더 빠르게 움직일 수 있다.",
        english:
          "New technology can move faster than laws, workplaces, and communities can adapt."
      },
      {
        id: 2,
        korean: "과학은 발견에 관한 것일 뿐만 아니라 설명에 관한 것이기도 하다.",
        english:
          "Science is not only about discovery; it is also about explanation."
      },
      {
        id: 3,
        korean: "사람들은 무엇이 알려졌고 무엇이 아직 불확실한지 알아야 한다.",
        english:
          "People need to know what is known and what is still uncertain."
      }
    ];
  }

  return [
    {
      id: 1,
      korean: "세계 이슈는 보통 하나의 극적인 사건에서만 시작되지 않는다.",
      english:
        "World issues often do not begin with a single dramatic event."
    },
    {
      id: 2,
      korean: "외교는 갈등과 확전 사이에 공간을 만든다.",
      english:
        "Diplomacy creates space between conflict and escalation."
    },
    {
      id: 3,
      korean: "세계 뉴스는 지도자와 국경에 관한 이야기만은 아니다.",
      english:
        "World news is not only about leaders and borders."
    }
  ];
}

function buildQuiz(topic) {
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
      q: "How is the reading organized?",
      options: [
        "As one topic developed across several paragraphs",
        "As unrelated headlines",
        "As vocabulary only",
        "As a fictional dialogue"
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
    },
    {
      q: "What should readers follow in the passage?",
      options: [
        "The development of one central issue",
        "Only the first sentence",
        "Random entertainment news",
        "A list of unrelated facts"
      ],
      answer: 0
    },
    {
      q: "What kind of reading is this?",
      options: [
        "A news-style reading with a single topic",
        "A recipe",
        "A poem",
        "A personal diary"
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

  return uniqueItems(rawItems)
    .filter((item) => item.title && item.link)
    .slice(0, 20);
}

async function build() {
  const topic = getTodayTopic();
  const items = await fetchNewsItems();
  const selected = chooseTopicItems(items, topic).slice(0, 4);
  const reading = buildReadingFromTopic(topic);
  const summaryData = buildSummaryData(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    source: "PBS News RSS",
    headline: `${topic.label}: ${topic.subject}`,
    reading,
    quiz: buildQuiz(topic),
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    sentences: buildBackTranslationSentences(reading, topic),
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
