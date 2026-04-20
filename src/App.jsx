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

export default function App() {
  const reading = data;

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

  const renderSummary = () => {
    const words = (reading.modelSummary || "").split(" ");

    return words.map((word, i) => {
      if (!blankAnswers[i]) return <span key={i}> {word} </span>;

      return (
        <input
          key={i}
          value={blankInputs[i] || ""}
          onChange={(e) =>
            setBlankInputs((prev) => ({ ...prev, [i]: e.target.value }))
          }
          style={{
            width: 90,
            margin: "0 4px",
            padding: "4px 6px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      );
    });
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
      <h1>News Reading App</h1>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: "bold" }}>{reading.category}</div>
        <h2>{reading.title}</h2>
        <div>
          {reading.date} / {reading.source}
        </div>

        <div style={{ marginTop: 10 }}>
          <select
            value={ttsRate}
            onChange={(e) => setTtsRate(Number(e.target.value))}
            style={{ marginRight: 8 }}
          >
            <option value={0.8}>0.8x</option>
            <option value={0.9}>0.9x</option>
            <option value={0.95}>0.95x</option>
            <option value={1}>1.0x</option>
            <option value={1.1}>1.1x</option>
          </select>

          <button onClick={() => speak(reading.passage)} style={{ marginRight: 8 }}>
            ▶ 전체 듣기
          </button>
          <button onClick={stop}>■ 정지</button>
        </div>
      </div>

      <hr />

      <h2>핵심 문장 학습</h2>

      {reading.sentences?.map((s, i) => (
        <div
          key={s.id}
          style={{
            padding: 12,
            margin: "8px 0",
            border:
              selectedSentenceId === s.id ? "2px solid blue" : "1px solid #ccc",
            borderRadius: 10,
          }}
        >
          <div
            onClick={() => {
              setSelectedSentenceId(s.id);
              setShowBackAnswer(false);
            }}
            style={{ cursor: "pointer", marginBottom: 8 }}
          >
            {i + 1}. {s.text}
          </div>

          <button onClick={() => speak(s.text)}>🔊 이 문장 듣기</button>
        </div>
      ))}

      {selectedSentence && (
        <div style={{ marginTop: 20 }}>
          <h3>직역</h3>
          <div>{selectedSentence.literal}</div>

          <h3 style={{ marginTop: 16 }}>역번역</h3>
          <input
            placeholder="직접 영어로 다시 써보기"
            value={backInputs[selectedSentence.id] || ""}
            onChange={(e) =>
              setBackInputs((prev) => ({
                ...prev,
                [selectedSentence.id]: e.target.value,
              }))
            }
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={() => setShowBackAnswer((prev) => !prev)}
            style={{ marginTop: 10 }}
          >
            {showBackAnswer ? "정답 숨기기" : "정답 보기"}
          </button>

          {showBackAnswer && (
            <div style={{ marginTop: 10, color: "blue" }}>
              {selectedSentence.backTranslationAnswer}
            </div>
          )}
        </div>
      )}

      <hr />

      <h2>객관식</h2>
      {reading.questions?.map((q) => (
        <div key={q.id} style={{ marginBottom: 20 }}>
          <p>{q.question}</p>
          {q.options.map((opt, i) => (
            <label key={i} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="radio"
                checked={selectedAnswers[q.id] === i}
                onChange={() =>
                  setSelectedAnswers((prev) => ({ ...prev, [q.id]: i }))
                }
                style={{ marginRight: 8 }}
              />
              {opt}
            </label>
          ))}
          {submitted && (
            <div style={{ marginTop: 8 }}>
              정답: <strong>{q.options[q.answer]}</strong>
              <div>{q.explanation}</div>
            </div>
          )}
        </div>
      ))}

      <button onClick={() => setSubmitted(true)}>채점</button>
      {submitted && <div style={{ marginTop: 10 }}>점수: {score}</div>}

      <hr />

      <h2>요약 괄호 넣기</h2>
      <div>{renderSummary()}</div>

      <button
        onClick={() => setShowModelSummary((prev) => !prev)}
        style={{ marginTop: 12 }}
      >
        {showModelSummary ? "모범요약 숨기기" : "모범요약 보기"}
      </button>

      {showModelSummary && <p style={{ marginTop: 10 }}>{reading.modelSummary}</p>}
    </div>
  );
}
