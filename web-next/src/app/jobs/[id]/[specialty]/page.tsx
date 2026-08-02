import Link from "next/link";
import { notFound } from "next/navigation";
import { findGovernorateBySlug, findSpecialtyBySlug } from "@/lib/constants";
import { getActivePublicJobs } from "@/lib/publicJobsQuery";
import JobListItem from "../../JobListItem";

// [id] هنا هو slug المحافظة (زي القاهرة) — نفس تسمية segment الأب في jobs/[id]/page.tsx.
export async function generateMetadata({ params }: { params: Promise<{ id: string; specialty: string }> }) {
  const { id: govSlug, specialty: specSlug } = await params;
  const governorate = findGovernorateBySlug(govSlug);
  const specialization = findSpecialtyBySlug(specSlug);
  if (!governorate || !specialization) return { title: "صفحة غير موجودة - الشغل" };

  const jobs = await getActivePublicJobs({ governorate, specialization });
  const title = `وظائف ${specialization} في ${governorate} | الشغل`;
  const description =
    jobs.length > 0
      ? `${jobs.length} وظيفة ${specialization} متاحة حاليًا في ${governorate} على منصة الشغل — تصفح وقدّم دلوقتي.`
      : `تصفح أحدث وظائف ${specialization} في ${governorate} على منصة الشغل.`;

  return {
    title,
    description,
    ...(jobs.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function GovernorateSpecialtyJobsPage({
  params,
}: {
  params: Promise<{ id: string; specialty: string }>;
}) {
  const { id: govSlug, specialty: specSlug } = await params;
  const governorate = findGovernorateBySlug(govSlug);
  const specialization = findSpecialtyBySlug(specSlug);
  if (!governorate || !specialization) notFound();

  const jobs = await getActivePublicJobs({ governorate, specialization });

  return (
    <div dir="rtl" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>
        وظائف {specialization} في {governorate}
      </h1>
      <p style={{ color: "#4A5568", marginBottom: 24 }}>
        {jobs.length > 0
          ? `${jobs.length} وظيفة ${specialization} متاحة حاليًا في ${governorate}`
          : `مفيش وظائف ${specialization} نشطة في ${governorate} دلوقتي`}
      </p>

      {jobs.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#4A5568" }}>
          مفيش وظائف {specialization} متاحة في {governorate} دلوقتي —{" "}
          <Link href={`/jobs/${govSlug}`} style={{ color: "#14213D" }}>
            تصفح كل الوظائف في {governorate}
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {jobs.map((job) => (
          <JobListItem key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
