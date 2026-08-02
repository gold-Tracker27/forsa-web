import { slugify } from "@/lib/constants";
import { getActiveJobsSeoData } from "@/lib/publicJobsQuery";

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
  let governoratePages: { url: string; lastModified: Date }[] = [];
  let comboPages: { url: string; lastModified: Date }[] = [];
  try {
    const { jobIds, governorates, combos } = await getActiveJobsSeoData();

    jobPages = jobIds.map((id) => ({
      url: `${baseUrl}/jobs/${id}`,
      lastModified: new Date(),
    }));

    governoratePages = governorates.map((g) => ({
      url: `${baseUrl}/jobs/${slugify(g)}`,
      lastModified: new Date(),
    }));

    comboPages = combos.map((c) => ({
      url: `${baseUrl}/jobs/${slugify(c.governorate)}/${slugify(c.specialization)}`,
      lastModified: new Date(),
    }));
  } catch (err) {
    console.error("Sitemap job fetch failed", err);
  }

  return [...staticPages, ...jobPages, ...governoratePages, ...comboPages];
}
