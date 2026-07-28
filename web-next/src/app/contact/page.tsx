"use client";

import { useState } from "react";

export default function ContactPage() {
  const [copyMsg, setCopyMsg] = useState("");

  async function copyEmail() {
    const email = "elshoghl27@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setCopyMsg("✓ اتنسخ الإيميل — افتح تطبيق البريد أو أي وسيلة تفضّلها وابعته");
    } catch {
      setCopyMsg(`مقدرناش ننسخه تلقائيًا — انسخه يدويًا: ${email}`);
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 500, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>تواصل معنا</h1>
      <p style={{ color: "#4A5568", fontSize: 14, marginBottom: 20 }}>
        لأي شكوى، اقتراح، أو لو محتاج استشارة في الموارد البشرية، تواصل معانا بأي طريقة تناسبك:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={copyEmail} style={btnStyle}>
          📧 انسخ الإيميل: <span style={{ fontSize: 12.5 }}>elshoghl27@gmail.com</span>
        </button>
        <a href="https://wa.me/201012735333" target="_blank" rel="noopener noreferrer" style={linkBtnStyle}>
          💬 تواصل واتساب: 01012735333
        </a>
        <a href="tel:01012735333" style={linkBtnStyle}>
          📞 اتصال مباشر: 01012735333
        </a>
      </div>

      {copyMsg && <div style={{ color: "#2F6F4E", fontSize: 13, marginTop: 12 }}>{copyMsg}</div>}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "12px 16px",
  border: "1px solid #14213D22",
  borderRadius: 8,
  background: "#fff",
  textAlign: "right",
  cursor: "pointer",
  fontSize: 14,
};

const linkBtnStyle: React.CSSProperties = {
  ...btnStyle,
  textDecoration: "none",
  color: "inherit",
  display: "block",
};