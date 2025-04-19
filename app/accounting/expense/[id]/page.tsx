'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setLoading } = useStore();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);
  
  // Format date as MMM DD, YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  useEffect(() => {
    const fetchExpense = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock expense data for demonstration
        const mockExpense: Expense = {
          id: id as string,
          date: '2023-07-15',
          category: 'Office Supplies',
          description: 'Quarterly office supplies purchase',
          amount: 349.99,
          paymentMethod: 'Credit Card',
          reference: 'INV-20230715-001',
          notes: 'Purchased new printer cartridges, paper, and various stationery items for the office.',
          receiptUrl: '/receipts/receipt-001.pdf',
          createdAt: '2023-07-15T15:30:00Z',
          updatedAt: '2023-07-15T15:30:00Z'
        };
        
        setExpense(mockExpense);
      } catch (err) {
        console.error('Error fetching expense:', err);
        setError('Failed to load expense details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpense();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    
    setIsDeletingExpense(true);
    setLoading(true);
    
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Expense deleted successfully');
      router.push('/accounting/expense');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete expense');
    } finally {
      setIsDeletingExpense(false);
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {isLoading ? (
          <div className="w-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p>{error}</p>
            <div className="mt-3">
              <Link
                href="/accounting/expense"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Back to Expenses
              </Link>
            </div>
          </div>
        ) : expense ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/accounting/expense"
                  className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  href={`/accounting/expense/${id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                  Edit
                </Link>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeletingExpense}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeletingExpense ? (
                    <>
                      <span className="animate-spin inline-block mr-1.5 h-4 w-4 border-t-2 border-white rounded-full"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-1.5" />
                      Delete
                    </>
                  )}
                </button>
                
                <div className="relative group">
                  <button
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    More
                    <svg className="h-5 w-5 ml-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        href={`/accounting/expense/duplicate/${id}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Duplicate
                      </Link>
                      <button
                        onClick={() => window.print()}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <PrinterIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Expense Information</h2>
                  </div>
                  
                  <div className="px-6 py-5">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-semibold">
                          {expense.description}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CalendarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                          Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(expense.date)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <TagIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                          Category
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{expense.category}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CurrencyDollarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                          Amount
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{formatCurrency(expense.amount)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CreditCardIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                          Payment Method
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{expense.paymentMethod}</dd>
                      </div>
                      
                      {expense.reference && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <HashtagIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                            Reference Number
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">{expense.reference}</dd>
                        </div>
                      )}
                      
                      {expense.notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{expense.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {expense.receiptUrl && (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Receipt</h2>
                    </div>
                    
                    <div className="px-6 py-5">
                      <div className="border border-gray-200 rounded-md p-4 text-center">
                        <Image 
                          src="/receipt-placeholder.png" 
                          alt="Receipt preview" 
                          width={240}
                          height={320}
                          className="mx-auto h-64 object-contain"
                        />
                        <div className="mt-4">
                          <Link
                            href={expense.receiptUrl}
                            target="_blank"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Full Receipt
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Metadata</h2>
                  </div>
                  
                  <div className="px-6 py-5">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(expense.createdAt)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(expense.updatedAt)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{expense.id}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                  </div>
                  
                  <div className="px-6 py-5 space-y-3">
                    <Link
                      href={`/accounting/expense/${id}/edit`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PencilIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                      Edit Expense
                    </Link>
                    
                    <Link
                      href={`/accounting/expense/duplicate/${id}`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DocumentDuplicateIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                      Duplicate
                    </Link>
                    
                    <button
                      onClick={handleDelete}
                      disabled={isDeletingExpense}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <TrashIcon className="mr-1.5 h-5 w-5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
            <p>Expense not found.</p>
            <div className="mt-3">
              <Link
                href="/accounting/expense"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                Back to Expenses
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 