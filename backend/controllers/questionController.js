const Question = require("../models/Question");
const Exam = require("../models/Exam");

const createQuestion = async (req, res) => {
  try {
    const {
      exam,
      questionText,
      options,
      correctAnswer,
      marks
    } = req.body;

    // Check required fields
    if (
      !exam ||
      !questionText ||
      !options ||
      correctAnswer === undefined ||
      !marks
    ) {
      return res.status(400).json({
        message:
          "Exam, question text, options, correct answer and marks are required"
      });
    }

    // Check that the exam exists
    const existingExam = await Exam.findById(exam);

    if (!existingExam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Check options
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        message: "A question must have exactly 4 options"
      });
    }

    // Check correct answer
    if (
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      return res.status(400).json({
        message:
          "Correct answer must be between 0 and 3"
      });
    }

    // Check marks
    if (marks <= 0) {
      return res.status(400).json({
        message: "Marks must be greater than 0"
      });
    }

    const question = await Question.create({
      exam,
      questionText,
      options,
      correctAnswer,
      marks
    });

    res.status(201).json({
      message: "Question created successfully",
      question
    });
  } catch (error) {
    console.error(
      "Create question error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


const getQuestionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    // Check that the exam exists
    const existingExam = await Exam.findById(examId);

    if (!existingExam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    const questions = await Question.find({
      exam: examId
    }).sort({
      createdAt: 1
    });

    res.json({
      questions
    });
  } catch (error) {
    console.error(
      "Get questions error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const {
      questionText,
      options,
      correctAnswer,
      marks
    } = req.body;

    if (
      !questionText ||
      !options ||
      correctAnswer === undefined ||
      !marks
    ) {
      return res.status(400).json({
        message:
          "Question text, options, correct answer and marks are required"
      });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        message:
          "A question must have exactly 4 options"
      });
    }

    if (
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      return res.status(400).json({
        message:
          "Correct answer must be between 0 and 3"
      });
    }

    if (marks <= 0) {
      return res.status(400).json({
        message:
          "Marks must be greater than 0"
      });
    }

    const question =
      await Question.findByIdAndUpdate(
        questionId,
        {
          questionText,
          options,
          correctAnswer,
          marks
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!question) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    res.json({
      message:
        "Question updated successfully",
      question
    });
  } catch (error) {
    console.error(
      "Update question error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question =
      await Question.findByIdAndDelete(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    res.json({
      message:
        "Question deleted successfully"
    });
  } catch (error) {
    console.error(
      "Delete question error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion
};