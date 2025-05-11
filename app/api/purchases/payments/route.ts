import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PurchasePayment from '@/models/purchasePayment';
import Purchase from '@/models/purchase';
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

    await connectToDatabase();
    
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
        { reference: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { purchaseReference: { $regex: search, $options: 'i' } },
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
    const total = await PurchasePayment.countDocuments(query);
    
    // Fetch payments with pagination
    const payments = await PurchasePayment.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
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

    await connectToDatabase();
    
    const body = await req.json();

    // Validate required fields
    if (!body.amount || !body.supplierName || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Amount, supplier name, and payment method are required' },
        { status: 400 }
      );
    }

    // Generate reference if not provided
    if (!body.reference) {
      body.reference = await PurchasePayment.generateReference();
    }

    // If payment is for a purchase, update purchase payment status
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
      
      // Update purchase payment status
      const newPaymentTotal = (purchase.paidAmount || 0) + body.amount;
      
      // Add to payment history
      const paymentHistoryEntry = {
        date: body.date || new Date(),
        amount: body.amount,
        method: body.paymentMethod.toLowerCase(),
        reference: body.reference,
        notes: body.notes || ''
      };
      
      const paymentHistory = purchase.paymentHistory 
        ? [...purchase.paymentHistory, paymentHistoryEntry]
        : [paymentHistoryEntry];
      
      await Purchase.findByIdAndUpdate(
        body.purchase,
        { 
          $set: { 
            paidAmount: newPaymentTotal,
            paymentHistory,
            // If payment covers the purchase, mark as paid
            paymentStatus: newPaymentTotal >= purchase.total ? 'paid' : 'partial'
          } 
        }
      );
    }

    // Create new payment
    const newPayment = await PurchasePayment.create(body);
    
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 