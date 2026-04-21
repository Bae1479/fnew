const fs = require("fs");
const path = require("path");
const https = require("https");

const FEED_URL = "https://feeds.bbci.co.uk/news/rss.xml";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
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
    .filter((s) => s.length > 35);
}

function pickKeySentences(sentences) {
  if (sentences.length <= 3) return sentences;
  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1],
  ];
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

function cleanWord(word = "") {
  return word.replace(/[^a-zA-Z0-9'-]/g, "");
}

function titleLiteral(title = "") {
  let result = title;

  result = result.replace(/\bUS\b/g, "미국");
  result = result.replace(/\bUK\b/g, "영국");
  result = result.replace(/\bEU\b/g, "유럽연합");
  result = result.replace(/\bAI\b/g, "AI");
  result = result.replace(/\bBBC\b/g, "BBC");

  result = result.replace(/\breleases?\b/gi, "공개하다");
  result = result.replace(/\bseizes?\b/gi, "장악하다");
  result = result.replace(/\bwarns?\b/gi, "경고하다");
  result = result.replace(/\bplans?\b/gi, "계획하다");
  result = result.replace(/\brises?\b/gi, "상승하다");
  result = result.replace(/\bfalls?\b/gi, "하락하다");
  result = result.replace(/\bslows?\b/gi, "둔화되다");
  result = result.replace(/\bhits?\b/gi, "영향을 주다");
  result = result.replace(/\bagrees?\b/gi, "합의하다");
  result = result.replace(/\bfaces?\b/gi, "직면하다");

  return `제목 직역: ${result}`;
}

function literalTranslate(sentence = "") {
  const s = sentence.trim();

  const replacements = [
    [/\bToday’s reading\b/gi, "오늘의 읽기 글은"],
    [/\bbrings together\b/gi, "함께 모은다"],
    [/\bmajor developments\b/gi, "주요 전개들"],
    [/\blatest international headlines\b/gi, "최신 국제 헤드라인들"],
    [/\bRather than\b/gi, "~하기보다는"],
    [/\bfocusing on\b/gi, "~에 초점을 맞추는"],
    [/\ba single story\b/gi, "하나의 이야기"],
    [/\bit helps the reader\b/gi, "그것은 독자를 돕는다"],
    [/\bconnect events\b/gi, "사건들을 연결해서 보다"],
    [/\bunderstand\b/gi, "이해하다"],
    [/\bwider significance\b/gi, "더 넓은 중요성"],
    [/\bidentify\b/gi, "파악하다"],
    [/\bforces shaping public discussion\b/gi, "대중 담론을 형성하는 힘들"],
    [/\bThis story matters because\b/gi, "이 이야기가 중요한 이유는"],
    [/\bindividual headlines\b/gi, "개별 헤드라인들이"],
    [/\boften reflect\b/gi, "종종 반영하기 때문이다"],
    [/\bbroader shifts\b/gi, "더 큰 변화들"],
    [/\bTaken together\b/gi, "함께 놓고 보면"],
    [/\bthese developments show that\b/gi, "이런 전개들은 ~을 보여준다"],
    [/\btoday’s world\b/gi, "오늘날의 세계"],
    [/\bdeeply interconnected\b/gi, "깊게 서로 연결되어 있는"],
    [/\bReaders benefit\b/gi, "독자들은 이득을 얻는다"],
    [/\bnot only from\b/gi, "~에서뿐 아니라"],
    [/\bknowing what happened\b/gi, "무슨 일이 일어났는지 아는 것"],
    [/\bthinking about\b/gi, "~에 대해 생각하는 것"],
    [/\bdifferent events\b/gi, "서로 다른 사건들"],
    [/\binfluence one another\b/gi, "서로에게 영향을 주다"],
    [/\bacross borders and sectors\b/gi, "국경과 분야를 가로질러"],
    [/\bFirst\b/gi, "첫째로"],
    [/\bSecond\b/gi, "둘째로"],
    [/\bThird\b/gi, "셋째로"],
    [/\bpolitics\b/gi, "정치"],
    [/\beconomics\b/gi, "경제"],
    [/\btechnology\b/gi, "기술"],
    [/\bpublic priorities\b/gi, "대중의 우선순위"],
  ];

  let out = s;
  replacements.forEach(([pattern, value]) => {
    out = out.replace(pattern, value);
  });

  return `직역: ${out}`;
}

function buildPassage(items) {
  const intro =
    "Today’s reading brings together several major developments from the latest international headlines. Rather than focusing on a single story, it helps the reader connect events, understand their wider significance, and identify the forces shaping public discussion.";

  const body = items
    .map((item, index) => {
      const orderWord = index === 0 ? "First" : index === 1 ? "Second" : "Third";
      return `${orderWord}, ${item.title}. ${item.description} This story matters because individual headlines often reflect broader shifts in politics, economics, technology, or public priorities.`;
    })
    .join(" ");

  const conclusion =
    "Taken together, these developments show that today’s world is deeply interconnected. Readers benefit not only from knowing what happened, but also from thinking about how different events influence one another across borders and sectors.";

  return `${intro} ${body} ${conclusion}`;
}

function buildSummary(items) {
  const focusA = items[0]?.title || "the first story";
  const focusB = items[1]?.title || "the second story";
  const focusC = items[2]?.title || "the third story";

  return `This reading combines three recent headlines and shows how separate events can be understood in a broader global context. It suggests that stories such as ${focusA}, ${focusB}, and ${focusC} are not isolated developments but part of larger changes in politics, economics, technology, and public priorities.`;
}

async function main() {
  const xml = await fetchText(FEED_URL);
  const items = parseItems(xml).slice(0, 3);

  if (!items.length) {
    throw new Error("RSS items not found");
  }

  const today = new Date().toISOString().slice(0, 10);
  const passage = buildPassage(items);
  const sentenceList = splitSentences(passage);
  const keySentences = pickKeySentences(sentenceList);

  const title = items[0].title || "Today’s Global News Briefing";
  const summary = buildSummary(items);

  const result = {
    date: today,
    category: "Daily News",
    title,
    titleLiteral: titleLiteral(title),
    source: "BBC RSS",
    passage,
    sentences: keySentences.map((text, i) => ({
      id: i + 1,
      text,
      literal: literalTranslate(text),
      backTranslationAnswer: text,
    })),
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
