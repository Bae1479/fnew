const fs = require("fs");

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

const readings = [
  {
    category: "Economics",
    headline: "How Interest Rates Shape Economic Activity",

    reading: `Interest rates are one of the most important tools used by central banks to influence economic activity. By adjusting rates, policymakers can encourage or discourage borrowing, which in turn affects spending, investment, and overall growth.

When interest rates are low, borrowing becomes cheaper. Businesses are more likely to invest in new projects, and consumers are more willing to take loans for houses, cars, or other purchases. As a result, economic activity tends to increase.

However, low rates can also lead to excessive borrowing and rising prices. When too much money flows into the economy, inflation may accelerate.

On the other hand, higher interest rates make borrowing more expensive. This can slow down spending and reduce inflationary pressure.

In this way, interest rates act as a balancing mechanism in the economy.`,

    sentences: [
      {
        ko: "금리는 경제 활동을 조절하는 중요한 도구이다.",
        en: "Interest rates are an important tool used to influence economic activity."
      },
      {
        ko: "금리가 낮아지면 차입과 소비가 증가한다.",
        en: "When interest rates fall, borrowing and spending increase."
      },
      {
        ko: "높은 금리는 인플레이션을 억제할 수 있다.",
        en: "Higher interest rates can reduce inflation."
      }
    ],

    quiz: buildQuiz([
      {
        q: "What is the main function of interest rates?",
        options: [
          "To influence economic activity",
          "To eliminate inflation completely",
          "To increase taxes",
          "To control population"
        ],
        answer: 0
      },
      {
        q: "What happens when interest rates are low?",
        options: [
          "Borrowing increases",
          "Spending decreases",
          "Inflation stops",
          "Exports fall"
        ],
        answer: 0
      },
      {
        q: "What risk comes from low interest rates?",
        options: [
          "Rising inflation",
          "Lower demand",
          "Reduced investment",
          "Economic collapse"
        ],
        answer: 0
      },
      {
        q: "What do high interest rates do?",
        options: [
          "Slow economic growth",
          "Increase spending",
          "Boost borrowing",
          "Raise wages"
        ],
        answer: 0
      },
      {
        q: "What best describes the passage?",
        options: ["Analytical", "Narrative", "Emotional", "Humorous"],
        answer: 0
      }
    ]),

    summary:
      "Interest rates affect economic (activity) by influencing borrowing and spending. Low rates can increase (inflation), while high rates help stabilize (prices).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "activity",
        options: ["activity", "tax", "market", "trade"]
      },
      {
        blank: 2,
        answer: "inflation",
        options: ["inflation", "growth", "demand", "exports"]
      },
      {
        blank: 3,
        answer: "prices",
        options: ["prices", "jobs", "income", "supply"]
      }
    ]
  }
];

function getTodayReading() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return readings[day % readings.length];
}

function build() {
  const reading = getTodayReading();

  const data = {
    date: new Date().toISOString(),
    ...reading
  };

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2));

  console.log("✅ DONE:", reading.headline);
}

build();
