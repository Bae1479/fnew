import fs from "fs";
import https from "https";

const FEED_URL = "https://feeds.bbci.co.uk/news/rss.xml";
const REPO_RAW_BASE =
  "https://raw.githubusercontent.com/Bae1479/fnew/main";

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
          resolve(fetchText(res.headers.location));
          return;
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => resolve(data));
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
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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
      pubDate: getTag(block, "pubDate"),
      link: getTag(block, "link"),
    };
  });
}

function getKSTDateString(dateInput) {
  const d = new Date(dateInput);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function getYesterdayKSTString() {
  const now = new Date();
  const nowKST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yesterdayKST = new Date(nowKST);
  yesterdayKST.setDate(nowKST.getDate() - 1);
  return yesterdayKST.toISOString().slice(0, 10);
}

function sentencePair(text, literal) {
  return {
    text: text.trim(),
    literal: literal.trim(),
  };
}

function buildSentencePairs(items) {
  const pairs = [];

  pairs.push(
    sentencePair(
      "Today's reading brings together several important developments from recent international news and presents them as part of a larger global picture.",
      "오늘의 글은 최근 국제 뉴스의 중요한 흐름들을 하나로 묶어, 그것들을 더 큰 세계적 맥락 속에서 보여준다."
    )
  );

  pairs.push(
    sentencePair(
      "Rather than focusing on isolated headlines, it encourages readers to think about how politics, economics, technology, and diplomacy influence one another.",
      "개별 기사에만 집중하기보다, 정치·경제·기술·외교가 서로 어떤 영향을 주고받는지 생각해보도록 이끈다."
    )
  );

  items.forEach((item, i) => {
    const order = i === 0 ? "First" : i === 1 ? "Second" : "Third";

    pairs.push(
      sentencePair(
        `${order}, one important story concerns "${item.title}".`,
        `${order === "First" ? "첫째로" : order === "Second" ? "둘째로" : "셋째로"}, 중요한 이슈 중 하나는 "${item.title}"와 관련되어 있다.`
      )
    );

    pairs.push(
      sentencePair(
        "This issue matters because recent developments in one area can quickly influence wider discussions about stability, strategy, and public expectations.",
        "이 문제는 한 영역의 최근 변화가 안정성, 전략, 그리고 대중의 기대에 대한 더 넓은 논의로 빠르게 이어질 수 있기 때문에 중요하다."
      )
    );

    pairs.push(
      sentencePair(
        "For readers, the value of this story lies not only in the headline itself but also in the broader questions it raises about policy, risk, and long-term direction.",
        "독자에게 이 기사의 가치는 헤드라인 자체에만 있는 것이 아니라, 정책·위험·장기적 방향에 대해 어떤 더 큰 질문을 던지는지에 있다."
      )
    );

    pairs.push(
      sentencePair(
        "Seen in this way, the story becomes part of a much larger pattern that helps explain why global events often feel connected rather than separate.",
        "이런 관점에서 보면 이 기사는 개별 사건이 아니라 더 큰 흐름의 일부가 되며, 세계 사건들이 왜 따로가 아니라 서로 연결되어 보이는지를 설명해준다."
      )
    );
  });

  pairs.push(
    sentencePair(
      "Taken together, these developments show that current events are deeply interconnected and should be read with patience, context, and comparison.",
      "이 모든 흐름을 함께 놓고 보면, 현재의 사건들은 깊게 연결되어 있으며 맥락과 비교 속에서 읽어야 한다는 점을 보여준다."
    )
  );

  pairs.push(
    sentencePair(
      "A careful reader therefore gains more than information: they gain a clearer sense of how global patterns shape the future.",
      "따라서 신중한 독자는 단순한 정보 이상을 얻으며, 세계적 흐름이 미래를 어떻게 만들어가는지에 대한 더 분명한 감각을 얻게 된다."
    )
  );

  return pairs;
}

function buildSummary(items) {
  const a = items[0]?.title || "the first story";
  const b = items[1]?.title || "the second story";
  const c = items[2]?.title || "the third story";

  return `This reading connects several recent global developments and explains why current events should be understood in a broader context. Rather than treating headlines as separate topics, it shows how stories such as ${a}, ${b}, and ${c} reflect larger patterns in politics, economics, and public decision-making. Overall, the passage encourages readers to look for relationships, consequences, and long-term significance when following international news.`;
}

function buildQuestions() {
  return [
    {
      id: 1,
      question: "What is the main purpose of this reading?",
      options: [
        "To explain one event in detail",
        "To connect several global developments",
        "To summarize only economic news",
        "To criticize international media"
      ],
      answer: 1
    },
    {
      id: 2,
      question: "What does the passage encourage readers to do?",
      options: [
        "Ignore broader patterns",
        "Read only short headlines",
        "Think about how issues are connected",
        "Focus on one country at a time"
      ],
      answer: 2
    },
    {
      id: 3,
      question: "Why are the stories presented together?",
      options: [
        "To show that they raise wider questions",
        "To reduce the number of sources",
        "To avoid detailed reading",
        "To create a fictional theme"
      ],
      answer: 0
    },
    {
      id: 4,
      question: "What kind of reading skill does this passage emphasize?",
      options: [
        "Memorizing names only",
        "Comparing patterns and consequences",
        "Reading as quickly as possible",
        "Avoiding difficult topics"
      ],
      answer: 1
    },
    {
      id: 5,
      question: "What is the overall message of the conclusion?",
      options: [
        "Events should be read separately",
        "Only diplomacy matters",
        "Global developments are interconnected",
        "Headlines are usually misleading"
      ],
      answer: 2
    }
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

async function main() {
  const xml = await fetchText(FEED_URL);
  const allItems = parseItems(xml);

  const yesterdayString = getYesterdayKSTString();

  const filteredItems = allItems.filter(
    (item) => getKSTDateString(item.pubDate) === yesterdayString
  );

  const selectedItems =
    filteredItems.length >= 3 ? filteredItems.slice(0, 3) : allItems.slice(0, 3);

  if (!selectedItems.length) {
    throw new Error("No RSS items available");
  }

  const sentencePairs = buildSentencePairs(selectedItems);
  const allSentences = sentencePairs.map((pair, i) => ({
    id: i + 1,
    text: pair.text,
    literal: pair.literal,
  }));

  const sentencePracticeIndexes = [
    1,
    Math.floor(allSentences.length / 2),
    allSentences.length - 2,
  ];

  const sentencePractice = sentencePracticeIndexes.map((idx, i) => ({
    id: i + 1,
    text: allSentences[idx].text,
    literal: allSentences[idx].literal,
  }));

  const passage = allSentences.map((s) => s.text).join(" ");
  const modelSummary = buildSummary(selectedItems);
  const questions = buildQuestions();

  const result = {
    date: new Date().toISOString().slice(0, 10),
    title: selectedItems[0].title || "Global Developments Overview",
    passage,
    allSentences,
    sentencePractice,
    questions,
    modelSummary,
  };

  const srcDir = "src";
  const historyDir = "history";
  const todayPath = `${srcDir}/todayReading.json`;
  const historyPath = `${historyDir}/${result.date}.json`;
  const indexPath = `${srcDir}/readingIndex.json`;

  ensureDir(srcDir);
  ensureDir(historyDir);

  fs.writeFileSync(todayPath, JSON.stringify(result, null, 2), "utf-8");
  fs.writeFileSync(historyPath, JSON.stringify(result, null, 2), "utf-8");

  const readingIndex = readJsonSafe(indexPath, []);
  const newItem = {
    date: result.date,
    title: result.title,
    source: "BBC RSS",
    path: `${REPO_RAW_BASE}/history/${result.date}.json`,
  };

  const updatedIndex = [
    newItem,
    ...readingIndex.filter((item) => item.date !== result.date),
  ];

  fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2), "utf-8");

  console.log("✅ daily reading generated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
