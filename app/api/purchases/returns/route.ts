import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PurchaseReturn from '@/models/purchaseReturn';
import Purchase from '@/models/purchase';
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
        { supplierName: { $regex: search, $options: 'i' } },
        { purchaseReference: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
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
    const total = await PurchaseReturn.countDocuments(query);
    
    // Fetch returns with pagination
    const returns = await PurchaseReturn.find(query)
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
    console.error('Error fetching purchase returns:', error);
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
    if (!body.supplierName || !body.items || !body.items.length || !body.reason) {
      return NextResponse.json(
        { error: 'Supplier name, reason, and at least one item are required' },
        { status: 400 }
      );
    }

    // Generate return number if not provided
    if (!body.returnNumber) {
      body.returnNumber = await PurchaseReturn.generateReturnNumber();
    }

    // If return is for a purchase, validate and populate purchase data
    if (body.purchase) {
      const purchase = await Purchase.findById(body.purchase);
      
      if (!purchase) {
        return NextResponse.json(
          { error: 'Referenced purchase not found' },
          { status: 400 }
        );
      }
      
      // Save the purchase reference for easier lookup
      body.purchaseReference = purchase.reference;
      body.supplierName = body.supplierName || purchase.supplierName;
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
      if (!item.name || !item.price) {
        const product = await Product.findById(item.product);
        
        if (!product) {
          return NextResponse.json(
            { error: `Product not found for item: ${item.product}` },
            { status: 400 }
          );
        }
        
        item.name = item.name || product.name;
        item.price = item.price || product.buyingPrice;
      }
      
      // Calculate item total if not provided
      if (!item.total) {
        item.total = item.quantity * item.price;
      }
    }

    // Create new purchase return
    const newPurchaseReturn = await PurchaseReturn.create(body);
    
    // If status is completed, update product quantities immediately
    if (body.status === 'Completed') {
      for (const item of body.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } }
        );
      }
    }
    
    return NextResponse.json(newPurchaseReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase return:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 