import fs from "fs";

const today = new Date().toISOString().slice(0, 10);

// 🔹 샘플 뉴스 3개 (나중에 자동화 가능)
const items = [
  {
    title: "UK economy shows signs of slowing growth",
    content:
      "Recent data suggests that the UK economy is beginning to slow after a period of rapid recovery. Experts point to rising interest rates and global uncertainty as key factors affecting growth."
  },
  {
    title: "AI companies race to develop next-generation models",
    content:
      "Major technology firms are investing heavily in artificial intelligence, aiming to build more advanced and efficient models. Competition is intensifying across the industry."
  },
  {
    title: "Global climate talks highlight urgent need for action",
    content:
      "World leaders gathered to discuss climate change emphasized the importance of immediate action. New agreements aim to reduce emissions and increase cooperation."
  }
];

// 🔹 본문 생성
const intro =
  "Today’s reading brings together several major developments from recent international headlines. Instead of treating each story as isolated, it encourages the reader to understand how events are connected within a broader global context and why these connections matter.";

const body = items
  .map(
    (item, i) =>
      `${i === 0 ? "First" : i === 1 ? "Second" : "Third"}, ${item.content} This development is important because it reflects larger trends that influence global society, economics, and political decisions.`
  )
  .join(" ");

const conclusion =
  "Taken together, these developments show that today’s world is highly interconnected. Readers benefit not only from understanding individual events but also from recognizing how different issues influence one another across regions and sectors.";

const passage = `${intro} ${body} ${conclusion}`;

// 🔹 문장 분리
const allSentenceTexts = passage
  .split(". ")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.endsWith(".") ? s : s + "."));

const allSentences = allSentenceTexts.map((text, i) => ({
  id: i + 1,
  text,
  literal: ""
}));
// 🔹 중심 문장 3개
const sentencePractice = [
  allSentenceTexts[0],
  allSentenceTexts[Math.floor(allSentenceTexts.length / 2)],
  allSentenceTexts[allSentenceTexts.length - 1],
].map((s, i) => ({
  id: i + 1,
  text: s,
  literal: "직역 준비 중입니다."
}));

// 🔹 제목
const title = "Today's Global News Briefing";

// 🔹 제목 직역
function makeTitleLiteral(title) {
  return "오늘의 글로벌 뉴스 브리핑";
}

// 🔹 결과 객체
const result = {
  date: today,
  category: "Daily News",
  title,
  titleLiteral: makeTitleLiteral(title),
  source: "BBC RSS",
  passage,
  allSentences,
  sentencePractice,

  modelSummary: `This reading synthesizes multiple recent developments and underscores the necessity of interpreting contemporary events within an integrated global framework, illustrating how interconnected dynamics across political, economic, and social domains collectively shape broader systemic trends.`,

  // App 호환용
  sentences: allSentences,

  questions: [
    {
      id: 1,
      question: "What is the main purpose of this passage?",
      options: [
        "To describe one specific news event in detail",
        "To explain how different news events are connected",
        "To criticize media coverage of global issues",
        "To compare political systems across countries"
      ],
      answer: 1
    },
    {
      id: 2,
      question: "What does the passage suggest about news stories?",
      options: [
        "They should be read separately",
        "They are mostly unrelated",
        "They reflect broader global trends",
        "They are difficult to understand"
      ],
      answer: 2
    },
    {
      id: 3,
      question: "Why is it important to connect different events?",
      options: [
        "To make reading faster",
        "To improve memory",
        "To understand deeper meanings",
        "To avoid confusion"
      ],
      answer: 2
    },
    {
      id: 4,
      question: "What does 'broader context' refer to?",
      options: [
        "Looking at events in isolation",
        "Understanding wider relationships",
        "Reading more articles",
        "Focusing on details"
      ],
      answer: 1
    },
    {
      id: 5,
      question: "What is the overall message of the passage?",
      options: [
        "News is often misleading",
        "Global events are interconnected",
        "Politics is the most important topic",
        "Readers should avoid complex topics"
      ],
      answer: 1
    }
  ]
};

// 🔹 파일 저장
fs.writeFileSync("src/todayReading.json", JSON.stringify(result, null, 2));

console.log("✅ todayReading.json 생성 완료");
