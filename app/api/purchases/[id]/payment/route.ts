import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Importing the mock purchases from the parent route
// In a real app, this would be a database query
let purchases = [];
import('../../route').then(module => {
  purchases = module.default ? module.default.purchases : [];
}).catch(err => console.error('Failed to import purchases:', err));

// Payment status update schema
const paymentUpdateSchema = z.object({
  paymentStatus: z.enum(['pending', 'partial', 'paid']),
  paymentDate: z.string().optional(),
  paymentAmount: z.number().optional(),
  paymentMethod: z.enum(['cash', 'bank', 'credit_card', 'check', 'other']).optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate the payment update data
    const validationResult = paymentUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: validationResult.error.format() },
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
    
    // Update the payment status
    const paymentData = validationResult.data;
    
    const updatedPurchase = {
      ...purchases[index],
      paymentStatus: paymentData.paymentStatus,
      paymentHistory: [
        ...(purchases[index].paymentHistory || []),
        {
          date: paymentData.paymentDate || new Date().toISOString(),
          amount: paymentData.paymentAmount || 0,
          method: paymentData.paymentMethod || 'other',
          reference: paymentData.paymentReference || '',
          notes: paymentData.notes || '',
        }
      ]
    };
    
    purchases[index] = updatedPurchase;
    
    return NextResponse.json({
      message: 'Payment status updated successfully',
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 