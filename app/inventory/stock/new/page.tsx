'use client';

// import { useState } from 'react';
import Layout from '@/components/ui/Layout';
import ProductForm from '@/components/inventory/ProductForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NewProductPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        </div>
        
        <ProductForm />
      </div>
    </Layout>
  );
} 