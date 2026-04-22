import https from "https";
import fs from "fs";

// 🔹 RSS 가져오기
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// 🔹 XML 파싱 (간단)
function parseItems(xml) {
  const items = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/g);

  matches?.forEach((item) => {
    const clean = (str = "") =>
  str.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "");

const title = clean(item.match(/<title>(.*?)<\/title>/)?.[1] || "");
const description = clean(
  item.match(/<description>(.*?)<\/description>/)?.[1] || ""
);
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    items.push({ title, description, pubDate });
  });

  return items;
}

// 🔹 KST 날짜 변환
function getKSTDateString(dateInput) {
  const d = new Date(dateInput);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 🔹 실행
(async () => {
  const xml = await fetchRSS("https://feeds.bbci.co.uk/news/rss.xml");

  const allItems = parseItems(xml);

  const now = new Date();
  const nowKST = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const yesterdayKST = new Date(nowKST);
  yesterdayKST.setDate(nowKST.getDate() - 1);
  const yesterdayString = yesterdayKST.toISOString().slice(0, 10);

  const items = allItems
    .filter((item) => getKSTDateString(item.pubDate) === yesterdayString)
    .slice(0, 3);

  // 🔹 fallback (어제 뉴스 없으면 최신)
  const finalItems = items.length >= 3 ? items : allItems.slice(0, 3);

  // 🔹 리딩 생성
  const intro =
    "Today’s reading brings together several major developments from recent international headlines.";

const body = finalItems
  .map((item, i) => {
    const intro = i === 0 ? "First" : i === 1 ? "Second" : "Third";
const extras = [
  "This development is important because it may influence broader political, economic, or social discussions.",
  "In this context, the story highlights how local events can have wider international significance.",
  "It also suggests that recent developments should not be understood in isolation.",
  "This situation reflects deeper patterns that shape global trends over time.",
  "For readers, this shows how different issues can be closely connected across regions."
];

const extra = extras[i % extras.length];

return `${intro}, ${item.description} ${extra}`;
  })
  .join(" ");

  const conclusion =
  "Overall, these developments show how interconnected global events are. They also suggest that readers should pay attention not only to individual headlines but also to the wider patterns that connect them. In many cases, political decisions, economic pressures, and diplomatic tensions do not remain isolated. Instead, they shape one another over time and influence how future events may unfold across different regions.";;

  const passage = `${intro} ${body} ${conclusion}`;
const summary = `This reading explains several recent global developments and shows that they are interconnected. It highlights how political, economic, and social issues influence each other across different regions. Overall, it emphasizes the importance of understanding global events within a broader context.`;
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

  const sentencePractice = [
    allSentenceTexts[0],
    allSentenceTexts[Math.floor(allSentenceTexts.length / 2)],
    allSentenceTexts[allSentenceTexts.length - 1]
  ].map((s, i) => ({
    id: i + 1,
    text: s,
    literal: "직역 준비 중입니다."
  }));

  const result = {
    date: new Date().toISOString().slice(0, 10),
    title: finalItems[0]?.title || "Daily News",
    titleLiteral: "오늘의 뉴스",
    passage,
    allSentences,
    sentencePractice,
    sentences: allSentences,

    modelSummary: summary,

   questions: [
  {
    id: 1,
    question: "What is the main purpose of this reading?",
    options: [
      "To describe one single event in detail",
      "To connect several recent global developments",
      "To explain only an economic theory",
      "To criticize the media"
    ],
    answer: 1
  },
  {
    id: 2,
    question: "What does the passage suggest about current events?",
    options: [
      "They should be viewed separately",
      "They are mostly unrelated",
      "They are connected in a broader context",
      "They are impossible to understand"
    ],
    answer: 2
  },
  {
    id: 3,
    question: "Why does the reading mention politics, economics, and diplomacy together?",
    options: [
      "To show that different issues influence one another",
      "To increase the passage length only",
      "To focus on one country",
      "To avoid giving examples"
    ],
    answer: 0
  },
  {
    id: 4,
    question: "What is emphasized in the conclusion?",
    options: [
      "Only local events matter",
      "Readers should ignore patterns",
      "Global events are interconnected",
      "Headlines are usually misleading"
    ],
    answer: 2
  },
  {
    id: 5,
    question: "What reading skill does this passage encourage?",
    options: [
      "Memorizing isolated facts",
      "Understanding wider patterns and relationships",
      "Skipping difficult ideas",
      "Reading only short headlines"
    ],
    answer: 1
  }
]
  };

  fs.writeFileSync("src/todayReading.json", JSON.stringify(result, null, 2));

  console.log("✅ DONE");
})();
