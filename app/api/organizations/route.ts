import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/organization';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PERMISSIONS } from '@/models/user';

// GET /api/organizations - List organizations (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - only users with VIEW_ORGANIZATIONS permission
    if (!user.hasPermission(PERMISSIONS.VIEW_ORGANIZATIONS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view organizations' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Max 50 per page
    const skip = (page - 1) * limit;
    
    // Build query based on user's access level
    let query: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Regular users can only see their own organization
    if (!user.hasPermission(PERMISSIONS.VIEW_ALL_ORGANIZATIONS)) {
      query._id = user.organization;
    }
    
    // Count total organizations matching query
    const total = await Organization.countDocuments(query);
    
    // Get organizations
    const organizations = await Organization.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: organizations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching organizations' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - only users with CREATE_ORGANIZATIONS permission
    if (!user.hasPermission(PERMISSIONS.CREATE_ORGANIZATIONS)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to create organizations' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { success: false, message: 'Organization name is required' },
        { status: 400 }
      );
    }
    
    // Create organization
    const organization = await Organization.create({
      name: data.name,
      description: data.description,
      active: data.active !== undefined ? data.active : true,
      logo: data.logo,
      address: data.address,
      contact: data.contact,
      createdBy: user._id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the organization' },
      { status: 500 }
    );
  }
} 