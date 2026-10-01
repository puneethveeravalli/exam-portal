const ExamAttempt = require("../models/ExamAttempt");
const ExamAssignment = require("../models/ExamAssignment");
const Exam = require("../models/Exam");
const ExamQuestion = require("../models/ExamQuestion");
const HiringDriveExam = require("../models/HiringDriveExam");


const startExam = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { examId } = req.params;

    // 1. Check exam
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // 2. Check published
    if (!exam.isPublished) {
      return res.status(400).json({
        message: "Exam is not published"
      });
    }

    // 3. Check exam dates
    const now = new Date();

    if (now < exam.startDate) {
      return res.status(400).json({
        message: "Exam has not started yet"
      });
    }

    if (now > exam.endDate) {
      return res.status(400).json({
        message: "Exam has already ended"
      });
    }

    // 4. Check assignment
    const assignment = await ExamAssignment.findOne({
      exam: examId,
      student: studentId
    });

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this exam"
      });
    }

    // 5. Check existing attempt
    let attempt = await ExamAttempt.findOne({
      exam: examId,
      student: studentId
    });

   if (attempt) {
  if (
    attempt.status === "SUBMITTED" ||
    attempt.status === "AUTO_SUBMITTED"
  ) {
    return res.status(400).json({
      message: "You have already completed this exam"
    });
  }

  const existingQuestions = await ExamQuestion.find({
    exam: examId
  })
    .sort({ order: 1 })
    .select(
      "_id exam section questionText options marks order"
    );

  return res.status(200).json({
    message: "Existing exam attempt found",
    attempt: {
      _id: attempt._id,
      exam: exam,
      status: attempt.status,
      startedAt: attempt.startedAt,
      questions: existingQuestions
    }
  });
}

    // 6. Get fixed exam questions
    const examQuestions = await ExamQuestion.find({
      exam: examId
    })
      .sort({ order: 1 })
      .select(
        "_id exam section questionText options marks order"
      );

    if (examQuestions.length === 0) {
      return res.status(400).json({
        message: "No questions have been generated for this exam"
      });
    }

    // 7. Create empty answers
    const answers = examQuestions.map((question) => ({
      question: question._id,
      selectedAnswer: null
    }));

    // 8. Create attempt
    attempt = await ExamAttempt.create({
      exam: examId,
      student: studentId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      answers
    });

    res.status(201).json({
  message: "Exam started successfully",
  attempt: {
    _id: attempt._id,
    exam: exam,
    status: attempt.status,
    startedAt: attempt.startedAt,
    questions: examQuestions
  }
});
  } catch (error) {
    console.error("Start exam error:", error);

    res.status(500).json({
      message: "Failed to start exam"
    });
  }
};
const submitExam = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: studentId
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    if (
      attempt.status === "SUBMITTED" ||
      attempt.status === "AUTO_SUBMITTED"
    ) {
      return res.status(400).json({
        message: "Exam has already been submitted"
      });
    }

    const examQuestions = await ExamQuestion.find({
      exam: attempt.exam
    });

    let score = 0;

    for (const answer of attempt.answers) {
      if (answer.selectedAnswer === null) {
        continue;
      }

      const question = examQuestions.find(
        (item) =>
          item._id.toString() === answer.question.toString()
      );

      if (!question) {
        continue;
      }

      if (answer.selectedAnswer === question.correctAnswer) {
        score += question.marks;
      }
    }

    attempt.score = score;
    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date();

    await attempt.save();

  res.status(200).json({
  message: "Exam submitted successfully",
  result: {
    attemptId: attempt._id,
    status: attempt.status,
    score,
    totalMarks: examQuestions.reduce(
      (total, question) =>
        total + question.marks,
      0
    ),
    submittedAt: attempt.submittedAt
  }
});
  } catch (error) {
    console.error("Submit exam error:", error);

    res.status(500).json({
      message: "Failed to submit exam"
    });
  }
};

  const saveAnswers = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { attemptId } = req.params;
    const { questionId, selectedAnswer } = req.body;

    if (!questionId) {
      return res.status(400).json({
        message: "questionId is required"
      });
    }

    if (
      selectedAnswer !== null &&
      (selectedAnswer < 0 || selectedAnswer > 3)
    ) {
      return res.status(400).json({
        message: "Invalid answer option"
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
        message: "This exam attempt is no longer active"
      });
    }

    // Make sure question belongs to this exam
    const examQuestion = await ExamQuestion.findOne({
      _id: questionId,
      exam: attempt.exam
    });

    if (!examQuestion) {
      return res.status(400).json({
        message: "Question does not belong to this exam"
      });
    }

    const answerIndex = attempt.answers.findIndex(
      (answer) =>
        answer.question.toString() === questionId.toString()
    );

    if (answerIndex === -1) {
      return res.status(400).json({
        message: "Question is not part of this attempt"
      });
    }

    attempt.answers[answerIndex].selectedAnswer =
      selectedAnswer;

    await attempt.save();

    res.status(200).json({
      message: "Answer saved successfully"
    });
  } catch (error) {
    console.error("Save answer error:", error);

    res.status(500).json({
      message: "Failed to save answer"
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
    })
      .populate(
        "exam",
        "title description duration totalMarks startDate endDate"
      )
      .populate({
        path: "answers.question",
        select: "_id section questionText options marks order"
      });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    const examQuestions = await ExamQuestion.find({
      exam: attempt.exam._id
    })
      .sort({ order: 1 })
      .select(
        "_id exam section questionText options marks order"
      );

    res.status(200).json({
      attempt,
      questions: examQuestions
    });
  } catch (error) {
    console.error("Get attempt error:", error);

    res.status(500).json({
      message: "Failed to fetch exam attempt"
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
        "name email username college batch branch"
      )
      .populate(
        "exam",
        "title description totalMarks duration startDate endDate"
      )
      .sort({
        submittedAt: -1
      });

    // Get all exams present in the results
    const examIds = attempts
      .map((attempt) => attempt.exam?._id)
      .filter(Boolean);

    // Find which hiring drives contain these exams
    const driveExams =
      await HiringDriveExam.find({
        exam: {
          $in: examIds
        },
        isActive: true
      }).populate(
        "hiringDrive",
        "name companyName startDate endDate status"
      );

    // Map exam ID -> hiring drives
    const driveMap = new Map();

    driveExams.forEach((driveExam) => {
      if (!driveExam.hiringDrive) {
        return;
      }

      const examId =
        driveExam.exam.toString();

      if (!driveMap.has(examId)) {
        driveMap.set(examId, []);
      }

      driveMap.get(examId).push(
        driveExam.hiringDrive
      );
    });

    const formattedAttempts =
      attempts.map((attempt) => ({
        _id: attempt._id,

        status: attempt.status,

        score: attempt.score || 0,

        startedAt: attempt.startedAt,

        submittedAt:
          attempt.submittedAt,

        violationCount:
          attempt.violationCount || 0,

        student: attempt.student,

        exam: attempt.exam,

        hiringDrives:
          driveMap.get(
            attempt.exam?._id?.toString()
          ) || []
      }));

    res.json({
      attempts: formattedAttempts
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
const getAdminAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate({
        path: "student",
        select: "name email username college batch branch",
        populate: [
          {
            path: "college",
            select: "name code location"
          },
          {
            path: "batch",
            select: "name year"
          }
        ]
      })
      .populate({
        path: "exam",
        select: "title description duration totalMarks startDate endDate"
      })
      .populate({
        path: "answers.question",
        select:
          "_id questionText options correctAnswer marks section order",
        populate: {
          path: "section",
          select: "_id name category marksPerQuestion"
        }
      });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found"
      });
    }

    // Find the hiring drive connected to this exam
    const hiringDriveExam = await HiringDriveExam.findOne({
      exam: attempt.exam?._id,
      isActive: true
    }).populate({
      path: "hiringDrive",
      select: "name companyName description startDate endDate status"
    });

    const questionResults = attempt.answers.map((answer) => {
      const question = answer.question;

      if (!question) {
        return {
          questionId: answer.question,
          questionText: "Question unavailable",
          options: [],
          correctAnswer: null,
          selectedAnswer: answer.selectedAnswer,
          marks: 0,
          isCorrect: false,
          section: null
        };
      }

      const isAnswered = answer.selectedAnswer !== null;

      const isCorrect =
        isAnswered &&
        answer.selectedAnswer === question.correctAnswer;

      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: answer.selectedAnswer,
        marks: question.marks,
        isCorrect,
        section: question.section
          ? {
              _id: question.section._id,
              name: question.section.name,
              category: question.section.category,
              marksPerQuestion: question.section.marksPerQuestion
            }
          : null,
        order: question.order
      };
    });

    const totalMarks = questionResults.reduce(
      (total, question) => total + (question.marks || 0),
      0
    );

    res.status(200).json({
      attempt,
      hiringDrive: hiringDriveExam?.hiringDrive || null,
      totalMarks,
      questionResults
    });
  } catch (error) {
    console.error("Get admin attempt details error:", error);

    res.status(500).json({
      message: "Failed to fetch result details"
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
  // Calculate score before auto-submitting
  const examQuestions = await ExamQuestion.find({
    exam: attempt.exam
  });

  let score = 0;

  for (const answer of attempt.answers) {
    if (answer.selectedAnswer === null) {
      continue;
    }

    const question = examQuestions.find(
      (item) =>
        item._id.toString() === answer.question.toString()
    );

    if (!question) {
      continue;
    }

    if (answer.selectedAnswer === question.correctAnswer) {
      score += question.marks;
    }
  }

  attempt.score = score;
  attempt.status = "AUTO_SUBMITTED";
  attempt.submittedAt = new Date();

  await attempt.save();

  return res.json({
  message:
    "Maximum security violations exceeded. Exam automatically submitted.",
  violationCount: attempt.violationCount,
  score,
  submittedAt: attempt.submittedAt,
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
  getAllAttempts,
  getAdminAttemptDetails
};