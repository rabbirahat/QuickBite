import express from "express";
import {
  getUserRecommendations,
  getMyRecommendations,
} from "../controllers/recommendationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const recommendationRouter = express.Router();

// Get recommendations for authenticated user
recommendationRouter.get("/me", authMiddleware, getMyRecommendations);

// Get recommendations for a specific user (admin or for testing)
recommendationRouter.get("/:userId", getUserRecommendations);

export default recommendationRouter;

