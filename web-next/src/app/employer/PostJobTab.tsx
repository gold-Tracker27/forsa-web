"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { GOVERNORATES, GOVERNORATE_CITIES, SPECIALIZATION_OPTIONS } from "@/lib/constants";

const AGE_OPTIONS = Array.from({ length: 50 }, (_, i) => 16 + i);

type EditingPost = { id: string; data: any } | null;

type Props = {
  employerPlan: string;
  companyName: string;
  editingPost?: EditingPost;
  onPosted: () => void;
};

export default function PostJobTab({ employerPlan, companyName, editingPost, onPosted }: Props) {
  const [title, setTitle] = useState("");
  const [specSelect, setSpecSelect] = useState("");
  const [specOther, setSpecOther] = useState("");
  const [jobType, setJobType] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [citySelect, setCitySelect] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [description, setDescription] = useState("");

  const [vacancies, setVacancies] = useState("1");
  const [salaryNegotiable, setSalaryNegotiable] = useState(false);
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [showSalary, setShowSalary] = useState(true);

  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [needsCar, setNeedsCar] = useState("");
  const [requirements, setRequirements] = useState("");

  const [hoursPerDay, setHoursPerDay] = useState("");
  const [daysOffPerMonth, setDaysOffPerMonth] = useState("");
  const [socialInsurance, setSocialInsurance] = useState("");
  const [privateHealthInsurance, setPrivateHealthInsurance] = useState("");
  const [transportationAvailable, setTransportationAvailable] = useState("");
  const [transportationAreas, setTransportationAreas] = useState("");
  const [housingForExpats, setHousingForExpats] = useState("");
  const [additionalBenefits, setAdditionalBenefits] = useState("");

  const [showCompanyName, setShowCompanyName] = useState(false);
  const [receiveMethod, setReceiveMethod] = useState<"platform" | "contact">("platform");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!editingPost;

  // تعبئة الاستمارة ببيانات الوظيفة لو إحنا في وضع تعديل
  useEffect(() => {
    if (!editingPost) {
      resetForm();
      return;
    }
    const p = editingPost.data;
    setTitle(p.title || "");

    const savedSpec = p.specialization || "";
    if (savedSpec && !SPECIALIZATION_OPTIONS.includes(savedSpec)) {
      setSpecSelect("other");
      setSpecOther(savedSpec);
    } else {
      setSpecSelect(savedSpec);
    }

    setJobType(p.jobType || "");
    setGovernorate(p.governorate || "");

    const savedCity = p.city || "";
    const cities = GOVERNORATE_CITIES[p.governorate || ""] || [];
    if (savedCity && !cities.includes(savedCity)) {
      setCitySelect("other");
      setCityOther(savedCity);
    } else {
      setCitySelect(savedCity);
    }

    setDescription(p.description || "");
    setVacancies(p.vacancies?.toString() || "1");
    setSalaryNegotiable(!!p.salaryNegotiable);
    setSalaryFrom(p.salaryFrom?.toString() || "");
    setSalaryTo(p.salaryTo?.toString() || "");
    setShowSalary(p.showSalary !== false);
    setAgeFrom(p.ageFrom?.toString() || "");
    setAgeTo(p.ageTo?.toString() || "");
    setNeedsCar(p.needsCar || "");
    setRequirements(p.requirements || "");
    setHoursPerDay(p.hoursPerDay?.toString() || "");
    setDaysOffPerMonth(p.daysOffPerMonth?.toString() || "");
    setSocialInsurance(p.socialInsurance || "");
    setPrivateHealthInsurance(p.privateHealthInsurance || "");
    setTransportationAvailable(p.transportationAvailable || "");
    setTransportationAreas(p.transportationAreas || "");
    setHousingForExpats(p.housingForExpats || "");
    setAdditionalBenefits(p.additionalBenefits || "");
    setShowCompanyName(!!p.showCompanyName);
    setReceiveMethod(p.receiveMethod === "contact" ? "contact" : "platform");
    setContactMethod(p.contactMethod || "");
    setContactValue(p.contactValue || "");
  }, [editingPost]);

  const cities = governorate ? GOVERNORATE_CITIES[governorate] || [] : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    // حد النشر الشهري بيتفعّل بس وقت النشر الجديد، مش وقت التعديل
    if (!isEditMode) {
      const monthlyLimit = employerPlan === "premium" ? 10 : 5;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const allPostsSnap = await getDocs(query(collection(db, "job_posts"), where("employerId", "==", user.uid)));
      const postsThisMonth = allPostsSnap.docs.filter((d) => {
        const t = d.data().createdAt;
        return t && t.toMillis() >= startOfMonth.getTime();
      });
      if (postsThisMonth.length >= monthlyLimit) {
        alert(
          employerPlan === "premium"
            ? `وصلت للحد الأقصى (${monthlyLimit} إعلانات) للباقة المدفوعة الشهر ده.`
            : `الباقة المجانية بتسمح بحد أقصى ${monthlyLimit} إعلانات جديدة شهريًا، وإنت وصلت للحد ده الشهر ده.`
        );
        return;
      }
    }

    if (receiveMethod === "contact" && (!contactMethod || !contactValue.trim())) {
      alert('اخترت "إظهار وسيلة تواصل" — لازم تحدد طريقة التواصل وتكتب بياناتها.');
      return;
    }

    setSubmitting(true);

    const finalCity = citySelect === "other" ? cityOther.trim() : citySelect;
    const finalSpecialization = specSelect === "other" ? specOther.trim() : specSelect;

    const postData: any = {
      employerId: user.uid,
      companyName,
      showCompanyName,
      title,
      specialization: finalSpecialization,
      jobType,
      governorate,
      city: finalCity,
      vacancies: Number(vacancies || 1),
      salaryNegotiable,
      salaryFrom: salaryNegotiable ? null : (salaryFrom ? Number(salaryFrom) : null),
      salaryTo: salaryNegotiable ? null : (salaryTo ? Number(salaryTo) : null),
      showSalary,
      description,
      hoursPerDay: hoursPerDay ? Number(hoursPerDay) : null,
      daysOffPerMonth: daysOffPerMonth ? Number(daysOffPerMonth) : null,
      socialInsurance,
      privateHealthInsurance,
      transportationAvailable,
      transportationAreas: transportationAreas || "",
      housingForExpats,
      ageFrom: ageFrom ? Number(ageFrom) : null,
      ageTo: ageTo ? Number(ageTo) : null,
      needsCar: needsCar || "",
      requirements: requirements || "",
      receiveMethod,
      contactMethod: receiveMethod === "contact" ? contactMethod : "",
      contactValue: receiveMethod === "contact" ? contactValue : "",
      additionalBenefits: additionalBenefits || "",
      featured: employerPlan === "premium",
      isActive: true,
    };

    try {
      if (isEditMode && editingPost) {
        await updateDoc(doc(db, "job_posts", editingPost.id), postData);
        alert("تم حفظ التعديلات ✓");
      } else {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (employerPlan === "premium" ? 60 : 30));
        postData.expiresAt = Timestamp.fromDate(expiry);
        await addDoc(collection(db, "job_posts"), {
          ...postData,
          createdAt: serverTimestamp(),
        });
        alert("تم نشر الإعلان بنجاح ✓");
      }
      resetForm();
      onPosted();
    } catch (err: any) {
      console.error("Job post save failed", err);
      alert(err.message || "حصلت مشكلة — جرب تاني.");
    }
    setSubmitting(false);
  }

  function resetForm() {
    setTitle("");
    setSpecSelect("");
    setSpecOther("");
    setJobType("");
    setGovernorate("");
    setCitySelect("");
    setCityOther("");
    setDescription("");
    setVacancies("1");
    setSalaryNegotiable(false);
    setSalaryFrom("");
    setSalaryTo("");
    setShowSalary(true);
    setAgeFrom("");
    setAgeTo("");
    setNeedsCar("");
    setRequirements("");
    setHoursPerDay("");
    setDaysOffPerMonth("");
    setSocialInsurance("");
    setPrivateHealthInsurance("");
    setTransportationAvailable("");
    setTransportationAreas("");
    setHousingForExpats("");
    setAdditionalBenefits("");
    setShowCompanyName(false);
    setReceiveMethod("platform");
    setContactMethod("");
    setContactValue("");
  }

  return (
    <div dir="rtl" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, marginBottom: 20 }}>
        {isEditMode ? "تعديل الإعلان" : "انشر إعلان وظيفة جديد"}
      </h2>

      <form onSubmit={handleSubmit}>
        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>📋 المعلومات الأساسية</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>المسمى الوظيفي</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: محاسب أول" style={inputStyle} />
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
                <label style={labelStyle}>اكتب التخصص</label>
                <input type="text" value={specOther} onChange={(e) => setSpecOther(e.target.value)} style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>نوع الدوام (اختياري)</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
                <option value="remote">عن بعد</option>
                <option value="freelance">فريلانس</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>المحافظة</label>
              <select value={governorate} onChange={(e) => { setGovernorate(e.target.value); setCitySelect(""); }} required style={inputStyle}>
                <option value="">اختر المحافظة</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>المدينة (اختياري)</label>
              <select value={citySelect} onChange={(e) => setCitySelect(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="other">أخرى (اكتب بنفسك)</option>
              </select>
            </div>
            {citySelect === "other" && (
              <div>
                <label style={labelStyle}>اكتب المدينة</label>
                <input type="text" value={cityOther} onChange={(e) => setCityOther(e.target.value)} style={inputStyle} />
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>وصف الوظيفة</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="المهام والمميزات..." style={{ ...inputStyle, minHeight: 80 }} />
            </div>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>💰 الراتب وعدد الفرص</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>عدد الفرص المتاحة</label>
              <input type="number" min="1" value={vacancies} onChange={(e) => setVacancies(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 22 }}>
              <input type="checkbox" id="salaryNegotiable" checked={salaryNegotiable} onChange={(e) => setSalaryNegotiable(e.target.checked)} />
              <label htmlFor="salaryNegotiable" style={{ fontSize: 13.5 }}>الراتب قابل للتفاوض / حسب الخبرة</label>
            </div>
            {!salaryNegotiable && (
              <>
                <div>
                  <label style={labelStyle}>الراتب من (جنيه)</label>
                  <input type="number" min="0" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>الراتب إلى (جنيه) — اختياري</label>
                  <input type="number" min="0" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" id="showSalary" checked={showSalary} onChange={(e) => setShowSalary(e.target.checked)} />
              <label htmlFor="showSalary" style={{ fontSize: 13.5 }}>أظهر الراتب في الإعلان (لو مش متعلّم، هيظهر "غير محدد")</label>
            </div>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>📝 شروط المتقدم (اختياري)</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>السن من</label>
              <select value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>السن إلى</label>
              <select value={ageTo} onChange={(e) => setAgeTo(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>محتاج عربية؟</label>
              <select value={needsCar} onChange={(e) => setNeedsCar(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="yes">أيوة</option>
                <option value="no">لأ</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>شروط أخرى</label>
              <input type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="مثال: ذكور فقط، خبرة سابقة في مجال معين" style={inputStyle} />
            </div>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>⏰ ساعات العمل والمزايا (اختياري)</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>عدد ساعات العمل يوميًا</label>
              <input type="number" min="1" max="24" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>عدد أيام الراحة شهريًا</label>
              <input type="number" min="0" max="30" value={daysOffPerMonth} onChange={(e) => setDaysOffPerMonth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>تأمين اجتماعي</label>
              <select value={socialInsurance} onChange={(e) => setSocialInsurance(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="yes">متوفر</option>
                <option value="no">غير متوفر</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>تأمين صحي خاص</label>
              <select value={privateHealthInsurance} onChange={(e) => setPrivateHealthInsurance(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="yes">متوفر</option>
                <option value="no">غير متوفر</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>مواصلات</label>
              <select value={transportationAvailable} onChange={(e) => setTransportationAvailable(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="yes">متوفرة</option>
                <option value="no">غير متوفرة</option>
              </select>
            </div>
            {transportationAvailable === "yes" && (
              <div>
                <label style={labelStyle}>الأماكن اللي المواصلات متوفرة ليها</label>
                <input type="text" value={transportationAreas} onChange={(e) => setTransportationAreas(e.target.value)} placeholder="مثال: مدينة نصر، العبور" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>سكن للمغتربين</label>
              <select value={housingForExpats} onChange={(e) => setHousingForExpats(e.target.value)} style={inputStyle}>
                <option value="">غير محدد</option>
                <option value="yes">متوفر</option>
                <option value="no">غير متوفر</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>مزايا أخرى</label>
              <input type="text" value={additionalBenefits} onChange={(e) => setAdditionalBenefits(e.target.value)} placeholder="مثال: بونص شهري، تدريب مجاني" style={inputStyle} />
            </div>
          </div>
        </fieldset>

        <fieldset style={sectionStyle}>
          <h3 style={h3Style}>🏢 إعدادات الإعلان</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <input type="checkbox" id="showCompanyNamePost" checked={showCompanyName} onChange={(e) => setShowCompanyName(e.target.checked)} />
            <label htmlFor="showCompanyNamePost" style={{ fontSize: 13.5 }}>أظهر اسم الشركة في الإعلان</label>
          </div>

          <label style={labelStyle}>طريقة استقبال المتقدمين</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5 }}>
              <input type="radio" checked={receiveMethod === "platform"} onChange={() => setReceiveMethod("platform")} style={{ marginTop: 3 }} />
              <span><strong>استقبل الطلبات من خلال المنصة بس</strong> — تشوف المتقدمين من "عرض المتقدمين" في إعلاناتك</span>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5 }}>
              <input type="radio" checked={receiveMethod === "contact"} onChange={() => setReceiveMethod("contact")} style={{ marginTop: 3 }} />
              <span><strong>إظهار وسيلة تواصل مباشرة في الإعلان</strong> — الباحثين عن عمل يتواصلوا معاك مباشرة</span>
            </label>
          </div>

          {receiveMethod === "contact" && (
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>طريقة التواصل</label>
                <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} style={inputStyle}>
                  <option value="">اختر</option>
                  <option value="email">إيميل</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="phone">تليفون</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>بيانات التواصل</label>
                <input type="text" value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder="الإيميل أو الرقم" style={inputStyle} />
              </div>
            </div>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          style={{ width: "100%", padding: "14px", background: "#14213D", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          {submitting ? "جاري الحفظ..." : (isEditMode ? "حفظ التعديلات" : "نشر الإعلان")}
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