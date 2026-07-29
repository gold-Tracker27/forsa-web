"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import {
  GOVERNORATES,
  GOVERNORATE_CITIES,
  SPECIALIZATION_OPTIONS,
  MILITARY_STATUS_LABELS,
  SKILL_OPTIONS,
  LANGUAGE_OPTIONS,
  SKILL_LEVELS,
  LANGUAGE_LEVELS,
} from "@/lib/constants";
import { SkillEntry, normalizeEntries } from "@/lib/profileFields";
import SkillLevelPicker from "./SkillLevelPicker";

type ExperienceRow = {
  company: string;
  jobTitle: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
  responsibilities: string;
};

type Props = {
  initialData?: any;
  onSaved?: () => void;
};

export default function OnboardingForm({ initialData, onSaved }: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(() => auth.currentUser?.email || "");
  const [gender, setGender] = useState("");
  const [militaryStatus, setMilitaryStatus] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [citySelect, setCitySelect] = useState("");
  const [cityOther, setCityOther] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [specSelect, setSpecSelect] = useState("");
  const [specOther, setSpecOther] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [jobType, setJobType] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [showSalary, setShowSalary] = useState(false);

  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [languages, setLanguages] = useState<SkillEntry[]>([]);
  const [bio, setBio] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvStatus, setCvStatus] = useState("");
  const [experience, setExperience] = useState<ExperienceRow[]>([]);

  const [hasCar, setHasCar] = useState("no");
  const [licenseType, setLicenseType] = useState("none");
  const [acceptsCompanyHousing, setAcceptsCompanyHousing] = useState(false);
  const [hideCompanyNames, setHideCompanyNames] = useState(false);

  const [saving, setSaving] = useState(false);

  // لو فيه بيانات موجودة (وضع التعديل)، نملا بيها الاستمارة
  useEffect(() => {
    if (!initialData) return;
    setFullName(initialData.fullName || "");
    setPhone(initialData.phone || "");
    setEmail(initialData.email || auth.currentUser?.email || "");
    setGender(initialData.gender || "");
    setMilitaryStatus(initialData.militaryStatus || "");
    setPhotoURL(initialData.photoURL || "");
    setGovernorate(initialData.governorate || "");

    const savedCity = initialData.city || "";
    const cities = GOVERNORATE_CITIES[initialData.governorate || ""] || [];
    if (savedCity && !cities.includes(savedCity)) {
      setCitySelect("other");
      setCityOther(savedCity);
    } else {
      setCitySelect(savedCity);
    }

    setJobTitle(initialData.jobTitle || "");
    const savedSpec = initialData.specialization || "";
    if (savedSpec && !SPECIALIZATION_OPTIONS.includes(savedSpec)) {
      setSpecSelect("other");
      setSpecOther(savedSpec);
    } else {
      setSpecSelect(savedSpec);
    }

    setYearsOfExperience(initialData.yearsOfExperience?.toString() || "");
    setEducationLevel(initialData.educationLevel || "");
    setJobType(initialData.jobType || "");
    setExpectedSalary(initialData.expectedSalary?.toString() || "");
    setShowSalary(!!initialData.showSalaryToEmployers);
    setSkills(normalizeEntries(initialData.skills));
    setLanguages(normalizeEntries(initialData.languages));
    setBio(initialData.bio || "");
    setCvLink(initialData.cvFileURL || "");
    setExperience(initialData.workExperience || []);
    setHasCar(initialData.hasCar || "no");
    setLicenseType(initialData.licenseType || "none");
    setAcceptsCompanyHousing(!!initialData.acceptsCompanyHousing);
    setHideCompanyNames(!!initialData.hideCompanyNames);
  }, [initialData]);

  const cities = governorate ? GOVERNORATE_CITIES[governorate] || [] : [];

  function addExperienceRow() {
    setExperience([
      ...experience,
      { company: "", jobTitle: "", fromDate: "", toDate: "", isCurrent: false, responsibilities: "" },
    ]);
  }

  function updateExperienceRow(index: number, field: keyof ExperienceRow, value: any) {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  }

  function removeExperienceRow(index: number) {
    setExperience(experience.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);

    const finalCity = citySelect === "other" ? cityOther.trim() : citySelect;
    const finalSpecialization = specSelect === "other" ? specOther.trim() : specSelect;

    const data: any = {
      fullName,
      phone,
      email,
      gender,
      militaryStatus: gender === "male" ? militaryStatus : "",
      governorate,
      city: finalCity,
      jobTitle,
      specialization: finalSpecialization,
      yearsOfExperience: Number(yearsOfExperience || 0),
      educationLevel,
      jobType,
      expectedSalary: expectedSalary ? Number(expectedSalary) : null,
      showSalaryToEmployers: showSalary,
      skills,
      languages,
      bio,
      workExperience: experience.filter((row) => row.company || row.jobTitle),
      acceptsCompanyHousing,
      hasCar,
      licenseType,
      hideCompanyNames,
      consentToShare: true,
      consentDate: serverTimestamp(),
      isAvailable: true,
      updatedAt: serverTimestamp(),
    };

    if (photoFile) {
      if (photoFile.size > 2 * 1024 * 1024) {
        alert("حجم الصورة أكبر من 2 ميجا — اختار صورة أصغر.");
        setSaving(false);
        return;
      }
      try {
        setPhotoStatus("جاري رفع الصورة...");
        const photoRef = ref(storage, `photos/${user.uid}/${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        data.photoURL = await getDownloadURL(photoRef);
        setPhotoStatus("تم رفع الصورة ✓");
      } catch (err) {
        console.error("Photo upload failed", err);
        setPhotoStatus("حصلت مشكلة في رفع الصورة — اتحفظ البروفايل من غيرها");
      }
    }

    if (cvLink.trim()) data.cvFileURL = cvLink.trim();

    if (cvFile) {
      if (cvFile.size > 5 * 1024 * 1024) {
        alert("حجم الملف أكبر من 5 ميجا — قلّل حجم الملف أو استخدم رابط بدلاً من الرفع المباشر.");
        setSaving(false);
        return;
      }
      try {
        setCvStatus("جاري رفع الملف...");
        const fileRef = ref(storage, `cvs/${user.uid}/${cvFile.name}`);
        await uploadBytes(fileRef, cvFile);
        data.cvFileURL = await getDownloadURL(fileRef);
        setCvStatus("تم رفع الملف ✓");
      } catch (err) {
        console.error("CV upload failed", err);
        setCvStatus("حصلت مشكلة في رفع الملف — اتحفظ البروفايل من غيره");
      }
    }

    await setDoc(doc(db, "job_seekers", user.uid), data, { merge: true });

    setSaving(false);

    if (onSaved) {
      onSaved();
    } else {
      router.push("/seeker");
      router.refresh();
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 700, margin: "0 auto", padding: "30px 20px" }}>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>
        {initialData ? "تعديل البروفايل" : "كمّل بيانات البروفايل"}
      </h2>
      <p style={{ color: "#4A5568", marginBottom: 24 }}>
        هتظهر البيانات دي لأصحاب الأعمال اللي بيفلتروا. تقدر تعدلها في أي وقت.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>📋 البيانات الشخصية</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>الاسم بالكامل</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>رقم الموبايل</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>البريد الإلكتروني (اختياري)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>النوع (اختياري)</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                <option value="">تفضّل عدم التحديد</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>صورة شخصية (اختياري)</label>
              {photoURL && !photoFile && (
                <img src={photoURL} alt="صورتك الحالية" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%", marginBottom: 8, display: "block" }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              <div style={{ fontSize: 12.5, color: "#4A5568", marginTop: 6 }}>
                {photoStatus || "صورة PNG أو JPG، حد أقصى 2 ميجا"}
              </div>
            </div>
            <div>
              <label style={labelStyle}>المحافظة</label>
              <select
                value={governorate}
                onChange={(e) => { setGovernorate(e.target.value); setCitySelect(""); }}
                required
                style={inputStyle}
              >
                <option value="">اختر المحافظة</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>المدينة/المنطقة (اختياري)</label>
              <select value={citySelect} onChange={(e) => setCitySelect(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="other">أخرى (اكتب بنفسك)</option>
              </select>
            </div>
            {citySelect === "other" && (
              <div>
                <label style={labelStyle}>اكتب المدينة</label>
                <input type="text" value={cityOther} onChange={(e) => setCityOther(e.target.value)} placeholder="اسم المدينة/المنطقة" style={inputStyle} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>💼 البيانات الوظيفية</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>المسمى الوظيفي المطلوب</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required placeholder="مثال: محاسب، مندوب مبيعات" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>التخصص (اختياري)</label>
              <select value={specSelect} onChange={(e) => setSpecSelect(e.target.value)} style={inputStyle}>
                <option value="">اختر التخصص</option>
                {SPECIALIZATION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="other">أخرى</option>
              </select>
            </div>
            {specSelect === "other" && (
              <div>
                <label style={labelStyle}>اكتب تخصصك</label>
                <input type="text" value={specOther} onChange={(e) => setSpecOther(e.target.value)} placeholder="مثال: تخصص نادر مش موجود في القايمة" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>سنوات الخبرة (اختياري)</label>
              <input type="number" min="0" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>المؤهل الدراسي (اختياري)</label>
              <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} style={inputStyle}>
                <option value="">تفضّل عدم التحديد</option>
                <option value="none">بدون مؤهل دراسي</option>
                <option value="literacy">محو أمية</option>
                <option value="primary">ابتدائية</option>
                <option value="preparatory">إعدادية</option>
                <option value="secondary">ثانوية عامة / دبلوم</option>
                <option value="bachelor">بكالوريوس/ليسانس</option>
                <option value="master">ماجستير</option>
                <option value="phd">دكتوراه</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>نوع الدوام المطلوب (اختياري)</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={inputStyle}>
                <option value="">تفضّل عدم التحديد</option>
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
                <option value="remote">عن بعد</option>
                <option value="freelance">فريلانس</option>
                <option value="no_preference">لا يوجد تفضيل</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>الراتب المتوقع (اختياري)</label>
              <input type="number" min="0" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} style={inputStyle} />
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" id="showSalaryCheck" checked={showSalary} onChange={(e) => setShowSalary(e.target.checked)} />
                <label htmlFor="showSalaryCheck" style={{ fontSize: 13.5 }}>أظهر الحد الأدنى للمرتب لأصحاب الأعمال</label>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>📄 السيرة الذاتية والمهارات (اختياري بالكامل)</h3>
          <SkillLevelPicker label="المهارات" options={SKILL_OPTIONS} levels={SKILL_LEVELS} value={skills} onChange={setSkills} />
          <SkillLevelPicker label="اللغات" options={LANGUAGE_OPTIONS} levels={LANGUAGE_LEVELS} value={languages} onChange={setLanguages} />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>نبذة مختصرة عن نفسك</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="أهم إنجازاتك، نقاط قوتك..." style={{ ...inputStyle, minHeight: 80 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>السيرة الذاتية (CV)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
            <div style={{ fontSize: 12.5, color: "#4A5568", marginTop: 6 }}>
              {cvStatus || "ارفع ملف PDF (حد أقصى 5 ميجا). لو رفعت ملف، هيتجاهل الرابط تحت لو موجود."}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>أو رابط السيرة الذاتية</label>
            <input type="url" value={cvLink} onChange={(e) => setCvLink(e.target.value)} placeholder="رابط من Google Drive أو Dropbox" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>الخبرات السابقة</label>
            {experience.map((row, i) => (
              <div key={i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, marginBottom: 10, position: "relative" }}>
                <button type="button" onClick={() => removeExperienceRow(i)} style={{ position: "absolute", top: 10, left: 10, background: "none", border: "none", color: "#B03A14", cursor: "pointer" }}>
                  ✕ حذف
                </button>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>اسم الشركة</label>
                    <input type="text" value={row.company} onChange={(e) => updateExperienceRow(i, "company", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>المسمى الوظيفي</label>
                    <input type="text" value={row.jobTitle} onChange={(e) => updateExperienceRow(i, "jobTitle", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>من (شهر/سنة)</label>
                    <input type="month" value={row.fromDate} onChange={(e) => updateExperienceRow(i, "fromDate", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>إلى (شهر/سنة)</label>
                    <input type="month" value={row.toDate} disabled={row.isCurrent} onChange={(e) => updateExperienceRow(i, "toDate", e.target.value)} style={inputStyle} />
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="checkbox"
                        id={`current-${i}`}
                        checked={row.isCurrent}
                        onChange={(e) => {
                          updateExperienceRow(i, "isCurrent", e.target.checked);
                          if (e.target.checked) updateExperienceRow(i, "toDate", "");
                        }}
                      />
                      <label htmlFor={`current-${i}`} style={{ fontSize: 13 }}>لسه شغال هنا</label>
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>أهم المسؤوليات</label>
                    <textarea value={row.responsibilities} onChange={(e) => updateExperienceRow(i, "responsibilities", e.target.value)} placeholder="أهم المهام والإنجازات في الوظيفة دي..." style={{ ...inputStyle, minHeight: 60 }} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addExperienceRow} style={ghostBtnStyle}>+ إضافة خبرة سابقة</button>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>⚙️ تفاصيل إضافية (اختياري)</h3>
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
            {gender === "male" && (
              <div>
                <label style={labelStyle}>حالة التجنيد (اختياري)</label>
                <select value={militaryStatus} onChange={(e) => setMilitaryStatus(e.target.value)} style={inputStyle}>
                  <option value="">تفضّل عدم التحديد</option>
                  {Object.entries(MILITARY_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" id="housingCheck" checked={acceptsCompanyHousing} onChange={(e) => setAcceptsCompanyHousing(e.target.checked)} />
            <label htmlFor="housingCheck" style={{ fontSize: 14 }}>أنا قابل أقيم في سكن تابع للشركة لو متاح</label>
          </div>
        </fieldset>

        <fieldset style={{ ...sectionStyle, background: "#F5EFDE" }}>
          <h3 style={h3Style}>🔒 الخصوصية</h3>
          <p style={{ fontSize: 13, color: "#4A5568", marginBottom: 10 }}>
            بروفايلك بيظهر لأصحاب الأعمال المسجلين عشان يقدروا يوصلولك ويعرضوا عليك فرص.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" id="hideCompanyNamesCheck" checked={hideCompanyNames} onChange={(e) => setHideCompanyNames(e.target.checked)} />
            <label htmlFor="hideCompanyNamesCheck" style={{ fontSize: 13.5 }}>
              إخفاء أسماء الشركات اللي اشتغلت فيها من قبل (يفضل يظهر المسمى الوظيفي والمدة بس)
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "14px", background: "#14213D", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          {saving ? "جاري الحفظ..." : "حفظ البروفايل"}
        </button>
      </form>
    </div>
  );
}

const sectionStyle: React.CSSProperties = { border: "1px solid #14213D22", borderRadius: 10, padding: 18, marginBottom: 16 };
const h3Style: React.CSSProperties = { marginBottom: 12, fontSize: 16 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 13.5, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 };
const ghostBtnStyle: React.CSSProperties = { padding: "8px 16px", background: "transparent", border: "1px solid #14213D", borderRadius: 6, cursor: "pointer" };