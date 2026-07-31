"use client";

import { useEffect, useState } from "react";
import OnboardingForm from "./OnboardingForm";
import { MILITARY_STATUS_LABELS, SKILL_LEVELS, LANGUAGE_LEVELS } from "@/lib/constants";
import { normalizeEntries, formatEntries } from "@/lib/profileFields";
import { tagStyle } from "@/lib/jobCardStyles";

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
  data: any;
  onUpdated: (newData: any) => void;
};

export default function ProfileTab({ data, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    window.print();
    const handleAfterPrint = () => setPrinting(false);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [printing]);

  if (editing) {
    return (
      <OnboardingForm
        initialData={data}
        onSaved={() => {
          setEditing(false);
          onUpdated(data);
        }}
      />
    );
  }

  const skills = normalizeEntries(data.skills);
  const languages = normalizeEntries(data.languages);

  return (
    <div dir="rtl" style={{ maxWidth: 700, margin: "0 auto", padding: "30px 20px" }}>
      <h2 style={{ marginBottom: 16 }}>بروفايلك متسجل ✅</h2>

      <div style={{ border: "1px solid #14213D22", borderRadius: 10, padding: 20 }}>
        {data.photoURL && (
          <img src={data.photoURL} alt="صورتك الشخصية" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "50%", marginBottom: 14 }} />
        )}
        <Row label="الاسم" value={data.fullName} />
        <Row label="رقم الموبايل" value={data.phone} />
        <Row label="البريد الإلكتروني" value={data.email} />
        <Row label="المحافظة" value={data.governorate} />
        <Row label="المدينة" value={data.city} />
        <Row label="المسمى الوظيفي" value={data.jobTitle} />
        <Row label="التخصص" value={data.specialization} />
        <Row label="سنوات الخبرة" value={data.yearsOfExperience?.toString()} />
        <Row label="المؤهل الدراسي" value={EDUCATION_LABELS[data.educationLevel] || data.educationLevel} />
        <Row label="نوع الدوام" value={JOB_TYPE_LABELS[data.jobType] || data.jobType} />
        {data.showSalaryToEmployers && data.expectedSalary && (
          <Row label="الراتب المتوقع" value={`${data.expectedSalary} جنيه`} />
        )}
        {skills.length > 0 && <Row label="المهارات" value={formatEntries(skills, SKILL_LEVELS)} />}
        {languages.length > 0 && <Row label="اللغات" value={formatEntries(languages, LANGUAGE_LEVELS)} />}
        {data.gender === "male" && data.militaryStatus && (
          <Row label="حالة التجنيد" value={MILITARY_STATUS_LABELS[data.militaryStatus] || data.militaryStatus} />
        )}
        {data.bio && <Row label="نبذة عنك" value={data.bio} />}
        {data.cvFileURL && (
          <div style={{ marginTop: 10 }}>
            <a href={data.cvFileURL} target="_blank" rel="noopener noreferrer" style={{ color: "#14213D" }}>
              📄 عرض السيرة الذاتية
            </a>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "12px 24px",
            background: "#14213D",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          تعديل البروفايل
        </button>
        <button
          onClick={() => setPrinting(true)}
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: "#14213D",
            border: "1px solid #14213D",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          📄 اعمل CV احترافي واحفظه
        </button>
      </div>

      {/* عرض مخفي بيظهر بس وقت الطباعة الفعلية (@media print في globals.css) */}
      <div className="cv-print-view" style={{ display: printing ? "block" : "none" }}>
        <CVPrintLayout data={data} skills={skills} languages={languages} />
      </div>
    </div>
  );
}

function CVPrintLayout({ data, skills, languages }: { data: any; skills: ReturnType<typeof normalizeEntries>; languages: ReturnType<typeof normalizeEntries> }) {
  const workExperience: any[] = Array.isArray(data.workExperience) ? data.workExperience : [];

  return (
    <div style={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", padding: 30, maxWidth: 700, margin: "0 auto", color: "#14213D" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "3px solid #14213D", paddingBottom: 16, marginBottom: 20 }}>
        {data.photoURL && (
          <img src={data.photoURL} alt={data.fullName || "الصورة الشخصية"} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>{data.fullName || ""}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 16, color: "#C97F1F", fontWeight: 700 }}>{data.jobTitle || ""}</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#4A5568" }}>
            📞 {data.phone || "—"} &nbsp;|&nbsp; ✉️ {data.email || "—"} &nbsp;|&nbsp; 📍 {data.city || ""} - {data.governorate || ""} &nbsp;|&nbsp; {data.yearsOfExperience || 0} سنوات خبرة
          </p>
        </div>
      </div>

      {data.bio && (
        <>
          <CVSectionTitle title="نبذة" />
          <p style={{ fontSize: 13.5, color: "#333" }}>{data.bio}</p>
        </>
      )}

      <CVSectionTitle title="الخبرات السابقة" />
      {workExperience.length > 0 ? (
        workExperience.map((e, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>{e.jobTitle || ""} — {e.company || ""}</span>
              <span style={{ fontSize: 12, color: "#4A5568" }}>{e.fromDate || ""} - {e.isCurrent ? "الآن" : e.toDate || ""}</span>
            </div>
            {e.responsibilities && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#333" }}>{e.responsibilities}</p>}
          </div>
        ))
      ) : (
        <p style={{ fontSize: 13, color: "#4A5568" }}>لا يوجد</p>
      )}

      <CVSectionTitle title="المؤهل الدراسي" />
      <p style={{ fontSize: 13.5, color: "#333" }}>{EDUCATION_LABELS[data.educationLevel] || data.educationLevel || "—"}</p>

      <CVSectionTitle title="المهارات" />
      {skills.length > 0 ? (
        <div>
          {skills.map((s, i) => (
            <span key={i} style={{ ...tagStyle, display: "inline-block", margin: 2 }}>
              {s.name}
              {s.level && <span style={{ color: "#4A5568" }}> · {SKILL_LEVELS[s.level] || s.level}</span>}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#4A5568" }}>لا يوجد</p>
      )}

      <CVSectionTitle title="اللغات" />
      {languages.length > 0 ? (
        <div>
          {languages.map((l, i) => (
            <span key={i} style={{ ...tagStyle, display: "inline-block", margin: 2 }}>
              {l.name}
              {l.level && <span style={{ color: "#4A5568" }}> · {LANGUAGE_LEVELS[l.level] || l.level}</span>}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#4A5568" }}>لا يوجد</p>
      )}

      <div style={{ marginTop: 30, paddingTop: 14, borderTop: "1px solid #DED2B5", textAlign: "center", fontSize: 11.5, color: "#4A5568" }}>
        تم إنشاء هذه السيرة الذاتية عبر منصة "الشغل" — elshoghl.com
      </div>
    </div>
  );
}

function CVSectionTitle({ title }: { title: string }) {
  return (
    <h3 style={{ fontSize: 15, borderRight: "4px solid #C97F1F", paddingRight: 10, marginTop: 20, marginBottom: 8 }}>
      {title}
    </h3>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10, fontSize: 14 }}>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span>{value}</span>
    </div>
  );
}
