import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { checkStudentEligibility } from "../src/services/eligibility.service.js";
import {
  calculateTenthPercentage,
  calculateTwelfthPercentage,
  calculateCpi,
  calculateCgpa,
} from "../src/utils/percentage.js";

dotenv.config();

const prisma = new PrismaClient();

// ==========================================
// DETERMINISTIC PSEUDO-RANDOM GENERATOR
// ==========================================
function createPrng(seed = 123456789) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createPrng(42);

function randomInRange(min, max) {
  return min + rng() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1));
}

function roundTwo(val) {
  return Math.round(val * 100) / 100;
}

// ==========================================
// FIRST & LAST NAMES FOR DUMMY STUDENTS
// ==========================================
const FIRST_NAMES_MALE = [
  "Aarav", "Rohan", "Harshil", "Parth", "Yash", "Bhavik", "Dev", "Kavya",
  "Meet", "Jay", "Manan", "Darshan", "Smit", "Dhruv", "Pranav", "Aditya",
  "Karan", "Nikhil", "Siddharth", "Vivek", "Chirag", "Jaimin", "Hardik",
  "Rushabh", "Fenil", "Deep", "Akash", "Tirth", "Varun", "Vatsal"
];

const FIRST_NAMES_FEMALE = [
  "Priya", "Diya", "Sneha", "Ananya", "Kruti", "Tanvi", "Ritu", "Khushi",
  "Isha", "Mansi", "Drashti", "Pooja", "Bhoomi", "Kinjal", "Nidhi", "Dhruvi",
  "Shreya", "Riddhi", "Siddhi", "Radhika", "Bhakti", "Jiya", "Vidhi",
  "Saloni", "Forum", "Prachi", "Avani", "Krupa", "Disha", "Hetvi"
];

const LAST_NAMES = [
  "Patel", "Shah", "Mehta", "Desai", "Trivedi", "Joshi", "Bhatt", "Dave",
  "Rathod", "Solanki", "Parmar", "Vaghela", "Chauhan", "Modi", "Panchal",
  "Soni", "Gajjar", "Barot", "Mistry", "Upadhyay", "Pandya", "Kulkarni",
  "Ravikumar", "Shukla", "Parekh", "Doshi", "Zaveri", "Kapadia", "Vyas", "Thakar"
];

const POLYTECHNIC_COLLEGES = [
  "Government Polytechnic, Ahmedabad",
  "Sir Bhavsinhji Polytechnic Institute, Bhavnagar",
  "Government Polytechnic, Gandhinagar",
  "Tolani Foundation Gandhidham Polytechnic",
  "B & B Institute of Technology, Vallabh Vidyanagar",
  "Government Polytechnic, Rajkot",
  "Government Polytechnic, Surat",
  "Government Polytechnic, Vadnagar",
];

async function main() {
  console.log("========================================");
  console.log("STARTING PRODUCTION-GRADE SEEDING");
  console.log("========================================\n");

  // ==========================================
  // 1. CLEAN EXISTING DUMMY DATA FOR IDEMPOTENCY
  // ==========================================
  console.log("Cleaning up prior dummy data for idempotent seed...");
  await prisma.announcement.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.recruitmentDrive.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.semesterSpi.deleteMany({});
  await prisma.student.deleteMany({});
  // Delete existing dummy student users (preserve admin TPO unless updating)
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "@ldce.ac.in",
        notIn: [
          "tpo@ldce.ac.in",
          "tpo.circuits@ldce.ac.in",
          "tpo.circuits_allied@ldce.ac.in",
          "tpo.core@ldce.ac.in",
          "tpo.process@ldce.ac.in",
        ],
      },
    },
  });

  // ==========================================
  // 2. SEED 5 CENTRAL TPO ACCOUNTS
  // ==========================================
  console.log("Seeding 5 TPO accounts...");

  const tpoAccounts = [
    {
      name: "Central TPO Admin",
      email: process.env.SEED_TPO_EMAIL || "tpo@ldce.ac.in",
      password: process.env.SEED_TPO_PASSWORD || "12345678",
      designation: "Head of T&P Cell",
    },
    {
      name: "Prof. Rajesh Patel",
      email: "tpo.circuits@ldce.ac.in",
      password: "Tpo@2026!",
      designation: "Computer & IT Coordinator",
    },
    {
      name: "Prof. Sneha Shah",
      email: "tpo.circuits_allied@ldce.ac.in",
      password: "Tpo@2026!",
      designation: "Electrical & Electronics Coordinator",
    },
    {
      name: "Prof. Manish Desai",
      email: "tpo.core@ldce.ac.in",
      password: "Tpo@2026!",
      designation: "Mechanical & Allied Coordinator",
    },
    {
      name: "Prof. Priya Mehta",
      email: "tpo.process@ldce.ac.in",
      password: "Tpo@2026!",
      designation: "Chemical, Civil & Materials Coordinator",
    },
  ];

  const tpoUsers = [];
  for (const tpo of tpoAccounts) {
    const passwordHash = await bcrypt.hash(tpo.password, 12);
    const user = await prisma.user.upsert({
      where: { email: tpo.email },
      update: {
        passwordHash,
        role: "CENTRAL_TPO",
        authProvider: "LOCAL",
      },
      create: {
        email: tpo.email,
        passwordHash,
        role: "CENTRAL_TPO",
        authProvider: "LOCAL",
      },
    });
    tpoUsers.push(user);
    console.log(`   + TPO: ${tpo.email} (${tpo.name})`);
  }

  // ==========================================
  // 3. SEED DEFAULT TPO SETTINGS
  // ==========================================
  const defaultSettings = [
    { key: "required_semesters", value: JSON.stringify([1, 2, 3, 4, 5]) },
    { key: "sem6_required", value: JSON.stringify(false) },
    { key: "placement_active", value: JSON.stringify(true) },
  ];

  for (const setting of defaultSettings) {
    await prisma.tpoSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // ==========================================
  // 4. BRANCH & STUDENT SPECIFICATION (TOTAL: 330)
  // ==========================================
  // Computer & Tech: CE: 55, IT: 45, AIML: 40 (Total 140)
  // Electronics & Electrical: EC: 30, EE: 25, IC: 12, ROBOTICS: 8 (Total 75)
  // Core Mech: MECHANICAL: 40, AUTOMOBILE: 15 (Total 55)
  // Process & Infra: CIVIL: 25, CHEMICAL: 20, ENVIRONMENTAL: 6, RUBBER: 5, PLASTIC: 4 (Total 60)
  // Overall = 330
  // D2D total = 60 (~18.2%), Regular total = 270 (~81.8%)
  // Verification target across 330 students:
  // Verified/Locked: 230 (~70%)
  // Pending/Locked: 66 (~20%)
  // Rejected/Locked: 17 (~5%)
  // Draft/Unlocked: 17 (~5%)
  const branchConfigs = [
    { branch: "CE", total: 55, d2d: 10, verified: 39, pending: 11, rejected: 3, draft: 2 },
    { branch: "IT", total: 45, d2d: 8, verified: 31, pending: 9, rejected: 3, draft: 2 },
    { branch: "AIML", total: 40, d2d: 6, verified: 28, pending: 8, rejected: 2, draft: 2 },
    { branch: "EC", total: 30, d2d: 5, verified: 21, pending: 6, rejected: 2, draft: 1 },
    { branch: "EE", total: 25, d2d: 5, verified: 18, pending: 5, rejected: 1, draft: 1 },
    { branch: "IC", total: 12, d2d: 2, verified: 8, pending: 2, rejected: 1, draft: 1 },
    { branch: "ROBOTICS", total: 8, d2d: 1, verified: 6, pending: 1, rejected: 0, draft: 1 },
    { branch: "MECHANICAL", total: 40, d2d: 8, verified: 28, pending: 8, rejected: 2, draft: 2 },
    { branch: "AUTOMOBILE", total: 15, d2d: 3, verified: 10, pending: 3, rejected: 1, draft: 1 },
    { branch: "CIVIL", total: 25, d2d: 5, verified: 17, pending: 5, rejected: 1, draft: 2 },
    { branch: "CHEMICAL", total: 20, d2d: 4, verified: 14, pending: 4, rejected: 1, draft: 1 },
    { branch: "ENVIRONMENTAL", total: 6, d2d: 1, verified: 4, pending: 2, rejected: 0, draft: 0 },
    { branch: "RUBBER", total: 5, d2d: 1, verified: 3, pending: 1, rejected: 0, draft: 1 },
    { branch: "PLASTIC", total: 4, d2d: 1, verified: 3, pending: 1, rejected: 0, draft: 0 },
  ];

  console.log("\nPreparing 330 students across 14 branches (proportionate verification)...");

  const studentDefaultPasswordHash = await bcrypt.hash("Student@2026!", 12);

  let studentCounter = 1;
  const rawStudentDefinitions = [];

  for (const bCfg of branchConfigs) {
    for (let i = 0; i < bCfg.total; i++) {
      const isD2D = i < bCfg.d2d;
      const idNumStr = String(studentCounter).padStart(3, "0");
      const email = `student${idNumStr}@ldce.ac.in`;

      const isMale = studentCounter % 2 === 1;
      const firstName = isMale
        ? FIRST_NAMES_MALE[(studentCounter * 7) % FIRST_NAMES_MALE.length]
        : FIRST_NAMES_FEMALE[(studentCounter * 7) % FIRST_NAMES_FEMALE.length];
      const lastName = LAST_NAMES[(studentCounter * 11) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;

      // Performance profile tier (High ~20%, Average ~65%, Lower ~15%)
      const perfTier = (studentCounter % 10 < 2) ? "HIGH" : (studentCounter % 10 < 8.5) ? "AVG" : "LOWER";

      // Verification state proportionate to branch
      let verificationStatus = "VERIFIED";
      let profileLocked = true;
      let declarationAccepted = true;
      let isDismissed = false;
      let dismissalReason = null;

      if (i < bCfg.verified) {
        verificationStatus = "VERIFIED";
        profileLocked = true;
        declarationAccepted = true;
      } else if (i < bCfg.verified + bCfg.pending) {
        verificationStatus = "PENDING";
        profileLocked = true;
        declarationAccepted = true;
      } else if (i < bCfg.verified + bCfg.pending + bCfg.rejected) {
        verificationStatus = "REJECTED";
        profileLocked = true;
        declarationAccepted = true;
        dismissalReason = "Academic marks mismatch with official GTU grade card";
      } else {
        verificationStatus = "PENDING";
        profileLocked = false;
        declarationAccepted = false;
      }

      // 4 controlled dismissal cases for edge-case testing
      if (studentCounter === 45) {
        isDismissed = true;
        dismissalReason = "Declined accepted offer post campus selection";
      } else if (studentCounter === 115) {
        isDismissed = true;
        dismissalReason = "Non-attendance in mandatory final interview round";
      } else if (studentCounter === 210) {
        isDismissed = true;
        dismissalReason = "Misconduct during campus placement presentation";
      } else if (studentCounter === 310) {
        isDismissed = true;
        dismissalReason = "Falsified diploma certificate submission";
      }

      rawStudentDefinitions.push({
        idNum: studentCounter,
        email,
        fullName,
        phone: `98${String(10000000 + studentCounter * 2381).slice(0, 8)}`,
        dob: new Date(2002 + (studentCounter % 3), (studentCounter * 2) % 12, 1 + (studentCounter % 27)),
        branch: bCfg.branch,
        studentType: isD2D ? "D2D" : "REGULAR",
        perfTier,
        verificationStatus,
        profileLocked,
        declarationAccepted,
        isDismissed,
        dismissalReason,
      });

      studentCounter++;
    }
  }

  // ==========================================
  // 5. INSERT USERS & STUDENTS INTO DATABASE
  // ==========================================
  console.log("Inserting 330 students and generating academic records...");

  const createdStudents = [];
  const allSpiRecords = [];

  for (const def of rawStudentDefinitions) {
    // 10th Marks
    let baseTenth = def.perfTier === "HIGH" ? 88 : def.perfTier === "AVG" ? 76 : 62;
    const mathsMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-5, 6))));
    const scienceMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-6, 5))));
    const englishMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-4, 5))));
    const socialScienceMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-7, 4))));
    const sanskritMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-5, 5))));
    const gujaratiMarks = Math.min(100, Math.max(50, roundTwo(baseTenth + randomInRange(-6, 6))));
    const tenthPercentage = calculateTenthPercentage({
      mathsMarks,
      scienceMarks,
      englishMarks,
      socialScienceMarks,
      sanskritMarks,
      gujaratiMarks,
    });

    // 12th Marks (REGULAR ONLY)
    let twelfthEnglishMarks = null;
    let twelfthPhysicsMarks = null;
    let twelfthMathsMarks = null;
    let twelfthChemistryMarks = null;
    let twelfthComputerMarks = null;
    let twelfthPercentage = null;

    if (def.studentType === "REGULAR") {
      let base12th = def.perfTier === "HIGH" ? 86 : def.perfTier === "AVG" ? 74 : 60;
      twelfthEnglishMarks = Math.min(100, Math.max(45, roundTwo(base12th + randomInRange(-5, 5))));
      twelfthPhysicsMarks = Math.min(100, Math.max(45, roundTwo(base12th + randomInRange(-7, 6))));
      twelfthMathsMarks = Math.min(100, Math.max(45, roundTwo(base12th + randomInRange(-6, 8))));
      twelfthChemistryMarks = Math.min(100, Math.max(45, roundTwo(base12th + randomInRange(-8, 5))));
      twelfthComputerMarks = Math.min(100, Math.max(45, roundTwo(base12th + randomInRange(-4, 7))));
      twelfthPercentage = calculateTwelfthPercentage({
        twelfthEnglishMarks,
        twelfthPhysicsMarks,
        twelfthMathsMarks,
        twelfthChemistryMarks,
        twelfthComputerMarks,
      });
    }

    // D2D fields (D2D ONLY)
    let d2dCgpa = null;
    let d2dCollege = null;
    let d2dDetails = null;
    let d2dAcpcRank = null;

    if (def.studentType === "D2D") {
      d2dCgpa = def.perfTier === "HIGH"
        ? roundTwo(randomInRange(8.6, 9.6))
        : def.perfTier === "AVG"
        ? roundTwo(randomInRange(7.4, 8.5))
        : roundTwo(randomInRange(6.5, 7.3));
      d2dCollege = POLYTECHNIC_COLLEGES[def.idNum % POLYTECHNIC_COLLEGES.length];
      d2dDetails = `Diploma in ${def.branch} Engineering`;
      d2dAcpcRank = randomInt(80, 850);
    }

    // Upsert User
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {
        passwordHash: studentDefaultPasswordHash,
        role: "STUDENT",
        authProvider: "LOCAL",
      },
      create: {
        email: def.email,
        passwordHash: studentDefaultPasswordHash,
        role: "STUDENT",
        authProvider: "LOCAL",
      },
    });

    // Create Student record
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: def.fullName,
        phone: def.phone,
        dob: def.dob,
        branch: def.branch,
        studentType: def.studentType,
        mathsMarks,
        scienceMarks,
        englishMarks,
        socialScienceMarks,
        sanskritMarks,
        gujaratiMarks,
        tenthPercentage,
        twelfthEnglishMarks,
        twelfthPhysicsMarks,
        twelfthMathsMarks,
        twelfthChemistryMarks,
        twelfthComputerMarks,
        twelfthPercentage,
        d2dCgpa,
        d2dCollege,
        d2dDetails,
        d2dAcpcRank,
        profileLocked: def.profileLocked,
        verificationStatus: def.verificationStatus,
        declarationAccepted: def.declarationAccepted,
        isPlaced: false,
        currentPackageLpa: null,
        isDismissed: def.isDismissed,
        dismissalReason: def.dismissalReason,
      },
    });

    // Generate 6 Semesters SPI records (1 to 6)
    let baseSpi = def.perfTier === "HIGH" ? 8.9 : def.perfTier === "AVG" ? 7.6 : 6.4;
    const studentSpis = [];

    for (let sem = 1; sem <= 6; sem++) {
      const drift = (sem - 3) * 0.08 + randomInRange(-0.35, 0.35);
      const semSpi = Math.min(10.0, Math.max(5.5, roundTwo(baseSpi + drift)));
      studentSpis.push({
        studentId: student.id,
        semester: sem,
        spi: semSpi,
      });
    }

    allSpiRecords.push(...studentSpis);

    createdStudents.push({
      ...student,
      user: { email: user.email },
      semesterSpis: studentSpis,
      cpi: calculateCpi(studentSpis),
      cgpa: calculateCgpa(studentSpis),
    });
  }

  // Bulk insert all 1,980 SPI records
  console.log(`Inserting ${allSpiRecords.length} semester SPI records...`);
  await prisma.semesterSpi.createMany({
    data: allSpiRecords,
  });

  // ==========================================
  // 6. SEED 18 COMPANIES
  // ==========================================
  console.log("\nSeeding 18 companies across 4 tiers...");

  const companyData = [
    // Tier 1 / Super Dream
    { name: "Google Cloud", imageUrl: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&q=80" },
    { name: "Microsoft IDC", imageUrl: "https://images.unsplash.com/photo-1583321500900-828764eb92a3?w=128&q=80" },
    { name: "Amazon AWS", imageUrl: "https://images.unsplash.com/photo-1523474253246-73be9cb4225d?w=128&q=80" },
    { name: "Oracle", imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&q=80" },

    // Tier 2 / Dream
    { name: "Cisco", imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=128&q=80" },
    { name: "Barclays", imageUrl: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&q=80" },
    { name: "Tata Digital", imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80" },
    { name: "Juspay", imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&q=80" },
    { name: "InfoEdge", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&q=80" },

    // Core Engineering
    { name: "Larsen & Toubro", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=128&q=80" },
    { name: "Reliance Industries", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&q=80" },
    { name: "Adani Green", imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=128&q=80" },
    { name: "Tata Motors", imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=128&q=80" },
    { name: "Atul Chemicals", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=128&q=80" },

    // Mass Recruiters / IT Services
    { name: "TCS", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&q=80" },
    { name: "Infosys", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=128&q=80" },
    { name: "Capgemini", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=128&q=80" },
    { name: "Cognizant", imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=128&q=80" },
  ];

  const companyMap = new Map();
  for (const c of companyData) {
    const comp = await prisma.company.create({
      data: c,
    });
    companyMap.set(c.name, comp);
    console.log(`   + Company: ${c.name}`);
  }

  // ==========================================
  // 7. SEED 24 RECRUITMENT DRIVES
  // ==========================================
  console.log("\nSeeding 24 recruitment drives with diverse eligibility...");

  const now = new Date();
  const pastDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const futureDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const driveConfigs = [
    // 10 CLOSED DRIVES (Selections and full lifecycles will be created on these)
    {
      company: "Microsoft IDC",
      role: "Software Development Engineer",
      ctc: 18.0,
      ctcMax: 22.0,
      location: "Hyderabad / Bengaluru",
      branches: ["CE", "IT", "AIML"],
      studentType: "ALL",
      min10th: 75.0,
      min12th: 75.0,
      minCgpa: 8.0,
      minCpi: 8.0,
      status: "CLOSED",
      deadline: pastDays(15),
      targetSelected: 4,
    },
    {
      company: "Google Cloud",
      role: "Cloud Solutions Engineer",
      ctc: 24.0,
      ctcMax: 28.0,
      location: "Bengaluru / Hyderabad",
      branches: ["CE", "IT", "AIML", "EC"],
      studentType: "REGULAR",
      min10th: 80.0,
      min12th: 80.0,
      minCgpa: 8.5,
      minCpi: 8.5,
      status: "CLOSED",
      deadline: pastDays(25),
      targetSelected: 3,
    },
    {
      company: "Oracle",
      role: "Applications Developer",
      ctc: 16.5,
      ctcMax: 18.5,
      location: "Bengaluru",
      branches: ["CE", "IT", "AIML", "IC"],
      studentType: "ALL",
      min10th: 70.0,
      min12th: 70.0,
      minCgpa: 7.5,
      minCpi: 7.5,
      status: "CLOSED",
      deadline: pastDays(20),
      targetSelected: 4,
    },
    {
      company: "Cisco",
      role: "Network Software Engineer",
      ctc: 14.0,
      ctcMax: 16.0,
      location: "Bengaluru",
      branches: ["CE", "IT", "AIML", "EC", "EE", "IC", "ROBOTICS"],
      studentType: "ALL",
      min10th: 70.0,
      min12th: 70.0,
      minCgpa: 7.5,
      minCpi: 7.5,
      status: "CLOSED",
      deadline: pastDays(18),
      targetSelected: 4,
    },
    {
      company: "Barclays",
      role: "Graduate Technical Analyst",
      ctc: 12.5,
      ctcMax: 14.5,
      location: "Pune",
      branches: ["CE", "IT", "AIML", "EC"],
      studentType: "ALL",
      min10th: 65.0,
      min12th: 65.0,
      minCgpa: 7.0,
      minCpi: 7.0,
      status: "CLOSED",
      deadline: pastDays(12),
      targetSelected: 4,
    },
    {
      company: "InfoEdge",
      role: "Associate Software Engineer",
      ctc: 9.5,
      ctcMax: 11.5,
      location: "Noida",
      branches: ["CE", "IT", "AIML"],
      studentType: "ALL",
      min10th: 65.0,
      min12th: 65.0,
      minCgpa: 6.8,
      minCpi: 6.8,
      status: "CLOSED",
      deadline: pastDays(16),
      targetSelected: 4,
    },
    {
      company: "Larsen & Toubro",
      role: "Graduate Engineer Trainee (Core)",
      ctc: 7.5,
      ctcMax: 8.5,
      location: "Vadodara / Mumbai",
      branches: ["MECHANICAL", "CIVIL", "EE", "CHEMICAL", "ROBOTICS"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "CLOSED",
      deadline: pastDays(22),
      targetSelected: 8,
    },
    {
      company: "Reliance Industries",
      role: "GET - Process & Operations",
      ctc: 8.0,
      ctcMax: 9.5,
      location: "Jamnagar / Dahej",
      branches: ["CHEMICAL", "MECHANICAL", "EE", "IC", "ENVIRONMENTAL", "PLASTIC", "RUBBER"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "CLOSED",
      deadline: pastDays(24),
      targetSelected: 7,
    },
    {
      company: "Tata Motors",
      role: "Graduate Engineer Trainee - Automotive",
      ctc: 8.5,
      ctcMax: 9.5,
      location: "Sanand / Pune",
      branches: ["MECHANICAL", "AUTOMOBILE", "ROBOTICS", "EE"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "CLOSED",
      deadline: pastDays(14),
      targetSelected: 6,
    },
    {
      company: "Atul Chemicals",
      role: "Process Safety & Operations Engineer",
      ctc: 6.5,
      ctcMax: 7.5,
      location: "Valsad / Ankleshwar",
      branches: ["CHEMICAL", "ENVIRONMENTAL", "PLASTIC", "RUBBER"],
      studentType: "ALL",
      min10th: 55.0,
      min12th: 55.0,
      minCgpa: 6.0,
      minCpi: 6.0,
      status: "CLOSED",
      deadline: pastDays(19),
      targetSelected: 4,
    },

    // 10 ACTIVE DRIVES (Open registration, ongoing shortlisting, no selections yet)
    {
      company: "Amazon AWS",
      role: "Systems Development Engineer",
      ctc: 20.0,
      ctcMax: 24.0,
      location: "Hyderabad",
      branches: ["CE", "IT", "AIML", "EC", "EE"],
      studentType: "ALL",
      min10th: 75.0,
      min12th: 75.0,
      minCgpa: 8.0,
      minCpi: 8.0,
      status: "ACTIVE",
      deadline: futureDays(8),
    },
    {
      company: "Tata Digital",
      role: "Frontend / Backend Engineer",
      ctc: 11.0,
      ctcMax: 13.0,
      location: "Mumbai",
      branches: ["CE", "IT", "AIML"],
      studentType: "ALL",
      min10th: 65.0,
      min12th: 65.0,
      minCgpa: 7.0,
      minCpi: 7.0,
      status: "ACTIVE",
      deadline: futureDays(10),
    },
    {
      company: "Juspay",
      role: "Full Stack Engineer",
      ctc: 15.0,
      ctcMax: 17.0,
      location: "Bengaluru",
      branches: ["CE", "IT", "AIML", "EC", "EE"],
      studentType: "REGULAR",
      min10th: 75.0,
      min12th: 75.0,
      minCgpa: 7.8,
      minCpi: 7.8,
      status: "ACTIVE",
      deadline: futureDays(12),
    },
    {
      company: "Adani Green",
      role: "GET - Renewable Energy Systems",
      ctc: 7.0,
      ctcMax: 8.0,
      location: "Ahmedabad / Khavda",
      branches: ["EE", "EC", "MECHANICAL", "CIVIL", "ENVIRONMENTAL"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "ACTIVE",
      deadline: futureDays(7),
    },
    {
      company: "TCS",
      role: "Digital Specialist Trainee",
      ctc: 7.0,
      ctcMax: 9.0,
      location: "Gandhinagar / Pune",
      branches: ["CE", "IT", "AIML", "EC", "EE", "IC", "ROBOTICS"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "ACTIVE",
      deadline: futureDays(15),
    },
    {
      company: "TCS",
      role: "Ninja Graduate Trainee",
      ctc: 3.8,
      ctcMax: 4.2,
      location: "Pan-India",
      branches: [], // All branches
      studentType: "ALL",
      min10th: 55.0,
      min12th: 55.0,
      minCgpa: 6.0,
      minCpi: 6.0,
      status: "ACTIVE",
      deadline: futureDays(14),
    },
    {
      company: "Infosys",
      role: "Specialist Programmer",
      ctc: 9.5,
      ctcMax: 10.5,
      location: "Bengaluru / Pune",
      branches: ["CE", "IT", "AIML", "EC", "EE"],
      studentType: "ALL",
      min10th: 65.0,
      min12th: 65.0,
      minCgpa: 7.0,
      minCpi: 7.0,
      status: "ACTIVE",
      deadline: futureDays(9),
    },
    {
      company: "Infosys",
      role: "Systems Engineer",
      ctc: 4.0,
      ctcMax: 4.5,
      location: "Pan-India",
      branches: [], // All branches
      studentType: "ALL",
      min10th: 55.0,
      min12th: 55.0,
      minCgpa: 6.0,
      minCpi: 6.0,
      status: "ACTIVE",
      deadline: futureDays(11),
    },
    {
      company: "Capgemini",
      role: "Senior Analyst Trainee",
      ctc: 6.5,
      ctcMax: 7.5,
      location: "Mumbai / Pune",
      branches: ["CE", "IT", "AIML", "EC", "EE", "IC"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.0,
      minCpi: 6.0,
      status: "ACTIVE",
      deadline: futureDays(6),
    },
    {
      company: "Cognizant",
      role: "GenC Elevate Trainee",
      ctc: 5.5,
      ctcMax: 6.0,
      location: "Chennai / Pune",
      branches: [], // All branches
      studentType: "ALL",
      min10th: 55.0,
      min12th: 55.0,
      minCgpa: 6.0,
      minCpi: 6.0,
      status: "ACTIVE",
      deadline: futureDays(13),
    },

    // 4 UPCOMING / DRAFT DRIVES (Status ACTIVE, deadline 30-50 days out, 0 applications)
    {
      company: "Google Cloud",
      role: "Site Reliability Engineer Trainee",
      ctc: 22.0,
      ctcMax: 26.0,
      location: "Bengaluru",
      branches: ["CE", "IT", "AIML"],
      studentType: "ALL",
      min10th: 75.0,
      min12th: 75.0,
      minCgpa: 8.0,
      minCpi: 8.0,
      status: "ACTIVE",
      deadline: futureDays(30),
      isUpcomingDraft: true,
    },
    {
      company: "Larsen & Toubro",
      role: "Smart World & Communications Engineer",
      ctc: 8.0,
      ctcMax: 9.0,
      location: "Chennai / Mumbai",
      branches: ["CE", "IT", "AIML", "EC", "EE", "IC"],
      studentType: "ALL",
      min10th: 65.0,
      min12th: 65.0,
      minCgpa: 6.8,
      minCpi: 6.8,
      status: "ACTIVE",
      deadline: futureDays(35),
      isUpcomingDraft: true,
    },
    {
      company: "Adani Green",
      role: "Project Engineer Trainee",
      ctc: 7.2,
      ctcMax: 8.2,
      location: "Ahmedabad",
      branches: ["MECHANICAL", "EE", "CIVIL"],
      studentType: "ALL",
      min10th: 60.0,
      min12th: 60.0,
      minCgpa: 6.5,
      minCpi: 6.5,
      status: "ACTIVE",
      deadline: futureDays(40),
      isUpcomingDraft: true,
    },
    {
      company: "Cisco",
      role: "Cyber Security Analyst",
      ctc: 15.0,
      ctcMax: 17.5,
      location: "Bengaluru",
      branches: ["CE", "IT", "AIML", "EC"],
      studentType: "ALL",
      min10th: 70.0,
      min12th: 70.0,
      minCgpa: 7.5,
      minCpi: 7.5,
      status: "ACTIVE",
      deadline: futureDays(45),
      isUpcomingDraft: true,
    },
  ];

  const createdDrives = [];
  for (const dCfg of driveConfigs) {
    const company = companyMap.get(dCfg.company);
    const drive = await prisma.recruitmentDrive.create({
      data: {
        companyId: company.id,
        role: dCfg.role,
        description: `Campus recruitment drive for ${dCfg.role} at ${dCfg.company}. Candidates should have strong fundamentals and passion for excellence.`,
        ctc: dCfg.ctc,
        ctcMax: dCfg.ctcMax,
        location: dCfg.location,
        minTenthPercentage: dCfg.min10th,
        minTwelfthPercentage: dCfg.min12th,
        minCgpa: dCfg.minCgpa,
        minCpi: dCfg.minCpi,
        allowedStudentType: dCfg.studentType,
        allowedBranches: dCfg.branches,
        backlogsAllowed: false,
        applicationDeadline: dCfg.deadline,
        status: dCfg.status,
        maxSelectionsPerStudent: 1,
        tpoAllowMultiple: false,
        roundDetails: {
          rounds: [
            { name: "Online Aptitude & Coding Test", venue: "Computer Center / Online" },
            { name: "Technical Interview Round 1", venue: "T&P Cell Conference Hall" },
            { name: "HR & Leadership Discussion", venue: "T&P Cell Committee Room" },
          ],
        },
      },
    });

    createdDrives.push({
      ...drive,
      companyName: dCfg.company,
      targetSelected: dCfg.targetSelected || 0,
      isUpcomingDraft: !!dCfg.isUpcomingDraft,
    });
    console.log(`   + Drive: ${dCfg.company} - ${dCfg.role} (${dCfg.status})`);
  }

  // ==========================================
  // 8. GENERATE ELIGIBILITY-AWARE APPLICATIONS (~450)
  // Target:
  // SELECTED: 48
  // SHORTLISTED: ~120
  // REJECTED: ~102
  // APPLIED: ~180
  // Total: 450
  // ==========================================
  console.log("\nGenerating ~450 relationship-aware applications based on authoritative eligibility...");

  const eligibleCandidatePool = createdStudents.filter(
    (s) => s.verificationStatus === "VERIFIED" && s.profileLocked && !s.isDismissed
  );

  const closedDrives = createdDrives.filter((d) => d.status === "CLOSED");
  const activeDrives = createdDrives.filter((d) => d.status === "ACTIVE" && !d.isUpcomingDraft);

  const selectedStudentIds = new Set();
  const studentSelectedPackageMap = new Map();
  const applicationRecords = [];
  const appliedPairSet = new Set();

  const sampleResumeUrl = "https://res.cloudinary.com/placement-portal/raw/upload/v1/resumes/sample_student_resume.pdf";

  // Phase A: Select exactly 48 students across the 10 Closed Drives
  for (const drive of closedDrives) {
    const targetCount = drive.targetSelected;
    let selectedForDrive = 0;

    for (const student of eligibleCandidatePool) {
      if (selectedForDrive >= targetCount) break;
      if (selectedStudentIds.has(student.id)) continue;

      const eligibility = checkStudentEligibility(student, drive);
      if (eligibility.eligible) {
        selectedStudentIds.add(student.id);
        selectedForDrive++;

        const offerPackage = drive.ctcMax ? (drive.ctc + drive.ctcMax) / 2 : drive.ctc;
        studentSelectedPackageMap.set(student.id, offerPackage);

        appliedPairSet.add(`${student.id}_${drive.id}`);
        applicationRecords.push({
          studentId: student.id,
          driveId: drive.id,
          status: "SELECTED",
          resumeUrl: sampleResumeUrl,
          termsAccepted: true,
          attendanceMarked: true,
          isPresent: true,
          appliedAt: new Date(drive.applicationDeadline.getTime() - 5 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  console.log(`   Selected applications staged: ${applicationRecords.length} (Target: 48)`);

  // Target counts to reach ~450 total:
  // SELECTED: 48 (already staged)
  // SHORTLISTED: 120 (45 on closed, 75 on active)
  // REJECTED: 102 (75 on closed, 27 on active)
  // APPLIED: 180 (all 180 on active)
  let shortlistedCount = 0;
  let rejectedCount = 0;
  let appliedCount = 0;

  // Phase B: Complete lifecycle on Closed Drives (SHORTLISTED & REJECTED)
  for (const drive of closedDrives) {
    for (const student of eligibleCandidatePool) {
      if (shortlistedCount >= 45 && rejectedCount >= 75) break;

      const pairKey = `${student.id}_${drive.id}`;
      if (appliedPairSet.has(pairKey)) continue;

      const existingPkg = studentSelectedPackageMap.get(student.id);
      const studentProxy = existingPkg
        ? { ...student, isPlaced: true, currentPackageLpa: existingPkg }
        : student;

      const eligibility = checkStudentEligibility(studentProxy, drive);
      if (!eligibility.eligible) continue;

      const hashVal = (student.user.email.length * 37 + drive.role.length * 19 + applicationRecords.length) % 10;
      if (hashVal < 4 && shortlistedCount < 45) {
        appliedPairSet.add(pairKey);
        shortlistedCount++;
        applicationRecords.push({
          studentId: student.id,
          driveId: drive.id,
          status: "SHORTLISTED",
          resumeUrl: sampleResumeUrl,
          termsAccepted: true,
          attendanceMarked: true,
          isPresent: true,
          appliedAt: new Date(drive.applicationDeadline.getTime() - 6 * 24 * 60 * 60 * 1000),
        });
      } else if (rejectedCount < 75) {
        appliedPairSet.add(pairKey);
        rejectedCount++;
        applicationRecords.push({
          studentId: student.id,
          driveId: drive.id,
          status: "REJECTED",
          resumeUrl: sampleResumeUrl,
          termsAccepted: true,
          attendanceMarked: true,
          isPresent: hashVal !== 8,
          appliedAt: new Date(drive.applicationDeadline.getTime() - 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Phase C: Applications on ACTIVE Drives (SHORTLISTED, REJECTED, APPLIED)
  for (const drive of activeDrives) {
    for (const student of eligibleCandidatePool) {
      if (applicationRecords.length >= 450) break;

      const pairKey = `${student.id}_${drive.id}`;
      if (appliedPairSet.has(pairKey)) continue;

      const existingPkg = studentSelectedPackageMap.get(student.id);
      const studentProxy = existingPkg
        ? { ...student, isPlaced: true, currentPackageLpa: existingPkg }
        : student;

      const eligibility = checkStudentEligibility(studentProxy, drive);
      if (!eligibility.eligible) continue;

      const appHash = (student.fullName.length * 29 + drive.id.length * 13 + applicationRecords.length) % 10;

      let status = "APPLIED";
      let attendanceMarked = false;
      let isPresent = null;

      if (shortlistedCount < 120 && appHash < 4) {
        status = "SHORTLISTED";
        attendanceMarked = true;
        isPresent = true;
        shortlistedCount++;
      } else if (rejectedCount < 102 && appHash === 9) {
        status = "REJECTED";
        attendanceMarked = true;
        isPresent = false;
        rejectedCount++;
      } else {
        status = "APPLIED";
        appliedCount++;
      }

      appliedPairSet.add(pairKey);
      applicationRecords.push({
        studentId: student.id,
        driveId: drive.id,
        status,
        resumeUrl: sampleResumeUrl,
        termsAccepted: true,
        attendanceMarked,
        isPresent,
        appliedAt: new Date(now.getTime() - randomInt(1, 10) * 24 * 60 * 60 * 1000),
      });
    }
  }

  console.log(`Inserting ${applicationRecords.length} application records...`);
  await prisma.application.createMany({
    data: applicationRecords,
  });

  // Phase D: Update placed student flags & packages
  console.log("Updating placed student statuses...");
  for (const [studentId, pkg] of studentSelectedPackageMap.entries()) {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        isPlaced: true,
        currentPackageLpa: pkg,
      },
    });
  }

  // ==========================================
  // 9. SEED 12 ANNOUNCEMENTS
  // ==========================================
  console.log("\nSeeding 12 placement announcements...");

  const adminTpo = tpoUsers[0];
  const announcementsData = [
    {
      title: "Placement Season 2026-27 Kickoff & Instructions",
      body: "Welcome to the LDCE Campus Placement Season 2026-27. All final year students are requested to ensure their academic profile is locked and verified. Strict adherence to placement policy is mandatory.",
      createdAt: pastDays(30),
      sentById: adminTpo.id,
    },
    {
      title: "Microsoft IDC - Campus Recruitment Drive Registration Closed",
      body: "Registrations for Microsoft IDC Software Development Engineer role are officially closed. Shortlisted candidates must report to Computer Center at 9:00 AM sharp with college ID card.",
      createdAt: pastDays(17),
      sentById: tpoUsers[1].id,
      driveId: createdDrives[0].id,
    },
    {
      title: "Google Cloud - Shortlisted Candidates for Technical Rounds",
      body: "Congratulations to all students shortlisted for Google Cloud Technical Interviews. The interview link has been sent to your registered LDCE email address. Keep your resume and ID card ready.",
      createdAt: pastDays(24),
      sentById: tpoUsers[1].id,
      driveId: createdDrives[1].id,
    },
    {
      title: "Larsen & Toubro - Core Engineering Drive Results",
      body: "Larsen & Toubro has concluded its campus recruitment drive for Mechanical, Civil, EE and Chemical branches. 8 students have been selected. Congratulations to all selected candidates!",
      createdAt: pastDays(21),
      sentById: tpoUsers[3].id,
      driveId: createdDrives[6].id,
    },
    {
      title: "Mandatory Profile Verification Notice",
      body: "Departmental TPOs are currently clearing the pending student verification queue. If your profile shows discrepancies, please contact your respective branch coordinator immediately.",
      createdAt: pastDays(15),
      sentById: adminTpo.id,
    },
    {
      title: "Amazon AWS - Online Assessment Scheduled",
      body: "Online coding assessment for Amazon AWS SDE role is scheduled for this coming Saturday at 10:00 AM. Ensure uninterrupted internet connectivity and webcam access.",
      createdAt: pastDays(5),
      sentById: tpoUsers[1].id,
      driveId: createdDrives[10].id,
    },
    {
      title: "Reliance Industries - Selection Notification & Offer Letters",
      body: "Reliance Industries has released the final selection list for GET Process & Operations. Selected candidates must acknowledge their acceptance within 48 hours.",
      createdAt: pastDays(22),
      sentById: tpoUsers[4].id,
      driveId: createdDrives[7].id,
    },
    {
      title: "Cisco Systems - Shortlist & Interview Venue Announcement",
      body: "Shortlisted candidates for Cisco Network Software Engineer role must report to Block-5, Seminar Hall-2 on Friday at 8:30 AM in formal attire.",
      createdAt: pastDays(16),
      sentById: tpoUsers[2].id,
      driveId: createdDrives[3].id,
    },
    {
      title: "TCS National Qualifier Test (NQT) - Upcoming Schedule",
      body: "TCS Digital and Ninja recruitment drives are actively accepting applications. Students must register on the TCS NextStep portal and update their application reference number.",
      createdAt: pastDays(4),
      sentById: adminTpo.id,
      driveId: createdDrives[14].id,
    },
    {
      title: "Pre-Placement Talk (PPT) by Adani Green",
      body: "Adani Green Renewable Energy Systems will conduct a virtual Pre-Placement Talk for Electrical, Mechanical, Civil and Environmental students this Thursday at 4:00 PM.",
      createdAt: pastDays(3),
      sentById: tpoUsers[3].id,
      driveId: createdDrives[13].id,
    },
    {
      title: "Resume Formatting & Portfolio Guidelines from T&P Cell",
      body: "Please make sure your uploaded resume PDF follows standard single-page or two-page format without graphical rating bars. Emphasize capstone projects and internship experience.",
      createdAt: pastDays(20),
      sentById: adminTpo.id,
    },
    {
      title: "Upcoming Drive Alert: Google Cloud SRE & Cisco Cyber Security",
      body: "Two marquee drives from Google Cloud (SRE) and Cisco (Cyber Security) are scheduled for next month. Eligibility criteria and syllabus have been published on the portal.",
      createdAt: pastDays(1),
      sentById: adminTpo.id,
    },
  ];

  for (const ann of announcementsData) {
    await prisma.announcement.create({
      data: ann,
    });
  }

  // ==========================================
  // 10. RUN POST-SEED VALIDATION & REPORT
  // ==========================================
  const [
    finalTpoCount,
    finalStudentCount,
    finalCompanyCount,
    finalDriveCount,
    activeDriveCount,
    closedDriveCount,
    finalAppCount,
    selectedAppCount,
    finalSpiCount,
    finalAnnouncementCount,
    placedStudentCount,
    regularStudentCount,
    d2dStudentCount,
    verifiedStudentCount,
    pendingStudentCount,
    rejectedStudentCount,
    unlockedStudentCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CENTRAL_TPO" } }),
    prisma.student.count(),
    prisma.company.count(),
    prisma.recruitmentDrive.count(),
    prisma.recruitmentDrive.count({ where: { status: "ACTIVE" } }),
    prisma.recruitmentDrive.count({ where: { status: "CLOSED" } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "SELECTED" } }),
    prisma.semesterSpi.count(),
    prisma.announcement.count(),
    prisma.student.count({ where: { isPlaced: true } }),
    prisma.student.count({ where: { studentType: "REGULAR" } }),
    prisma.student.count({ where: { studentType: "D2D" } }),
    prisma.student.count({ where: { verificationStatus: "VERIFIED", profileLocked: true } }),
    prisma.student.count({ where: { verificationStatus: "PENDING", profileLocked: true } }),
    prisma.student.count({ where: { verificationStatus: "REJECTED", profileLocked: true } }),
    prisma.student.count({ where: { profileLocked: false } }),
  ]);

  const appsByStatus = await prisma.application.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const studentsByBranch = await prisma.student.groupBy({
    by: ["branch"],
    _count: { id: true },
  });

  console.log("\n========================================");
  console.log("PLACEMENT PORTAL SEED COMPLETE");
  console.log("========================================");
  console.log(`TPO Accounts:       ${finalTpoCount}`);
  console.log(`Students:           ${finalStudentCount}`);
  console.log(`Companies:          ${finalCompanyCount}`);
  console.log(`Drives:             ${finalDriveCount}`);
  console.log(`Active Drives:      ${activeDriveCount} (10 Ongoing + 4 Upcoming/Draft)`);
  console.log(`Closed Drives:      ${closedDriveCount}`);
  console.log(`Upcoming/Draft:     4`);
  console.log(`Applications:       ${finalAppCount}`);
  console.log(`Selected:           ${selectedAppCount}`);
  console.log(`Placed Students:    ${placedStudentCount}`);
  console.log(`SPI Records:        ${finalSpiCount}`);
  console.log(`Announcements:      ${finalAnnouncementCount}`);
  console.log("----------------------------------------");
  console.log("STUDENT BREAKDOWN:");
  console.log(`  Regular:          ${regularStudentCount} (~81.8%)`);
  console.log(`  D2D:              ${d2dStudentCount} (~18.2%)`);
  console.log(`  Verified/Locked:  ${verifiedStudentCount} (~69.7%)`);
  console.log(`  Pending/Locked:   ${pendingStudentCount} (~20.0%)`);
  console.log(`  Rejected/Locked:  ${rejectedStudentCount} (~5.2%)`);
  console.log(`  Draft/Unlocked:   ${unlockedStudentCount} (~5.2%)`);
  console.log("----------------------------------------");
  console.log("APPLICATION STATUSES:");
  for (const s of appsByStatus) {
    console.log(`  ${s.status.padEnd(14)}: ${s._count.id}`);
  }
  console.log("----------------------------------------");
  console.log("BRANCH TOTALS:");
  for (const b of studentsByBranch.sort((x, y) => x.branch.localeCompare(y.branch))) {
    console.log(`  ${b.branch.padEnd(14)}: ${b._count.id}`);
  }
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("[ERROR] Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
