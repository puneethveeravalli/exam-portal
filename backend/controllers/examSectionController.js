const ExamSection = require("../models/ExamSection");
const Exam = require("../models/Exam");
const Question = require("../models/Question");


// CREATE SECTION
const createSection = async (req, res) => {
  try {
    const { examId } = req.params;

    const {
      name,
      category,
      questionCount,
      marksPerQuestion,
      selectionMode,
      difficulty,
      order
    } = req.body;

    if (
      !name ||
      !category ||
      !questionCount ||
      !marksPerQuestion
    ) {
      return res.status(400).json({
        message:
          "Name, category, question count and marks per question are required"
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Check whether enough questions exist
    const questionFilter = {
      exam: null,
      category: { $regex: `^${category.trim()}$`, $options: "i" },
      isActive: true
    };

    if (difficulty && difficulty !== "ANY") {
      questionFilter.difficulty = difficulty;
    }

    const availableQuestions =
      await Question.countDocuments(questionFilter);

    if (availableQuestions < Number(questionCount)) {
      return res.status(400).json({
        message: `Only ${availableQuestions} questions are available in the Question Bank for this category/difficulty. ${questionCount} required.`,
        availableQuestions,
        requiredQuestions: Number(questionCount)
      });
    }

    const section = await ExamSection.create({
      exam: examId,
      name: name.trim(),
      category: category.trim(),
      questionCount: Number(questionCount),
      marksPerQuestion: Number(marksPerQuestion),
      selectionMode: selectionMode || "RANDOM",
      difficulty: difficulty || "ANY",
      order: Number(order) || 0
    });

    res.status(201).json({
      message: "Exam section created successfully",
      section
    });
  } catch (error) {
    console.error("Create section error:", error);

    res.status(500).json({
      message: "Failed to create exam section",
      error: error.message
    });
  }
};


// GET SECTIONS FOR EXAM
const getSections = async (req, res) => {
  try {
    const { examId } = req.params;

    const sections = await ExamSection.find({
      exam: examId
    }).sort({
      order: 1,
      createdAt: 1
    });

    res.json({
      sections
    });
  } catch (error) {
    console.error("Get sections error:", error);

    res.status(500).json({
      message: "Failed to fetch exam sections",
      error: error.message
    });
  }
};


// UPDATE SECTION
const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section =
      await ExamSection.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Exam section not found"
      });
    }

    const {
      name,
      category,
      questionCount,
      marksPerQuestion,
      difficulty,
      order
    } = req.body;

    const finalCategory =
      category !== undefined
        ? category.trim()
        : section.category;

    const finalDifficulty =
      difficulty !== undefined
        ? difficulty
        : section.difficulty;

    const finalQuestionCount =
      questionCount !== undefined
        ? Number(questionCount)
        : section.questionCount;

    const questionFilter = {
      exam: null,
      category: finalCategory,
      isActive: true
    };

    if (finalDifficulty !== "ANY") {
      questionFilter.difficulty = finalDifficulty;
    }

    const availableQuestions =
      await Question.countDocuments(questionFilter);

    if (availableQuestions < finalQuestionCount) {
      return res.status(400).json({
        message: `Only ${availableQuestions} matching questions are available.`,
        availableQuestions,
        requiredQuestions: finalQuestionCount
      });
    }

    if (name !== undefined) {
      section.name = name.trim();
    }

    section.category = finalCategory;
    section.difficulty = finalDifficulty;
    section.questionCount = finalQuestionCount;

    if (marksPerQuestion !== undefined) {
      section.marksPerQuestion =
        Number(marksPerQuestion);
    }

    if (order !== undefined) {
      section.order = Number(order);
    }

    await section.save();

    res.json({
      message: "Exam section updated successfully",
      section
    });
  } catch (error) {
    console.error("Update section error:", error);

    res.status(500).json({
      message: "Failed to update exam section",
      error: error.message
    });
  }
};


// DELETE SECTION
const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section =
      await ExamSection.findByIdAndDelete(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Exam section not found"
      });
    }

    res.json({
      message: "Exam section deleted successfully"
    });
  } catch (error) {
    console.error("Delete section error:", error);

    res.status(500).json({
      message: "Failed to delete exam section",
      error: error.message
    });
  }
};


module.exports = {
  createSection,
  getSections,
  updateSection,
  deleteSection
};