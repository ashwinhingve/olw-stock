import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid sale ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const sale = await db.collection('sales').findOne({ _id: new ObjectId(id) });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Format the ObjectId and dates for JSON
    const formattedSale = {
      ...sale,
      _id: sale._id.toString(),
      date: sale.date instanceof Date ? sale.date.toISOString() : sale.date
    };

    return NextResponse.json({
      success: true,
      sale: formattedSale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid sale ID' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Prevent changing the ID
    delete data._id;
    
    // Ensure date is a Date object
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('sales').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Get the updated sale
    const updatedSale = await db.collection('sales').findOne({ _id: new ObjectId(id) });
    
    // Format the ObjectId and dates for JSON
    const formattedSale = {
      ...updatedSale,
      _id: updatedSale._id.toString(),
      date: updatedSale.date instanceof Date ? updatedSale.date.toISOString() : updatedSale.date
    };

    return NextResponse.json({
      success: true,
      sale: formattedSale
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid sale ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('sales').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
} 