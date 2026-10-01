const express = require("express");

const {
  createSection,
  getSections,
  updateSection,
  deleteSection
} = require("../controllers/examSectionController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE SECTION
router.post(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  createSection
);


// GET SECTIONS
router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  getSections
);


// UPDATE SECTION
router.patch(
  "/:sectionId",
  authenticate,
  authorize("ADMIN"),
  updateSection
);


// DELETE SECTION
router.delete(
  "/:sectionId",
  authenticate,
  authorize("ADMIN"),
  deleteSection
);


module.exports = router;