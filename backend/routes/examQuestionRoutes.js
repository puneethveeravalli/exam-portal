const express = require("express");

const {
  generateQuestions,
  getExamQuestions,
  getSectionQuestions,
  deleteSectionQuestions,
  createManualQuestions,
  updateExamQuestion,
  deleteExamQuestion
} = require("../controllers/examQuestionController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// Generate questions for a section
router.post(
  "/section/:sectionId/generate",
  authenticate,
  authorize("ADMIN"),
  generateQuestions
);
router.post(
  "/section/:sectionId/manual",
  authenticate,
  authorize("ADMIN"),
  createManualQuestions
);

// Get all questions for an exam
router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  getExamQuestions
);
// Update one exam question
router.patch(
  "/:questionId",
  authenticate,
  authorize("ADMIN"),
  updateExamQuestion
);


// Delete one exam question
router.delete(
  "/:questionId",
  authenticate,
  authorize("ADMIN"),
  deleteExamQuestion
);

// Get questions for one section
router.get(
  "/section/:sectionId",
  authenticate,
  authorize("ADMIN"),
  getSectionQuestions
);


// Regenerate section questions
router.delete(
  "/section/:sectionId",
  authenticate,
  authorize("ADMIN"),
  deleteSectionQuestions
);



module.exports = router;