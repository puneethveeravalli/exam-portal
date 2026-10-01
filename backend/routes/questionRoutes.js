const express = require("express");

const {
  getQuestionsByExam,
  getQuestionBank,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion
} = require("../controllers/questionController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".xlsx",
      ".xls"
    ];

    const extension =
      file.originalname
        .toLowerCase()
        .substring(
          file.originalname.lastIndexOf(".")
        );

    if (
      !allowedExtensions.includes(extension)
    ) {
      return cb(
        new Error(
          "Only Excel files are allowed"
        )
      );
    }

    cb(null, true);
  }
});

// =====================================================
// QUESTION BANK
// IMPORTANT: These routes must come BEFORE /:questionId
// =====================================================

router.get(
  "/bank",
  authenticate,
  authorize("ADMIN"),
  getQuestionBank
);

router.post(
  "/bulk-upload",
  authenticate,
  authorize("ADMIN"),
  upload.single("file"),
  bulkCreateQuestions
);

// =====================================================
// EXAM QUESTIONS
// =====================================================

router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  getQuestionsByExam
);

// =====================================================
// CREATE / UPDATE / DELETE
// =====================================================

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createQuestion
);

router.patch(
  "/:questionId",
  authenticate,
  authorize("ADMIN"),
  updateQuestion
);

router.delete(
  "/:questionId",
  authenticate,
  authorize("ADMIN"),
  deleteQuestion
);

module.exports = router;