import { normalizeEntries } from "@/lib/profileFields";

export function buildSeekerSnapshot(s: any) {
  return {
    fullName: s.fullName || "",
    phone: s.phone || "",
    email: s.email || "",
    jobTitle: s.jobTitle || "",
    specialization: s.specialization || "",
    city: s.city || "",
    governorate: s.governorate || "",
    yearsOfExperience: s.yearsOfExperience || 0,
    cvFileURL: s.cvFileURL || null,
    photoURL: s.photoURL || null,
    skills: normalizeEntries(s.skills),
    languages: normalizeEntries(s.languages),
    militaryStatus: s.gender === "male" ? s.militaryStatus || "" : "",
  };
}
