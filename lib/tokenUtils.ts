import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as jose from 'jose';
import { JWTPayload } from 'jose';

// Use a consistent JWT secret across the application
export const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-should-be-changed-in-production';

// Define user token payload interface
export interface UserTokenPayload {
  id: string;
  email: string;
  role: string;
  organization?: string;
  adminDomain?: string;
  iat?: number;
  exp?: number;
}

// Generate a JWT token for a user - This runs server-side only
export function generateToken(user: { _id: string; email: string; role: string; organization?: string }): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organization: user.organization,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify a JWT token - Edge runtime compatible version
export async function verifyTokenEdge(token: string): Promise<UserTokenPayload | null> {
  try {
    // Create a TextEncoder to convert the secret to Uint8Array
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    
    // Verify the token using jose
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as UserTokenPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Verify a JWT token - Node.js compatible version
export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Extract token from Authorization header or cookie
export function extractToken(authHeader: string | null, cookieHeader: string | null): string | null {
  // From Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // From cookie
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  
  return null;
}

// Set cookie for token
export function getTokenCookieString(token: string, maxAgeSec = 30 * 24 * 60 * 60): string {
  return `token=${token}; path=/; max-age=${maxAgeSec}; SameSite=Strict`;
}

// Clear token cookie
export function getClearTokenCookieString(): string {
  return 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
} 