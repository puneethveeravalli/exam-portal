const express = require("express");

const {
  createHiringDrive,
  getHiringDrives,
  getHiringDrive,
  updateHiringDrive,
  deleteHiringDrive
} = require("../controllers/hiringDriveController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createHiringDrive
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getHiringDrives
);

router.get(
  "/:driveId",
  authenticate,
  authorize("ADMIN"),
  getHiringDrive
);

router.patch(
  "/:driveId",
  authenticate,
  authorize("ADMIN"),
  updateHiringDrive
);

router.delete(
  "/:driveId",
  authenticate,
  authorize("ADMIN"),
  deleteHiringDrive
);

module.exports = router;