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
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

// Define transaction type interface
interface Transaction {
  id: string;
  date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  account: string;
  reference: string;
  notes: string;
  [key: string]: string | number | Date; // Include Date type for future-proofing
}

// Define numeric ID type to fix number to string conversion issues
// type NumericId = number;

// Sample cash-bank data
const generateTransactionsData = (): Transaction[] => {
  const categories = ['Sales', 'Purchases', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Equipment', 'Taxes', 'Other Income', 'Other Expense'];
  const accounts = ['Primary Bank Account', 'Secondary Bank Account', 'Business Credit Card', 'Petty Cash', 'Savings Account'];
  const types = ['income', 'expense', 'transfer'];
  
  return Array.from({ length: 30 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days
    
    const type = types[Math.floor(Math.random() * types.length)];
    let category: string, amount: number;
    
    if (type === 'income') {
      category = ['Sales', 'Other Income'][Math.floor(Math.random() * 2)];
      amount = parseFloat((Math.random() * 5000 + 500).toFixed(2));
    } else if (type === 'expense') {
      category = categories.filter(c => c !== 'Sales' && c !== 'Other Income')[Math.floor(Math.random() * 8)];
      amount = parseFloat((-1 * (Math.random() * 2000 + 100)).toFixed(2));
    } else {
      category = 'Transfer';
      // Random transfer amount (positive or negative to represent in/out)
      const randomAmount = Math.random() > 0.5 ? 1 : -1;
      const value = Math.random() * 3000 + 200;
      const fixedString = value.toFixed(2);
      amount = parseFloat(fixedString) * randomAmount;
    }
    
    // Convert to strings explicitly before concatenation
    const idNumber = (10000 + index);
    const refNumber = Math.floor(Math.random() * 10000);
    
    return {
      id: `TRX-${idNumber}`,
      date: date.toISOString().split('T')[0],
      description: `${type === 'transfer' ? 'Transfer' : type === 'income' ? 'Payment received' : 'Payment made'} for ${category.toLowerCase()}`,
      type,
      category,
      amount,
      account: accounts[Math.floor(Math.random() * accounts.length)],
      reference: Math.random() > 0.3 ? `REF-${refNumber}` : '',
      notes: Math.random() > 0.7 ? `Additional notes for transaction #${index}` : ''
    };
  });
};

export default function CashBankPage() {
  const { setLoading } = useStore();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  
  // Summary calculations
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // In a real app, you'd fetch data from your API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const data = generateTransactionsData();
        setTransactions(data);
        setFilteredTransactions(data);
        calculateSummary(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [setLoading]);
  
  // Calculate summary data
  const calculateSummary = (data: Transaction[]) => {
    const totalIncome = data
      .filter(transaction => transaction.type === 'income' || (transaction.type === 'transfer' && transaction.amount > 0))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      
    const totalExpense = data
      .filter(transaction => transaction.type === 'expense' || (transaction.type === 'transfer' && transaction.amount < 0))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    setSummary({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  };
  
  // Get unique accounts for filter
  const accounts = ['all', ...new Set(transactions.map(transaction => transaction.account))];
  
  // Handle search and filters
  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesAccount = accountFilter === 'all' || transaction.account === accountFilter;
      
      const matchesDateRange = (
        (!dateRangeFilter.start || transaction.date >= dateRangeFilter.start) &&
        (!dateRangeFilter.end || transaction.date <= dateRangeFilter.end)
      );
      
      return matchesSearch && matchesType && matchesAccount && matchesDateRange;
    });
    
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      }
      
      if (sortField === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Default numeric comparison
      return sortDirection === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
    
    setFilteredTransactions(sorted);
    calculateSummary(filtered);
  }, [transactions, searchTerm, sortField, sortDirection, typeFilter, accountFilter, dateRangeFilter]);
  
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
  
  // Get current transactions for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, you'd make an API call to delete the transaction
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      setTransactions(transactions.filter(transaction => transaction.id !== id));
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get type badge class
  const getTypeBadgeClass = (type: string, amount: number) => {
    if (type === 'income' || (type === 'transfer' && amount > 0)) {
      return 'bg-green-100 text-green-800';
    } else if (type === 'expense' || (type === 'transfer' && amount < 0)) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Get amount text class
  const getAmountClass = (amount: number) => {
    return amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Cash & Bank Management</h1>
          <div className="flex space-x-2">
            <Link
              href="/accounting/cash-bank/income/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              New Income
            </Link>
            <Link
              href="/accounting/cash-bank/expense/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowDownIcon className="h-4 w-4 mr-2" />
              New Expense
            </Link>
            <Link
              href="/accounting/cash-bank/transfer/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Transfer
            </Link>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <ArrowUpIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Income</h2>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalIncome)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <ArrowDownIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Expenses</h2>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalExpense)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${summary.balance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {summary.balance >= 0 ? (
                  <PlusIcon className="h-6 w-6" />
                ) : (
                  <MinusIcon className="h-6 w-6" />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Balance</h2>
                <p className={`text-2xl font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(summary.balance))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="w-full bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/3">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search transactions..."
                    />
                  </div>
                </div>
                
                <div className="sm:w-1/6">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                
                <div className="sm:w-1/4">
                  <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <select
                    id="account"
                    name="account"
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {accounts.map((account, index) => (
                      <option key={index} value={account}>{account === 'all' ? 'All Accounts' : account}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:w-1/6">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={dateRangeFilter.start}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="sm:w-1/6">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={dateRangeFilter.end}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Description</span>
                        {getSortIcon('description')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('account')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Account</span>
                        {getSortIcon('account')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('reference')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Reference</span>
                        {getSortIcon('reference')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Amount</span>
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.description}</span>
                          {transaction.notes && (
                            <span className="text-xs text-gray-500 mt-1">{transaction.notes}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(transaction.type, transaction.amount)} capitalize`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.account}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={getAmountClass(transaction.amount)}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/accounting/cash-bank/${transaction.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/accounting/cash-bank/${transaction.type}/${transaction.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredTransactions.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredTransactions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronDownIcon className="h-5 w-5 transform rotate-90" aria-hidden="true" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronDownIcon className="h-5 w-5 transform -rotate-90" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 