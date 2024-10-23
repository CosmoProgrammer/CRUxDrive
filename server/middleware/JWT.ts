import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = Deno.env.get("JWT_SECRET");

const JWTMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not given" });
  }
  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.body.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default JWTMiddleware;
