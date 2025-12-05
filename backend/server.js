import express from 'express';
import cors from 'cors';


// app config
const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors()); // access the backend to any frontend
app.use(express.json()); // to parse JSON bodies whenever sent by the client

// request the data from the server
app.get('/', (req, res) => {
  res.send('QuickBite Backend is running');
})

// run the express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});