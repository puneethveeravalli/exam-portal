const mongoose = require("mongoose");

const examAssignmentSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

examAssignmentSchema.index(
  {
    exam: 1,
    student: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "ExamAssignment",
  examAssignmentSchema
);