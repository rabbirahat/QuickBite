import reviewModel from "../models/reviewModel.js";
import foodModel from "../models/foodModel.js";
import { performNMF, predictUserRatings, getTopRecommendations } from "../services/nmfService.js";
import mongoose from "mongoose";

/**
 * Build user-item rating matrix from reviews
 * 
 * @param {Array} reviews - All reviews from database
 * @param {Array} users - All user IDs
 * @param {Array} foods - All food IDs
 * @returns {Object} {matrix, userIndexMap, itemIndexMap}
 */
function buildRatingMatrix(reviews, users, foods) {
  // Create maps for quick lookup
  const userIndexMap = new Map(); // userId -> index
  const itemIndexMap = new Map(); // foodId -> index
  const reverseUserMap = []; // index -> userId
  const reverseItemMap = []; // index -> foodId

  // Build user index map
  users.forEach((userId, index) => {
    userIndexMap.set(userId.toString(), index);
    reverseUserMap[index] = userId.toString();
  });

  // Build item index map
  foods.forEach((foodId, index) => {
    itemIndexMap.set(foodId.toString(), index);
    reverseItemMap[index] = foodId.toString();
  });

  // Initialize rating matrix with zeros
  const numUsers = users.length;
  const numItems = foods.length;
  const matrix = [];
  for (let i = 0; i < numUsers; i++) {
    matrix[i] = new Array(numItems).fill(0);
  }

  // Fill matrix with ratings
  reviews.forEach((review) => {
    const userId = review.user.toString();
    const foodId = review.food.toString();
    const userIdx = userIndexMap.get(userId);
    const itemIdx = itemIndexMap.get(foodId);

    if (userIdx !== undefined && itemIdx !== undefined) {
      // Use the main rating (1-5 stars)
      matrix[userIdx][itemIdx] = review.rating;
    }
  });

  return {
    matrix,
    userIndexMap,
    itemIndexMap,
    reverseUserMap,
    reverseItemMap
  };
}

/**
 * Get recommendations for a specific user using NMF
 * 
 * GET /api/recommendations/:userId
 */
export const getUserRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const topN = parseInt(req.query.topN) || 10; // Number of recommendations

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Fetch all reviews, users, and foods
    const reviews = await reviewModel.find({}).lean();
    const allFoods = await foodModel.find({}).lean();

    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: "No reviews available for recommendations",
        data: [],
      });
    }

    // Get unique user IDs from reviews
    const uniqueUserIds = [...new Set(reviews.map((r) => r.user.toString()))];
    
    // Check if the requested user exists in the reviews
    const userExists = uniqueUserIds.includes(userId);
    if (!userExists) {
      return res.json({
        success: true,
        message: "User has no ratings yet. Cannot generate recommendations.",
        data: [],
      });
    }

    // Build rating matrix
    const { matrix, userIndexMap, itemIndexMap, reverseItemMap } = buildRatingMatrix(
      reviews,
      uniqueUserIds,
      allFoods.map((f) => f._id.toString())
    );

    // Perform NMF
    const k = Math.min(20, Math.floor(Math.sqrt(Math.min(uniqueUserIds.length, allFoods.length))));
    console.log(`Performing NMF with k=${k} factors...`);
    
    const { W, H } = performNMF(matrix, k, 100, 0.001);

    // Get user index
    const userIndex = userIndexMap.get(userId);

    // Predict ratings for this user
    const predictedRatings = predictUserRatings(W, H, userIndex);

    // Get items the user has already rated
    const userReviews = reviews.filter((r) => r.user.toString() === userId);
    const ratedItemIndices = new Set(
      userReviews.map((r) => {
        const foodId = r.food.toString();
        return itemIndexMap.get(foodId);
      }).filter((idx) => idx !== undefined)
    );

    // Get top recommendations
    const topRecommendations = getTopRecommendations(
      predictedRatings,
      ratedItemIndices,
      topN
    );

    // Map recommendations to actual food items
    const recommendations = topRecommendations.map((rec) => {
      const foodId = reverseItemMap[rec.itemIndex];
      const food = allFoods.find((f) => f._id.toString() === foodId);
      return {
        food: food,
        predictedRating: parseFloat(rec.predictedRating.toFixed(2)),
        itemIndex: rec.itemIndex
      };
    }).filter((rec) => rec.food !== undefined); // Filter out any missing foods

    res.json({
      success: true,
      message: `Generated ${recommendations.length} recommendations`,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error while generating recommendations",
    });
  }
};

/**
 * Get recommendations for the currently authenticated user
 * 
 * GET /api/recommendations/me
 */
export const getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const topN = parseInt(req.query.topN) || 10;

    // Fetch all reviews, users, and foods
    const reviews = await reviewModel.find({}).lean();
    const allFoods = await foodModel.find({}).lean();

    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: "No reviews available for recommendations",
        data: [],
      });
    }

    // Get unique user IDs from reviews
    const uniqueUserIds = [...new Set(reviews.map((r) => r.user.toString()))];
    
    // Check if the user has any ratings
    const userExists = uniqueUserIds.includes(userId);
    if (!userExists) {
      return res.json({
        success: true,
        message: "You have no ratings yet. Rate some foods to get personalized recommendations!",
        data: [],
      });
    }

    // Build rating matrix
    const { matrix, userIndexMap, itemIndexMap, reverseItemMap } = buildRatingMatrix(
      reviews,
      uniqueUserIds,
      allFoods.map((f) => f._id.toString())
    );

    // Perform NMF
    const k = Math.min(20, Math.floor(Math.sqrt(Math.min(uniqueUserIds.length, allFoods.length))));
    console.log(`Performing NMF with k=${k} factors for user ${userId}...`);
    
    const { W, H } = performNMF(matrix, k, 100, 0.001);

    // Get user index
    const userIndex = userIndexMap.get(userId);

    // Predict ratings for this user
    const predictedRatings = predictUserRatings(W, H, userIndex);

    // Get items the user has already rated
    const userReviews = reviews.filter((r) => r.user.toString() === userId);
    const ratedItemIndices = new Set(
      userReviews.map((r) => {
        const foodId = r.food.toString();
        return itemIndexMap.get(foodId);
      }).filter((idx) => idx !== undefined)
    );

    // Get top recommendations
    const topRecommendations = getTopRecommendations(
      predictedRatings,
      ratedItemIndices,
      topN
    );

    // Map recommendations to actual food items
    const recommendations = topRecommendations.map((rec) => {
      const foodId = reverseItemMap[rec.itemIndex];
      const food = allFoods.find((f) => f._id.toString() === foodId);
      return {
        food: food,
        predictedRating: parseFloat(rec.predictedRating.toFixed(2)),
        itemIndex: rec.itemIndex
      };
    }).filter((rec) => rec.food !== undefined);

    res.json({
      success: true,
      message: `Generated ${recommendations.length} recommendations for you`,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error while generating recommendations",
    });
  }
};

