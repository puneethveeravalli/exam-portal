const express = require("express");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  createStudent, getStudents, updateStudentStatus
} = require("../controllers/adminController");

const router = express.Router();

router.post(
  "/students",
  authenticate,
  authorize("ADMIN"),
  createStudent
);

router.get(
  "/students",
  authenticate,
  authorize("ADMIN"),
  getStudents
);

router.patch(
  "/students/:studentId/status",
  authenticate,
  authorize("ADMIN"),
  updateStudentStatus
);

module.exports = router;