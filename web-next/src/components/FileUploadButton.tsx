"use client";

import { useId } from "react";

type Props = {
  label: string;
  accept?: string;
  fileName?: string;
  onChange: (file: File | null) => void;
};

// input[type=file] الافتراضي شكله مختلف من متصفح لمتصفح ومش واضح إنه زرار قابل للضغط —
// بنخفيه بصريًا (من غير display:none عشان يفضل قابل للوصول بلوحة المفاتيح وقارئات الشاشة)
// ونستخدم label مرتبط بيه (htmlFor) كزرار مصمم بشكل الموقع، الضغط على الـlabel بيفتح
// نافذة اختيار الملف تلقائيًا من غير أي JS إضافي.
export default function FileUploadButton({ label, accept, fileName, onChange }: Props) {
  const id = useId();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <label htmlFor={id} style={buttonStyle}>
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        style={hiddenInputStyle}
      />
      <span style={{ fontSize: 13, color: "#4A5568" }}>{fileName || "مفيش ملف مختار"}</span>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 18px",
  background: "#14213D",
  color: "#fff",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid #14213D",
  whiteSpace: "nowrap",
};

const hiddenInputStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};
