// سكريبت قراءة فقط — بيفحص كل applications المرتبطة بـ jobPostId واحد بالتحديد
// مبيعدلش أي بيانات خالص.
//
// طريقة التشغيل:
//   cd functions
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
//   node scripts/audit-single-job-applications.js

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const JOB_POST_ID = "6VLJpS8EliV5b7hnKhaG";

initializeApp({ credential: applicationDefault(), projectId: "recruitment-ccbea" });
const db = getFirestore();

async function main() {
  const jobSnap = await db.collection("job_posts").doc(JOB_POST_ID).get();
  const job = jobSnap.exists ? jobSnap.data() : null;

  console.log("—— بيانات الوظيفة ——");
  if (!job) {
    console.log(`⚠️  job_posts/${JOB_POST_ID} مش موجودة خالص`);
  } else {
    console.log(`العنوان: ${job.title || "بدون عنوان"}`);
    console.log(`employerId الصحيح (صاحب الوظيفة الفعلي): ${job.employerId}`);
  }

  // ملاحظة: السكريبت ده بيشتغل بصلاحيات admin (service account)، يعني بيتخطى
  // Firestore Security Rules تمامًا ويشوف كل المستندات المطابقة فعليًا —
  // ده عمدًا عشان نقارنه بعدين بإيه اللي المفروض العميل (المتصفح) يقدر يشوفه
  // تحت نفس القواعد.
  const appsSnap = await db.collection("applications").where("jobPostId", "==", JOB_POST_ID).get();

  console.log(`\n—— كل مستندات applications لـ jobPostId=${JOB_POST_ID} ——`);
  console.log(`العدد الحقيقي (بدون أي فلتر تاني، بصلاحيات admin): ${appsSnap.size}\n`);

  let selfApplicationCount = 0;
  let matchesJobEmployerCount = 0;

  appsSnap.docs.forEach((docSnap, i) => {
    const app = docSnap.data();
    const isSelf = app.seekerId === app.employerId;
    const matchesJobEmployer = job && app.employerId === job.employerId;

    if (isSelf) selfApplicationCount++;
    if (matchesJobEmployer) matchesJobEmployerCount++;

    console.log(`[${i + 1}] مستند: ${docSnap.id}`);
    console.log(`    seekerId:   ${app.seekerId}`);
    console.log(`    employerId: ${app.employerId}`);
    console.log(`    appliedAt:  ${app.appliedAt ? app.appliedAt.toDate().toISOString() : "—"}`);
    if (isSelf) console.log(`    ⚠️  seekerId == employerId (نفس الشخص!)`);
    if (job && !matchesJobEmployer) console.log(`    ⚠️  employerId مش مطابق لصاحب الوظيفة الفعلي (${job.employerId})`);
    console.log("");
  });

  console.log("—— الملخص ——");
  console.log(`إجمالي المستندات لهذه الوظيفة: ${appsSnap.size}`);
  console.log(`مستندات فيها seekerId == employerId: ${selfApplicationCount}`);
  console.log(
    `مستندات employerId بتاعها بيطابق صاحب الوظيفة الفعلي: ${matchesJobEmployerCount} من ${appsSnap.size}`
  );

  if (job && matchesJobEmployerCount < appsSnap.size) {
    console.log(
      `\n⚠️  ده بالظبط سبب اختلاف العدد في الواجهة:\n` +
        `   - زرار "عرض المتقدمين" بيعرض applicantCounts، وده بيتحسب من استعلام\n` +
        `     مفلتر بـ where(employerId == uid صاحب العمل الحالي) ومجمّع حسب jobPostId —\n` +
        `     يعني بيستبعد أي مستند application عليه employerId مختلف عن صاحب الوظيفة.\n` +
        `   - أما toggleApplicants (زرار فتح القائمة) بيستخدم fetchApplicants اللي\n` +
        `     بيفلتر بـ where(jobPostId == X) بس من غير فلتر employerId خالص —\n` +
        `     يعني بيحاول يجيب كل المستندات المطابقة للوظيفة دي بغض النظر عن employerId.\n` +
        `   - النتيجة: لو فيه مستند واحد بس بـ employerId مختلف، Firestore Security Rules\n` +
        `     بترفض الاستعلام كله (مش بس المستند الغلط)، وده اللي بيظهر كـ\n` +
        `     "Missing or insufficient permissions" في الواجهة.`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("حصلت مشكلة في السكريبت:", err);
    process.exit(1);
  });
