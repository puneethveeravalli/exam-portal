const ExamAssignment = require("../models/ExamAssignment");
const Exam = require("../models/Exam");
const User = require("../models/User");
const ExamAttempt = require("../models/ExamAttempt");

const assignExamToStudent = async (req, res) => {
  try {
    const { exam, student } = req.body;

    if (!exam || !student) {
      return res.status(400).json({
        message: "Exam and student are required"
      });
    }

    // Check that the exam exists
    const existingExam = await Exam.findById(exam);

    if (!existingExam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // Check that the student exists
    const existingStudent = await User.findOne({
      _id: student,
      role: "STUDENT"
    });

    if (!existingStudent) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Don't assign inactive students
    if (!existingStudent.isActive) {
      return res.status(400).json({
        message: "Cannot assign exam to an inactive student"
      });
    }

    // Check for duplicate assignment
    const existingAssignment =
      await ExamAssignment.findOne({
        exam,
        student
      });

    if (existingAssignment) {
      return res.status(409).json({
        message: "Exam is already assigned to this student"
      });
    }

    const assignment = await ExamAssignment.create({
      exam,
      student
    });

    res.status(201).json({
      message: "Exam assigned successfully",
      assignment
    });
  } catch (error) {
    console.error(
      "Assign exam error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

const getExamAssignments = async (req, res) => {
  try {
    const { examId } = req.params;

    const assignments =
      await ExamAssignment.find({
        exam: examId
      })
        .populate(
          "student",
          "name username isActive"
        )
        .sort({
          createdAt: -1
        });

    res.json({
      assignments
    });
  } catch (error) {
    console.error(
      "Get exam assignments error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

const getMyExams = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // 1. Get all exams assigned to this student
    const assignments =
      await ExamAssignment.find({
        student: studentId
      })
        .populate(
          "exam",
          "title description duration totalMarks startDate endDate isPublished"
        )
        .sort({
          createdAt: -1
        });

    // 2. Get all exam attempts made by this student
    const attempts =
      await ExamAttempt.find({
        student: studentId
      }).select("exam");

    // 3. Create a Set containing exam IDs
    //    that already have an attempt
    const attemptedExamIds = new Set(
      attempts.map((attempt) =>
        attempt.exam.toString()
      )
    );

    // 4. Remove exams that already have an attempt
    const availableExams = assignments.filter(
      (assignment) => {
        if (!assignment.exam) {
          return false;
        }

        return !attemptedExamIds.has(
          assignment.exam._id.toString()
        );
      }
    );

    // 5. Return only exams that have not been started
    const exams = availableExams.map(
      (assignment) => ({
        assignmentId: assignment._id,
        exam: assignment.exam
      })
    );

    res.json({
      exams
    });
  } catch (error) {
    console.error(
      "Get my exams error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  assignExamToStudent,
  getExamAssignments,
  getMyExams
};