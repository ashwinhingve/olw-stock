import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User, { PERMISSIONS, ROLES } from '@/models/user';

// API endpoint to get user permissions based on their role
export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.append('Cache-Control', 'no-store, max-age=0');
    
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    // Check if user is authenticated - use request parameter for the server side
    const session = await getServerSession(authOptions);
    
    // Debug the session to see what's being returned
    console.log('User session:', session);
    console.log('User email:', session?.user?.email);
    
    if (!session || !session.user) {
      console.error('Unauthorized: No valid session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid session' },
        { status: 401, headers }
      );
    }

    // Make sure we have an email to work with
    if (!session.user.email) {
      console.error('Unauthorized: No email in session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No email in session' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.error(`User not found in database: ${session.user.email}`);
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    console.log('User found in database:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isStoreAdmin: user.role === ROLES.STORE_ADMIN
    });
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Get permissions based on role
    let permissions = [];
    
    // Define role-based permissions
    const rolePermissions = {
      // Store Admin has all permissions
      [ROLES.STORE_ADMIN]: [
        // User permissions
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USERS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.DELETE_USERS,
        // Inventory permissions
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.CREATE_INVENTORY,
        PERMISSIONS.EDIT_INVENTORY,
        PERMISSIONS.DELETE_INVENTORY,
        // Sales permissions
        PERMISSIONS.VIEW_SALES,
        PERMISSIONS.CREATE_SALES,
        PERMISSIONS.EDIT_SALES,
        PERMISSIONS.DELETE_SALES,
        // Purchase permissions
        PERMISSIONS.VIEW_PURCHASES,
        PERMISSIONS.CREATE_PURCHASES,
        PERMISSIONS.EDIT_PURCHASES,
        PERMISSIONS.DELETE_PURCHASES,
        // Reports permissions
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.GENERATE_REPORTS
      ],
      // Sales Operator can only view inventory and manage sales
      [ROLES.SALES_OPERATOR]: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_SALES,
        PERMISSIONS.CREATE_SALES,
        PERMISSIONS.EDIT_SALES,
        PERMISSIONS.VIEW_REPORTS
      ],
      // Sales Purchase Operator can manage sales and purchases
      [ROLES.SALES_PURCHASE_OPERATOR]: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_SALES,
        PERMISSIONS.CREATE_SALES,
        PERMISSIONS.EDIT_SALES,
        PERMISSIONS.VIEW_PURCHASES,
        PERMISSIONS.CREATE_PURCHASES,
        PERMISSIONS.EDIT_PURCHASES,
        PERMISSIONS.VIEW_REPORTS
      ]
    };
    
    // Get permissions for the user's role
    permissions = rolePermissions[user.role] || [];
    
    // Debug log to verify permissions
    console.log(`User permissions for ${user.email} (${user.role}):`, {
      permissionsCount: permissions.length,
      hasViewUsers: permissions.includes(PERMISSIONS.VIEW_USERS),
      hasCreateUsers: permissions.includes(PERMISSIONS.CREATE_USERS),
      role: user.role
    });
    
    // Add cache control headers to prevent caching of permissions
    return NextResponse.json({
      success: true,
      permissions,
      role: user.role,
      isStoreAdmin: user.role === ROLES.STORE_ADMIN
    }, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    // Add CORS headers to error response
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.append('Cache-Control', 'no-store, max-age=0');
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch permissions: ${error.message || 'Unknown error'}`
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const headers = new Headers();
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(null, { status: 204, headers });
} 