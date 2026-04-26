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

async function fetchNews() {
  try {
    const feed = await parser.parseURL(FEEDS.top);
    return (feed.items || []).slice(0, 5);
  } catch {
    return [];
  }
}

/**
 * 뉴스 기반 리딩 생성 (자연스럽게 연결)
 */
function buildReading(topic, newsItems) {
  const titles = newsItems.map((n) => n.title).filter(Boolean);

  const intro = `${topic.label} is the focus of today’s reading. Recent headlines highlight several developments, including ${titles
    .slice(0, 2)
    .join(" and ")}. These events reflect broader trends rather than isolated cases.`;

  const body1 = `These developments are connected through underlying structural factors. Changes in policy, shifting expectations, and external pressures all influence how situations evolve over time. Rather than viewing each headline separately, it is more useful to understand how they interact within a larger system.`;

  const body2 = `Another important aspect is how people and institutions respond. Governments, organizations, and individuals all adjust their behavior based on new information. This creates feedback loops where decisions influence outcomes, and outcomes influence future decisions.`;

  const body3 = `At the same time, uncertainty remains a key challenge. Even when data appears clear, interpretations can differ. This is why similar events may lead to different reactions across regions and markets. Expectations often matter as much as actual conditions.`;

  const conclusion = `Overall, these developments suggest that ${topic.label.toLowerCase()} issues should be understood as dynamic processes rather than fixed events. Careful analysis is needed to understand not only what is happening, but why it is happening and what may come next.`;

  return [intro, body1, body2, body3, conclusion].join("\n\n");
}

/**
 * 요약 (빈칸 3개)
 */
function buildSummary(reading) {
  const sentences = reading.split(". ").slice(0, 3);

  const keyWords = [];

  sentences.forEach((s) => {
    const words = s.match(/\b[a-zA-Z]{6,}\b/g) || [];
    if (words.length) keyWords.push(words[0].toLowerCase());
  });

  const blanks = keyWords.slice(0, 3);

  let summaryText = sentences.join(". ");

  blanks.forEach((word) => {
    summaryText = summaryText.replace(
      new RegExp(`\\b${word}\\b`, "i"),
      `(____)`
    );
  });

  const summaryQuiz = blanks.map((answer, i) => {
    const options = [answer];

    const pool = [
      "policy",
      "market",
      "system",
      "pressure",
      "change",
      "decision"
    ];

    while (options.length < 4) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (!options.includes(pick)) options.push(pick);
    }

    return {
      blank: i + 1,
      answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return { text: summaryText, quiz: summaryQuiz };
}

/**
 * 퀴즈 (리딩 기반)
 */
function buildQuiz(topic) {
  return [
    {
      q: "What is the main idea of the reading?",
      options: [
        `${topic.label} developments are interconnected.`,
        "A fictional story.",
        "A grammar lesson.",
        "A personal diary."
      ],
      answer: 0
    },
    {
      q: "How should the events be understood?",
      options: [
        "As part of a larger system.",
        "As isolated events.",
        "As unrelated stories.",
        "As random changes."
      ],
      answer: 0
    },
    {
      q: "What affects decisions in the passage?",
      options: [
        "Expectations and reactions.",
        "Only past data.",
        "Random factors.",
        "Irrelevant opinions."
      ],
      answer: 0
    },
    {
      q: "Why is uncertainty important?",
      options: [
        "Because interpretations differ.",
        "Because nothing changes.",
        "Because data is always wrong.",
        "Because events are fixed."
      ],
      answer: 0
    },
    {
      q: "What is the purpose of the reading?",
      options: [
        "To explain real-world developments.",
        "To entertain readers.",
        "To teach vocabulary only.",
        "To describe fiction."
      ],
      answer: 0
    }
  ];
}

async function build() {
  const topic = getTodayTopic();
  const newsItems = await fetchNews();
  const reading = buildReading(topic, newsItems);
  const summary = buildSummary(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: `${topic.label} Reading`,
    reading,
    quiz: buildQuiz(topic),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");

  console.log("✅ DONE:", topic.label);
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
