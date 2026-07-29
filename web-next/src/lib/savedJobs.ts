import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function savedJobDocId(jobId: string, uid: string) {
  return `${jobId}_${uid}`;
}

export async function setJobSaved(jobId: string, uid: string, saved: boolean): Promise<void> {
  const ref = doc(db, "saved_jobs", savedJobDocId(jobId, uid));
  if (saved) {
    await setDoc(ref, { jobPostId: jobId, seekerId: uid, savedAt: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}

export async function fetchSavedJobIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(query(collection(db, "saved_jobs"), where("seekerId", "==", uid)));
  return new Set(snap.docs.map((d) => d.data().jobPostId));
}

export type SavedJobEntry = {
  job: any;
  jobId: string;
  unavailable: boolean;
};

// بيرجّع تفاصيل كل وظيفة محفوظة، وبينضّف تلقائيًا أي مرجع بيشاور على وظيفة اتمسحت نهائيًا
export async function fetchSavedJobsWithDetails(uid: string): Promise<SavedJobEntry[]> {
  const snap = await getDocs(
    query(collection(db, "saved_jobs"), where("seekerId", "==", uid), orderBy("savedAt", "desc"))
  );
  const jobIds = snap.docs.map((d) => d.data().jobPostId as string);
  const now = Date.now();

  const entries = await Promise.all(
    jobIds.map(async (jobId): Promise<SavedJobEntry | null> => {
      const jobSnap = await getDoc(doc(db, "job_posts", jobId));
      if (!jobSnap.exists()) {
        deleteDoc(doc(db, "saved_jobs", savedJobDocId(jobId, uid))).catch(() => {});
        return null;
      }
      const job = { id: jobSnap.id, ...jobSnap.data() } as any;
      const expired = job.expiresAt && job.expiresAt.toMillis() < now;
      return { job, jobId, unavailable: job.isActive === false || !!expired };
    })
  );

  return entries.filter((e): e is SavedJobEntry => e !== null);
}
