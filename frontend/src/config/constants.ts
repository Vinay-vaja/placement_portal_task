export const ENGINEERING_BRANCHES = [
  { code: "CE", name: "Computer Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "AIML", name: "Artificial Intelligence & Machine Learning" },
  { code: "EC", name: "Electronics & Communication" },
  { code: "EE", name: "Electrical Engineering" },
  { code: "CIVIL", name: "Civil Engineering" },
  { code: "MECHANICAL", name: "Mechanical Engineering" },
  { code: "CHEMICAL", name: "Chemical Engineering" },
  { code: "RUBBER", name: "Rubber Technology" },
  { code: "PLASTIC", name: "Plastic Technology" },
  { code: "ENVIRONMENTAL", name: "Environmental Engineering" },
  { code: "IC", name: "Instrumentation & Control" },
  { code: "ROBOTICS", name: "Robotics Engineering" },
  { code: "AUTOMOBILE", name: "Automobile Engineering" },
] as const;

export type BranchCode = (typeof ENGINEERING_BRANCHES)[number]["code"];

export const TENTH_SUBJECTS = [
  "maths",
  "science",
  "english",
  "socialScience",
  "sanskrit",
  "gujarati",
] as const;

export const TWELFTH_SUBJECTS = [
  "physics",
  "chemistry",
  "maths",
  "english",
  "computerScience",
] as const;

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export const STUDENT_TYPES = {
  REGULAR: "REGULAR",
  D2D: "D2D",
} as const;
