"use client";

import { useState } from "react";
import ProfileCompletionBar from "@/components/ProfileCompletionBar";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import PersonalInfoTab from "./profile-tabs/PersonalInfoTab";
import JobPreferencesTab from "./profile-tabs/JobPreferencesTab";
import ExperienceTab from "./profile-tabs/ExperienceTab";
import SkillsAndCVTab from "./profile-tabs/SkillsAndCVTab";
import AdditionalDetailsTab from "./profile-tabs/AdditionalDetailsTab";
import PrivacyTab from "./profile-tabs/PrivacyTab";

type Props = {
  initialData?: any;
  onSaved?: (newData: any) => void;
  onDone?: () => void;
};

type TabKey = "personal" | "job" | "experience" | "skills" | "additional" | "privacy";

const TABS: { key: TabKey; label: string }[] = [
  { key: "personal", label: "📋 البيانات الشخصية" },
  { key: "job", label: "💼 البيانات الوظيفية" },
  { key: "experience", label: "🕑 الخبرات السابقة" },
  { key: "skills", label: "🛠️ المهارات والسيرة الذاتية" },
  { key: "additional", label: "⚙️ تفاصيل إضافية" },
  { key: "privacy", label: "🔒 الخصوصية" },
];

export default function OnboardingForm({ initialData, onSaved, onDone }: Props) {
  const [data, setData] = useState<any>(initialData || {});
  const [activeTab, setActiveTab] = useState<TabKey>("personal");

  function handleTabSaved(partial: any) {
    const merged = { ...data, ...partial };
    setData(merged);
    onSaved?.(merged);
  }

  const completion = calculateProfileCompletion(data);

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      {onDone && (
        <button
          onClick={onDone}
          style={{
            background: "none",
            border: "none",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#4A5568",
            cursor: "pointer",
            marginBottom: 10,
            padding: 0,
          }}
        >
          → رجوع لعرض البروفايل
        </button>
      )}
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>
        {initialData ? "تعديل البروفايل" : "كمّل بيانات البروفايل"}
      </h2>
      <p style={{ color: "#4A5568", marginBottom: 18 }}>
        هتظهر البيانات دي لأصحاب الأعمال اللي بيفلتروا. كل قسم بتحفظه لوحده، وتقدر تكمّل الباقي في أي وقت.
      </p>

      <ProfileCompletionBar percent={completion} />

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 220px", maxWidth: 260 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                textAlign: "right",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #14213D22",
                background: activeTab === t.key ? "#14213D" : "#fff",
                color: activeTab === t.key ? "#fff" : "#14213D",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: "3 1 400px", minWidth: 280, border: "1px solid #14213D22", borderRadius: 10, padding: 20 }}>
          {activeTab === "personal" && <PersonalInfoTab initialData={data} onSaved={handleTabSaved} />}
          {activeTab === "job" && <JobPreferencesTab initialData={data} onSaved={handleTabSaved} />}
          {activeTab === "experience" && <ExperienceTab initialData={data} onSaved={handleTabSaved} />}
          {activeTab === "skills" && <SkillsAndCVTab initialData={data} onSaved={handleTabSaved} />}
          {activeTab === "additional" && <AdditionalDetailsTab initialData={data} onSaved={handleTabSaved} />}
          {activeTab === "privacy" && <PrivacyTab initialData={data} onSaved={handleTabSaved} />}
        </div>
      </div>
    </div>
  );
}
