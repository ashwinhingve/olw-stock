import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import { ROLES } from '@/models/user';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if any admin users exist
    const adminCount = await User.countDocuments({ role: ROLES.STORE_ADMIN });
    
    return NextResponse.json({
      success: true,
      adminExists: adminCount > 0
    });
  } catch (error) {
    console.error('Error checking for admin accounts:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while checking for admin accounts' },
      { status: 500 }
    );
  }
} 