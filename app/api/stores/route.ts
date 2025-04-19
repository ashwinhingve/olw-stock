import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Store from '@/models/store';

export async function GET() {
  try {
    await connectToDatabase();
    
    const stores = await Store.find().sort({ name: 1 });
    
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      );
    }
    
    // Check if store with name already exists
    const existingStore = await Store.findOne({ name: body.name });
    if (existingStore) {
      return NextResponse.json(
        { error: 'Store with this name already exists' },
        { status: 400 }
      );
    }
    
    const store = await Store.create(body);
    
    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
} 