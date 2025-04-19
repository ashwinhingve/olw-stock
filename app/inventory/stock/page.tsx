'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
// import { Product } from '@/types';
import ProductCard from '@/components/inventory/ProductCard';
import Link from 'next/link';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

// Wrap the component that uses useSearchParams in its own client component
function StockContent() {
  const searchParams = useSearchParams();
  const { products, fetchProducts, isLoading } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(searchParams.get('lowStock') === 'true');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Wrap fetchProducts in useCallback to prevent it from changing on every render
  const getFilteredProducts = useCallback(() => {
    const params: Record<string, string> = {};
    
    if (showLowStock) {
      params.lowStock = 'true';
    }
    
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    fetchProducts(params);
  }, [fetchProducts, showLowStock, selectedCategory, searchQuery]);
  
  // Fetch products when filter parameters change
  useEffect(() => {
    getFilteredProducts();
  }, [getFilteredProducts]);
  
  // Extract unique categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map(product => product.category)));
      setCategories(uniqueCategories);
    }
  }, [products]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    getFilteredProducts();
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
        
        toast.success('Product deleted successfully');
        getFilteredProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setShowLowStock(false);
    // Use setTimeout to ensure state updates before fetching
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Stock</h1>
        
        <Link
          href="/inventory/stock/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU or barcode"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </form>
          </div>
          
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-3 flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={() => setShowLowStock(!showLowStock)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show Low Stock Only</span>
              {showLowStock && <ExclamationCircleIcon className="ml-1 h-4 w-4 text-red-500" />}
            </label>
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Products */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <p className="text-gray-500 mb-4">No products found.</p>
          <Link
            href="/inventory/stock/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Your First Product
          </Link>
        </div>
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      }>
        <StockContent />
      </Suspense>
    </Layout>
  );
}