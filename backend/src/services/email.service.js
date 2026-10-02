import prisma from "../config/prisma.js";
import { sendBulkEmail } from "../config/brevo.js";
import { TEMPLATES } from "../utils/emailTemplates.js";
import { config } from "../config/env.js";
import { getEligibleStudents } from "./eligibility.service.js";

/**
 * Send drive notification emails to eligible students
 */
export const sendDriveNotification = async (driveId, customMessage = "", target = "APPLICANTS") => {
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: {
      company: { select: { name: true } },
    },
  });

  if (!drive) {
    const error = new Error("Drive not found");
    error.statusCode = 404;
    throw error;
  }

  // Get both candidate pools
  const [eligibleStudents, applications] = await Promise.all([
    getEligibleStudents(drive),
    prisma.application.findMany({
      where: { driveId },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
      },
    }),
  ]);

  const applicantCount = applications.length;
  const eligibleCount = eligibleStudents.length;

  // Determine recipients according to target
  let recipients = [];
  let subject = "";
  let templateName = "DRIVE_NOTIFICATION";

  // Build CTC string
  const ctcStr =
    drive.ctcMax !== null && drive.ctcMax !== undefined
      ? `${drive.ctc} - ${drive.ctcMax} LPA`
      : `${drive.ctc} LPA`;

  // Build deadline string
  const deadlineStr = drive.applicationDeadline
    ? new Date(drive.applicationDeadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No deadline";

  if (target === "ELIGIBLE") {
    if (eligibleStudents.length === 0) {
      return {
        sent: 0,
        failed: 0,
        total: 0,
        applicantCount,
        eligibleCount: 0,
        message: "No eligible students found for this drive",
      };
    }
    recipients = eligibleStudents.map((student) => ({
      email: student.user.email,
      params: { studentName: student.fullName },
    }));
    subject = `New Recruitment Drive: ${drive.role} at ${drive.company.name}`;
  } else {
    // Default to APPLICANTS
    if (applications.length === 0) {
      return {
        sent: 0,
        failed: 0,
        total: 0,
        applicantCount: 0,
        eligibleCount,
        message: `No applicants have applied to this drive yet. (Total eligible candidates: ${eligibleCount})`,
      };
    }
    recipients = applications.map((app) => ({
      email: app.student.user.email,
      params: { studentName: app.student.fullName },
    }));
    subject = `Recruitment Drive Notice: ${drive.role} at ${drive.company.name}`;
  }

  const htmlContent = TEMPLATES.DRIVE_NOTIFICATION({
    studentName: "{{studentName}}",
    companyName: drive.company.name,
    role: drive.role,
    ctc: ctcStr,
    location: drive.location,
    deadline: deadlineStr,
    description: customMessage || drive.description,
    portalUrl: config.clientUrl,
  });

  const results = await sendBulkEmail(recipients, subject, htmlContent);

  // Log all sent emails
  const emailLogs = results.map((r) => ({
    toEmail: r.email,
    subject,
    templateName,
    driveId,
    status: r.status === "SENT" ? "SENT" : "FAILED",
    error: r.error || null,
  }));

  await prisma.emailLog.createMany({ data: emailLogs });

  const sent = results.filter((r) => r.status === "SENT").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  return {
    sent,
    failed,
    total: results.length,
    applicantCount,
    eligibleCount,
    target,
    message:
      sent > 0
        ? `Sent ${sent} emails successfully to ${target === "ELIGIBLE" ? "eligible candidates" : "applicants"} (Applicants: ${applicantCount}, Eligible: ${eligibleCount})`
        : `Drive notifications recorded for ${results.length} ${target === "ELIGIBLE" ? "eligible candidates" : "applicants"}. (${results[0]?.error || "Recorded in logs"})`,
  };
};

/**
 * Send custom announcement email to filtered students
 */
export const sendCustomAnnouncement = async ({
  title,
  body,
  driveId,
  sentById,
  filters = {},
}) => {
  // Build student query based on filters
  const where = {};

  if (filters.includeDismissed === "false" || filters.includeDismissed === false) {
    where.isDismissed = false;
  }
  if (filters.isDismissed !== undefined && filters.isDismissed !== "" && filters.isDismissed !== "ALL") {
    where.isDismissed = filters.isDismissed === "true" || filters.isDismissed === true;
  }
  if (filters.profileLocked !== undefined && filters.profileLocked !== "" && filters.profileLocked !== "ALL") {
    where.profileLocked = filters.profileLocked === "true" || filters.profileLocked === true;
  }
  if (filters.branch && filters.branch !== "ALL" && filters.branch !== "") {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }
  if (filters.studentType && filters.studentType !== "ALL" && filters.studentType !== "") {
    where.studentType = filters.studentType;
  }
  if (filters.verificationStatus && filters.verificationStatus !== "ALL" && filters.verificationStatus !== "") {
    where.verificationStatus = filters.verificationStatus;
  }
  if (filters.isPlaced !== undefined && filters.isPlaced !== "" && filters.isPlaced !== "ALL") {
    where.isPlaced = filters.isPlaced === "true" || filters.isPlaced === true;
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
    },
  });

  if (students.length === 0) {
    return { sent: 0, message: "No students match the filter criteria" };
  }

  // Resolve valid sentById
  let actualSentById = sentById;
  if (!actualSentById) {
    const adminUser = await prisma.user.findFirst({
      where: { role: "CENTRAL_TPO" },
      select: { id: true },
    });
    actualSentById = adminUser?.id;
  }

  // Save announcement
  let announcement = null;
  if (actualSentById) {
    announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        driveId: driveId || null,
        sentById: actualSentById,
      },
    });
  }

  // Get drive info if linked
  let driveInfo = null;
  if (driveId) {
    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id: driveId },
      include: { company: { select: { name: true } } },
    });
    if (drive) {
      driveInfo = `${drive.role} at ${drive.company.name}`;
    }
  }

  // Generate personalized emails
  const recipients = students.map((student) => ({
    email: student.user.email,
    params: {
      studentName: student.fullName,
    },
  }));

  const htmlContent = TEMPLATES.CUSTOM_ANNOUNCEMENT({
    studentName: "{{studentName}}",
    title,
    body,
    driveInfo,
  });

  const subject = `📢 ${title}`;

  const results = await sendBulkEmail(recipients, subject, htmlContent);

  // Log all sent emails
  const emailLogs = results.map((r) => ({
    toEmail: r.email,
    subject,
    templateName: "CUSTOM_ANNOUNCEMENT",
    driveId: driveId || null,
    status: r.status === "SENT" ? "SENT" : "FAILED",
    error: r.error || null,
  }));

  await prisma.emailLog.createMany({ data: emailLogs });

  const sent = results.filter((r) => r.status === "SENT").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  return {
    announcementId: announcement.id,
    sent,
    failed,
    total: results.length,
    message:
      sent > 0
        ? `Sent ${sent} emails successfully${failed > 0 ? `, ${failed} failed` : ""}`
        : `Queued announcement to ${results.length} students. (${results[0]?.error || "Delivery recorded in logs"})`,
  };
};

/**
 * Send selection/shortlisting result emails
 */
export const sendStatusEmail = async (applicationId) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        include: { user: { select: { email: true } } },
      },
      drive: {
        include: { company: { select: { name: true } } },
      },
    },
  });

  if (!application) {
    return { sent: false, reason: "Application not found" };
  }

  const ctcStr =
    application.drive.ctcMax !== null && application.drive.ctcMax !== undefined
      ? `${application.drive.ctc} - ${application.drive.ctcMax} LPA`
      : `${application.drive.ctc} LPA`;

  const htmlContent = TEMPLATES.SELECTION_RESULT({
    studentName: application.student.fullName,
    companyName: application.drive.company.name,
    role: application.drive.role,
    ctc: ctcStr,
    status: application.status,
  });

  const subject = `Application Update: ${application.drive.role} at ${application.drive.company.name}`;

  const results = await sendBulkEmail(
    [{ email: application.student.user.email }],
    subject,
    htmlContent
  );

  // Log the email
  await prisma.emailLog.create({
    data: {
      toEmail: application.student.user.email,
      subject,
      templateName: "SELECTION_RESULT",
      driveId: application.driveId,
      status: results[0]?.status === "SENT" ? "SENT" : "FAILED",
      error: results[0]?.error || null,
    },
  });

  return results[0];
};

/**
 * Get email log history (TPO only)
 */
export const getEmailLogs = async (query = {}) => {
  const where = {};

  if (query.templateName) where.templateName = query.templateName;
  if (query.driveId) where.driveId = query.driveId;
  if (query.status) where.status = query.status;

  const [rawLogs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: parseInt(query.skip) || 0,
      take: parseInt(query.take) || 50,
    }),
    prisma.emailLog.count({ where }),
  ]);

  const logs = rawLogs.map((l) => ({
    ...l,
    recipientEmail: l.toEmail,
    errorMessage: l.error,
    createdAt: l.sentAt,
  }));

  return { logs, total };
};

/**
 * Send 6-digit OTP email for password reset
 */
export const sendPasswordResetOtpEmail = async (email, otp, name = "Student") => {
  const subject = `Your Password Reset OTP: ${otp} - LDCE Placement Portal`;
  const htmlContent = TEMPLATES.PASSWORD_RESET_OTP({
    name,
    otp,
  });

  const results = await sendBulkEmail(
    [{ email, name }],
    subject,
    htmlContent
  );

  await prisma.emailLog.create({
    data: {
      toEmail: email,
      subject,
      templateName: "PASSWORD_RESET_OTP",
      status: results[0]?.status === "SENT" ? "SENT" : "FAILED",
      error: results[0]?.error || null,
    },
  });

  return results[0];
};

/**
 * Get count of students matching announcement filters
 * @param {Object} filters
 * @returns {number} matching student count
 */
export const getAnnouncementRecipientCount = async (filters = {}) => {
  const where = {};
  if (filters.includeDismissed === "false" || filters.includeDismissed === false) {
    where.isDismissed = false;
  }
  if (filters.isDismissed !== undefined && filters.isDismissed !== "" && filters.isDismissed !== "ALL") {
    where.isDismissed = filters.isDismissed === "true" || filters.isDismissed === true;
  }
  if (filters.profileLocked !== undefined && filters.profileLocked !== "" && filters.profileLocked !== "ALL") {
    where.profileLocked = filters.profileLocked === "true" || filters.profileLocked === true;
  }
  if (filters.branch && filters.branch !== "ALL" && filters.branch !== "") {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }
  if (filters.studentType && filters.studentType !== "ALL" && filters.studentType !== "") {
    where.studentType = filters.studentType;
  }
  if (filters.verificationStatus && filters.verificationStatus !== "ALL" && filters.verificationStatus !== "") {
    where.verificationStatus = filters.verificationStatus;
  }
  if (filters.isPlaced !== undefined && filters.isPlaced !== "" && filters.isPlaced !== "ALL") {
    where.isPlaced = filters.isPlaced === "true" || filters.isPlaced === true;
  }

  return prisma.student.count({ where });
};

