function buildSummaryData(reading) {
  const sentences = splitSentences(reading).filter((sentence) => {
    const words = sentence.split(/\s+/);
    return words.length >= 8 && words.length <= 28;
  });

  const banned = new Set([
    "today", "reading", "focus", "these", "those", "this", "that",
    "because", "which", "their", "people", "about", "often", "other",
    "when", "where", "while", "with", "from", "into", "there",
    "have", "will", "would", "could", "should", "also", "more",
    "only", "some", "many", "important", "especially", "directly",
    "quickly", "closely", "enough", "future", "central", "issue",
    "main", "point", "points", "paragraph", "article"
  ]);

  function getWords(sentence) {
    return (
      sentence
        .toLowerCase()
        .match(/\b[a-z][a-z-]{4,}\b/g) || []
    ).filter((word) => !banned.has(word));
  }

  const frequency = new Map();

  for (const sentence of sentences) {
    for (const word of getWords(sentence)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }

  function scoreWord(word, sentence) {
    const freq = frequency.get(word) || 1;
    const position = sentence.toLowerCase().indexOf(word);
    const ratio = position / Math.max(sentence.length, 1);

    let score = 0;
    score += freq * 3;
    score += Math.min(word.length, 12);

    if (ratio > 0.2 && ratio < 0.8) score += 5;
    if (word.endsWith("tion") || word.endsWith("ment") || word.endsWith("ity")) {
      score += 3;
    }

    return score;
  }

  const selected = [];
  const usedWords = new Set();
  const usedSentenceIndexes = new Set();

  for (let i = 0; i < sentences.length; i++) {
    if (selected.length >= 3) break;
    if (usedSentenceIndexes.has(i)) continue;

    const sentence = sentences[i];
    const candidates = getWords(sentence)
      .filter((word) => !usedWords.has(word))
      .map((word) => ({
        word,
        score: scoreWord(word, sentence)
      }))
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) continue;

    selected.push({
      sentence,
      answer: candidates[0].word
    });

    usedWords.add(candidates[0].word);
    usedSentenceIndexes.add(i);
  }

  const summarySentences = selected.map((item) =>
    item.sentence.replace(
      new RegExp(`\\b${item.answer}\\b`, "i"),
      `(${item.answer})`
    )
  );

  const allWords = [...frequency.keys()].filter(
    (word) => !usedWords.has(word)
  );

  const summaryQuiz = selected.map((item, index) => {
    const distractors = allWords
      .filter((word) => word !== item.answer)
      .sort((a, b) => (frequency.get(b) || 0) - (frequency.get(a) || 0))
      .slice(index * 3, index * 3 + 3);

    const options = [item.answer, ...distractors].slice(0, 4);

    while (options.length < 4) {
      const fallback = ["change", "pressure", "decision", "system", "growth"];
      const next = fallback.find(
        (word) => !options.includes(word) && word !== item.answer
      );
      options.push(next || `choice${options.length + 1}`);
    }

    return {
      blank: index + 1,
      answer: item.answer,
      options: options.sort(() => Math.random() - 0.5)
    };
  });

  return {
    text: summarySentences.join(" "),
    quiz: summaryQuiz
  };
}
