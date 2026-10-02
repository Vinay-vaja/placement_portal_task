import ExcelJS from "exceljs";
import prisma from "../config/prisma.js";
import { calculateCpi, calculateCgpa } from "../utils/percentage.js";
import * as driveService from "./drive.service.js";
import * as eligibilityService from "./eligibility.service.js";

/**
 * Export students as CSV/XLSX based on filters
 * @param {Object} filters - same filters as getAllStudents
 * @param {string} format - "csv" or "xlsx"
 * @returns {Buffer} file buffer
 */
export const exportStudents = async (filters = {}, format = "csv") => {
  // Build query (reuse same filter logic as student.service)
  const where = {};

  if (filters.verificationStatus && filters.verificationStatus !== "ALL" && filters.verificationStatus !== "") {
    where.verificationStatus = filters.verificationStatus;
  }
  if (filters.studentType && filters.studentType !== "ALL" && filters.studentType !== "") {
    where.studentType = filters.studentType;
  }
  if (filters.profileLocked !== undefined && filters.profileLocked !== "" && filters.profileLocked !== "ALL") {
    where.profileLocked = filters.profileLocked === "true" || filters.profileLocked === true;
  }
  if (filters.isPlaced !== undefined && filters.isPlaced !== "" && filters.isPlaced !== "ALL") {
    where.isPlaced = filters.isPlaced === "true" || filters.isPlaced === true;
  }
  if (filters.isDismissed !== undefined && filters.isDismissed !== "" && filters.isDismissed !== "ALL") {
    where.isDismissed = filters.isDismissed === "true" || filters.isDismissed === true;
  }
  if (filters.branch && filters.branch !== "ALL" && filters.branch !== "") {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }
  if (filters.minTenth) {
    where.tenthPercentage = { gte: parseFloat(filters.minTenth) };
  }
  if (filters.minTwelfth) {
    const minVal = parseFloat(filters.minTwelfth);
    where.OR = [
      { twelfthPercentage: { gte: minVal } },
      { studentType: "D2D" },
    ];
  }
  if (filters.search && filters.search.trim()) {
    const searchFilter = [
      { fullName: { contains: filters.search.trim(), mode: "insensitive" } },
      { user: { email: { contains: filters.search.trim(), mode: "insensitive" } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
      semesterSpis: { orderBy: { semester: "asc" } },
    },
    orderBy: { fullName: "asc" },
  });

  // Post-query CPI/CGPA filtering
  let data = students.map((s) => ({
    ...s,
    cpi: calculateCpi(s.semesterSpis),
    cgpa: calculateCgpa(s.semesterSpis),
  }));

  if (filters.minCpi) {
    const minCpi = parseFloat(filters.minCpi);
    data = data.filter((s) => s.cpi !== null && s.cpi >= minCpi);
  }
  if (filters.minCgpa) {
    const minCgpa = parseFloat(filters.minCgpa);
    data = data.filter((s) => s.cgpa !== null && s.cgpa >= minCgpa);
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Placement Portal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Students");

  // Define columns
  sheet.columns = [
    { header: "Full Name", key: "fullName", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Branch", key: "branch", width: 12 },
    { header: "Type", key: "studentType", width: 10 },
    { header: "10th %", key: "tenthPercentage", width: 10 },
    { header: "12th %", key: "twelfthPercentage", width: 10 },
    { header: "D2D CGPA", key: "d2dCgpa", width: 10 },
    { header: "CPI", key: "cpi", width: 8 },
    { header: "CGPA", key: "cgpa", width: 8 },
    { header: "Verification", key: "verificationStatus", width: 12 },
    { header: "Placed", key: "isPlaced", width: 8 },
    { header: "Package (LPA)", key: "currentPackageLpa", width: 13 },
    { header: "Dismissed", key: "isDismissed", width: 10 },

    // 10th Subject Marks
    { header: "10th Maths", key: "mathsMarks", width: 10 },
    { header: "10th Science", key: "scienceMarks", width: 12 },
    { header: "10th English", key: "englishMarks", width: 12 },
    { header: "10th Social Science", key: "socialScienceMarks", width: 16 },
    { header: "10th Sanskrit", key: "sanskritMarks", width: 12 },
    { header: "10th Gujarati", key: "gujaratiMarks", width: 12 },

    // 12th Subject Marks
    { header: "12th English", key: "twelfthEnglishMarks", width: 12 },
    { header: "12th Physics", key: "twelfthPhysicsMarks", width: 12 },
    { header: "12th Maths", key: "twelfthMathsMarks", width: 12 },
    { header: "12th Chemistry", key: "twelfthChemistryMarks", width: 14 },
    { header: "12th Computer", key: "twelfthComputerMarks", width: 14 },

    // SPI columns
    { header: "Sem 1 SPI", key: "sem1", width: 10 },
    { header: "Sem 2 SPI", key: "sem2", width: 10 },
    { header: "Sem 3 SPI", key: "sem3", width: 10 },
    { header: "Sem 4 SPI", key: "sem4", width: 10 },
    { header: "Sem 5 SPI", key: "sem5", width: 10 },
    { header: "Sem 6 SPI", key: "sem6", width: 10 },
    { header: "Sem 7 SPI", key: "sem7", width: 10 },
    { header: "Sem 8 SPI", key: "sem8", width: 10 },
  ];

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Add data rows
  data.forEach((student) => {
    const spiMap = {};
    student.semesterSpis?.forEach((s) => {
      spiMap[`sem${s.semester}`] = s.spi;
    });

    sheet.addRow({
      fullName: student.fullName,
      email: student.user?.email || "",
      phone: student.phone,
      branch: student.branch || "",
      studentType: student.studentType,
      tenthPercentage: student.tenthPercentage,
      twelfthPercentage: student.twelfthPercentage ?? "",
      d2dCgpa: student.d2dCgpa ?? "",
      cpi: student.cpi ?? "",
      cgpa: student.cgpa ?? "",
      verificationStatus: student.verificationStatus,
      isPlaced: student.isPlaced ? "Yes" : "No",
      currentPackageLpa: student.currentPackageLpa ?? "",
      isDismissed: student.isDismissed ? "Yes" : "No",

      mathsMarks: student.mathsMarks ?? "",
      scienceMarks: student.scienceMarks ?? "",
      englishMarks: student.englishMarks ?? "",
      socialScienceMarks: student.socialScienceMarks ?? "",
      sanskritMarks: student.sanskritMarks ?? "",
      gujaratiMarks: student.gujaratiMarks ?? "",

      twelfthEnglishMarks: student.twelfthEnglishMarks ?? "",
      twelfthPhysicsMarks: student.twelfthPhysicsMarks ?? "",
      twelfthMathsMarks: student.twelfthMathsMarks ?? "",
      twelfthChemistryMarks: student.twelfthChemistryMarks ?? "",
      twelfthComputerMarks: student.twelfthComputerMarks ?? "",

      ...spiMap,
    });
  });

  // Generate buffer
  if (format === "csv") {
    return workbook.csv.writeBuffer();
  }
  return workbook.xlsx.writeBuffer();
};

/**
 * Export applicants for a specific drive
 */
export const exportDriveApplicants = async (driveId, format = "csv") => {
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: {
      company: { select: { name: true } },
      applications: {
        include: {
          student: {
            include: {
              user: { select: { email: true } },
              semesterSpis: { orderBy: { semester: "asc" } },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!drive) {
    const error = new Error("Drive not found");
    error.statusCode = 404;
    throw error;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Placement Portal";

  const sheet = workbook.addWorksheet(
    `${drive.company.name} - ${drive.role}`.substring(0, 31)
  );

  sheet.columns = [
    { header: "Full Name", key: "fullName", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Branch", key: "branch", width: 12 },
    { header: "Type", key: "studentType", width: 10 },
    { header: "Status", key: "status", width: 14 },
    { header: "Applied At", key: "appliedAt", width: 18 },
    { header: "10th %", key: "tenthPercentage", width: 10 },
    { header: "12th %", key: "twelfthPercentage", width: 10 },
    { header: "CPI", key: "cpi", width: 8 },
    { header: "CGPA", key: "cgpa", width: 8 },
    { header: "Resume", key: "resumeUrl", width: 40 },
    { header: "Attendance", key: "attendance", width: 12 },
    { header: "Present", key: "isPresent", width: 10 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  drive.applications.forEach((app) => {
    const student = app.student;
    const cpi = calculateCpi(student.semesterSpis);
    const cgpa = calculateCgpa(student.semesterSpis);

    sheet.addRow({
      fullName: student.fullName,
      email: student.user?.email || "",
      phone: student.phone,
      branch: student.branch || "",
      studentType: student.studentType,
      status: app.status,
      appliedAt: new Date(app.appliedAt).toLocaleDateString("en-IN"),
      tenthPercentage: student.tenthPercentage,
      twelfthPercentage: student.twelfthPercentage ?? "",
      cpi: cpi ?? "",
      cgpa: cgpa ?? "",
      resumeUrl: app.resumeUrl,
      attendance: app.attendanceMarked ? "Marked" : "Not Marked",
      isPresent: app.attendanceMarked
        ? app.isPresent
          ? "Present"
          : "Absent"
        : "",
    });
  });

  if (format === "csv") {
    return workbook.csv.writeBuffer();
  }
  return workbook.xlsx.writeBuffer();
};

/**
 * Export company-wise student placements/applications as CSV or XLSX
 * @param {Object} query - { companyId?: string, format?: 'csv' | 'xlsx' }
 * @param {string} format - "csv" or "xlsx"
 * @returns {Buffer} file buffer
 */
export const exportCompanyWiseStudents = async (query = {}, format = "xlsx") => {
  const where = {
    status: "SELECTED",
  };

  if (query.companyId && query.companyId !== "ALL") {
    where.drive = { companyId: query.companyId };
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      drive: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
      student: {
        include: {
          user: { select: { email: true } },
          semesterSpis: { orderBy: { semester: "asc" } },
        },
      },
    },
    orderBy: [
      { drive: { company: { name: "asc" } } },
      { appliedAt: "desc" },
    ],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LDCE Central Placement Cell";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Company Selections");

  sheet.columns = [
    { header: "Company Name", key: "companyName", width: 25 },
    { header: "Job Role", key: "role", width: 22 },
    { header: "Package (LPA)", key: "package", width: 15 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Student Email", key: "email", width: 30 },
    { header: "Phone Number", key: "phone", width: 16 },
    { header: "Branch", key: "branch", width: 14 },
    { header: "Student Type", key: "studentType", width: 12 },
    { header: "10th %", key: "tenthPercentage", width: 10 },
    { header: "12th %", key: "twelfthPercentage", width: 10 },
    { header: "D2D CGPA", key: "d2dCgpa", width: 12 },
    { header: "CPI", key: "cpi", width: 10 },
    { header: "CGPA", key: "cgpa", width: 10 },
    { header: "Selection Status", key: "status", width: 16 },
    { header: "Selection Date", key: "offerDate", width: 16 },
  ];

  // Professional header styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0071E3" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  applications.forEach((app) => {
    const student = app.student;
    const drive = app.drive;
    const company = drive?.company;
    const cpi = calculateCpi(student.semesterSpis);
    const cgpa = calculateCgpa(student.semesterSpis);

    const offerPkg =
      student.currentPackageLpa ??
      (drive.ctcMax ? `${drive.ctc} - ${drive.ctcMax}` : drive.ctc);

    sheet.addRow({
      companyName: company?.name || "N/A",
      role: drive?.role || "Engineering Role",
      package: offerPkg,
      studentName: student.fullName,
      email: student.user?.email || "",
      phone: student.phone,
      branch: student.branch || "",
      studentType: student.studentType,
      tenthPercentage: student.tenthPercentage ?? "",
      twelfthPercentage: student.twelfthPercentage ?? "",
      d2dCgpa: student.d2dCgpa ?? "",
      cpi: cpi ?? "",
      cgpa: cgpa ?? "",
      status: app.status,
      offerDate: new Date(app.updatedAt || app.appliedAt).toLocaleDateString("en-IN"),
    });
  });

  if (format === "csv") {
    return workbook.csv.writeBuffer();
  }
  return workbook.xlsx.writeBuffer();
};

/**
 * Export eligible students for a specific drive as CSV or XLSX
 * @param {string} driveId
 * @param {string} format - "csv" or "xlsx"
 * @returns {Buffer} file buffer
 */
export const exportDriveEligibleStudents = async (driveId, format = "csv") => {
  const drive = await driveService.getDriveById(driveId);
  if (!drive) {
    const error = new Error("Drive not found");
    error.statusCode = 404;
    throw error;
  }

  const eligibleStudents = await eligibilityService.getEligibleStudents(drive);

  // Check if any of these eligible students have applied
  const existingApplications = await prisma.application.findMany({
    where: { driveId },
    select: { studentId: true, status: true, appliedAt: true },
  });
  const appMap = new Map(existingApplications.map((a) => [a.studentId, a]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LDCE Central Placement Cell";
  workbook.created = new Date();

  const safeTitle = `Eligible - ${drive.company.name}`.replace(/[\/\\?*:[\]]/g, "_").substring(0, 31);
  const sheet = workbook.addWorksheet(safeTitle);

  sheet.columns = [
    { header: "Company Name", key: "companyName", width: 22 },
    { header: "Job Role", key: "role", width: 20 },
    { header: "CTC (LPA)", key: "ctc", width: 14 },
    { header: "Student Name", key: "fullName", width: 25 },
    { header: "Email Address", key: "email", width: 30 },
    { header: "Contact Number", key: "phone", width: 16 },
    { header: "Branch", key: "branch", width: 14 },
    { header: "Student Type", key: "studentType", width: 12 },
    { header: "10th %", key: "tenthPercentage", width: 10 },
    { header: "12th %", key: "twelfthPercentage", width: 10 },
    { header: "D2D CGPA", key: "d2dCgpa", width: 10 },
    { header: "CPI", key: "cpi", width: 8 },
    { header: "CGPA", key: "cgpa", width: 8 },
    { header: "Placement Status", key: "placementStatus", width: 16 },
    { header: "Application Status", key: "appStatus", width: 18 },
  ];

  sheet.getRow(1).height = 24;
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0071E3" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

  eligibleStudents.forEach((student) => {
    const app = appMap.get(student.id);
    const ctcStr = drive.ctcMax ? `${drive.ctc} - ${drive.ctcMax}` : `${drive.ctc}`;

    sheet.addRow({
      companyName: drive.company.name,
      role: drive.role,
      ctc: ctcStr,
      fullName: student.fullName,
      email: student.user?.email || "",
      phone: student.phone || "",
      branch: student.branch || "",
      studentType: student.studentType,
      tenthPercentage: student.tenthPercentage !== null ? student.tenthPercentage : "",
      twelfthPercentage: student.twelfthPercentage !== null ? student.twelfthPercentage : "",
      d2dCgpa: student.d2dCgpa !== null ? student.d2dCgpa : "",
      cpi: student.cpi !== null ? student.cpi : "",
      cgpa: student.cgpa !== null ? student.cgpa : "",
      placementStatus: student.isPlaced ? `Placed (${student.currentPackageLpa} LPA)` : "Unplaced",
      appStatus: app ? `Applied (${app.status})` : "Not Applied",
    });
  });

  if (format === "csv") {
    return workbook.csv.writeBuffer();
  }
  return workbook.xlsx.writeBuffer();
};

