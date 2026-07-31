// سكريبت قراءة فقط — بيفحص كل applications في المشروع كله (مش وظيفة واحدة بس)
// مبيعدلش أي بيانات خالص.
//
// طريقة التشغيل:
//   cd functions
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
//   node scripts/audit-all-applications-full.js

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: applicationDefault(), projectId: "recruitment-ccbea" });
const db = getFirestore();

async function main() {
  const appsSnap = await db.collection("applications").get();
  console.log(`إجمالي مستندات applications: ${appsSnap.size}\n`);

  const jobCache = new Map(); // jobPostId -> job data | null

  const mismatches = []; // { appId, jobPostId, jobTitle, seekerId, savedEmployerId, correctEmployerId }
  const selfApplications = []; // { appId, jobPostId, jobTitle, seekerId }
  let missingJobs = 0;

  for (const appDoc of appsSnap.docs) {
    const app = appDoc.data();
    const jobPostId = app.jobPostId;

    if (!jobPostId) {
      console.log(`⚠️  ${appDoc.id}: مفيش jobPostId خالص على مستند التقديم ده`);
      continue;
    }

    if (!jobCache.has(jobPostId)) {
      const jobSnap = await db.collection("job_posts").doc(jobPostId).get();
      jobCache.set(jobPostId, jobSnap.exists ? jobSnap.data() : null);
    }
    const job = jobCache.get(jobPostId);

    if (!job) {
      missingJobs++;
      console.log(`⚠️  ${appDoc.id}: الوظيفة job_posts/${jobPostId} مش موجودة خالص (اتمسحت؟)`);
      continue;
    }

    const jobTitle = job.title || "بدون عنوان";

    if (app.employerId !== job.employerId) {
      mismatches.push({
        appId: appDoc.id,
        jobPostId,
        jobTitle,
        seekerId: app.seekerId,
        savedEmployerId: app.employerId,
        correctEmployerId: job.employerId,
      });
    }

    if (app.seekerId === app.employerId) {
      selfApplications.push({
        appId: appDoc.id,
        jobPostId,
        jobTitle,
        seekerId: app.seekerId,
      });
    }
  }

  console.log("—— تعارضات employerId (تحتاج تصحيح) ——");
  if (mismatches.length === 0) {
    console.log("مفيش أي تعارض.");
  } else {
    mismatches.forEach((m, i) => {
      console.log(`[${i + 1}] application: ${m.appId}`);
      console.log(`    jobPostId: ${m.jobPostId} (${m.jobTitle})`);
      console.log(`    seekerId: ${m.seekerId}`);
      console.log(`    employerId المحفوظ (الغلط):   ${m.savedEmployerId}`);
      console.log(`    employerId الصحيح (المفروض): ${m.correctEmployerId}`);
      console.log("");
    });
  }

  console.log("—— ملاحظة: seekerId == employerId (نفس الشخص قدّم على وظيفته) ——");
  console.log("مش بالضرورة خطأ يحتاج تصحيح — وارد جدًا لو نفس الحساب استُخدم كصاحب عمل وباحث وقت الاختبار.\n");
  if (selfApplications.length === 0) {
    console.log("مفيش أي حالة من النوع ده.");
  } else {
    selfApplications.forEach((s, i) => {
      console.log(`[${i + 1}] application: ${s.appId}`);
      console.log(`    jobPostId: ${s.jobPostId} (${s.jobTitle})`);
      console.log(`    seekerId == employerId: ${s.seekerId}`);
      console.log("");
    });
  }

  console.log("—— الملخص الإجمالي ——");
  console.log(`إجمالي applications: ${appsSnap.size}`);
  console.log(`applications بترجع لوظائف محذوفة: ${missingJobs}`);
  console.log(`تعارضات employerId حقيقية تحتاج تصحيح: ${mismatches.length}`);
  console.log(`applications فيها seekerId == employerId فقط (ملاحظة، مش بالضرورة خطأ): ${selfApplications.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("حصلت مشكلة في السكريبت:", err);
    process.exit(1);
  });
