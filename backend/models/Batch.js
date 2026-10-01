const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    branches: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        code: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

batchSchema.index(
  { college: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Batch", batchSchema);