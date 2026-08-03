import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// تسجيل أخطاء بسيط من جانب العميل — بيسجل تفاصيل تقنية (كود/رسالة الخطأ، الخطوة، الصفحة)
// من غير أي بيانات شخصية حساسة (اسم/إيميل/تليفون)، عشان نقدر نشخّص مشاكل زي فشل التسجيل
// من غير ما نحتاج نسأل المستخدم نفسه. الكتابة على error_logs محتاجة قاعدة Firestore منفصلة
// (write-only، بدون قراءة) — راجع الرسالة اللي فيها القاعدة قبل الاعتماد على اللوج ده.
export async function logClientError(step: string, err?: unknown, extra?: Record<string, unknown>) {
  try {
    const anyErr = err as any;
    await addDoc(collection(db, "error_logs"), {
      step,
      code: anyErr?.code || null,
      message: err ? anyErr?.message || String(err) : null,
      uid: auth.currentUser?.uid || null,
      page: typeof window !== "undefined" ? window.location.pathname : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      ...extra,
      createdAt: serverTimestamp(),
    });
  } catch (logErr) {
    // اللوج نفسه لازم ميوقفش أي حاجة لو فشل — نسجل في console بس كملاذ أخير
    console.error("[errorLog] فشل تسجيل الخطأ في error_logs", logErr);
  }
}
