import { Router } from "express";
import { getMe, login, logout, logoutAll, refreshToken, register, verifyEmail } from "../controller/authController.js";

const authRouter = Router();

// POST '/api/auth/register'
authRouter.post("/register", register)

// POST '/api/auth/login'
authRouter.post("/login", login)

// GET '/api/auth/get-me'
authRouter.get("/get-me", getMe)

// GET '/api/auth/refresh-token'
authRouter.get("/refresh-token", refreshToken)

// GET '/api/auth/logout'
authRouter.get("/logout", logout)

// GET '/api/auth/logout-all'
authRouter.get("/logout-all", logoutAll)

// GET '/api/auth/verify-email'
authRouter.get("/verify-email", verifyEmail)

export default authRouter;