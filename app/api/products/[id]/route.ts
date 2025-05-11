import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Product from '@/models/product';
import mongoose from 'mongoose';
import { getUserInfo, canAccessData, hasPermission } from '@/lib/userContext';
import { PERMISSIONS } from '@/models/user';

// Validate MongoDB Object ID format to prevent injection attacks
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDB();
    
    // Verify user has permission to view products
    const hasViewPermission = await hasPermission(request, PERMISSIONS.VIEW_PRODUCTS);
    if (!hasViewPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view products' },
        { status: 403 }
      );
    }
    
    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check user permission to access this product
    const hasAccess = await canAccessData(
      request, 
      product.userId.toString(), 
      product.storeId.toString(),
      product.organization.toString()
    );
    
    if (!hasAccess) {
      // Don't disclose that the product exists if user doesn't have access
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDB();
    
    // Verify user has permission to edit products
    const hasEditPermission = await hasPermission(request, PERMISSIONS.EDIT_PRODUCTS);
    if (!hasEditPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit products' },
        { status: 403 }
      );
    }
    
    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Get user info
    const userInfo = await getUserInfo(request);
    
    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check user permission to access this product
    const hasAccess = await canAccessData(
      request, 
      product.userId.toString(), 
      product.storeId.toString(),
      product.organization.toString()
    );
    
    if (!hasAccess) {
      // Don't disclose that the product exists if user doesn't have access
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Make sure organization cannot be changed
    const body = await request.json();
    
    // Prevent ID spoofing
    delete body._id;
    
    // Ensure organization cannot be changed
    if (body.organization && body.organization.toString() !== product.organization.toString()) {
      return NextResponse.json(
        { success: false, error: 'Cannot change product organization' },
        { status: 400 }
      );
    }
    
    // Update last updated by
    body.lastUpdatedBy = userInfo.id;
    
    // Check if SKU is changed and if it exists within the same organization
    if (body.sku && body.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: body.sku,
        organization: product.organization,
        _id: { $ne: id } // Exclude current product
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: `Product with SKU "${body.sku}" already exists in your organization` },
          { status: 400 }
        );
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle MongoDB validation errors
    const err = error as Error; 
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((err: any) => err.message); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Product with this SKU already exists in your organization' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update product'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDB();
    
    // Verify user has permission to delete products
    const hasDeletePermission = await hasPermission(request, PERMISSIONS.DELETE_PRODUCTS);
    if (!hasDeletePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete products' },
        { status: 403 }
      );
    }
    
    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check user permission to access this product
    const hasAccess = await canAccessData(
      request, 
      product.userId.toString(), 
      product.storeId.toString(),
      product.organization.toString()
    );
    
    if (!hasAccess) {
      // Don't disclose that the product exists if user doesn't have access
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product'
      },
      { status: 500 }
    );
  }
} 