const mongoose = require("mongoose");

const hiringDriveSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "DRAFT"
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
  "HiringDrive",
  hiringDriveSchema
);