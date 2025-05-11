import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import { verifyToken, extractToken } from '@/lib/tokenUtils';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get token using our utility function
    const token = extractToken(
      request.headers.get('Authorization'),
      request.headers.get('cookie')
    );
    
    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }
    
    // Verify token using our utility function - This is running server-side
    // so we use the Node.js compatible version
    const decoded = verifyToken(token);
    
    // Check if token verification failed
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Find user from decoded token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'User account is inactive' },
        { status: 403 }
      );
    }
    
    // Update user's last active timestamp
    user.lastActive = new Date();
    try {
      await user.save();
    } catch (saveError) {
      console.error('Error updating lastActive:', saveError);
      // Continue anyway if we can't update lastActive
    }
    
    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }
    
    console.error('Token verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred during token verification',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 