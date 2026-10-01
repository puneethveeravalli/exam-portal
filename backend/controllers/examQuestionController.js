const Exam = require("../models/Exam");
const ExamSection = require("../models/ExamSection");
const ExamQuestion = require("../models/ExamQuestion");
const Question = require("../models/Question");


// GENERATE QUESTIONS FOR A SECTION
const generateQuestions = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await ExamSection.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Exam section not found"
      });
    }

    const exam = await Exam.findById(section.exam);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Don't generate twice
    const existingCount = await ExamQuestion.countDocuments({
      section: sectionId
    });

    if (existingCount > 0) {
      return res.status(400).json({
        message:
          "Questions have already been generated for this section.",
        existingCount
      });
    }

    // Build Question Bank filter
    const filter = {
      exam: null,
      category: { $regex: `^${section.category.trim()}$`, $options: "i" },
      isActive: true
    };

    if (section.difficulty !== "ANY") {
      filter.difficulty = section.difficulty;
    }

    // Get matching questions
    const availableQuestions = await Question.find(filter);

    if (
      availableQuestions.length <
      section.questionCount
    ) {
      return res.status(400).json({
        message: `Only ${availableQuestions.length} matching questions are available. ${section.questionCount} required.`,
        availableQuestions: availableQuestions.length,
        requiredQuestions: section.questionCount
      });
    }

    // Randomize the Question Bank questions
    const shuffled = [...availableQuestions].sort(
      () => Math.random() - 0.5
    );

    const selectedQuestions = shuffled.slice(
      0,
      section.questionCount
    );

    // Create exam-specific question snapshots
    const examQuestions = selectedQuestions.map(
      (question, index) => ({
        exam: section.exam,
        section: section._id,
        sourceQuestion: question._id,

        questionText: question.questionText,

        options: [...question.options],

        correctAnswer: question.correctAnswer,

        marks: section.marksPerQuestion,

        order: index + 1
      })
    );

    const createdQuestions =
      await ExamQuestion.insertMany(examQuestions);

    section.questionsGenerated = true;
    await section.save();

    res.status(201).json({
      message:
        "Questions generated successfully for this exam section",

      count: createdQuestions.length,

      questions: createdQuestions
    });
  } catch (error) {
    console.error(
      "Generate exam questions error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to generate exam questions",
      error: error.message
    });
  }
};
const createManualQuestions = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one question",
      });
    }

    const section = await ExamSection.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Exam section not found",
      });
    }

    if (section.selectionMode !== "MANUAL") {
      return res.status(400).json({
        message:
          "This section is configured for random question selection",
      });
    }

    if (questionIds.length !== section.questionCount) {
      return res.status(400).json({
        message: `Select exactly ${section.questionCount} questions`,
      });
    }

    const existingQuestions = await ExamQuestion.find({
      section: sectionId,
    });

    if (existingQuestions.length > 0) {
      return res.status(400).json({
        message:
          "Questions have already been generated for this section",
      });
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      exam: null,
      isActive: true,
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        message:
          "One or more selected questions are invalid or unavailable",
      });
    }

    const documents = questions.map((question, index) => ({
      exam: section.exam,
      section: section._id,
      sourceQuestion: question._id,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      marks: section.marksPerQuestion,
      order: index,
    }));

    const createdQuestions =
      await ExamQuestion.insertMany(documents);

    section.questionsGenerated = true;
    await section.save();

    res.status(201).json({
      message: "Selected questions added to exam successfully",
      count: createdQuestions.length,
      questions: createdQuestions,
    });
  } catch (error) {
    console.error(
      "Create manual exam questions error:",
      error
    );

    res.status(500).json({
      message: "Failed to add selected questions",
    });
  }
};

// GET QUESTIONS FOR AN EXAM
const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const questions = await ExamQuestion.find({
      exam: examId
    })
      .populate("section", "name order")
      .sort({
        section: 1,
        order: 1
      });

    res.json({
      questions
    });
  } catch (error) {
    console.error(
      "Get exam questions error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch exam questions",
      error: error.message
    });
  }
};


// GET QUESTIONS FOR A SECTION
const getSectionQuestions = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const questions = await ExamQuestion.find({
      section: sectionId
    }).sort({
      order: 1
    });

    res.json({
      questions
    });
  } catch (error) {
    console.error(
      "Get section questions error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch section questions",
      error: error.message
    });
  }
};


// DELETE GENERATED QUESTIONS
const deleteSectionQuestions = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section =
      await ExamSection.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        message: "Exam section not found"
      });
    }

    const result =
      await ExamQuestion.deleteMany({
        section: sectionId
      });

    section.questionsGenerated = false;
    await section.save();

    res.json({
      message:
        "Generated questions removed successfully",

      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(
      "Delete section questions error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete generated questions",
      error: error.message
    });
  }
};
// UPDATE ONE EXAM QUESTION
const updateExamQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const {
      questionText,
      options,
      correctAnswer,
      marks
    } = req.body;

    const question = await ExamQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Exam question not found"
      });
    }

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({
        message: "Question text is required"
      });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        message: "Exactly 4 options are required"
      });
    }

    if (
      correctAnswer === undefined ||
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      return res.status(400).json({
        message: "Correct answer must be between 0 and 3"
      });
    }

    if (!marks || Number(marks) <= 0) {
      return res.status(400).json({
        message: "Marks must be greater than 0"
      });
    }

    question.questionText = questionText.trim();
    question.options = options.map((option) =>
      String(option).trim()
    );
    question.correctAnswer = Number(correctAnswer);
    question.marks = Number(marks);

    await question.save();

    res.json({
      message: "Exam question updated successfully",
      question
    });
  } catch (error) {
    console.error(
      "Update exam question error:",
      error
    );

    res.status(500).json({
      message: "Failed to update exam question",
      error: error.message
    });
  }
};


// DELETE ONE EXAM QUESTION
const deleteExamQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await ExamQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Exam question not found"
      });
    }

    const sectionId = question.section;

    await ExamQuestion.findByIdAndDelete(questionId);

    // Re-number remaining questions
    const remainingQuestions =
      await ExamQuestion.find({
        section: sectionId
      }).sort({ order: 1 });

    for (let i = 0; i < remainingQuestions.length; i++) {
      remainingQuestions[i].order = i + 1;
      await remainingQuestions[i].save();
    }

    // Update section state
    const section =
      await ExamSection.findById(sectionId);

    if (section) {
      section.questionsGenerated =
        remainingQuestions.length > 0;

      await section.save();
    }

    res.json({
      message: "Exam question removed successfully",
      deletedQuestionId: questionId
    });
  } catch (error) {
    console.error(
      "Delete exam question error:",
      error
    );

    res.status(500).json({
      message: "Failed to remove exam question",
      error: error.message
    });
  }
};


module.exports = {
  generateQuestions,
  getExamQuestions,
  getSectionQuestions,
  deleteSectionQuestions,
  createManualQuestions,
  updateExamQuestion,
  deleteExamQuestion
};
