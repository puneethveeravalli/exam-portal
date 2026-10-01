const XLSX = require("xlsx");
const Question = require("../models/Question");

// =====================================================
// GET QUESTIONS FOR AN EXAM
// Existing functionality
// =====================================================

const getQuestionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const questions = await Question.find({
      exam: examId,
      isActive: true
    }).sort({ createdAt: 1 });

    res.json({
      questions
    });
  } catch (error) {
    console.error("Get exam questions error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// =====================================================
// GET QUESTION BANK
// =====================================================

const getQuestionBank = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search
    } = req.query;

    const filter = {
      exam: null,
      isActive: true
    };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.questionText = {
        $regex: search,
        $options: "i"
      };
    }

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      questions,
      total: questions.length
    });
  } catch (error) {
    console.error("Get question bank error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// =====================================================
// CREATE SINGLE QUESTION
// =====================================================

const createQuestion = async (req, res) => {
  try {
    const {
      exam,
      questionText,
      options,
      correctAnswer,
      marks,
      category,
      difficulty
    } = req.body;

    if (
      !questionText ||
      !options ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      correctAnswer === undefined ||
      !category
    ) {
      return res.status(400).json({
        message:
          "Question text, exactly 4 options, correct answer and category are required"
      });
    }

    const question = await Question.create({
      exam: exam || null,
      questionText: questionText.trim(),
      options,
      correctAnswer,
      marks: marks || 1,
      category: category.trim(),
      difficulty: difficulty || "MEDIUM"
    });

    res.status(201).json({
      message: "Question created successfully",
      question
    });
  } catch (error) {
    console.error("Create question error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// =====================================================
// BULK QUESTION UPLOAD
// =====================================================

const bulkCreateQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Excel file is required"
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        message: "Excel sheet is empty"
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );

    if (!rows.length) {
      return res.status(400).json({
        message: "No questions found in Excel file"
      });
    }

    const createdQuestions = [];
    const skippedQuestions = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      const rowNumber = index + 2;

      const questionText = String(
        row.Question || ""
      ).trim();

      const optionA = String(
        row["Option A"] || ""
      ).trim();

      const optionB = String(
        row["Option B"] || ""
      ).trim();

      const optionC = String(
        row["Option C"] || ""
      ).trim();

      const optionD = String(
        row["Option D"] || ""
      ).trim();

      const correctOption = String(
        row["Correct Option"] || ""
      )
        .trim()
        .toUpperCase();

      const category = String(
        row.Category || ""
      ).trim();

      const difficulty = String(
        row.Difficulty || "MEDIUM"
      )
        .trim()
        .toUpperCase();

      // -----------------------------
      // Validate required fields
      // -----------------------------

      if (
        !questionText ||
        !optionA ||
        !optionB ||
        !optionC ||
        !optionD ||
        !correctOption ||
        !category
      ) {
        skippedQuestions.push({
          row: rowNumber,
          reason: "Missing required field"
        });

        continue;
      }

      // -----------------------------
      // Validate correct option
      // -----------------------------

      const correctAnswerMap = {
        A: 0,
        B: 1,
        C: 2,
        D: 3
      };

      if (
        correctAnswerMap[correctOption] === undefined
      ) {
        skippedQuestions.push({
          row: rowNumber,
          reason:
            "Correct Option must be A, B, C or D"
        });

        continue;
      }

      // -----------------------------
      // Validate difficulty
      // -----------------------------

      const allowedDifficulties = [
        "EASY",
        "MEDIUM",
        "HARD"
      ];

      if (
        !allowedDifficulties.includes(
          difficulty
        )
      ) {
        skippedQuestions.push({
          row: rowNumber,
          reason:
            "Difficulty must be EASY, MEDIUM or HARD"
        });

        continue;
      }

      // -----------------------------
      // Prevent duplicate question
      // -----------------------------

      const existingQuestion =
        await Question.findOne({
          exam: null,
          questionText
        });

      if (existingQuestion) {
        skippedQuestions.push({
          row: rowNumber,
          reason: "Question already exists"
        });

        continue;
      }

      // -----------------------------
      // Create question
      // -----------------------------

      const question =
        await Question.create({
          exam: null,

          questionText,

          options: [
            optionA,
            optionB,
            optionC,
            optionD
          ],

          correctAnswer:
            correctAnswerMap[correctOption],

          // Default mark.
          // Exam section will eventually
          // determine the actual marks.
          marks: 1,

          category,

          difficulty,

          isActive: true
        });

      createdQuestions.push({
        id: question._id,
        questionText:
          question.questionText,
        category:
          question.category,
        difficulty:
          question.difficulty
      });
    }

    res.status(201).json({
      message:
        "Bulk question upload completed",

      summary: {
        totalRows: rows.length,
        created:
          createdQuestions.length,
        skipped:
          skippedQuestions.length
      },

      createdQuestions,
      skippedQuestions
    });
  } catch (error) {
    console.error(
      "Bulk question upload error:",
      error
    );

    res.status(500).json({
      message:
        "Server error during bulk question upload"
    });
  }
};

// =====================================================
// UPDATE QUESTION
// =====================================================

const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const {
      questionText,
      options,
      correctAnswer,
      marks,
      category,
      difficulty
    } = req.body;

    const question =
      await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    if (questionText !== undefined) {
      question.questionText =
        questionText.trim();
    }

    if (options !== undefined) {
      if (
        !Array.isArray(options) ||
        options.length !== 4
      ) {
        return res.status(400).json({
          message:
            "A question must have exactly 4 options"
        });
      }

      question.options = options;
    }

    if (correctAnswer !== undefined) {
      question.correctAnswer =
        correctAnswer;
    }

    if (marks !== undefined) {
      question.marks = marks;
    }

    if (category !== undefined) {
      question.category =
        category.trim();
    }

    if (difficulty !== undefined) {
      question.difficulty =
        difficulty;
    }

    await question.save();

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

// =====================================================
// DELETE QUESTION
// =====================================================

const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question =
      await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    question.isActive = false;

    await question.save();

    res.json({
      message:
        "Question removed from question bank"
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
  getQuestionsByExam,
  getQuestionBank,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion
};