"use client";

import { useState } from "react";

export type ScreeningQuestion = { id: string; text: string; type: "text" | "number"; required: boolean };

type Props = {
  questions: ScreeningQuestion[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (answers: Record<string, string>) => void;
};

export default function ScreeningQuestionsModal({ questions, submitting, onCancel, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const missingRequired = questions.some((q) => q.required && !(answers[q.id] || "").trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired) return;
    onSubmit(answers);
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,33,61,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 460,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1.5px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ marginBottom: 6, fontSize: 19 }}>قبل ما تقدّم...</h2>
        <p style={{ color: "#4A5568", fontSize: 13.5, marginBottom: 16 }}>
          صاحب العمل حاطط الأسئلة دي عشان يقدر يقيّم طلبك بشكل أفضل.
        </p>

        <form onSubmit={handleSubmit}>
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13.5, fontWeight: 600 }}>
                {q.text}
                {q.required && <span style={{ color: "#B03A14" }}> *</span>}
              </label>
              <input
                type={q.type === "number" ? "number" : "text"}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                required={q.required}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting || missingRequired}
            style={{
              width: "100%",
              padding: "12px",
              background: "#14213D",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: submitting || missingRequired ? "not-allowed" : "pointer",
              opacity: submitting || missingRequired ? 0.6 : 1,
              marginTop: 6,
            }}
          >
            {submitting ? "جاري الإرسال..." : "إرسال التقديم"}
          </button>
        </form>
      </div>
    </div>
  );
}
