const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: [
        "IN_PROGRESS",
        "SUBMITTED",
        "AUTO_SUBMITTED"
      ],
      default: "IN_PROGRESS"
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    submittedAt: {
      type: Date,
      default: null
    },

   answers: [
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamQuestion",
      required: true
    },
    selectedAnswer: {
      type: Number,
      min: 0,
      max: 3,
      default: null
    }
  }
],

    score: {
      type: Number,
      default: 0
    },

    violationCount: {
      type: Number,
      default: 0
    },

    proctoringEvents: [
      {
        type: {
          type: String,
          required: true
        },

        message: {
          type: String,
          default: ""
        },

        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },

  {
    timestamps: true
  }
);

examAttemptSchema.index(
  {
    exam: 1,
    student: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "ExamAttempt",
  examAttemptSchema
);