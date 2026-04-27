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
    categoryLabel: "Economics",
    headline: "Interest Rates and the Complex Dynamics of Economic Control",

    reading: `Interest rates, which are determined by central banks, play a central role in shaping the broader economic environment. Rather than simply influencing borrowing costs, they function as a mechanism through which policymakers attempt to regulate economic growth, inflation, and financial stability. As a result, even small adjustments in interest rates can produce significant ripple effects across multiple sectors.

When interest rates are reduced, borrowing becomes more accessible, thereby encouraging both consumer spending and business investment. In such conditions, firms are more likely to expand operations, while households may increase their consumption through loans and credit. Consequently, economic activity tends to accelerate, often leading to higher levels of employment and output.

However, this expansionary effect is not without risks. When borrowing becomes excessively easy, it may result in an overextension of credit, which can drive asset prices beyond their fundamental values. In addition, an increase in demand without a corresponding rise in supply can generate inflationary pressure, gradually eroding purchasing power. For this reason, central banks must carefully monitor economic indicators when maintaining low interest rates.

In contrast, higher interest rates tend to restrict borrowing and reduce overall demand. This contractionary effect can help control inflation, particularly in situations where price levels are rising too rapidly. Nevertheless, if rates are increased too aggressively, economic growth may slow to the point of stagnation, or even decline into recession. Thus, policymakers must weigh the benefits of price stability against the potential costs to economic expansion.

Ultimately, the management of interest rates requires a delicate balance between competing objectives. Central banks must consider not only current economic conditions but also expectations about future developments. In this context, interest rate policy becomes less of a precise tool and more of a strategic judgment, reflecting the inherent uncertainty and complexity of modern economies.`,

    sentences: [
      {
        ko: "금리는 경제 전반에 영향을 미치는 중요한 정책 도구이다.",
        en: "Interest rates serve as a crucial policy tool that influences the broader economic environment."
      },
      {
        ko: "낮은 금리는 소비와 투자를 촉진할 수 있다.",
        en: "Lower interest rates can stimulate both consumer spending and business investment."
      },
      {
        ko: "금리 정책은 미래에 대한 기대까지 고려해야 한다.",
        en: "Interest rate policy must also take into account expectations about future economic conditions."
      }
    ],

    quiz: buildQuiz([
      {
        q: "What is the main idea of the passage?",
        options: [
          "Interest rates are a complex tool for managing economic conditions",
          "Low interest rates always improve the economy",
          "Inflation cannot be controlled by central banks",
          "Economic growth depends only on consumer spending"
        ],
        answer: 0
      },
      {
        q: "Why can low interest rates be risky?",
        options: [
          "They may lead to excessive borrowing and inflation",
          "They reduce employment levels",
          "They eliminate investment opportunities",
          "They decrease consumer demand"
        ],
        answer: 0
      },
      {
        q: "What does the word 'contractionary' most nearly mean in context?",
        options: [
          "Reducing economic activity",
          "Expanding economic growth",
          "Increasing inflation",
          "Stabilizing markets"
        ],
        answer: 0
      },
      {
        q: "What can be inferred about central bank decisions?",
        options: [
          "They involve uncertainty and require judgment",
          "They are always predictable",
          "They only depend on current data",
          "They ignore future expectations"
        ],
        answer: 0
      },
      {
        q: "What is the author's purpose?",
        options: [
          "To explain how interest rates influence economic dynamics",
          "To criticize central banks",
          "To argue for higher interest rates",
          "To describe financial markets only"
        ],
        answer: 0
      }
    ]),

    summary:
      "Interest rates function as a tool for managing economic (activity) by influencing borrowing and demand. While low rates can stimulate growth, they may also create (inflation), whereas higher rates can stabilize (prices) but slow the economy.",

    summaryQuiz: [
      {
        blank: 1,
        answer: "activity",
        options: ["activity", "policy", "market", "trade"]
      },
      {
        blank: 2,
        answer: "inflation",
        options: ["inflation", "growth", "demand", "employment"]
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

  fs.writeFileSync("todayReading.json", JSON.stringify(data, null, 2), "utf8");

  console.log("✅ DONE:", reading.headline);
}

build();
