const ExamAssignment = require("../models/ExamAssignment");
const Exam = require("../models/Exam");
const User = require("../models/User");
const Batch = require("../models/Batch");
const HiringDrive = require("../models/HiringDrive");
const HiringDriveBatch = require("../models/HiringDriveBatch");
const HiringDriveExam = require("../models/HiringDriveExam");
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
    const assignments = await ExamAssignment.find({
      student: studentId
    })
      .populate(
        "exam",
        "title description duration totalMarks startDate endDate isPublished"
      )
      .sort({
        createdAt: -1
      });

    // 2. Get all attempts made by this student
    const attempts = await ExamAttempt.find({
      student: studentId
    }).select(
      "_id exam status startedAt submittedAt"
    );

    // 3. Create a map of examId -> attempt
    const attemptMap = new Map();

    attempts.forEach((attempt) => {
      attemptMap.set(
        attempt.exam.toString(),
        attempt
      );
    });

    // 4. Build student exam list
    const exams = assignments
      .filter((assignment) => {
        return assignment.exam;
      })
      .map((assignment) => {
        const exam = assignment.exam;

        const attempt = attemptMap.get(
          exam._id.toString()
        );

        // No attempt yet
        if (!attempt) {
          return {
            assignmentId: assignment._id,
            exam,
            attemptStatus: "NOT_STARTED",
            attemptId: null,
            startedAt: null
          };
        }

        // Exam is currently in progress
        if (
          attempt.status === "IN_PROGRESS"
        ) {
          return {
            assignmentId: assignment._id,
            exam,
            attemptStatus: "IN_PROGRESS",
            attemptId: attempt._id,
            startedAt: attempt.startedAt
          };
        }

        // Submitted / auto-submitted exams
        // should not appear in My Exams
        return null;
      })
      .filter(Boolean);

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
const assignExamToBatch = async (req, res) => {
  try {
    const { driveId, batchId, examId } = req.body;

    if (!driveId || !batchId || !examId) {
      return res.status(400).json({
        message: "driveId, batchId and examId are required"
      });
    }

    // 1. Check hiring drive
    const hiringDrive = await HiringDrive.findById(driveId);

    if (!hiringDrive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    // 2. Check batch
    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    // 3. Check exam
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // 4. Exam must be attached to this hiring drive
    const driveExam = await HiringDriveExam.findOne({
      hiringDrive: driveId,
      exam: examId,
      isActive: true
    });

    if (!driveExam) {
      return res.status(400).json({
        message: "This exam is not attached to the selected hiring drive"
      });
    }

    // 5. Batch must be attached to this hiring drive
    const driveBatch = await HiringDriveBatch.findOne({
      hiringDrive: driveId,
      batch: batchId,
      isActive: true
    });

    if (!driveBatch) {
      return res.status(400).json({
        message: "This batch is not attached to the selected hiring drive"
      });
    }

    // 6. Find active students in this batch
    const students = await User.find({
      role: "STUDENT",
      batch: batchId,
      isActive: true
    }).select("_id name email username");

    if (students.length === 0) {
      return res.status(400).json({
        message: "No active students found in this batch"
      });
    }

    // 7. Check existing assignments
    const studentIds = students.map((student) => student._id);

    const existingAssignments = await ExamAssignment.find({
      exam: examId,
      student: { $in: studentIds }
    }).select("student");

    const existingStudentIds = new Set(
      existingAssignments.map((item) => item.student.toString())
    );

    // 8. Create assignments only for students
    // who don't already have this exam
    const assignmentsToCreate = students
      .filter(
        (student) => !existingStudentIds.has(student._id.toString())
      )
      .map((student) => ({
        exam: examId,
        student: student._id
      }));

    let createdAssignments = [];

    if (assignmentsToCreate.length > 0) {
      createdAssignments = await ExamAssignment.insertMany(
        assignmentsToCreate,
        { ordered: false }
      );
    }

    const alreadyAssigned = students.length - createdAssignments.length;

    res.status(201).json({
      message: "Exam assigned to batch successfully",
      summary: {
        totalStudents: students.length,
        assigned: createdAssignments.length,
        alreadyAssigned
      }
    });
  } catch (error) {
    console.error("Assign exam to batch error:", error);

    res.status(500).json({
      message: "Failed to assign exam to batch"
    });
  }
};
const assignExamByScope = async (req, res) => {
  try {
    const {
      driveId,
      examId,
      assignmentType,
      collegeId,
      batchId,
      branch
    } = req.body;

    // -----------------------------------------
    // 1. Basic validation
    // -----------------------------------------

    if (
      !driveId ||
      !examId ||
      !assignmentType
    ) {
      return res.status(400).json({
        message:
          "driveId, examId and assignmentType are required"
      });
    }

    if (
      !["COLLEGE", "BATCH", "BRANCH"].includes(
        assignmentType
      )
    ) {
      return res.status(400).json({
        message: "Invalid assignment type"
      });
    }

    // -----------------------------------------
    // 2. Check hiring drive
    // -----------------------------------------

    const hiringDrive =
      await HiringDrive.findById(driveId);

    if (!hiringDrive) {
      return res.status(404).json({
        message: "Hiring drive not found"
      });
    }

    // -----------------------------------------
    // 3. Check exam
    // -----------------------------------------

    const exam =
      await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    // -----------------------------------------
    // 4. Exam must belong to this drive
    // -----------------------------------------

    const driveExam =
      await HiringDriveExam.findOne({
        hiringDrive: driveId,
        exam: examId,
        isActive: true
      });

    if (!driveExam) {
      return res.status(400).json({
        message:
          "This exam is not attached to the selected hiring drive"
      });
    }

    // -----------------------------------------
    // 5. Get participating batches
    // -----------------------------------------

    const participatingBatches =
      await HiringDriveBatch.find({
        hiringDrive: driveId,
        isActive: true
      }).populate(
        "batch",
        "name year college branches"
      );

    if (participatingBatches.length === 0) {
      return res.status(400).json({
        message:
          "No batches have been added to this hiring drive"
      });
    }

    // -----------------------------------------
    // 6. Determine eligible students
    // -----------------------------------------

    let studentFilter = {
      role: "STUDENT",
      isActive: true
    };

    // -----------------------------------------
    // COLLEGE
    // -----------------------------------------

    if (assignmentType === "COLLEGE") {
      if (!collegeId) {
        return res.status(400).json({
          message:
            "collegeId is required for college assignment"
        });
      }

     const collegeBatches =
  participatingBatches.filter(
    (item) =>
      item.college?._id?.toString() ===
      collegeId.toString()
  );

      if (collegeBatches.length === 0) {
        return res.status(400).json({
          message:
            "This college has no participating batches in the selected hiring drive"
        });
      }

      /*
       * Important:
       * College assignment applies to students
       * belonging to the participating batches of
       * this college.
       */

      const batchIds = collegeBatches
        .map((item) => item.batch?._id)
        .filter(Boolean);

      studentFilter.batch = {
        $in: batchIds
      };
    }

    // -----------------------------------------
    // BATCH
    // -----------------------------------------

    if (assignmentType === "BATCH") {
      if (!batchId) {
        return res.status(400).json({
          message:
            "batchId is required for batch assignment"
        });
      }

      const driveBatch =
        participatingBatches.find(
          (item) =>
            item.batch?._id?.toString() ===
            batchId.toString()
        );

      if (!driveBatch) {
        return res.status(400).json({
          message:
            "This batch is not participating in the selected hiring drive"
        });
      }

      studentFilter.batch = batchId;
    }

    // -----------------------------------------
    // BRANCH
    // -----------------------------------------

    if (assignmentType === "BRANCH") {
      if (!batchId || !branch) {
        return res.status(400).json({
          message:
            "batchId and branch are required for branch assignment"
        });
      }

      const driveBatch =
        participatingBatches.find(
          (item) =>
            item.batch?._id?.toString() ===
            batchId.toString()
        );

      if (!driveBatch) {
        return res.status(400).json({
          message:
            "This batch is not participating in the selected hiring drive"
        });
      }

      const selectedBranch =
        (driveBatch.batch?.branches || []).find(
          (item) =>
            item.code?.toUpperCase() ===
            branch.toUpperCase()
        );

      if (!selectedBranch) {
        return res.status(400).json({
          message:
            "Selected branch does not exist in this batch"
        });
      }

      studentFilter.batch = batchId;
      studentFilter.branch =
        selectedBranch.code;
    }

    // -----------------------------------------
    // 7. Find eligible students
    // -----------------------------------------

    const students =
      await User.find(studentFilter).select(
        "_id name email username college batch branch"
      );

    if (students.length === 0) {
      return res.status(400).json({
        message:
          "No active students found for the selected assignment scope"
      });
    }

    // -----------------------------------------
    // 8. Check existing assignments
    // -----------------------------------------

    const studentIds =
      students.map(
        (student) => student._id
      );

    const existingAssignments =
      await ExamAssignment.find({
        exam: examId,
        student: {
          $in: studentIds
        }
      }).select("student");

    const existingStudentIds =
      new Set(
        existingAssignments.map(
          (item) =>
            item.student.toString()
        )
      );

    // -----------------------------------------
    // 9. Create new assignments
    // -----------------------------------------

    const assignmentsToCreate =
      students
        .filter(
          (student) =>
            !existingStudentIds.has(
              student._id.toString()
            )
        )
        .map(
          (student) => ({
            exam: examId,
            student: student._id
          })
        );

    let createdAssignments = [];

    if (
      assignmentsToCreate.length > 0
    ) {
      createdAssignments =
        await ExamAssignment.insertMany(
          assignmentsToCreate,
          {
            ordered: false
          }
        );
    }

    const alreadyAssigned =
      students.length -
      createdAssignments.length;

    // -----------------------------------------
    // 10. Response
    // -----------------------------------------

    res.status(201).json({
      message:
        "Exam assigned successfully",

      summary: {
        assignmentType,
        totalStudents:
          students.length,
        assigned:
          createdAssignments.length,
        alreadyAssigned
      }
    });

  } catch (error) {
    console.error(
      "Assign exam by scope error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to assign exam"
    });
  }
};
module.exports = {
  assignExamToStudent,
  assignExamToBatch,
  getExamAssignments,
  getMyExams,
  assignExamByScope
};