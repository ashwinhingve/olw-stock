import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import { connectToDB } from '@/lib/mongodb';
import { generateToken } from '@/lib/tokenUtils';
import Organization from '@/app/models/organization';
import mongoose from 'mongoose';

// Simple in-memory rate limiting
// In production, use Redis or another distributed store
const loginAttempts = new Map<string, { count: number, timestamp: number }>();

// Rate limit settings
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Check rate limit
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  // Clear expired entries
  if (attempt && now - attempt.timestamp > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempt ? attempt.count >= MAX_ATTEMPTS : false;
}

// Increment attempt counter
function incrementAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt) {
    loginAttempts.set(ip, { count: 1, timestamp: now });
  } else if (now - attempt.timestamp <= WINDOW_MS) {
    attempt.count += 1;
  } else {
    // Reset if window expired
    loginAttempts.set(ip, { count: 1, timestamp: now });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    // Get request body
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials', debug: 'User not found' },
        { status: 401 }
      );
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasMatchPassword: typeof user.matchPassword === 'function'
    });
    
    // Check password
    try {
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials', debug: 'Password mismatch' },
          { status: 401 }
        );
      }
    } catch (passwordError) {
      console.error('Password check error:', passwordError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error validating credentials', 
          debug: `Password validation error: ${passwordError.message}`
        },
        { status: 500 }
      );
    }
    
    // Check if user is active
    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'User account is inactive', debug: 'isActive is false' },
        { status: 403 }
      );
    }
    
    // Make sure isActive is set if it's undefined (for backward compatibility)
    if (user.isActive === undefined || user.isActive === null) {
      user.isActive = true;
    }
    
    // Check if organization field is missing and fix it
    if (!user.organization) {
      // First try to find an existing organization
      let organization = await Organization.findOne();
      
      // If no organization exists, create a default one
      if (!organization) {
        organization = new Organization({
          name: 'Default Organization',
          active: true,
          createdBy: user._id
        });
        await organization.save();
      }
      
      // Assign the organization to the user
      user.organization = organization._id;
    }
    
    // Save any changes to the user
    try {
      await user.save();
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      // If we can't save the user, we'll try to continue anyway and just log the error
    }
    
    // Generate JWT using our utility function
    const token = generateToken(user);
    
    // Update last active
    user.lastActive = new Date();
    try {
      await user.save();
    } catch (saveError) {
      console.error('Error updating lastActive:', saveError);
      // Continue anyway if we can't update lastActive
    }
    
    // Return token and user info
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred during login', 
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 