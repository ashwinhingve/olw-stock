import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import User from '@/models/user';
import { getUserInfo, hasPermission, canManageUser } from '@/lib/userContext';

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

export async function GET(req: NextRequest) {
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
    
    // Get user info from request
    const currentUser = await getUserInfo(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive');
    const adminDomain = searchParams.get('adminDomain') || '';
    
    // Build query with organization filter - this is critical for data isolation
    const query: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
      organization: currentUser.organization
    };
    
    // Apply user isolation based on role
    const fullUser = await User.findById(currentUser.id).select('role managementPath adminDomain');
    
    // Apply admin domain filtering based on role
    if (fullUser.role === ROLES.SUPER_ADMIN) {
      // Super admins can see all users in the organization
      // If adminDomain filter is provided, filter by that specific admin domain
      if (adminDomain) {
        query.adminDomain = adminDomain;
      }
    } else if (fullUser.role === ROLES.ADMIN) {
      // Regular admins can only see users in their admin domain or that they created
      query.$or = [
        { adminDomain: currentUser.id }, // Users directly in this admin's domain
        { createdBy: currentUser.id },   // Users directly created by this admin
        { _id: currentUser.id }         // The admin themselves
      ];
      
      // If the user has a managementPath, include users whose path contains this admin's ID
      if (fullUser.managementPath) {
        query.$or.push({
          managementPath: { $regex: new RegExp(`(^|,)${currentUser.id}(,|$)`) }
        });
      }
    } else if (fullUser.role === ROLES.MANAGER) {
      // Managers can only see users they created or in their admin domain
      query.$or = [
        { createdBy: currentUser.id },   // Users directly created by this manager
        { _id: currentUser.id }         // The manager themselves
      ];
      
      // If the manager is part of an admin domain, include users with same admin domain
      // that are below them in the hierarchy
      if (fullUser.adminDomain) {
        query.$or.push({
          adminDomain: fullUser.adminDomain,
          // Ensure the users are "below" this manager in the hierarchy
          managementPath: { $regex: new RegExp(`(^|,)${currentUser.id}(,|$)`) }
        });
      }
    } else {
      // Staff/Viewers can only see themselves
      query._id = currentUser.id;
    }
    
    // Apply search filter if provided
    if (search) {
      // Create a search filter that respects the existing query constraints
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
      
      // Combine search with existing query
      if (query.$or) {
        // If we already have $or conditions, we need to use $and to combine them
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or; // Remove the original $or since it's now in $and
      } else {
        query.$or = searchConditions;
      }
    }
    
    // Filter by role if provided
    if (role) {
      query.role = role;
      
      // Security check: non-super-admins cannot view super-admin users
      if (role === ROLES.SUPER_ADMIN && fullUser.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view super admin users' },
          { status: 403 }
        );
      }
    }
    
    // Filter by active status if provided
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with secure projection (exclude sensitive data)
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminDomain', 'name email');
    
    // Get total count for pagination
    const totalCount = await User.countDocuments(query);
    
    // Get available roles for filtering based on user's role
    let availableRoles: string[] = [];
    if (fullUser.role === ROLES.SUPER_ADMIN) {
      availableRoles = Object.values(ROLES);
    } else if (fullUser.role === ROLES.ADMIN) {
      availableRoles = Object.values(ROLES).filter(r => r !== ROLES.SUPER_ADMIN);
    } else if (fullUser.role === ROLES.MANAGER) {
      availableRoles = [ROLES.STAFF, ROLES.VIEWER];
    }
    
    // Get admin domains for filtering (only for super admins or admins)
    const adminDomains = [];
    if (fullUser.role === ROLES.SUPER_ADMIN) {
      const domains = await User.find({
        organization: currentUser.organization,
        role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
      }).select('_id name email');
      
      adminDomains.push(...domains);
    }
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        roles: availableRoles,
        adminDomains: adminDomains.length > 0 ? adminDomains : undefined
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    
    // Check if user has permission to create users
    const hasCreatePermission = await hasPermission(req, PERMISSIONS.CREATE_USERS);
    if (!hasCreatePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to create users' },
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
    
    // Parse request body
    const userData = await req.json();
    
    // Get full user data for role-based checks
    const fullUser = await User.findById(currentUser.id).select('role adminDomain managementPath');
    
    // Security measures:
    // 1. Role validation - users can only create users with lower privileges
    if (!isValidRoleAssignment(fullUser.role, userData.role)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to create users with this role' },
        { status: 403 }
      );
    }
    
    // 2. Force organization to be the same as the current user
    userData.organization = currentUser.organization;
    
    // 3. Set creator reference
    userData.createdBy = currentUser.id;
    
    // 4. Set default dataVisibility to most restrictive
    if (!userData.dataVisibility) {
      userData.dataVisibility = 'own';
    }
    
    // 5. Set admin domain appropriately based on creator's role
    if (fullUser.role === ROLES.SUPER_ADMIN || fullUser.role === ROLES.ADMIN) {
      // If creator is an admin, they become the admin domain
      userData.adminDomain = currentUser.id;
    } else if (fullUser.adminDomain) {
      // Non-admins pass along their admin domain
      userData.adminDomain = fullUser.adminDomain;
    }
    
    // Create new user
    const newUser = await User.create(userData);
    
    // Generate management path for the new user
    if (fullUser.managementPath) {
      newUser.managementPath = `${fullUser.managementPath},${currentUser.id}`;
    } else {
      newUser.managementPath = currentUser.id;
    }
    await newUser.save();
    
    // If the creator is an admin/manager, add this user to their managed staff
    if (fullUser.role === ROLES.ADMIN || fullUser.role === ROLES.MANAGER) {
      await User.findByIdAndUpdate(currentUser.id, {
        $addToSet: { managedStaff: newUser._id }
      });
    }
    
    // Exclude sensitive data from response
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      dataVisibility: newUser.dataVisibility,
      isActive: newUser.isActive,
      adminDomain: newUser.adminDomain,
      managementPath: newUser.managementPath,
      createdAt: newUser.createdAt
    };
    
    return NextResponse.json({
      success: true,
      user: userResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate key error (email)
    const err = error as Error; 
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
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