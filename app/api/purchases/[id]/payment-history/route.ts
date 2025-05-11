import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Importing the mock purchases from the parent route
// In a real app, this would be a database query
let purchases = [];
import('../../route').then(module => {
  purchases = module.default ? module.default.purchases : [];
}).catch(err => console.error('Failed to import purchases:', err));

// Schema for adding new payment record
const paymentRecordSchema = z.object({
  date: z.string(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'bank', 'credit_card', 'check', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Retrieve payment history for a purchase
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Find the purchase
    const purchase = purchases.find(p => p._id === id);
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }
    
    // Return the payment history
    return NextResponse.json({
      purchaseId: id,
      totalAmount: purchase.totalAmount,
      paidAmount: purchase.paidAmount || 0,
      paymentStatus: purchase.paymentStatus || 'pending',
      paymentHistory: purchase.paymentHistory || []
    });
  } catch (error) {
    console.error('Error retrieving payment history:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Add a new payment record to the history
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate the payment record data
    const validationResult = paymentRecordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payment record data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Find the purchase to update
    const index = purchases.findIndex(p => p._id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }
    
    const paymentRecord = validationResult.data;
    const purchase = purchases[index];
    
    // Add payment record to history
    const paymentHistory = [...(purchase.paymentHistory || []), paymentRecord];
    
    // Calculate total paid amount
    const paidAmount = paymentHistory.reduce((sum, record) => sum + record.amount, 0);
    
    // Determine payment status
    let paymentStatus = 'pending';
    if (paidAmount >= purchase.totalAmount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }
    
    // Update the purchase
    const updatedPurchase = {
      ...purchase,
      paymentHistory,
      paidAmount,
      paymentStatus
    };
    
    purchases[index] = updatedPurchase;
    
    return NextResponse.json({
      message: 'Payment record added successfully',
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Error adding payment record:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a payment record from history
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { recordIndex } = await request.json();
    
    if (typeof recordIndex !== 'number' || recordIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid record index' },
        { status: 400 }
      );
    }
    
    // Find the purchase to update
    const index = purchases.findIndex(p => p._id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }
    
    const purchase = purchases[index];
    
    // Check if payment history exists and has the record
    if (!purchase.paymentHistory || recordIndex >= purchase.paymentHistory.length) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }
    
    // Remove the payment record
    const paymentHistory = purchase.paymentHistory.filter((_, i) => i !== recordIndex);
    
    // Recalculate total paid amount
    const paidAmount = paymentHistory.reduce((sum, record) => sum + record.amount, 0);
    
    // Determine payment status
    let paymentStatus = 'pending';
    if (paidAmount >= purchase.totalAmount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }
    
    // Update the purchase
    const updatedPurchase = {
      ...purchase,
      paymentHistory,
      paidAmount,
      paymentStatus
    };
    
    purchases[index] = updatedPurchase;
    
    return NextResponse.json({
      message: 'Payment record removed successfully',
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Error removing payment record:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 