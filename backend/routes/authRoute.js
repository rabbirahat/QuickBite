import express from "express";
import { signup, login, getAllUsers } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/users", getAllUsers); // Debug endpoint to see all users

export default authRouter;

