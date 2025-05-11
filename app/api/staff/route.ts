import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { PERMISSIONS, ROLES } from '@/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Get all staff members
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has permission
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view users
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.hasPermission(PERMISSIONS.VIEW_USERS)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Build query
    const query: any = {};
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Apply data segregation for Store Admin users
    if (currentUser.role === ROLES.STORE_ADMIN) {
      // Store Admins can only see users they created
      query.adminId = currentUser._id;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query, '-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationExpire -customPermissions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get unique roles
    const roles = Object.values(ROLES);
    
    return NextResponse.json({
      success: true,
      users,
      roles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch staff: ${err.message || 'Database connection error'}`
      },
      { status: 500 }
    );
  }
}

// Create a new staff member
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has permission
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to create users
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.hasPermission(PERMISSIONS.CREATE_USERS)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Verify current user is a Store Admin
    if (currentUser.role !== ROLES.STORE_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Only Store Admins can create new users' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'role', 'store'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Validate role is one of the three allowed roles
    if (!Object.values(ROLES).includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Generate a random password if not provided
    const password = body.password || crypto.randomBytes(8).toString('hex');
    
    // Create user
    const user = await User.create({
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      role: body.role,
      password: password,
      isActive: body.isActive !== undefined ? body.isActive : true,
      organization: currentUser.organization,
      store: body.store,
      // Important: Set the adminId to the current Store Admin's ID for data segregation
      adminId: currentUser._id
    });
    
    // Remove sensitive fields from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      store: user.store
    };
    
    // In a real application, you would send an email with the password
    // For now, we'll just return it in the response (NOT SECURE FOR PRODUCTION)
    
    return NextResponse.json({
      success: true,
      user: userResponse,
      tempPassword: body.password ? undefined : password // Only return the generated password if one wasn't provided
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create staff member: ${err.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 