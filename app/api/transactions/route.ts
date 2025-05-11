import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Transaction Schema
const TransactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['income', 'expense', 'transfer'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  account: {
    type: String,
    required: [true, 'Account is required'],
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create or get the model
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const account = searchParams.get('account') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query
    const query: any = {};
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { account: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (account && account !== 'all') {
      query.account = account;
    }
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Create sort object for MongoDB
    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count
    const total = await Transaction.countDocuments(query);
    
    // Get transactions with pagination and sorting
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get unique accounts
    const accounts = await Transaction.distinct('account');
    
    // Calculate summary data
    const [incomeData, expenseData] = await Promise.all([
      Transaction.aggregate([
        { $match: { $or: [{ type: 'income' }, { $and: [{ type: 'transfer' }, { amount: { $gt: 0 } }] }] } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
      ]),
      Transaction.aggregate([
        { $match: { $or: [{ type: 'expense' }, { $and: [{ type: 'transfer' }, { amount: { $lt: 0 } }] }] } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
      ])
    ]);
    
    const totalIncome = incomeData.length ? incomeData[0].total : 0;
    const totalExpense = expenseData.length ? expenseData[0].total : 0;
    
    return NextResponse.json({
      success: true,
      transactions,
      accounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch transactions: ${err.message || 'Database connection error'}`
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['date', 'description', 'type', 'category', 'amount', 'account'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === '') {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Ensure amount is a number
    body.amount = Number(body.amount);
    
    // Generate transaction ID if not provided
    if (!body.id) {
      const transactionCount = await Transaction.countDocuments();
      body.id = `TRX-${10000 + transactionCount + 1}`;
    }
    
    const transaction = await Transaction.create(body);
    
    return NextResponse.json({
      success: true,
      transaction
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create transaction: ${err.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 