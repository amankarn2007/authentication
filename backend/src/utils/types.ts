import { email, z } from "zod"

export const createUserSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string(),
    password: z.string().min(3)
})

export const loginSchema = z.object({
    email: z.string(),
    password: z.string().min(3)
})