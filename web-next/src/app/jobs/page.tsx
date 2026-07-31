import Link from "next/link";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { jobCardContainerStyle, tagStyle, featuredPillStyle, JOB_TYPE_LABELS } from "@/lib/jobCardStyles";

export const metadata = {
  title: "تصفح الوظائف - منصة الشغل",
  description: "تصفح أحدث الوظائف المتاحة في مصر على منصة الشغل — وظائف في كل التخصصات والمحافظات.",
};

async function getActiveJobs() {
  const q = query(
    collection(db, "job_posts"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((p) => !p.expiresAt || p.expiresAt.toMillis() > now)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}

export default async function JobsListPage() {
  const jobs = await getActiveJobs();

  return (
    <div dir="rtl" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>تصفح الوظائف</h1>
      <p style={{ color: "#4A5568", marginBottom: 24 }}>
        {jobs.length} وظيفة متاحة حاليًا على منصة الشغل
      </p>

      {jobs.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#4A5568" }}>
          مفيش وظائف متاحة دلوقتي — تابعنا قريبًا.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            style={{
              ...jobCardContainerStyle,
              display: "block",
              padding: 18,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#14213D" }}>{job.title}</h3>
              {job.featured && <span style={featuredPillStyle}>⭐ مميز</span>}
            </div>
            <div style={{ fontSize: 13, color: "#4A5568", marginTop: 6 }}>
              {job.showCompanyName && job.companyName ? job.companyName : "شركة غير معلنة"} · 📍 {job.city} - {job.governorate}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid #14213D14" }}>
              <span style={tagStyle}>{job.specialization}</span>
              <span style={tagStyle}>🕐 {JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}