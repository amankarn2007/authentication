import type { Request, Response } from "express";
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(): Promise<void>;
export declare function getMe(): Promise<void>;
export declare function refreshToken(): Promise<void>;
export declare function logout(): Promise<void>;
export declare function logoutAll(): Promise<void>;
export declare function verifyEmail(): Promise<void>;
//# sourceMappingURL=authController.d.ts.map