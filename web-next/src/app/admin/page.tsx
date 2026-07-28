"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ADMIN_EMAILS = ["elshoghl27@gmail.com", "mohamedzakaria2727@gmail.com"];

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
            <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 6 }}>
              {formatDate(p.createdAt)} · {p.isActive === false ? "متوقف" : "نشط"}
              {p.featured ? " · ⭐ مميز" : ""}
            </div>
            <h4 style={{ margin: "0 0 6px" }}>{p.title}</h4>
            <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
              {p.companyName || "بدون اسم شركة"}
              {!p.showCompanyName ? " (مخفي عن الباحثين)" : ""}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={tagStyle}>{p.specialization}</span>
              <span style={tagStyle}>{p.city} - {p.governorate}</span>
              <span style={tagStyle}>{JOB_TYPE_LABELS[p.jobType] || p.jobType}</span>
              <span style={{ ...tagStyle, fontWeight: 700 }}>👥 {p.applicantCount} متقدم</span>
            </div>
          </div>
        ))}
      </div>
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