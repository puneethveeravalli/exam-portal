const express = require("express");
const multer = require("multer");
const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  createStudent, getStudents, updateStudentStatus, createAdmin, bulkCreateStudents
} = require("../controllers/adminController");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls"];

    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error("Only Excel files are allowed")
      );
    }

    cb(null, true);
  }
});

const router = express.Router();

router.post(
  "/students",
  authenticate,
  authorize("ADMIN"),
  createStudent
);
router.post(
  "/admins",
  authenticate,
  authorize("ADMIN"),
  createAdmin
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
router.post(
  "/students/bulk-upload",
  authenticate,
  authorize("ADMIN"),
  upload.single("file"),
  bulkCreateStudents
);

module.exports = router;