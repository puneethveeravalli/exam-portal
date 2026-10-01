const mongoose = require("mongoose");

const examSectionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    questionCount: {
      type: Number,
      required: true,
      min: 1
    },

    marksPerQuestion: {
      type: Number,
      required: true,
      min: 1
    },

    selectionMode: {
      type: String,
      enum: ["RANDOM", "MANUAL"],
      default: "RANDOM"
    },

    difficulty: {
      type: String,
      enum: ["ANY", "EASY", "MEDIUM", "HARD"],
      default: "ANY"
    },

    order: {
      type: Number,
      default: 0
    },

    questionsGenerated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

examSectionSchema.index({
  exam: 1,
  order: 1
});

module.exports = mongoose.model(
  "ExamSection",
  examSectionSchema
);
