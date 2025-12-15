import express from "express";
import {
  createReview,
  deleteReview,
  getAllReviews,
  getMyReviews,
  getReviewsForFood,
  updateReview,
} from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const reviewRouter = express.Router();

// Public: view reviews for a food
reviewRouter.get("/food/:foodId", getReviewsForFood);

// Authenticated routes
reviewRouter.get("/me", authMiddleware, getMyReviews);
reviewRouter.post("/food/:foodId", authMiddleware, createReview);
reviewRouter.put("/:reviewId", authMiddleware, updateReview);
reviewRouter.delete("/:reviewId", authMiddleware, deleteReview);

// Public: list all reviews (for visibility/testing)
reviewRouter.get("/", getAllReviews);

export default reviewRouter;

