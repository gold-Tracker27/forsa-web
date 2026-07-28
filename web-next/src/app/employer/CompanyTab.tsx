"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import EmployerOnboardingForm from "./EmployerOnboardingForm";

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

type Props = {
  companyData: any;
  onCompanyUpdated: () => void;
};

export default function CompanyTab({ companyData, onCompanyUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [openApplicantsFor, setOpenApplicantsFor] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);

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
    await updateDoc(doc(db, "job_posts", postId), { isActive: makeActive });
    loadMyJobPosts();
  }

  async function handleDelete(postId: string) {
    if (!confirm("متأكد إنك عايز تحذف الإعلان نهائيًا؟ الأفضل تستخدم \"إيقاف الإعلان\" بدل الحذف لو ممكن ترجعله لاحقًا.")) return;
    await deleteDoc(doc(db, "job_posts", postId));
    loadMyJobPosts();
  }

  async function toggleApplicants(postId: string) {
    if (openApplicantsFor === postId) {
      setOpenApplicantsFor(null);
      return;
    }
    setOpenApplicantsFor(postId);
    const snap = await getDocs(query(collection(db, "applications"), where("jobPostId", "==", postId)));
    setApplicants(snap.docs.map((d) => d.data()));
  }

  function exportCSV(postId: string, jobTitle: string) {
    const relevant = applicants; // already loaded for this postId via toggleApplicants
    if (relevant.length === 0) {
      alert("لسه مفيش متقدمين على الإعلان ده.");
      return;
    }
    const headers = ["الاسم", "المسمى الوظيفي", "التخصص", "المحافظة", "المدينة", "سنوات الخبرة", "التليفون"];
    let csv = "\uFEFF" + headers.join(",") + "\n";
    relevant.forEach((a) => {
      const s = a.seekerSnapshot || {};
      const row = [s.fullName || "", s.jobTitle || "", s.specialization || "", s.governorate || "", s.city || "", s.yearsOfExperience || 0, s.phone || ""];
      csv += row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants-${jobTitle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <span style={tagStyle}>{companyData.industry}</span>
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
                  <button onClick={() => toggleActive(p.id, p.isActive === false)} style={smallBtnStyle}>
                    {p.isActive === false ? "▶ إعادة تفعيل" : "⏸ إيقاف الإعلان"}
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={smallBtnStyle}>✕ حذف نهائي</button>
                </div>
              </div>
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
    </div>
  );
}

const tagStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999 };
const smallBtnStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, border: "1px solid #14213D", background: "transparent", borderRadius: 6, cursor: "pointer" };