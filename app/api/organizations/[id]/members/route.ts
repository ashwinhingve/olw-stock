import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/organization';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PERMISSIONS, ROLES } from '@/models/user';
import { isValidObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';

// GET /api/organizations/[id]/members - List organization members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if organization ID is valid
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid organization ID' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user can access this organization's data
    if (!(await user.canAccessData(params.id))) {
      return NextResponse.json(
        { message: "Forbidden: You don't have access to this organization" },
        { status: 403 }
      );
    }
    
    // Get all members of the organization
    const members = await User.find(
      { organizations: params.id }, 
      "-password"
    ).populate('managedBy', 'name email');

    return NextResponse.json({ 
      members: members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        manager: member.managedBy ? {
          id: member.managedBy._id,
          name: member.managedBy.name,
          email: member.managedBy.email
        } : null,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      })) 
    });
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Add member to organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if organization ID is valid
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid organization ID' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if organization exists
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }
    
    // Check if user has access to create members in this organization
    if (!(await currentUser.canAccessData(params.id))) {
      return NextResponse.json(
        { message: "Forbidden: You don't have access to this organization" },
        { status: 403 }
      );
    }
    
    // Check if user has permission to create users
    if (!currentUser.permissions.includes("CREATE_USERS")) {
      return NextResponse.json(
        { message: "Forbidden: You don't have permission to create users" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { name, email, password, phone, role, managerId } = body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate role hierarchy
    const roleHierarchy = {
      "SUPER_ADMIN": 5,
      "ADMIN": 4,
      "MANAGER": 3,
      "STAFF": 2,
      "VIEWER": 1
    };
    
    // User can only create users with a role lower than or equal to their own
    if (roleHierarchy[role] > roleHierarchy[currentUser.role]) {
      return NextResponse.json(
        { message: "Forbidden: You cannot create users with a higher role than yours" },
        { status: 403 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Check if manager exists if provided
    let manager = null;
    if (managerId) {
      manager = await User.findById(managerId);
      if (!manager) {
        return NextResponse.json(
          { message: "Manager not found" },
          { status: 404 }
        );
      }
      
      // Ensure manager role is higher than the new user's role
      if (roleHierarchy[manager.role] <= roleHierarchy[role]) {
        return NextResponse.json(
          { message: "Manager must have a higher role than the new user" },
          { status: 400 }
        );
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      managedBy: managerId || null,
      organizations: [params.id],
      status: "ACTIVE",
      permissions: [] // Default permissions will be assigned based on role
    });
    
    await newUser.save();
    
    return NextResponse.json({
      message: "Member created successfully",
      member: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization member:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 