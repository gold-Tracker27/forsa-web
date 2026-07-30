"use client";

import ShareButton from "@/components/ShareButton";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { ScreeningQuestion } from "@/components/ScreeningQuestionsModal";

export type JobPost = {
  id: string;
  title: string;
  specialization: string;
  city: string;
  governorate: string;
  jobType: string;
  jobLevel?: string;
  screeningQuestions?: ScreeningQuestion[];
  companyName?: string;
  showCompanyName?: boolean;
  description?: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryNegotiable?: boolean;
  showSalary?: boolean;
  featured?: boolean;
  requirements?: string;
  employerId: string;
  createdAt?: any;
  isActive?: boolean;
  expiresAt?: any;
};

export function salaryTeaser(p: JobPost) {
  if (p.showSalary === false) return "الراتب غير محدد";
  if (p.salaryNegotiable) return "قابل للتفاوض";
  if (p.salaryFrom) return `${p.salaryFrom}${p.salaryTo ? " - " + p.salaryTo : "+"} جنيه`;
  return "الراتب غير محدد";
}

type Props = {
  job: JobPost;
  applied?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onClick?: () => void;
  unavailable?: boolean;
};

export default function JobCard({ job: p, applied, saved, onToggleSave, onClick, unavailable }: Props) {
  return (
    <div
      onClick={unavailable ? undefined : onClick}
      style={{
        border: "1px solid #14213D22",
        borderRadius: 10,
        padding: 16,
        cursor: unavailable ? "default" : "pointer",
        opacity: unavailable ? 0.6 : 1,
      }}
    >
      {unavailable && (
        <div style={{ fontSize: 12.5, color: "#B03A14", marginBottom: 8, fontWeight: 700 }}>
          ⚠️ الوظيفة دي لم تعد متاحة
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>{p.title}</h4>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {p.featured && (
            <span style={{ fontSize: 12, background: "rgba(232,163,61,0.2)", padding: "3px 8px", borderRadius: 999 }}>
              ⭐ مميز
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            title={saved ? "إلغاء الحفظ" : "حفظ الوظيفة"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid #14213D22",
              background: saved ? "#14213D" : "#F0EDE3",
              color: saved ? "#fff" : "#14213D",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {saved ? "★ محفوظة" : "☆ حفظ"}
          </button>
          <ShareButton jobId={p.id} title={p.title} />
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#4A5568", marginTop: 4 }}>
        {p.showCompanyName && p.companyName ? p.companyName : "شركة غير معلنة"} · {p.city} - {p.governorate}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <span style={tagStyle}>{p.specialization}</span>
        {p.jobLevel && <span style={tagStyle}>{EXPERIENCE_LEVELS[p.jobLevel] || p.jobLevel}</span>}
        <span style={tagStyle}>الراتب: {salaryTeaser(p)}</span>
        {applied && (
          <span style={{ ...tagStyle, background: "rgba(47,111,78,0.15)", color: "#2F6F4E", fontWeight: 700 }}>
            ✓ اتقدمت
          </span>
        )}
      </div>
    </div>
  );
}

export const tagStyle: React.CSSProperties = {
  fontSize: 12,
  background: "#F0EDE3",
  padding: "3px 10px",
  borderRadius: 999,
};
