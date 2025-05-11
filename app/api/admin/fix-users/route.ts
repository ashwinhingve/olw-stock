import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find all users
    const users = await User.find();
    const results = [];
    
    // Go through each user and ensure isActive is set
    for (const user of users) {
      const originalState = {
        id: user._id.toString(),
        email: user.email,
        isActive: user.isActive,
      };
      
      if (user.isActive === undefined || user.isActive === null) {
        user.isActive = true;
        await user.save();
        results.push({
          ...originalState,
          fixed: true,
          newState: { isActive: true }
        });
      } else {
        results.push({
          ...originalState,
          fixed: false,
          message: 'No changes needed'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Checked ${users.length} users`,
      results
    });
  } catch (error) {
    console.error('Fix users error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fixing users', error: error.message },
      { status: 500 }
    );
  }
} 