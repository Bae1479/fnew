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
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text = "") {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function getTodayTopic() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPIC_ROTATION[dayNumber % TOPIC_ROTATION.length];
}

/* --------------------------
   🔥 핵심: 리딩 (완전 고정 구조)
-------------------------- */
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

/* --------------------------
   🔥 핵심: 리딩 기반 문장 자동 추출
-------------------------- */
function buildBackTranslationSentences(reading) {
  const sentences = splitSentences(reading);

  const filtered = sentences.filter(s =>
    s.length > 80 &&
    !s.toLowerCase().includes("this suggests")
  );

  const selected = [
    filtered[1],
    filtered[2],
    filtered[3]
  ].filter(Boolean);

  return selected.map((sentence, index) => ({
    id: index + 1,
    korean: "다음 문장을 영어로 써 보세요.",
    english: sentence
  }));
}

/* --------------------------
   요약
-------------------------- */
function buildSummaryData(reading) {
  const sentences = splitSentences(reading);
  let summary = sentences.slice(0, 4).join(" ");

  const words = summary.match(/[a-zA-Z]{5,}/g) || [];
  const unique = [...new Set(words.map(w => w.toLowerCase()))];

  const answers = unique.slice(0, 3);

  answers.forEach(word => {
    summary = summary.replace(new RegExp(word, "i"), `(${word})`);
  });

  return {
    text: summary,
    quiz: answers.map((a, i) => ({
      blank: i + 1,
      answer: a,
      options: [a, ...unique.slice(i + 1, i + 4)].sort(() => Math.random() - 0.5)
    }))
  };
}

/* --------------------------
   퀴즈 (이미 만든 버전 유지)
-------------------------- */
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

/* --------------------------
   뉴스 (참고용)
-------------------------- */
async function fetchNewsItems() {
  const feed = await parser.parseURL(FEEDS.top);

  return (feed.items || []).slice(0, 5).map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }));
}

/* --------------------------
   실행
-------------------------- */
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

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));
  console.log("✅ DONE");
}

build();
