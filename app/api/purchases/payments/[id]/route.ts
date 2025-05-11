import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PurchasePayment from '@/models/purchasePayment';
import Purchase from '@/models/purchase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    const payment = await PurchasePayment.findById(id);
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // If payment has a purchase reference, populate it
    if (payment.purchase) {
      await payment.populate('purchase');
    }
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find the current payment to get original amount
    const currentPayment = await PurchasePayment.findById(id);
    if (!currentPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    const body = await req.json();
    
    // If amount has changed, we need to update the related purchase
    if (body.amount !== undefined && body.amount !== currentPayment.amount) {
      // Handle purchase updates if this payment was linked to a purchase
      if (currentPayment.purchase) {
        const purchase = await Purchase.findById(currentPayment.purchase);
        
        if (purchase) {
          // Calculate the new payment total for the purchase
          const oldPaymentAmount = currentPayment.amount;
          const newPaymentAmount = body.amount;
          const difference = newPaymentAmount - oldPaymentAmount;
          
          const newPaymentTotal = (purchase.paidAmount || 0) + difference;
          
          // Update the purchase with the new payment total
          await Purchase.findByIdAndUpdate(
            currentPayment.purchase,
            { 
              $set: { 
                paidAmount: newPaymentTotal,
                paymentStatus: newPaymentTotal >= purchase.total ? 'paid' : (newPaymentTotal > 0 ? 'partial' : 'unpaid')
              } 
            }
          );
          
          // Also update the payment history
          const paymentHistoryIndex = purchase.paymentHistory?.findIndex(
            p => p.reference === currentPayment.reference
          );
          
          if (paymentHistoryIndex !== undefined && paymentHistoryIndex >= 0) {
            const paymentHistory = [...purchase.paymentHistory];
            paymentHistory[paymentHistoryIndex] = {
              ...paymentHistory[paymentHistoryIndex],
              amount: newPaymentAmount,
              method: (body.paymentMethod || currentPayment.paymentMethod).toLowerCase(),
              notes: body.notes || paymentHistory[paymentHistoryIndex].notes
            };
            
            await Purchase.findByIdAndUpdate(
              currentPayment.purchase,
              { $set: { paymentHistory } }
            );
          }
        }
      }
    }
    
    // Update the payment
    const updatedPayment = await PurchasePayment.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find the payment first to get its data
    const payment = await PurchasePayment.findById(id);
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // If payment was for a purchase, update the purchase payment status
    if (payment.purchase) {
      const purchase = await Purchase.findById(payment.purchase);
      
      if (purchase) {
        // Subtract this payment from the purchase's total payments
        const newPaymentTotal = Math.max(0, (purchase.paidAmount || 0) - payment.amount);
        
        // Also remove this payment from the payment history
        const paymentHistory = purchase.paymentHistory?.filter(
          p => p.reference !== payment.reference
        ) || [];
        
        await Purchase.findByIdAndUpdate(
          payment.purchase,
          { 
            $set: { 
              paidAmount: newPaymentTotal,
              paymentHistory,
              paymentStatus: newPaymentTotal >= purchase.total ? 'paid' : (newPaymentTotal > 0 ? 'partial' : 'unpaid')
            } 
          }
        );
      }
    }
    
    // Delete the payment
    await PurchasePayment.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 