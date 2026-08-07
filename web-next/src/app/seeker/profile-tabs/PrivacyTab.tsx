"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { h3Style, descStyle, saveBtnStyle, savedMsgStyle } from "./sharedStyles";

type Props = {
  initialData: any;
  onSaved: (partial: any) => void;
};

export default function PrivacyTab({ initialData, onSaved }: Props) {
  const [consentToShare, setConsentToShare] = useState(true);
  const [hideCompanyNames, setHideCompanyNames] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConsentToShare(initialData.consentToShare !== false);
    setHideCompanyNames(!!initialData.hideCompanyNames);
    setEmailNotificationsEnabled(initialData.emailNotificationsEnabled !== false);
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setSaved(false);

    const data: any = {
      consentToShare,
      hideCompanyNames,
      emailNotificationsEnabled,
      consentDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "job_seekers", user.uid), data, { merge: true });

    setSaving(false);
    setSaved(true);
    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#F5EFDE", border: "1px solid #14213D22", borderRadius: 10, padding: 18 }}>
      <h3 style={h3Style}>🔒 الخصوصية</h3>
      <p style={descStyle}>تحكّم في إيه اللي أصحاب الأعمال يشوفوه من بياناتك.</p>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <input type="checkbox" id="consentToShareCheck" checked={consentToShare} onChange={(e) => setConsentToShare(e.target.checked)} />
        <label htmlFor="consentToShareCheck" style={{ fontSize: 13.5 }}>
          أظهر بروفايلي لأصحاب الأعمال في البحث عن كوادر، عشان يقدروا يوصلولي ويعرضوا عليّ فرص
        </label>
      </div>
      <p style={{ fontSize: 12.5, color: "#4A5568", marginBottom: 10 }}>
        من غير ده، بروفايلك مش هيظهر في نتائج بحث أصحاب الأعمال.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <input type="checkbox" id="hideCompanyNamesCheck" checked={hideCompanyNames} onChange={(e) => setHideCompanyNames(e.target.checked)} />
        <label htmlFor="hideCompanyNamesCheck" style={{ fontSize: 13.5 }}>
          إخفاء أسماء الشركات في خبراتك السابقة (هيفضل المسمى الوظيفي والمدة بس)
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          id="emailNotificationsCheck"
          checked={emailNotificationsEnabled}
          onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
        />
        <label htmlFor="emailNotificationsCheck" style={{ fontSize: 13.5 }}>
          استقبال إيميل أسبوعي بالوظائف الجديدة المناسبة لك ووظايفك المحفوظة
        </label>
      </div>

      <button type="submit" disabled={saving} style={saveBtnStyle}>
        {saving ? "جاري الحفظ..." : "حفظ إعدادات الخصوصية"}
      </button>
      {saved && <div style={savedMsgStyle}>✓ اتحفظت البيانات</div>}
    </form>
  );
}
