import prisma from "../config/prisma.js";

/**
 * Get comprehensive analytics dashboard data for TPO
 */
export const getDashboardStats = async () => {
  // Run all queries in parallel — use allSettled so one failure doesn't crash everything
  const results = await Promise.allSettled([
    // [0] Total Students
    prisma.student.count(),
    // [1] Verified
    prisma.student.count({ where: { verificationStatus: "VERIFIED" } }),
    // [2] Pending
    prisma.student.count({ where: { verificationStatus: "PENDING" } }),
    // [3] Rejected
    prisma.student.count({ where: { verificationStatus: "REJECTED" } }),
    // [4] Placed
    prisma.student.count({ where: { isPlaced: true } }),
    // [5] Dismissed
    prisma.student.count({ where: { isDismissed: true } }),
    // [6] Students by branch
    prisma.student.groupBy({
      by: ["branch"],
      _count: { id: true },
      where: { branch: { not: null } },
    }),
    // [7] Students by type
    prisma.student.groupBy({
      by: ["studentType"],
      _count: { id: true },
    }),
    // [8] Total companies
    prisma.company.count(),
    // [9] Active drives
    prisma.recruitmentDrive.count({ where: { status: "ACTIVE" } }),
    // [10] Closed drives
    prisma.recruitmentDrive.count({ where: { status: "CLOSED" } }),
    // [11] Total applications
    prisma.application.count(),
    // [12] Applications by status
    prisma.application.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // [13] Attendance stats
    prisma.application.count({
      where: {
        OR: [
          { attendanceMarked: true },
          { isPresent: { not: null } },
          { status: { in: ["SHORTLISTED", "SELECTED", "REJECTED"] } },
        ],
      },
    }),
    // [14] Placed students with package details
    prisma.student.findMany({
      where: { isPlaced: true, currentPackageLpa: { not: null } },
      select: {
        id: true,
        fullName: true,
        branch: true,
        currentPackageLpa: true,
        applications: {
          where: { status: "SELECTED" },
          select: {
            drive: {
              select: {
                role: true,
                ctc: true,
                ctcMax: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Helper to safely extract result value with fallback
  const safeGet = (index, fallback) => {
    const r = results[index];
    if (r.status === "fulfilled") return r.value;
    console.error(`[DASHBOARD] Query [${index}] failed:`, r.reason?.message || r.reason);
    return fallback;
  };

  const totalStudents       = safeGet(0, 0);
  const verifiedStudents    = safeGet(1, 0);
  const pendingStudents     = safeGet(2, 0);
  const rejectedStudents    = safeGet(3, 0);
  const placedStudents      = safeGet(4, 0);
  const dismissedStudents   = safeGet(5, 0);
  const studentsByBranch    = safeGet(6, []);
  const studentsByType      = safeGet(7, []);
  const totalCompanies      = safeGet(8, 0);
  const activeDrives        = safeGet(9, 0);
  const closedDrives        = safeGet(10, 0);
  const totalApplications   = safeGet(11, 0);
  const applicationsByStatus = safeGet(12, []);
  const attendanceStats     = safeGet(13, 0);
  const placedStudentDetails = safeGet(14, []);


  // Attendance rate calculation
  const totalAttendanceMarked = attendanceStats;
  let presentCount = 0;
  try {
    presentCount = await prisma.application.count({
      where: { isPresent: true },
    });
  } catch (e) {
    console.error("[DASHBOARD] presentCount query failed:", e?.message);
  }
  const attendanceRate =
    totalAttendanceMarked > 0
      ? Math.round((presentCount / totalAttendanceMarked) * 10000) / 100
      : 0;

  // Package analytics
  const packages = placedStudentDetails
    .filter((s) => s.currentPackageLpa !== null)
    .map((s) => s.currentPackageLpa);

  const packageStats = {
    highest: packages.length > 0 ? Math.max(...packages) : 0,
    lowest: packages.length > 0 ? Math.min(...packages) : 0,
    average:
      packages.length > 0
        ? Math.round((packages.reduce((a, b) => a + b, 0) / packages.length) * 100) / 100
        : 0,
    median: getMedian(packages),
  };

  // Company-wise package breakdown
  const companyMap = {};
  placedStudentDetails.forEach((student) => {
    student.applications.forEach((app) => {
      // Null-safe: skip if drive or company data is missing
      if (!app.drive || !app.drive.company) return;
      const companyName = app.drive.company.name;
      const companyId = app.drive.company.id;
      if (!companyMap[companyName]) {
        companyMap[companyName] = { companyId, totalPackage: 0, count: 0, students: [] };
      }
      const offerPackage =
        app.drive.ctcMax !== null && app.drive.ctcMax !== undefined
          ? (app.drive.ctc + app.drive.ctcMax) / 2
          : (app.drive.ctc || 0);

      companyMap[companyName].totalPackage += offerPackage;
      companyMap[companyName].count += 1;
      companyMap[companyName].students.push({
        name: student.fullName,
        role: app.drive.role,
        package: offerPackage,
      });
    });
  });

  const companyWise = Object.entries(companyMap)
    .map(([company, data]) => ({
      company,
      companyId: data.companyId,
      avgPackage: Math.round((data.totalPackage / data.count) * 100) / 100,
      studentsHired: data.count,
      details: data.students,
    }))
    .sort((a, b) => b.avgPackage - a.avgPackage);

  // Branch-wise placement breakdown
  const branchMap = {};
  placedStudentDetails.forEach((student) => {
    const branch = student.branch || "UNKNOWN";
    if (!branchMap[branch]) {
      branchMap[branch] = { totalPackage: 0, count: 0 };
    }
    branchMap[branch].totalPackage += student.currentPackageLpa;
    branchMap[branch].count += 1;
  });

  const branchWise = Object.entries(branchMap)
    .map(([branch, data]) => ({
      branch,
      avgPackage: Math.round((data.totalPackage / data.count) * 100) / 100,
      placed: data.count,
    }))
    .sort((a, b) => b.placed - a.placed);

  // Format grouped results
  const byBranch = {};
  studentsByBranch.forEach((item) => {
    byBranch[item.branch] = item._count.id;
  });

  const byType = {};
  studentsByType.forEach((item) => {
    byType[item.studentType] = item._count.id;
  });

  const byStatus = {};
  applicationsByStatus.forEach((item) => {
    byStatus[item.status] = item._count.id;
  });

  const placementRate =
    totalStudents > 0
      ? Math.round((placedStudents / totalStudents) * 10000) / 100
      : 0;

  return {
    // Top-level aliases for direct access
    totalStudents,
    verifiedStudents,
    pendingVerification: pendingStudents,
    rejectedStudents,
    placedStudents,
    totalPlaced: placedStudents,
    dismissedStudents,
    activeDrives,
    totalCompanies,
    companiesCount: totalCompanies,
    totalApplications,
    attendanceRate,
    highestPackage: packageStats.highest,
    lowestPackage: packageStats.lowest,
    averagePackage: packageStats.average,
    medianPackage: packageStats.median,
    placementPercentage: placementRate,
    placementRate,

    // Rich nested structures
    students: {
      total: totalStudents,
      verified: verifiedStudents,
      pending: pendingStudents,
      rejected: rejectedStudents,
      placed: placedStudents,
      dismissed: dismissedStudents,
      byBranch,
      byType,
    },
    companies: {
      total: totalCompanies,
      activeDrives,
      closedDrives,
    },
    applications: {
      total: totalApplications,
      byStatus,
      attendanceRate,
    },
    packages: {
      ...packageStats,
      companyWise,
      branchWise,
    },
  };
};

/**
 * Calculate median from an array of numbers
 */
function getMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
}
