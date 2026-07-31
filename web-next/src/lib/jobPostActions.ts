import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function toggleJobActive(postId: string, makeActive: boolean): Promise<void> {
  await updateDoc(doc(db, "job_posts", postId), { isActive: makeActive });
}

export async function deleteJobPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "job_posts", postId));
}

export async function fetchApplicants(postId: string, employerId: string): Promise<any[]> {
  const snap = await getDocs(
    query(
      collection(db, "applications"),
      where("jobPostId", "==", postId),
      where("employerId", "==", employerId)
    )
  );
  return snap.docs.map((d) => d.data());
}

const CSV_BOM = String.fromCharCode(0xfeff);

export async function exportApplicantsCSV(postId: string, jobTitle: string, employerId: string): Promise<void> {
  const applicants = await fetchApplicants(postId, employerId);
  if (applicants.length === 0) {
    alert("لسه مفيش متقدمين على الإعلان ده.");
    return;
  }
  const headers = ["الاسم", "المسمى الوظيفي", "التخصص", "المحافظة", "المدينة", "سنوات الخبرة", "التليفون"];
  let csv = CSV_BOM + headers.join(",") + "\n";
  applicants.forEach((a) => {
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
