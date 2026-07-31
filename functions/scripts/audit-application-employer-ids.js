// سكريبت قراءة فقط — بيقارن applications.employerId بـ job_posts.employerId بتاعت نفس الوظيفة
// مبيعدلش أي بيانات خالص، بس بيطبع تقرير بأي تعارض عشان تراجعه قبل أي تصحيح.
//
// طريقة التشغيل:
//   cd functions
//   node scripts/audit-application-employer-ids.js
//
// محتاج Application Default Credentials مربوطة بمشروعك (لو عندك gcloud/firebase CLI
// مسجّل دخول بيه بالفعل غالبًا هيشتغل على طول، أو صدّر متغير البيئة ده لمفتاح service account:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: applicationDefault(), projectId: "recruitment-ccbea" });
const db = getFirestore();

async function main() {
  const appsSnap = await db.collection("applications").get();
  console.log(`إجمالي مستندات applications: ${appsSnap.size}`);

  const jobCache = new Map(); // jobPostId -> job data | null

  let mismatches = 0;
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

    if (job.employerId !== app.employerId) {
      mismatches++;
      console.log(
        `❌ تعارض في ${appDoc.id}:\n` +
          `   jobPostId: ${jobPostId} (${job.title || "بدون عنوان"})\n` +
          `   job_posts.employerId (الصحيح):   ${job.employerId}\n` +
          `   applications.employerId (الحالي): ${app.employerId}\n`
      );
    }
  }

  console.log("\n—— الملخص ——");
  console.log(`تقديمات فيها تعارض employerId: ${mismatches}`);
  console.log(`تقديمات بترجع لوظائف محذوفة: ${missingJobs}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("حصلت مشكلة في السكريبت:", err);
    process.exit(1);
  });
