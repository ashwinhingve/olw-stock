import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/payment';
import Invoice from '@/models/invoice';
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

    await dbConnect();
    
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // If payment has an invoice reference, populate it
    if (payment.invoice) {
      await payment.populate('invoice');
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

    await dbConnect();
    
    // Find the current payment to get original amount
    const currentPayment = await Payment.findById(id);
    if (!currentPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    const body = await req.json();
    
    // If amount or invoice has changed, we need to update the related invoice
    if (body.amount !== undefined && body.amount !== currentPayment.amount) {
      // Handle invoice updates if this payment was linked to an invoice
      if (currentPayment.invoice) {
        const invoice = await Invoice.findById(currentPayment.invoice);
        
        if (invoice) {
          // Calculate the new payment total for the invoice
          const oldPaymentAmount = currentPayment.amount;
          const newPaymentAmount = body.amount;
          const difference = newPaymentAmount - oldPaymentAmount;
          
          const newPaymentTotal = (invoice.paymentMade || 0) + difference;
          
          // Update the invoice with the new payment total
          await Invoice.findByIdAndUpdate(
            currentPayment.invoice,
            { 
              $set: { 
                paymentMade: newPaymentTotal,
                status: newPaymentTotal >= invoice.total ? 'Paid' : (newPaymentTotal > 0 ? 'Partially Paid' : 'Unpaid')
              } 
            }
          );
        }
      }
    }
    
    // Update the payment
    const updatedPayment = await Payment.findByIdAndUpdate(
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

    await dbConnect();
    
    // Find the payment first to get its data
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // If payment was for an invoice, update the invoice payment status
    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      
      if (invoice) {
        // Subtract this payment from the invoice's total payments
        const newPaymentTotal = Math.max(0, (invoice.paymentMade || 0) - payment.amount);
        
        await Invoice.findByIdAndUpdate(
          payment.invoice,
          { 
            $set: { 
              paymentMade: newPaymentTotal,
              status: newPaymentTotal >= invoice.total ? 'Paid' : (newPaymentTotal > 0 ? 'Partially Paid' : 'Unpaid')
            } 
          }
        );
      }
    }
    
    // Delete the payment
    await Payment.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 