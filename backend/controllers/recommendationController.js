import reviewModel from "../models/reviewModel.js";
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import { performNMF, predictUserRatings, getTopRecommendations } from "../services/nmfService.js";
import mongoose from "mongoose";

// Static food list mapping (for frontend static foods with IDs "1", "2", "3"...)
// This matches the frontend assets.js food_list
const STATIC_FOOD_MAP = {
  "1": { name: "Cheese Pasta", image: "", description: "Delicious Food, healthy", category: "Pasta", price: 150 },
  "2": { name: "Tomato Pasta", image: "", description: "Delicious Food, healthy", category: "Pasta", price: 120 },
  "3": { name: "Creamy Pasta", image: "", description: "Delicious Food, healthy", category: "Pasta", price: 100 },
  "4": { name: "Chicken Pasta", image: "", description: "Delicious Food, healthy", category: "Pasta", price: 130 },
  "5": { name: "Greek salad", image: "", description: "Delicious Food, healthy", category: "Salad", price: 100 },
  "6": { name: "Veg salad", image: "", description: "Delicious Food, healthy", category: "Salad", price: 90 },
  "7": { name: "Clover Salad", image: "", description: "Delicious Food, healthy", category: "Salad", price: 80 },
  "8": { name: "Chicken Salad", image: "", description: "Delicious Food, healthy", category: "Salad", price: 120 },
  "9": { name: "Ripple Ice Cream", image: "", description: "Delicious Food, healthy", category: "Deserts", price: 120 },
  "10": { name: "Fruit Ice Cream", image: "", description: "Delicious Food, healthy", category: "Deserts", price: 140 },
  "11": { name: "Jar Ice Cream", image: "", description: "Delicious Food, healthy", category: "Deserts", price: 160 },
  "12": { name: "Vanilla Ice Cream", image: "", description: "Delicious Food, healthy", category: "Deserts", price: 180 },
  "13": { name: "Chicken Sandwich", image: "", description: "Delicious Food, healthy", category: "Sandwich", price: 100 },
  "14": { name: "Vegan Sandwich", image: "", description: "Delicious Food, healthy", category: "Sandwich", price: 90 },
  "15": { name: "Grilled Sandwich", image: "", description: "Delicious Food, healthy", category: "Sandwich", price: 80 },
  "16": { name: "Bread Sandwich", image: "", description: "Delicious Food, healthy", category: "Sandwich", price: 70 },
  "17": { name: "Buttter Noodles", image: "", description: "Delicious Food, healthy", category: "Noodles", price: 60 },
  "18": { name: "Veg Noodles", image: "", description: "Delicious Food, healthy", category: "Noodles", price: 70 },
  "19": { name: "Somen Noodles", image: "", description: "Delicious Food, healthy", category: "Noodles", price: 100 },
  "20": { name: "Cooked Noodles", image: "", description: "Delicious Food, healthy", category: "Noodles", price: 90 },
  "21": { name: "Cup Cake", image: "", description: "Delicious Food, healthy", category: "Cake", price: 100 },
  "22": { name: "Vegan Cake", image: "", description: "Delicious Food, healthy", category: "Cake", price: 110 },
  "23": { name: "Butterscotch Cake", image: "", description: "Delicious Food, healthy", category: "Cake", price: 150 },
  "24": { name: "Sliced Cake", image: "", description: "Delicious Food, healthy", category: "Cake", price: 120 },
};

/**
 * Get food name by ID (from database or static list)
 */
async function getFoodName(foodId, allFoods) {
  // Try database first
  const dbFood = allFoods.find((f) => f._id.toString() === foodId);
  if (dbFood) return dbFood.name;
  
  // Try static list
  if (STATIC_FOOD_MAP[foodId]) {
    return STATIC_FOOD_MAP[foodId].name;
  }
  
  return `Food ${foodId}`;
}

/**
 * Get food data by ID (from database or static list)
 */
async function getFoodData(foodId, allFoods) {
  // Try database first
  const dbFood = allFoods.find((f) => f._id.toString() === foodId);
  if (dbFood) return dbFood;
  
  // Try static list
  if (STATIC_FOOD_MAP[foodId]) {
    return {
      _id: foodId,
      ...STATIC_FOOD_MAP[foodId],
      // For images, we'll need to handle this - but for now return as is
      image: dbFood?.image || ""
    };
  }
  
  return null;
}

/**
 * Get user name by ID
 */
async function getUserName(userId) {
  try {
    const user = await userModel.findById(userId).lean();
    return user ? user.name : `User ${userId}`;
  } catch (error) {
    return `User ${userId}`;
  }
}

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
    
    // Get user name for logging
    const userName = await getUserName(userId);

    console.log(`=== Recommendation Request for User: ${userName} (${userId}) ===`);
    console.log(`Total reviews: ${reviews.length}`);
    console.log(`Total foods in database: ${allFoods.length}`);

    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: "No reviews available for recommendations",
        data: [],
      });
    }

    // Get unique user IDs from reviews
    const uniqueUserIds = [...new Set(reviews.map((r) => r.user.toString()))];
    console.log(`Unique users with reviews: ${uniqueUserIds.length}`);
    
    // Check if the requested user exists in the reviews
    const userExists = uniqueUserIds.includes(userId);
    if (!userExists) {
      console.log(`User ${userName} (${userId}) not found in reviews`);
      return res.json({
        success: true,
        message: "User has no ratings yet. Cannot generate recommendations.",
        data: [],
      });
    }

    // Get unique food IDs from reviews (these might be static IDs like "1", "2" or ObjectIds)
    const uniqueFoodIdsFromReviews = [...new Set(reviews.map((r) => r.food.toString()))];
    console.log(`Unique food IDs in reviews: ${uniqueFoodIdsFromReviews.length}`);
    
    // Get food names for sample IDs (first 5) - these are just for display, not random
    // WHY 5? It's just a sample to show what food IDs are in reviews. Not random - it's the first 5 found.
    // These IDs are FIXED - they represent actual foods users have rated. Same for all users.
    const sampleFoodIds = uniqueFoodIdsFromReviews.slice(0, 5);
    const sampleFoodNames = await Promise.all(
      sampleFoodIds.map(id => getFoodName(id, allFoods))
    );
    console.log(`Sample food IDs from reviews (first 5): ${sampleFoodIds.map((id, i) => `${sampleFoodNames[i]} (ID: ${id})`).join(', ')}`);
    console.log(`Note: These are the first 5 food IDs found in reviews (not random). They represent foods that users have rated.`);
    console.log(`These IDs are FIXED - same for all users. They show which foods have been rated in the system.`);
    
    const sampleDbFoods = allFoods.slice(0, 5).map(f => `${f.name} (ID: ${f._id.toString().substring(0, 8)}...)`);
    console.log(`Sample food IDs from database (first 5): ${sampleDbFoods.join(', ')}`);

    // Build a combined food list: database foods + any food IDs from reviews that aren't in database
    // This ensures ALL food IDs from reviews are included, even if they're not in the database
    // Example: If reviews have IDs "1", "2", "3" (static) and database has ObjectIds, we combine both
    const allFoodIds = [...new Set([...allFoods.map((f) => f._id.toString()), ...uniqueFoodIdsFromReviews])];
    console.log(`Combined food IDs for matrix: ${allFoodIds.length}`);
    console.log(`Explanation: This includes ${allFoods.length} database foods + ${uniqueFoodIdsFromReviews.length} review food IDs.`);
    console.log(`Some overlap may exist, so total unique = ${allFoodIds.length}. This ensures all reviews are included in the matrix.`);
    console.log(`WHY ${allFoodIds.length}? Because we need to include ALL food IDs that appear in reviews, even if they're not in the database.`);
    console.log(`This allows the matrix to properly map all ratings, regardless of whether food IDs match between reviews and database.`);

    // Build rating matrix using all food IDs (both database and review food IDs)
    const { matrix, userIndexMap, itemIndexMap, reverseItemMap } = buildRatingMatrix(
      reviews,
      uniqueUserIds,
      allFoodIds
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

    console.log(`Found ${topRecommendations.length} recommendations for user ${userName}`);
    if (topRecommendations.length > 0) {
      const topFoodId = reverseItemMap[topRecommendations[0].itemIndex];
      const topFoodName = await getFoodName(topFoodId, allFoods);
      console.log(`Top recommendation: ${topFoodName} with rating ${topRecommendations[0].predictedRating.toFixed(2)}`);
    }

    // Map recommendations to actual food items
    const recommendations = await Promise.all(
      topRecommendations.map(async (rec) => {
        const foodId = reverseItemMap[rec.itemIndex];
        // Try to get food data from database or static list
        let food = await getFoodData(foodId, allFoods);
        
        // If not found, create a minimal placeholder
        if (!food) {
          const foodName = await getFoodName(foodId, allFoods);
          console.log(`Food "${foodName}" (ID: ${foodId}) not found in database, using placeholder data`);
          food = {
            _id: foodId,
            name: foodName,
            price: 100,
            description: "Recommended food",
            image: "",
            category: "Unknown"
          };
        } else {
          // Log if we found it
          console.log(`Food "${food.name}" (ID: ${foodId}) found successfully`);
        }
        
        return {
          food: food,
          predictedRating: parseFloat(rec.predictedRating.toFixed(2)),
          itemIndex: rec.itemIndex
        };
      })
    );
    
    console.log(`Mapped ${recommendations.length} recommendations (before filtering)`);
    
    // Only filter out if food is completely invalid
    const validRecommendations = recommendations.filter((rec) => rec.food && rec.food._id);
    console.log(`Valid recommendations after filtering: ${validRecommendations.length}`);
    
    if (validRecommendations.length > 0) {
      console.log(`Final Recommendations for ${userName}: ${validRecommendations.map(r => `${r.food.name} (${r.predictedRating.toFixed(2)})`).join(', ')}`);
    }

    res.json({
      success: true,
      message: `Generated ${validRecommendations.length} recommendations`,
      data: validRecommendations,
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
    
    // Get user name for logging
    const userName = await getUserName(userId);

    console.log(`=== Recommendation Request for User: ${userName} (${userId}) ===`);
    console.log(`Total reviews: ${reviews.length}`);
    console.log(`Total foods in database: ${allFoods.length}`);

    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: "No reviews available for recommendations",
        data: [],
      });
    }

    // Get unique user IDs from reviews
    const uniqueUserIds = [...new Set(reviews.map((r) => r.user.toString()))];
    console.log(`Unique users with reviews: ${uniqueUserIds.length}`);
    
    // Check if the user has any ratings
    const userExists = uniqueUserIds.includes(userId);
    if (!userExists) {
      console.log(`User ${userId} not found in reviews`);
      return res.json({
        success: true,
        message: "You have no ratings yet. Rate some foods to get personalized recommendations!",
        data: [],
      });
    }

    // Get unique food IDs from reviews (these might be static IDs like "1", "2" or ObjectIds)
    const uniqueFoodIdsFromReviews = [...new Set(reviews.map((r) => r.food.toString()))];
    console.log(`Unique food IDs in reviews: ${uniqueFoodIdsFromReviews.length}`);
    console.log(`Sample food IDs from reviews: ${uniqueFoodIdsFromReviews.slice(0, 5).join(', ')}`);
    console.log(`Sample food IDs from database: ${allFoods.slice(0, 5).map(f => f._id.toString()).join(', ')}`);

    // Build a combined food list: database foods + any food IDs from reviews that aren't in database
    const databaseFoodIds = new Set(allFoods.map((f) => f._id.toString()));
    const allFoodIds = [...new Set([...allFoods.map((f) => f._id.toString()), ...uniqueFoodIdsFromReviews])];
    console.log(`Combined food IDs for matrix: ${allFoodIds.length}`);

    // Build rating matrix using all food IDs (both database and review food IDs)
    const { matrix, userIndexMap, itemIndexMap, reverseItemMap } = buildRatingMatrix(
      reviews,
      uniqueUserIds,
      allFoodIds
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
    
    console.log(`Found ${topRecommendations.length} recommendations for user ${userName}`);
    if (topRecommendations.length > 0) {
      const topFoodId = reverseItemMap[topRecommendations[0].itemIndex];
      const topFoodName = await getFoodName(topFoodId, allFoods);
      console.log(`Top recommendation: ${topFoodName} with rating ${topRecommendations[0].predictedRating.toFixed(2)}`);
    }

    // Map recommendations to actual food items
    const recommendations = await Promise.all(
      topRecommendations.map(async (rec) => {
        const foodId = reverseItemMap[rec.itemIndex];
        // Try to get food data from database or static list
        let food = await getFoodData(foodId, allFoods);
        
        // If not found, create a minimal placeholder
        if (!food) {
          const foodName = await getFoodName(foodId, allFoods);
          console.log(`Food "${foodName}" (ID: ${foodId}) not found in database, using placeholder data`);
          food = {
            _id: foodId,
            name: foodName,
            price: 100,
            description: "Recommended food",
            image: "",
            category: "Unknown"
          };
        } else {
          // Log if we found it
          console.log(`Food "${food.name}" (ID: ${foodId}) found successfully`);
        }
        
        return {
          food: food,
          predictedRating: parseFloat(rec.predictedRating.toFixed(2)),
          itemIndex: rec.itemIndex
        };
      })
    );
    
    console.log(`Mapped ${recommendations.length} recommendations (before filtering)`);
    
    // Only filter out if food is completely invalid
    const validRecommendations = recommendations.filter((rec) => rec.food && rec.food._id);
    console.log(`Valid recommendations after filtering: ${validRecommendations.length}`);
    
    if (validRecommendations.length > 0) {
      console.log(`Final Recommendations for ${userName}: ${validRecommendations.map(r => `${r.food.name} (${r.predictedRating.toFixed(2)})`).join(', ')}`);
    }

    res.json({
      success: true,
      message: `Generated ${validRecommendations.length} recommendations for you`,
      data: validRecommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error while generating recommendations",
    });
  }
};

