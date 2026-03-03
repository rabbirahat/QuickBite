/**
 * User-based k-Nearest Neighbors (kNN) Collaborative Filtering Service
 *
 * This service works directly on the user-item rating matrix.
 *
 * Very high-level idea:
 * - Each user is represented as a vector of their ratings across all items.
 * - We compute how similar the target user is to every other user
 *   (using cosine similarity between rating vectors).
 * - To predict how much the target user would like an item, we look at
 *   similar users who rated that item and take a similarity‑weighted
 *   average of their ratings.
 *
 * Input:
 * - ratingMatrix: 2D array [numUsers][numItems] with ratings (0 = not rated)
 * - targetUserIndex: row index of the target user in ratingMatrix
 * - k: how many nearest neighbors to use (default: 5)
 *
 * Output:
 * - predictedRatings: array [numItems] with predicted rating for each item
 */

/**
 * Compute cosine similarity between two rating vectors.
 * Both vectors are arrays of numbers (ratings, with 0 meaning "no rating").
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];

    // We include zeros in the vectors; they simply don't contribute
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    // One of the users has no ratings → similarity undefined, treat as 0
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Predict ratings for a user using user-based kNN (mean-centered).
 *
 * Classic user-based CF normally works with rating deviations:
 *   r̂(u, i) = μ_u + ( Σ_v sim(u,v) * (r(v,i) - μ_v) ) / Σ_v |sim(u,v)|
 * where:
 *   μ_u = average rating of user u
 *   r(v,i) = rating of neighbor v on item i
 *
 * This helps avoid everything becoming close to 5 when most neighbors give high ratings.
 *
 * @param {number[][]} ratingMatrix - User-item rating matrix
 * @param {number} targetUserIndex - Index of target user in the matrix
 * @param {number} k - Number of nearest neighbors to use
 * @returns {number[]} predictedRatings - Predicted rating for each item
 */
export function predictUserRatingsKNN(ratingMatrix, targetUserIndex, k = 5) {
  const numUsers = ratingMatrix.length;
  if (numUsers === 0) return [];

  const numItems = ratingMatrix[0].length;

  // Safety check: target user index must be valid
  if (targetUserIndex < 0 || targetUserIndex >= numUsers) {
    console.error(`predictUserRatingsKNN: invalid targetUserIndex=${targetUserIndex}`);
    return new Array(numItems).fill(0);
  }

  const targetRatings = ratingMatrix[targetUserIndex];

  // --- Step 0: compute each user's average rating (only over non-zero ratings) ---
  const userMeans = new Array(numUsers).fill(0);
  for (let u = 0; u < numUsers; u++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < numItems; i++) {
      const r = ratingMatrix[u][i];
      if (r > 0) {
        sum += r;
        count++;
      }
    }
    userMeans[u] = count > 0 ? sum / count : 0;
  }
  const targetMean = userMeans[targetUserIndex] || 0;

  // --- Step 1: compute similarity between target user and every other user ---
  const similarities = [];
  for (let u = 0; u < numUsers; u++) {
    if (u === targetUserIndex) continue;
    const sim = cosineSimilarity(targetRatings, ratingMatrix[u]);
    if (sim > 0) {
      similarities.push({ userIndex: u, similarity: sim });
    }
  }

  // Sort neighbors by similarity (highest first) and take top k
  similarities.sort((a, b) => b.similarity - a.similarity);
  const neighbors = similarities.slice(0, k);

  console.log(
    `kNN: using ${neighbors.length} neighbors for user index ${targetUserIndex}`
  );

  // --- Step 2: for each item, predict rating from neighbors' rating deviations ---
  const predictedRatings = new Array(numItems).fill(0);

  for (let itemIndex = 0; itemIndex < numItems; itemIndex++) {
    // Skip items the target user has already rated
    if (targetRatings[itemIndex] > 0) {
      predictedRatings[itemIndex] = 0;
      continue;
    }

    let weightedDeviationSum = 0;
    let simAbsSum = 0;

    for (const { userIndex, similarity } of neighbors) {
      const neighborRating = ratingMatrix[userIndex][itemIndex];
      if (neighborRating > 0) {
        const neighborMean = userMeans[userIndex] || 0;
        const deviation = neighborRating - neighborMean;
        weightedDeviationSum += similarity * deviation;
        simAbsSum += Math.abs(similarity);
      }
    }

    if (simAbsSum > 0) {
      const predicted = targetMean + weightedDeviationSum / simAbsSum;
      // Clamp to 0–5 rating range
      predictedRatings[itemIndex] = Math.min(5, Math.max(0, predicted));
    } else {
      // If no neighbor rated this item, leave prediction at 0
      predictedRatings[itemIndex] = 0;
    }
  }

  // Simple debug summary for logs
  const nonZero = predictedRatings.filter((r) => r > 0).length;
  const maxPred = nonZero > 0 ? Math.max(...predictedRatings) : 0;
  const minPred = nonZero > 0 ? Math.min(...predictedRatings.filter((r) => r > 0)) : 0;
  console.log(
    `kNN predictions for user index ${targetUserIndex}: non-zero=${nonZero}/${numItems}, min=${minPred.toFixed(
      2
    )}, max=${maxPred.toFixed(2)}`
  );

  return predictedRatings;
}

