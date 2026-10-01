const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    // Existing field.
    // Kept temporarily so current exam/question functionality
    // continues to work.
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      default: null
    },

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

    // Keep this for existing questions.
    // For Question Bank questions, marks will eventually
    // be determined by the exam section.
    marks: {
      type: Number,
      default: 1,
      min: 1
    },

    // Question Bank information
    category: {
      type: String,
      required: true,
      trim: true
    },

    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Question",
  questionSchema
);