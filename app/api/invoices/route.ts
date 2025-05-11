import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import Invoice from '@/models/invoice';
import Purchase from '@/models/purchase';
import Product from '@/models/product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';
import Party from '@/models/party';

// Validation schema for query parameters
const QuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10)
});

export async function GET(request: NextRequest) {
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

    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const { 
      search, 
      status, 
      paymentStatus,
      startDate, 
      endDate, 
      sortBy, 
      sortOrder, 
      page, 
      limit 
    } = QuerySchema.parse(params);
    
    // Build query
    const query: any = {};
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { purchaseReference: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus.toLowerCase();
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date.$lte = endDateTime;
      }
    }

    // Set up sort options
    const sortOptions: any = {};
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Count total documents for pagination
    const total = await Invoice.countDocuments(query);
    
    // Fetch invoices with pagination
    const invoices = await Invoice.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Return response
    return NextResponse.json({
      invoices,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: error instanceof Error ? err.message : 'Internal Server Error' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.party || !body.items || !body.items.length) {
      return NextResponse.json(
        { error: 'Party and at least one item are required' },
        { status: 400 }
      );
    }

    // Validate party ID
    if (!isValidObjectId(body.party)) {
      return NextResponse.json(
        { error: 'Invalid party ID' },
        { status: 400 }
      );
    }

    // Look up party name if not provided
    if (!body.partyName) {
      const party = await Party.findById(body.party);
      if (!party) {
        return NextResponse.json(
          { error: 'Party not found' },
          { status: 404 }
        );
      }
      body.partyName = party.name;
    }

    // Generate reference if not provided
    if (!body.reference) {
      body.reference = await Invoice.generateReference();
    }

    // Validate items
    for (const item of body.items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid product ID and quantity' },
          { status: 400 }
        );
      }

      // Lookup product details if not provided
      if (!item.name || !item.price) {
        if (!isValidObjectId(item.product)) {
          return NextResponse.json(
            { error: `Invalid product ID: ${item.product}` },
            { status: 400 }
          );
        }

        const product = await Product.findById(item.product);
        
        if (!product) {
          return NextResponse.json(
            { error: `Product not found for item: ${item.product}` },
            { status: 400 }
          );
        }

        item.name = product.name;
        item.price = product.sellingPrice;
      }

      // Calculate item total
      item.total = item.quantity * item.price;
    }

    // Create the invoice
    const invoice = await Invoice.create(body);

    // Update product quantities
    for (const item of body.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
} 