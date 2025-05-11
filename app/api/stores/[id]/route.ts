import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/store';
import mongoose from 'mongoose';

// GET a store by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid store ID format' },
        { status: 400 }
      );
    }
    
    const store = await Store.findById(params.id);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error(`Error in GET /api/stores/${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

// UPDATE a store by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid store ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }
    
    const updatedStore = await Store.findByIdAndUpdate(
      params.id,
      { 
        name: body.name,
        location: body.location,
        manager: body.manager,
        contact: body.contact,
        isActive: body.isActive
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedStore) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, store: updatedStore });
  } catch (error) {
    console.error(`Error in PUT /api/stores/${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update store' },
      { status: 500 }
    );
  }
}

// DELETE a store by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid store ID format' },
        { status: 400 }
      );
    }
    
    const deletedStore = await Store.findByIdAndDelete(params.id);
    
    if (!deletedStore) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error(`Error in DELETE /api/stores/${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete store' },
      { status: 500 }
    );
  }
} 