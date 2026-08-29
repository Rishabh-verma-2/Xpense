import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Extend Express Request with all 4 generics so req.params / req.query / req.body
// remain correctly typed in every route file (required for @types/express >= 4.17.21+)
export interface AuthRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
