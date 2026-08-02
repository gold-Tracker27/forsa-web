"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { h3Style, descStyle, gridStyle, labelStyle, inputStyle, saveBtnStyle, savedMsgStyle } from "./sharedStyles";

type Props = {
  initialData: any;
  onSaved: (partial: any) => void;
};

export default function AdditionalDetailsTab({ initialData, onSaved }: Props) {
  const [hasCar, setHasCar] = useState("no");
  const [licenseType, setLicenseType] = useState("none");
  const [acceptsCompanyHousing, setAcceptsCompanyHousing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHasCar(initialData.hasCar || "no");
    setLicenseType(initialData.licenseType || "none");
    setAcceptsCompanyHousing(!!initialData.acceptsCompanyHousing);
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setSaved(false);

    const data: any = {
      hasCar,
      licenseType,
      acceptsCompanyHousing,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "job_seekers", user.uid), data, { merge: true });

    setSaving(false);
    setSaved(true);
    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={h3Style}>⚙️ تفاصيل إضافية</h3>
      <p style={descStyle}>كل الحقول دي اختيارية.</p>

      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>عندك عربية؟</label>
          <select value={hasCar} onChange={(e) => setHasCar(e.target.value)} style={inputStyle}>
            <option value="no">لأ</option>
            <option value="yes">أيوة</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>نوع الرخصة (إن وجدت)</label>
          <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} style={inputStyle}>
            <option value="none">لا يوجد</option>
            <option value="private">خصوصي</option>
            <option value="motorcycle">دراجة نارية</option>
            <option value="professional">مهنية (نقل)</option>
            <option value="first_class">درجة أولى</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" id="housingCheck" checked={acceptsCompanyHousing} onChange={(e) => setAcceptsCompanyHousing(e.target.checked)} />
        <label htmlFor="housingCheck" style={{ fontSize: 14 }}>أنا قابل أقيم في سكن تابع للشركة لو متاح</label>
      </div>

      <button type="submit" disabled={saving} style={saveBtnStyle}>
        {saving ? "جاري الحفظ..." : "حفظ التفاصيل الإضافية"}
      </button>
      {saved && <div style={savedMsgStyle}>✓ اتحفظت البيانات</div>}
    </form>
  );
}
