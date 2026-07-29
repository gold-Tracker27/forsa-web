import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  remote: "عن بعد",
  freelance: "فريلانس",
};

const RESULT_COUNT = 4;

type RelatedJob = {
  id: string;
  title: string;
  companyName?: string;
  showCompanyName?: boolean;
  governorate: string;
  jobType: string;
  expiresAt?: any;
};

async function fetchActiveJobs(constraints: any[], excludeId: string) {
  const snap = await getDocs(query(collection(db, "job_posts"), ...constraints));
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as RelatedJob))
    .filter((p) => p.id !== excludeId)
    .filter((p) => !p.expiresAt || p.expiresAt.toMillis() > now);
}

async function getRelatedJobs(current: { id: string; specialization: string; governorate: string }) {
  const results: RelatedJob[] = [];
  const seen = new Set<string>([current.id]);

  function addJobs(jobs: RelatedJob[]) {
    for (const job of jobs) {
      if (results.length >= RESULT_COUNT) break;
      if (!seen.has(job.id)) {
        results.push(job);
        seen.add(job.id);
      }
    }
  }

  try {
    addJobs(
      await fetchActiveJobs(
        [
          where("isActive", "==", true),
          where("specialization", "==", current.specialization),
          orderBy("createdAt", "desc"),
          limit(RESULT_COUNT + 1),
        ],
        current.id
      )
    );
  } catch (err) {
    console.error("Related jobs (specialization) failed", err);
  }

  if (results.length < RESULT_COUNT) {
    try {
      addJobs(
        await fetchActiveJobs(
          [
            where("isActive", "==", true),
            where("governorate", "==", current.governorate),
            orderBy("createdAt", "desc"),
            limit(RESULT_COUNT + 1),
          ],
          current.id
        )
      );
    } catch (err) {
      console.error("Related jobs (governorate) failed", err);
    }
  }

  if (results.length < RESULT_COUNT) {
    try {
      addJobs(
        await fetchActiveJobs(
          [where("isActive", "==", true), orderBy("createdAt", "desc"), limit(RESULT_COUNT + 1)],
          current.id
        )
      );
    } catch (err) {
      console.error("Related jobs (latest) failed", err);
    }
  }

  return results.slice(0, RESULT_COUNT);
}

export default async function RelatedJobs({
  jobId,
  specialization,
  governorate,
}: {
  jobId: string;
  specialization: string;
  governorate: string;
}) {
  const jobs = await getRelatedJobs({ id: jobId, specialization, governorate });

  if (jobs.length === 0) return null;

  return (
    <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #DED2B5" }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>وظائف ذات صلة</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            style={{
              display: "block",
              border: "1px solid #14213D22",
              borderRadius: 10,
              padding: 14,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h4 style={{ margin: "0 0 6px", fontSize: 15 }}>{job.title}</h4>
            <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 8 }}>
              {job.showCompanyName && job.companyName ? job.companyName : "شركة غير معلنة"}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={tagStyle}>{job.governorate}</span>
              <span style={tagStyle}>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const tagStyle: React.CSSProperties = { fontSize: 11, background: "#F0EDE3", padding: "3px 8px", borderRadius: 999 };
