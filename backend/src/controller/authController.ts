import type { Request, Response } from "express";
import { createUserSchema, loginSchema } from "../utils/types.js";
import prismaClient from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto"


export async function register(req: Request, res: Response) {
    const parsedResult = createUserSchema.safeParse(req.body);

    if(!parsedResult.success) {
        return res.status(400).json({
            message: "Something is missing",
            error: parsedResult.error
        })
    }

    try {
        const { username, email, password } = parsedResult.data;

        const isAlreadyRegistered = await prismaClient.user.findUnique({
            where: {
                email
            }
        })

        if(isAlreadyRegistered) {
            res.status(400).json({
                message: "User already exists with this email",
                
            })
        }

        const salt = await bcrypt.genSalt(5);
        const hash = await bcrypt.hash(password, salt);

        const user = await prismaClient.user.create({
            data: {
                username,
                email,
                password: hash,
                verified: false
            }
        })

        res.status(201).json({
            message: "User created successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        })

    } catch (err) {
        console.log(err);
        res.json({
            message: "error in register endpoint",
            err
        })
    }
}

export async function login(req: Request, res: Response) {
    const parsedResult = loginSchema.safeParse(req.body);

    if(!parsedResult.success) {
        return res.status(400).json({
            message: "Something is missing",
            error: parsedResult.error
        })
    }
    
    try {
        const { email, password } = parsedResult.data;
        const user = await prismaClient.user.findUnique({
            where: {
                email
            }
        })

        if(!user){
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const result = await bcrypt.compare(password, user.password);
        if(!result) {
            return res.status(401).json({
                message: "Wrong password"
            })
        }

        const refreshToken = await jwt.sign({
            id: user.id
        }, process.env.JWT_SECRET!, {
            expiresIn: "7d"
        })

        // Store only the hash in DB — plain token never persisted
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await prismaClient.session.create({
            data: {
                userId: user.id,
                refreshTokenHash,
                ip: req.ip ?? "unknown", //can be unknow
                userAgent: req.headers[ "user-agent" ] ?? "unknown" //can be unknow
            }
        })

        // Sign access token (short-lived, tied to sessionId for revocation)
        const accessToken = await jwt.sign({
            id: user.id,
            sessionId: session.id
        }, process.env.JWT_SECRET!, {
            expiresIn: "15m"
        })

        // Refresh token sent via HttpOnly cookie — inaccessible to JS
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        res.status(200).json({
            message: "Loged in successfully",
            user: {
                username: user.username,
                email: user.email
            },
            accessToken
        })

    } catch(err) {
        res.status(500).json({
            message: "Internal server error",
            error: err
        })
    }
}

export async function getMe() {

}

export async function refreshToken() {
    
}

export async function logout() {
    
}

export async function logoutAll() {
    
}

export async function verifyEmail() {

}