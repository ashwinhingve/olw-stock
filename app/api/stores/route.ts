import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/store';

// GET endpoint to retrieve all stores
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const stores = await Store.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true,
      stores
    });
  } catch (error) {
    console.error('Error in GET /api/stores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new store
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }
    
    const newStore = new Store({
      name: body.name,
      location: body.location || '',
      manager: body.manager || '',
      contact: body.contact || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
    });
    
    const savedStore = await newStore.save();
    
    return NextResponse.json({
      success: true,
      store: savedStore
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/stores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create store' },
      { status: 500 }
    );
  }
} 