import prisma from "../config/prisma.js";

/**
 * Get comprehensive analytics dashboard data for TPO
 */
export const getDashboardStats = async () => {
  // Run all queries in parallel for performance
  const [
    totalStudents,
    verifiedStudents,
    pendingStudents,
    rejectedStudents,
    placedStudents,
    dismissedStudents,
    studentsByBranch,
    studentsByType,
    totalCompanies,
    activeDrives,
    closedDrives,
    totalApplications,
    applicationsByStatus,
    attendanceStats,
    placedStudentDetails,
  ] = await Promise.all([
    // Student counts
    prisma.student.count(),
    prisma.student.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.student.count({ where: { verificationStatus: "PENDING" } }),
    prisma.student.count({ where: { verificationStatus: "REJECTED" } }),
    prisma.student.count({ where: { isPlaced: true } }),
    prisma.student.count({ where: { isDismissed: true } }),

    // Students by branch
    prisma.student.groupBy({
      by: ["branch"],
      _count: { id: true },
      where: { branch: { not: null } },
    }),

    // Students by type
    prisma.student.groupBy({
      by: ["studentType"],
      _count: { id: true },
    }),

    // Company & drive counts
    prisma.company.count(),
    prisma.recruitmentDrive.count({ where: { status: "ACTIVE" } }),
    prisma.recruitmentDrive.count({ where: { status: "CLOSED" } }),

    // Application counts
    prisma.application.count(),
    prisma.application.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Attendance stats
    prisma.application.aggregate({
      where: { attendanceMarked: true },
      _count: { id: true },
    }),

    // Placed students with package details
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
                company: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Attendance rate calculation
  const totalAttendanceMarked = attendanceStats._count.id;
  const presentCount = await prisma.application.count({
    where: { attendanceMarked: true, isPresent: true },
  });
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
      const companyName = app.drive.company.name;
      if (!companyMap[companyName]) {
        companyMap[companyName] = { totalPackage: 0, count: 0, students: [] };
      }
      companyMap[companyName].totalPackage += student.currentPackageLpa;
      companyMap[companyName].count += 1;
      companyMap[companyName].students.push({
        name: student.fullName,
        role: app.drive.role,
        package: student.currentPackageLpa,
      });
    });
  });

  const companyWise = Object.entries(companyMap)
    .map(([company, data]) => ({
      company,
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
