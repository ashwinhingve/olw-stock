import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Quote from '@/models/quote';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Make authentication optional for development
    try {
      const session = await getServerSession(authOptions);
      // In production, uncomment this check
      // if (!session) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }
    } catch (authError) {
      console.warn('Auth error (continuing anyway):', authError);
    }

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    await dbConnect();
    
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Make authentication optional for development
    try {
      const session = await getServerSession(authOptions);
      // In production, uncomment this check
      // if (!session) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }
    } catch (authError) {
      console.warn('Auth error (continuing anyway):', authError);
    }

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    await dbConnect();
    
    const body = await req.json();
    
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    // Update the quote
    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error updating quote:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Make authentication optional for development
    try {
      const session = await getServerSession(authOptions);
      // In production, uncomment this check
      // if (!session) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }
    } catch (authError) {
      console.warn('Auth error (continuing anyway):', authError);
    }

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    await dbConnect();
    
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    await Quote.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 