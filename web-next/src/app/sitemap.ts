import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function sitemap() {
  const baseUrl = "https://elshoghl.com";

  const staticPages = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/jobs`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
  ];

  let jobPages: { url: string; lastModified: Date }[] = [];
  try {
    const snap = await getDocs(query(collection(db, "job_posts"), where("isActive", "==", true)));
    jobPages = snap.docs.map((d) => ({
      url: `${baseUrl}/jobs/${d.id}`,
      lastModified: new Date(),
    }));
  } catch (err) {
    console.error("Sitemap job fetch failed", err);
  }

  return [...staticPages, ...jobPages];
}