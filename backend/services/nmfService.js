/**
 * Non-Negative Matrix Factorization (NMF) Service
 * 
 * This service implements NMF for collaborative filtering recommendations
 * based on user ratings.
 * 
 * How it works:
 * 1. Creates a user-item rating matrix from reviews
 * 2. Factorizes it into two matrices: W (user preferences) and H (item features)
 * 3. Uses these matrices to predict ratings for items users haven't rated
 * 4. Returns top recommendations based on predicted ratings
 */

/**
 * Initialize a matrix with random values between 0 and 1
 */
function initializeMatrix(rows, cols) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = Math.random() * 0.1 + 0.01; // Small random values
    }
  }
  return matrix;
}

/**
 * Matrix multiplication: A * B
 */
function multiplyMatrices(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error('Matrix dimensions do not match for multiplication');
  }

  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = Math.max(0, sum); // Ensure non-negative
    }
  }
  return result;
}

/**
 * Element-wise operations
 */
function elementWiseMultiply(A, B) {
  const result = [];
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < A[0].length; j++) {
      result[i][j] = A[i][j] * B[i][j];
    }
  }
  return result;
}

function elementWiseDivide(A, B, epsilon = 1e-10) {
  const result = [];
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < A[0].length; j++) {
      result[i][j] = A[i][j] / (B[i][j] + epsilon);
    }
  }
  return result;
}

/**
 * Calculate Frobenius norm (error) between two matrices
 */
function calculateError(original, reconstructed) {
  let error = 0;
  for (let i = 0; i < original.length; i++) {
    for (let j = 0; j < original[0].length; j++) {
      const diff = original[i][j] - reconstructed[i][j];
      error += diff * diff;
    }
  }
  return Math.sqrt(error);
}

/**
 * Perform Non-Negative Matrix Factorization
 * 
 * @param {Array} ratingMatrix - User-item rating matrix (users x items)
 * @param {number} k - Number of latent factors (typically 10-50)
 * @param {number} maxIterations - Maximum iterations (default: 100)
 * @param {number} tolerance - Convergence tolerance (default: 0.001)
 * @returns {Object} {W, H, error} - Factorized matrices and final error
 */
export function performNMF(ratingMatrix, k = 20, maxIterations = 100, tolerance = 0.001) {
  const numUsers = ratingMatrix.length;
  const numItems = ratingMatrix[0].length;

  // Initialize W (users x k) and H (k x items) with small random values
  let W = initializeMatrix(numUsers, k);
  let H = initializeMatrix(k, numItems);

  let previousError = Infinity;

  // Iterative update using multiplicative update rules
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Update H: H = H .* (W^T * R) ./ (W^T * W * H + epsilon)
    const WT = transposeMatrix(W);
    const WTR = multiplyMatrices(WT, ratingMatrix);
    const WTW = multiplyMatrices(WT, W);
    const WTWH = multiplyMatrices(WTW, H);
    const HUpdate = elementWiseDivide(WTR, WTWH);
    H = elementWiseMultiply(H, HUpdate);

    // Update W: W = W .* (R * H^T) ./ (W * H * H^T + epsilon)
    const HT = transposeMatrix(H);
    const RHT = multiplyMatrices(ratingMatrix, HT);
    const WH = multiplyMatrices(W, H);
    const WHHT = multiplyMatrices(WH, HT);
    const WUpdate = elementWiseDivide(RHT, WHHT);
    W = elementWiseMultiply(W, WUpdate);

    // Calculate reconstruction error
    const reconstructed = multiplyMatrices(W, H);
    const error = calculateError(ratingMatrix, reconstructed);

    // Check for convergence
    if (Math.abs(previousError - error) < tolerance) {
      console.log(`NMF converged at iteration ${iteration + 1} with error: ${error.toFixed(4)}`);
      break;
    }

    previousError = error;

    // Log progress every 10 iterations
    if ((iteration + 1) % 10 === 0) {
      console.log(`NMF iteration ${iteration + 1}: error = ${error.toFixed(4)}`);
    }
  }

  return { W, H, error: previousError };
}

/**
 * Transpose a matrix
 */
function transposeMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const transposed = [];
  for (let j = 0; j < cols; j++) {
    transposed[j] = [];
    for (let i = 0; i < rows; i++) {
      transposed[j][i] = matrix[i][j];
    }
  }
  return transposed;
}

/**
 * Predict ratings for a user
 * 
 * @param {Array} W - User preference matrix
 * @param {Array} H - Item feature matrix
 * @param {number} userId - Index of the user
 * @returns {Array} Predicted ratings for all items
 */
export function predictUserRatings(W, H, userId) {
  const userPreferences = W[userId];
  const predictedRatings = [];
  
  for (let itemId = 0; itemId < H[0].length; itemId++) {
    let rating = 0;
    for (let factor = 0; factor < userPreferences.length; factor++) {
      rating += userPreferences[factor] * H[factor][itemId];
    }
    predictedRatings[itemId] = Math.min(5, Math.max(0, rating)); // Clamp to 0-5
  }
  
  return predictedRatings;
}

/**
 * Get top N recommendations for a user
 * 
 * @param {Array} predictedRatings - Predicted ratings for all items
 * @param {Set} ratedItems - Set of item indices the user has already rated
 * @param {number} topN - Number of recommendations to return
 * @returns {Array} Array of {itemIndex, predictedRating} sorted by rating
 */
export function getTopRecommendations(predictedRatings, ratedItems, topN = 10) {
  const recommendations = [];
  
  for (let i = 0; i < predictedRatings.length; i++) {
    // Only recommend items the user hasn't rated
    if (!ratedItems.has(i)) {
      recommendations.push({
        itemIndex: i,
        predictedRating: predictedRatings[i]
      });
    }
  }
  
  // Sort by predicted rating (descending) and return top N
  return recommendations
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, topN);
}

