import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/transaction';
import Product from '@/models/product';

// GET a single transaction
export async function GET(
  request: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDatabase();
    
    const transaction = await Transaction.findById(id).populate('products.product');
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// UPDATE a transaction
export async function PUT(
  request: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDatabase();
    
    const body = await request.json();
    
    // Find the existing transaction to get original product quantities
    const existingTransaction = await Transaction.findById(id);
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Revert the original transaction's effect on product quantities
    if (existingTransaction.type === 'sale' || existingTransaction.type === 'purchase' || existingTransaction.type === 'return') {
      for (const item of existingTransaction.products) {
        const product = await Product.findById(item.product);
        
        if (!product) continue;
        
        let newQuantity;
        
        switch (existingTransaction.type) {
          case 'sale':
            // Add back the sold quantity
            newQuantity = product.quantity + item.quantity;
            break;
          case 'purchase':
            // Remove the purchased quantity
            newQuantity = product.quantity - item.quantity;
            break;
          case 'return':
            // Remove the returned quantity
            newQuantity = product.quantity - item.quantity;
            break;
          default:
            newQuantity = product.quantity;
        }
        
        // Ensure quantity doesn't go below zero
        newQuantity = Math.max(0, newQuantity);
        
        await Product.findByIdAndUpdate(item.product, { quantity: newQuantity });
      }
    }
    
    // Now update the transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    // Apply the updated transaction's effect on product quantities
    if (body.type === 'sale' || body.type === 'purchase' || body.type === 'return') {
      for (const item of body.products) {
        const product = await Product.findById(item.product);
        
        if (!product) continue;
        
        let newQuantity;
        
        switch (body.type) {
          case 'sale':
            // Subtract the sold quantity
            newQuantity = product.quantity - item.quantity;
            break;
          case 'purchase':
            // Add the purchased quantity
            newQuantity = product.quantity + item.quantity;
            break;
          case 'return':
            // Add the returned quantity
            newQuantity = product.quantity + item.quantity;
            break;
          case 'adjustment':
            // For adjustments, we set the quantity directly
            newQuantity = item.quantity;
            break;
          default:
            newQuantity = product.quantity;
        }
        
        // Ensure quantity doesn't go below zero
        newQuantity = Math.max(0, newQuantity);
        
        await Product.findByIdAndUpdate(item.product, { quantity: newQuantity });
      }
    }
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE a transaction
export async function DELETE(
  request: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDatabase();
    
    // Find the transaction to get product quantities
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Revert the transaction's effect on product quantities
    if (transaction.type === 'sale' || transaction.type === 'purchase' || transaction.type === 'return') {
      for (const item of transaction.products) {
        const product = await Product.findById(item.product);
        
        if (!product) continue;
        
        let newQuantity;
        
        switch (transaction.type) {
          case 'sale':
            // Add back the sold quantity
            newQuantity = product.quantity + item.quantity;
            break;
          case 'purchase':
            // Remove the purchased quantity
            newQuantity = product.quantity - item.quantity;
            break;
          case 'return':
            // Remove the returned quantity
            newQuantity = product.quantity - item.quantity;
            break;
          default:
            newQuantity = product.quantity;
        }
        
        // Ensure quantity doesn't go below zero
        newQuantity = Math.max(0, newQuantity);
        
        await Product.findByIdAndUpdate(item.product, { quantity: newQuantity });
      }
    }
    
    // Delete the transaction
    await Transaction.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
} 