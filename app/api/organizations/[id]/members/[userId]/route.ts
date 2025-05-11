import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PERMISSIONS, ROLES } from '@/models/user';
import { isValidObjectId } from 'mongoose';

// GET /api/organizations/[id]/members/[userId] - Get member details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, userId: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if IDs are valid
    if (!isValidObjectId(params.id) || !isValidObjectId(params.userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the requested user exists and belongs to the specified organization
    const user = await User.findOne({ 
      _id: params.userId,
      organization: params.id
    }).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Member not found in this organization' },
        { status: 404 }
      );
    }
    
    // Check if current user has permission to view this member
    if (!currentUser.hasPermission(PERMISSIONS.VIEW_ALL_ORGANIZATIONS) && 
        currentUser.organization.toString() !== params.id &&
        !currentUser.canManageUser(user._id)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view this member' },
        { status: 403 }
      );
    }
    
    // Add information about the user's manager(s) if applicable
    const managedBy = await User.find({
      managedStaff: { $elemMatch: { $eq: user._id } }
    }).select('_id name email role');
    
    // Get staff managed by this user if they are a manager or admin
    let managingStaff = [];
    if (user.role === ROLES.MANAGER || user.role === ROLES.ADMIN) {
      managingStaff = await User.find({
        _id: { $in: user.managedStaff || [] }
      }).select('_id name email role');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...user.toObject(),
        managedBy,
        managingStaff
      }
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching member details' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id]/members/[userId] - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, userId: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if IDs are valid
    if (!isValidObjectId(params.id) || !isValidObjectId(params.userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user to update
    const userToUpdate = await User.findOne({ 
      _id: params.userId,
      organization: params.id
    });
    
    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, message: 'Member not found in this organization' },
        { status: 404 }
      );
    }
    
    // Check permissions
    // 1. Must have EDIT_USERS permission
    // 2. User must be in your organization OR you must have VIEW_ALL_ORGANIZATIONS
    // 3. You must be able to manage this user OR have admin permissions
    if (!currentUser.hasPermission(PERMISSIONS.EDIT_USERS) || 
        (!currentUser.hasPermission(PERMISSIONS.VIEW_ALL_ORGANIZATIONS) && 
         currentUser.organization.toString() !== params.id) ||
        (!currentUser.canManageUser(userToUpdate._id) && 
         !currentUser.hasPermission(PERMISSIONS.EDIT_ALL_USERS))) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to update this member' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Prepare update data
    const updateData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Only allow certain fields to be updated
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.dataVisibility) updateData.dataVisibility = data.dataVisibility;
    
    // Role updates have stricter permissions
    if (data.role) {
      // Check if current user can assign this role
      const availableRoles = currentUser.getAvailableRolesToAssign();
      
      // Cannot change role of a user to a role you cannot assign
      if (!availableRoles.includes(data.role)) {
        return NextResponse.json(
          { success: false, message: 'You do not have permission to assign this role' },
          { status: 403 }
        );
      }
      
      // Cannot demote a user who is your superior
      if (userToUpdate.role !== data.role && userToUpdate.canManageUser(currentUser._id)) {
        return NextResponse.json(
          { success: false, message: 'You cannot modify the role of your superior' },
          { status: 403 }
        );
      }
      
      updateData.role = data.role;
    }
    
    // Update password if provided
    if (data.password) {
      updateData.password = data.password;
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      params.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to update member' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating member' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members/[userId] - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, userId: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if IDs are valid
    if (!isValidObjectId(params.id) || !isValidObjectId(params.userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user to delete
    const userToDelete = await User.findOne({ 
      _id: params.userId,
      organization: params.id
    });
    
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'Member not found in this organization' },
        { status: 404 }
      );
    }
    
    // Check permissions
    // 1. Must have DELETE_USERS permission
    // 2. User must be in your organization OR you must have VIEW_ALL_ORGANIZATIONS
    // 3. You must be able to manage this user OR have admin permissions
    if (!currentUser.hasPermission(PERMISSIONS.DELETE_USERS) || 
        (!currentUser.hasPermission(PERMISSIONS.VIEW_ALL_ORGANIZATIONS) && 
         currentUser.organization.toString() !== params.id) ||
        (!currentUser.canManageUser(userToDelete._id) && 
         !currentUser.hasPermission(PERMISSIONS.DELETE_ALL_USERS))) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete this member' },
        { status: 403 }
      );
    }
    
    // Cannot delete a user who is your superior
    if (userToDelete.canManageUser(currentUser._id)) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your superior' },
        { status: 403 }
      );
    }
    
    // Cannot delete yourself
    if (userToDelete._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 403 }
      );
    }
    
    // Check if the user has any staff members they manage
    if (userToDelete.managedStaff && userToDelete.managedStaff.length > 0) {
      return NextResponse.json(
        { success: false, message: 'This user manages other staff members. Reassign them before deleting this account.' },
        { status: 400 }
      );
    }
    
    // Remove this user from anyone's managedStaff array
    await User.updateMany(
      { managedStaff: userToDelete._id },
      { $pull: { managedStaff: userToDelete._id } }
    );
    
    // Delete the user
    await User.findByIdAndDelete(params.userId);
    
    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting member' },
      { status: 500 }
    );
  }
} 