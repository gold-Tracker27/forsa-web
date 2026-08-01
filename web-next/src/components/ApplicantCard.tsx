"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeEntries, SkillEntry } from "@/lib/profileFields";
import { MILITARY_STATUS_LABELS, SKILL_LEVELS, LANGUAGE_LEVELS } from "@/lib/constants";
import {
  jobCardContainerStyle,
  tagStyle,
  ghostActionStyle,
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
  APPLICATION_STATUS_STYLES,
  applicationStatusOf,
} from "@/lib/jobCardStyles";
import { TagIcon, PinIcon, BriefcaseIcon, ShieldIcon, DocumentIcon } from "./icons";

type ScreeningQuestion = { id: string; text: string; type: "text" | "number"; required: boolean };

type Props = {
  applicant: { seekerSnapshot?: any; screeningAnswers?: Record<string, string>; jobPostId?: string; seekerId?: string; status?: string };
  screeningQuestions?: ScreeningQuestion[];
};

// نسخة مكبّرة من tagStyle/ghostActionStyle المشتركة، خاصة بكارت المتقدم بس — عشان متأثرش على كروت الوظائف في باقي الموقع
const bigTagStyle: React.CSSProperties = { ...tagStyle, fontSize: 14, padding: "4px 12px" };
const bigGhostActionStyle: React.CSSProperties = { ...ghostActionStyle, fontSize: 15, padding: "10px 16px" };

export default function ApplicantCard({ applicant: a, screeningQuestions }: Props) {
  const s = a.seekerSnapshot || {};
  const skills = normalizeEntries(s.skills);
  const languages = normalizeEntries(s.languages);

  const [status, setStatus] = useState<ApplicationStatus>(applicationStatusOf(a));
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  async function handleStatusChange(newStatus: ApplicationStatus) {
    if (!a.jobPostId || !a.seekerId) {
      setStatusError("متقدرش نحدّث الحالة — بيانات التقديم ناقصة");
      return;
    }
    const previous = status;
    setStatus(newStatus);
    setSavingStatus(true);
    setStatusError("");
    try {
      await updateDoc(doc(db, "applications", `${a.jobPostId}_${a.seekerId}`), { status: newStatus });
    } catch (err) {
      console.error("[ApplicantCard] فشل تحديث حالة التقديم", err);
      setStatus(previous);
      setStatusError("حصلت مشكلة، حاول تاني");
    }
    setSavingStatus(false);
  }

  return (
    <div style={{ ...jobCardContainerStyle, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {s.photoURL && (
            <img
              src={s.photoURL}
              alt={s.fullName || "المتقدم"}
              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }}
            />
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#14213D" }}>{s.fullName || "بدون اسم"}</h4>
            {s.jobTitle && <div style={{ fontSize: 16, color: "#4A5568" }}>{s.jobTitle}</div>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...sectionLabelStyle, fontSize: 16, marginBottom: 0 }}>حالة المتقدم:</span>
            <select
              value={status}
              disabled={savingStatus}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              style={{
                ...APPLICATION_STATUS_STYLES[status],
                fontSize: 14,
                padding: "6px 12px",
                border: "1px solid rgba(20,33,61,0.15)",
                cursor: savingStatus ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {APPLICATION_STATUS_ORDER.map((key) => (
                <option key={key} value={key}>
                  {APPLICATION_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          {savingStatus && <span style={{ fontSize: 11.5, color: "#4A5568" }}>جاري الحفظ...</span>}
          {statusError && <span style={{ fontSize: 11.5, color: "#B03A14" }}>{statusError}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {s.specialization && <span style={bigTagStyle}><TagIcon size={15} /> التخصص: {s.specialization}</span>}
        <span style={bigTagStyle}><PinIcon size={15} /> المحافظة: {s.city || ""} - {s.governorate || ""}</span>
        <span style={bigTagStyle}><BriefcaseIcon size={15} /> سنوات الخبرة: {s.yearsOfExperience || 0} سنوات</span>
        {s.militaryStatus && <span style={bigTagStyle}><ShieldIcon size={15} /> موقف التجنيد: {MILITARY_STATUS_LABELS[s.militaryStatus] || s.militaryStatus}</span>}
      </div>

      {skills.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={sectionLabelStyle}>المهارات</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {skills.map((skill, i) => (
              <EntryTag key={i} entry={skill} levelLabels={SKILL_LEVELS} />
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={sectionLabelStyle}>اللغات</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {languages.map((lang, i) => (
              <EntryTag key={i} entry={lang} levelLabels={LANGUAGE_LEVELS} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #14213D14", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 16 }}>📞 <strong>{s.phone || "—"}</strong></div>
        {s.email && <div style={{ fontSize: 16 }}>✉️ {s.email}</div>}
        {s.cvFileURL && (
          <a
            href={s.cvFileURL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...bigGhostActionStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              marginTop: 6,
            }}
          >
            <DocumentIcon size={17} /> عرض السيرة الذاتية
          </a>
        )}
      </div>

      {a.screeningAnswers && screeningQuestions && screeningQuestions.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #14213D14" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 8, color: "#14213D" }}>إجابات أسئلة الفرز</div>
          {screeningQuestions.map((q) =>
            a.screeningAnswers![q.id] ? (
              <div key={q.id} style={{ fontSize: 15, marginTop: 6 }}>
                <strong>{q.text}:</strong> {a.screeningAnswers![q.id]}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function EntryTag({ entry, levelLabels }: { entry: SkillEntry; levelLabels: Record<string, string> }) {
  return (
    <span style={bigTagStyle}>
      {entry.name}
      {entry.level && (
        <span style={{ color: "#4A5568", fontSize: 13 }}> · {levelLabels[entry.level] || entry.level}</span>
      )}
    </span>
  );
}

const sectionLabelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#4A5568", marginBottom: 6 };
