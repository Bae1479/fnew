import fs from "fs";

// 👉 리딩 본문 (완성형)
const passage = `
Today's reading brings together several major developments from recent international news, offering a broader view of how global events are interconnected. Rather than focusing on isolated headlines, it encourages readers to think about the underlying patterns that link politics, economics, and technology.

To begin with, talks are expected between the United States and Iran in Islamabad. These discussions are being closely watched because they could influence regional stability and diplomatic relations in the Middle East. If progress is made, it may reduce tensions and create new opportunities for cooperation. However, many uncertainties remain, and the outcome is still unclear.

Another important issue is the continued impact of global inflation. Rising prices have forced central banks around the world to adjust interest rates in an attempt to control economic pressure. These decisions affect not only large financial institutions but also ordinary consumers, influencing borrowing costs, housing markets, and overall spending behavior. As a result, many countries are now facing the challenge of balancing economic growth with financial stability.

In addition, investment in artificial intelligence is expanding rapidly across major economies. Companies are allocating significant resources to build data centers, develop advanced semiconductors, and secure the energy needed to support large-scale computing systems. While this surge in investment is driving innovation, it is also raising important questions about energy consumption and long-term sustainability.

These developments are not independent of one another. Diplomatic tensions can influence economic decisions, while technological advances can reshape both political strategies and financial markets. This interconnectedness means that understanding global events requires more than simply following individual stories.

Overall, the reading highlights the importance of looking beyond immediate headlines and developing a deeper awareness of global patterns. By doing so, readers can better understand not only what is happening in the world, but also why these events matter and how they may shape the future.
`;

// 👉 문장 분리
const allSentenceTexts = passage
  .split(". ")
  .map((s) => (s.endsWith(".") ? s : s + "."));

// 👉 결과 구조 (고정)
const result = {
  date: new Date().toISOString().slice(0, 10),
  title: "Global Developments Overview",
  passage,

  allSentences: allSentenceTexts.map((text, i) => ({
    id: i + 1,
    text,
    literal: "" // 👉 번역 비활성 (안정화)
  })),

  sentencePractice: [
    {
      id: 1,
      text: allSentenceTexts[0],
      literal: ""
    },
    {
      id: 2,
      text: allSentenceTexts[Math.floor(allSentenceTexts.length / 2)],
      literal: ""
    },
    {
      id: 3,
      text: allSentenceTexts[allSentenceTexts.length - 1],
      literal: ""
    }
  ],

  questions: [
    {
      id: 1,
      question: "What is the main purpose of the reading?",
      options: [
        "To explain a single event",
        "To show how global events are connected",
        "To focus on local news",
        "To describe only economic issues"
      ],
      answer: 1
    },
    {
      id: 2,
      question: "Why are US-Iran talks important?",
      options: [
        "They affect technology",
        "They influence regional stability",
        "They reduce AI investment",
        "They increase inflation"
      ],
      answer: 1
    },
    {
      id: 3,
      question: "What is a key effect of inflation?",
      options: [
        "Lower prices",
        "Higher borrowing costs",
        "Less global trade",
        "More AI usage"
      ],
      answer: 1
    },
    {
      id: 4,
      question: "Why is AI investment increasing?",
      options: [
        "Due to energy shortages",
        "Because of government pressure",
        "To build infrastructure and computing systems",
        "To reduce global tension"
      ],
      answer: 2
    },
    {
      id: 5,
      question: "What does the reading emphasize overall?",
      options: [
        "Local issues",
        "Single events",
        "Global connections",
        "Technology only"
      ],
      answer: 2
    }
  ],

  modelSummary:
    "This reading explains how major global developments in politics, economics, and technology are interconnected. It highlights the importance of understanding broader patterns rather than focusing on individual events."
};

// 👉 저장
fs.writeFileSync("src/todayReading.json", JSON.stringify(result, null, 2));

console.log("✅ daily reading generated");
