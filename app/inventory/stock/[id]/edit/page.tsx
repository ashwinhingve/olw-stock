'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/ui/Layout';
import ProductForm from '@/components/inventory/ProductForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Product } from '@/types';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again.');
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [id]);
  
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
        </div>
      </Layout>
    );
  }
  
  if (error || !product) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <Link
            href="/inventory/stock"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Stock
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Link
            href="/inventory/stock"
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Stock</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product: {product.name}</h1>
        </div>
        
        <ProductForm product={product} isEditing={true} />
      </div>
    </Layout>
  );
} 