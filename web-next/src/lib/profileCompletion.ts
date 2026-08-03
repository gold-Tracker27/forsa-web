// حقول أساسية (نفس required الحالية) — وزن نقطة واحدة لكل واحد (زي الاختيارية بالظبط)،
// عشان التسجيل المصغّر (5 حقول) ميدّيش نسبة اكتمال عالية مقارنة بكمية البيانات الناقصة فعليًا
const ESSENTIAL_FIELDS = ["fullName", "phone", "governorate", "jobTitle"];
const ESSENTIAL_WEIGHT = 1;

// حقول اختيارية — وزن نقطة واحدة لكل واحد
const OPTIONAL_CHECKS: Array<(d: any) => boolean> = [
  (d) => !!d.email,
  (d) => !!d.photoURL,
  (d) => !!d.city,
  (d) => !!d.specialization,
  (d) => !!d.yearsOfExperience && Number(d.yearsOfExperience) > 0,
  (d) => !!d.educationLevel,
  (d) => !!d.jobType,
  (d) => Array.isArray(d.skills) && d.skills.length > 0,
  (d) => Array.isArray(d.languages) && d.languages.length > 0,
  (d) => !!d.bio && d.bio.trim().length > 0,
  (d) => !!d.cvFileURL,
  (d) => Array.isArray(d.workExperience) && d.workExperience.length > 0,
];

const TOTAL_POINTS = ESSENTIAL_FIELDS.length * ESSENTIAL_WEIGHT + OPTIONAL_CHECKS.length; // 4 + 12 = 16

export function calculateProfileCompletion(data: any): number {
  if (!data) return 0;
  const essentialEarned = ESSENTIAL_FIELDS.filter((f) => !!data[f] && String(data[f]).trim() !== "").length * ESSENTIAL_WEIGHT;
  const optionalEarned = OPTIONAL_CHECKS.filter((check) => {
    try {
      return check(data);
    } catch {
      return false;
    }
  }).length;
  return Math.round(((essentialEarned + optionalEarned) / TOTAL_POINTS) * 100);
}
