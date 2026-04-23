const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser();

const FEEDS = {
  top: "https://apnews.com/hub/apf-topnews?format=rss&p=4"
};

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

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildReadingFromItems(items) {
  const intro =
    "Today’s reading is based on several major international headlines. " +
    "Instead of focusing on only one event, this passage connects key developments " +
    "to help readers understand the broader global context.";

  const body = items
    .map((item, index) => {
      const title = cleanText(item.title || "");
      const summary = cleanText(
        item.contentSnippet || item.content || item.summary || ""
      );

      return (
        `Story ${index + 1}: ${title}. ` +
        (summary ? `${summary}. ` : "") +
        "This story matters because it reflects how political, economic, scientific, " +
        "or social events can quickly influence people across countries."
      );
    })
    .join("\n\n");

  const closing =
    "Taken together, these developments show that the modern world is highly interconnected. " +
    "For English learners, following real news is useful because it builds vocabulary, " +
    "background knowledge, and the ability to understand issues in context.";

  const sources = items
    .map((item, i) => `${i + 1}. ${item.link}`)
    .join("\n");

  return `${intro}\n\n${body}\n\n${closing}\n\n[Sources]\n${sources}`;
}

function pickBackTranslationSentences(reading) {
  const rawSentences = splitSentences(reading).filter(
    (s) => s.length > 50 && !s.startsWith("[Sources]") && !/^https?:\/\//.test(s)
  );

  const selected = [rawSentences[1], rawSentences[3], rawSentences[5]]
    .filter(Boolean)
    .slice(0, 3);

  const koreanPrompts = [
    "오늘의 리딩은 여러 국제 뉴스 핵심 이슈를 바탕으로 구성되어 있다.",
    "이 뉴스는 한 국가를 넘어 많은 사람들에게 영향을 줄 수 있다.",
    "실제 뉴스를 읽는 것은 어휘와 배경지식을 함께 키우는 데 도움이 된다."
  ];

  return selected.map((english, i) => ({
    id: i + 1,
    korean: koreanPrompts[i] || "다음 문장을 영어로 바꿔 보세요.",
    english
  }));
}

function buildQuiz(items) {
  const firstTitle = cleanText(items[0]?.title || "the main headline");

  return [
    {
      q: "What is the main purpose of today’s passage?",
      options: [
        "To describe a fictional event",
        "To connect several real news stories",
        "To teach grammar only",
        "To advertise a media company"
      ],
      answer: 1
    },
    {
      q: "According to the passage, why do these stories matter?",
      options: [
        "They only affect one city",
        "They are useful only for scientists",
        "They can influence people across countries",
        "They are mainly for entertainment"
      ],
      answer: 2
    },
    {
      q: "Which headline appeared in today’s reading?",
      options: [
        firstTitle,
        "A local school sports festival",
        "A restaurant review from a travel blog",
        "A fictional novel release"
      ],
      answer: 0
    },
    {
      q: "What benefit of reading real news is mentioned in the passage?",
      options: [
        "It removes the need to study vocabulary",
        "It builds vocabulary and background knowledge",
        "It guarantees perfect pronunciation",
        "It replaces all other English practice"
      ],
      answer: 1
    },
    {
      q: "Which word best describes the world in the passage?",
      options: ["Isolated", "Interconnected", "Predictable", "Static"],
      answer: 1
    }
  ];
}

function buildSummary() {
  return (
    "Today’s passage shows how major events across the world are increasingly " +
    "(interconnected). By reading real news, learners can improve their " +
    "(vocabulary), deepen their understanding of global (issues), and follow " +
    "important changes in a broader (context)."
  );
}

async function fetchNewsItems() {
  const feed = await parser.parseURL(FEEDS.top);

  const items = (feed.items || [])
    .slice(0, 5)
    .map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
      contentSnippet: item.contentSnippet || item.content || ""
    }))
    .filter((item) => item.title && item.link);

  if (!items.length) {
    throw new Error("RSS items not found.");
  }

  return items;
}

async function build() {
  const items = await fetchNewsItems();
  const reading = buildReadingFromItems(items);
  const sentences = pickBackTranslationSentences(reading);
  const quiz = buildQuiz(items);
  const summary = buildSummary();

  const data = {
    date: new Date().toISOString(),
    source: "AP Top News RSS",
    headline: cleanText(items[0].title),
    reading,
    quiz,
    summary,
    sentences,
    newsItems: items.map((item) => ({
      title: cleanText(item.title),
      link: item.link,
      pubDate: item.pubDate
    }))
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");
  console.log("todayReading.json updated");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
