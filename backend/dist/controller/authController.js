import { createUserSchema } from "../utils/types.js";
import prismaClient from "../db.js";
import bcrypt from "bcrypt";
export async function register(req, res) {
    const parsedResult = createUserSchema.safeParse(req.body);
    if (!parsedResult.success) {
        return res.status(400).json({
            message: "Something is missing",
            error: parsedResult.error
        });
    }
    try {
        const { username, email, password } = parsedResult.data;
        const isAlreadyRegistered = await prismaClient.user.findUnique({
            where: {
                email
            }
        });
        if (isAlreadyRegistered) {
            res.status(400).json({
                message: "User already exists with this email",
            });
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
        });
        res.status(201).json({
            message: "User created successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        });
    }
    catch (err) {
        console.log(err);
        res.json({
            message: "error in register endpoint",
            err
        });
    }
}
export async function login() {
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
//# sourceMappingURL=authController.js.map