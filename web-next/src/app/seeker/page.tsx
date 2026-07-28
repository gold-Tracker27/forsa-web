"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import OnboardingForm from "./OnboardingForm";

export default function SeekerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "no-profile" | "has-profile">("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const profileRef = doc(db, "job_seekers", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setStatus("has-profile");
      } else {
        setStatus("no-profile");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (status === "loading") {
    return (
      <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (status === "no-profile") {
    return <OnboardingForm />;
  }

  return (
    <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
      <h2>أهلاً بيك! 🎉</h2>
      <p>ده داشبورد الباحث عن شغل — هنبنيه في الخطوة اللي بعد كده.</p>
    </div>
  );
}