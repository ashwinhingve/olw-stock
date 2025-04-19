import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import { connectToDB } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDB();
    
    // Get data from request
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create a new user (password will be hashed by the pre-save hook in the model)
    const newUser = await User.create({
      name,
      email,
      password
    });
    
    // Return the new user without password
    const userWithoutPassword = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };
    
    return NextResponse.json(
      { 
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 