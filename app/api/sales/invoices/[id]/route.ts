import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Invoice from '@/models/invoice';
import Customer from '@/models/customer';

// Define an interface for invoice item
interface InvoiceItem {
  product: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

// GET handler - get a single invoice by ID
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT handler - update an invoice
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const body = await request.json();
    
    // Check if invoice exists
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Calculate totals if items are changed
    if (body.items && body.items.length > 0) {
      const subtotal = body.items.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0);
      body.subtotal = subtotal;
      
      // If taxTotal and discountTotal are provided, use them; otherwise, use existing
      const taxTotal = body.taxTotal !== undefined ? body.taxTotal : existingInvoice.taxTotal;
      const discountTotal = body.discountTotal !== undefined ? body.discountTotal : existingInvoice.discountTotal;
      
      body.total = subtotal + taxTotal - discountTotal;
      
      // Calculate balance based on amount paid
      const amountPaid = body.amountPaid !== undefined ? body.amountPaid : existingInvoice.amountPaid;
      body.balance = body.total - amountPaid;
      
      // Status will be determined by pre-save hook
    }
    
    // If customer ID is provided but customer name is not, fetch customer name
    if (body.customer && !body.customerName) {
      const customer = await Customer.findById(body.customer);
      if (customer) {
        body.customerName = customer.name;
      }
    }
    
    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    
    // Type guard to check if error is an object with a name property
    if (error instanceof Error) {
      // Type guard for ValidationError
      if (error.name === 'ValidationError' && 'errors' in error) {
        // For MongoDB ValidationError
        const mongoError = error as Error & { errors: Record<string, { message: string }> };
        const validationErrors = Object.values(mongoError.errors).map((err) => err.message);
        return NextResponse.json(
          { error: validationErrors.join(', ') },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an invoice
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // In a real system, you might want to check if there are payments linked to this invoice
    // and handle accordingly (e.g., return error or delete related payments)
    
    await Invoice.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
} 