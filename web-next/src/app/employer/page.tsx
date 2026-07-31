"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import EmployerOnboardingForm from "./EmployerOnboardingForm";
import CompanyTab from "./CompanyTab";
import PostJobTab from "./PostJobTab";
import UpgradeModal from "./UpgradeModal";
import TalentSearchTab from "./TalentSearchTab";

type Status = "loading" | "no-profile" | "has-profile";
type EditingPost = { id: string; data: any } | null;

export default function EmployerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [companyData, setCompanyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"company" | "postjob" | "talent">("company");
  const [editingPost, setEditingPost] = useState<EditingPost>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  async function loadCompany() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(db, "employers", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setStatus("no-profile");
        return;
      }

      let contactData = {};
      try {
        const contactSnap = await getDoc(doc(db, "employers", user.uid, "private", "contact"));
        contactData = contactSnap.exists() ? contactSnap.data() : {};
      } catch (err) {
        console.error("[loadCompany] فشل قراءة employers/{uid}/private/contact", err);
      }

      setCompanyData({ ...snap.data(), ...contactData });
      setStatus("has-profile");
    } catch (err) {
      console.error("[loadCompany] فشل قراءة employers/{uid}", err);
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

  const isPremium = companyData?.plan === "premium";

  return (
    <div dir="rtl">
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 20px 0",
        }}
      >
        <span style={isPremium ? premiumBadgeStyle : freeBadgeStyle}>
          {isPremium ? "⭐ الباقة المدفوعة" : "الباقة المجانية"}
        </span>
        {!isPremium && (
          <button onClick={() => setUpgradeModalOpen(true)} style={upgradeBtnStyle}>
            🚀 طلب الترقية للباقة المدفوعة
          </button>
        )}
      </div>

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
        <button
          onClick={() => {
            setActiveTab("talent");
            setEditingPost(null);
          }}
          style={tabButtonStyle(activeTab === "talent")}
        >
          🔍 البحث عن كوادر
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
        {activeTab === "talent" && (
          <TalentSearchTab employerPlan={companyData?.plan || "free"} />
        )}
      </div>

      {upgradeModalOpen && <UpgradeModal onClose={() => setUpgradeModalOpen(false)} />}
    </div>
  );
}

const freeBadgeStyle: React.CSSProperties = { fontSize: 12, background: "#F0EDE3", padding: "3px 10px", borderRadius: 999, fontWeight: 700 };
const premiumBadgeStyle: React.CSSProperties = { fontSize: 12, background: "rgba(232,163,61,0.2)", padding: "3px 10px", borderRadius: 999, fontWeight: 700, color: "#8A570D" };
const upgradeBtnStyle: React.CSSProperties = { padding: "8px 16px", background: "#E8A33D", color: "#14213D", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13.5 };

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