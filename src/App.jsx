import React, { useMemo, useState } from "react";
import data from "./todayReading.json";

function buildBlankMeta(summary, maxBlanks = 5) {
  const words = summary.split(" ");
  const candidates = words
    .map((word, index) => ({
      word,
      index,
      clean: word.replace(/[^a-zA-Z]/g, ""),
    }))
    .filter(
      ({ clean, index }) =>
        clean.length >= 5 && index > 1 && index < words.length - 1
    );

  const picked = [];
  for (let i = 0; i < candidates.length && picked.length < maxBlanks; i += 2) {
    picked.push(candidates[i]);
  }

  return picked.reduce((acc, item) => {
    acc[item.index] = item.clean;
    return acc;
  }, {});
}

const steps = [
  { id: 1, label: "Reading" },
  { id: 2, label: "Key Sentences" },
  { id: 3, label: "Quiz" },
  { id: 4, label: "Summary" },
];

export default function App() {
  const reading = data;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSentenceId, setSelectedSentenceId] = useState(
    reading.sentences?.[0]?.id
  );
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [blankInputs, setBlankInputs] = useState({});
  const [showModelSummary, setShowModelSummary] = useState(false);
  const [backInputs, setBackInputs] = useState({});
  const [showBackAnswer, setShowBackAnswer] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.95);

  const blankAnswers = useMemo(
    () => buildBlankMeta(reading.modelSummary || ""),
    [reading.modelSummary]
  );

  const selectedSentence = reading.sentences?.find(
    (s) => s.id === selectedSentenceId
  );

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = ttsRate;
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  };

  const score =
    reading.questions?.reduce(
      (acc, q) => acc + (selectedAnswers[q.id] === q.answer ? 1 : 0),
      0
    ) || 0;

  const allAnswered =
    reading.questions?.length > 0 &&
    reading.questions.every((q) => selectedAnswers[q.id] !== undefined);

  const renderSummary = () => {
    const words = (reading.modelSummary || "").split(" ");

    return words.map((word, i) => {
      if (!blankAnswers[i]) {
        return (
          <span key={i} style={styles.summaryWord}>
            {word}
          </span>
        );
      }

      return (
        <input
          key={i}
          value={blankInputs[i] || ""}
          onChange={(e) =>
            setBlankInputs((prev) => ({ ...prev, [i]: e.target.value }))
          }
          style={styles.blankInput}
        />
      );
    });
  };

  const goPrev = () => setCurrentStep((prev) => Math.max(1, prev - 1));
  const goNext = () => setCurrentStep((prev) => Math.min(4, prev + 1));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.hero}>
          <div>
            <div style={styles.badge}>{reading.category}</div>
            <h1 style={styles.title}>News Reading App</h1>
            <p style={styles.subtitle}>
              Daily reading · TTS · 핵심문장 · 객관식 · 요약
            </p>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.metaCard}>
              <div style={styles.metaLabel}>Today</div>
              <div style={styles.metaTitle}>{reading.title}</div>
              <div style={styles.metaSub}>
                {reading.date} · {reading.source}
              </div>
            </div>
          </div>
        </header>

        <section style={styles.stepBar}>
          {steps.map((step) => {
            const active = currentStep === step.id;
            const done = currentStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                style={{
                  ...styles.stepButton,
                  ...(active ? styles.stepButtonActive : {}),
                  ...(done ? styles.stepButtonDone : {}),
                }}
              >
                <span style={styles.stepNumber}>{step.id}</span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </section>

        {currentStep === 1 && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Step 1. Reading</h2>
                <p style={styles.cardDesc}>
                  오늘의 리딩을 전체로 읽고, 들으면서 흐름을 먼저 잡아요.
                </p>
              </div>

              <div style={styles.controlRow}>
                <select
                  value={ttsRate}
                  onChange={(e) => setTtsRate(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={0.8}>0.8x</option>
                  <option value={0.9}>0.9x</option>
                  <option value={0.95}>0.95x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.1}>1.1x</option>
                </select>

                <button
                  onClick={() => speak(reading.passage)}
                  style={styles.primaryButton}
                >
                  ▶ 전체 듣기
                </button>
                <button onClick={stop} style={styles.secondaryButton}>
                  ■ 정지
                </button>
              </div>
            </div>

            <div style={styles.readingHeader}>
              <h3 style={styles.readingTitle}>{reading.title}</h3>
            </div>

            <div style={styles.passageBox}>
              {String(reading.passage)
                .split(/(?<=[.!?])\s+/)
                .filter(Boolean)
                .map((sentence, idx) => (
                  <p key={idx} style={styles.paragraph}>
                    {sentence}
                  </p>
                ))}
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Step 2. Key Sentences</h2>
                <p style={styles.cardDesc}>
                  핵심 문장을 클릭해서 직역을 보고, 역번역을 직접 써봐요.
                </p>
              </div>
            </div>

            <div style={styles.keyGrid}>
              <div style={styles.leftPane}>
                {reading.sentences?.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      ...styles.sentenceCard,
                      ...(selectedSentenceId === s.id
                        ? styles.sentenceCardActive
                        : {}),
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelectedSentenceId(s.id);
                        setShowBackAnswer(false);
                      }}
                      style={styles.sentenceText}
                    >
                      <span style={styles.sentenceIndex}>{i + 1}</span>
                      {s.text}
                    </div>

                    <button
                      onClick={() => speak(s.text)}
                      style={styles.smallButton}
                    >
                      🔊 이 문장 듣기
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.rightPane}>
                {selectedSentence && (
                  <>
                    <div style={styles.studyBlock}>
                      <div style={styles.studyLabel}>직역</div>
                      <div style={styles.studyText}>{selectedSentence.literal}</div>
                    </div>

                    <div style={styles.studyBlock}>
                      <div style={styles.studyLabel}>역번역</div>
                      <textarea
                        placeholder="직접 영어로 다시 써보기"
                        value={backInputs[selectedSentence.id] || ""}
                        onChange={(e) =>
                          setBackInputs((prev) => ({
                            ...prev,
                            [selectedSentence.id]: e.target.value,
                          }))
                        }
                        style={styles.textarea}
                      />
                      <button
                        onClick={() => setShowBackAnswer((prev) => !prev)}
                        style={styles.secondaryButton}
                      >
                        {showBackAnswer ? "정답 숨기기" : "정답 보기"}
                      </button>

                      {showBackAnswer && (
                        <div style={styles.answerBox}>
                          {selectedSentence.backTranslationAnswer}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Step 3. Quiz</h2>
                <p style={styles.cardDesc}>
                  객관식으로 내용 이해를 확인해요.
                </p>
              </div>

              {submitted && (
                <div style={styles.scoreBadge}>
                  점수 {score} / {reading.questions.length}
                </div>
              )}
            </div>

            {reading.questions?.map((q, qIndex) => (
              <div key={q.id} style={styles.quizCard}>
                <div style={styles.quizNumber}>Q{qIndex + 1}</div>
                <div style={styles.quizQuestion}>{q.question}</div>

                <div style={styles.options}>
                  {q.options.map((opt, i) => {
                    const selected = selectedAnswers[q.id] === i;
                    const correct = submitted && q.answer === i;
                    const wrong = submitted && selected && q.answer !== i;

                    return (
                      <label
                        key={i}
                        style={{
                          ...styles.option,
                          ...(selected ? styles.optionSelected : {}),
                          ...(correct ? styles.optionCorrect : {}),
                          ...(wrong ? styles.optionWrong : {}),
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedAnswers[q.id] === i}
                          onChange={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: i,
                            }))
                          }
                          style={{ marginRight: 8 }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div style={styles.explanation}>
                    <div>
                      정답: <strong>{q.options[q.answer]}</strong>
                    </div>
                    <div style={{ marginTop: 6 }}>{q.explanation}</div>
                  </div>
                )}
              </div>
            ))}

            <div style={styles.actionRow}>
              <button
                onClick={() => setSubmitted(true)}
                style={{
                  ...styles.primaryButton,
                  opacity: allAnswered ? 1 : 0.55,
                  cursor: allAnswered ? "pointer" : "not-allowed",
                }}
                disabled={!allAnswered}
              >
                채점하기
              </button>
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setSubmitted(false);
                }}
                style={styles.secondaryButton}
              >
                다시 풀기
              </button>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Step 4. Summary</h2>
                <p style={styles.cardDesc}>
                  모범요약의 핵심 단어를 직접 채워보세요.
                </p>
              </div>
            </div>

            <div style={styles.summaryCard}>{renderSummary()}</div>

            <button
              onClick={() => setShowModelSummary((prev) => !prev)}
              style={{ ...styles.secondaryButton, marginTop: 16 }}
            >
              {showModelSummary ? "모범요약 숨기기" : "모범요약 보기"}
            </button>

            {showModelSummary && (
              <div style={styles.modelSummary}>
                {reading.modelSummary}
              </div>
            )}
          </section>
        )}

        <div style={styles.bottomNav}>
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            style={{
              ...styles.secondaryButton,
              opacity: currentStep === 1 ? 0.45 : 1,
              cursor: currentStep === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← 이전
          </button>

          <div style={styles.stepHint}>
            Step {currentStep} / {steps.length}
          </div>

          <button
            onClick={goNext}
            disabled={currentStep === 4}
            style={{
              ...styles.primaryButton,
              opacity: currentStep === 4 ? 0.45 : 1,
              cursor: currentStep === 4 ? "not-allowed" : "pointer",
            }}
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f4f7ff 0%, #eef2ff 35%, #f8fafc 100%)",
    padding: "28px 16px 56px",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    color: "#111827",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
    alignItems: "stretch",
    marginBottom: 18,
  },
  badge: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#4338ca",
    fontWeight: 700,
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 16,
  },
  heroRight: {
    display: "flex",
    alignItems: "stretch",
  },
  metaCard: {
    width: "100%",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 10,
  },
  metaTitle: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.35,
    marginBottom: 10,
  },
  metaSub: {
    color: "#6b7280",
    fontSize: 14,
  },
  stepBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 18,
  },
  stepButton: {
    border: "1px solid #dbe4ff",
    background: "#ffffff",
    borderRadius: 18,
    padding: "14px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  },
  stepButtonActive: {
    background: "#312e81",
    color: "#fff",
    border: "1px solid #312e81",
  },
  stepButtonDone: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
  },
  stepNumber: {
    display: "inline-flex",
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.22)",
    fontSize: 13,
    fontWeight: 800,
  },
  card: {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(12px)",
    borderRadius: 28,
    border: "1px solid #e5e7eb",
    padding: 24,
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
    marginBottom: 18,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  cardTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  cardDesc: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 15,
  },
  controlRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  select: {
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
  },
  primaryButton: {
    border: "none",
    background: "#312e81",
    color: "#fff",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 700,
    fontSize: 14,
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 700,
    fontSize: 14,
  },
  readingHeader: {
    marginBottom: 16,
  },
  readingTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.3,
    fontWeight: 800,
  },
  passageBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
  },
  paragraph: {
    margin: "0 0 14px",
    fontSize: 16,
    lineHeight: 1.9,
    color: "#1f2937",
  },
  keyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  leftPane: {
    display: "grid",
    gap: 12,
  },
  rightPane: {
    display: "grid",
    gap: 16,
  },
  sentenceCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },
  sentenceCardActive: {
    border: "2px solid #4f46e5",
    background: "#eef2ff",
  },
  sentenceText: {
    cursor: "pointer",
    lineHeight: 1.8,
    marginBottom: 12,
    fontSize: 16,
  },
  sentenceIndex: {
    display: "inline-flex",
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#c7d2fe",
    color: "#312e81",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    marginRight: 10,
    fontSize: 13,
  },
  smallButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 12,
    padding: "9px 12px",
    fontWeight: 700,
  },
  studyBlock: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
  },
  studyLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#4f46e5",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  studyText: {
    lineHeight: 1.85,
    fontSize: 16,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 12,
  },
  answerBox: {
    marginTop: 12,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#312e81",
    borderRadius: 14,
    padding: 14,
    lineHeight: 1.7,
  },
  scoreBadge: {
    background: "#111827",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 800,
  },
  quizCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    background: "#fafafa",
  },
  quizNumber: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#3730a3",
    borderRadius: 999,
    padding: "5px 10px",
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 10,
  },
  quizQuestion: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  options: {
    display: "grid",
    gap: 10,
  },
  option: {
    display: "block",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
    cursor: "pointer",
  },
  optionSelected: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
  },
  optionCorrect: {
    border: "1px solid #86efac",
    background: "#f0fdf4",
  },
  optionWrong: {
    border: "1px solid #fca5a5",
    background: "#fff1f2",
  },
  explanation: {
    marginTop: 12,
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    padding: 12,
    lineHeight: 1.7,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  summaryCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    lineHeight: 2.2,
  },
  summaryWord: {
    marginRight: 6,
    fontSize: 16,
  },
  blankInput: {
    width: 92,
    margin: "0 4px",
    padding: "6px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
  },
  modelSummary: {
    marginTop: 14,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 16,
    padding: 16,
    lineHeight: 1.8,
    color: "#312e81",
  },
  bottomNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  stepHint: {
    fontWeight: 800,
    color: "#4b5563",
  },
};
