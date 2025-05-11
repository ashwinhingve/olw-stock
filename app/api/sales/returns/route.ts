import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SalesReturn from '@/models/salesReturn';
import Invoice from '@/models/invoice';
import Product from '@/models/product';
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
        { returnNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
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
    const sortOptions: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Count total documents for pagination
    const total = await SalesReturn.countDocuments(query);
    
    // Fetch returns with pagination
    const returns = await SalesReturn.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      returns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales returns:', error);
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

    // Validate required fields
    if (!body.customerName || !body.items || !body.items.length || !body.reason) {
      return NextResponse.json(
        { error: 'Customer name, reason, and at least one item are required' },
        { status: 400 }
      );
    }

    // Generate return number if not provided
    if (!body.returnNumber) {
      body.returnNumber = await SalesReturn.generateReturnNumber();
    }

    // If return is for an invoice, validate and populate invoice data
    if (body.invoice) {
      const invoice = await Invoice.findById(body.invoice);
      
      if (!invoice) {
        return NextResponse.json(
          { error: 'Referenced invoice not found' },
          { status: 400 }
        );
      }
      
      // Save the invoice number for reference
      body.invoiceNumber = invoice.invoiceNumber;
      body.customerName = body.customerName || invoice.customerName;
    }

    // Validate and process item details
    for (const item of body.items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid product ID, name, and quantity' },
          { status: 400 }
        );
      }

      // Lookup product details if not provided
      if (!item.productName || !item.price) {
        const product = await Product.findById(item.product);
        
        if (!product) {
          return NextResponse.json(
            { error: `Product not found for item: ${item.product}` },
            { status: 400 }
          );
        }
        
        item.productName = item.productName || product.name;
        item.price = item.price || product.sellingPrice;
      }
      
      // Calculate item total if not provided
      if (!item.total) {
        item.total = item.quantity * item.price;
      }
    }

    // Create new sales return
    const newSalesReturn = await SalesReturn.create(body);
    
    return NextResponse.json(newSalesReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating sales return:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 