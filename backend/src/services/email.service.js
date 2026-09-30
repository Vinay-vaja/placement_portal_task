import prisma from "../config/prisma.js";
import { sendBulkEmail } from "../config/brevo.js";
import { TEMPLATES } from "../utils/emailTemplates.js";
import { config } from "../config/env.js";
import { getEligibleStudents } from "./eligibility.service.js";

/**
 * Send drive notification emails to eligible students
 */
export const sendDriveNotification = async (driveId, customMessage = "") => {
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

  // Get eligible students for this drive
  const eligibleStudents = await getEligibleStudents(drive);

  if (eligibleStudents.length === 0) {
    return { sent: 0, message: "No eligible students found for this drive" };
  }

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

  // Generate personalized emails
  const recipients = eligibleStudents.map((student) => ({
    email: student.user.email,
    params: {
      studentName: student.fullName,
    },
  }));

  const htmlContent = TEMPLATES.DRIVE_NOTIFICATION({
    studentName: "{{studentName}}",
    companyName: drive.company.name,
    role: drive.role,
    ctc: ctcStr,
    location: drive.location,
    deadline: deadlineStr,
    description: drive.description || customMessage,
    portalUrl: config.clientUrl,
  });

  const subject = `New Recruitment Drive: ${drive.role} at ${drive.company.name}`;

  const results = await sendBulkEmail(recipients, subject, htmlContent);

  // Log all sent emails
  const emailLogs = results.map((r) => ({
    toEmail: r.email,
    subject,
    templateName: "DRIVE_NOTIFICATION",
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
    message:
      sent > 0
        ? `Sent ${sent} emails successfully${failed > 0 ? `, ${failed} failed` : ""}`
        : `Drive notifications recorded for ${results.length} eligible students. (${results[0]?.error || "Delivery recorded in logs"})`,
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
  const where = {
    isDismissed: false,
  };

  if (filters.profileLocked !== undefined) {
    where.profileLocked = filters.profileLocked === "true" || filters.profileLocked === true;
  }
  if (filters.branch) {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }
  if (filters.studentType) {
    where.studentType = filters.studentType;
  }
  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }
  if (filters.isPlaced !== undefined) {
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

  // Save announcement
  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      driveId: driveId || null,
      sentById,
    },
  });

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

  // Log sent emails
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

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: parseInt(query.skip) || 0,
      take: parseInt(query.take) || 50,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return { logs, total };
};
