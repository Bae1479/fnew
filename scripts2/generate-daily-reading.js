
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
    .filter((s) => s.length > 40);
}

function pickKeySentences(sentences) {
  if (sentences.length <= 3) return sentences;
  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1],
  ];
}

async function main() {
  const xml = await fetchText(FEED_URL);
  const items = parseItems(xml).slice(0, 3);

  if (!items.length) {
    throw new Error("RSS items not found");
  }

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

  const passage = `${intro} ${body} ${conclusion}`;
  const sentenceList = splitSentences(passage);
  const keySentences = pickKeySentences(sentenceList);

  const result = {
    date: new Date().toISOString().slice(0, 10),
    category: "Daily News",
    title: items[0].title || "Today’s Global News Briefing",
    source: "BBC RSS",
    passage,
    sentences: keySentences.map((text, i) => ({
      id: i + 1,
      text,
      literal: "직역은 다음 단계에서 자동 생성하도록 연결할 예정입니다.",
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
      }
    ],
    modelSummary:
      "The passage combines several recent news developments and argues that current events should be understood in a broader connected context. It emphasizes that political, economic, and social changes often influence one another across sectors and borders."
  };

  const outputPath = path.join(process.cwd(), "src", "todayReading.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  console.log("UPDATED:", outputPath);
  console.log("NEW TITLE:", result.title);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
