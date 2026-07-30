import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import ApplyButton from "./ApplyButton";
import ShareButton from "@/components/ShareButton";
import RelatedJobs from "./RelatedJobs";
import { EXPERIENCE_LEVELS } from "@/lib/constants";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  remote: "عن بعد",
  freelance: "فريلانس",
};

async function getJob(id: string): Promise<any> {
  const snap = await getDoc(doc(db, "job_posts", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.isActive !== true) return null;
  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) return null;
  return { id: snap.id, ...data };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return { title: "وظيفة غير متاحة - الشغل" };
  }
  const description = `${job.title} في ${job.city} - ${job.governorate}. ${(job.description || "").slice(0, 120)}`;
  return {
    title: `${job.title} - وظيفة على منصة الشغل`,
    description,
    openGraph: {
      title: `${job.title} - وظيفة على منصة الشغل`,
      description,
    },
  };
}

function salaryText(p: any) {
  if (p.showSalary === false) return "غير محدد";
  if (p.salaryNegotiable) return "قابل للتفاوض / حسب الخبرة";
  if (p.salaryFrom && p.salaryTo) return `${p.salaryFrom} - ${p.salaryTo} جنيه`;
  if (p.salaryFrom) return `يبدأ من ${p.salaryFrom} جنيه`;
  return "غير محدد";
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return (
    <div dir="rtl" style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>{job.title}</h1>
      <div style={{ color: "#4A5568", marginBottom: 16 }}>
        {job.showCompanyName && job.companyName ? job.companyName : "شركة غير معلنة"}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={tagStyle}>{job.specialization}</span>
        <span style={tagStyle}>{job.city} - {job.governorate}</span>
        <span style={tagStyle}>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
        {job.jobLevel && <span style={tagStyle}>{EXPERIENCE_LEVELS[job.jobLevel] || job.jobLevel}</span>}
        {job.featured && <span style={tagStyle}>⭐ مميز</span>}
        <ShareButton jobId={job.id} title={job.title} />
      </div>

      <p style={{ lineHeight: 1.8, marginBottom: 20 }}>{job.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14, marginBottom: 20 }}>
        <DetailRow label="الراتب" value={salaryText(job)} />
        <DetailRow label="عدد الفرص المتاحة" value={job.vacancies ? `${job.vacancies} فرصة` : undefined} />
        <DetailRow
          label="السن المطلوب"
          value={
            job.ageFrom && job.ageTo
              ? `${job.ageFrom} - ${job.ageTo} سنة`
              : job.ageFrom
              ? `من ${job.ageFrom} سنة`
              : job.ageTo
              ? `لحد ${job.ageTo} سنة`
              : undefined
          }
        />
        <DetailRow label="محتاج عربية" value={job.needsCar === "yes" ? "أيوة ✓" : job.needsCar === "no" ? "لأ" : undefined} />
        <DetailRow label="ساعات العمل يوميًا" value={job.hoursPerDay ? `${job.hoursPerDay} ساعات` : undefined} />
        <DetailRow label="التأمين الاجتماعي" value={job.socialInsurance === "yes" ? "متوفر ✓" : job.socialInsurance === "no" ? "غير متوفر" : undefined} />
        <DetailRow label="المواصلات" value={job.transportationAvailable === "yes" ? "متوفرة ✓" : job.transportationAvailable === "no" ? "غير متوفرة" : undefined} />
        <DetailRow label="سكن المغتربين" value={job.housingForExpats === "yes" ? "متوفر ✓" : job.housingForExpats === "no" ? "غير متوفر" : undefined} />
      </div>

      {job.requirements && (
        <p style={{ marginBottom: 10 }}><strong>الشروط:</strong> {job.requirements}</p>
      )}
      {job.additionalBenefits && (
        <p style={{ marginBottom: 20 }}><strong>مزايا إضافية:</strong> {job.additionalBenefits}</p>
      )}

      {job.receiveMethod === "contact" && job.contactValue ? (
        <p style={{ color: "#4A5568" }}>
          <strong>التواصل ({({ email: "إيميل", whatsapp: "واتساب", phone: "تليفون" } as Record<string,string>)[job.contactMethod] || job.contactMethod}):</strong> {job.contactValue}
        </p>
      ) : (
        <ApplyButton jobId={job.id} employerId={job.employerId} screeningQuestions={job.screeningQuestions || []} />
      )}

      <RelatedJobs jobId={job.id} specialization={job.specialization} governorate={job.governorate} />
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
