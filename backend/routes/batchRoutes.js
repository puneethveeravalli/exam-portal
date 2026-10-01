const express = require("express");

const {
  createBatch,
  getBatches,
  updateBatch,
  updateBatchStatus,
} = require("../controllers/batchController");

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
  createBatch
);

// Get
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getBatches
);

// Edit
router.patch(
  "/:batchId",
  authenticate,
  authorize("ADMIN"),
  updateBatch
);

// Activate / Deactivate
router.patch(
  "/:batchId/status",
  authenticate,
  authorize("ADMIN"),
  updateBatchStatus
);

module.exports = router;