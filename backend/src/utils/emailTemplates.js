/**
 * Predefined HTML email templates for the placement portal.
 * Use {{KEY}} placeholders for dynamic content replacement.
 */

const baseWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .info-table td:first-child { font-weight: 600; color: #475569; width: 40%; }
    .highlight { background: #eff6ff; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Placement Cell — Training & Placement Office</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Drive notification email — sent when a new drive is announced
 */
export const DRIVE_NOTIFICATION = (params) =>
  baseWrapper(`
    <div class="header">
      <h1>🏢 New Recruitment Drive Announced</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${params.studentName}</strong>,</p>
      <p>A new recruitment drive has been announced. Here are the details:</p>
      <table class="info-table">
        <tr><td>Company</td><td><strong>${params.companyName}</strong></td></tr>
        <tr><td>Role</td><td>${params.role}</td></tr>
        <tr><td>CTC</td><td>${params.ctc}</td></tr>
        <tr><td>Location</td><td>${params.location || "Not specified"}</td></tr>
        <tr><td>Deadline</td><td>${params.deadline || "No deadline"}</td></tr>
      </table>
      ${params.description ? `<div class="highlight"><strong>Description:</strong> ${params.description}</div>` : ""}
      <p>Please log in to the placement portal to check your eligibility and apply.</p>
      <a href="${params.portalUrl}" class="btn">View Drive Details</a>
    </div>
  `);

/**
 * Round schedule email — sent for interview round updates
 */
export const ROUND_SCHEDULE = (params) =>
  baseWrapper(`
    <div class="header">
      <h1>📅 Round Schedule Update</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${params.studentName}</strong>,</p>
      <p>Here is the schedule for <strong>${params.companyName} — ${params.role}</strong>:</p>
      <table class="info-table">
        ${params.rounds
          .map(
            (r) =>
              `<tr><td>${r.name}</td><td>${r.date} at ${r.time}${r.venue ? `, Venue: ${r.venue}` : ""}</td></tr>`
          )
          .join("")}
      </table>
      <div class="highlight">
        <strong>⚠️ Important:</strong> Your attendance is mandatory. Failure to attend will result in 
        dismissal from the placement process.
      </div>
    </div>
  `);

/**
 * Selection result email
 */
export const SELECTION_RESULT = (params) =>
  baseWrapper(`
    <div class="header">
      <h1>${params.status === "SELECTED" ? "🎉 Congratulations!" : "📋 Application Update"}</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${params.studentName}</strong>,</p>
      ${
        params.status === "SELECTED"
          ? `<p>We are thrilled to inform you that you have been <strong style="color: #16a34a;">SELECTED</strong> 
             for the position of <strong>${params.role}</strong> at <strong>${params.companyName}</strong>!</p>
             <div class="highlight">
               <strong>Package:</strong> ${params.ctc}<br/>
               Further onboarding details will be shared soon.
             </div>`
          : params.status === "SHORTLISTED"
            ? `<p>You have been <strong style="color: #2563eb;">SHORTLISTED</strong> for the position of 
               <strong>${params.role}</strong> at <strong>${params.companyName}</strong>.</p>
               <p>Please stay updated for the next round schedule.</p>`
            : `<p>We regret to inform you that your application for <strong>${params.role}</strong> at 
               <strong>${params.companyName}</strong> has been <strong style="color: #dc2626;">not selected</strong> 
               at this stage.</p>
               <p>Don't be discouraged — there are more opportunities ahead!</p>`
      }
    </div>
  `);

/**
 * Custom announcement email
 */
export const CUSTOM_ANNOUNCEMENT = (params) =>
  baseWrapper(`
    <div class="header">
      <h1>📢 ${params.title}</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${params.studentName}</strong>,</p>
      <div>${params.body}</div>
      ${params.driveInfo ? `<div class="highlight"><strong>Related Drive:</strong> ${params.driveInfo}</div>` : ""}
    </div>
  `);

export const TEMPLATES = {
  DRIVE_NOTIFICATION,
  ROUND_SCHEDULE,
  SELECTION_RESULT,
  CUSTOM_ANNOUNCEMENT,
};
