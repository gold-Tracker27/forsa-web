"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Role = "job_seeker" | "employer";

const COLORS = {
  ink: "#14213D",
  inkSoft: "#4A5568",
  paper: "#FAF6EC",
  stamp: "#B03A14",
  success: "#2F6F4E",
};

export default function LandingPage() {
  const router = useRouter();
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorColor, setErrorColor] = useState(COLORS.stamp);
  const [loading, setLoading] = useState(false);

  async function routeAfterAuth(role: Role) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        userType: role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      const data = snap.data();
      if (role !== data.userType) {
        await updateDoc(userRef, { userType: role });
      }
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    }

    if (role === "job_seeker") {
      router.push("/seeker");
    } else {
      router.push("/employer");
    }
  }

  async function handleGoogleSignIn(role: Role) {
    setError("");
    setPendingRole(role);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      await routeAfterAuth(role);
    } catch (err: any) {
      console.warn("popup failed, falling back to redirect", err);
      try {
        await signInWithRedirect(auth, provider);
      } catch (err2: any) {
        setError("حصلت مشكلة، حاول تاني");
        setLoading(false);
      }
    }
  }

  function openEmailAuth(role: Role) {
    setPendingRole(role);
    setError("");
    setEmailPanelOpen(true);
  }

  function closeEmailAuth() {
    setEmailPanelOpen(false);
    setEmail("");
    setPassword("");
    setError("");
  }

  function emailAuthErrorMessage(err: any): string {
    const map: Record<string, string> = {
      "auth/email-already-in-use": 'الإيميل ده متسجل بالفعل — جرب "دخول" بدل "إنشاء حساب"',
      "auth/invalid-email": "صيغة الإيميل مش صحيحة",
      "auth/weak-password": "الباسورد لازم يكون 6 أحرف على الأقل",
      "auth/wrong-password": "الباسورد غلط",
      "auth/user-not-found": "مفيش حساب مسجل بالإيميل ده",
      "auth/invalid-credential": "الإيميل أو الباسورد غلط",
      "auth/missing-password": "اكتب الباسورد",
    };
    return map[err?.code] || "حصلت مشكلة، حاول تاني";
  }

  async function handleEmailSignUp() {
    if (!pendingRole) return;
    setError("");
    setErrorColor(COLORS.stamp);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      closeEmailAuth();
      await routeAfterAuth(pendingRole);
    } catch (err: any) {
      setError(emailAuthErrorMessage(err));
    }
  }

  async function handleEmailLogin() {
    if (!pendingRole) return;
    setError("");
    setErrorColor(COLORS.stamp);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      closeEmailAuth();
      await routeAfterAuth(pendingRole);
    } catch (err: any) {
      setError(emailAuthErrorMessage(err));
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setErrorColor(COLORS.stamp);
      setError('اكتب إيميلك في الحقل فوق الأول، وبعدين دوس "نسيت الباسورد؟"');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setErrorColor(COLORS.success);
      setError("اتبعتلك لينك إعادة تعيين الباسورد على إيميلك");
    } catch (err: any) {
      setErrorColor(COLORS.stamp);
      setError(emailAuthErrorMessage(err));
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span
          style={{
            fontSize: 13,
            color: COLORS.inkSoft,
            display: "block",
            marginBottom: 10,
          }}
        >
          منصة توظيف مصرية · واستشارات موارد بشرية
        </span>
        <h1 style={{ fontSize: 32, color: COLORS.ink, marginBottom: 12 }}>
          فرصتك الجاية... <span style={{ color: COLORS.stamp }}>مسجّلة هنا</span>
        </h1>
        <p style={{ color: COLORS.inkSoft, fontSize: 16 }}>
          باحث عن شغل يسجل بياناته مرة واحدة، وأي صاحب عمل يقدر يدوّر ويفلتر عليها فوراً.
        </p>
        <div
          style={{
            display: "inline-block",
            background: "rgba(47,111,78,0.12)",
            color: COLORS.success,
            fontWeight: 700,
            fontSize: 14,
            padding: "8px 16px",
            borderRadius: 999,
            marginTop: 12,
          }}
        >
          🎉 التسجيل على المنصة مجاني ١٠٠٪ للجميع — والتقديم على الوظائف يفضل مجاني دايمًا للباحثين عن شغل
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "stretch" }}>
        <div
          style={{
            flex: "1 1 320px",
            maxWidth: 400,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: 12,
            padding: 24,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontWeight: 700, color: COLORS.stamp, fontSize: 13, marginBottom: 10 }}>
            باحث عن شغل
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 10 }}>🔍 سجّل بياناتك</h3>
          <p style={{ color: COLORS.inkSoft, fontSize: 14, marginBottom: 16, flex: 1 }}>
            املا بروفايلك مرة، واظهر لكل أصحاب الأعمال اللي بيدوروا على حد زيك. مجاني تمامًا.
          </p>
          <div style={{ marginTop: "auto" }}>
            <button
              onClick={() => handleGoogleSignIn("job_seeker")}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: COLORS.ink,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              الدخول بحساب Google
            </button>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <button
                onClick={() => openEmailAuth("job_seeker")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 13,
                  textDecoration: "underline",
                  color: COLORS.inkSoft,
                  cursor: "pointer",
                }}
              >
                أو سجّل بالإيميل
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 320px",
            maxWidth: 400,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: 12,
            padding: 24,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontWeight: 700, color: COLORS.stamp, fontSize: 13, marginBottom: 10 }}>
            صاحب عمل
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 10 }}>🏢 دوّر على كوادر</h3>
          <p style={{ color: COLORS.inkSoft, fontSize: 14, marginBottom: 16, flex: 1 }}>
            افلتر على التخصص والمدينة والخبرة، ووصل لمرشحين مناسبين لشركتك فورًا.
          </p>
          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(47,111,78,0.12)",
                color: COLORS.success,
                fontWeight: 700,
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 999,
                marginBottom: 14,
              }}
            >
              ✓ باقة مجانية: 5 إعلانات وظائف شهريًا ببلاش
            </div>
            <button
              onClick={() => handleGoogleSignIn("employer")}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: COLORS.ink,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              الدخول بحساب Google
            </button>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <button
                onClick={() => openEmailAuth("employer")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 13,
                  textDecoration: "underline",
                  color: COLORS.inkSoft,
                  cursor: "pointer",
                }}
              >
                أو سجّل بالإيميل
              </button>
            </div>
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: 13, marginTop: 20 }}>
        💡 نفس الإيميل يقدر يستخدم الاتنين — كل ما محتاج تدوّر على شغل ادخل من كارت الباحث عن شغل، وكل ما محتاج تدوّر على كوادر لشركتك ادخل من كارت صاحب العمل.
      </p>

      {emailPanelOpen && (
        <div
          style={{
            maxWidth: 420,
            margin: "30px auto 0",
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: 12,
            padding: 24,
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 19, marginBottom: 6 }}>تسجيل بالإيميل</h2>
          <p style={{ color: COLORS.inkSoft, fontSize: 13.5, marginBottom: 16 }}>
            {pendingRole === "job_seeker" ? "هتسجل كـ باحث عن عمل" : "هتسجل كـ صاحب عمل"}
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 4 }}>الإيميل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: "block", marginBottom: 4 }}>الباسورد</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <button
              onClick={handlePasswordReset}
              style={{
                background: "none",
                border: "none",
                fontSize: 12.5,
                textDecoration: "underline",
                color: COLORS.inkSoft,
                cursor: "pointer",
              }}
            >
              نسيت الباسورد؟
            </button>
          </div>

          {error && (
            <div style={{ color: errorColor, fontSize: 13, marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleEmailSignUp}
              style={{
                padding: "10px 16px",
                background: COLORS.ink,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              إنشاء حساب جديد
            </button>
            <button
              onClick={handleEmailLogin}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: `1px solid ${COLORS.ink}`,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              عندي حساب بالفعل — دخول
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              onClick={closeEmailAuth}
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                textDecoration: "underline",
                color: COLORS.inkSoft,
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
