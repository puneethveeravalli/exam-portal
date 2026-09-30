const ExamAttempt = require("../models/ExamAttempt");
const ExamAssignment = require("../models/ExamAssignment");
const Exam = require("../models/Exam");
const Question = require("../models/Question");

const startExam = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { examId } = req.params;

    // 1. Check that the exam exists
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // 2. Check that the exam is published
    if (!exam.isPublished) {
      return res.status(400).json({
        message: "Exam is not published"
      });
    }

    // 3. Check exam start time
    const now = new Date();

    if (now < exam.startDate) {
      return res.status(400).json({
        message: "Exam has not started yet"
      });
    }

    // 4. Check exam end time
    if (now > exam.endDate) {
      return res.status(400).json({
        message: "Exam has already ended"
      });
    }

    // 5. Check that this student is assigned
    const assignment =
      await ExamAssignment.findOne({
        exam: examId,
        student: studentId
      });

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this exam"
      });
    }

    // 6. Check if the student already has an attempt
    const existingAttempt =
      await ExamAttempt.findOne({
        exam: examId,
        student: studentId
      });

    if (existingAttempt) {
      return res.status(409).json({
        message:
          "You have already started this exam"
      });
    }

    // 7. Get the questions
    const questions = await Question.find(
      { exam: examId },
      {
        questionText: 1,
        options: 1,
        marks: 1
      }
    ).sort({
      createdAt: 1
    });

    if (questions.length === 0) {
      return res.status(400).json({
        message: "Exam has no questions"
      });
    }

    // 8. Create the attempt
    const attempt = await ExamAttempt.create({
      exam: examId,
      student: studentId,
      status: "IN_PROGRESS",
      startedAt: new Date()
    });

    res.status(201).json({
      message: "Exam started successfully",

      attempt: {
        id: attempt._id,
        exam: exam._id,
        startedAt: attempt.startedAt,
        status: attempt.status
      },

      exam: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        startDate: exam.startDate,
        endDate: exam.endDate
      },

      questions
    });
  } catch (error) {
    console.error(
      "Start exam error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
const submitExam = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array"
      });
    }

    // Find the student's attempt
    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: studentId
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    // Prevent submitting twice
    if (attempt.status === "SUBMITTED") {
      return res.status(409).json({
        message: "Exam has already been submitted"
      });
    }

    // Get the exam
    const exam = await Exam.findById(
      attempt.exam
    );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Check exam time
    const now = new Date();

    const deadline = new Date(
      attempt.startedAt.getTime() +
        exam.duration * 60 * 1000
    );
const isExpired = now >= deadline;
    
    // Get all questions for this exam
    const questions = await Question.find({
      exam: attempt.exam
    });

    let score = 0;

    const submittedAnswers = [];

    for (const answer of answers) {
      const question = questions.find(
        (item) =>
          item._id.toString() ===
          answer.question
      );

      if (!question) {
        continue;
      }

      const selectedAnswer =
        Number(answer.selectedAnswer);

      submittedAnswers.push({
        question: question._id,
        selectedAnswer
      });

      if (
        selectedAnswer ===
        question.correctAnswer
      ) {
        score += question.marks;
      }
    }

    // Update attempt
    attempt.answers = submittedAnswers;
    attempt.score = score;
    attempt.status = isExpired ? "AUTO_SUBMITTED" : "SUBMITTED";
    attempt.submittedAt = now;

    await attempt.save();

    res.json({
      message: "Exam submitted successfully",

      result: {
        attemptId: attempt._id,
        score: attempt.score,
        totalMarks: exam.totalMarks,
        submittedAt: attempt.submittedAt,
        status: attempt.status
      }
    });
  } catch (error) {
    console.error(
      "Submit exam error:",
      error
    );
     res.status(500).json({
      message: "Server error"
    });
   }
};

    const saveAnswers = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array"
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: studentId
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Exam is no longer in progress"
      });
    }

    const exam = await Exam.findById(
      attempt.exam
    );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    const now = new Date();

    const deadline =
      new Date(attempt.startedAt).getTime() +
      exam.duration * 60 * 1000;

    if (now >= deadline) {
      return res.status(400).json({
        message: "Exam time has expired"
      });
    }

    const questions = await Question.find({
      exam: attempt.exam
    });

    const validAnswers = [];

    for (const answer of answers) {
      const question = questions.find(
        (item) =>
          item._id.toString() ===
          answer.question
      );

      if (!question) {
        continue;
      }

      const selectedAnswer =
        Number(answer.selectedAnswer);

      if (
        selectedAnswer < 0 ||
        selectedAnswer > 3
      ) {
        continue;
      }

      validAnswers.push({
        question: question._id,
        selectedAnswer
      });
    }

    attempt.answers = validAnswers;

    await attempt.save();

    res.json({
      message: "Answers saved successfully",
      answers: attempt.answers
    });
  } catch (error) {
    console.error(
      "Save answers error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
  const getAttempt = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: studentId
    }).populate(
      "exam",
      "title duration totalMarks startDate endDate"
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    res.json({
      attempt
    });
  } catch (error) {
    console.error(
      "Get attempt error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
}; 
    const getMyAttempts = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const attempts = await ExamAttempt.find({
      student: studentId,
      status: {
        $in: [
          "SUBMITTED",
          "AUTO_SUBMITTED"
        ]
      }
    })
      .populate(
        "exam",
        "title totalMarks duration"
      )
      .sort({
        submittedAt: -1
      });

    res.json({
      attempts
    });
  } catch (error) {
    console.error(
      "Get my attempts error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
const getAllAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({
      status: {
        $in: [
          "SUBMITTED",
          "AUTO_SUBMITTED"
        ]
      }
    })
      .populate(
        "student",
        "name email username"
      )
      .populate(
        "exam",
        "title totalMarks duration"
      )
      .sort({
        submittedAt: -1
      });

    res.json({
      attempts
    });
  } catch (error) {
    console.error(
      "Get all attempts error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
const recordProctoringEvent = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { type, message } = req.body;

    if (!type) {
      return res.status(400).json({
        message: "Proctoring event type is required"
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: req.user.userId
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Exam is no longer active"
      });
    }

    attempt.violationCount += 1;

    attempt.proctoringEvents.push({
      type,
      message: message || "",
      timestamp: new Date()
    });

    const MAX_VIOLATIONS = 5;

    if (attempt.violationCount > MAX_VIOLATIONS) {
      attempt.status = "AUTO_SUBMITTED";
      attempt.submittedAt = new Date();

      await attempt.save();

      return res.json({
        message:
          "Maximum security violations exceeded. Exam automatically submitted.",
        violationCount:
          attempt.violationCount,
        autoSubmitted: true
      });
    }

    await attempt.save();

    res.json({
      message: "Proctoring event recorded",
      violationCount:
        attempt.violationCount,
      remainingWarnings:
        MAX_VIOLATIONS -
        attempt.violationCount,
      autoSubmitted: false
    });
  } catch (error) {
    console.error(
      "Record proctoring event error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
module.exports = {
  startExam,
  submitExam, 
  saveAnswers,
  getAttempt,
  recordProctoringEvent,
  getMyAttempts,
  getAllAttempts
};
