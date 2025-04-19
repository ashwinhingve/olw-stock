import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Product from '@/models/product';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === '') {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Ensure numeric fields are numbers
    const numericFields = ['buyingPrice', 'sellingPrice', 'quantity', 'lowStockThreshold'];
    for (const field of numericFields) {
      if (body[field] !== undefined) {
        body[field] = Number(body[field]);
      }
    }
    
    // Handle empty or invalid store/supplier fields
    if (!body.store || body.store === '') {
      delete body.store;
    }
    
    if (!body.supplier || body.supplier === '') {
      delete body.supplier;
    }
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if sku is changed and if it exists
    if (body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: body.sku });
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle MongoDB validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      interface MongoDBValidationError {
        message: string;
      }
      
      // Add type checking for error.errors
      if ('errors' in error && error.errors && typeof error.errors === 'object') {
        const validationErrors = Object.values(error.errors).map((err: MongoDBValidationError) => err.message);
        return NextResponse.json(
          { error: validationErrors.join(', ') },
          { status: 400 }
        );
      }
    }
    
    // Handle MongoDB duplicate key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }
    
    // Handle MongoDB CastError errors (ObjectId issues)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid ID format for store or supplier' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await connectToDB();
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 