import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // Connect to the database
    const { db } = await connectToDatabase();
    const collection = db.collection('sales');

    // Build the query filter
    let filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        filter.date.$lt = endDateObj;
      }
    }

    // Count total documents for pagination
    const totalSales = await collection.countDocuments(filter);
    const totalPages = Math.ceil(totalSales / limit);

    // Sort configuration
    const sortConfig: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch the sales
    const sales = await collection
      .find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format the dates and ObjectIds for JSON response
    const formattedSales = sales.map(sale => ({
      ...sale,
      _id: sale._id.toString(),
      date: sale.date instanceof Date ? sale.date.toISOString() : sale.date
    }));

    return NextResponse.json({
      success: true,
      sales: formattedSales,
      pagination: {
        total: totalSales,
        pages: totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.reference || !data.customerName || !data.date || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure date is a Date object
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    const collection = db.collection('sales');
    
    // Generate reference if not provided
    if (!data.reference) {
      const count = await collection.countDocuments();
      data.reference = `SALE-${(count + 1).toString().padStart(5, '0')}`;
    }
    
    // Insert the new sale
    const result = await collection.insertOne(data);
    
    return NextResponse.json({
      success: true,
      sale: {
        ...data,
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
} 