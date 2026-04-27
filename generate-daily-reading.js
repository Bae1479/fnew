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
    categoryLabel: "Economics | TOEFL",
    headline: "Inflation, Purchasing Power, and Economic Pressure",

    reading: `Inflation is one of the most important concepts in modern economics because it affects almost every part of daily life. When inflation rises, the general level of prices increases, meaning that the same amount of money buys fewer goods and services than before. This loss of purchasing power can be especially difficult for households whose income does not rise at the same speed as prices.

The effects of inflation are often felt most clearly in essential areas such as food, housing, transportation, and energy. Even if official statistics show that inflation is slowing, consumers may still feel pressure because prices remain higher than they were in the past. This creates a gap between economic data and personal experience. A government report may suggest improvement, while families continue to struggle with monthly expenses.

Inflation also influences the behavior of businesses. When production costs rise, companies may increase prices to protect their profits. However, raising prices too much can reduce demand if customers begin to spend less or search for cheaper alternatives. In this way, inflation forces businesses to balance cost pressures with consumer behavior.

Central banks usually respond to high inflation by raising interest rates. Higher rates make borrowing more expensive, which can reduce spending and slow the economy. This may help control inflation, but it can also create new risks, such as weaker investment and slower job growth. Policymakers must therefore decide how strongly to act without damaging the broader economy.

Understanding inflation requires more than simply watching price numbers. It involves examining wages, expectations, business costs, consumer confidence, and monetary policy. For English learners, the topic is useful because it combines abstract economic vocabulary with real-life consequences. Inflation is not just a technical term; it is a force that shapes decisions made by households, companies, and governments.`,

    sentences: [
      {
        ko: "인플레이션은 돈의 구매력을 약화시킨다.",
        en: "Inflation reduces the purchasing power of money."
      },
      {
        ko: "물가가 오르면 가계는 지출 압박을 느낄 수 있다.",
        en: "When prices rise, households may feel pressure on their spending."
      },
      {
        ko: "중앙은행은 높은 인플레이션에 대응하기 위해 금리를 올릴 수 있다.",
        en: "Central banks may raise interest rates to respond to high inflation."
      }
    ],

    quizRaw: [
      {
        q: "What is the main idea of the passage?",
        options: [
          "Inflation affects purchasing power, behavior, and policy decisions.",
          "Inflation only affects luxury goods.",
          "Inflation always improves business profits.",
          "Inflation is unrelated to household spending."
        ],
        answer: 0
      },
      {
        q: "Why can people still feel pressure when inflation slows?",
        options: [
          "Prices may remain higher than they were before.",
          "Wages always rise faster than prices.",
          "Central banks stop monitoring inflation.",
          "Businesses stop changing prices."
        ],
        answer: 0
      },
      {
        q: "What can businesses do when production costs rise?",
        options: [
          "They may raise prices to protect profits.",
          "They always lower prices immediately.",
          "They stop responding to demand.",
          "They ignore consumer behavior."
        ],
        answer: 0
      },
      {
        q: "What is a possible risk of raising interest rates?",
        options: [
          "Slower investment and job growth",
          "Unlimited consumer spending",
          "Permanent price stability",
          "A complete end to inflation"
        ],
        answer: 0
      },
      {
        q: "The word 'purchasing power' is closest in meaning to:",
        options: [
          "the ability of money to buy goods and services",
          "the total number of banks in an economy",
          "the amount of goods a company produces",
          "the legal authority of a government"
        ],
        answer: 0
      }
    ],

    summary:
      "Inflation weakens the (purchasing power) of money by raising prices across the economy. It affects households, businesses, and central banks because price changes influence (spending), profits, and monetary (policy).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "purchasing power",
        options: ["purchasing power", "market share", "tax revenue", "labor supply"]
      },
      {
        blank: 2,
        answer: "spending",
        options: ["spending", "weather", "population", "geography"]
      },
      {
        blank: 3,
        answer: "policy",
        options: ["policy", "culture", "language", "memory"]
      }
    ]
  },

  {
    category: "World History",
    categoryLabel: "World History | TOEFL",
    headline: "The Industrial Revolution and the Transformation of Society",

    reading: `The Industrial Revolution was one of the most significant turning points in world history. Beginning in Britain in the eighteenth century, it changed how goods were produced, how people worked, and how societies were organized. Before industrialization, most production took place in small workshops or homes, but factories introduced a new system based on machines, wage labor, and large-scale production.

This transformation increased productivity dramatically. Machines could produce textiles, tools, and other goods much faster than traditional methods. As production expanded, goods became more widely available, and new industries created jobs. However, these changes also disrupted older ways of life, especially for rural communities and skilled workers whose traditional labor became less valuable.

Urbanization was one of the most visible effects of industrialization. Large numbers of people moved from villages to cities in search of factory work. Cities grew rapidly, but housing, sanitation, and public health systems often failed to keep pace. As a result, many workers lived in crowded and unhealthy conditions, even while industrial economies became wealthier.

The Industrial Revolution also changed social relationships. Factory owners gained economic power, while workers increasingly depended on wages. This created new conflicts over working hours, pay, safety, and the rights of laborers. Over time, these conflicts contributed to the rise of labor unions, social reform movements, and new political debates about inequality.

Although industrialization created hardship, it also laid the foundation for modern economic life. It accelerated technological innovation, expanded global trade, and reshaped the relationship between humans and work. The Industrial Revolution shows that progress can produce both opportunity and instability. Its legacy continues to influence modern debates about technology, labor, and social change.`,

    sentences: [
      {
        ko: "산업혁명은 생산 방식과 노동의 성격을 변화시켰다.",
        en: "The Industrial Revolution changed the methods of production and the nature of labor."
      },
      {
        ko: "많은 사람들이 공장 일을 찾기 위해 도시로 이동했다.",
        en: "Many people moved to cities in search of factory work."
      },
      {
        ko: "산업화는 기회와 불안정을 동시에 만들어냈다.",
        en: "Industrialization created both opportunity and instability."
      }
    ],

    quizRaw: [
      {
        q: "What is the main idea of the passage?",
        options: [
          "The Industrial Revolution transformed production, labor, and society.",
          "The Industrial Revolution only affected farming.",
          "Industrialization prevented urban growth.",
          "Factories reduced all social conflict."
        ],
        answer: 0
      },
      {
        q: "How did factories change production?",
        options: [
          "They introduced machines and large-scale production.",
          "They returned production to small homes.",
          "They eliminated wage labor.",
          "They made goods less available."
        ],
        answer: 0
      },
      {
        q: "What was one consequence of rapid urbanization?",
        options: [
          "Crowded and unhealthy living conditions",
          "A decline in factory work",
          "The disappearance of cities",
          "A complete end to poverty"
        ],
        answer: 0
      },
      {
        q: "What can be inferred about industrial progress?",
        options: [
          "It can create benefits while also producing social problems.",
          "It always improves life equally for everyone.",
          "It removes the need for political reform.",
          "It has no effect on social relationships."
        ],
        answer: 0
      },
      {
        q: "The word 'disrupted' is closest in meaning to:",
        options: ["disturbed", "protected", "continued", "ignored"],
        answer: 0
      }
    ],

    summary:
      "The Industrial Revolution transformed production through machines and factory labor. It increased (productivity) but also caused rapid (urbanization) and new conflicts over wages, safety, and social (inequality).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "productivity",
        options: ["productivity", "tradition", "isolation", "language"]
      },
      {
        blank: 2,
        answer: "urbanization",
        options: ["urbanization", "agriculture", "silence", "religion"]
      },
      {
        blank: 3,
        answer: "inequality",
        options: ["inequality", "weather", "navigation", "memory"]
      }
    ]
  },

  {
    category: "Humanities",
    categoryLabel: "Humanities | TOEFL",
    headline: "Why Stories Shape Human Understanding",

    reading: `Stories are one of the oldest ways human beings organize experience. Long before modern science or written history, people used stories to explain nature, remember the past, and pass values from one generation to another. A story does more than present information; it gives events a structure that helps people understand cause, consequence, and meaning.

One reason stories are powerful is that they connect abstract ideas with concrete situations. A moral rule may seem distant when stated directly, but it becomes easier to understand when shown through a character’s choice. In this way, stories allow people to explore ethical problems, social conflict, and personal identity without relying only on definitions or arguments.

Stories also influence memory. People often remember information better when it is placed within a narrative sequence. Events that are connected by a beginning, a conflict, and a resolution are easier to recall than isolated facts. This is why history, religion, literature, and even education often rely on narrative forms.

However, stories can also shape perception in misleading ways. A powerful narrative may simplify reality or make one interpretation seem inevitable. People may accept a story because it feels emotionally satisfying, even when the evidence is incomplete. For this reason, critical reading requires attention not only to what a story says, but also to what it leaves out.

The humanities study stories because they reveal how people interpret the world. Literature, philosophy, history, and cultural studies all examine how meaning is created and shared. By reading stories carefully, learners develop more than language skills. They also learn to recognize assumptions, compare perspectives, and think more deeply about human experience.`,

    sentences: [
      {
        ko: "이야기는 인간이 경험을 이해하는 오래된 방식이다.",
        en: "Stories are an ancient way for humans to understand experience."
      },
      {
        ko: "이야기는 추상적인 생각을 구체적인 상황과 연결한다.",
        en: "Stories connect abstract ideas with concrete situations."
      },
      {
        ko: "비판적 읽기는 이야기에서 빠진 부분에도 주의를 기울여야 한다.",
        en: "Critical reading must also pay attention to what a story leaves out."
      }
    ],

    quizRaw: [
      {
        q: "What is the main idea of the passage?",
        options: [
          "Stories help humans organize meaning, memory, and interpretation.",
          "Stories are useful only for entertainment.",
          "Stories always present reality perfectly.",
          "Stories are unrelated to education."
        ],
        answer: 0
      },
      {
        q: "Why do stories make abstract ideas easier to understand?",
        options: [
          "They connect ideas with concrete situations.",
          "They remove all moral questions.",
          "They avoid characters and choices.",
          "They depend only on definitions."
        ],
        answer: 0
      },
      {
        q: "How can stories affect memory?",
        options: [
          "They make information easier to recall through narrative structure.",
          "They prevent people from remembering events.",
          "They turn facts into unrelated details.",
          "They eliminate the need for sequence."
        ],
        answer: 0
      },
      {
        q: "What risk can powerful narratives create?",
        options: [
          "They may simplify reality or hide missing evidence.",
          "They always increase accuracy.",
          "They prevent emotional responses.",
          "They make interpretation impossible."
        ],
        answer: 0
      },
      {
        q: "What is the author's purpose?",
        options: [
          "To explain why stories are important in human understanding",
          "To argue that stories should be avoided",
          "To describe only one famous novel",
          "To teach grammar rules through fiction"
        ],
        answer: 0
      }
    ],

    summary:
      "Stories help people organize experience by giving events structure and meaning. They connect abstract ideas with concrete (situations), improve (memory), and require critical attention because narratives can shape (perception).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "situations",
        options: ["situations", "numbers", "machines", "exports"]
      },
      {
        blank: 2,
        answer: "memory",
        options: ["memory", "inflation", "transport", "income"]
      },
      {
        blank: 3,
        answer: "perception",
        options: ["perception", "agriculture", "currency", "temperature"]
      }
    ]
  },

  {
    category: "Science and Technology",
    categoryLabel: "Science and Technology | TOEFL",
    headline: "Artificial Intelligence and the Changing Meaning of Skill",

    reading: `Artificial intelligence is changing the way people think about skill. In the past, many professional abilities were measured by how quickly a person could complete a task, gather information, or produce written work. AI tools can now perform many of these activities rapidly, forcing workers and students to reconsider what human competence means.

One major effect of AI is the automation of routine tasks. Writing simple reports, summarizing documents, translating text, and organizing data can be done more efficiently with AI assistance. This does not mean that human skill disappears, but it shifts toward selecting good inputs, evaluating outputs, and making informed judgments.

The ability to question AI-generated information is especially important. AI systems can produce fluent sentences that sound convincing, even when the content is incomplete or inaccurate. As a result, users must develop critical judgment rather than passive dependence. The value of human thinking may increasingly lie in verification, interpretation, and ethical decision-making.

AI also changes education. If students use AI only to avoid effort, they may weaken their own learning. However, if they use it to compare explanations, revise ideas, and practice language, it can become a powerful learning tool. The difference depends on whether AI replaces thinking or supports it.

In the future, skill may be defined less by the ability to perform routine tasks and more by the ability to guide intelligent tools responsibly. People who understand both the strengths and limitations of AI will be better prepared for work and study. The central question is not whether AI can do tasks, but whether humans can use it wisely.`,

    sentences: [
      {
        ko: "AI는 사람들이 기술의 의미를 다시 생각하게 만든다.",
        en: "AI makes people reconsider the meaning of skill."
      },
      {
        ko: "AI가 만든 정보는 비판적으로 검토되어야 한다.",
        en: "AI-generated information must be evaluated critically."
      },
      {
        ko: "중요한 것은 AI가 사고를 대체하는지, 아니면 돕는지이다.",
        en: "The important question is whether AI replaces thinking or supports it."
      }
    ],

    quizRaw: [
      {
        q: "What is the main idea of the passage?",
        options: [
          "AI is changing how skill and competence are understood.",
          "AI makes human judgment unnecessary.",
          "AI should be banned from education.",
          "AI only affects factory work."
        ],
        answer: 0
      },
      {
        q: "What happens when routine tasks are automated?",
        options: [
          "Human skill shifts toward judgment and evaluation.",
          "Human skill completely disappears.",
          "People no longer need to learn.",
          "All information becomes accurate."
        ],
        answer: 0
      },
      {
        q: "Why is critical judgment important when using AI?",
        options: [
          "AI can sound convincing even when it is inaccurate.",
          "AI never produces fluent language.",
          "AI cannot organize information.",
          "AI always refuses to answer questions."
        ],
        answer: 0
      },
      {
        q: "What can be inferred about education?",
        options: [
          "AI can either weaken or support learning depending on how it is used.",
          "AI always improves learning automatically.",
          "Students should never use technology.",
          "Learning no longer requires effort."
        ],
        answer: 0
      },
      {
        q: "The word 'verification' is closest in meaning to:",
        options: ["checking accuracy", "creating fiction", "avoiding effort", "repeating words"],
        answer: 0
      }
    ],

    summary:
      "AI changes the meaning of skill by automating routine tasks and increasing the importance of human (judgment). Users must evaluate AI outputs carefully because fluent language can hide (inaccuracy), and education depends on whether AI supports or replaces (thinking).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "judgment",
        options: ["judgment", "weather", "population", "distance"]
      },
      {
        blank: 2,
        answer: "inaccuracy",
        options: ["inaccuracy", "employment", "electricity", "ownership"]
      },
      {
        blank: 3,
        answer: "thinking",
        options: ["thinking", "travel", "profit", "storage"]
      }
    ]
  },

  {
    category: "Society",
    categoryLabel: "Society | TOEFL",
    headline: "Public Trust and the Stability of Institutions",

    reading: `Public trust is essential for the stability of institutions. Governments, courts, schools, and public agencies cannot function effectively if people believe that decisions are unfair or dishonest. Trust does not require complete agreement, but it does require the belief that institutions follow rules and explain their actions clearly.

One reason trust matters is that modern societies depend on cooperation. People pay taxes, obey laws, use public services, and accept official decisions partly because they believe the system has legitimacy. When this belief weakens, even ordinary policies can become controversial. A decision that might once have been accepted may instead produce suspicion and resistance.

Trust is built through transparency and consistency. If institutions communicate clearly and apply rules fairly, people are more likely to accept difficult outcomes. On the other hand, secrecy, confusion, or unequal treatment can damage credibility. Once trust is lost, it is often difficult to restore because people begin to interpret future actions through doubt.

Information systems also affect trust. In the digital age, rumors and misleading claims can spread quickly. This makes accurate communication more important than ever. Institutions must not only make sound decisions but also explain them in ways that people can understand and verify.

The stability of society depends on more than laws and enforcement. It also depends on whether people believe that public systems deserve cooperation. For this reason, trust should be understood as a form of social infrastructure. Like roads or schools, it must be maintained carefully, or the entire system becomes weaker.`,

    sentences: [
      {
        ko: "공공 신뢰는 제도의 안정성에 필수적이다.",
        en: "Public trust is essential for the stability of institutions."
      },
      {
        ko: "제도는 자신의 결정을 명확하게 설명해야 한다.",
        en: "Institutions must explain their decisions clearly."
      },
      {
        ko: "신뢰는 사회적 기반 시설의 한 형태로 이해될 수 있다.",
        en: "Trust can be understood as a form of social infrastructure."
      }
    ],

    quizRaw: [
      {
        q: "What is the main idea of the passage?",
        options: [
          "Public trust is necessary for institutions and social stability.",
          "Public trust is unrelated to government decisions.",
          "Institutions function best when they avoid communication.",
          "Trust can be replaced entirely by punishment."
        ],
        answer: 0
      },
      {
        q: "Why do people cooperate with institutions?",
        options: [
          "They believe the system has legitimacy.",
          "They always agree with every decision.",
          "They do not need public services.",
          "They are never influenced by trust."
        ],
        answer: 0
      },
      {
        q: "What can damage institutional credibility?",
        options: [
          "Secrecy, confusion, or unequal treatment",
          "Clear communication and fairness",
          "Consistent rules",
          "Public explanation"
        ],
        answer: 0
      },
      {
        q: "What can be inferred about digital information systems?",
        options: [
          "They make accurate communication more important.",
          "They eliminate misinformation completely.",
          "They prevent public doubt.",
          "They have no effect on trust."
        ],
        answer: 0
      },
      {
        q: "The phrase 'social infrastructure' suggests that trust:",
        options: [
          "supports society in a basic and necessary way",
          "is only a private emotion",
          "is unrelated to institutions",
          "can be ignored without consequence"
        ],
        answer: 0
      }
    ],

    summary:
      "Public trust supports institutional stability by encouraging cooperation and acceptance of decisions. It depends on transparency, consistency, and clear (communication), while misinformation can weaken institutional (credibility) and social (cooperation).",

    summaryQuiz: [
      {
        blank: 1,
        answer: "communication",
        options: ["communication", "inflation", "migration", "production"]
      },
      {
        blank: 2,
        answer: "credibility",
        options: ["credibility", "temperature", "transport", "currency"]
      },
      {
        blank: 3,
        answer: "cooperation",
        options: ["cooperation", "competition", "storage", "navigation"]
      }
    ]
  }
];

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
