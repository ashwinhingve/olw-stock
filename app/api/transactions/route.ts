import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/transaction';
import Product from '@/models/product';

interface TransactionQueryFilters {
  type?: string;
  date?: {
    $gte: Date;
    $lte: Date;
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const query: TransactionQueryFilters = {};
    
    if (type) {
      query.type = type;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const transactions = await Transaction.find(query)
      .populate('products.product')
      .sort({ date: -1 });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'date', 'products', 'total'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { error: 'At least one product is required' },
        { status: 400 }
      );
    }
    
    // Create transaction
    const transaction = await Transaction.create(body);
    
    // Update product quantities based on transaction type
    for (const item of body.products) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        continue;
      }
      
      let newQuantity;
      
      switch (body.type) {
        case 'purchase':
          newQuantity = product.quantity + item.quantity;
          break;
        case 'sale':
          newQuantity = product.quantity - item.quantity;
          break;
        case 'return':
          // For returns, we assume it's a customer return (product coming back to inventory)
          newQuantity = product.quantity + item.quantity;
          break;
        case 'adjustment':
          // For adjustments, we set the quantity directly
          newQuantity = item.quantity;
          break;
        default:
          newQuantity = product.quantity;
      }
      
      // Ensure quantity doesn't go below zero
      newQuantity = Math.max(0, newQuantity);
      
      await Product.findByIdAndUpdate(item.product, { quantity: newQuantity });
    }
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 