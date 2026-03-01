# NMF Explained Simply - Your Questions Answered

## 📝 Summary of Your Questions:

1. **Why `topN=5` when code shows `topN=10`?**
2. **Why `maxIterations=200` when code shows `maxIterations=100`?**
3. **How does `k` work? What does `k=20` mean?**
4. **What are "abstract factors"?**

---

## 1️⃣ Question: `topN=5` vs `topN=10`

### **The Confusion:**

In `nmfService.js`, line 292:
```javascript
export function getTopRecommendations(predictedRatings, ratedItems, topN = 10) {
  //                                                                    ↑
  //                                                          Default is 10
}
```

But we see **top 5** recommendations in the frontend!

### **The Answer:**

**`topN = 10` is the DEFAULT parameter**, but it's **OVERRIDDEN** when we call the function!

**Here's the flow:**

**Frontend (`Recommendations.jsx`):**
```javascript
const Recommendations = ({ topN = 5 }) => {
  // Component receives topN=5 as prop (or uses default 5)
  
  useEffect(() => {
    const response = await recommendationAPI.getMyRecommendations(topN)
    //                                                              ↑
    //                                                    Passes topN=5 to API
  }, [isAuthenticated, topN])
}
```

**Backend (`recommendationController.js`):**
```javascript
export const getMyRecommendations = async (req, res) => {
  const topN = parseInt(req.query.topN) || 5;
  //                          ↑           ↑
  //                    From query    Default if not provided
  //                    ?topN=5        (but we always pass 5)
  
  // Later...
  let topRecommendations = getTopRecommendations(
    predictedRatings,
    ratedItemIndices,
    topN  // ← topN = 5 (OVERRIDES the default topN=10 in function definition!)
  );
}
```

**Function (`nmfService.js`):**
```javascript
export function getTopRecommendations(predictedRatings, ratedItems, topN = 10) {
  //                                                                     ↑
  //                                                          This is DEFAULT ONLY
  //                                                          Used if topN is NOT provided
  
  // When called with topN=5:
  // getTopRecommendations(..., 5) → topN = 5 (NOT 10!)
  
  return recommendations
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, topN); // ← topN = 5, so returns top 5
}
```

**Key Point:** Default parameters are **ONLY used if the argument is missing**. Since we always pass `topN=5`, the default `topN=10` is **never used**.

---

## 2️⃣ Question: `maxIterations=200` vs `maxIterations=100`

### **The Confusion:**

In `nmfService.js`, line 105:
```javascript
export function performNMF(ratingMatrix, k = 20, maxIterations = 100, tolerance = 0.001) {
  //                                                      ↑
  //                                            Default is 100
}
```

But in the explanation, I said 200 iterations!

### **The Answer:**

**`maxIterations = 100` is the DEFAULT**, but we **OVERRIDE it** when calling the function!

**Here's the code:**

**Function Definition (`nmfService.js`):**
```javascript
export function performNMF(ratingMatrix, k = 20, maxIterations = 100, tolerance = 0.001) {
  //                                                      ↑
  //                                            Default: 100 iterations
  //                                            Only used if not provided
}
```

**Function Call (`recommendationController.js`):**
```javascript
const { W, H, error } = performNMF(matrix, k, 200, 0.0001);
//                                       ↑  ↑    ↑
//                                       k  max  tolerance
//                                      3   200  0.0001
```

**The call passes:**
- `k` = 3 (overrides default k=20)
- `maxIterations` = **200** (overrides default maxIterations=100)
- `tolerance` = 0.0001 (overrides default tolerance=0.001)

**So the actual iterations = 200, NOT 100!**

---

## 3️⃣ Question: How does `k` work? What does `k=20` mean?

### **The Confusion:**

Function definition says `k = 20`, but we calculate `k = 3` dynamically!

### **The Answer:**

**`k`** = Number of **hidden factors** (dimensions) that NMF will discover.

**Function Definition (`nmfService.js`):**
```javascript
export function performNMF(ratingMatrix, k = 20, maxIterations = 100, tolerance = 0.001) {
  //                                                   ↑
  //                                          Default k=20
  //                                          Only used if not provided
}
```

**Dynamic Calculation (`recommendationController.js`):**
```javascript
// Calculate k dynamically based on data size
const k = Math.min(10, Math.max(2, Math.floor(Math.sqrt(Math.min(uniqueUserIds.length, allFoods.length)))));

// For our example:
// uniqueUserIds.length = 10 (users)
// allFoods.length = 24 (foods)
// 
// Step by step:
// 1. Math.min(10, 24) = 10
// 2. Math.sqrt(10) = 3.162...
// 3. Math.floor(3.162) = 3
// 4. Math.max(2, 3) = 3
// 5. Math.min(10, 3) = 3
// 
// Result: k = 3

console.log(`Performing NMF with k=3 factors...`);

// Pass k=3 to performNMF (overrides default k=20)
const { W, H, error } = performNMF(matrix, k, 200, 0.0001);
//                                       ↑
//                                   k = 3 (NOT 20!)
```

### **What does `k=3` mean?**

**`k`** represents **how many hidden patterns** NMF will find to explain user preferences.

**With k=3:**
- NMF finds **3 hidden factors**
- **W matrix**: 10 users × 3 factors (how much each user likes each factor)
- **H matrix**: 3 factors × 40 foods (how much each food has each factor)

**Visual Representation:**

**W Matrix (User Preferences):**
```
        Factor1  Factor2  Factor3
John      0.8      0.2      0.3
Mary      0.5      0.7      0.8
Bob       0.6      0.4      0.5
...
(10 users × 3 factors)
```

**H Matrix (Food Features):**
```
        Food1  Food2  Food3  ...  Food40
Factor1   0.9    0.8    0.7   ...   0.3
Factor2   0.1    0.3    0.2   ...   0.9
Factor3   0.3    0.4    0.5   ...   0.2

(3 factors × 40 foods)
```

### **Why calculate k dynamically?**

**Formula: `k = sqrt(min(users, foods))`**

- **Too many k** (e.g., k=20 for 10 users):
  - Overfitting (finds noise, not real patterns)
  - Slow computation
  - Poor predictions

- **Too few k** (e.g., k=1):
  - Underfitting (misses important patterns)
  - Too simple
  - Poor predictions

- **Just right k** (e.g., k=3 for 10 users):
  - Captures real patterns
  - Fast computation
  - Good predictions

**Rule of thumb:** `k ≈ sqrt(min(users, foods))`

---

## 4️⃣ Question: What are "Abstract Factors"?

### **The Confusion:**

I said "abstract factors" but didn't explain clearly what they are or why they're "abstract".

### **The Answer:**

**"Abstract factors"** are **hidden patterns** that NMF discovers automatically. They're called "abstract" because:

1. **We don't name them** - NMF just finds numbers
2. **They're mathematical** - They're weights, not real concepts
3. **They explain preferences** - They capture why users like certain foods
4. **They're learned from data** - NMF finds patterns automatically

### **Concrete Example:**

Let's say we have ratings:

**John's Ratings:**
- Cheese Pasta: 4 stars ⭐⭐⭐⭐
- Tomato Pasta: 5 stars ⭐⭐⭐⭐⭐
- Creamy Pasta: 4 stars ⭐⭐⭐⭐
- Greek Salad: 0 stars (not rated)
- Veg Salad: 0 stars (not rated)

**Mary's Ratings:**
- Cheese Pasta: 5 stars ⭐⭐⭐⭐⭐
- Tomato Pasta: 4 stars ⭐⭐⭐⭐
- Creamy Pasta: 0 stars (not rated)
- Greek Salad: 3 stars ⭐⭐⭐
- Veg Salad: 4 stars ⭐⭐⭐⭐

**What patterns do we see?**
- John likes **pasta** (4, 5, 4) but not **salad** (0, 0)
- Mary likes both **pasta** (5, 4) and **salad** (3, 4)

### **What NMF Finds (with k=3):**

NMF finds **3 hidden factors** that explain these patterns:

**Factor 1** (we might call it "Pasta Preference", but NMF doesn't name it!):
- John: **0.8** (high value = loves pasta)
- Mary: **0.5** (medium value = moderate pasta preference)
- Cheese Pasta: **0.9** (high value = it's pasta!)
- Tomato Pasta: **0.9** (high value = it's pasta!)
- Greek Salad: **0.1** (low value = it's NOT pasta!)

**Factor 2** (we might call it "Fresh/Healthy Preference"):
- John: **0.2** (low value = not into fresh/healthy)
- Mary: **0.7** (high value = loves fresh/healthy)
- Cheese Pasta: **0.1** (low value = not very fresh/healthy)
- Greek Salad: **0.9** (high value = very fresh/healthy!)

**Factor 3** (we might call it "Variety Preference"):
- John: **0.3** (low value = sticks to favorites)
- Mary: **0.8** (high value = loves variety)
- ... (different for each food)

### **Why Are They "Abstract"?**

1. **NMF doesn't name them** - We called them "Pasta Preference", "Fresh/Healthy", etc., but NMF just finds numbers (0.8, 0.2, 0.3)

2. **They're mathematical** - They're just weights, not real concepts. Factor 1 might capture "pasta + creaminess + Italian + comfort food", not just "pasta"

3. **They might combine concepts** - A factor might represent "pasta + high price + Italian restaurant style", not just one thing

4. **They're learned from data** - NMF finds patterns automatically. We don't tell it "look for pasta preference", it just finds patterns in the numbers

### **How They Work (Mathematically):**

For **John predicting Greek Salad**:

```
Predicted Rating = W[John] × H[Greek Salad]
                 = [0.8, 0.2, 0.3] × [0.1, 0.9, 0.5]
                 
                 = Factor1: John(0.8) × Greek Salad(0.1) = 0.08 (low - John loves pasta, salad has none)
                 + Factor2: John(0.2) × Greek Salad(0.9) = 0.18 (medium - John doesn't love fresh, but salad is fresh)
                 + Factor3: John(0.3) × Greek Salad(0.5) = 0.15 (low - John doesn't like variety)
                 
                 = 0.08 + 0.18 + 0.15
                 = 0.41
```

**Result: 0.41** → John probably won't like Greek Salad much (low predicted rating)

For **John predicting Tomato Pasta**:

```
Predicted Rating = W[John] × H[Tomato Pasta]
                 = [0.8, 0.2, 0.3] × [0.9, 0.2, 0.4]
                 
                 = Factor1: John(0.8) × Tomato Pasta(0.9) = 0.72 (HIGH - John loves pasta, this IS pasta!)
                 + Factor2: John(0.2) × Tomato Pasta(0.2) = 0.04 (low - not important here)
                 + Factor3: John(0.3) × Tomato Pasta(0.4) = 0.12 (medium)
                 
                 = 0.72 + 0.04 + 0.12
                 = 0.88
```

**Result: 0.88** → John will probably like Tomato Pasta! (He actually rated it 5 stars!)

---

## 📋 Summary

1. **`topN=5`** because we pass `5` as argument, overriding the default `topN=10`
2. **`maxIterations=200`** because we pass `200` as argument, overriding the default `maxIterations=100`
3. **`k=3`** is calculated dynamically, overriding the default `k=20`
4. **"Abstract factors"** are hidden patterns that NMF discovers - they're numbers that explain user preferences, not named concepts

**Key Takeaway:** Default parameters in JavaScript are **ONLY used if arguments are missing**. Since we always provide arguments, defaults are **never used** in our code!

