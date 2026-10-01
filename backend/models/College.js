const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    location: {
      type: String,
      trim: true,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("College", collegeSchema);