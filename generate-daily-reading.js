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
    subtopics: [
      {
        key: "rates",
        headline: "Economy: Interest Rates and Borrowing Costs",
        reading: [
          "Interest rates are the focus of today’s reading. They matter because they influence the cost of borrowing for households, companies, and governments. When rates rise, loans become more expensive, and people may delay buying homes, cars, or other major items. Businesses may also slow investment because expansion becomes more costly.",
          "The central issue is how long rates may stay high. If inflation remains above target, central banks may decide that lowering rates too quickly would be risky. This creates uncertainty for markets because investors try to guess the timing of future policy changes before official decisions are announced.",
          "Higher rates can slow economic activity, but they can also help reduce inflation over time. This creates a difficult balance. Policymakers want to control prices without damaging growth too much. Consumers, meanwhile, may feel pressure from both high prices and expensive credit.",
          "Markets react strongly to any sign that rate policy may change. A single jobs report, inflation report, or central-bank speech can shift expectations. This is why interest rates are not just a technical policy tool; they shape confidence across the economy.",
          "This suggests that borrowing costs will remain a key signal for understanding the economy in the near term."
        ].join("\n\n")
      },
      {
        key: "inflation",
        headline: "Economy: Inflation and Daily Prices",
        reading: [
          "Inflation is the focus of today’s reading. It matters because it affects everyday life directly. When prices rise, people notice it in groceries, rent, transportation, utilities, and other regular expenses. Even when inflation slows, prices may still remain much higher than they were before.",
          "The central issue is the difference between slower inflation and lower prices. A lower inflation rate means prices are rising more slowly, not necessarily falling. This can create frustration because official data may show improvement while consumers still feel pressure in their daily budgets.",
          "Inflation also affects how people make decisions. Families may delay purchases, reduce spending, or look for cheaper alternatives. Businesses may raise prices to cover higher costs, but they also risk losing customers if prices rise too much.",
          "Central banks watch inflation closely because it influences interest-rate decisions. If inflation remains persistent, policymakers may keep rates high. If inflation cools clearly, they may have more room to lower rates. This connection makes inflation one of the most important signals in the economy.",
          "This suggests that the public may judge economic improvement not only by official data, but by the prices they experience every day."
        ].join("\n\n")
      },
      {
        key: "markets",
        headline: "Economy: Markets and Investor Expectations",
        reading: [
          "Market expectations are the focus of today’s reading. Financial markets often move before official decisions are made because investors try to predict what will happen next. Stocks, bonds, and currencies can all react to expectations about inflation, interest rates, growth, and central-bank policy.",
          "The central issue is that markets do not simply respond to current facts. They respond to changing expectations. A strong economic report may look positive, but investors may worry that it will keep inflation pressure high. A weaker report may raise concerns about growth, but it can also increase hopes for future rate cuts.",
          "This is why market reactions can seem confusing. Good news can sometimes push markets down, while bad news can sometimes support them. The reaction depends on what investors believe the data means for future policy and economic conditions.",
          "Expectations can also change quickly. A speech from a central banker, a surprise inflation number, or a shift in employment data can alter the mood of the market. This makes financial markets sensitive to both information and interpretation.",
          "This suggests that investors are not only watching what is happening now, but also trying to price the next stage of the economy."
        ].join("\n\n")
      },
      {
        key: "consumers",
        headline: "Economy: Consumer Spending and Household Pressure",
        reading: [
          "Consumer spending is the focus of today’s reading. It matters because household activity is a major part of the economy. When people spend confidently, businesses can grow, hire, and invest. When consumers pull back, companies may become more cautious.",
          "The central issue is whether households can continue spending while facing high prices and borrowing costs. Many consumers still need to pay for food, housing, transportation, and healthcare. If wages do not rise fast enough, families may feel squeezed even when the broader economy appears stable.",
          "Credit conditions also matter. Higher interest rates make credit cards, car loans, and mortgages more expensive. This can limit how much people are willing or able to borrow. Over time, weaker borrowing can reduce demand and slow economic growth.",
          "Businesses watch consumer behavior carefully. If shoppers become more selective, companies may adjust prices, reduce inventory, or change hiring plans. This means household pressure can eventually affect the wider economy.",
          "This suggests that consumer behavior will remain one of the clearest signs of whether the economy is strong or under strain."
        ].join("\n\n")
      }
    ]
  },
  {
    key: "society",
    label: "Society",
    subtopics: [
      {
        key: "trust",
        headline: "Society: Public Trust and Institutions",
        reading: [
          "Public trust is the focus of today’s reading. Trust matters because institutions depend on public confidence to function effectively. Governments, courts, schools, hospitals, and public agencies all need people to believe that decisions are fair, clear, and responsible.",
          "The central issue is how institutions respond when pressure rises. If decisions are explained clearly, people may accept them even when they disagree. If decisions appear confusing, delayed, or unequal, public frustration can grow quickly.",
          "Trust is not built only through final outcomes. It is also shaped by the process. People want to know why a decision was made, who was affected, and whether leaders listened to public concerns.",
          "Social issues often become emotional because they are connected to daily life. Housing, education, safety, healthcare, and justice affect families directly. When people feel ignored, they may lose confidence in the system.",
          "This suggests that public trust depends not only on what institutions decide, but on how clearly and fairly they explain their decisions."
        ].join("\n\n")
      },
      {
        key: "policy",
        headline: "Society: Policy Decisions and Daily Life",
        reading: [
          "Policy decisions are the focus of today’s reading. Laws, rules, and public programs can shape daily life in ways that are not always visible at first. A decision made by a court, agency, or legislature can affect families, schools, workers, and local communities.",
          "The central issue is that policy often creates both benefits and trade-offs. A rule may solve one problem while creating pressure in another area. This is why public debate continues even after a decision is announced.",
          "People often judge policy through personal experience. A housing rule may be discussed in technical language, but families experience it through rent, location, and security. An education policy may be debated nationally, but students and teachers feel it locally.",
          "Good policy communication matters. If people understand the purpose of a decision, they are more likely to evaluate it carefully. If the explanation is weak, even a reasonable policy can face resistance.",
          "This suggests that policy becomes most important when it moves from official language into everyday life."
        ].join("\n\n")
      }
    ]
  },
  {
    key: "science",
    label: "Science and Technology",
    subtopics: [
      {
        key: "ai",
        headline: "Science and Technology: Artificial Intelligence and Daily Work",
        reading: [
          "Artificial intelligence is the focus of today’s reading. AI matters because it is moving from specialized technology into everyday work, education, communication, and decision-making. Tools that once seemed experimental are now being used by students, workers, companies, and public institutions.",
          "The central issue is how quickly people can adapt. AI can help with writing, translation, coding, research, and data analysis. At the same time, it raises questions about accuracy, privacy, jobs, and responsibility.",
          "One challenge is trust. People need to understand when AI is useful and when it may be wrong. A tool that produces fluent language can still make mistakes, so users must learn to check information carefully.",
          "AI also changes the meaning of skill. Some routine tasks may become easier, while judgment, questioning, and editing become more important. This means education and workplaces may need to adjust how they define competence.",
          "This suggests that the impact of AI will depend not only on the technology itself, but on how wisely people learn to use it."
        ].join("\n\n")
      },
      {
        key: "health",
        headline: "Science and Technology: Medical Research and Public Understanding",
        reading: [
          "Medical research is the focus of today’s reading. New studies can create hope, especially when they involve serious diseases, treatments, or public health challenges. However, scientific progress usually happens step by step rather than all at once.",
          "The central issue is the gap between a promising result and a proven solution. A headline may sound dramatic, but researchers often need more testing, more data, and more time before a treatment can be widely used.",
          "Public understanding is important because health news affects personal decisions. People may change behavior based on what they read, so clear communication is essential. Overstatement can create false hope, while poor explanation can create fear.",
          "Regulation also plays a major role. Medical tools, drugs, and treatments must be tested for safety and effectiveness. This process can feel slow, but it is designed to protect the public.",
          "This suggests that medical progress depends on both scientific discovery and careful public communication."
        ].join("\n\n")
      }
    ]
  },
  {
    key: "world",
    label: "World Issues",
    subtopics: [
      {
        key: "diplomacy",
        headline: "World Issues: Diplomacy and International Pressure",
        reading: [
          "Diplomacy is the focus of today’s reading. International problems often appear suddenly, but they usually develop through a longer chain of decisions, tensions, and reactions. Governments must respond while considering security, public opinion, alliances, and economic interests.",
          "The central issue is how leaders manage pressure without making the situation worse. A strong response may satisfy one audience but alarm another. A cautious response may reduce risk but appear weak to critics.",
          "Diplomacy creates space for communication. Talks, statements, ceasefire proposals, sanctions, and aid packages may not solve a problem immediately, but they can shape the choices available to governments.",
          "International issues also affect ordinary people. Conflict can influence migration, energy prices, food supplies, and public safety. Even people far from the original event may feel the consequences.",
          "This suggests that diplomacy matters most when political pressure rises faster than trust can be rebuilt."
        ].join("\n\n")
      },
      {
        key: "security",
        headline: "World Issues: Security Risks and Global Stability",
        reading: [
          "Global security is the focus of today’s reading. Security issues are rarely limited to one country because alliances, trade, migration, and communication connect governments and societies. A local conflict can quickly become an international concern.",
          "The central issue is how uncertainty spreads. When governments do not know what rivals or partners will do next, they may prepare for worst-case scenarios. This can increase tension even when no side wants a larger crisis.",
          "Alliances play an important role in moments of pressure. Countries often act based on how they expect partners and rivals to respond. This means credibility, trust, and communication can become as important as military strength.",
          "Security risks can also affect the economy. Energy routes, shipping lanes, investment decisions, and supply chains may change when tension rises. As a result, global security can influence prices and business confidence.",
          "This suggests that stability depends on reducing uncertainty before it turns into wider confrontation."
        ].join("\n\n")
      }
    ]
  }
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

function getTestSubtopic(topic) {
  const runNumber = Math.floor(Date.now() / (1000 * 60));
  return topic.subtopics[runNumber % topic.subtopics.length];
}

function buildReadingFromTopic(topic, subtopic) {
  return subtopic.reading;
}

function buildSummaryData(reading) {
  const sentences = splitSentences(reading).filter((sentence) => {
    const words = sentence.split(/\s+/);
    return words.length >= 8 && words.length <= 28;
  });

  const banned = new Set([
    "today", "reading", "focus", "these", "those", "this", "that",
    "because", "which", "their", "people", "about", "often", "other",
    "when", "where", "while", "with", "from", "into", "there",
    "have", "will", "would", "could", "should", "also", "more",
    "only", "some", "many", "important", "especially", "directly",
    "quickly", "closely", "enough", "future", "central", "issue",
    "main", "point", "points", "paragraph", "article"
  ]);

  function getWords(sentence) {
    return (
      sentence
        .toLowerCase()
        .match(/\b[a-z][a-z-]{4,}\b/g) || []
    ).filter((word) => !banned.has(word));
  }

  const frequency = new Map();

  for (const sentence of sentences) {
    for (const word of getWords(sentence)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }

  function scoreWord(word, sentence) {
    const freq = frequency.get(word) || 1;
    const position = sentence.toLowerCase().indexOf(word);
    const ratio = position / Math.max(sentence.length, 1);

    let score = 0;
    score += freq * 3;
    score += Math.min(word.length, 12);

    if (ratio > 0.2 && ratio < 0.8) score += 5;
    if (word.endsWith("tion") || word.endsWith("ment") || word.endsWith("ity")) {
      score += 3;
    }

    return score;
  }

  const selected = [];
  const usedWords = new Set();
  const usedSentenceIndexes = new Set();

  for (let i = 0; i < sentences.length; i++) {
    if (selected.length >= 3) break;
    if (usedSentenceIndexes.has(i)) continue;

    const sentence = sentences[i];
    const candidates = getWords(sentence)
      .filter((word) => !usedWords.has(word))
      .map((word) => ({
        word,
        score: scoreWord(word, sentence)
      }))
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) continue;

    selected.push({
      sentence,
      answer: candidates[0].word
    });

    usedWords.add(candidates[0].word);
    usedSentenceIndexes.add(i);
  }

  const summarySentences = selected.map((item) =>
    item.sentence.replace(
      new RegExp(`\\b${item.answer}\\b`, "i"),
      `(${item.answer})`
    )
  );

  const allWords = [...frequency.keys()].filter(
    (word) => !usedWords.has(word)
  );

  const summaryQuiz = selected.map((item, index) => {
    const distractors = allWords
      .filter((word) => word !== item.answer)
      .sort((a, b) => (frequency.get(b) || 0) - (frequency.get(a) || 0))
      .slice(index * 3, index * 3 + 3);

    const options = [item.answer, ...distractors].slice(0, 4);

    while (options.length < 4) {
      const fallback = ["change", "pressure", "decision", "system", "growth"];
      const next = fallback.find(
        (word) => !options.includes(word) && word !== item.answer
      );
      options.push(next || `choice${options.length + 1}`);
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

function buildQuiz(topic, subtopic) {
  return [
    makeQuestion(
      "What is the main idea of today’s reading?",
      `${subtopic.headline} is the central topic.`,
      [
        "The passage mainly discusses a fictional personal story.",
        "The passage focuses only on grammar rules.",
        "The passage presents unrelated entertainment news."
      ]
    ),
    makeQuestion(
      "How is the reading organized?",
      "It develops one issue across several connected paragraphs.",
      [
        "It lists unrelated facts without explanation.",
        "It gives only vocabulary definitions.",
        "It tells a fictional dialogue."
      ]
    ),
    makeQuestion(
      "What should readers follow while reading?",
      "How the central issue develops and affects decisions.",
      [
        "Only the first word of each paragraph.",
        "A list of unrelated names.",
        "The order of random headlines."
      ]
    ),
    makeQuestion(
      "What kind of reading is this?",
      "A news-style reading focused on one topic.",
      [
        "A recipe.",
        "A poem.",
        "A travel diary."
      ]
    ),
    makeQuestion(
      "Where does the final analysis appear?",
      "At the end of the reading.",
      [
        "Only in the title.",
        "In a separate translation section.",
        "It does not appear anywhere."
      ]
    )
  ];
}

async function fetchNewsItems() {
  try {
    const feed = await parser.parseURL(FEEDS.top);

    return (feed.items || []).slice(0, 5).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate
    }));
  } catch {
    return [];
  }
}

async function build() {
  const topic = getTodayTopic();
  const subtopic = getTestSubtopic(topic);
  const reading = buildReadingFromTopic(topic, subtopic);
  const summaryData = buildSummaryData(reading);

  const data = {
    date: new Date().toISOString(),
    category: topic.key,
    categoryLabel: topic.label,
    subtopic: subtopic.key,
    headline: subtopic.headline,
    reading,
    quiz: buildQuiz(topic, subtopic),
    summary: summaryData.text,
    summaryQuiz: summaryData.quiz,
    newsItems: await fetchNewsItems()
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ DONE: ${subtopic.headline}`);
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
