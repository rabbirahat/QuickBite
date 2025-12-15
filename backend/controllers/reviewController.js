import reviewModel from "../models/reviewModel.js";
import mongoose from "mongoose";
import foodModel from "../models/foodModel.js";

// Create a new review for a food (one per user per food)
export const createReview = async (req, res) => {
  try {
    const { foodId } = req.params;
    const {
      rating,
      comment,
      qualityRating,
      categoryRating,
      priceSatisfaction,
    } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    // If the id looks like a Mongo ObjectId, validate existence; otherwise allow (supports seeded string ids)
    if (mongoose.Types.ObjectId.isValid(foodId)) {
      const food = await foodModel.findById(foodId);
      if (!food) {
        return res.status(404).json({
          success: false,
          message: "Food not found",
        });
      }
    }

    const existing = await reviewModel.findOne({
      food: foodId,
      user: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this food. Please edit your review instead.",
      });
    }

    const review = await reviewModel.create({
      food: foodId,
      user: req.user._id,
      rating,
      comment,
      qualityRating,
      categoryRating,
      priceSatisfaction,
    });

    const populated = await review.populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error while creating review",
    });
  }
};

// Get all reviews for a specific food
export const getReviewsForFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const reviews = await reviewModel
      .find({ food: foodId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching reviews",
    });
  }
};

// Get reviews for the logged in user
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching your reviews",
    });
  }
};

// Update a review (owner only)
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      rating,
      comment,
      qualityRating,
      categoryRating,
      priceSatisfaction,
    } = req.body;

    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    if (qualityRating !== undefined) review.qualityRating = qualityRating;
    if (categoryRating !== undefined) review.categoryRating = categoryRating;
    if (priceSatisfaction !== undefined)
      review.priceSatisfaction = priceSatisfaction;

    await review.save();
    const populated = await review.populate("user", "name email");

    res.json({
      success: true,
      message: "Review updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating review",
    });
  }
};

// Delete a review (owner only)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    await reviewModel.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Error while deleting review",
    });
  }
};

// Get all reviews (for visibility/testing)
export const getAllReviews = async (_req, res) => {
  try {
    const reviews = await reviewModel
      .find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching all reviews",
    });
  }
};

