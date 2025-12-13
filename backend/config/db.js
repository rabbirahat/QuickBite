import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://rabbirahat:quickbite_123@cluster0.y4vfbp6.mongodb.net/quick-bite').then(() => {
        console.log('MongoDB connected successfully');
    })
}