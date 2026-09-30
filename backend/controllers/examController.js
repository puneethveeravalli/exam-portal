const Exam = require("../models/Exam");

const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      totalMarks,
      startDate,
      endDate
    } = req.body;

    if (
      !title ||
      !duration ||
      !totalMarks ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "Title, duration, total marks, start date and end date are required"
      });
    }

    if (duration <= 0) {
      return res.status(400).json({
        message: "Duration must be greater than 0"
      });
    }

    if (totalMarks <= 0) {
      return res.status(400).json({
        message: "Total marks must be greater than 0"
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    const exam = await Exam.create({
      title,
      description,
      duration,
      totalMarks,
      startDate,
      endDate
    });

    res.status(201).json({
      message: "Exam created successfully",
      exam
    });
  } catch (error) {
    console.error("Create exam error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .sort({ createdAt: -1 });

    res.json({
      exams
    });
  } catch (error) {
    console.error("Get exams error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
const updateExamPublishStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        message: "isPublished must be true or false"
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      examId,
      {
        isPublished
      },
      {
        new: true
      }
    );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    res.json({
      message: isPublished
        ? "Exam published successfully"
        : "Exam unpublished successfully",

      exam
    });
  } catch (error) {
    console.error(
      "Update exam publish status error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createExam,
  getExams,
  updateExamPublishStatus
};