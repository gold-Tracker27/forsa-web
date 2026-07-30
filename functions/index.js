const { setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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

function buildApplicationEmailHtml({ jobTitle, applicantName, applicantRole }) {
  const safeJobTitle = escapeHtml(jobTitle);
  const safeName = escapeHtml(applicantName);
  const safeRole = escapeHtml(applicantRole);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>متقدم جديد</title>
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
                في متقدم جديد على إعلان الوظيفة اللي نشرتها:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EAD9;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 18px;direction:rtl;text-align:right;">
                    <div style="font-family:'Cairo',Tahoma,Arial,sans-serif;font-size:16px;font-weight:700;color:#14213D;margin-bottom:8px;">
                      ${safeJobTitle}
                    </div>
                    <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;color:#4A5568;">
                      <strong style="color:#14213D;">${safeName}</strong>${safeRole ? ` — ${safeRole}` : ""}
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
                          <a href="https://elshoghl.com/employer" target="_blank" style="display:inline-block;padding:13px 30px;font-family:'Tajawal',Tahoma,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                            عرض تفاصيل المتقدم
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

function buildApplicationEmailText({ jobTitle, applicantName, applicantRole }) {
  return [
    `في متقدم جديد على إعلان الوظيفة "${jobTitle}":`,
    `${applicantName}${applicantRole ? ` — ${applicantRole}` : ""}`,
    "",
    "اعرض تفاصيل المتقدم من لوحة صاحب العمل: https://elshoghl.com/employer",
    "",
    "الشغل — منصة توظيف مصرية · elshoghl.com",
  ].join("\n");
}

exports.onNewApplication = onDocumentCreated(
  { document: "applications/{applicationId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const application = snap.data();
    const db = getFirestore();

    try {
      const [jobSnap, employerUserSnap] = await Promise.all([
        db.collection("job_posts").doc(application.jobPostId).get(),
        db.collection("users").doc(application.employerId).get(),
      ]);

      if (!jobSnap.exists) {
        logger.error(`onNewApplication: job_posts/${application.jobPostId} مش موجود`);
        return;
      }

      const job = jobSnap.data();
      const employerEmail = employerUserSnap.exists ? employerUserSnap.data().email : null;

      if (!employerEmail) {
        logger.error(
          `onNewApplication: مفيش بريد إلكتروني مسجّل لصاحب العمل ${application.employerId} — تم تجاهل الإشعار`
        );
        return;
      }

      const seeker = application.seekerSnapshot || {};
      const applicantName = seeker.fullName || "متقدم جديد";
      const applicantRole = seeker.jobTitle || seeker.specialization || "";
      const jobTitle = job.title || "وظيفة";

      const emailFields = { jobTitle, applicantName, applicantRole };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "الشغل <noreply@elshoghl.com>",
          to: employerEmail,
          subject: `متقدم جديد على وظيفة ${jobTitle}`,
          html: buildApplicationEmailHtml(emailFields),
          text: buildApplicationEmailText(emailFields),
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        logger.error(`onNewApplication: فشل إرسال الإيميل عبر Resend (HTTP ${res.status})`, errBody);
      }
    } catch (err) {
      logger.error("onNewApplication: حصلت مشكلة غير متوقعة", err);
    }
  }
);
