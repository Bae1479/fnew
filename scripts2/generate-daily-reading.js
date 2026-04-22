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
  const finalItems = items.length ? items : allItems.slice(0, 3);

  // 🔹 리딩 생성
  const intro =
    "Today’s reading brings together several major developments from recent international headlines.";

const body = finalItems
  .map((item, i) => {
    const intro = i === 0 ? "First" : i === 1 ? "Second" : "Third";
    return `${intro}, ${item.description} This development is important because it may influence broader political, economic, or social discussions. In this context, the story also shows how local events can have wider international significance.`;
  })
  .join(" ");

  const conclusion =
    "Overall, these developments show how interconnected global events are.";

  const passage = `${intro} ${body} ${conclusion}`;

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

    modelSummary: `This reading explains recent global events and shows that they are interconnected and reflect broader trends.`,

    questions: []
  };

  fs.writeFileSync("src/todayReading.json", JSON.stringify(result, null, 2));

  console.log("✅ DONE");
})();
