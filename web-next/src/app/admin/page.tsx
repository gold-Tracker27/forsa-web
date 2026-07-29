"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ShareButton from "@/components/ShareButton";
import PostJobTab from "../employer/PostJobTab";
import { toggleJobActive, deleteJobPost, fetchApplicants, exportApplicantsCSV } from "@/lib/jobPostActions";

const ADMIN_EMAILS = ["elshoghl27@gmail.com", "mohamedzakaria2727@gmail.com"];

type EditingPost = { id: string; data: any } | null;

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

type Stats = {
  seekers: number;
  employers: number;
  premium: number;
  allPosts: number;
  activePosts: number;
  applications: number;
};

export default function AdminPage() {
  const [status, setStatus] = useState<"loading" | "denied" | "allowed">("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingPost, setEditingPost] = useState<EditingPost>(null);
  const [openApplicantsFor, setOpenApplicantsFor] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
        setStatus("denied");
        return;
      }
      setStatus("allowed");
      loadStats();
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const [seekersSnap, employersSnap, postsSnap, activePostsSnap, appsSnap] = await Promise.all([
        getDocs(collection(db, "job_seekers")),
        getDocs(collection(db, "employers")),
        getDocs(collection(db, "job_posts")),
        getDocs(query(collection(db, "job_posts"), where("isActive", "==", true))),
        getDocs(collection(db, "applications")),
      ]);

      const premiumCount = employersSnap.docs.filter((d) => d.data().plan === "premium").length;

      setStats({
        seekers: seekersSnap.size,
        employers: employersSnap.size,
        premium: premiumCount,
        allPosts: postsSnap.size,
        activePosts: activePostsSnap.size,
        applications: appsSnap.size,
      });

      const appCounts: Record<string, number> = {};
      appsSnap.docs.forEach((d) => {
        const jid = d.data().jobPostId;
        appCounts[jid] = (appCounts[jid] || 0) + 1;
      });

      const postsList = postsSnap.docs
        .map((d) => ({ id: d.id, ...d.data(), applicantCount: appCounts[d.id] || 0 } as any))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setPosts(postsList);
    } catch (err) {
      console.error("Admin stats failed", err);
    }
    setLoadingStats(false);
  }

  async function handleToggleActive(postId: string, makeActive: boolean) {
    await toggleJobActive(postId, makeActive);
    loadStats();
  }

  async function handleDelete(postId: string) {
    if (!confirm('متأكد إنك عايز تحذف الإعلان نهائيًا؟ ده إجراء نهائي ومش هينفع ترجع فيه.')) return;
    await deleteJobPost(postId);
    loadStats();
  }

  async function handleToggleApplicants(postId: string) {
    if (openApplicantsFor === postId) {
      setOpenApplicantsFor(null);
      return;
    }
    setOpenApplicantsFor(postId);
    setApplicants(await fetchApplicants(postId));
  }

  if (status === "loading") {
    return (
      <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
        <h2>الصفحة دي مش متاحة ليك</h2>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>لوحة الإدارة</h1>
      <p style={{ color: "#4A5568", marginBottom: 20 }}>إحصائيات عامة عن المنصة</p>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <StatCard label="الباحثين عن عمل" value={stats.seekers} />
          <StatCard label="أصحاب الأعمال" value={stats.employers} />
          <StatCard label="منهم باقة مدفوعة" value={stats.premium} />
          <StatCard label="كل الإعلانات" value={stats.allPosts} />
          <StatCard label="الإعلانات النشطة" value={stats.activePosts} />
          <StatCard label="كل التقديمات" value={stats.applications} />
        </div>
      )}

      <button
        onClick={loadStats}
        disabled={loadingStats}
        style={{
          padding: "8px 16px",
          border: "1px solid #14213D",
          background: "transparent",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 30,
        }}
      >
        {loadingStats ? "جاري التحديث..." : "🔄 تحديث"}
      </button>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>كل الإعلانات المنشورة على الموقع</h2>

      {posts.length === 0 && <div style={{ color: "#4A5568" }}>مفيش إعلانات لسه.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.map((p) => (
          <div key={p.id} style={{ border: "1px solid #14213D22", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#4A5568" }}>
                {formatDate(p.createdAt)} · {p.isActive === false ? "متوقف" : "نشط"}
                {p.featured ? " · ⭐ مميز" : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setEditingPost({ id: p.id, data: p })} style={smallBtnStyle}>✎ تعديل</button>
                <button onClick={() => handleToggleActive(p.id, p.isActive === false)} style={smallBtnStyle}>
                  {p.isActive === false ? "▶ إعادة تفعيل" : "⏸ إيقاف الإعلان"}
                </button>
                <button onClick={() => handleDelete(p.id)} style={smallBtnStyle}>✕ حذف نهائي</button>
              </div>
            </div>
            <h4 style={{ margin: "0 0 6px" }}>{p.title}</h4>
            <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
              {p.companyName || "بدون اسم شركة"}
              {!p.showCompanyName ? " (مخفي عن الباحثين)" : ""}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={tagStyle}>{p.specialization}</span>
              <span style={tagStyle}>{p.city} - {p.governorate}</span>
              <span style={tagStyle}>{JOB_TYPE_LABELS[p.jobType] || p.jobType}</span>
              <span style={{ ...tagStyle, fontWeight: 700 }}>👥 {p.applicantCount} متقدم</span>
              <ShareButton jobId={p.id} title={p.title} />
              <a
                href={`/jobs/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...tagStyle, textDecoration: "none", color: "#14213D" }}
              >
                🔗 عرض الصفحة العامة
              </a>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => handleToggleApplicants(p.id)} style={smallBtnStyle}>
                👥 عرض المتقدمين ({p.applicantCount})
              </button>
              {p.applicantCount > 0 && (
                <button onClick={() => exportApplicantsCSV(p.id, p.title)} style={smallBtnStyle}>⬇ تحميل Excel</button>
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
        ))}
      </div>

      {editingPost && (
        <div
          onClick={() => setEditingPost(null)}
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
              maxWidth: 750,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setEditingPost(null)}
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
            <PostJobTab
              employerPlan={editingPost.data.featured ? "premium" : "free"}
              companyName={editingPost.data.companyName || ""}
              editingPost={editingPost}
              onPosted={() => {
                setEditingPost(null);
                loadStats();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #14213D22", borderRadius: 8, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#4A5568" }}>{label}</div>
    </div>
  );
}

const tagStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999 };
const smallBtnStyle: React.CSSProperties = { padding: "6px 12px", fontSize: 13, border: "1px solid #14213D", background: "transparent", borderRadius: 6, cursor: "pointer" };