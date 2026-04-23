import fs from "fs";

// 👉 직역 함수 (파일 최상단에 1번만)
const literalMap = (text) => {
  // 간단한 자연어 해석 (구조 유지)
  return text
    .replace(/^To begin with, /, "먼저, ")
    .replace(/^Another important issue is /, "또 다른 중요한 문제는 ")
    .replace(/^In addition, /, "또한, ")
    .replace(/^Overall, /, "전반적으로, ")
    .replace(/^These developments are not independent of one another\./, "이러한 발전들은 서로 독립적인 것이 아니다.")
    .replace(/are expected to/g, "것으로 예상된다")
    .replace(/are being/g, "진행되고 있다")
    .replace(/is expanding/g, "확대되고 있다")
    .replace(/are forced to/g, "어쩔 수 없이 ~해야 한다")
    .replace(/have a direct impact on/g, "직접적인 영향을 미친다")
    .replace(/continue to/g, "계속해서 ~하고 있다")
    .replace(/is attracting/g, "주목을 받고 있다")
    .replace(/may influence/g, "영향을 미칠 수 있다")
    .replace(/suggest that/g, "시사한다")
    .replace(/means that/g, "의미한다")
    .replace(/requires/g, "요구한다")
    .replace(/\.$/, "다.");
};

// 👉 샘플 데이터 (여기 나중에 RSS로 바꿔도 됨)
const items = [
  "Talks are expected between the US and Iran in Islamabad.",
  "Global inflation continues to affect borrowing costs worldwide.",
  "AI investment is rapidly increasing across major economies.",
  "Energy infrastructure is becoming a critical issue in AI development.",
  "Semiconductor demand is rising due to advances in technology.",
  "Geopolitical tensions are influencing global supply chains.",
  "Central banks are continuing to monitor inflation and growth risks.",
  "Technology companies are investing more heavily in data centers and chips.",
  "Governments are trying to balance economic growth with rising security concerns.",
  "Financial markets are reacting to uncertainty in trade, energy, and monetary policy.",
  "The spread of AI tools is increasing demand for electricity and computing power.",
  "Global companies are adjusting their strategies in response to changing supply chains.",
  "Political leaders are facing pressure to respond to both domestic and global challenges.",
  "Investors are paying closer attention to infrastructure, energy, and semiconductor trends.",
  "Recent developments suggest that international events increasingly affect one another.",
  "As a result, understanding world news requires attention to broader patterns and connections.",
  "Diplomatic negotiations continue to shape expectations about regional stability.",
  "At the same time, economic uncertainty is affecting consumer confidence and investment decisions."
];

// 👉 리딩 생성
const intro = "Today's reading brings together several major developments from recent international headlines.";

const body = `
Today's reading brings together several major developments from recent international news, offering a broader view of how global events are interconnected. Rather than focusing on isolated headlines, it encourages readers to think about the underlying patterns that link politics, economics, and technology.

To begin with, talks are expected between the United States and Iran in Islamabad. These discussions are attracting significant attention from the international community, as they may influence regional stability and diplomatic relations in the Middle East. If the negotiations lead to progress, they could ease tensions that have persisted for years. However, there is also skepticism about whether both sides are willing to make meaningful compromises, making the outcome uncertain.

Another important issue is the continued impact of global inflation. Rising prices have forced central banks around the world to adjust interest rates in an attempt to control economic pressure. These decisions affect not only large financial institutions but also ordinary consumers, influencing borrowing costs, housing markets, and overall spending behavior. As a result, many countries are now facing the challenge of balancing economic growth with financial stability in an increasingly uncertain environment.

In addition, investment in artificial intelligence is expanding rapidly across major economies. Companies are allocating significant resources to build data centers, develop advanced semiconductors, and secure the energy needed to support large-scale computing systems. While this surge in investment is driving innovation, it is also raising important questions about energy consumption, environmental impact, and long-term sustainability. Governments and industry leaders are beginning to recognize that the growth of AI must be managed carefully to avoid unintended consequences.

These developments are not independent of one another. Diplomatic tensions can influence economic decisions, while technological advances can reshape both political strategies and financial markets. This interconnectedness means that understanding global events requires more than simply following individual stories; it requires a broader perspective that considers how different forces interact over time.

Overall, the reading highlights the importance of looking beyond immediate headlines and developing a deeper awareness of global patterns. By doing so, readers can better understand not only what is happening in the world, but also why these events matter and how they may shape the future.
`;

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
  "This reading brings together several recent global developments and explains how they are connected within a broader context. It shows that political, economic, and social events are not isolated, but instead influence one another in meaningful ways. By examining these relationships, the passage highlights the importance of understanding patterns and connections rather than focusing on single events.";

// 👉 결과
const result = {
  date: new Date().toISOString().slice(0, 10),
  title: "Global Developments Overview",
  passage,
  modelSummary,
  allSentences,
  sentences: allSentences,
sentencePractice: [
  allSentences[0],
  allSentences[Math.floor(allSentences.length / 2)],
  allSentences[allSentences.length - 1]
],
  questions
};

// 👉 저장
fs.writeFileSync(
  "src/todayReading.json",
  JSON.stringify(result, null, 2)
);

console.log("✅ Generated successfully");
