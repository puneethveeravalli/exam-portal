const express = require("express");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion
} = require("../controllers/questionController");



const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createQuestion
);

router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  getQuestionsByExam
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