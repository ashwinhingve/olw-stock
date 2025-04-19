import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Product from '@/models/product';

interface ProductQueryFilters {
  category?: string;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  $expr?: { $lte: [string, string] };
}

interface ValidationError extends Error {
  name: string;
  errors: Record<string, { message: string }>;
  code?: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    
    const query: ProductQueryFilters = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (lowStock === 'true') {
      // Using $expr to compare fields
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'sku', 'category', 'buyingPrice', 'sellingPrice', 'quantity'];
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
    
    // Set default values if not provided
    if (body.quantity === undefined) body.quantity = 0;
    if (body.lowStockThreshold === undefined) body.lowStockThreshold = 10;
    
    // Handle empty or invalid store/supplier fields
    if (!body.store || body.store === '') {
      delete body.store;
    }
    
    if (!body.supplier || body.supplier === '') {
      delete body.supplier;
    }
    
    // Check if product with SKU already exists
    const existingProduct = await Product.findOne({ sku: body.sku });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }
    
    const product = await Product.create(body);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Type guard to check if error is an object with expected properties
    if (error instanceof Error) {
      // Handle MongoDB validation errors
      if (error.name === 'ValidationError' && 'errors' in error) {
        const validationErr = error as ValidationError;
        const validationErrors = Object.values(validationErr.errors).map(e => e.message);
        return NextResponse.json(
          { error: validationErrors.join(', ') },
          { status: 400 }
        );
      }
      
      // Handle MongoDB duplicate key errors
      if ('code' in error && (error as ValidationError).code === 11000) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
      
      // Handle MongoDB CastError errors (ObjectId issues)
      if (error.name === 'CastError') {
        return NextResponse.json(
          { error: 'Invalid ID format for store or supplier' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 