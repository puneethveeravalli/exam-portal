const express = require("express");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  createExam,  getExams,
   updateExamPublishStatus
} = require("../controllers/examController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createExam
);
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getExams
);
router.patch(
  "/:examId/publish",
  authenticate,
  authorize("ADMIN"),
  updateExamPublishStatus
);

module.exports = router;