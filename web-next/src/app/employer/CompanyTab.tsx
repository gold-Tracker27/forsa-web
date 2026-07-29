"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import EmployerOnboardingForm from "./EmployerOnboardingForm";
import { toggleJobActive, deleteJobPost, fetchApplicants, exportApplicantsCSV } from "@/lib/jobPostActions";

type JobPost = {
  id: string;
  title: string;
  specialization: string;
  city: string;
  governorate: string;
  jobType: string;
  description?: string;
  isActive?: boolean;
  featured?: boolean;
  createdAt?: any;
  expiresAt?: any;
  vacancies?: number;
  salaryNegotiable?: boolean;
  salaryFrom?: number;
  salaryTo?: number;
  showSalary?: boolean;
  ageFrom?: number;
  ageTo?: number;
  needsCar?: string;
  requirements?: string;
  hoursPerDay?: number;
  daysOffPerMonth?: number;
  socialInsurance?: string;
  privateHealthInsurance?: string;
  transportationAvailable?: string;
  transportationAreas?: string;
  housingForExpats?: string;
  additionalBenefits?: string;
  showCompanyName?: boolean;
  receiveMethod?: string;
  contactMethod?: string;
  contactValue?: string;
};

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  remote: "عن بعد",
  freelance: "فريلانس",
};

function formatDate(ts: any) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ar-EG");
}

function salaryText(p: JobPost) {
  if (p.showSalary === false) return "غير محدد";
  if (p.salaryNegotiable) return "قابل للتفاوض / حسب الخبرة";
  if (p.salaryFrom && p.salaryTo) return `${p.salaryFrom} - ${p.salaryTo} جنيه`;
  if (p.salaryFrom) return `يبدأ من ${p.salaryFrom} جنيه`;
  return "غير محدد";
}

type Props = {
  companyData: any;
  onCompanyUpdated: () => void;
  onEditPost: (id: string, data: any) => void;
};

export default function CompanyTab({ companyData, onCompanyUpdated, onEditPost }: Props) {
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [openApplicantsFor, setOpenApplicantsFor] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [detailPost, setDetailPost] = useState<JobPost | null>(null);

  async function loadMyJobPosts() {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    const snap = await getDocs(query(collection(db, "job_posts"), where("employerId", "==", user.uid)));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const now = Date.now();
    for (const p of list) {
      if (p.isActive !== false && p.expiresAt && p.expiresAt.toMillis() < now) {
        p.isActive = false;
        updateDoc(doc(db, "job_posts", p.id), { isActive: false }).catch(() => {});
      }
    }

    setPosts(list);

    const appsSnap = await getDocs(query(collection(db, "applications"), where("employerId", "==", user.uid)));
    const counts: Record<string, number> = {};
    appsSnap.docs.forEach((d) => {
      const jid = d.data().jobPostId;
      counts[jid] = (counts[jid] || 0) + 1;
    });
    setApplicantCounts(counts);

    setLoading(false);
  }

  useEffect(() => {
    loadMyJobPosts();
  }, []);

  async function toggleActive(postId: string, makeActive: boolean) {
    await toggleJobActive(postId, makeActive);
    loadMyJobPosts();
  }

  async function handleDelete(postId: string) {
    if (!confirm('متأكد إنك عايز تحذف الإعلان نهائيًا؟ الأفضل تستخدم "إيقاف الإعلان" بدل الحذف لو ممكن ترجعله لاحقًا.')) return;
    await deleteJobPost(postId);
    setDetailPost(null);
    loadMyJobPosts();
  }

  async function toggleApplicants(postId: string) {
    if (openApplicantsFor === postId) {
      setOpenApplicantsFor(null);
      return;
    }
    setOpenApplicantsFor(postId);
    setApplicants(await fetchApplicants(postId));
  }

  function exportCSV(postId: string, jobTitle: string) {
    exportApplicantsCSV(postId, jobTitle);
  }

  if (editing) {
    return (
      <EmployerOnboardingForm
        initialData={companyData}
        onSaved={() => {
          setEditing(false);
          onCompanyUpdated();
        }}
      />
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16 }}>بيانات شركتك</h2>

      <div style={{ border: "1px solid #14213D22", borderRadius: 10, padding: 20, marginBottom: 10 }}>
        {companyData.logoURL && (
          <img src={companyData.logoURL} alt="لوجو الشركة" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={tagStyle}>{companyData.companyName}</span>
          {companyData.industry && <span style={tagStyle}>{companyData.industry}</span>}
          <span style={tagStyle}>{companyData.city} - {companyData.governorate}</span>
        </div>
        <p style={{ color: "#4A5568", fontSize: 14 }}>
          مسؤول التواصل: {companyData.contactPerson || "—"} · {companyData.phone || "—"}
        </p>
      </div>

      <button
        onClick={() => setEditing(true)}
        style={{ padding: "10px 20px", background: "#14213D", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", marginBottom: 30 }}
      >
        تعديل بيانات الشركة
      </button>

      <h2 style={{ marginBottom: 16 }}>إعلاناتك المنشورة</h2>

      {loading && <p>جاري التحميل...</p>}
      {!loading && posts.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#4A5568" }}>لسه ما نشرتش أي إعلان وظيفة.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map((p) => {
          const appCount = applicantCounts[p.id] || 0;
          const daysLeft = p.expiresAt ? Math.ceil((p.expiresAt.toMillis() - Date.now()) / 86400000) : null;
          return (
            <div key={p.id} style={{ border: "1px solid #14213D22", borderRadius: 10, padding: 18, opacity: p.isActive === false ? 0.65 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.isActive === false && <span style={tagStyle}>⏸ متوقف — مش ظاهر للعامة</span>}
                  {p.featured && <span style={tagStyle}>⭐ مميز</span>}
                  <span style={tagStyle}>👥 {appCount} متقدم</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onEditPost(p.id, p)} style={smallBtnStyle}>✎ تعديل</button>
                  <button onClick={() => toggleActive(p.id, p.isActive === false)} style={smallBtnStyle}>
                    {p.isActive === false ? "▶ إعادة تفعيل" : "⏸ إيقاف الإعلان"}
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={smallBtnStyle}>✕ حذف نهائي</button>
                </div>
              </div>
              <div
                onClick={() => setDetailPost(p)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 6 }}>
                  {formatDate(p.createdAt)}
                  {p.isActive !== false && daysLeft !== null ? ` · باقي ${daysLeft} يوم قبل انتهاء الإعلان` : ""}
                </div>
                <h4 style={{ margin: "0 0 8px" }}>{p.title}</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={tagStyle}>{p.specialization}</span>
                  <span style={tagStyle}>{p.city} - {p.governorate}</span>
                  <span style={tagStyle}>{JOB_TYPE_LABELS[p.jobType] || p.jobType}</span>
                </div>
                <p style={{ fontSize: 14, color: "#333" }}>{(p.description || "").slice(0, 150)}</p>
                <div style={{ fontSize: 12.5, color: "#14213D", marginTop: 6, textDecoration: "underline" }}>
                  عرض التفاصيل الكاملة
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button onClick={() => toggleApplicants(p.id)} style={smallBtnStyle}>
                  👥 عرض المتقدمين ({appCount})
                </button>
                {appCount > 0 && (
                  <button onClick={() => exportCSV(p.id, p.title)} style={smallBtnStyle}>⬇ تحميل Excel</button>
                )}
              </div>

              {openApplicantsFor === p.id && (
                <div style={{ marginTop: 12 }}>
                  {applicants.length === 0 ? (
                    <div style={{ padding: 12, color: "#4A5568" }}>لسه محدش قدّم على الإعلان ده.</div>
                  ) : (
                    applicants.map((a, i) => {
                      const s = a.seekerSnapshot || {};
                      return (
                        <div key={i} style={{ background: "#F5EFDE", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <strong>{s.fullName || "بدون اسم"}</strong> — {s.jobTitle || ""}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                            <span style={tagStyle}>{s.specialization || ""}</span>
                            <span style={tagStyle}>{s.city || ""} - {s.governorate || ""}</span>
                            <span style={tagStyle}>{s.yearsOfExperience || 0} سنوات خبرة</span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13.5 }}>📞 <strong>{s.phone || "—"}</strong></div>
                          {s.cvFileURL && (
                            <a href={s.cvFileURL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6, color: "#14213D" }}>
                              📄 السيرة الذاتية
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* مودال تفاصيل الوظيفة الكاملة */}
      {detailPost && (
        <div
          onClick={() => setDetailPost(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,33,61,0.55)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 550,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setDetailPost(null)}
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1.5px solid #ccc",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <h2 style={{ marginBottom: 4 }}>{detailPost.title}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={tagStyle}>{detailPost.specialization}</span>
              <span style={tagStyle}>{detailPost.city} - {detailPost.governorate}</span>
              <span style={tagStyle}>{JOB_TYPE_LABELS[detailPost.jobType] || detailPost.jobType}</span>
              {detailPost.featured && <span style={tagStyle}>⭐ مميز</span>}
            </div>

            <p style={{ lineHeight: 1.7, marginBottom: 12 }}>{detailPost.description}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13.5 }}>
              <DetailRow label="الراتب" value={salaryText(detailPost)} />
              <DetailRow label="عدد الفرص المتاحة" value={detailPost.vacancies ? `${detailPost.vacancies} فرصة` : undefined} />
              <DetailRow
                label="السن المطلوب"
                value={
                  detailPost.ageFrom && detailPost.ageTo
                    ? `${detailPost.ageFrom} - ${detailPost.ageTo} سنة`
                    : detailPost.ageFrom
                    ? `من ${detailPost.ageFrom} سنة`
                    : detailPost.ageTo
                    ? `لحد ${detailPost.ageTo} سنة`
                    : undefined
                }
              />
              <DetailRow label="محتاج عربية" value={detailPost.needsCar === "yes" ? "أيوة ✓" : detailPost.needsCar === "no" ? "لأ" : undefined} />
              <DetailRow label="ساعات العمل يوميًا" value={detailPost.hoursPerDay ? `${detailPost.hoursPerDay} ساعات` : undefined} />
              <DetailRow label="أيام الراحة شهريًا" value={detailPost.daysOffPerMonth !== undefined && detailPost.daysOffPerMonth !== null ? `${detailPost.daysOffPerMonth} يوم` : undefined} />
              <DetailRow label="تأمين اجتماعي" value={detailPost.socialInsurance === "yes" ? "متوفر ✓" : detailPost.socialInsurance === "no" ? "غير متوفر" : undefined} />
              <DetailRow label="تأمين صحي خاص" value={detailPost.privateHealthInsurance === "yes" ? "متوفر ✓" : detailPost.privateHealthInsurance === "no" ? "غير متوفر" : undefined} />
              <DetailRow label="مواصلات" value={detailPost.transportationAvailable === "yes" ? "متوفرة ✓" : detailPost.transportationAvailable === "no" ? "غير متوفرة" : undefined} />
              <DetailRow label="سكن المغتربين" value={detailPost.housingForExpats === "yes" ? "متوفر ✓" : detailPost.housingForExpats === "no" ? "غير متوفر" : undefined} />
            </div>

            {detailPost.transportationAreas && (
              <p style={{ marginTop: 10 }}><strong>أماكن المواصلات:</strong> {detailPost.transportationAreas}</p>
            )}
            {detailPost.requirements && (
              <p style={{ marginTop: 10 }}><strong>الشروط:</strong> {detailPost.requirements}</p>
            )}
            {detailPost.additionalBenefits && (
              <p style={{ marginTop: 10 }}><strong>مزايا إضافية:</strong> {detailPost.additionalBenefits}</p>
            )}
            {detailPost.receiveMethod === "contact" && detailPost.contactValue && (
              <p style={{ marginTop: 10 }}>
                <strong>التواصل ({{ email: "إيميل", whatsapp: "واتساب", phone: "تليفون" }[detailPost.contactMethod || ""] || detailPost.contactMethod}):</strong> {detailPost.contactValue}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { onEditPost(detailPost.id, detailPost); setDetailPost(null); }}
                style={{ padding: "10px 20px", background: "#14213D", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                ✎ تعديل الإعلان
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

const tagStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999 };
const smallBtnStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, border: "1px solid #14213D", background: "transparent", borderRadius: 6, cursor: "pointer" };