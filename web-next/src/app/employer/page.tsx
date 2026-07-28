"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import EmployerOnboardingForm from "./EmployerOnboardingForm";
import CompanyTab from "./CompanyTab";
import PostJobTab from "./PostJobTab";

type Status = "loading" | "no-profile" | "has-profile";
type EditingPost = { id: string; data: any } | null;

export default function EmployerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [companyData, setCompanyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"company" | "postjob">("company");
  const [editingPost, setEditingPost] = useState<EditingPost>(null);

  async function loadCompany() {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "employers", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setCompanyData(snap.data());
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
      await loadCompany();
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function handleEditRequest(id: string, data: any) {
    setEditingPost({ id, data });
    setActiveTab("postjob");
  }

  if (status === "loading") {
    return (
      <div dir="rtl" style={{ textAlign: "center", padding: 60 }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (status === "no-profile") {
    return <EmployerOnboardingForm onSaved={loadCompany} />;
  }

  return (
    <div dir="rtl">
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
          onClick={() => {
            setActiveTab("company");
            setEditingPost(null);
          }}
          style={tabButtonStyle(activeTab === "company")}
        >
          🏠 بيانات الشركة
        </button>
        <button
          onClick={() => {
            setActiveTab("postjob");
            setEditingPost(null);
          }}
          style={tabButtonStyle(activeTab === "postjob")}
        >
          📝 نشر وظيفة جديدة
        </button>
      </div>

      <div style={{ padding: "0 20px 60px" }}>
        {activeTab === "company" && (
          <CompanyTab
            companyData={companyData}
            onCompanyUpdated={loadCompany}
            onEditPost={handleEditRequest}
          />
        )}
        {activeTab === "postjob" && (
          <PostJobTab
            employerPlan={companyData?.plan || "free"}
            companyName={companyData?.companyName || ""}
            editingPost={editingPost}
            onPosted={() => {
              loadCompany();
              setEditingPost(null);
              setActiveTab("company");
            }}
          />
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