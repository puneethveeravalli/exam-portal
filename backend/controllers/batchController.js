const Batch = require("../models/Batch");
const College = require("../models/College");

// ======================================================
// CREATE BATCH
// ======================================================

const createBatch = async (req, res) => {
  try {
    const {
      name,
      year,
      college,
      branches = [],
    } = req.body;

    if (!name || !year || !college) {
      return res.status(400).json({
        message:
          "Name, year and college are required",
      });
    }

    const selectedCollege =
      await College.findById(college);

    if (!selectedCollege) {
      return res.status(404).json({
        message: "College not found",
      });
    }

    if (!selectedCollege.isActive) {
      return res.status(400).json({
        message:
          "Cannot create a batch under an inactive college",
      });
    }

    const cleanName = name.trim();
    const numericYear = Number(year);

    const existingBatch =
      await Batch.findOne({
        name: cleanName,
        college,
      });

    if (existingBatch) {
      return res.status(409).json({
        message:
          "This batch already exists for the selected college",
      });
    }

    const cleanedBranches =
      branches
        .map((branch) => ({
          name: String(
            branch.name || ""
          ).trim(),
          code: String(
            branch.code || ""
          )
            .trim()
            .toUpperCase(),
        }))
        .filter(
          (branch) =>
            branch.name && branch.code
        );

    // Prevent duplicate branch codes
    const branchCodes =
      cleanedBranches.map(
        (branch) => branch.code
      );

    if (
      new Set(branchCodes).size !==
      branchCodes.length
    ) {
      return res.status(400).json({
        message:
          "Duplicate branch codes are not allowed",
      });
    }

    const batch = await Batch.create({
      name: cleanName,
      year: numericYear,
      college,
      branches: cleanedBranches,
      isActive: true,
    });

    const populatedBatch =
      await Batch.findById(batch._id).populate(
        "college",
        "name code location"
      );

    res.status(201).json({
      message:
        "Batch created successfully",
      batch: populatedBatch,
    });
  } catch (error) {
    console.error(
      "Create batch error:",
      error
    );

    res.status(500).json({
      message: "Failed to create batch",
    });
  }
};

// ======================================================
// GET BATCHES
// ======================================================

const getBatches = async (req, res) => {
  try {
    const { collegeId } = req.query;

    const filter = {};

    if (collegeId) {
      filter.college = collegeId;
    }

    const batches = await Batch.find(filter)
      .populate("college", "name code")
      .sort({
        year: -1,
        name: 1,
      });

    res.json({
      batches,
    });
  } catch (error) {
    console.error(
      "Get batches error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE BATCH
// ======================================================

const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const {
      name,
      year,
      college,
      branches = [],
    } = req.body;

    if (!name || !year || !college) {
      return res.status(400).json({
        message:
          "Name, year and college are required",
      });
    }

    const existingBatch =
      await Batch.findById(batchId);

    if (!existingBatch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const selectedCollege =
      await College.findById(college);

    if (!selectedCollege) {
      return res.status(404).json({
        message: "College not found",
      });
    }

    if (!selectedCollege.isActive) {
      return res.status(400).json({
        message:
          "Cannot assign a batch to an inactive college",
      });
    }

    const cleanName = name.trim();
    const numericYear = Number(year);

    // Check duplicate batch name
    // within the same college
    const duplicateBatch =
      await Batch.findOne({
        _id: {
          $ne: batchId,
        },
        name: cleanName,
        college,
      });

    if (duplicateBatch) {
      return res.status(409).json({
        message:
          "Another batch with this name already exists for the selected college",
      });
    }

    const cleanedBranches =
      branches
        .map((branch) => ({
          name: String(
            branch.name || ""
          ).trim(),
          code: String(
            branch.code || ""
          )
            .trim()
            .toUpperCase(),
        }))
        .filter(
          (branch) =>
            branch.name && branch.code
        );

    // Prevent duplicate branch codes
    const branchCodes =
      cleanedBranches.map(
        (branch) => branch.code
      );

    if (
      new Set(branchCodes).size !==
      branchCodes.length
    ) {
      return res.status(400).json({
        message:
          "Duplicate branch codes are not allowed",
      });
    }

    const batch =
      await Batch.findByIdAndUpdate(
        batchId,
        {
          name: cleanName,
          year: numericYear,
          college,
          branches: cleanedBranches,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "college",
        "name code location"
      );

    res.json({
      message:
        "Batch updated successfully",
      batch,
    });
  } catch (error) {
    console.error(
      "Update batch error:",
      error
    );

    res.status(500).json({
      message: "Failed to update batch",
    });
  }
};

// ======================================================
// UPDATE BATCH STATUS
// ======================================================

const updateBatchStatus = async (
  req,
  res
) => {
  try {
    const { batchId } = req.params;
    const { isActive } = req.body;

    const batch =
      await Batch.findByIdAndUpdate(
        batchId,
        {
          isActive: Boolean(isActive),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "college",
        "name code"
      );

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    res.json({
      message: batch.isActive
        ? "Batch activated successfully"
        : "Batch deactivated successfully",
      batch,
    });
  } catch (error) {
    console.error(
      "Update batch status error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  updateBatch,
  updateBatchStatus,
};