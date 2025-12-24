# Non-Negative Matrix Factorization (NMF) Recommendations Guide

## 📚 Understanding NMF for Recommendations

### What is NMF?

**Non-Negative Matrix Factorization (NMF)** is a machine learning technique that decomposes a matrix into two smaller matrices with non-negative values. In the context of recommendation systems, it's used to discover hidden patterns in user-item rating data.

### How NMF Works for Recommendations

1. **Rating Matrix Creation**
   - We create a matrix where:
     - Rows = Users
     - Columns = Food Items
     - Values = Star ratings (1-5) that users gave to foods
   - Missing values (unrated items) are set to 0

2. **Matrix Factorization**
   - The rating matrix **R** (size: users × items) is factorized into:
     - **W** (users × k): User preference matrix - shows how much each user likes each "latent factor"
     - **H** (k × items): Item feature matrix - shows how much each item has each "latent factor"
   - **k** = number of latent factors (typically 10-50)
   - **Latent factors** are hidden patterns like "spicy foods", "affordable options", "healthy choices", etc.

3. **Prediction**
   - To predict a user's rating for an item: `predicted_rating = W[user] × H[item]`
   - This gives us ratings for items the user hasn't rated yet

4. **Recommendations**
   - We sort unrated items by predicted rating
   - Return the top N items with highest predicted ratings

### Why NMF?

- ✅ **Handles sparse data**: Works well even when users have rated few items
- ✅ **Discovers patterns**: Finds hidden relationships between users and items
- ✅ **Non-negative values**: Ratings are always positive, which makes sense
- ✅ **Interpretable**: The factors can represent meaningful categories

---

## 🏗️ Implementation Architecture

### Backend Structure

```
backend/
├── services/
│   └── nmfService.js          # Core NMF algorithm implementation
├── controllers/
│   └── recommendationController.js  # API endpoints for recommendations
├── routes/
│   └── recommendationRoute.js  # Route definitions
└── server.js                   # Registers recommendation routes
```

### Frontend Structure

```
frontend/src/
├── components/
│   └── Recommendations/
│       ├── Recommendations.jsx  # Recommendation display component
│       └── Recommendations.css # Styling
├── utils/
│   └── api.js                  # API client (includes recommendationAPI)
└── pages/
    └── Home/
        └── Home.jsx            # Includes Recommendations component
```

---

## 🔧 Step-by-Step Implementation Details

### Step 1: NMF Service (`backend/services/nmfService.js`)

**Key Functions:**

1. **`performNMF(ratingMatrix, k, maxIterations, tolerance)`**
   - Performs the matrix factorization
   - Uses multiplicative update rules (iterative optimization)
   - Returns `{W, H, error}` where:
     - `W`: User preference matrix
     - `H`: Item feature matrix
     - `error`: Reconstruction error (lower is better)

2. **`predictUserRatings(W, H, userId)`**
   - Predicts ratings for all items for a specific user
   - Formula: `rating = sum(W[user][factor] × H[factor][item])` for all factors

3. **`getTopRecommendations(predictedRatings, ratedItems, topN)`**
   - Filters out items the user has already rated
   - Sorts by predicted rating (descending)
   - Returns top N recommendations

**Algorithm Details:**
- Uses multiplicative update rules to ensure non-negativity
- Iteratively updates W and H until convergence
- Convergence is reached when error change is below tolerance

### Step 2: Recommendation Controller (`backend/controllers/recommendationController.js`)

**Endpoints:**

1. **`GET /api/recommendations/me`** (Authenticated)
   - Gets recommendations for the logged-in user
   - Returns food items with predicted ratings

2. **`GET /api/recommendations/:userId`** (Public/Admin)
   - Gets recommendations for a specific user
   - Useful for testing or admin features

**Process Flow:**
1. Fetch all reviews from database
2. Fetch all food items
3. Build user-item rating matrix
4. Perform NMF factorization
5. Predict ratings for the user
6. Filter out already-rated items
7. Return top N recommendations

### Step 3: Frontend API Client (`frontend/src/utils/api.js`)

**Functions:**
- `recommendationAPI.getMyRecommendations(topN)` - Get recommendations for current user
- `recommendationAPI.getUserRecommendations(userId, topN)` - Get recommendations for specific user

### Step 4: Recommendations Component (`frontend/src/components/Recommendations/Recommendations.jsx`)

**Features:**
- Fetches recommendations on mount
- Shows loading state
- Handles authentication (prompts login if not authenticated)
- Displays recommendations with predicted ratings
- Uses existing `FoodItem` component for consistency

**Props:**
- `topN` (default: 10) - Number of recommendations to show

### Step 5: Integration

**Home Page:**
- Recommendations appear at the top of the food display
- Shows personalized recommendations based on user's ratings

**Food Detail Page:**
- Shows recommendations at the bottom
- Helps users discover similar items

---

## 🚀 How to Use

### For Users:

1. **Login** to your account
2. **Rate some foods** (1-5 stars) by leaving reviews
3. **View recommendations** on the home page or food detail pages
4. Recommendations update automatically as you rate more foods

### For Developers:

1. **Start the backend server:**
   ```bash
   cd backend
   npm run server
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the API:**
   ```bash
   # Get recommendations for authenticated user
   GET http://localhost:5000/api/recommendations/me?topN=10
   Headers: Authorization: Bearer <token>
   ```

---

## ⚙️ Configuration Options

### NMF Parameters (in `recommendationController.js`):

- **`k` (latent factors)**: Currently set to `min(20, sqrt(min(users, items)))`
  - More factors = more detailed patterns but slower computation
  - Fewer factors = faster but less detailed

- **`maxIterations`**: Currently 100
  - Maximum number of iterations before stopping

- **`tolerance`**: Currently 0.001
  - Convergence threshold (stops when error change < tolerance)

### Recommendation Parameters:

- **`topN`**: Number of recommendations to return (default: 10)
  - Can be adjusted via query parameter: `?topN=20`

---

## 📊 Performance Considerations

### Optimization Tips:

1. **Caching**: Consider caching NMF results for a period (e.g., 1 hour)
   - Add to `recommendationController.js`:
   ```javascript
   const cache = new Map();
   // Check cache before running NMF
   ```

2. **Incremental Updates**: For large datasets, consider incremental NMF
   - Only recompute when significant new ratings are added

3. **Background Processing**: Run NMF in background jobs
   - Use a job queue (e.g., Bull, Agenda) to precompute recommendations

4. **Database Indexing**: Ensure indexes on:
   - `reviews.user`
   - `reviews.food`
   - `reviews.rating`

---

## 🧪 Testing

### Manual Testing:

1. Create multiple users
2. Have each user rate different foods
3. Check recommendations for each user
4. Verify that:
   - Users don't see items they've already rated
   - Recommendations make sense (similar to highly-rated items)
   - Predicted ratings are reasonable (0-5 range)

### Expected Behavior:

- **New users** (no ratings): See message prompting them to rate foods
- **Users with few ratings**: May see limited recommendations
- **Users with many ratings**: Should see personalized, relevant recommendations

---

## 🔍 Troubleshooting

### Common Issues:

1. **"No recommendations available"**
   - User hasn't rated any foods yet
   - No reviews exist in the database
   - Solution: Rate some foods first

2. **Slow response times**
   - Large number of users/items
   - Solution: Reduce `k` value or implement caching

3. **Poor recommendations**
   - Not enough rating data
   - Solution: Encourage more users to rate foods

4. **Matrix dimension errors**
   - Mismatch in user/item IDs
   - Solution: Check that all reviews reference valid users and foods

---

## 📈 Future Enhancements

1. **Hybrid Recommendations**: Combine NMF with content-based filtering
2. **Real-time Updates**: Update recommendations when new ratings are added
3. **Explanation**: Show why items are recommended (e.g., "Because you liked spicy foods")
4. **A/B Testing**: Compare NMF with other recommendation algorithms
5. **Cold Start Problem**: Handle new users/items better
6. **Diversity**: Ensure recommendations aren't too similar to each other

---

## 📖 References

- [Non-Negative Matrix Factorization - Wikipedia](https://en.wikipedia.org/wiki/Non-negative_matrix_factorization)
- [Collaborative Filtering - Stanford CS246](https://web.stanford.edu/class/cs246/slides/06-recsys1.pdf)
- [Matrix Factorization Techniques for Recommender Systems](https://datajobs.com/data-science-repo/Recommender-Systems-[Netflix].pdf)

---

## ✅ Summary

This implementation provides a complete NMF-based recommendation system that:
- ✅ Uses star ratings to generate personalized recommendations
- ✅ Handles sparse data (users with few ratings)
- ✅ Provides interpretable results
- ✅ Integrates seamlessly with your existing codebase
- ✅ Works for both authenticated and unauthenticated users (with appropriate messaging)

The system is production-ready but can be enhanced with caching, background processing, and additional features as your user base grows.

