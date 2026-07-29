"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import OnboardingForm from "./OnboardingForm";
import JobsTab from "./JobsTab";
import ProfileTab from "./ProfileTab";
import SavedJobsTab from "./SavedJobsTab";

type Status = "loading" | "no-profile" | "has-profile";

export default function SeekerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"jobs" | "saved" | "profile">("jobs");

  async function loadProfile() {
    const user = auth.currentUser;
    if (!user) return;
    const profileRef = doc(db, "job_seekers", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      setProfileData(profileSnap.data());
      setStatus("has-profile");
    } else {
      setStatus("no-profile");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      await loadProfile();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (status === "loading") {
    return (
      <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (status === "no-profile") {
    return <OnboardingForm onSaved={loadProfile} />;
  }

  return (
    <div dir="rtl">
      {/* شريط التنقل */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          padding: "16px 20px",
          borderBottom: "1px solid #14213D22",
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setActiveTab("jobs")}
          style={tabButtonStyle(activeTab === "jobs")}
        >
          🏠 تصفح الوظائف
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          style={tabButtonStyle(activeTab === "saved")}
        >
          🔖 الوظائف المحفوظة
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={tabButtonStyle(activeTab === "profile")}
        >
          👤 بروفايلي
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "saved" && <SavedJobsTab />}
        {activeTab === "profile" && (
          <ProfileTab data={profileData} onUpdated={loadProfile} />
        )}
      </div>
    </div>
  );
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    background: active ? "#14213D" : "transparent",
    color: active ? "#fff" : "#14213D",
    border: "1px solid #14213D",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  };
}