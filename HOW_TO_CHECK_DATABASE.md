# How to Check User Preferences in Database

## Method 1: Check Backend Console Logs (Easiest)

1. **Start your backend server:**
   ```bash
   cd backend
   npm run server
   ```

2. **Create a new user account** from the frontend with all preferences filled

3. **Look at your backend terminal/console** - You should see detailed logs like:
   ```
   ========== SIGNUP REQUEST RECEIVED ==========
   Full request body: { ... }
   Preferences received: { ... }
   
   ========== AFTER SAVE ==========
   User saved successfully!
   Full saved user document: { ... }
   Saved preferences: { ... }
   ```

4. **Check the "Full saved user document"** - This shows exactly what's in the database

---

## Method 2: Use the Debug API Endpoint

I've added a debug endpoint to see all users in the database:

1. **Make sure your backend is running**

2. **Open your browser** and go to:
   ```
   http://localhost:5000/api/auth/users
   ```

3. **You'll see a JSON response** with all users and their preferences:
   ```json
   {
     "success": true,
     "count": 2,
     "users": [
       {
         "_id": "...",
         "name": "John Doe",
         "email": "john@example.com",
         "preferences": {
           "topMenus": ["Pasta", "Salad", "Cake"],
           "topDishes": ["1", "5", "21"],
           "quality": 4,
           "category": 4,
           "pricePoint": 4
         },
         "createdAt": "...",
         "updatedAt": "..."
       }
     ]
   }
   ```

---

## Method 3: Check MongoDB Atlas (Visual Interface)

### Step-by-Step Guide:

1. **Go to MongoDB Atlas:**
   - Open: https://cloud.mongodb.com
   - Log in with your credentials

2. **Navigate to Your Cluster:**
   - Click on "Browse Collections" button (or find it in the left sidebar)
   - You should see your cluster: `Cluster0`

3. **Select Your Database:**
   - Click on the database name: **`quick-bite`**
   - You'll see collections: `foods`, `reviews`, `users`

4. **Open the Users Collection:**
   - Click on **`users`** collection
   - You'll see a list of all user documents

5. **View a User Document:**
   - Click on any user document (the row)
   - A panel will open showing the full document

6. **Look for Preferences:**
   - Scroll down in the document view
   - You should see a field called **`preferences`**
   - Click on it to expand and see:
     - `topMenus`: Array of 3 menu names
     - `topDishes`: Array of 3 dish IDs
     - `quality`: Number (1-5)
     - `category`: Number (1-5)
     - `pricePoint`: Number (1-5)

### What the Document Should Look Like:

```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$10$...",
  "preferences": {
    "topMenus": ["Pasta", "Salad", "Cake"],
    "topDishes": ["1", "5", "21"],
    "quality": 4,
    "category": 4,
    "pricePoint": 4
  },
  "createdAt": ISODate("2024-..."),
  "updatedAt": ISODate("2024-...")
}
```

### If You Don't See Preferences:

1. **Check the backend console logs** - Look for any errors
2. **Try creating a NEW user** (don't use an existing email)
3. **Make sure you fill ALL preference fields** in the signup form
4. **Check the debug endpoint**: `http://localhost:5000/api/auth/users`

---

## Troubleshooting

### If preferences are still not showing:

1. **Check backend console for errors:**
   - Look for "Validation error" messages
   - Look for any red error messages

2. **Verify the data is being sent:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Create a new user
   - Find the POST request to `/api/auth/signup`
   - Click on it and check the "Payload" tab
   - Verify `preferences` object is there with all fields

3. **Check if validation is failing:**
   - Make sure you select exactly 3 menus
   - Make sure you select exactly 3 dishes
   - Make sure all rating fields (quality, category, pricePoint) are selected

4. **Restart your backend server** after making code changes

---

## Quick Test

1. Create a new user with:
   - Name: Test User
   - Email: test@example.com (use a new email)
   - Password: test123
   - Select 3 menus
   - Select 3 dishes
   - Set quality: 4
   - Set category: 4
   - Set pricePoint: 4

2. Check: `http://localhost:5000/api/auth/users`

3. Look for the new user and verify preferences are there!

