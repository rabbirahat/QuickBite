import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { connect } from 'mongoose';
import foodRouter from './routes/foodRoute.js';


// app config
const app = express();
const PORT = 5000;

// middlewares
app.use(cors()); // access the backend to any frontend
app.use(express.json()); // to parse JSON bodies whenever sent by the client

// db connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static("uploads"))

// request the data from the server
app.get('/', (req, res) => {
  res.send('QuickBite Backend is running');
})

// run the express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// mongodb+srv://rabbirahat:quickbite_123@cluster0.y4vfbp6.mongodb.net/?appName=Cluster0