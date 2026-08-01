const { setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options.
setGlobalOptions({ maxInstances: 10 });

initializeApp();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function buildInvitationEmailHtml({ companyName, jobTitle, jobLink }) {
  const safeCompany = escapeHtml(companyName);
  const safeJobTitle = escapeHtml(jobTitle);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>دعوة للتقديم</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#FAF6EC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;border:1px solid #DED2B5;">
          <tr>
            <td style="background-color:#14213D;padding:26px 28px;text-align:center;border-radius:14px 14px 0 0;">
              <div style="font-family:'Cairo',Tahoma,Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:900;">الشغل</div>
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;color:#E8A33D;font-size:13px;margin-top:4px;">منصة توظيف مصرية</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;direction:rtl;text-align:right;">
              <p style="margin:0 0 18px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:15px;color:#14213D;line-height:1.8;">
                عندك دعوة جديدة للتقديم على وظيفة:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EAD9;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 18px;direction:rtl;text-align:right;">
                    <div style="font-family:'Cairo',Tahoma,Arial,sans-serif;font-size:16px;font-weight:700;color:#14213D;margin-bottom:8px;">
                      ${safeJobTitle}
                    </div>
                    <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;color:#4A5568;">
                      من شركة <strong style="color:#14213D;">${safeCompany}</strong>
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#14213D;">
                          <a href="${jobLink}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                            عرض الوظيفة والتقديم عليها
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#F1EAD9;text-align:center;border-radius:0 0 14px 14px;">
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:12px;color:#4A5568;">
                الشغل — منصة توظيف مصرية ·
                <a href="https://elshoghl.com" style="color:#14213D;text-decoration:underline;">elshoghl.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInvitationEmailText({ companyName, jobTitle, jobLink }) {
  return [
    `عندك دعوة جديدة للتقديم على وظيفة "${jobTitle}" من شركة ${companyName}.`,
    "",
    `اعرض الوظيفة وقدّم عليها من هنا: ${jobLink}`,
    "",
    "الشغل — منصة توظيف مصرية · elshoghl.com",
  ].join("\n");
}

function buildDailySummaryEmailHtml({ totalCount, jobs }) {
  const jobRows = jobs
    .map(
      (j) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #DED2B5;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;color:#14213D;text-align:right;">
                    ${escapeHtml(j.title)}
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #DED2B5;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;color:#4A5568;text-align:left;white-space:nowrap;">
                    ${j.count} متقدم
                  </td>
                </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ملخص المتقدمين اليومي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#FAF6EC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;border:1px solid #DED2B5;">
          <tr>
            <td style="background-color:#14213D;padding:26px 28px;text-align:center;border-radius:14px 14px 0 0;">
              <div style="font-family:'Cairo',Tahoma,Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:900;">الشغل</div>
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;color:#E8A33D;font-size:13px;margin-top:4px;">منصة توظيف مصرية</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;direction:rtl;text-align:right;">
              <p style="margin:0 0 18px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:15px;color:#14213D;line-height:1.8;">
                عندك <strong>${totalCount}</strong> متقدم جديد على إعلاناتك خلال آخر 24 ساعة:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EAD9;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${jobRows}
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#14213D;">
                          <a href="https://elshoghl.com/employer" target="_blank" style="display:inline-block;padding:13px 30px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                            عرض التفاصيل من لوحة صاحب العمل
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#F1EAD9;text-align:center;border-radius:0 0 14px 14px;">
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:12px;color:#4A5568;">
                الشغل — منصة توظيف مصرية ·
                <a href="https://elshoghl.com" style="color:#14213D;text-decoration:underline;">elshoghl.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDailySummaryEmailText({ totalCount, jobs }) {
  return [
    `عندك ${totalCount} متقدم جديد على إعلاناتك خلال آخر 24 ساعة:`,
    "",
    ...jobs.map((j) => `- ${j.title}: ${j.count} متقدم`),
    "",
    "اعرض التفاصيل من لوحة صاحب العمل: https://elshoghl.com/employer",
    "",
    "الشغل — منصة توظيف مصرية · elshoghl.com",
  ].join("\n");
}

// لازم يفضل متطابق مع APPLICATION_STATUS_LABELS في web-next/src/lib/jobCardStyles.ts
const APPLICATION_STATUS_LABELS = {
  submitted: "تقديم",
  shortlisted: "قيد المراجعة",
  interview: "مقابلة",
  accepted: "قبول",
  rejected: "رفض",
};

const APPLICATION_STATUS_MESSAGES = {
  submitted: (jobTitle, companyName) => `تقديمك على وظيفة "${jobTitle}" من ${companyName} رجع لحالة "تقديم".`,
  shortlisted: (jobTitle, companyName) => `تقديمك على وظيفة "${jobTitle}" من ${companyName} بقى قيد المراجعة.`,
  interview: (jobTitle, companyName) => `مبروك! ${companyName} عايزة تعمل معاك مقابلة على وظيفة "${jobTitle}".`,
  accepted: (jobTitle, companyName) => `مبروك! اتقبلت على وظيفة "${jobTitle}" من ${companyName}.`,
  rejected: (jobTitle, companyName) => `للأسف، ${companyName} قررت المتابعة مع مرشح تاني لوظيفة "${jobTitle}". فيه فرص تانية كتير مستنياك على المنصة.`,
};

function buildStatusUpdateEmailHtml({ jobTitle, companyName, status, jobLink }) {
  const safeMessage = escapeHtml(
    (APPLICATION_STATUS_MESSAGES[status] || APPLICATION_STATUS_MESSAGES.submitted)(jobTitle, companyName)
  );
  const statusLabel = escapeHtml(APPLICATION_STATUS_LABELS[status] || status);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تحديث حالة تقديمك</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#FAF6EC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;border:1px solid #DED2B5;">
          <tr>
            <td style="background-color:#14213D;padding:26px 28px;text-align:center;border-radius:14px 14px 0 0;">
              <div style="font-family:'Cairo',Tahoma,Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:900;">الشغل</div>
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;color:#E8A33D;font-size:13px;margin-top:4px;">منصة توظيف مصرية</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;direction:rtl;text-align:right;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#F1EAD9;border-radius:999px;padding:5px 14px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:13px;font-weight:700;color:#14213D;">
                    الحالة الجديدة: ${statusLabel}
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:15px;color:#14213D;line-height:1.8;">
                ${safeMessage}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#14213D;">
                          <a href="${jobLink}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                            عرض الوظيفة
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#F1EAD9;text-align:center;border-radius:0 0 14px 14px;">
              <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:12px;color:#4A5568;">
                الشغل — منصة توظيف مصرية ·
                <a href="https://elshoghl.com" style="color:#14213D;text-decoration:underline;">elshoghl.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildStatusUpdateEmailText({ jobTitle, companyName, status, jobLink }) {
  const message = (APPLICATION_STATUS_MESSAGES[status] || APPLICATION_STATUS_MESSAGES.submitted)(jobTitle, companyName);
  return [
    message,
    "",
    `اعرض الوظيفة من هنا: ${jobLink}`,
    "",
    "الشغل — منصة توظيف مصرية · elshoghl.com",
  ].join("\n");
}

async function sendViaResend({ to, subject, html, text, logPrefix }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "الشغل <noreply@elshoghl.com>", to, subject, html, text }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    logger.error(`${logPrefix}: فشل إرسال الإيميل عبر Resend (HTTP ${res.status})`, errBody);
  }
}

async function createNotification({ userId, type, message, link }) {
  try {
    await getFirestore().collection("notifications").add({
      userId,
      type,
      message,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error(`createNotification (${type}): فشل إنشاء إشعار لليوزر ${userId}`, err);
  }
}

exports.onNewInvitation = onDocumentCreated(
  { document: "invitations/{invitationId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const invitation = snap.data();
    const db = getFirestore();

    const companyName = invitation.employerCompanyName || "صاحب عمل";
    const jobTitle = invitation.jobTitle || "وظيفة";

    await createNotification({
      userId: invitation.seekerId,
      type: "new_invitation",
      message: `${companyName} دعتك للتقديم على وظيفة "${jobTitle}"`,
      link: `/jobs/${invitation.jobPostId}`,
    });

    try {
      const seekerUserSnap = await db.collection("users").doc(invitation.seekerId).get();
      const seekerEmail = seekerUserSnap.exists ? seekerUserSnap.data().email : null;

      if (!seekerEmail) {
        logger.error(
          `onNewInvitation: مفيش بريد إلكتروني مسجّل للباحث ${invitation.seekerId} — تم تجاهل الإيميل (الإشعار الداخلي اتعمل)`
        );
        return;
      }

      const jobLink = `https://elshoghl.com/jobs/${invitation.jobPostId}`;
      const emailFields = { companyName, jobTitle, jobLink };

      await sendViaResend({
        to: seekerEmail,
        subject: `${companyName} دعتك للتقديم على وظيفة ${jobTitle}`,
        html: buildInvitationEmailHtml(emailFields),
        text: buildInvitationEmailText(emailFields),
        logPrefix: "onNewInvitation",
      });
    } catch (err) {
      logger.error("onNewInvitation: حصلت مشكلة غير متوقعة", err);
    }
  }
);

exports.onApplicationStatusChanged = onDocumentUpdated(
  { document: "applications/{applicationId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!before || !after) return;

    const beforeStatus = before.status || "submitted";
    const afterStatus = after.status || "submitted";
    if (beforeStatus === afterStatus) return; // مفيش تغيير حقيقي في الحالة

    const db = getFirestore();
    const statusLabel = APPLICATION_STATUS_LABELS[afterStatus] || afterStatus;

    const jobSnap = await db.collection("job_posts").doc(after.jobPostId).get();
    const jobData = jobSnap.exists ? jobSnap.data() : null;
    const jobTitle = jobData?.title || "وظيفة";
    // نفس منطق الإخفاء المستخدم في الواجهة بالظبط (JobCard.tsx وغيره):
    // لو صاحب العمل ما فعّلش "أظهر اسم الشركة"، الإشعار/الإيميل يعرضوا نفس النص البديل زي أي مكان تاني في الموقع
    const companyName = jobData?.showCompanyName && jobData?.companyName ? jobData.companyName : "شركة غير معلنة";

    await createNotification({
      userId: after.seekerId,
      type: "status_changed",
      message: `تقديمك على وظيفة "${jobTitle}" بقى ${statusLabel}`,
      link: `/jobs/${after.jobPostId}`,
    });

    try {
      const seekerUserSnap = await db.collection("users").doc(after.seekerId).get();
      const seekerEmail = seekerUserSnap.exists ? seekerUserSnap.data().email : null;

      if (!seekerEmail) {
        logger.error(
          `onApplicationStatusChanged: مفيش بريد إلكتروني مسجّل للباحث ${after.seekerId} — تم تجاهل الإيميل (الإشعار الداخلي اتعمل)`
        );
        return;
      }

      const jobLink = `https://elshoghl.com/jobs/${after.jobPostId}`;
      const emailFields = { jobTitle, companyName, status: afterStatus, jobLink };

      await sendViaResend({
        to: seekerEmail,
        subject: `تحديث على تقديمك لوظيفة ${jobTitle}: ${statusLabel}`,
        html: buildStatusUpdateEmailHtml(emailFields),
        text: buildStatusUpdateEmailText(emailFields),
        logPrefix: "onApplicationStatusChanged",
      });
    } catch (err) {
      logger.error("onApplicationStatusChanged: حصلت مشكلة غير متوقعة", err);
    }
  }
);

// إشعار داخل الموقع بس لصاحب العمل عند أي تقديم جديد — من غير إيميل فوري
// (الإيميل الفوري لكل تقديم مش مطلوب، الملخص اليومي dailyApplicationsSummary already بيغطي الإيميل)
exports.onApplicationCreated = onDocumentCreated(
  { document: "applications/{applicationId}" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const application = snap.data();
    if (!application.employerId || !application.jobPostId) return;

    const db = getFirestore();
    const jobSnap = await db.collection("job_posts").doc(application.jobPostId).get();
    const jobTitle = jobSnap.exists ? jobSnap.data().title || "وظيفة" : "وظيفة";
    const applicantName = application.seekerSnapshot?.fullName;

    await createNotification({
      userId: application.employerId,
      type: "new_applicant",
      message: applicantName
        ? `متقدم جديد على وظيفة "${jobTitle}": ${applicantName}`
        : `متقدم جديد على وظيفة "${jobTitle}"`,
      link: `/employer?tab=company`,
    });
  }
);

exports.dailyApplicationsSummary = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Africa/Cairo", secrets: [RESEND_API_KEY] },
  async () => {
    const db = getFirestore();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let appsSnap;
    try {
      appsSnap = await db.collection("applications").where("appliedAt", ">=", since).get();
    } catch (err) {
      logger.error("dailyApplicationsSummary: فشل جلب التقديمات", err);
      return;
    }

    if (appsSnap.empty) {
      logger.info("dailyApplicationsSummary: مفيش تقديمات جديدة في آخر 24 ساعة — مفيش إيميلات هتتبعت");
      return;
    }

    // تجميع التقديمات: لكل صاحب عمل، عدد المتقدمين لكل وظيفة من وظائفه
    const byEmployer = new Map(); // employerId -> Map(jobPostId -> count)
    for (const docSnap of appsSnap.docs) {
      const data = docSnap.data();
      const { employerId, jobPostId } = data;
      if (!employerId || !jobPostId) continue;

      if (!byEmployer.has(employerId)) byEmployer.set(employerId, new Map());
      const jobCounts = byEmployer.get(employerId);
      jobCounts.set(jobPostId, (jobCounts.get(jobPostId) || 0) + 1);
    }

    // قراءة عنوان كل وظيفة مرة واحدة بس، بغض النظر عن عدد المتقدمين عليها
    const allJobIds = new Set();
    for (const jobCounts of byEmployer.values()) {
      for (const jobId of jobCounts.keys()) allJobIds.add(jobId);
    }
    const jobTitleEntries = await Promise.all(
      Array.from(allJobIds).map(async (jobId) => {
        try {
          const jobSnap = await db.collection("job_posts").doc(jobId).get();
          return [jobId, jobSnap.exists ? jobSnap.data().title || "وظيفة" : "وظيفة محذوفة"];
        } catch (err) {
          logger.error(`dailyApplicationsSummary: فشل جلب job_posts/${jobId}`, err);
          return [jobId, "وظيفة"];
        }
      })
    );
    const jobTitles = new Map(jobTitleEntries);

    // إيميل واحد لكل صاحب عمل، حتى لو عنده تقديمات على أكتر من وظيفة
    for (const [employerId, jobCounts] of byEmployer.entries()) {
      try {
        const userSnap = await db.collection("users").doc(employerId).get();
        const employerEmail = userSnap.exists ? userSnap.data().email : null;

        if (!employerEmail) {
          logger.error(
            `dailyApplicationsSummary: مفيش بريد إلكتروني مسجّل لصاحب العمل ${employerId} — تم تجاهله`
          );
          continue;
        }

        const jobs = Array.from(jobCounts.entries()).map(([jobId, count]) => ({
          title: jobTitles.get(jobId) || "وظيفة",
          count,
        }));
        const totalCount = jobs.reduce((sum, j) => sum + j.count, 0);

        await sendViaResend({
          to: employerEmail,
          subject: `${totalCount} متقدم جديد على إعلاناتك اليوم`,
          html: buildDailySummaryEmailHtml({ totalCount, jobs }),
          text: buildDailySummaryEmailText({ totalCount, jobs }),
          logPrefix: "dailyApplicationsSummary",
        });
      } catch (err) {
        // خطأ مع صاحب عمل واحد ميوقفش معالجة باقي أصحاب الأعمال
        logger.error(`dailyApplicationsSummary: حصلت مشكلة مع صاحب العمل ${employerId}`, err);
      }
    }
  }
);
