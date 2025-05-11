import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';

// Define roles and permissions locally since import might be an issue
const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

const PERMISSIONS = {
  CREATE_USERS: 'create_users',
};

// API endpoint to get available roles based on user's current role
export async function GET(request: NextRequest) {
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

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get available roles based on user's role
    let availableRoles = [];
    
    if (user.role === ROLES.ADMIN) {
      // Admins can assign both admin and staff roles
      availableRoles = [ROLES.ADMIN, ROLES.STAFF];
    } else {
      // Staff can't assign roles
      availableRoles = [];
    }
    
    return NextResponse.json({
      success: true,
      roles: availableRoles,
      currentUserRole: user.role,
      hasCreateUserPermission: user.hasPermission(PERMISSIONS.CREATE_USERS)
    });
  } catch (error) {
    console.error('Error fetching available roles:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch roles: ${err.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 