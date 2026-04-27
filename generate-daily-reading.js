const fs = require("fs");

/**
 * 🔀 퀴즈 섞기
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuiz(rawQuiz) {
  return rawQuiz.map((q) => {
    const correct = q.options[q.answer];
    const shuffled = shuffleArray(q.options);

    return {
      q: q.q,
      options: shuffled,
      answer: shuffled.indexOf(correct)
    };
  });
}

/**
 * 📚 리딩 데이터 (5개)
 */
const readings = [

  // 1️⃣ Economics
  {
    category: "Economics",
    categoryLabel: "Economics | Intermediate",
    headline: "Supply and Demand in Everyday Markets",

    reading: `Supply and demand are fundamental concepts that explain how markets operate. Prices are not fixed but are determined by the interaction between buyers and sellers.

When demand increases, prices tend to rise. Conversely, when supply increases, prices often fall. This process can be observed in everyday situations such as seasonal products.

However, supply and demand are influenced by expectations and income levels. These factors can shift demand even before actual changes occur.

Understanding these principles helps individuals make better economic decisions. It also allows businesses to adjust production strategies.

Overall, supply and demand provide a framework for understanding price movements in markets.`,

    sentences: [
      { ko: "수요와 공급은 시장을 이해하는 핵심 개념이다.", en: "Supply and demand are key concepts for understanding markets." },
      { ko: "수요가 증가하면 가격이 상승한다.", en: "When demand increases, prices rise." },
      { ko: "이 개념은 의사결정에 도움을 준다.", en: "This concept helps decision-making." }
    ],

    quizRaw: [
      {
        q: "Main idea?",
        options: [
          "Supply and demand explain prices",
          "Markets are random",
          "Prices never change",
          "Only sellers decide prices"
        ],
        answer: 0
      },
      {
        q: "When demand rises?",
        options: ["Prices rise","Prices fall","Nothing happens","Supply disappears"],
        answer: 0
      },
      {
        q: "What influences demand?",
        options: ["Expectations","Weather only","Time","Distance"],
        answer: 0
      },
      {
        q: "Why is it useful?",
        options: ["Decision-making","Entertainment","Prediction only","None"],
        answer: 0
      },
      {
        q: "Tone?",
        options: ["Explanatory","Funny","Emotional","Story"],
        answer: 0
      }
    ],

    summary: "Supply and demand determine (prices) through interaction. Changes in (demand) influence markets and guide (decisions).",

    summaryQuiz: [
      { blank:1, answer:"prices", options:["prices","jobs","money","labor"]},
      { blank:2, answer:"demand", options:["demand","supply","growth","trade"]},
      { blank:3, answer:"decisions", options:["decisions","profits","exports","income"]}
    ]
  },

  // 2️⃣ History
  {
    category: "History",
    categoryLabel: "History | Intermediate",
    headline: "The Rise of the Roman Empire",

    reading: `Rome began as a small city-state and expanded through conquest and alliances. Over time, it gained control of vast territories.

As Rome grew, its political system changed. The republic struggled to manage expansion, leading to the rise of emperors.

The Roman army was disciplined and organized, helping maintain control. Infrastructure such as roads connected distant regions.

However, expansion also created internal conflicts. Inequality and competition weakened the system.

The transformation from republic to empire shows how growth can reshape political structures.`,

    sentences: [
      { ko: "로마는 작은 도시에서 시작되었다.", en: "Rome began as a small city." },
      { ko: "군사력이 확장에 중요했다.", en: "Military strength was important for expansion." },
      { ko: "성장은 정치 변화를 가져왔다.", en: "Growth led to political change." }
    ],

    quizRaw: [
      {
        q: "Main idea?",
        options: [
          "Rome expanded and changed",
          "Rome stayed small",
          "Rome avoided war",
          "Rome had no army"
        ],
        answer: 0
      },
      {
        q: "What caused change?",
        options: ["Expansion","Weather","Trade","Religion"],
        answer: 0
      },
      {
        q: "What helped control?",
        options: ["Army","Culture","Language","Money"],
        answer: 0
      },
      {
        q: "Problem?",
        options: ["Conflict","Peace","Growth","Unity"],
        answer: 0
      },
      {
        q: "Tone?",
        options: ["Explanatory","Funny","Story","Emotional"],
        answer: 0
      }
    ],

    summary: "Rome grew from a (city) into an empire. Expansion caused political (change) and internal (conflict).",

    summaryQuiz: [
      { blank:1, answer:"city", options:["city","nation","state","village"]},
      { blank:2, answer:"change", options:["change","peace","growth","decline"]},
      { blank:3, answer:"conflict", options:["conflict","trade","unity","wealth"]}
    ]
  },

  // 3️⃣ Technology
  {
    category: "Technology",
    categoryLabel: "Technology | Intermediate",
    headline: "Artificial Intelligence in Daily Life",

    reading: `Artificial intelligence is widely used in daily life. It helps people complete tasks efficiently.

AI processes large amounts of data quickly. However, it depends on the quality of data.

In workplaces, AI automates routine tasks. This allows people to focus on complex work.

Despite benefits, AI raises concerns about bias and privacy.

Understanding AI is important for adapting to technological change.`,

    sentences: [
      { ko:"AI는 일상에서 사용된다.", en:"AI is used in daily life."},
      { ko:"AI는 데이터를 기반으로 작동한다.", en:"AI works based on data."},
      { ko:"AI는 기회와 위험을 가진다.", en:"AI has both opportunities and risks."}
    ],

    quizRaw:[
      {
        q:"Main idea?",
        options:["AI affects daily life","AI replaces all humans","AI is useless","AI is perfect"],
        answer:0
      },
      {
        q:"Limitation?",
        options:["Bias","Speed","Size","Cost"],
        answer:0
      },
      {
        q:"Work effect?",
        options:["Automation","Reduction","Stopping","None"],
        answer:0
      },
      {
        q:"Concern?",
        options:["Privacy","Weather","Geography","Population"],
        answer:0
      },
      {
        q:"Tone?",
        options:["Balanced","Funny","Story","Emotional"],
        answer:0
      }
    ],

    summary:"AI uses (data) to improve efficiency but may create (bias). It offers opportunities and (risks).",

    summaryQuiz:[
      {blank:1,answer:"data",options:["data","time","money","labor"]},
      {blank:2,answer:"bias",options:["bias","growth","speed","trade"]},
      {blank:3,answer:"risks",options:["risks","profits","jobs","markets"]}
    ]
  }

];

/**
 * 📅 날짜 선택
 */
function getTodayReading() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return readings[day % readings.length];
}

/**
 * 🔥 실행
 */
function build() {
  const reading = getTodayReading();

  const data = {
    date: new Date().toISOString(),
    ...reading,
    quiz: buildQuiz(reading.quizRaw)
  };

  delete data.quizRaw;

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");

  console.log("✅ DONE:", reading.headline);
}

build();
