import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Store the food identifier as string so it works for seed/static ids too
    food: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per food to simplify edit/update logic
reviewSchema.index({ food: 1, user: 1 }, { unique: true });

const reviewModel =
  mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;

