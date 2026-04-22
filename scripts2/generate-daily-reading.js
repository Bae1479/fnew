const fs = require("fs");
const path = require("path");
const https = require("https");

const FEED_URL = "https://feeds.bbci.co.uk/news/rss.xml";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(fetchText(res.headers.location));
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

function decodeXml(str = "") {
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(str = "") {
  return decodeXml(str).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function parseItems(xml) {
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return itemMatches.map((m) => {
    const block = m[1];
    return {
      title: getTag(block, "title"),
      description: getTag(block, "description"),
      link: getTag(block, "link"),
      pubDate: getTag(block, "pubDate"),
    };
  });
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function buildPassage(items) {
  const intro =
    "Today’s reading brings together several major developments from the latest international headlines. Rather than focusing on a single story, it helps the reader connect events, understand their wider significance, and see how separate issues influence public discussion.";

  const body = items
    .map((item, index) => {
      const orderWord =
        index === 0 ? "First" : index === 1 ? "Second" : "Third";
      return `${orderWord}, ${item.title}. ${item.description} This story matters because individual headlines often reflect broader shifts in politics, economics, technology, or public priorities.`;
    })
    .join(" ");

  const conclusion =
    "Taken together, these developments show that today’s world is deeply interconnected. Readers benefit not only from knowing what happened, but also from thinking about how different events influence one another across borders and sectors.";

  return `${intro} ${body} ${conclusion}`;
}

function buildSummary(items) {
  const a = items[0]?.title || "the first story";
  const b = items[1]?.title || "the second story";
  const c = items[2]?.title || "the third story";

  return `This reading combines three recent headlines and argues that current events should be understood in a broader global context. It suggests that stories such as ${a}, ${b}, and ${c} are not isolated developments, but parts of larger changes in politics, economics, technology, and public priorities.`;
}

// 제목 직역은 너무 억지로 번역하지 않고, 읽을 만한 수준으로만
function makeTitleLiteral(title = "") {
  if (!title) return "제목 직역 준비 중입니다.";

  let t = title;

  t = t.replace(/\bUS\b/g, "미국");
  t = t.replace(/\bUK\b/g, "영국");
  t = t.replace(/\bEU\b/g, "EU");
  t = t.replace(/\bPM\b/g, "총리");
  t = t.replace(/\bAI\b/g, "AI");

  return `제목 직역: ${t}`;
}

// 핵심 3문장만 사람이 읽을 만하게 고정 템플릿으로
function makePracticeSentences(items, title) {
  const s1 = "Today’s reading brings together several major developments from the latest international headlines.";
  const l1 = "직역: 오늘의 리딩 글은 최신 국제 헤드라인들에서 나온 몇 가지 주요 전개를 함께 모은다.";

  const s2 = `First, ${title}.`;
  const l2 = `직역: 첫째, ${title}.`;

  const s3 =
    "Taken together, these developments show that today’s world is deeply interconnected.";
  const l3 = "직역: 함께 놓고 보면, 이런 전개들은 오늘날의 세계가 깊게 서로 연결되어 있음을 보여준다.";

  return [
    {
      id: 1,
      text: s1,
      literal: l1,
      backTranslationAnswer: s1,
    },
    {
      id: 2,
      text: s2,
      literal: l2,
      backTranslationAnswer: s2,
    },
    {
      id: 3,
      text: s3,
      literal: l3,
      backTranslationAnswer: s3,
    },
  ];
}

async function main() {
  const xml = await fetchText(FEED_URL);
  const items = parseItems(xml).slice(0, 3);

  if (!items.length) {
    throw new Error("RSS items not found");
  }

  const today = new Date().toISOString().slice(0, 10);
  const title = items[0].title || "Today’s Global News Briefing";
  const passage = buildPassage(items);
  const allSentenceTexts = splitSentences(passage);
  const sentencePractice = makePracticeSentences(items, title);
  const summary = buildSummary(items);

  // 본문 전체 문장 데이터
  const allSentences = allSentenceTexts.map((text, i) => {
    const matchedPractice = sentencePractice.find((p) => p.text === text);
    return {
      id: i + 1,
      text,
      literal: matchedPractice ? matchedPractice.literal : "",
    };
  });

  const result = {
    date: today,
    category: "Daily News",
    title,
    titleLiteral: makeTitleLiteral(title),
    source: "BBC RSS",
    passage,
    allSentences,
   sentencePractice,
modelSummary: `This reading brings together three major recent headlines and encourages readers to think about current events in a broader global context.

Rather than viewing news as isolated stories, it highlights how developments across different regions reflect deeper trends in politics, economics, and society.

By connecting these events, the passage suggests that understanding relationships between issues is essential for interpreting modern news.

Overall, it emphasizes that global events are interconnected and should be read with a wider perspective in mind.`,

// App 호환용
sentences: allSentences,
questions: [
    // App 호환용
    sentences: allSentences,
    questions: [
      {
        id: 1,
        question: "What is the main purpose of this passage?",
        options: [
          "To tell a fictional story",
          "To connect several current news developments",
          "To explain only one sports event",
          "To teach grammar rules"
        ],
        answer: 1,
        explanation: "The passage combines several recent headlines into one reading."
      },
      {
        id: 2,
        question: "How many recent stories are mainly used to build this reading?",
        options: ["One", "Two", "Three", "Five"],
        answer: 2,
        explanation: "The script uses the top three RSS items."
      },
      {
        id: 3,
        question: "What does the conclusion emphasize?",
        options: [
          "Events are isolated",
          "Only technology matters",
          "The world is interconnected",
          "Readers should ignore context"
        ],
        answer: 2,
        explanation: "The conclusion says current developments are deeply interconnected."
      },
      {
        id: 4,
        question: "Which source is used to generate this reading?",
        options: ["BBC RSS", "Netflix", "Wikipedia only", "A PDF file"],
        answer: 0,
        explanation: "The reading is built from BBC RSS headlines."
      },
      {
        id: 5,
        question: "Why does the passage group different headlines together?",
        options: [
          "To avoid reading any details",
          "To show broader links across current events",
          "To create a fictional dialogue",
          "To focus only on entertainment"
        ],
        answer: 1,
        explanation: "The reading is designed to connect developments across topics."
      }
    ],
    modelSummary: summary
  };

  const srcDir = path.join(process.cwd(), "src");
  const historyDir = path.join(process.cwd(), "history");
  const todayPath = path.join(srcDir, "todayReading.json");
  const historyPath = path.join(historyDir, `${today}.json`);
  const indexPath = path.join(srcDir, "readingIndex.json");

  ensureDir(srcDir);
  ensureDir(historyDir);

  fs.writeFileSync(todayPath, JSON.stringify(result, null, 2), "utf-8");
  fs.writeFileSync(historyPath, JSON.stringify(result, null, 2), "utf-8");

  const indexData = readJsonSafe(indexPath, []);
  const newEntry = {
    date: today,
    title: result.title,
    source: result.source,
    path: `https://raw.githubusercontent.com/Bae1479/fnew/main/history/${today}.json`
  };

  const filtered = indexData.filter((item) => item.date !== today);
  const updatedIndex = [newEntry, ...filtered];
  fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2), "utf-8");

  console.log("UPDATED TODAY:", todayPath);
  console.log("UPDATED HISTORY:", historyPath);
  console.log("UPDATED INDEX:", indexPath);
  console.log("NEW TITLE:", result.title);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
