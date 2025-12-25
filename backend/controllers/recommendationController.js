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
  let ratingCount = 0;
  reviews.forEach((review) => {
    const userId = review.user.toString();
    const foodId = review.food.toString();
    const userIdx = userIndexMap.get(userId);
    const itemIdx = itemIndexMap.get(foodId);

    if (userIdx !== undefined && itemIdx !== undefined) {
      // Use the main rating (1-5 stars)
      matrix[userIdx][itemIdx] = review.rating;
      ratingCount++;
    } else {
      console.warn(`Skipping review: userIdx=${userIdx}, itemIdx=${itemIdx} for userId=${userId}, foodId=${foodId}`);
    }
  });

  console.log(`Built rating matrix: ${numUsers} users × ${numItems} items, ${ratingCount} ratings filled`);

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
    const topN = parseInt(req.query.topN) || 5; // Number of recommendations

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

    // Perform NMF - use smaller k for sparse data
    const k = Math.min(10, Math.max(2, Math.floor(Math.sqrt(Math.min(uniqueUserIds.length, allFoods.length)))));
    console.log(`Performing NMF with k=${k} factors for ${uniqueUserIds.length} users and ${allFoods.length} items...`);
    
    const { W, H, error } = performNMF(matrix, k, 200, 0.0001);
    console.log(`NMF completed with final error: ${error.toFixed(4)}`);

    // Get user index
    const userIndex = userIndexMap.get(userId);

    // Predict ratings for this user
    const predictedRatings = predictUserRatings(W, H, userIndex);
    
    // Debug: Log some predictions
    if (predictedRatings.length > 0) {
      const maxPred = Math.max(...predictedRatings);
      const minPred = predictedRatings.filter(r => r > 0).length > 0 
        ? Math.min(...predictedRatings.filter(r => r > 0))
        : 0;
      const nonZeroCount = predictedRatings.filter(r => r > 0).length;
      const avgPred = predictedRatings.reduce((a, b) => a + b, 0) / predictedRatings.length;
      console.log(`User ${userId} predictions: max=${maxPred.toFixed(2)}, min=${minPred.toFixed(2)}, avg=${avgPred.toFixed(2)}, non-zero count=${nonZeroCount}`);
      console.log(`First 5 predictions: [${predictedRatings.slice(0, 5).map(r => r.toFixed(2)).join(', ')}]`);
    }

    // Get items the user has already rated
    const userReviews = reviews.filter((r) => r.user.toString() === userId);
    const ratedItemIndices = new Set(
      userReviews.map((r) => {
        const foodId = r.food.toString();
        return itemIndexMap.get(foodId);
      }).filter((idx) => idx !== undefined)
    );

    console.log(`User ${userId} has rated ${ratedItemIndices.size} items`);

    // Get top recommendations
    let topRecommendations = getTopRecommendations(
      predictedRatings,
      ratedItemIndices,
      topN
    );
    
    // If all predictions are zero or very small, use popularity-based fallback
    if (topRecommendations.length > 0) {
      const maxRating = Math.max(...topRecommendations.map(r => r.predictedRating));
      if (maxRating < 0.1) {
        console.log(`WARNING: All predictions are near zero (max=${maxRating.toFixed(4)}). Using popularity fallback.`);
        // Fallback: recommend items with most ratings from other users
        const itemRatingCounts = {};
        reviews.forEach((r) => {
          const foodId = r.food.toString();
          const itemIdx = itemIndexMap.get(foodId);
          if (itemIdx !== undefined && !ratedItemIndices.has(itemIdx)) {
            itemRatingCounts[itemIdx] = (itemRatingCounts[itemIdx] || 0) + 1;
          }
        });
        
        topRecommendations = Object.entries(itemRatingCounts)
          .map(([idx, count]) => ({
            itemIndex: parseInt(idx),
            predictedRating: Math.min(5, 2.5 + (count * 0.1)) // Scale popularity to 2.5-5 range
          }))
          .sort((a, b) => b.predictedRating - a.predictedRating)
          .slice(0, topN);
        
        console.log(`Using popularity fallback: ${topRecommendations.length} items`);
      }
    }

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
    
    console.log(`Final recommendations for user ${userId}: ${recommendations.length} items`);
    if (recommendations.length > 0) {
      console.log(`Recommendations: ${recommendations.map(r => `${r.food.name} (${r.predictedRating.toFixed(2)})`).join(', ')}`);
    }

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
    const topN = parseInt(req.query.topN) || 5;

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

    // Perform NMF - use smaller k for sparse data
    const k = Math.min(10, Math.max(2, Math.floor(Math.sqrt(Math.min(uniqueUserIds.length, allFoods.length)))));
    console.log(`Performing NMF with k=${k} factors for ${uniqueUserIds.length} users and ${allFoods.length} items (user: ${userId})...`);
    
    const { W, H, error } = performNMF(matrix, k, 200, 0.0001);
    console.log(`NMF completed with final error: ${error.toFixed(4)}`);

    // Get user index
    const userIndex = userIndexMap.get(userId);

    // Predict ratings for this user
    const predictedRatings = predictUserRatings(W, H, userIndex);
    
    // Debug: Log some predictions
    if (predictedRatings.length > 0) {
      const maxPred = Math.max(...predictedRatings);
      const minPred = predictedRatings.filter(r => r > 0).length > 0 
        ? Math.min(...predictedRatings.filter(r => r > 0))
        : 0;
      const nonZeroCount = predictedRatings.filter(r => r > 0).length;
      const avgPred = predictedRatings.reduce((a, b) => a + b, 0) / predictedRatings.length;
      console.log(`User ${userId} predictions: max=${maxPred.toFixed(2)}, min=${minPred.toFixed(2)}, avg=${avgPred.toFixed(2)}, non-zero count=${nonZeroCount}`);
      console.log(`First 5 predictions: [${predictedRatings.slice(0, 5).map(r => r.toFixed(2)).join(', ')}]`);
    }

    // Get items the user has already rated
    const userReviews = reviews.filter((r) => r.user.toString() === userId);
    const ratedItemIndices = new Set(
      userReviews.map((r) => {
        const foodId = r.food.toString();
        return itemIndexMap.get(foodId);
      }).filter((idx) => idx !== undefined)
    );

    console.log(`User ${userId} has rated ${ratedItemIndices.size} items`);

    // Get top recommendations
    let topRecommendations = getTopRecommendations(
      predictedRatings,
      ratedItemIndices,
      topN
    );
    
    // If all predictions are zero or very small, use popularity-based fallback
    if (topRecommendations.length > 0) {
      const maxRating = Math.max(...topRecommendations.map(r => r.predictedRating));
      if (maxRating < 0.1) {
        console.log(`WARNING: All predictions are near zero (max=${maxRating.toFixed(4)}). Using popularity fallback.`);
        // Fallback: recommend items with most ratings from other users
        const itemRatingCounts = {};
        reviews.forEach((r) => {
          const foodId = r.food.toString();
          const itemIdx = itemIndexMap.get(foodId);
          if (itemIdx !== undefined && !ratedItemIndices.has(itemIdx)) {
            itemRatingCounts[itemIdx] = (itemRatingCounts[itemIdx] || 0) + 1;
          }
        });
        
        topRecommendations = Object.entries(itemRatingCounts)
          .map(([idx, count]) => ({
            itemIndex: parseInt(idx),
            predictedRating: Math.min(5, 2.5 + (count * 0.1)) // Scale popularity to 2.5-5 range
          }))
          .sort((a, b) => b.predictedRating - a.predictedRating)
          .slice(0, topN);
        
        console.log(`Using popularity fallback: ${topRecommendations.length} items`);
      }
    }
    
    console.log(`Found ${topRecommendations.length} recommendations for user ${userId}`);
    if (topRecommendations.length > 0) {
      console.log(`Top recommendation: item ${topRecommendations[0].itemIndex} with rating ${topRecommendations[0].predictedRating.toFixed(2)}`);
    }

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

