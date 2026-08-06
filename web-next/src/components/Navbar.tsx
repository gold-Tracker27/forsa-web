"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import NotificationBell from "./NotificationBell";
import LogoMark from "./LogoMark";

const ADMIN_EMAILS = ["elshoghl27@gmail.com", "mohamedzakaria2727@gmail.com"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState<"job_seeker" | "employer" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLabel, setUserLabel] = useState("");
  const [employerPlan, setEmployerPlan] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeEmployerDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = null;
      unsubscribeEmployerDoc?.();
      unsubscribeEmployerDoc = null;

      if (!user) {
        setSignedIn(false);
        setUserType(null);
        setIsAdmin(false);
        setEmployerPlan(null);
        return;
      }
      setSignedIn(true);
      setUserLabel(user.displayName || user.email || user.phoneNumber || "");
      setIsAdmin(ADMIN_EMAILS.includes(user.email || ""));

      // onSnapshot بدل getDoc (قراءة لمرة واحدة) — أول تسجيل دخول بيكتب users/{uid} من
      // routeAfterAuth في page.tsx بالتوازي مع الاستماع ده، ولو الهيدر قرا قبل ما الكتابة
      // تخلص كان بيتجمّد على النتيجة القديمة (أو الفاضية) لحد ما حد يعمل ريفريش يدوي —
      // بالـonSnapshot أي تحديث لاحق للمستند بيوصل الهيدر أوتوماتيك من غير ريفريش خالص.
      unsubscribeUserDoc = onSnapshot(
        doc(db, "users", user.uid),
        (userDoc) => {
          const type = userDoc.exists() ? userDoc.data().userType || null : null;
          setUserType(type);

          unsubscribeEmployerDoc?.();
          unsubscribeEmployerDoc = null;

          if (type === "employer") {
            unsubscribeEmployerDoc = onSnapshot(
              doc(db, "employers", user.uid),
              (employerDoc) => {
                setEmployerPlan(employerDoc.exists() ? employerDoc.data().plan || "free" : "free");
              },
              (err) => {
                console.error("[Navbar] فشل قراءة employers/{uid} لمعرفة الباقة", err);
              }
            );
          } else {
            setEmployerPlan(null);
          }
        },
        (err) => {
          console.error("[Navbar] فشل قراءة users/{uid} لمعرفة نوع الحساب", err);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc?.();
      unsubscribeEmployerDoc?.();
    };
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  const isPremium = employerPlan === "premium";

  // الهيدر لازم يعكس الصفحة اللي المستخدم واقف فيها دلوقتي، مش آخر دور سجّل بيه دخول —
  // لأن نفس الحساب ممكن يكون عنده بروفايل صاحب عمل وبروفايل باحث عن شغل في نفس الوقت
  // /companies صفحة محايدة: بتقبل عناصر الطرفين (صاحب عمل وباحث) حسب مين الداخل
  const isSeekerContext = pathname.startsWith("/seeker");
  const isEmployerContext = pathname.startsWith("/employer") || pathname.startsWith("/admin");

  const showSeekerItems = userType === "job_seeker" && !isEmployerContext;
  const showEmployerItems = userType === "employer" && !isSeekerContext;
  const showAdminLink = isAdmin && !isSeekerContext;

  return (
    <nav
      dir="rtl"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        padding: "12px 20px",
        borderBottom: "1px solid #14213D22",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/" style={brandLinkStyle}>
          <LogoMark size={32} />
          <span style={brandTextStyle}>الشغل</span>
        </Link>
        {showSeekerItems && (
          <>
            <Link href="/seeker?tab=jobs" style={linkStyle}>🏠 تصفح الوظائف</Link>
            <Link href="/seeker?tab=saved" style={linkStyle}>🔖 الوظائف المحفوظة</Link>
            <Link href="/seeker?tab=profile" style={linkStyle}>👤 بروفايلي</Link>
          </>
        )}
        {showEmployerItems && (
          <span style={isPremium ? premiumBadgeStyle : freeBadgeStyle}>
            {isPremium ? "⭐ الباقة المدفوعة" : "الباقة المجانية"}
          </span>
        )}
        {showEmployerItems && (
          <>
            <Link href="/employer?tab=company" style={linkStyle}>🏠 بيانات الشركة</Link>
            <Link href="/employer?tab=postjob" style={linkStyle}>📝 نشر وظيفة جديدة</Link>
            <Link href="/employer?tab=talent" style={linkStyle}>🔍 البحث عن كوادر</Link>
          </>
        )}
        <Link href="/companies" style={linkStyle}>🏛️ الشركات</Link>
        {showAdminLink && <Link href="/admin" style={linkStyle}>📊 لوحة الإدارة</Link>}
        {signedIn && <NotificationBell />}
      </div>

      {signedIn && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#4A5568" }}>{userLabel}</span>
          <button onClick={handleSignOut} style={signOutStyle}>خروج</button>
        </div>
      )}
    </nav>
  );
}

const brandLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  marginLeft: 6,
};

const brandTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-cairo)",
  fontSize: 17,
  fontWeight: 800,
  color: "#14213D",
};

export const linkStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  textDecoration: "none",
  color: "#14213D",
  fontSize: 14,
  fontWeight: 600,
  border: "1px solid #14213D22",
};

const freeBadgeStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999, fontWeight: 700 };
const premiumBadgeStyle: React.CSSProperties = { fontSize: 12, background: "rgba(232,163,61,0.2)", padding: "3px 10px", borderRadius: 999, fontWeight: 700, color: "#8A570D" };

const signOutStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #B03A14",
  color: "#B03A14",
  background: "transparent",
  fontSize: 13,
  cursor: "pointer",
};
