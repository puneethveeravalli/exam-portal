const HiringDrive = require("../models/HiringDrive");
const Exam = require("../models/Exam");
const HiringDriveExam = require("../models/HiringDriveExam");

const addExamToDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({
        message: "examId is required"
      });
    }

    // Check hiring drive
    const hiringDrive = await HiringDrive.findById(driveId);

    if (!hiringDrive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    // Check exam
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Only published exams can be attached
    if (!exam.isPublished) {
      return res.status(400).json({
        message: "Only published exams can be attached to a hiring drive"
      });
    }

    // Prevent duplicate
    const existing = await HiringDriveExam.findOne({
      hiringDrive: driveId,
      exam: examId
    });

    if (existing) {
      return res.status(409).json({
        message: "This exam is already attached to the hiring drive"
      });
    }

    const hiringDriveExam = await HiringDriveExam.create({
      hiringDrive: driveId,
      exam: examId
    });

    const populated = await HiringDriveExam.findById(
      hiringDriveExam._id
    ).populate({
      path: "exam",
      select:
        "title description duration totalMarks startDate endDate isPublished"
    });

    res.status(201).json({
      message: "Exam attached to hiring drive successfully",
      hiringDriveExam: populated
    });
  } catch (error) {
    console.error("Add exam to drive error:", error);

    res.status(500).json({
      message: "Failed to attach exam to hiring drive"
    });
  }
};


const getDriveExams = async (req, res) => {
  try {
    const { driveId } = req.params;

    const exams = await HiringDriveExam.find({
      hiringDrive: driveId,
      isActive: true
    })
      .populate({
        path: "exam",
        select:
          "title description duration totalMarks startDate endDate isPublished"
      })
      .sort({ createdAt: 1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Get drive exams error:", error);

    res.status(500).json({
      message: "Failed to fetch hiring drive exams"
    });
  }
};


const removeExamFromDrive = async (req, res) => {
  try {
    const { hiringDriveExamId } = req.params;

    const hiringDriveExam = await HiringDriveExam.findById(
      hiringDriveExamId
    );

    if (!hiringDriveExam) {
      return res.status(404).json({
        message: "Hiring drive exam not found"
      });
    }

    hiringDriveExam.isActive = false;

    await hiringDriveExam.save();

    res.status(200).json({
      message: "Exam removed from hiring drive successfully"
    });
  } catch (error) {
    console.error("Remove exam from drive error:", error);

    res.status(500).json({
      message: "Failed to remove exam from hiring drive"
    });
  }
};


module.exports = {
  addExamToDrive,
  getDriveExams,
  removeExamFromDrive
};