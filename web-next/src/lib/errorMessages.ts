// رسالة عربية بسيطة للمستخدم العادي مهما كان الخطأ التقني الفعلي (فهرس Firestore ناقص،
// صلاحيات، إلخ) — التفاصيل الحقيقية تتسجل بـ console.error بس، مش تتعرض في الواجهة.
export function friendlyErrorMessage(err: any): string {
  const code: string = (err?.code || "").toLowerCase();
  const message: string = (err?.message || "").toLowerCase();
  const isNetworkIssue =
    code.includes("network") || code.includes("unavailable") || message.includes("network");

  if (isNetworkIssue) {
    return "تأكد من اتصال الإنترنت وحاول تاني";
  }
  return "حصلت مشكلة، جرب تاني";
}
