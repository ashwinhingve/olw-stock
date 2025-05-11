import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import User, { PERMISSIONS, ROLES } from '@/models/user';
import mongoose from 'mongoose';
import { getUserInfo, hasPermission, canManageUser } from '@/lib/userContext';
import bcrypt from 'bcryptjs';

// Validate MongoDB Object ID
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// Define user roles locally since there are issues with importing
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
};

// Define key permissions locally
const PERMISSIONS = {
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ADMIN_DOMAIN: 'manage_admin_domain',
};

// Get a specific user
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    
    // Check if user has permission to view users
    const hasViewPermission = await hasPermission(req, PERMISSIONS.VIEW_USERS);
    if (!hasViewPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }
    
    // Get current user info
    const currentUser = await getUserInfo(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the current user can manage/view this user
    const canManage = await canManageUser(req, params.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this user' },
        { status: 403 }
      );
    }
    
    // Find the user
    const user = await User.findById(params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationExpire')
      .populate('adminDomain', 'name email');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    
    // Check if user has permission to edit users
    const hasEditPermission = await hasPermission(req, PERMISSIONS.EDIT_USERS);
    if (!hasEditPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit users' },
        { status: 403 }
      );
    }
    
    // Get current user info
    const currentUser = await getUserInfo(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the current user can manage this user
    const canManage = await canManageUser(req, params.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this user' },
        { status: 403 }
      );
    }
    
    // Get update data
    const updateData = await req.json();
    
    // Get current user role for role validation
    const fullCurrentUser = await User.findById(currentUser.id).select('role');
    
    // Get target user for role validation
    const targetUser = await User.findById(params.id).select('role');
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Role change security checks
    if (updateData.role && updateData.role !== targetUser.role) {
      // 1. Check if current user can assign this role (hierarchy check)
      if (!isValidRoleAssignment(fullCurrentUser.role, updateData.role)) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to assign this role' },
          { status: 403 }
        );
      }
      
      // 2. Check if user can change from the current role (can't change someone with higher role)
      if (!canChangeFromRole(fullCurrentUser.role, targetUser.role)) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to change this user\'s role' },
          { status: 403 }
        );
      }
    }
    
    // Prevent organization changes
    delete updateData.organization;
    
    // Hash password if it's being updated
    if (updateData.password) {
      const user = await User.findById(params.id);
      if (user) {
        user.password = updateData.password;
        await user.save();
      }
      // Remove password from update object to prevent double-hashing
      delete updateData.password;
    }
    
    // Set lastUpdatedBy reference
    updateData.lastUpdatedBy = currentUser.id;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationExpire');
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle validation errors
    const err = error as Error; 
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((err: any) => err.message); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    
    // Check if user has permission to delete users
    const hasDeletePermission = await hasPermission(req, PERMISSIONS.DELETE_USERS);
    if (!hasDeletePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete users' },
        { status: 403 }
      );
    }
    
    // Get current user info
    const currentUser = await getUserInfo(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the current user can manage this user
    const canManage = await canManageUser(req, params.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this user' },
        { status: 403 }
      );
    }
    
    // Get target user for role validation
    const targetUser = await User.findById(params.id).select('role');
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get current user role
    const fullCurrentUser = await User.findById(currentUser.id).select('role');
    
    // Prevent deleting users with higher roles
    if (!canChangeFromRole(fullCurrentUser.role, targetUser.role)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this user' },
        { status: 403 }
      );
    }
    
    // Delete the user
    const deletedUser = await User.findByIdAndDelete(params.id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update any references in other users
    await User.updateMany(
      { managedStaff: params.id },
      { $pull: { managedStaff: params.id } }
    );
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Helper function to validate role assignments
function isValidRoleAssignment(creatorRole: string, assignedRole: string): boolean {
  // Define role hierarchy (higher index = higher privilege)
  const roleHierarchy = [
    ROLES.VIEWER,
    ROLES.STAFF,
    ROLES.MANAGER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN
  ];
  
  const creatorIndex = roleHierarchy.indexOf(creatorRole);
  const assignedIndex = roleHierarchy.indexOf(assignedRole);
  
  // Creator's role must be higher than assigned role
  return creatorIndex > assignedIndex;
}

// Helper function to check if user can edit/delete someone with a specific role
function canChangeFromRole(currentUserRole: string, targetUserRole: string): boolean {
  // Define role hierarchy (higher index = higher privilege)
  const roleHierarchy = [
    ROLES.VIEWER,
    ROLES.STAFF,
    ROLES.MANAGER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN
  ];
  
  const currentUserIndex = roleHierarchy.indexOf(currentUserRole);
  const targetUserIndex = roleHierarchy.indexOf(targetUserRole);
  
  // Current user's role must be higher than target user's role
  return currentUserIndex > targetUserIndex;
} 