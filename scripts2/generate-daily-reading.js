import fs from "fs";

// 👉 직역 함수 (파일 최상단에 1번만)
const literalMap = (text) => {
  return text
    .replace(/is/gi, "이다")
    .replace(/are/gi, "이다")
    .replace(/the/gi, "")
    .replace(/and/gi, "그리고")
    .replace(/of/gi, "의")
    .replace(/to/gi, "~에")
    .replace(/in/gi, "~에서");
};

// 👉 샘플 데이터 (여기 나중에 RSS로 바꿔도 됨)
const items = [
  "Talks are expected between the US and Iran in Islamabad.",
  "Global inflation continues to affect borrowing costs worldwide.",
  "AI investment is rapidly increasing across major economies."
];

// 👉 리딩 생성
const intro = "Today's reading brings together several major developments from recent international headlines.";

const body = items
  .map((text, i) => {
    const label = i === 0 ? "First" : i === 1 ? "Second" : "Third";

    const extras = [
      "This development is important because it may influence broader discussions.",
      "This situation reflects wider global trends across regions.",
      "It also shows how different events are interconnected."
    ];

    const extra = extras[i % extras.length];

    return `${label}, ${text} ${extra}`;
  })
  .join(" ");

const conclusion =
  "Overall, these stories show how global events are connected across politics, economics, and society.";

const passage = `${intro} ${body} ${conclusion}`;

// 👉 문장 분리
const allSentenceTexts = passage
  .split(". ")
  .map((s) => (s.endsWith(".") ? s : s + "."));

// 👉 핵심: 직역 포함
const allSentences = allSentenceTexts.map((text, i) => ({
  id: i + 1,
  text,
  literal: literalMap(text)
}));

// 👉 퀴즈 (5개)
const questions = [
  {
    id: 1,
    question: "What is the main purpose of this reading?",
    options: [
      "To describe one event",
      "To connect multiple global developments",
      "To explain only economics",
      "To criticize media"
    ],
    answer: 1
  },
  {
    id: 2,
    question: "What does the passage suggest about global events?",
    options: [
      "They are unrelated",
      "They are connected",
      "They are simple",
      "They are local only"
    ],
    answer: 1
  },
  {
    id: 3,
    question: "What is mentioned about inflation?",
    options: [
      "It disappeared",
      "It affects borrowing",
      "It is local only",
      "It has no impact"
    ],
    answer: 1
  },
  {
    id: 4,
    question: "What is happening with AI investment?",
    options: [
      "Decreasing",
      "Stable",
      "Increasing",
      "Ending"
    ],
    answer: 2
  },
  {
    id: 5,
    question: "What is the overall message?",
    options: [
      "Events are isolated",
      "Everything is random",
      "Events are interconnected",
      "Nothing matters"
    ],
    answer: 2
  }
];

// 👉 summary
const modelSummary =
  "This reading explains that global events are interconnected and influence each other across different areas.";

// 👉 결과
const result = {
  date: new Date().toISOString().slice(0, 10),
  title: "Global Developments Overview",
  passage,
  modelSummary,
  allSentences,
  questions
};

// 👉 저장
fs.writeFileSync(
  "src/todayReading.json",
  JSON.stringify(result, null, 2)
);

console.log("✅ Generated successfully");
