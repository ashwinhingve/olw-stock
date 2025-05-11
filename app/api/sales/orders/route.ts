import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Order from '@/models/order';
import Customer from '@/models/customer';
import Product from '@/models/product';
import mongoose from 'mongoose';

// GET all orders with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build filter
    const filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.date.$lte = endDateObj;
      }
    }
    
    // Build sort
    const sort: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const orders = await Order.find(filter)
      .sort(sort)
      .populate('customer', 'name email phone')
      .lean();
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST create a new order
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.customerName || !body.items || !body.items.length) {
      return NextResponse.json(
        { error: 'Customer name and at least one item are required' },
        { status: 400 }
      );
    }
    
    // Get or create customer
    let customer;
    if (body.customer && mongoose.Types.ObjectId.isValid(body.customer)) {
      customer = await Customer.findById(body.customer);
      if (!customer) {
        return NextResponse.json(
          { error: 'Selected customer not found' },
          { status: 400 }
        );
      }
    } else if (body.customerName) {
      // Create a new customer if we only have the name
      customer = await Customer.findOneAndUpdate(
        { name: body.customerName },
        { name: body.customerName },
        { upsert: true, new: true }
      );
    }
    
    // Validate and populate product data for items
    const populatedItems = [];
    for (const item of body.items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid product and quantity' },
          { status: 400 }
        );
      }
      
      // Fetch product from database to get current price and name
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found for item: ${item.product}` },
          { status: 400 }
        );
      }
      
      populatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price || product.sellingPrice,
        total: (item.price || product.sellingPrice) * item.quantity
      });
    }
    
    // Generate order number (you can customize this format)
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${(10001 + orderCount).toString().padStart(5, '0')}`;
    
    // Create the new order
    const newOrder = new Order({
      orderNumber,
      date: body.date || new Date(),
      customer: customer._id,
      customerName: customer.name,
      items: populatedItems,
      status: body.status || 'Pending',
      paymentStatus: body.paymentStatus || 'Unpaid',
      expectedDate: body.expectedDate,
      notes: body.notes,
      deliveryAddress: body.deliveryAddress,
      taxRate: body.taxRate || 0,
      discountAmount: body.discountAmount || 0,
      shippingAmount: body.shippingAmount || 0
    });
    
    await newOrder.save();
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 