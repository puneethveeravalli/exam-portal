const express = require("express");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  startExam, 
  submitExam,
  saveAnswers,
    getAttempt,
    getMyAttempts,
    getAllAttempts,
    recordProctoringEvent,
    getAdminAttemptDetails
} = require("../controllers/attemptController");

const router = express.Router();

router.post(
  "/:examId/start",
  authenticate,
  authorize("STUDENT"),
  startExam
);
router.get(
  "/my-results",
  authenticate,
  authorize("STUDENT"),
  getMyAttempts
);
router.get(
  "/all-results",
  authenticate,
  authorize("ADMIN"),
  getAllAttempts
);
router.get(
  "/all-results/:attemptId",
  authenticate,
  authorize("ADMIN"),
  getAdminAttemptDetails
);
router.post(
  "/:attemptId/proctoring-event",
  authenticate,
  authorize("STUDENT"),
  recordProctoringEvent
);
router.get(
  "/:attemptId",
  authenticate,
  authorize("STUDENT"),
  getAttempt
);
router.patch(
  "/:attemptId/answers",
  authenticate,
  authorize("STUDENT"),
  saveAnswers
);
router.post(
  "/:attemptId/submit",
  authenticate,
  authorize("STUDENT"),
  submitExam
);

module.exports = router;