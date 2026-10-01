const express = require("express");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  assignExamToStudent,
  getExamAssignments,
  getMyExams, assignExamToBatch, assignExamByScope
} = require("../controllers/assignmentController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  assignExamToStudent
);
router.post(
  "/batch",
  authenticate,
  authorize("ADMIN"),
  assignExamToBatch
);
router.post(
  "/scope",
  authenticate,
  authorize("ADMIN"),
  assignExamByScope
);
router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  getExamAssignments
);

router.get(
  "/my-exams",
  authenticate,
  authorize("STUDENT"),
  getMyExams
);



module.exports = router;