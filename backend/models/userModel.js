import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define preferences schema as a subdocument
const preferencesSchema = new mongoose.Schema({
    topMenus: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && Array.isArray(v) && v.length === 3;
            },
            message: 'Please select exactly 3 menus'
        }
    },
    topDishes: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && Array.isArray(v) && v.length === 3;
            },
            message: 'Please select exactly 3 dishes'
        }
    },
    quality: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    category: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    pricePoint: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, {
    _id: false // Don't create separate _id for subdocument
});

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 5
    },
    // User preferences for recommendations
    preferences: {
        type: preferencesSchema,
        required: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;

