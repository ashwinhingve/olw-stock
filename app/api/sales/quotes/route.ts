import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Quote from '@/models/quote';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    await dbConnect();
    
    // Get query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Build query
    const query: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (search) {
      query.$or = [
        { quoteNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    // Set up sort options
    const sortOptions: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Count total documents for pagination
    const total = await Quote.countDocuments(query);
    
    // Fetch quotes with pagination
    const quotes = await Quote.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      quotes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    await dbConnect();
    
    const body = await req.json();

    // Generate quote number if not provided
    if (!body.quoteNumber) {
      const lastQuote = await Quote.findOne().sort({ createdAt: -1 });
      const lastNumber = lastQuote?.quoteNumber?.match(/\d+$/) 
        ? parseInt(lastQuote.quoteNumber.match(/\d+$/)[0]) 
        : 0;
      body.quoteNumber = `QT-${new Date().getFullYear()}${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    // Create new quote
    const newQuote = await Quote.create(body);
    
    return NextResponse.json(newQuote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 