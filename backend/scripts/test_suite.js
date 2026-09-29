/**
 * Comprehensive Automated Test Suite for Mini Placement Portal Backend
 * Tests all endpoints, role security, business rules, Cloudinary upload, and eligibility engine.
 */

const BASE_URL = "http://localhost:5000/api";

let testsPassed = 0;
let testsFailed = 0;
const results = [];

async function assertTest(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    const duration = Date.now() - start;
    testsPassed++;
    results.push({ name, status: "PASSED", duration: `${duration}ms`, detail });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    testsFailed++;
    results.push({
      name,
      status: "FAILED",
      duration: `${duration}ms`,
      error: error.message,
    });
    console.error(`[FAIL] ${name} (${duration}ms) - ${error.message}`);
  }
}

async function runAllTests() {
  console.log("=================================================");
  console.log("Mini Placement Portal - Automated Test Suite");
  console.log("=================================================");

  const timestamp = Date.now();
  const regularEmail = `student.reg.${timestamp}@example.com`;
  const d2dEmail = `student.d2d.${timestamp}@example.com`;
  const ineligibleEmail = `student.ineligible.${timestamp}@example.com`;
  const password = "TestPassword@123";

  let tpoToken = "";
  let regularStudentToken = "";
  let regularStudentId = "";
  let d2dStudentToken = "";
  let d2dStudentId = "";
  let ineligibleStudentToken = "";
  let companyId = "";
  let companyWithUploadId = "";
  let driveId = "";
  let applicationId = "";

  // ----------------------------------------------------
  // 1. HEALTH CHECK
  // ----------------------------------------------------
  await assertTest("1. GET /api/health - Health check endpoint", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Server healthy, status: ${res.status}`;
  });

  // ----------------------------------------------------
  // 2. AUTHENTICATION
  // ----------------------------------------------------
  await assertTest("2. POST /api/auth/register - Register REGULAR student", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: regularEmail,
        password,
        fullName: "Rahul Sharma",
        phone: "9876543210",
        dob: "2002-05-15",
        studentType: "REGULAR",
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    regularStudentId = data.data.studentId;
    return `Created student ID: ${regularStudentId}`;
  });

  await assertTest("3. POST /api/auth/register - Reject duplicate email (409)", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: regularEmail,
        password,
        fullName: "Rahul Duplicate",
        phone: "9876543210",
        dob: "2002-05-15",
        studentType: "REGULAR",
      }),
    });
    const data = await res.json();
    if (res.status !== 409 || data.success !== false) throw new Error(`Expected 409, got ${res.status}`);
    return "Duplicate email rejected with 409 Conflict";
  });

  await assertTest("4. POST /api/auth/register - Register D2D student", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: d2dEmail,
        password,
        fullName: "Amit Patel (D2D)",
        phone: "9876543211",
        dob: "2001-11-20",
        studentType: "D2D",
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    d2dStudentId = data.data.studentId;
    return `Created D2D student ID: ${d2dStudentId}`;
  });

  await assertTest("5. POST /api/auth/register - Register Low-marks student (for eligibility testing)", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ineligibleEmail,
        password,
        fullName: "Low Scorer Student",
        phone: "9876543212",
        dob: "2003-01-10",
        studentType: "REGULAR",
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return "Created low scorer student for eligibility tests";
  });

  await assertTest("6. POST /api/auth/login - Login REGULAR student", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regularEmail, password }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.data.token) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    regularStudentToken = data.data.token;
    return `Logged in, role: ${data.data.user.role}`;
  });

  await assertTest("7. POST /api/auth/login - Login D2D student", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: d2dEmail, password }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.data.token) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    d2dStudentToken = data.data.token;
    return "D2D student logged in";
  });

  await assertTest("8. POST /api/auth/login - Login Ineligible student", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ineligibleEmail, password }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.data.token) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    ineligibleStudentToken = data.data.token;
    return "Ineligible student logged in";
  });

  await assertTest("9. POST /api/auth/login - Login CENTRAL_TPO", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "tpo@example.com",
        password: "change-me-secure-password",
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.user.role !== "CENTRAL_TPO") throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    tpoToken = data.data.token;
    return "TPO authenticated successfully";
  });

  await assertTest("10. POST /api/auth/login - Reject invalid credentials (401)", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regularEmail, password: "WrongPassword" }),
    });
    const data = await res.json();
    if (res.status !== 401 || data.success !== false) throw new Error(`Expected 401, got ${res.status}`);
    return "Invalid password rejected with 401 Unauthorized";
  });

  // ----------------------------------------------------
  // 3. STUDENT PROFILE WORKFLOW & LOCKING
  // ----------------------------------------------------
  await assertTest("11. GET /api/students/me - Fetch own profile before lock", async () => {
    const res = await fetch(`${BASE_URL}/students/me`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.profileLocked !== false) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Profile retrieved, profileLocked: ${data.data.profileLocked}`;
  });

  await assertTest("12. POST /api/students/profile - Submit REGULAR profile (Locks profile)", async () => {
    const res = await fetch(`${BASE_URL}/students/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${regularStudentToken}`,
      },
      body: JSON.stringify({
        fullName: "Rahul Sharma",
        phone: "9876543210",
        dob: "2002-05-15",
        studentType: "REGULAR",
        tenthPercentage: 88.5,
        mathsMarks: 92,
        scienceMarks: 89,
        englishMarks: 85,
        socialScienceMarks: 86,
        otherMarks: 90,
        twelfthPercentage: 86.0,
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.profileLocked !== true) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Profile submitted & locked: 10th=${data.data.tenthPercentage}%, 12th=${data.data.twelfthPercentage}%`;
  });

  await assertTest("13. PUT /api/students/profile - Student edit locked profile rejected (403)", async () => {
    const res = await fetch(`${BASE_URL}/students/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${regularStudentToken}`,
      },
      body: JSON.stringify({
        fullName: "Rahul Sharma Hacked",
      }),
    });
    const data = await res.json();
    if (res.status !== 403 || data.success !== false) throw new Error(`Expected 403, got ${res.status}`);
    return "Locked profile update rejected with 403 Forbidden";
  });

  await assertTest("14. POST /api/students/profile - Submit D2D profile (with D2D CGPA, no 12th required)", async () => {
    const res = await fetch(`${BASE_URL}/students/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${d2dStudentToken}`,
      },
      body: JSON.stringify({
        fullName: "Amit Patel (D2D)",
        phone: "9876543211",
        dob: "2001-11-20",
        studentType: "D2D",
        tenthPercentage: 82.0,
        mathsMarks: 85,
        scienceMarks: 80,
        englishMarks: 78,
        socialScienceMarks: 82,
        otherMarks: 85,
        d2dCgpa: 8.9,
        d2dCollege: "Government Polytechnic",
        d2dDetails: "Diploma in Computer Engineering",
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.profileLocked !== true) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `D2D profile submitted & locked: 10th=${data.data.tenthPercentage}%, D2D CGPA=${data.data.d2dCgpa}`;
  });

  await assertTest("15. POST /api/students/profile - Submit Low-marks profile (Locks profile)", async () => {
    const res = await fetch(`${BASE_URL}/students/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ineligibleStudentToken}`,
      },
      body: JSON.stringify({
        fullName: "Low Scorer Student",
        phone: "9876543212",
        dob: "2003-01-10",
        studentType: "REGULAR",
        tenthPercentage: 55.0,
        mathsMarks: 50,
        scienceMarks: 52,
        englishMarks: 58,
        socialScienceMarks: 54,
        otherMarks: 60,
        twelfthPercentage: 52.0,
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.profileLocked !== true) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Low scorer profile submitted: 10th=${data.data.tenthPercentage}%, 12th=${data.data.twelfthPercentage}%`;
  });

  // ----------------------------------------------------
  // 4. TPO STUDENT MANAGEMENT & VERIFICATION
  // ----------------------------------------------------
  await assertTest("16. GET /api/tpo/students - TPO lists all students with filters", async () => {
    const res = await fetch(`${BASE_URL}/tpo/students?studentType=REGULAR`, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Retrieved ${data.data.length} student records`;
  });

  await assertTest("17. GET /api/tpo/students/:id - TPO gets single student details", async () => {
    const res = await fetch(`${BASE_URL}/tpo/students/${regularStudentId}`, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.id !== regularStudentId) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Student found: ${data.data.fullName}`;
  });

  await assertTest("18. PUT /api/tpo/students/:id - TPO edits locked student profile (TPO Override)", async () => {
    const res = await fetch(`${BASE_URL}/tpo/students/${regularStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({
        tenthPercentage: 89.0, // Corrected by TPO
      }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.tenthPercentage !== 89.0) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `TPO updated 10th percentage to ${data.data.tenthPercentage}%`;
  });

  await assertTest("19. PATCH /api/tpo/students/:id/verify - TPO verifies student details", async () => {
    const res = await fetch(`${BASE_URL}/tpo/students/${regularStudentId}/verify`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({ verificationStatus: "VERIFIED" }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.verificationStatus !== "VERIFIED") throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Student verification status set to: ${data.data.verificationStatus}`;
  });

  // ----------------------------------------------------
  // 5. COMPANIES & CLOUDINARY UPLOAD
  // ----------------------------------------------------
  await assertTest("20. POST /api/companies - TPO creates company with JSON", async () => {
    const res = await fetch(`${BASE_URL}/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({
        name: `Tech Corp ${timestamp}`,
        imageUrl: "https://example.com/logo.png",
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data.id) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    companyId = data.data.id;
    return `Company created ID: ${companyId}`;
  });

  await assertTest("21. POST /api/companies - TPO creates company with Cloudinary file upload (multipart/form-data)", async () => {
    const form = new FormData();
    form.append("name", `Cloudinary Upload Corp ${timestamp}`);
    const blob = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
    form.append("image", blob, "company_logo.png");

    const res = await fetch(`${BASE_URL}/companies`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tpoToken}` },
      body: form,
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data.imageUrl || !data.data.imageUrl.includes("cloudinary.com")) {
      throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    }
    companyWithUploadId = data.data.id;
    return `Company created with Cloudinary URL: ${data.data.imageUrl}`;
  });

  await assertTest("22. POST /api/upload/image - Standalone image upload to Cloudinary", async () => {
    const form = new FormData();
    const blob = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
    form.append("image", blob, "standalone.png");

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tpoToken}` },
      body: form,
    });
    const data = await res.json();
    if (res.status !== 200 || !data.data.url) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Uploaded URL: ${data.data.url}`;
  });

  await assertTest("23. GET /api/companies - List all companies", async () => {
    const res = await fetch(`${BASE_URL}/companies`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Found ${data.data.length} companies`;
  });

  await assertTest("24. GET /api/companies/:id - Get company by ID with recruitment drives", async () => {
    const res = await fetch(`${BASE_URL}/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.id !== companyId) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Company retrieved: ${data.data.name}`;
  });

  // ----------------------------------------------------
  // 6. RECRUITMENT DRIVES & ELIGIBILITY CRITERIA
  // ----------------------------------------------------
  await assertTest("25. POST /api/drives - TPO creates recruitment drive with full criteria", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const res = await fetch(`${BASE_URL}/drives`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({
        companyId,
        role: "Software Development Engineer",
        description: "Full stack engineering role across Node.js & React.",
        ctc: 12.0,
        location: "Bengaluru",
        applicationDeadline: futureDate.toISOString(),
        status: "ACTIVE",
        minTenthPercentage: 70.0,
        minTwelfthPercentage: 70.0,
        minCgpa: 7.5,
        allowedStudentType: "ALL",
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data.id) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    driveId = data.data.id;
    return `Drive created ID: ${driveId} for role: ${data.data.role} with CTC: ${data.data.ctc} LPA`;
  });

  await assertTest("26. GET /api/drives - List drives with company details", async () => {
    const res = await fetch(`${BASE_URL}/drives`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Retrieved ${data.data.length} drives`;
  });

  await assertTest("27. GET /api/drives/:id - Get drive details", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.id !== driveId) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Drive: ${data.data.role} @ ${data.data.company.name}`;
  });

  await assertTest("28. GET /api/drives/:id/eligible-students - TPO filters eligible students for drive", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}/eligible-students`, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Eligible students returned: ${data.data.length}`;
  });

  // ----------------------------------------------------
  // 7. APPLICATION & ELIGIBILITY ENGINE ENFORCEMENT
  // ----------------------------------------------------
  await assertTest("29. POST /api/drives/:driveId/apply - Ineligible student applying is rejected (403 with reasons)", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ineligibleStudentToken}`,
      },
    });
    const data = await res.json();
    if (res.status !== 403 || data.success !== false || !data.errors || data.errors.length === 0) {
      throw new Error(`Expected 403 with errors, got ${res.status}: ${JSON.stringify(data)}`);
    }
    return `Ineligible student application rejected with reasons: ${JSON.stringify(data.errors)}`;
  });

  await assertTest("30. POST /api/drives/:driveId/apply - Eligible REGULAR student applies successfully (201)", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${regularStudentToken}`,
      },
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data.id) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    applicationId = data.data.id;
    return `Application submitted ID: ${applicationId}, status: ${data.data.status}`;
  });

  await assertTest("31. POST /api/drives/:driveId/apply - Duplicate application rejected (409)", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${regularStudentToken}`,
      },
    });
    const data = await res.json();
    if (res.status !== 409 || data.success !== false) throw new Error(`Expected 409, got ${res.status}`);
    return "Duplicate application rejected with 409 Conflict";
  });

  await assertTest("32. POST /api/drives/:driveId/apply - Eligible D2D student applies successfully (201)", async () => {
    const res = await fetch(`${BASE_URL}/drives/${driveId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${d2dStudentToken}`,
      },
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data.id) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `D2D application submitted ID: ${data.data.id}`;
  });

  await assertTest("33. GET /api/students/applications - Student views own applications", async () => {
    const res = await fetch(`${BASE_URL}/students/applications`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Student has ${data.data.length} application(s)`;
  });

  await assertTest("34. GET /api/tpo/applications - TPO views all applications with filters", async () => {
    const res = await fetch(`${BASE_URL}/tpo/applications?status=APPLIED`, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data)) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `TPO retrieved ${data.data.length} applications`;
  });

  await assertTest("35. PATCH /api/applications/:id/status - TPO updates application status to SHORTLISTED", async () => {
    const res = await fetch(`${BASE_URL}/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({ status: "SHORTLISTED" }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.status !== "SHORTLISTED") throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    return `Application status updated to: ${data.data.status}`;
  });

  // ----------------------------------------------------
  // 8. SECURITY & ROLE AUTHORIZATION GUARDS
  // ----------------------------------------------------
  await assertTest("36. Security: Student accessing TPO endpoint rejected (403)", async () => {
    const res = await fetch(`${BASE_URL}/tpo/students`, {
      headers: { Authorization: `Bearer ${regularStudentToken}` },
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return "Student blocked from TPO endpoint with 403 Forbidden";
  });

  await assertTest("37. Security: TPO accessing Student profile submit rejected (403)", async () => {
    const res = await fetch(`${BASE_URL}/students/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tpoToken}`,
      },
      body: JSON.stringify({ studentType: "REGULAR" }),
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return "TPO blocked from student submit endpoint with 403 Forbidden";
  });

  await assertTest("38. Security: Unauthenticated request rejected (401)", async () => {
    const res = await fetch(`${BASE_URL}/students/me`);
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return "Unauthenticated request blocked with 401 Unauthorized";
  });

  await assertTest("39. Security: Invalid JWT token rejected (401)", async () => {
    const res = await fetch(`${BASE_URL}/students/me`, {
      headers: { Authorization: "Bearer invalid-jwt-token-string" },
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return "Invalid token rejected with 401 Unauthorized";
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log(`SUCCESS RATE: ${Math.round((testsPassed / results.length) * 100)}%`);
  console.log("=================================================");
}

runAllTests().catch(console.error);
