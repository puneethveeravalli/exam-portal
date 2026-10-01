const HiringDrive = require("../models/HiringDrive");


// CREATE
const createHiringDrive = async (req, res) => {
  try {
    const {
      name,
      companyName,
      description,
      startDate,
      endDate
    } = req.body;

    if (
      !name ||
      !companyName ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "Name, company name, start date and end date are required"
      });
    }

    if (
      new Date(startDate) >=
      new Date(endDate)
    ) {
      return res.status(400).json({
        message:
          "End date must be after start date"
      });
    }

    const drive = await HiringDrive.create({
      name: name.trim(),
      companyName: companyName.trim(),
      description: description || "",
      startDate,
      endDate
    });

    res.status(201).json({
      message:
        "Hiring drive created successfully",
      drive
    });
  } catch (error) {
    console.error(
      "Create hiring drive error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create hiring drive",
      error: error.message
    });
  }
};


// GET ALL
const getHiringDrives = async (req, res) => {
  try {
    const drives = await HiringDrive.find({
      isActive: true
    }).sort({
      createdAt: -1
    });

    res.json({
      drives
    });
  } catch (error) {
    console.error(
      "Get hiring drives error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch hiring drives",
      error: error.message
    });
  }
};


// GET ONE
const getHiringDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const drive =
      await HiringDrive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    res.json({
      drive
    });
  } catch (error) {
    console.error(
      "Get hiring drive error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch hiring drive",
      error: error.message
    });
  }
};


// UPDATE
const updateHiringDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const drive =
      await HiringDrive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    const {
      name,
      companyName,
      description,
      startDate,
      endDate,
      status
    } = req.body;

    if (name !== undefined) {
      drive.name = name.trim();
    }

    if (companyName !== undefined) {
      drive.companyName =
        companyName.trim();
    }

    if (description !== undefined) {
      drive.description = description;
    }

    if (startDate !== undefined) {
      drive.startDate = startDate;
    }

    if (endDate !== undefined) {
      drive.endDate = endDate;
    }

    if (status !== undefined) {
      drive.status = status;
    }

    if (
      new Date(drive.startDate) >=
      new Date(drive.endDate)
    ) {
      return res.status(400).json({
        message:
          "End date must be after start date"
      });
    }

    await drive.save();

    res.json({
      message:
        "Hiring drive updated successfully",
      drive
    });
  } catch (error) {
    console.error(
      "Update hiring drive error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update hiring drive",
      error: error.message
    });
  }
};


// DELETE / DEACTIVATE
const deleteHiringDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const drive =
      await HiringDrive.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    drive.isActive = false;
    await drive.save();

    res.json({
      message:
        "Hiring drive removed successfully"
    });
  } catch (error) {
    console.error(
      "Delete hiring drive error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to remove hiring drive",
      error: error.message
    });
  }
};


module.exports = {
  createHiringDrive,
  getHiringDrives,
  getHiringDrive,
  updateHiringDrive,
  deleteHiringDrive
};