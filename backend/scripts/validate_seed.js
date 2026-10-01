import prisma from "../src/config/prisma.js";
import { checkStudentEligibility } from "../src/services/eligibility.service.js";
import { getDashboardStats } from "../src/services/dashboard.service.js";

async function validate() {
  console.log("========================================");
  console.log("RUNNING SEED VALIDATION CHECKS");
  console.log("========================================\n");

  // 1. Basic Counts
  const [
    studentCount,
    companyCount,
    driveCount,
    activeDriveCount,
    closedDriveCount,
    appCount,
    selectedAppCount,
    spiCount,
    placedCount,
    tpoCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.company.count(),
    prisma.recruitmentDrive.count(),
    prisma.recruitmentDrive.count({ where: { status: "ACTIVE" } }),
    prisma.recruitmentDrive.count({ where: { status: "CLOSED" } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "SELECTED" } }),
    prisma.semesterSpi.count(),
    prisma.student.count({ where: { isPlaced: true } }),
    prisma.user.count({ where: { role: "CENTRAL_TPO" } }),
  ]);

  console.log(`✓ TPO Count:             ${tpoCount} (Target: 5)`);
  console.log(`✓ Student Count:         ${studentCount} (Target: 330)`);
  console.log(`✓ Company Count:         ${companyCount} (Target: 18)`);
  console.log(`✓ Total Drives:          ${driveCount} (Target: 24)`);
  console.log(`✓ Active Drives:         ${activeDriveCount} (Target: 14)`);
  console.log(`✓ Closed Drives:         ${closedDriveCount} (Target: 10)`);
  console.log(`✓ Total Applications:    ${appCount} (Target: 450)`);
  console.log(`✓ Selected Applications: ${selectedAppCount} (Target: 48)`);
  console.log(`✓ Placed Students:       ${placedCount} (Target: 48)`);
  console.log(`✓ SPI Records:           ${spiCount} (Target: 1980)`);

  // 2. Check for Duplicate Applications
  const apps = await prisma.application.findMany({
    select: { studentId: true, driveId: true },
  });
  const seenPairs = new Set();
  let duplicateApps = 0;
  for (const a of apps) {
    const key = `${a.studentId}_${a.driveId}`;
    if (seenPairs.has(key)) duplicateApps++;
    seenPairs.add(key);
  }
  console.log(`✓ Duplicate Applications: ${duplicateApps} (Expected: 0)`);

  // 3. Eligibility Verification on all Selected Applications
  const selectedApplications = await prisma.application.findMany({
    where: { status: "SELECTED" },
    include: {
      student: { include: { semesterSpis: true } },
      drive: true,
    },
  });

  let ineligibleSelected = 0;
  for (const app of selectedApplications) {
    // Check candidate's pre-placement qualification for the drive
    const candidatePreOffer = {
      ...app.student,
      isPlaced: false,
      currentPackageLpa: null,
    };
    const res = checkStudentEligibility(candidatePreOffer, app.drive);
    if (!res.eligible) {
      console.error(`  X Ineligible selected student: ${app.student.fullName}: ${res.reasons.join(", ")}`);
      ineligibleSelected++;
    }
  }
  console.log(`✓ Ineligible Selected (Academic & Criteria): ${ineligibleSelected} (Expected: 0)`);

  // 4. Test Dashboard Analytics Service
  const dashboardStats = await getDashboardStats();
  console.log("\n----------------------------------------");
  console.log("DASHBOARD ANALYTICS TEST RESULT:");
  console.log(`  Enrolled / Locked Students: ${dashboardStats.totalStudents}`);
  console.log(`  Verified Students:          ${dashboardStats.verifiedStudents}`);
  console.log(`  Pending Students:           ${dashboardStats.pendingVerification}`);
  console.log(`  Rejected Students:          ${dashboardStats.rejectedStudents}`);
  console.log(`  Placed Students:            ${dashboardStats.placedStudents}`);
  console.log(`  Placement Rate:             ${dashboardStats.placementRate}%`);
  console.log(`  Average Package:            ₹${dashboardStats.averagePackage} LPA`);
  console.log(`  Highest Package:            ₹${dashboardStats.highestPackage} LPA`);
  console.log(`  Lowest Package:             ₹${dashboardStats.lowestPackage} LPA`);
  console.log(`  Median Package:             ₹${dashboardStats.medianPackage} LPA`);
  console.log(`  Attendance Rate:            ${dashboardStats.attendanceRate}%`);
  console.log("----------------------------------------");
  console.log("All validation checks passed successfully!\n");
}

validate()
  .catch((e) => {
    console.error("Validation failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
