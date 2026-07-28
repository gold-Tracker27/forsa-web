"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      console.warn("popup failed, falling back to redirect", err);
      try {
        await signInWithRedirect(auth, provider);
      } catch (err2: any) {
        setError(getErrorMessage(err2));
        setLoading(false);
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/");
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ fontSize: 19 }}>تسجيل دخول بالإيميل</h2>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{ width: "100%", padding: "10px 16px", marginBottom: 16 }}
      >
        الدخول بحساب جوجل
      </button>

      <div style={{ textAlign: "center", margin: "10px 0", color: "#888" }}>
        أو
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 14 }}>
          <label>الإيميل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label>الباسورد</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        {error && (
          <div style={{ color: "red", fontSize: 13, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "8px 16px", marginTop: 10 }}
        >
          {loading ? "جاري الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}

function getErrorMessage(err: any): string {
  const code = err?.code || "";
  if (code.includes("user-not-found") || code.includes("invalid-credential")) {
    return "البيانات غير صحيحة، تأكد من الإيميل وكلمة السر";
  }
  if (code.includes("wrong-password")) {
    return "كلمة السر غير صحيحة";
  }
  if (code.includes("too-many-requests")) {
    return "محاولات كتيرة، حاول بعد شوية";
  }
  return "حصل خطأ، حاول تاني";
}