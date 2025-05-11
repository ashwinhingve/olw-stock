import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...");
    
    // Try to connect to MongoDB
    const connection = await dbConnect();
    
    // Get connection status
    const readyState = mongoose.connection.readyState;
    
    // Get status text
    let status = '';
    switch (readyState) {
      case 0:
        status = 'disconnected';
        break;
      case 1:
        status = 'connected';
        break;
      case 2:
        status = 'connecting';
        break;
      case 3:
        status = 'disconnecting';
        break;
      default:
        status = 'unknown';
    }
    
    // Connection successful
    return NextResponse.json({
      success: true,
      message: `Database connection test successful: ${status}`,
      status: readyState,
      statusText: status,
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host,
      dbPort: mongoose.connection.port,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    
    // Connection failed
    const err = error as Error;
    return NextResponse.json({
      success: false,
      message: "Database connection test failed",
      error: err.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
} 