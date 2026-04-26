const fs = require("fs");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const TOPICS = [
  "Economics",
  "World History",
  "Philosophy",
  "Technology",
  "Society"
];

function getTodayTopic() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPICS[day % TOPICS.length];
}

function buildPrompt(topic) {
  return `
You are creating an English reading passage for advanced learners.

Topic: ${topic}

Write a high-quality reading passage.

Rules:
- Natural, professional English
- Clear structure and logical flow
- 4 to 6 paragraphs
- Each paragraph 2–4 sentences
- No repetition
- No generic filler phrases

Also create:
1. 5 reading comprehension questions:
   - main idea
   - detail
   - inference
   - vocabulary
   - purpose

2. Summary:
- One paragraph
- Exactly 3 blanks (use format: (answer))

Return JSON:

{
  "headline": "",
  "reading": "",
  "quiz": [],
  "summary": "",
  "summaryQuiz": []
}
`;
}

async function generateReading(topic) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.5-mini",
      input: buildPrompt(topic),
      text: { format: { type: "json_object" } }
    })
  });

  const data = await res.json();

  return JSON.parse(
    data.output[0].content[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "")
  );
}

async function build() {
  const topic = getTodayTopic();
  const result = await generateReading(topic);

  const data = {
    date: new Date().toISOString(),
    category: topic,
    categoryLabel: topic,
    ...result
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE:", topic);
}

build().catch(console.error);
