const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5-mini";

const FEEDS = {
  pbs: "https://www.pbs.org/newshour/feeds/rss/headlines"
};

function clean(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchNews() {
  const feed = await parser.parseURL(FEEDS.pbs);

  return (feed.items || [])
    .slice(0, 6)
    .map((item) => ({
      title: clean(item.title || ""),
      summary: clean(item.contentSnippet || item.content || item.summary || "")
    }))
    .filter((n) => n.title && n.summary.length > 50);
}

/**
 * 🔥 핵심: 퀄리티를 결정하는 프롬프트
 */
function buildPrompt(newsItems) {
  const newsText = newsItems
    .map(
      (item, i) =>
        `News ${i + 1}:
Title: ${item.title}
Summary: ${item.summary}`
    )
    .join("\n\n");

  return `
You are a professional journalist writing for advanced English learners.

Write ONE high-quality reading passage based on the news below.

STRICT RULES:
- Must feel like a real news article (BBC / NYT style)
- No repetition
- No generic sentences like "this shows broader trends"
- Use concrete details from the news
- Smooth logical flow

STRUCTURE:
1. Strong opening (what happened)
2. Key details (who, what, where, why)
3. Develop situation with clarity
4. End naturally (no vague conclusions)

LENGTH:
- 4 to 6 paragraphs
- Each paragraph 2-4 sentences

TONE:
- Professional
- Clear
- Realistic
- Slightly analytical but grounded in facts

---

ALSO GENERATE:

1. 5 reading comprehension questions:
- main idea
- detail
- inference
- vocabulary in context
- author's purpose

2. Summary:
- One paragraph
- Exactly 3 blanks using (answer)

3. Summary quiz:
- 3 questions
- Each has 4 options

---

RETURN ONLY JSON:

{
  "headline": "",
  "reading": "",
  "quiz": [
    {
      "q": "",
      "options": ["", "", "", ""],
      "answer": 0
    }
  ],
  "summary": "",
  "summaryQuiz": [
    {
      "blank": 1,
      "answer": "",
      "options": ["", "", "", ""]
    }
  ]
}

---

News:
${newsText}
`;
}

async function generateWithOpenAI(newsItems) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: buildPrompt(newsItems),
      text: { format: { type: "json_object" } }
    })
  });

  const data = await response.json();

  return JSON.parse(
    data.output[0].content[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "")
  );
}

async function build() {
  const newsItems = await fetchNews();
  const result = await generateWithOpenAI(newsItems);

  const data = {
    date: new Date().toISOString(),
    category: "daily-news",
    categoryLabel: "Daily News",
    headline: result.headline,
    reading: result.reading,
    quiz: result.quiz,
    summary: result.summary,
    summaryQuiz: result.summaryQuiz,
    newsItems
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE:", result.headline);
}

build().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
