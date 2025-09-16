import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// in .env: JWT_SECRET=dev-secret-change-me
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthedRequest extends Request {
  user?: { userId: number; email: string };
}

// Named export, damit der Import { requireAuth } funktioniert
export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: number; email: string };
    if (!decoded?.userId) return res.status(401).json({ error: "Invalid token" });

    req.user = { userId: Number(decoded.userId), email: String(decoded.email || "") };
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Unauthorized", detail: e?.message });
  }
};

// Dev-Helfer: Token generieren
export function signDebugToken(userId: number, email = "test@viralix.dev") {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}
