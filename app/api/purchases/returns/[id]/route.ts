import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PurchaseReturn from '@/models/purchaseReturn';
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
    
    const purchaseReturn = await PurchaseReturn.findById(id);
    
    if (!purchaseReturn) {
      return NextResponse.json({ error: 'Purchase return not found' }, { status: 404 });
    }
    
    // If return is linked to a purchase, populate the purchase details
    if (purchaseReturn.purchase) {
      await purchaseReturn.populate('purchase');
    }
    
    return NextResponse.json(purchaseReturn);
  } catch (error) {
    console.error('Error fetching purchase return:', error);
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
    const purchaseReturn = await PurchaseReturn.findById(id);
    if (!purchaseReturn) {
      return NextResponse.json({ error: 'Purchase return not found' }, { status: 404 });
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
        if (!item.name || !item.price) {
          const product = await Product.findById(item.product);
          
          if (!product) {
            return NextResponse.json(
              { error: `Product not found for item: ${item.product}` },
              { status: 400 }
            );
          }
          
          item.name = item.name || product.name;
          item.price = item.price || product.buyingPrice;
        }
        
        // Calculate item total if not provided
        if (!item.total) {
          item.total = item.quantity * item.price;
        }
      }
    }
    
    // Status transition handling
    if (body.status && body.status !== purchaseReturn.status) {
      // If status is changing to Completed, handle inventory updates
      if (body.status === 'Completed' && purchaseReturn.status !== 'Completed') {
        // Remove items from inventory since they're being returned
        for (const item of purchaseReturn.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: -item.quantity } }
          );
        }
      } 
      // If status was Completed but is now something else, reverse inventory updates
      else if (purchaseReturn.status === 'Completed' && body.status !== 'Completed') {
        // Add items back to inventory
        for (const item of purchaseReturn.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity } }
          );
        }
      }
    }
    
    // Update the purchase return
    const updatedPurchaseReturn = await PurchaseReturn.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedPurchaseReturn);
  } catch (error) {
    console.error('Error updating purchase return:', error);
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
    const purchaseReturn = await PurchaseReturn.findById(id);
    
    if (!purchaseReturn) {
      return NextResponse.json({ error: 'Purchase return not found' }, { status: 404 });
    }
    
    // If return was Completed, reverse the inventory changes before deleting
    if (purchaseReturn.status === 'Completed') {
      for (const item of purchaseReturn.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } }
        );
      }
    }
    
    // Delete the return
    await PurchaseReturn.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Purchase return deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase return:', error);
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 