import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { PERMISSIONS } from '@/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Reset password for a staff member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Check if current user has permission to edit users
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.hasPermission(PERMISSIONS.EDIT_USERS)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate object ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Find user to reset password
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Update user with new password
    user.password = tempPassword;
    
    // In a real system, you would also set resetPasswordToken and resetPasswordExpire
    // for a more secure flow where the user must change their password
    
    await user.save();

    // In production, send an email with temp password
    // For now, we'll return it in the response (NOT SECURE FOR PRODUCTION)

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.name}`,
      tempPassword // Remove this in production and send via email instead
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to reset password: ${err.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 