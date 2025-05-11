import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Quote from '@/models/quote';
import Invoice from '@/models/invoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';

export async function POST(
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
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    await dbConnect();
    
    // Find the quote
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    // Check if the quote is already converted
    if (quote.convertedToInvoice) {
      return NextResponse.json({ 
        error: 'Quote already converted to invoice',
        invoiceId: quote.convertedTo
      }, { status: 400 });
    }
    
    // Generate invoice number
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const lastNumber = lastInvoice?.invoiceNumber?.match(/\d+$/) 
      ? parseInt(lastInvoice.invoiceNumber.match(/\d+$/)[0]) 
      : 0;
    const invoiceNumber = `INV-${new Date().getFullYear()}${(lastNumber + 1).toString().padStart(4, '0')}`;
    
    // Create new invoice based on quote data
    const invoiceData = {
      invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      customerAddress: quote.customerAddress,
      items: quote.items,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      discountAmount: quote.discountAmount,
      total: quote.total,
      notes: quote.notes,
      termsAndConditions: quote.termsAndConditions,
      status: 'Unpaid',
      convertedFromQuote: quote._id
    };
    
    // Create the invoice
    const newInvoice = await Invoice.create(invoiceData);
    
    // Update the quote
    quote.convertedToInvoice = true;
    quote.convertedTo = newInvoice._id;
    quote.status = 'Converted';
    await quote.save();
    
    return NextResponse.json({ 
      message: 'Quote successfully converted to invoice',
      invoiceId: newInvoice._id,
      invoice: newInvoice
    }, { status: 201 });
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 