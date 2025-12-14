import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
        expiresIn: '30d'
    });
};

// Signup controller
const signup = async (req, res) => {
    try {
        const { name, email, password, preferences } = req.body;

        console.log('\n========== SIGNUP REQUEST RECEIVED ==========');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Preferences received:', JSON.stringify(preferences, null, 2));

        // Validate required fields
        if (!name || !email || !password || !preferences) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate preferences
        if (!preferences.topMenus || preferences.topMenus.length !== 3) {
            return res.status(400).json({
                success: false,
                message: "Please select exactly 3 menus"
            });
        }

        if (!preferences.topDishes || preferences.topDishes.length !== 3) {
            return res.status(400).json({
                success: false,
                message: "Please select exactly 3 dishes"
            });
        }

        if (!preferences.quality || preferences.quality < 1 || preferences.quality > 5) {
            return res.status(400).json({
                success: false,
                message: "Quality must be between 1 and 5"
            });
        }

        if (!preferences.category || preferences.category < 1 || preferences.category > 5) {
            return res.status(400).json({
                success: false,
                message: "Category must be between 1 and 5"
            });
        }

        if (!preferences.pricePoint || preferences.pricePoint < 1 || preferences.pricePoint > 5) {
            return res.status(400).json({
                success: false,
                message: "Price point must be between 1 and 5"
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create new user
        console.log('=== SIGNUP DEBUG ===');
        console.log('Received preferences:', JSON.stringify(preferences, null, 2));
        console.log('topMenus:', preferences.topMenus, 'Type:', Array.isArray(preferences.topMenus), 'Length:', preferences.topMenus?.length);
        console.log('topDishes:', preferences.topDishes, 'Type:', Array.isArray(preferences.topDishes), 'Length:', preferences.topDishes?.length);
        console.log('quality:', preferences.quality, 'category:', preferences.category, 'pricePoint:', preferences.pricePoint);
        
        // Ensure preferences object is properly structured
        const preferencesData = {
            topMenus: Array.isArray(preferences.topMenus) ? preferences.topMenus : [],
            topDishes: Array.isArray(preferences.topDishes) ? preferences.topDishes : [],
            quality: Number(preferences.quality),
            category: Number(preferences.category),
            pricePoint: Number(preferences.pricePoint)
        };
        
        console.log('Processed preferences:', JSON.stringify(preferencesData, null, 2));
        
        const user = new userModel({
            name,
            email: email.toLowerCase(),
            password,
            preferences: preferencesData
        });

        // Log before validation
        console.log('User model created. Preferences in model:', JSON.stringify(user.preferences, null, 2));

        // Validate before saving
        const validationError = user.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            const errorMessages = Object.values(validationError.errors).map(err => err.message).join(', ');
            return res.status(400).json({
                success: false,
                message: errorMessages || "Validation failed",
                error: validationError.message
            });
        }

        // Log before save
        console.log('User object before save:', JSON.stringify(user.toObject(), null, 2));
        console.log('User.preferences before save:', JSON.stringify(user.preferences, null, 2));
        
        await user.save();
        
        // Verify preferences were saved by fetching fresh from DB
        const savedUser = await userModel.findById(user._id).lean();
        console.log('\n========== AFTER SAVE ==========');
        console.log('User saved successfully!');
        console.log('User ID:', savedUser._id);
        console.log('Full saved user document:', JSON.stringify(savedUser, null, 2));
        console.log('\n--- Preferences Check ---');
        console.log('savedUser.preferences exists?', !!savedUser.preferences);
        console.log('savedUser.preferences type:', typeof savedUser.preferences);
        console.log('Saved preferences:', JSON.stringify(savedUser.preferences, null, 2));
        if (savedUser.preferences) {
            console.log('topMenus:', savedUser.preferences.topMenus);
            console.log('topDishes:', savedUser.preferences.topDishes);
            console.log('quality:', savedUser.preferences.quality);
            console.log('category:', savedUser.preferences.category);
            console.log('pricePoint:', savedUser.preferences.pricePoint);
        }
        console.log('===============================\n');

        // Generate token
        const token = generateToken(user._id);

        // Return user data (without password)
        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
                error: error.message
            });
        }
        
        // Handle duplicate key error (email already exists)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || "Error while creating user",
            error: error.message
        });
    }
};

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user data (without password)
        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error while logging in",
            error: error.message
        });
    }
};

// Get all users (for debugging - remove in production)
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password').lean();
        console.log('All users in DB:', JSON.stringify(users, null, 2));
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: "Error while fetching users",
            error: error.message
        });
    }
};

export { signup, login, getAllUsers };
