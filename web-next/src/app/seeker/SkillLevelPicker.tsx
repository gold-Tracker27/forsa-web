"use client";

import { useState } from "react";
import { SkillEntry } from "@/lib/profileFields";

type Props = {
  label: string;
  options: string[];
  levels: Record<string, string>;
  value: SkillEntry[];
  onChange: (entries: SkillEntry[]) => void;
};

export default function SkillLevelPicker({ label, options, levels, value, onChange }: Props) {
  const levelKeys = Object.keys(levels);
  const [nameSelect, setNameSelect] = useState("");
  const [nameOther, setNameOther] = useState("");
  const [level, setLevel] = useState(levelKeys[0] || "");

  function handleAdd() {
    const finalName = nameSelect === "other" ? nameOther.trim() : nameSelect;
    if (!finalName) return;
    if (value.some((e) => e.name === finalName)) return;
    onChange([...value, { name: finalName, level }]);
    setNameSelect("");
    setNameOther("");
    setLevel(levelKeys[0] || "");
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <select value={nameSelect} onChange={(e) => setNameSelect(e.target.value)} style={{ ...inputStyle, flex: "1 1 160px" }}>
          <option value="">اختر...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="other">أخرى</option>
        </select>
        {nameSelect === "other" && (
          <input
            type="text"
            value={nameOther}
            onChange={(e) => setNameOther(e.target.value)}
            placeholder="اكتب بنفسك"
            style={{ ...inputStyle, flex: "1 1 160px" }}
          />
        )}
        <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px" }}>
          {levelKeys.map((k) => <option key={k} value={k}>{levels[k]}</option>)}
        </select>
        <button type="button" onClick={handleAdd} style={addBtnStyle}>+ إضافة</button>
      </div>

      {value.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {value.map((entry, i) => (
            <span key={i} style={chipStyle}>
              {entry.name}{entry.level ? ` — ${levels[entry.level] || entry.level}` : ""}
              <button type="button" onClick={() => handleRemove(i)} style={removeBtnStyle}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 13.5, fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 };
const addBtnStyle: React.CSSProperties = { padding: "8px 14px", background: "#14213D", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13.5 };
const chipStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, background: "#F0EDE3", padding: "5px 6px 5px 10px", borderRadius: 999 };
const removeBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#B03A14", cursor: "pointer", fontSize: 13, padding: 2, lineHeight: 1 };
