const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSection",
      required: true
    },

    // Reference to the original Question Bank question
    sourceQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null
    },

    // Snapshot of the question at the time it is added to the exam
    questionText: {
      type: String,
      required: true,
      trim: true
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return options.length === 4;
        },
        message: "A question must have exactly 4 options"
      }
    },

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },

    marks: {
      type: Number,
      required: true,
      min: 1
    },

    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

examQuestionSchema.index({
  exam: 1,
  section: 1,
  order: 1
});

module.exports = mongoose.model(
  "ExamQuestion",
  examQuestionSchema
);