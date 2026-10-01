const mongoose = require("mongoose");

const hiringDriveBatchSchema = new mongoose.Schema(
  {
    hiringDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HiringDrive",
      required: true
    },

    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true
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

hiringDriveBatchSchema.index(
  {
    hiringDrive: 1,
    batch: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "HiringDriveBatch",
  hiringDriveBatchSchema
);