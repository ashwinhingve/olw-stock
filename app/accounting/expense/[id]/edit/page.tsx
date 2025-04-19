'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  receipt?: File | null;
}

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Equipment',
  'Travel',
  'Maintenance',
  'Insurance',
  'Taxes',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'PayPal',
  'Other'
];

export default function EditExpensePage() {
  const { id } = useParams();
  const router = useRouter();
  const { setLoading } = useStore();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: '',
    category: '',
    description: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: '',
    receipt: null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasReceipt, setHasReceipt] = useState(false);
  
  // Format amount to 2 decimal places for display
  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };
  
  // Parse date string to YYYY-MM-DD format for input
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchExpense = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock expense data for demonstration
        const mockExpense = {
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
        
        setFormData({
          date: formatDateForInput(mockExpense.date),
          category: mockExpense.category,
          description: mockExpense.description,
          amount: formatAmount(mockExpense.amount),
          paymentMethod: mockExpense.paymentMethod,
          reference: mockExpense.reference,
          notes: mockExpense.notes,
          receipt: null
        });
        
        setHasReceipt(!!mockExpense.receiptUrl);
      } catch (err) {
        console.error('Error fetching expense:', err);
        setLoadError('Failed to load expense details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpense();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof ExpenseFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({
        ...prev,
        receipt: e.target.files![0]
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Expense updated successfully');
      router.push(`/accounting/expense/${id}`);
    } catch (err) {
      console.error('Error updating expense:', err);
      toast.error('Failed to update expense');
      setIsSubmitting(false);
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
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p>{loadError}</p>
            <div className="mt-3">
              <Link
                href="/accounting/expense"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Back to Expenses
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <Link
                href={`/accounting/expense/${id}`}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Expense Details</h2>
                </div>
                
                <div className="px-6 py-5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md ${
                          errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm`}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md ${
                          errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm`}
                      >
                        <option value="">Select a category</option>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the expense"
                      className={`mt-1 block w-full rounded-md ${
                        errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } shadow-sm sm:text-sm`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          id="amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={`block w-full pl-7 pr-12 rounded-md ${
                            errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">USD</span>
                        </div>
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md ${
                          errors.paymentMethod ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm`}
                      >
                        <option value="">Select a payment method</option>
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                      {errors.paymentMethod && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                      Reference Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="reference"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="Invoice or receipt number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional details about this expense"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Receipt</h2>
                </div>
                
                <div className="px-6 py-5 space-y-4">
                  {hasReceipt && (
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 flex items-center justify-center bg-gray-200 rounded-md">
                          <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Current Receipt
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          You can replace the existing receipt by uploading a new one
                        </p>
                      </div>
                      <div>
                        <Link
                          href="/receipts/receipt-001.pdf"
                          target="_blank"
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="receipt"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>{hasReceipt ? 'Replace receipt' : 'Upload a receipt'}</span>
                          <input
                            id="receipt"
                            name="receipt"
                            type="file"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF up to 10MB</p>
                    </div>
                  </div>
                  
                  {formData.receipt && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected file: {formData.receipt.name} ({Math.round(formData.receipt.size / 1024)} KB)
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Link
                  href={`/accounting/expense/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin inline-block mr-2 h-4 w-4 border-t-2 border-white rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
} 