const HiringDriveBatch = require("../models/HiringDriveBatch");
const HiringDrive = require("../models/HiringDrive");
const College = require("../models/College");
const Batch = require("../models/Batch");


// ADD BATCH TO HIRING DRIVE
const addBatchToDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { collegeId, batchId } = req.body;

    if (!collegeId || !batchId) {
      return res.status(400).json({
        message: "College and batch are required"
      });
    }

    const drive = await HiringDrive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(404).json({
        message: "College not found"
      });
    }

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    // Make sure batch belongs to selected college
    if (
      batch.college.toString() !==
      collegeId.toString()
    ) {
      return res.status(400).json({
        message:
          "Selected batch does not belong to the selected college"
      });
    }

    const existing =
      await HiringDriveBatch.findOne({
        hiringDrive: driveId,
        batch: batchId
      });

    if (existing) {
      return res.status(400).json({
        message:
          "This batch is already added to the hiring drive"
      });
    }

    const driveBatch =
      await HiringDriveBatch.create({
        hiringDrive: driveId,
        college: collegeId,
        batch: batchId
      });

    const populated =
      await HiringDriveBatch.findById(
        driveBatch._id
      )
        .populate("college", "name code")
        .populate("batch", "name year");

    res.status(201).json({
      message:
        "Batch added to hiring drive successfully",
      driveBatch: populated
    });
  } catch (error) {
    console.error(
      "Add batch to drive error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to add batch to hiring drive",
      error: error.message
    });
  }
};


// GET DRIVE BATCHES
const getDriveBatches = async (req, res) => {
  try {
    const { driveId } = req.params;

    const batches =
  await HiringDriveBatch.find({
    hiringDrive: driveId,
    isActive: true
  })
    .populate("college", "name code")
    .populate(
      "batch",
      "name year college branches"
    )
    .sort({
      createdAt: -1
    });

    res.json({
      batches
    });
  } catch (error) {
    console.error(
      "Get drive batches error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch hiring drive batches",
      error: error.message
    });
  }
};


// REMOVE BATCH FROM DRIVE
const removeBatchFromDrive = async (req, res) => {
  try {
    const { driveBatchId } = req.params;

    const driveBatch =
      await HiringDriveBatch.findById(
        driveBatchId
      );

    if (!driveBatch) {
      return res.status(404).json({
        message:
          "Hiring drive batch assignment not found"
      });
    }

    driveBatch.isActive = false;

    await driveBatch.save();

    res.json({
      message:
        "Batch removed from hiring drive successfully"
    });
  } catch (error) {
    console.error(
      "Remove drive batch error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to remove batch from hiring drive",
      error: error.message
    });
  }
};


module.exports = {
  addBatchToDrive,
  getDriveBatches,
  removeBatchFromDrive
};