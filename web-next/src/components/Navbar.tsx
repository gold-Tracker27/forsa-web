"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ADMIN_EMAILS = ["elshoghl27@gmail.com", "mohamedzakaria2727@gmail.com"];

export default function Navbar() {
  const router = useRouter();
  const [userType, setUserType] = useState<"job_seeker" | "employer" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLabel, setUserLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserType(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUserLabel(user.displayName || user.email || "");
      setIsAdmin(ADMIN_EMAILS.includes(user.email || ""));

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserType(userDoc.data().userType || null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  if (loading || !userType) return null;

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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {userType === "job_seeker" && (
          <>
            <Link href="/seeker" style={linkStyle}>🏠 تصفح الوظائف</Link>
          </>
        )}
        {userType === "employer" && (
          <>
            <Link href="/employer" style={linkStyle}>🏢 لوحة صاحب العمل</Link>
          </>
        )}
        <Link href="/companies" style={linkStyle}>🏛️ الشركات</Link>
        {isAdmin && <Link href="/admin" style={linkStyle}>📊 لوحة الإدارة</Link>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#4A5568" }}>{userLabel}</span>
        <button onClick={handleSignOut} style={signOutStyle}>خروج</button>
      </div>
    </nav>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  textDecoration: "none",
  color: "#14213D",
  fontSize: 14,
  fontWeight: 600,
  border: "1px solid #14213D22",
};

const signOutStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #B03A14",
  color: "#B03A14",
  background: "transparent",
  fontSize: 13,
  cursor: "pointer",
};