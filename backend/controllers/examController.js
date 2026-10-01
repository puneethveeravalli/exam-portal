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

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // If admin is publishing the exam, validate the complete exam
    if (isPublished === true) {
      const ExamSection = require("../models/ExamSection");
      const ExamQuestion = require("../models/ExamQuestion");

      const sections = await ExamSection.find({
        exam: examId
      });

      if (sections.length === 0) {
        return res.status(400).json({
          message:
            "Cannot publish exam without at least one section."
        });
      }

      for (const section of sections) {
        const questionCount =
          await ExamQuestion.countDocuments({
            exam: examId,
            section: section._id
          });

        if (questionCount !== section.questionCount) {
          return res.status(400).json({
            message:
              `Section "${section.name}" requires ${section.questionCount} questions, but only ${questionCount} have been generated.`
          });
        }
      }

      // Calculate total marks from sections
      const calculatedTotalMarks = sections.reduce(
        (total, section) => {
          return (
            total +
            section.questionCount *
              section.marksPerQuestion
          );
        },
        0
      );

      exam.totalMarks = calculatedTotalMarks;
    }

    exam.isPublished = Boolean(isPublished);

    await exam.save();

    res.json({
      message: exam.isPublished
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
      message:
        "Failed to update exam publish status",
      error: error.message
    });
  }
};
const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const {
      title,
      description,
      duration,
      startDate,
      endDate
    } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    if (!duration || Number(duration) <= 0) {
      return res.status(400).json({
        message: "Duration must be greater than 0"
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required"
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    exam.title = title.trim();
    exam.description = description || "";
    exam.duration = Number(duration);
    exam.startDate = startDate;
    exam.endDate = endDate;

    await exam.save();

    res.json({
      message: "Exam updated successfully",
      exam
    });
  } catch (error) {
    console.error(
      "Update exam error:",
      error
    );

    res.status(500).json({
      message: "Failed to update exam",
      error: error.message
    });
  }
};

module.exports = {
  createExam,
  getExams,
  updateExamPublishStatus,
  updateExam
};
