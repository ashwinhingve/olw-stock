import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import User from '@/models/user';
import { connectToDB } from '@/lib/mongodb';
import { UserTokenPayload } from '@/lib/tokenUtils';

// User info returned from token or headers
export interface UserContext {
  id: string;
  role: string;
  organization: string;
  adminDomain?: string;
}

// Filter criteria type
export interface DataFilter {
  organization?: string;
  userId?: string;
  storeId?: { $in: string[] };
  adminDomain?: string;
  $or?: Array<Record<string, unknown>>;
  _id?: { $exists: boolean };
  [key: string]: unknown;
}

// Get user info from NextAuth session or JWT token
export async function getUserInfo(req: NextRequest): Promise<UserContext | null> {
  try {
    // Try to get user info from request headers (set by middleware)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const userOrg = req.headers.get('x-user-organization');
    const adminDomain = req.headers.get('x-admin-domain');
    
    // If we have all user info from headers, return it
    if (userId && userRole && userOrg) {
      return {
        id: userId,
        role: userRole,
        organization: userOrg,
        adminDomain: adminDomain || undefined
      };
    }
  
    // If not, try to get from token
    const token = req.cookies.get('token')?.value || 
      req.headers.get('Authorization')?.replace('Bearer ', '');
  
    if (!token) {
      return null;
    }
  
    try {
      // Verify token using jose
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-jwt-secret'
      );
      const { payload } = await jwtVerify(token, secret);
      
      if (!payload || !payload.id) {
        return null;
      }
      
      // If we're missing organization info, fetch user from DB
      if (!payload.organization || !payload.adminDomain) {
        await connectToDB();
        const user = await User.findById(payload.id).select('role organization isActive adminDomain');
        
        if (!user) {
          return null;
        }
        
        // Verify user is active
        if (!user.isActive) {
          return null;
        }
  
        return {
          id: payload.id as string,
          role: payload.role as string || user.role,
          organization: user.organization.toString(),
          adminDomain: user.adminDomain ? user.adminDomain.toString() : undefined
        };
      }
      
      return {
        id: payload.id as string,
        role: payload.role as string,
        organization: payload.organization as string,
        adminDomain: payload.adminDomain as string || undefined
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Check if the user is an admin
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const userInfo = await getUserInfo(req);
  if (!userInfo) return false;
  
  // Double check with database to prevent role spoofing
  await connectToDB();
  const user = await User.findById(userInfo.id).select('role isActive');
  
  if (!user || !user.isActive) return false;
  
  return user.role === 'admin' || user.role === 'super_admin';
}

// Check if the user is a super admin
export async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const userInfo = await getUserInfo(req);
  if (!userInfo) return false;
  
  // Double check with database to prevent role spoofing
  await connectToDB();
  const user = await User.findById(userInfo.id).select('role isActive');
  
  if (!user || !user.isActive) return false;
  
  return user.role === 'super_admin';
}

// Create a filter that restricts data to the current user's organization
// and applies additional user visibility restrictions
export async function createDataFilter(req: NextRequest): Promise<DataFilter> {
  try {
    const userInfo = await getUserInfo(req);
    
    if (!userInfo) {
      throw new Error('User not authenticated');
    }
    
    // Connect to DB to get user details for permission check
    await connectToDB();
    const user = await User.findById(userInfo.id).select('role organization isActive dataVisibility assignedStores adminDomain managementPath');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    
    // ALWAYS enforce organization boundary as the primary isolation boundary
    const filter: DataFilter = {
      organization: userInfo.organization
    };
    
    // Apply data visibility rules based on user settings
    // Enhanced to ensure proper data isolation for ALL users
    if (user.dataVisibility === 'own') {
      // User can only see their own data
      filter.userId = userInfo.id;
    } else if (user.dataVisibility === 'store' && user.assignedStores?.length > 0) {
      // User can see data from their assigned stores
      filter.storeId = { $in: user.assignedStores };
    } else if (user.dataVisibility === 'admin_group' && user.managementPath) {
      // User can see data from their admin domain
      if (user.adminDomain) {
        // For staff/managers: find users whose management path includes this user's admin domain
        filter.$or = [
          { userId: userInfo.id }, // Always include own data
          { adminDomain: user.adminDomain }
        ];
        
        // If user is an admin, include all users in their admin domain
        if (user.role === 'admin' || user.role === 'super_admin') {
          // The management path approach allows hierarchical data access
          filter.$or.push({ 
            managementPath: { 
              $regex: new RegExp(`(^|,)${userInfo.id}(,|$)`) 
            } 
          });
        }
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        // For admins without an admin domain, they can see data from users they manage
        filter.$or = [
          { userId: userInfo.id }, // Always include own data
          { adminDomain: userInfo.id },
          { 
            managementPath: { 
              $regex: new RegExp(`(^|,)${userInfo.id}(,|$)`) 
            } 
          }
        ];
      } else {
        // Fallback to own data if there's no admin domain relationship
        filter.userId = userInfo.id;
      }
    } else if (user.dataVisibility === 'all') {
      // User can see all data within their organization
      // Super admins can see everything in the organization
      if (user.role !== 'super_admin' && user.role !== 'admin') {
        // Non-admin users with 'all' visibility still need some restrictions
        // Restrict to their administrative domain if they have one
        if (user.adminDomain) {
          filter.adminDomain = user.adminDomain;
        }
      }
      // Otherwise, organization filter is already applied
    } else {
      // Default to most restrictive policy if settings are invalid
      filter.userId = userInfo.id;
    }
    
    return filter;
  } catch (error) {
    console.error('Error creating data filter:', error);
    // Return a filter that will return no data (fail safe)
    return { _id: { $exists: false } };
  }
}

// Check if user has permission to access specific data
export async function canAccessData(
  req: NextRequest, 
  dataOwnerId: string, 
  dataStoreId: string,
  dataOrganizationId: string,
  dataAdminDomainId?: string
): Promise<boolean> {
  try {
    const userInfo = await getUserInfo(req);
    
    if (!userInfo) {
      return false;
    }
    
    // First check organization - this is the non-negotiable isolation boundary
    if (userInfo.organization !== dataOrganizationId.toString()) {
      return false;
    }
    
    // Connect to DB to get user details for permission check
    await connectToDB();
    const user = await User.findById(userInfo.id);
    
    if (!user || !user.isActive) {
      return false;
    }
    
    // Use the enhanced canAccessData method with admin domain support
    return user.canAccessData(
      dataOwnerId, 
      dataStoreId, 
      dataAdminDomainId || user.adminDomain?.toString() || '', 
      dataOrganizationId
    );
  } catch (error) {
    console.error('Error checking data access:', error);
    return false;
  }
}

// Check if user has a specific permission
export async function hasPermission(req: NextRequest, permission: string): Promise<boolean> {
  try {
    const userInfo = await getUserInfo(req);
    
    if (!userInfo) {
      return false;
    }
    
    // Connect to DB to get user permissions
    await connectToDB();
    const user = await User.findById(userInfo.id);
    
    if (!user || !user.isActive) {
      return false;
    }
    
    return user.hasPermission(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Check if user can manage another user
export async function canManageUser(req: NextRequest, targetUserId: string): Promise<boolean> {
  try {
    const userInfo = await getUserInfo(req);
    
    if (!userInfo) {
      return false;
    }
    
    // Connect to DB to get user permissions
    await connectToDB();
    const user = await User.findById(userInfo.id);
    
    if (!user || !user.isActive) {
      return false;
    }
    
    return user.canManageUser(targetUserId);
  } catch (error) {
    console.error('Error checking management permission:', error);
    return false;
  }
} 