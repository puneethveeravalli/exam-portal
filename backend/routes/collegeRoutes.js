const express = require("express");

const {
  createCollege,
  getColleges,
  updateCollege,
  updateCollegeStatus,
} = require("../controllers/collegeController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createCollege
);

// Get all
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getColleges
);

// Edit
router.patch(
  "/:collegeId",
  authenticate,
  authorize("ADMIN"),
  updateCollege
);

// Activate / Deactivate
router.patch(
  "/:collegeId/status",
  authenticate,
  authorize("ADMIN"),
  updateCollegeStatus
);

module.exports = router;