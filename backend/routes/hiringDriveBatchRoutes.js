const express = require("express");

const {
  addBatchToDrive,
  getDriveBatches,
  removeBatchFromDrive
} = require("../controllers/hiringDriveBatchController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// ADD BATCH
router.post(
  "/drive/:driveId",
  authenticate,
  authorize("ADMIN"),
  addBatchToDrive
);


// GET BATCHES
router.get(
  "/drive/:driveId",
  authenticate,
  authorize("ADMIN"),
  getDriveBatches
);


// REMOVE BATCH
router.delete(
  "/:driveBatchId",
  authenticate,
  authorize("ADMIN"),
  removeBatchFromDrive
);


module.exports = router;