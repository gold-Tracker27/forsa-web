import Link from "next/link";
import { jobCardContainerStyle, tagStyle, featuredPillStyle, JOB_TYPE_LABELS } from "@/lib/jobCardStyles";

export default function JobListItem({ job }: { job: any }) {
  return (
    <Link
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
  );
}
