const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const FEEDS = {
  top: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

/**
 * 하루 단위로 주제만 바뀜
 */
const TOPICS = [
  {
    key: "economy",
    label: "Economy",
    headline: "Economy: Interest Rates, Inflation, and Market Expectations",
    reading: [
      "Interest rates, inflation, and market expectations form the core of today’s reading. These three elements are closely connected and influence each other continuously. When central banks adjust interest rates, they change borrowing costs across the economy. This affects how individuals spend, how businesses invest, and how markets respond.",
      "Inflation plays a central role because it directly affects purchasing power. When inflation rises, people feel pressure through higher prices in daily life. Even if wages increase, they may not keep up with rising costs. As a result, households may reduce spending or delay major financial decisions.",
      "Markets do not react only to current conditions. They respond strongly to expectations about the future. Investors try to predict what central banks will do next, especially regarding interest rates. A small signal from economic data can shift these expectations quickly, leading to movements in stock and bond markets.",
      "This interaction creates uncertainty. Strong economic data may suggest growth, but it can also raise concerns that interest rates will remain high. Weak data may suggest slowing growth, but it can increase hopes that rates will fall. Because of this, markets often react in complex ways that do not always match simple interpretations.",
      "Overall, understanding the relationship between interest rates, inflation, and expectations is essential. These factors shape financial decisions, market behavior, and the broader direction of the economy."
    ].join("\n\n")
  },
  {
    key: "society",
    label: "Society",
    headline: "Society: Public Trust and Institutional Decisions",
    reading: [
      "Public trust is the focus of today’s reading. Trust is essential for institutions such as governments, courts, and public agencies to function effectively. When people believe decisions are fair and transparent, they are more likely to accept outcomes even if they disagree.",
      "However, trust can weaken when decisions are unclear or appear inconsistent. In such cases, people may question whether institutions are acting responsibly. This can lead to broader social tension and reduce cooperation between the public and decision-makers.",
      "The process of decision-making is just as important as the outcome. When institutions explain their reasoning clearly, they can maintain credibility. Without clear communication, even reasonable policies may face strong resistance.",
      "Social issues often become more intense because they affect everyday life. Topics such as housing, education, and public safety are not abstract. They directly influence how people live, which is why responses to these issues can be emotional and immediate.",
      "In the end, trust depends on both fairness and communication. Institutions must not only make decisions but also ensure that those decisions are understood and accepted by the public."
    ].join("\n\n")
  },
  {
    key: "science",
    label: "Science",
    headline: "Science: Artificial Intelligence and Changing Work",
    reading: [
      "Artificial intelligence is the focus of today’s reading. AI is rapidly becoming part of everyday life, influencing how people work, learn, and communicate. Tasks that once required significant time and effort can now be completed more quickly with AI tools.",
      "This shift creates both opportunities and challenges. On one hand, AI can increase efficiency and support productivity. On the other hand, it raises concerns about job security and the reliability of automated systems.",
      "One important issue is trust. AI systems can produce fluent and convincing outputs, but they are not always accurate. Users must learn to evaluate information carefully rather than relying entirely on automated results.",
      "Another key change is how skills are valued. Routine tasks may become less important, while critical thinking and decision-making become more valuable. This means education systems and workplaces may need to adapt to new expectations.",
      "Overall, AI is not just a technological development. It is a shift that changes how people interact with information and make decisions in their daily lives."
    ].join("\n\n")
  },
  {
    key: "world",
    label: "World Issues",
    headline: "World Issues: Diplomacy and Global Pressure",
    reading: [
      "Diplomacy is the focus of today’s reading. International issues rarely develop suddenly. Instead, they emerge through a series of decisions, reactions, and rising tensions between countries.",
      "Leaders must respond carefully because each action can influence multiple audiences. A strong response may satisfy domestic expectations but increase tension internationally. A cautious approach may reduce conflict but appear weak to critics.",
      "Diplomacy creates space for communication. Even when disagreements are serious, dialogue allows countries to manage risk and avoid escalation. This process may be slow, but it is often necessary for stability.",
      "Global issues also affect everyday life. Changes in international relations can influence energy prices, trade, and public safety. This means that distant events can have local consequences.",
      "In the end, diplomacy is about balancing pressure and communication. It plays a key role in maintaining stability in a connected world."
    ].join("\n\n")
  }
];

/**
 * 날짜 기준으로 하루 1개 주제
 */
function getTodayTopic() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPICS[dayNumber % TOPICS.length];
}

/**
 * 간단한 퀴즈 (리딩 기반)
 */
function buildQuiz(topic) {
  return [
    {
      q: "What is the main idea of the reading?",
      options: [
        topic.headline,
        "A personal story about daily life.",
        "A fictional narrative.",
        "A list of unrelated facts."
      ],
      answer: 0
    },
    {
      q: "What should readers focus on?",
      options: [
        "The relationship between key ideas in the passage.",
        "Only the first sentence of each paragraph.",
        "Random vocabulary words.",
        "Irrelevant details."
      ],
      answer: 0
    },
    {
      q: "How is the passage structured?",
      options: [
        "One central topic developed across paragraphs.",
        "A series of unrelated topics.",
        "A dialogue between characters.",
        "A list of definitions."
      ],
      answer: 0
    },
    {
      q: "What is the tone of the passage?",
      options: [
        "Analytical and explanatory.",
        "Humorous and casual.",
        "Fictional and dramatic.",
        "Personal and emotional."
      ],
      answer: 0
    },
    {
      q: "What is the purpose of the reading?",
      options: [
        "To explain a real-world issue clearly.",
        "To entertain with a story.",
        "To teach grammar rules.",
        "To describe a fictional event."
      ],
      answer: 0
    }
  ];
}

/**
 * 요약 (자동 빈칸)
 */
function buildSummary(reading) {
  const sentences = reading.split(". ").slice(0, 3);

  return {
    text: sentences
      .map((s, i) =>
        i === 1 ? s.replace(/\b\w+\b/, "(____)") : s
      )
      .join(". "),
    quiz: [
      {
        blank: 1,
        answer: "key",
        options: ["key", "random", "irrelevant", "fictional"]
      }
    ]
  };
}

async function fetchNewsItems() {
  try {
    const feed = await parser.parseURL(FEEDS.top);
    return (feed.items || []).slice(0, 5);
  } catch {
    return [];
  }
}

async function build() {
  const topic = getTodayTopic();
  const summary = buildSummary(topic.reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    headline: topic.headline,
    reading: topic.reading,
    quiz: buildQuiz(topic),
    summary: summary.text,
    summaryQuiz: summary.quiz,
    newsItems: await fetchNewsItems()
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("✅ DONE:", topic.headline);
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
