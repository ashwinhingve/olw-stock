import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Invoice from '@/models/invoice';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Use the static method from the model to generate a reference
    // If the method doesn't exist, generate manually
    let reference = '';
    
    if (typeof Invoice.generateReference === 'function') {
      reference = await Invoice.generateReference();
    } else {
      // Fallback generation logic
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await Invoice.countDocuments();
      reference = `INV-${year}${month}${String(count + 1).padStart(4, '0')}`;
    }
    
    return NextResponse.json({ reference });
  } catch (error) {
    console.error('Error generating invoice reference:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to generate reference' },
      { status: 500 }
    );
  }
} 