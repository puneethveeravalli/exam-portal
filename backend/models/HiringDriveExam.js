const mongoose = require("mongoose");

const hiringDriveExamSchema = new mongoose.Schema(
  {
    hiringDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HiringDrive",
      required: true
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
  );

hiringDriveExamSchema.index(
  { hiringDrive: 1, exam: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "HiringDriveExam",
  hiringDriveExamSchema
);