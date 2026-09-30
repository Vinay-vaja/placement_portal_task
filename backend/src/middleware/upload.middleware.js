import multer from "multer";

const storage = multer.memoryStorage();

// Image-only filter (for company logos, etc.)
const imageFilter = (req, file, cb) => {
  const allowedMimetypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed."
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// PDF-only filter (for resume uploads)
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only PDF files are allowed.");
    error.statusCode = 400;
    cb(error, false);
  }
};

// Image + PDF filter (for general uploads)
const imageAndPdfFilter = (req, file, cb) => {
  const allowedMimetypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
  ];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Invalid file type. Only images (JPEG, PNG, WEBP, GIF, SVG) and PDF files are allowed."
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// Image upload middleware (5MB limit)
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
  },
  fileFilter: imageFilter,
});

// PDF upload middleware (10MB limit for resumes)
export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum for PDFs
  },
  fileFilter: pdfFilter,
});

// General upload middleware (images + PDFs, 10MB)
export const uploadAny = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: imageAndPdfFilter,
});
