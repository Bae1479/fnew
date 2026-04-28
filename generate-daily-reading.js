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
  // 1️⃣ Economics
{
  category: "Economics",
  categoryLabel: "Economics | TOEFL",
  headline: "Why Prices Feel Higher Even When Inflation Slows",

  reading: `Last year, many people noticed that everyday items—coffee, groceries, transportation—became more expensive. Months later, news reports began to say that inflation was “slowing.” Yet for most consumers, nothing felt cheaper. This gap between economic data and personal experience is one of the most confusing aspects of inflation.

The key is to understand that inflation measures the rate of change in prices, not the price level itself. When inflation slows, prices are still rising—they are just rising more slowly. For example, if prices increased by 10 percent last year and 5 percent this year, inflation has declined, but prices are still higher than before.

This creates a psychological effect. People remember past prices and compare them to current ones. Even if wages increase, the memory of lower prices makes current costs feel unusually high. As a result, people may feel financially worse off even when economic indicators show improvement.

Businesses respond to this environment carefully. If they lower prices too quickly, profits may fall. If they keep prices high, customers may reduce spending. This tension explains why prices rarely return to earlier levels once they have increased significantly.

Understanding this process helps explain why economic recovery can feel slow. Data may suggest progress, but lived experience changes more gradually. In this sense, inflation is not just an economic concept—it is something people feel in their daily decisions.`,

  sentences: [
    { ko: "인플레이션이 둔화되어도 가격은 여전히 오를 수 있다.", en: "Even when inflation slows, prices can still rise." },
    { ko: "사람들은 과거 가격과 현재 가격을 비교한다.", en: "People compare past prices with current ones." },
    { ko: "경제 회복은 체감적으로 더 느리게 느껴질 수 있다.", en: "Economic recovery can feel slower in real life." }
  ],

  quizRaw: [
    {
      q: "Why do people feel prices are still high?",
      options: [
        "Because prices continue to rise even when inflation slows",
        "Because prices are falling rapidly",
        "Because wages always decrease",
        "Because inflation has stopped completely"
      ],
      answer: 0
    },
    {
      q: "What does inflation measure?",
      options: [
        "The rate of price change",
        "The total number of products",
        "The size of the economy",
        "The amount of wages"
      ],
      answer: 0
    },
    {
      q: "What causes the psychological effect?",
      options: [
        "Comparing past prices with current prices",
        "Ignoring economic data",
        "Government policy",
        "Business profits"
      ],
      answer: 0
    },
    {
      q: "Why don’t prices fall easily?",
      options: [
        "Businesses try to protect profits",
        "Consumers stop buying",
        "Production increases",
        "Wages decrease"
      ],
      answer: 0
    },
    {
      q: "Main idea?",
      options: [
        "Inflation slowing does not mean prices fall",
        "Prices always return to normal",
        "Consumers control inflation",
        "Businesses ignore markets"
      ],
      answer: 0
    }
  ],

  summary: "Inflation measures the rate of (change), not price levels. Even when inflation slows, (prices) remain high, which explains why recovery feels (slow).",

  summaryQuiz: [
    { blank:1, answer:"change", options:["change","money","growth","trade"] },
    { blank:2, answer:"prices", options:["prices","jobs","exports","income"] },
    { blank:3, answer:"slow", options:["slow","fast","stable","easy"] }
  ]
},

// 2️⃣ World History
{
  category: "World History",
  categoryLabel: "World History | TOEFL",
  headline: "Why the Fall of Rome Still Matters",

  reading: `For centuries, the Roman Empire was one of the most powerful political systems in the world. It controlled vast territories, built advanced infrastructure, and influenced law, language, and culture. Yet despite its strength, the empire eventually collapsed in the West. This raises an important question: how can a powerful system fail?

The fall of Rome was not caused by a single event. Instead, it was the result of many overlapping problems. Economic pressure, military challenges, political instability, and administrative complexity all weakened the system over time. As the empire expanded, it became more difficult to manage distant regions effectively.

Another key factor was internal division. Power struggles among leaders reduced stability, while economic inequality increased dissatisfaction among citizens. These internal weaknesses made the empire less able to respond to external threats.

At the same time, Rome faced pressure from outside groups. These groups did not destroy the empire instantly, but they exposed its vulnerabilities. A system that had once seemed strong was no longer able to adapt.

The fall of Rome remains important because it shows that power alone does not guarantee stability. Complex systems can fail when internal and external pressures combine. This lesson continues to shape how people think about governments and institutions today.`,

  sentences: [
    { ko: "로마 제국은 매우 강력한 체제였다.", en: "The Roman Empire was a powerful system." },
    { ko: "붕괴는 여러 요인이 결합된 결과였다.", en: "Its collapse was caused by multiple factors." },
    { ko: "강력함이 항상 안정성을 보장하지는 않는다.", en: "Power does not always guarantee stability." }
  ],

  quizRaw: [
    {
      q: "Why did Rome fall?",
      options: [
        "Because of multiple combined factors",
        "Because of one sudden event",
        "Because of weather changes",
        "Because of population growth"
      ],
      answer: 0
    },
    {
      q: "What weakened Rome internally?",
      options: [
        "Political conflict and inequality",
        "Strong leadership",
        "Stable economy",
        "Unified power"
      ],
      answer: 0
    },
    {
      q: "What role did external groups play?",
      options: [
        "They exposed weaknesses",
        "They had no effect",
        "They improved stability",
        "They supported Rome"
      ],
      answer: 0
    },
    {
      q: "Main lesson?",
      options: [
        "Power does not ensure stability",
        "Empires never fall",
        "Growth always helps",
        "Conflict is unnecessary"
      ],
      answer: 0
    },
    {
      q: "Tone?",
      options: ["Analytical","Emotional","Funny","Narrative"],
      answer: 0
    }
  ],

  summary: "Rome fell due to multiple (factors), including internal weakness and external pressure. The case shows that power does not guarantee (stability) in complex (systems).",

  summaryQuiz: [
    { blank:1, answer:"factors", options:["factors","people","events","cities"] },
    { blank:2, answer:"stability", options:["stability","growth","wealth","trade"] },
    { blank:3, answer:"systems", options:["systems","roads","laws","armies"] }
  ]
},

// 3️⃣ Humanities
{
  category: "Humanities",
  categoryLabel: "Humanities | TOEFL",
  headline: "Why People Remember Stories More Than Facts",

  reading: `Think about the last time you tried to remember a list of facts. Now compare that to remembering a story. For most people, stories are easier to recall. This difference reveals something important about how the human mind works.

Stories organize information into a sequence. Instead of isolated details, they provide connections between events. A beginning creates context, a middle introduces tension, and an ending provides resolution. This structure helps the brain store and retrieve information more efficiently.

Stories also involve emotion. When people feel curiosity, surprise, or empathy, they pay closer attention. This emotional engagement strengthens memory. In contrast, information without context or feeling is more likely to be forgotten.

However, stories can also shape understanding in misleading ways. A simple narrative may ignore complexity or leave out important details. People may accept a story because it feels true, not because it is complete.

For this reason, learning requires both narrative understanding and critical thinking. Stories help us remember, but analysis helps us evaluate. Together, they allow us to understand information more deeply.`,

  sentences: [
    { ko: "이야기는 사실보다 기억하기 쉽다.", en: "Stories are easier to remember than facts." },
    { ko: "이야기는 정보를 구조화한다.", en: "Stories organize information." },
    { ko: "감정은 기억을 강화한다.", en: "Emotion strengthens memory." }
  ],

  quizRaw: [
    {
      q: "Why are stories easier to remember?",
      options: [
        "They organize information and create connections",
        "They remove all details",
        "They avoid emotion",
        "They simplify memory completely"
      ],
      answer: 0
    },
    {
      q: "What strengthens memory?",
      options: ["Emotion","Silence","Distance","Time"],
      answer: 0
    },
    {
      q: "What is a risk of stories?",
      options: ["They can oversimplify reality","They remove emotion","They prevent memory","They avoid meaning"],
      answer: 0
    },
    {
      q: "Main idea?",
      options: ["Stories aid memory but require critical thinking","Stories replace facts","Facts are useless","Memory is fixed"],
      answer: 0
    },
    {
      q: "Tone?",
      options: ["Explanatory","Funny","Story","Emotional"],
      answer: 0
    }
  ],

  summary: "Stories help memory by organizing (information) and using (emotion), but they can oversimplify reality, so critical (thinking) is needed.",

  summaryQuiz: [
    { blank:1, answer:"information", options:["information","money","labor","policy"] },
    { blank:2, answer:"emotion", options:["emotion","logic","speed","data"] },
    { blank:3, answer:"thinking", options:["thinking","movement","growth","change"] }
  ]
},

// 4️⃣ Science & Tech
{
  category: "Science & Technology",
  categoryLabel: "Science & Technology | TOEFL",
  headline: "Why AI Feels Smart Even When It Is Wrong",

  reading: `Artificial intelligence systems often produce answers that sound confident and fluent. This creates the impression that the system truly understands the information it provides. However, the reality is more complex.

AI models generate responses by predicting patterns in language. They do not “know” facts in the way humans do. Instead, they rely on probability, selecting words that are most likely to follow previous ones. This allows them to produce natural-sounding sentences.

The problem is that fluency can hide mistakes. An answer may sound correct even when it contains errors or incomplete reasoning. Because of this, users may trust information too quickly without checking its accuracy.

This creates a new kind of skill requirement. Instead of only gathering information, people must learn to evaluate it. Critical thinking becomes more important than simple access to knowledge.

Understanding how AI works helps reduce overconfidence in its outputs. It reminds users that technology can assist thinking, but it should not replace it. In the end, human judgment remains essential.`,

  sentences: [
    { ko: "AI는 종종 자신감 있게 보인다.", en: "AI often appears confident." },
    { ko: "AI는 패턴을 기반으로 작동한다.", en: "AI operates based on patterns." },
    { ko: "비판적 사고가 중요해진다.", en: "Critical thinking becomes important." }
  ],

  quizRaw: [
    {
      q: "Why does AI seem intelligent?",
      options: [
        "It produces fluent language",
        "It understands everything",
        "It never makes mistakes",
        "It avoids patterns"
      ],
      answer: 0
    },
    {
      q: "What is a limitation?",
      options: ["It can sound correct while being wrong","It stops responding","It avoids language","It deletes data"],
      answer: 0
    },
    {
      q: "What skill is needed?",
      options: ["Critical thinking","Speed","Memory","Repetition"],
      answer: 0
    },
    {
      q: "Main idea?",
      options: ["AI sounds smart but requires evaluation","AI replaces humans","AI is perfect","AI avoids mistakes"],
      answer: 0
    },
    {
      q: "Tone?",
      options: ["Analytical","Funny","Narrative","Emotional"],
      answer: 0
    }
  ],

  summary: "AI appears intelligent because of fluent (language), but it relies on patterns and may produce (errors), making critical (thinking) essential.",

  summaryQuiz: [
    { blank:1, answer:"language", options:["language","data","money","power"] },
    { blank:2, answer:"errors", options:["errors","growth","speed","memory"] },
    { blank:3, answer:"thinking", options:["thinking","running","buying","selling"] }
  ]
},

// 5️⃣ Society
{
  category: "Society",
  categoryLabel: "Society | TOEFL",
  headline: "Why Trust in Institutions Is Hard to Rebuild",

  reading: `Trust in institutions does not disappear suddenly. It usually declines gradually as people begin to question fairness, transparency, or competence. Small doubts accumulate over time until confidence weakens.

Once trust is lost, rebuilding it becomes difficult. People no longer interpret actions in a neutral way. Instead, they view decisions through suspicion. Even positive changes may be questioned.

Communication plays a key role in this process. Clear explanations can maintain trust, while confusion can damage it. In modern societies, information spreads quickly, making it harder to control public perception.

Institutions must therefore act consistently. If rules appear to change depending on the situation, people may believe the system is unfair. Consistency helps restore credibility.

Trust is important because it supports cooperation. Without it, even simple decisions can become conflicts. For this reason, trust is not just a social value—it is a foundation for stability.`,

  sentences: [
    { ko: "신뢰는 점진적으로 약해진다.", en: "Trust declines gradually." },
    { ko: "신뢰를 회복하는 것은 어렵다.", en: "Rebuilding trust is difficult." },
    { ko: "신뢰는 협력을 가능하게 한다.", en: "Trust enables cooperation." }
  ],

  quizRaw: [
    {
      q: "Why is trust hard to rebuild?",
      options: [
        "People interpret actions with suspicion",
        "Trust never changes",
        "Institutions stop working",
        "Communication disappears"
      ],
      answer: 0
    },
    {
      q: "What weakens trust?",
      options: ["Unclear communication","Clear rules","Consistency","Transparency"],
      answer: 0
    },
    {
      q: "Why is trust important?",
      options: ["It supports cooperation","It increases conflict","It removes decisions","It stops systems"],
      answer: 0
    },
    {
      q: "Main idea?",
      options: ["Trust is fragile and essential","Trust is unnecessary","Trust is fixed","Trust cannot change"],
      answer: 0
    },
    {
      q: "Tone?",
      options: ["Analytical","Funny","Story","Emotional"],
      answer: 0
    }
  ],

  summary: "Trust declines gradually and is difficult to rebuild because people interpret actions with (suspicion). It depends on clear communication and supports social (cooperation) and (stability).",

  summaryQuiz: [
    { blank:1, answer:"suspicion", options:["suspicion","growth","money","speed"] },
    { blank:2, answer:"cooperation", options:["cooperation","competition","travel","storage"] },
    { blank:3, answer:"stability", options:["stability","movement","heat","light"] }
  ]
}
 ]
/**
 * 날짜 기준으로 리딩 선택
 */
function getTodayReading() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return readings[day % readings.length];
}

/**
 * 실행
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
