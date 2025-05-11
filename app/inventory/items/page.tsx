'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

// Define Item interface
interface Item {
  _id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  reorderLevel: number;
  taxRate: number;
  isActive: boolean;
  barcode?: string;
  price?: number;
  cost?: number;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Create wrapper component to replace Layout
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="container mx-auto px-4 py-8">{children}</div>
  );

export default function InventoryItemsListPage() {
  const { isLoading, setLoading } = useStore();
  
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Sorting
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const fetchItems = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortField);
      params.append('order', sortDirection);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/items?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setItems(data.items || []);
        setFilteredItems(data.items || []);
        setTotalItems(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
        
        // Set categories for filter options
        if (data.filters?.categories) {
          setCategories(data.filters.categories);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      const err = error as Error; 
      toast.error(`Failed to load items data: ${err.message || 'Unknown error'}`);
      // Set defaults to prevent UI issues
      setItems([]);
      setFilteredItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch items when page, sort or filters change
  useEffect(() => {
    fetchItems();
  }, [currentPage, sortField, sortDirection, categoryFilter, statusFilter]);
  
  // Delayed search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm) {
        fetchItems();
      }
    }, 500);
    
    return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Items</h1>
      <p>Inventory management is being updated. Please check back later.</p>
    </div>
  );
  }, [searchTerm]);
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-600" />;
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      }
  );
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchItems();
        toast.success('Item deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      }
  );
      
      if (!response.ok) {
        throw new Error('Failed to update item status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchItems();
        toast.success(data.message || 'Item status updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update item status');
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Items</h1>
      <p>Inventory management is being updated. Please check back later.</p>
    </div>
  );
} 