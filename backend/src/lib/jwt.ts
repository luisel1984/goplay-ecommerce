import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return (jwt.sign as any)(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: JwtPayload): string {
  return (jwt.sign as any)(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
