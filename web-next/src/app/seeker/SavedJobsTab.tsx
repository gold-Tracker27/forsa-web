"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { fetchSavedJobsWithDetails, setJobSaved, SavedJobEntry } from "@/lib/savedJobs";
import JobCard from "./JobCard";

export default function SavedJobsTab() {
  const router = useRouter();
  const [entries, setEntries] = useState<SavedJobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      setEntries(await fetchSavedJobsWithDetails(user.uid));
      setError("");
    } catch (err) {
      console.error("Saved jobs fetch failed", err);
      setError(
        "حصلت مشكلة في التحميل — افتح Console (F12) وشوف تفاصيل الخطأ. لو الخطأ بيقول \"requires an index\"، هيبقى فيه رابط تدوس عليه يعمل الفهرس المطلوب تلقائيًا."
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUnsave(jobId: string) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setJobSaved(jobId, user.uid, false);
      setEntries((prev) => prev.filter((e) => e.jobId !== jobId));
    } catch (err) {
      console.error("Unsave failed", err);
    }
  }

  if (loading) return <p dir="rtl">جاري التحميل...</p>;
  if (error) return <div dir="rtl" style={{ color: "#B03A14", padding: 12 }}>{error}</div>;

  return (
    <div dir="rtl">
      <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 10 }}>
        {entries.length} وظيفة محفوظة
      </div>

      {entries.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#4A5568" }}>
          لسه ما حفظتش أي وظيفة — دوس على "☆ حفظ" جنب أي وظيفة تعجبك من تبويب "تصفح الوظائف" عشان ترجعلها بسهولة بعدين.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map(({ job, jobId, unavailable }) => (
          <JobCard
            key={jobId}
            job={job}
            saved={true}
            unavailable={unavailable}
            onToggleSave={() => handleUnsave(jobId)}
            onClick={unavailable ? undefined : () => router.push(`/jobs/${jobId}`)}
          />
        ))}
      </div>
    </div>
  );
}
