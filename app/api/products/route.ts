import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Product from '@/models/product';
import { getUserInfo, createDataFilter, hasPermission } from '@/lib/userContext';
import { PERMISSIONS } from '@/models/user';
import { ErrorResponse, QueryParams, TransactionError } from '@/types';

interface ProductQueryFilters {
  category?: string;
  organization?: string;
  $or?: Array<Record<string, { $regex: string; $options: string } | string>>;
  $expr?: { $lte: [string, string] };
  [key: string]: unknown;
}

interface ValidationError extends Error {
  name: string;
  errors: Record<string, { message: string }>;
  code?: number;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    
    // Verify user has permission to view products
    const hasViewPermission = await hasPermission(req, PERMISSIONS.VIEW_PRODUCTS);
    if (!hasViewPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view products' },
        { status: 403 }
      );
    }
    
    // Get user-specific data filter - this enforces data isolation
    const dataFilter = await createDataFilter(req);
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build complete query with user-specific filter
    const query: ProductQueryFilters = { ...dataFilter };
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add low stock filter if requested
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      
      // Ensure $or queries don't break data isolation by adding organization filter to each condition
      if (query.$or && Array.isArray(query.$or)) {
        // Add organization filter to each $or condition to maintain isolation
        query.$or = query.$or.map(condition => ({
          ...condition,
          organization: dataFilter.organization
        }));
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Sanitize and enforce limits
    const sanitizedLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100
    const sanitizedPage = Math.max(1, page);
    const sanitizedSkip = Math.max(0, (sanitizedPage - 1) * sanitizedLimit);
    
    // Execute query with user-specific data filter
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(sanitizedSkip)
      .limit(sanitizedLimit)
      .populate('storeId', 'name')
      .populate('supplierId', 'name');
    
    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page: sanitizedPage,
        limit: sanitizedLimit,
        pages: Math.ceil(totalCount / sanitizedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    
    // Verify user has permission to create products
    const hasCreatePermission = await hasPermission(req, PERMISSIONS.CREATE_PRODUCTS);
    if (!hasCreatePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to create products' },
        { status: 403 }
      );
    }
    
    // Get user information
    const userInfo = await getUserInfo(req);
    
    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const productData = await req.json();
    
    // Sanitize input data
    delete productData._id; // Prevent ID spoofing
    
    // Add user info to the product data
    productData.userId = userInfo.id;
    productData.organization = userInfo.organization;
    productData.lastUpdatedBy = userInfo.id;
    
    // Create new product with user and organization data
    const product = await Product.create(productData);
    
    return NextResponse.json({
      success: true,
      product
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle duplicate key error
    const err = error as TransactionError;
    
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A product with this SKU already exists in your organization' },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErr = err as ValidationError;
      const validationErrors = Object.values(validationErr.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 