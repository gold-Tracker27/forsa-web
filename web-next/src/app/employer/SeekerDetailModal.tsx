"use client";

import { useState } from "react";
import { MILITARY_STATUS_LABELS, SKILL_LEVELS, LANGUAGE_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import { normalizeEntries, formatEntries } from "@/lib/profileFields";
import UpgradeModal from "./UpgradeModal";

const EDUCATION_LABELS: Record<string, string> = {
  none: "بدون مؤهل دراسي",
  literacy: "محو أمية",
  primary: "ابتدائية",
  preparatory: "إعدادية",
  secondary: "ثانوية عامة / دبلوم",
  bachelor: "بكالوريوس/ليسانس",
  master: "ماجستير",
  phd: "دكتوراه",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  remote: "عن بعد",
  freelance: "فريلانس",
  no_preference: "لا يوجد تفضيل",
};

type Props = {
  seeker: any;
  employerPlan: string;
  onClose: () => void;
};

export default function SeekerDetailModal({ seeker: s, employerPlan, onClose }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPremium = employerPlan === "premium";

  const skills = normalizeEntries(s.skills);
  const languages = normalizeEntries(s.languages);
  const workExperience = s.workExperience || [];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,33,61,0.55)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
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

          {s.photoURL && (
            <img src={s.photoURL} alt={s.fullName || "باحث عن عمل"} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "50%", marginBottom: 14 }} />
          )}
          <h2 style={{ marginBottom: 4 }}>{s.fullName || "بدون اسم"}</h2>
          <div style={{ color: "#4A5568", marginBottom: 12 }}>{s.jobTitle || ""}</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {s.specialization && <span style={tagStyle}>{s.specialization}</span>}
            {(s.city || s.governorate) && <span style={tagStyle}>{s.city} - {s.governorate}</span>}
            <span style={tagStyle}>{s.yearsOfExperience || 0} سنوات خبرة</span>
            {s.jobLevel && <span style={tagStyle}>{EXPERIENCE_LEVELS[s.jobLevel] || s.jobLevel}</span>}
            {s.jobType && <span style={tagStyle}>{JOB_TYPE_LABELS[s.jobType] || s.jobType}</span>}
            {s.educationLevel && <span style={tagStyle}>{EDUCATION_LABELS[s.educationLevel] || s.educationLevel}</span>}
          </div>

          {s.bio && <p style={{ lineHeight: 1.7, marginBottom: 12 }}>{s.bio}</p>}

          {skills.length > 0 && (
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>المهارات:</strong> {formatEntries(skills, SKILL_LEVELS)}
            </div>
          )}
          {languages.length > 0 && (
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>اللغات:</strong> {formatEntries(languages, LANGUAGE_LEVELS)}
            </div>
          )}
          {s.gender === "male" && s.militaryStatus && (
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>حالة التجنيد:</strong> {MILITARY_STATUS_LABELS[s.militaryStatus] || s.militaryStatus}
            </div>
          )}
          {s.showSalaryToEmployers && s.expectedSalary && (
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>الراتب المتوقع:</strong> {s.expectedSalary} جنيه
            </div>
          )}

          {workExperience.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>الخبرات السابقة</h3>
              {workExperience.map((row: any, i: number) => (
                <div key={i} style={{ background: "#F5EFDE", borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13.5 }}>
                  <strong>{row.jobTitle || ""}</strong>
                  {!s.hideCompanyNames && row.company ? ` — ${row.company}` : ""}
                  <div style={{ color: "#4A5568", marginTop: 4 }}>
                    {row.fromDate || ""} {row.fromDate || row.toDate ? "—" : ""} {row.isCurrent ? "لسه شغال هنا" : row.toDate || ""}
                  </div>
                  {row.responsibilities && <div style={{ marginTop: 4 }}>{row.responsibilities}</div>}
                </div>
              ))}
            </div>
          )}

          <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #14213D22" }} />

          {isPremium ? (
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>بيانات التواصل</h3>
              <div style={{ fontSize: 14.5, marginBottom: 6 }}>📞 <strong>{s.phone || "—"}</strong></div>
              {s.email && <div style={{ fontSize: 14.5, marginBottom: 6 }}>✉️ {s.email}</div>}
              {s.cvFileURL && (
                <a href={s.cvFileURL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6, color: "#14213D" }}>
                  📄 السيرة الذاتية
                </a>
              )}
            </div>
          ) : (
            <div style={{ background: "#F5EFDE", padding: 16, borderRadius: 8 }}>
              <p style={{ fontSize: 13.5, color: "#4A5568", marginBottom: 12 }}>
                التواصل المباشر مع الكوادر (تليفون، إيميل، السيرة الذاتية) متاح بس للباقة المدفوعة.
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                style={{ padding: "8px 16px", background: "#E8A33D", color: "#14213D", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
              >
                🚀 طلب الترقية للباقة المدفوعة
              </button>
            </div>
          )}
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

const tagStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999 };
