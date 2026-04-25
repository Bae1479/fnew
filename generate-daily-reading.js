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
  { key: "economy", label: "Economy" },
  { key: "society", label: "Society" },
  { key: "science", label: "Science and Technology" },
  { key: "world", label: "World Issues" }
];

function cleanText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function splitSentences(text = "") {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getTodayTopic() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPIC_ROTATION[dayNumber % TOPIC_ROTATION.length];
}

function buildReadingFromTopic(topic) {
  if (topic.key === "economy") {
    return [
      "Interest rates, inflation, and market expectations are the focus of today’s reading. These factors are closely connected, and changes in one area can quickly influence the others. When central banks adjust interest rates, the cost of borrowing changes, and this affects how people spend, invest, and plan for the future.",
      "The central issue is whether inflation is slowing down enough. If inflation remains high, policymakers may keep interest rates elevated. Higher rates make loans more expensive, which can reduce spending and slow economic activity. At the same time, markets do not wait for official decisions. Investors often react based on what they expect to happen next.",
      "This creates a complex situation in which the same data can be interpreted in different ways. Strong economic data may suggest growth, but it may also increase concerns about inflation. Weak data may raise concerns about the economy, but it may also increase expectations for lower rates. As a result, market reactions can appear inconsistent.",
      "Inflation is especially important because it directly affects everyday life. Even when inflation slows, prices may remain higher than before, and this can continue to create pressure on consumers. This gap between economic data and daily experience often shapes how people feel about the economy.",
      "This suggests that markets may remain cautious as long as uncertainty about inflation and interest rates continues."
    ].join("\n\n");
  }

  if (topic.key === "society") {
    return [
      "Public trust and institutional response are the focus of today’s reading. Social issues often develop when people feel that systems are not working as expected. A single event can draw attention, but the larger story usually involves how institutions react over time.",
      "The central issue is whether institutions respond in a way that people consider fair and transparent. When decisions are clear and consistent, trust can increase. When they are confusing or delayed, trust can weaken. This is why social issues often become emotional.",
      "Public reaction is important because these issues are connected to everyday life. Topics such as housing, education, healthcare, and safety directly affect how people live. When individuals see their own experiences reflected in the news, their responses can become stronger.",
      "Policy decisions can also have long-term effects. A single law or ruling can change how organizations behave and how communities develop. This means that social issues are not only about immediate reactions, but also about lasting consequences.",
      "This suggests that public trust depends not only on decisions, but on how those decisions are explained and understood."
    ].join("\n\n");
  }

  if (topic.key === "science") {
    return [
      "Technology and scientific progress are the focus of today’s reading. New developments often begin in specialized environments, but they can quickly influence everyday life. The key question is how these innovations are used and understood.",
      "The central issue is the gap between innovation and adaptation. Technology can develop faster than systems can adjust. This creates challenges in areas such as regulation, education, and employment.",
      "Research in areas like medicine and artificial intelligence shows that progress is not always simple. New discoveries can create hope, but they also require testing and explanation. Without clear communication, people may misunderstand the impact of new technologies.",
      "Public trust plays an important role in whether new technology is accepted. If people understand how something works and why it matters, they are more likely to accept it. If not, uncertainty can lead to resistance.",
      "This suggests that the impact of technology depends not only on innovation, but also on communication and trust."
    ].join("\n\n");
  }

  return [
    "International issues and diplomacy are the focus of today’s reading. Global events often appear to begin suddenly, but they are usually the result of a series of decisions and reactions.",
    "The central issue is how governments respond to increasing pressure. Leaders must consider both domestic and international factors when making decisions.",
    "Diplomacy is important because it creates space for communication. Even when conflicts continue, discussions can help reduce the risk of escalation.",
    "Global issues also affect everyday life. Changes in trade, migration, or security can influence people far from the original event.",
    "This suggests that international situations depend on both political decisions and ongoing communication."
  ].join("\n\n");
}

function sentenceToNaturalKorean(sentence = "") {
  const s = sentence.toLowerCase();

  if (s.includes("interest rates influence borrowing costs")) {
    return "금리는 차입 비용에 영향을 주고, 차입 비용은 소비 지출에 영향을 준다.";
  }
  if (s.includes("markets do not wait for official decisions")) {
    return "시장은 공식 결정이 나올 때까지 기다리지 않는다.";
  }
  if (s.includes("investors often react based on what they expect")) {
    return "투자자들은 이미 일어난 일뿐만 아니라 앞으로 일어날 일에 대한 기대를 바탕으로 반응한다.";
  }
  if (s.includes("inflation is especially important")) {
    return "인플레이션은 일상생활에 직접적인 영향을 주기 때문에 특히 중요하다.";
  }

  if (s.includes("social issues often develop")) {
    return "사회 문제는 사람들이 제도가 기대한 대로 작동하지 않는다고 느낄 때 자주 생겨난다.";
  }
  if (s.includes("trust can increase")) {
    return "결정이 명확하고 일관적이면 신뢰는 높아질 수 있다.";
  }
  if (s.includes("policy decisions can also have long-term effects")) {
    return "정책 결정은 장기적인 영향을 가질 수도 있다.";
  }
  if (s.includes("public trust depends")) {
    return "공공의 신뢰는 결정 자체뿐만 아니라 그 결정이 어떻게 설명되고 이해되는지에도 달려 있다.";
  }

  if (s.includes("technology can develop faster")) {
    return "기술은 제도가 적응하는 속도보다 더 빠르게 발전할 수 있다.";
  }
  if (s.includes("new discoveries can create hope")) {
    return "새로운 발견은 희망을 줄 수 있지만, 검증과 설명도 필요하다.";
  }
  if (s.includes("public trust plays an important role")) {
    return "새로운 기술이 받아들여지는 데에는 공공의 신뢰가 중요한 역할을 한다.";
  }
  if (s.includes("impact of technology depends")) {
    return "기술의 영향은 혁신뿐만 아니라 소통과 신뢰에도 달려 있다.";
  }

  if (s.includes("diplomacy is important")) {
    return "외교는 소통의 공간을 만들기 때문에 중요하다.";
  }
  if (s.includes("leaders must consider")) {
    return "지도자들은 결정을 내릴 때 국내 요인과 국제 요인을 모두 고려해야 한다.";
  }
  if (s.includes("global issues also affect everyday life")) {
    return "세계적인 이슈는 일상생활에도 영향을 준다.";
  }
  if (s.includes("international situations depend")) {
    return "국제 상황은 정치적 결정과 지속적인 소통에 달려 있다.";
  }

  return makeFallbackKorean(sentence);
}

function makeFallbackKorean(sentence = "") {
  const s = sentence.toLowerCase();

  if (s.includes("interest") || s.includes("inflation") || s.includes("market")) {
    return "이 문장은 금리, 인플레이션, 시장 기대가 서로 연결되어 있다는 내용을 담고 있다.";
  }
  if (s.includes("trust") || s.includes("institution") || s.includes("policy")) {
    return "이 문장은 제도적 대응과 공공의 신뢰가 서로 연결되어 있다는 내용을 담고 있다.";
  }
  if (s.includes("technology") || s.includes("science") || s.includes("research")) {
    return "이 문장은 과학기술의 발전이 사회에 어떤 영향을 주는지를 설명한다.";
  }
  if (s.includes("government") || s.includes("diplomacy") || s.includes("international")) {
    return "이 문장은 정부의 대응과 외교가 국제 상황에 영향을 준다는 내용을 담고 있다.";
  }

  return "이 문장은 오늘 리딩의 핵심 내용을 설명한다.";
}

function buildBackTranslationSentences(reading) {
  const sentences = splitSentences(reading)
    .filter((s) => s.length >= 65)
    .filter((s) => !s.toLowerCase().startsWith("this suggests"));

  const selected = [sentences[1], sentences[3], sentences[5]]
    .filter(Boolean)
    .slice(0, 3);

  return selected.map((english, index) => ({
    id: index + 1,
    korean: sentenceToNaturalKorean(english),
    english
  }));
}

function buildSummaryData(reading) {
  const sentences = splitSentences(reading).filter((sentence) => {
    const wordCount = sentence.split(/\s+/).length;
    return wordCount >= 9 && wordCount <= 28;
  });

  const banned = new Set([
    "today", "reading", "focus", "these", "factors", "central", "issue",
    "because", "which", "their", "people", "about", "often", "other",
    "this", "that", "when", "where", "while", "with", "from", "into",
    "there", "have", "will", "would", "could", "should", "also",
    "more", "only", "some", "many", "area", "areas", "important"
  ]);

  const priorityWords = [
    "inflation",
    "rates",
    "markets",
    "borrowing",
    "spending",
    "expectations",
    "consumers",
    "policy",
    "trust",
    "institutions",
    "decisions",
    "technology",
    "innovation",
    "research",
    "communication",
    "diplomacy",
    "conflict",
    "security",
    "governments",
    "pressure"
  ];

  function getCandidateWords(sentence) {
    const words = sentence.match(/\b[a-zA-Z][a-zA-Z-]{4,}\b/g) || [];

    return words
      .map((word) => word.toLowerCase())
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .filter((word) => !banned.has(word))
      .filter((word) => {
        const position = sentence.toLowerCase().indexOf(word);
        const ratio = position / Math.max(sentence.length, 1);
        return ratio > 0.18 && ratio < 0.82;
      })
      .sort((a, b) => {
        const aPriority = priorityWords.includes(a) ? 1 : 0;
        const bPriority = priorityWords.includes(b) ? 1 : 0;
        return bPriority - aPriority;
      });
  }

  const chosen = [];
  const usedWords = new Set();

  for (const sentence of sentences) {
    if (chosen.length >= 3) break;

    const candidates = getCandidateWords(sentence);
    const word = candidates.find((candidate) => !usedWords.has(candidate));

    if (!word) continue;

    chosen.push({
      sentence,
      answer: word
    });

    usedWords.add(word);
  }

  const fallbackSentences = splitSentences(reading).slice(0, 3);

  while (chosen.length < 3 && fallbackSentences[chosen.length]) {
    const sentence = fallbackSentences[chosen.length];
    const candidates = getCandidateWords(sentence);
    const word = candidates.find((candidate) => !usedWords.has(candidate));

    if (word) {
      chosen.push({
        sentence,
        answer: word
      });
      usedWords.add(word);
    } else {
      break;
    }
  }

  const summarySentences = chosen.map((item) =>
    item.sentence.replace(
      new RegExp(`\\b${item.answer}\\b`, "i"),
      `(${item.answer})`
    )
  );

  const allCandidateWords = sentences
    .flatMap(getCandidateWords)
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .filter((word) => !usedWords.has(word));

  const fallbackOptions = [
    "policy",
    "market",
    "public",
    "change",
    "pressure",
    "decision",
    "growth",
    "system",
    "future"
  ];

  const summaryQuiz = chosen.map((item, index) => {
    const distractors = allCandidateWords
      .filter((word) => word !== item.answer)
      .slice(index * 3, index * 3 + 3);

    const options = [item.answer, ...distractors].slice(0, 4);

    for (const fallback of fallbackOptions) {
      if (options.length >= 4) break;
      if (!options.includes(fallback) && fallback !== item.answer) {
        options.push(fallback);
      }
    }

    return {
      blank: index + 1,
      answer: item.answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return {
    text: summarySentences.join(" "),
    quiz: summaryQuiz
  };
}

function shuffleOptions(options, correctText) {
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return {
    options: shuffled,
    answer: shuffled.indexOf(correctText)
  };
}

function makeQuestion(q, correctText, wrongOptions) {
  const allOptions = [correctText, ...wrongOptions].slice(0, 4);
  const result = shuffleOptions(allOptions, correctText);
  return {
    q,
    options: result.options,
    answer: result.answer
  };
}

function buildQuiz(topic) {
  if (topic.key === "economy") {
    return [
      makeQuestion(
        "What is the main idea of today’s reading?",
        "Interest rates, inflation, and market expectations are connected.",
        [
          "Movie reviews can influence central-bank policy.",
          "Weather patterns are the main cause of market movement.",
          "Consumers no longer respond to changes in prices."
        ]
      ),
      makeQuestion(
        "Why do rate expectations matter before an official decision is made?",
        "Markets often react to what investors believe will happen next.",
        [
          "Interest rates only matter after they disappear.",
          "Consumers stop spending whenever markets open.",
          "Central banks do not influence borrowing costs."
        ]
      ),
      makeQuestion(
        "According to the reading, why can strong economic data sometimes worry investors?",
        "It may suggest that inflation pressure could continue.",
        [
          "It proves that prices are already falling everywhere.",
          "It means borrowing costs no longer matter.",
          "It always guarantees immediate rate cuts."
        ]
      ),
      makeQuestion(
        "What can be inferred about inflation from the passage?",
        "Even slower inflation can still leave consumers feeling pressure.",
        [
          "Inflation affects only professional investors.",
          "Lower inflation always means all prices return to old levels.",
          "Inflation has no connection to daily life."
        ]
      ),
      makeQuestion(
        "How is the reading organized?",
        "It explains one economic issue through causes, effects, and expectations.",
        [
          "It lists unrelated entertainment headlines.",
          "It gives only definitions without examples.",
          "It tells a fictional story about investors."
        ]
      )
    ];
  }

  return [
    makeQuestion(
      "What is the main idea of today’s reading?",
      "It explains one central issue in a structured way.",
      [
        "It describes a fictional story.",
        "It focuses only on vocabulary.",
        "It discusses unrelated topics."
      ]
    ),
    makeQuestion(
      "What is the central issue discussed?",
      "A key topic that affects decisions and expectations.",
      [
        "A random event with no impact.",
        "Only entertainment news.",
        "A personal diary."
      ]
    ),
    makeQuestion(
      "Why is the topic important?",
      "It influences real-world behavior and decisions.",
      [
        "It has no effect on daily life.",
        "It is only theoretical.",
        "It is unrelated to society."
      ]
    ),
    makeQuestion(
      "What can be inferred from the passage?",
      "The situation may continue to develop over time.",
      [
        "The issue has already ended completely.",
        "Nothing will change in the future.",
        "The topic is not important."
      ]
    ),
    makeQuestion(
      "How is the passage structured?",
      "It develops one idea step by step.",
      [
        "It lists unrelated facts.",
        "It tells a fictional story.",
        "It avoids explanation."
      ]
    )
  ];
}

async function fetchNewsItems() {
  const feed = await parser.parseURL(FEEDS.top);

  return (feed.items || []).slice(0, 5).map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }));
}

async function build() {
  const topic = getTodayTopic();
  const reading = buildReadingFromTopic(topic);
  const summaryData = buildSummaryData(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: `${topic.label} Reading`,
    reading,
    quiz: buildQuiz(topic),
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    sentences: buildBackTranslationSentences(reading),
    newsItems: await fetchNewsItems()
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("✅ DONE");
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
