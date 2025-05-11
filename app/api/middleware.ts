import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/lib/mongodb';
import User from '@/models/user';

// This middleware can be called directly from API route handlers
export async function authenticateUser(req: NextRequest) {
  try {
    // Get token from cookie or header
    const token = req.cookies.get('token')?.value || 
      req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { 
        error: 'Authentication required',
        status: 401
      };
    }
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'your-jwt-secret';
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    
    if (!decoded || !decoded.id) {
      return {
        error: 'Invalid token',
        status: 401
      };
    }
    
    // Connect to database
    await connectToDB();
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return {
        error: 'User not found',
        status: 404
      };
    }
    
    if (!user.isActive) {
      return {
        error: 'User account is deactivated',
        status: 403
      };
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Return user data (without sensitive fields)
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dataVisibility: user.dataVisibility,
        assignedStores: user.assignedStores
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: 'Authentication failed',
      status: 401
    };
  }
}

// Export a wrapper for API routes that require authentication
export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest) => {
    const auth = await authenticateUser(req);
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    
    // Call the handler with the authenticated user
    return handler(req, auth.user);
  };
} 