import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    let dbStatus = 'Unknown';
    try {
      await connectToDatabase();
      dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    } catch (error) {
      console.error('DB connection error:', error);
      dbStatus = 'Error connecting';
    }

    // Check User model
    let userModelStatus = 'Unknown';
    let adminExists = false;
    let userCount = 0;
    let userDetails = [];
    
    try {
      userModelStatus = mongoose.models.User ? 'Model exists' : 'Model not found';
      if (mongoose.models.User) {
        userCount = await User.countDocuments();
        adminExists = (await User.countDocuments({ role: 'admin' })) > 0;
        
        // Get details of all users (without passwords)
        const users = await User.find().select('-password');
        userDetails = users.map(user => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
          organization: user.organization?.toString()
        }));
      }
    } catch (error) {
      console.error('User model check error:', error);
      userModelStatus = `Error: ${error.message}`;
    }

    // Check Organization model
    let orgModelStatus = 'Unknown';
    let orgCount = 0;
    let orgDetails = [];
    
    try {
      orgModelStatus = mongoose.models.Organization ? 'Model exists' : 'Model not found';
      if (mongoose.models.Organization) {
        orgCount = await mongoose.models.Organization.countDocuments();
        
        // Get details of all organizations
        const orgs = await mongoose.models.Organization.find();
        orgDetails = orgs.map(org => ({
          id: org._id.toString(),
          name: org.name,
          active: org.active,
          createdBy: org.createdBy?.toString()
        }));
      }
    } catch (error) {
      console.error('Organization model check error:', error);
      orgModelStatus = `Error: ${error.message}`;
    }

    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          mongooseVersion: mongoose.version,
        },
        models: {
          user: {
            status: userModelStatus,
            count: userCount,
            adminExists,
            users: userDetails
          },
          organization: {
            status: orgModelStatus,
            count: orgCount,
            organizations: orgDetails
          }
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
        }
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Debug API error',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 