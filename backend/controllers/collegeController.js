const College = require("../models/College");

// ======================================================
// CREATE COLLEGE
// ======================================================

const createCollege = async (req, res) => {
  try {
    const { name, code, location } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "College name and code are required",
      });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    const existingCollege = await College.findOne({
      $or: [
        { name: cleanName },
        { code: cleanCode },
      ],
    });

    if (existingCollege) {
      return res.status(409).json({
        message:
          "College with this name or code already exists",
      });
    }

    const college = await College.create({
      name: cleanName,
      code: cleanCode,
      location: location?.trim() || "",
      isActive: true,
    });

    res.status(201).json({
      message: "College created successfully",
      college,
    });
  } catch (error) {
    console.error("Create college error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET COLLEGES
// ======================================================

const getColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({
      name: 1,
    });

    res.json({
      colleges,
    });
  } catch (error) {
    console.error("Get colleges error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE COLLEGE
// ======================================================

const updateCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { name, code, location } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "College name and code are required",
      });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Check if another college already uses
    // the same name or code
    const existingCollege = await College.findOne({
      _id: { $ne: collegeId },
      $or: [
        { name: cleanName },
        { code: cleanCode },
      ],
    });

    if (existingCollege) {
      return res.status(409).json({
        message:
          "Another college with this name or code already exists",
      });
    }

    const college =
      await College.findByIdAndUpdate(
        collegeId,
        {
          name: cleanName,
          code: cleanCode,
          location: location?.trim() || "",
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!college) {
      return res.status(404).json({
        message: "College not found",
      });
    }

    res.json({
      message: "College updated successfully",
      college,
    });
  } catch (error) {
    console.error("Update college error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE COLLEGE STATUS
// ======================================================

const updateCollegeStatus = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { isActive } = req.body;

    const college =
      await College.findByIdAndUpdate(
        collegeId,
        { isActive: Boolean(isActive) },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!college) {
      return res.status(404).json({
        message: "College not found",
      });
    }

    res.json({
      message: college.isActive
        ? "College activated successfully"
        : "College deactivated successfully",
      college,
    });
  } catch (error) {
    console.error(
      "Update college status error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createCollege,
  getColleges,
  updateCollege,
  updateCollegeStatus,
};