const express = require("express");

const {
  addExamToDrive,
  getDriveExams,
  removeExamFromDrive
} = require("../controllers/hiringDriveExamController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// Attach exam to hiring drive
router.post(
  "/drive/:driveId",
  authenticate,
  authorize("ADMIN"),
  addExamToDrive
);


// Get exams attached to hiring drive
router.get(
  "/drive/:driveId",
  authenticate,
  authorize("ADMIN"),
  getDriveExams
);


// Remove exam from hiring drive
router.delete(
  "/:hiringDriveExamId",
  authenticate,
  authorize("ADMIN"),
  removeExamFromDrive
);


module.exports = router;