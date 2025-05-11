import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SalesReturn from '@/models/salesReturn';
import Product from '@/models/product';
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
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    await dbConnect();
    
    const salesReturn = await SalesReturn.findById(id);
    
    if (!salesReturn) {
      return NextResponse.json({ error: 'Sales return not found' }, { status: 404 });
    }
    
    // If return is linked to an invoice, populate the invoice details
    if (salesReturn.invoice) {
      await salesReturn.populate('invoice');
    }
    
    return NextResponse.json(salesReturn);
  } catch (error) {
    console.error('Error fetching sales return:', error);
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
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    await dbConnect();
    
    // Find the current return to check if it exists
    const salesReturn = await SalesReturn.findById(id);
    if (!salesReturn) {
      return NextResponse.json({ error: 'Sales return not found' }, { status: 404 });
    }
    
    const body = await req.json();
    
    // If updating items, validate and process item details
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        if (!item.product || !item.quantity || item.quantity < 1) {
          return NextResponse.json(
            { error: 'Each item must have a valid product ID, name, and quantity' },
            { status: 400 }
          );
        }
        
        // Lookup product details if not provided
        if (!item.productName || !item.price) {
          const product = await Product.findById(item.product);
          
          if (!product) {
            return NextResponse.json(
              { error: `Product not found for item: ${item.product}` },
              { status: 400 }
            );
          }
          
          item.productName = item.productName || product.name;
          item.price = item.price || product.sellingPrice;
        }
        
        // Calculate item total if not provided
        if (!item.total) {
          item.total = item.quantity * item.price;
        }
      }
    }
    
    // Status transition handling
    if (body.status && body.status !== salesReturn.status) {
      // If status is changing to Completed, handle inventory updates
      if (body.status === 'Completed' && salesReturn.status !== 'Completed') {
        // Add items back to inventory
        for (const item of salesReturn.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity } }
          );
        }
      } 
      // If status was Completed but is now something else, reverse inventory updates
      else if (salesReturn.status === 'Completed' && body.status !== 'Completed') {
        // Remove items from inventory
        for (const item of salesReturn.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: -item.quantity } }
          );
        }
      }
    }
    
    // Update the sales return
    const updatedSalesReturn = await SalesReturn.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedSalesReturn);
  } catch (error) {
    console.error('Error updating sales return:', error);
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
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    await dbConnect();
    
    // Find the return to check if it exists and get its data
    const salesReturn = await SalesReturn.findById(id);
    
    if (!salesReturn) {
      return NextResponse.json({ error: 'Sales return not found' }, { status: 404 });
    }
    
    // If return was Completed, reverse the inventory changes before deleting
    if (salesReturn.status === 'Completed') {
      for (const item of salesReturn.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } }
        );
      }
    }
    
    // Delete the return
    await SalesReturn.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Sales return deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales return:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 