const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    dateOfBirth: {
      type: Date,
      required: true
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    plainPassword: {
      type: String,
      default: null
    },

    role: {
      type: String,
      enum: ["ADMIN", "STUDENT"],
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Organization details for students
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null
    },

    branch: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);