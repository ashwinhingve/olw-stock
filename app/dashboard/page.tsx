'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import { 
  CubeIcon, 
  ExclamationCircleIcon, 
  CurrencyRupeeIcon, 
  ShoppingBagIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { Product } from '@/types';

// Sample data for charts
const monthlyData = [
  { month: 'Jan', sales: 12000, purchases: 9000, profit: 3000 },
  { month: 'Feb', sales: 15000, purchases: 10000, profit: 5000 },
  { month: 'Mar', sales: 18000, purchases: 12000, profit: 6000 },
  { month: 'Apr', sales: 14000, purchases: 9500, profit: 4500 },
  { month: 'May', sales: 21000, purchases: 14000, profit: 7000 },
  { month: 'Jun', sales: 22000, purchases: 15000, profit: 7000 },
];

// Sample transaction data
const sampleTransactions = [
  {
    id: '1',
    date: subDays(new Date(), 1),
    type: 'sale',
    party: 'Customer A',
    amount: 5600,
    status: 'paid',
    items: 5
  },
  {
    id: '2',
    date: subDays(new Date(), 2),
    type: 'purchase',
    party: 'Supplier B',
    amount: 12000,
    status: 'unpaid',
    items: 8
  },
  {
    id: '3',
    date: subDays(new Date(), 3),
    type: 'sale',
    party: 'Customer C',
    amount: 3200,
    status: 'partial',
    items: 2
  },
  {
    id: '4',
    date: subDays(new Date(), 4),
    type: 'purchase',
    party: 'Supplier D',
    amount: 8500,
    status: 'paid',
    items: 6
  },
  {
    id: '5',
    date: subDays(new Date(), 5),
    type: 'sale',
    party: 'Customer E',
    amount: 7400,
    status: 'paid',
    items: 3
  },
];

export default function Dashboard() {
  const { 
    dashboardStats, 
    fetchDashboardStats,
    products,
    fetchProducts
  } = useStore();
  
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [transactions] = useState(sampleTransactions);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeTimeFilter, setActiveTimeFilter] = useState('month');
  
  // Fetch dashboard stats with useCallback to prevent infinite render loop
  const fetchLowStockProducts = useCallback(() => {
    fetchProducts({ lowStock: 'true' });
  }, [fetchProducts]);
  
  useEffect(() => {
    // Fetch dashboard stats only once on component mount
    fetchDashboardStats();
    fetchLowStockProducts();
  }, [fetchDashboardStats, fetchLowStockProducts]);
  
  useEffect(() => {
    // This will only run when products change
    const lowStock = products.filter(product => product.quantity <= product.lowStockThreshold);
    setLowStockProducts(lowStock);
  }, [products]);
  
  // Set date range based on time filter
  const handleTimeFilterChange = (filter: string) => {
    setActiveTimeFilter(filter);
    
    const today = new Date();
    let startDate;
    
    switch(filter) {
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
      case 'quarter':
        startDate = subDays(today, 90);
        break;
      case 'year':
        startDate = subDays(today, 365);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    setDateRange({
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd')
    });
  };
  
  const stats = [
    {
      name: 'Total Products',
      value: dashboardStats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
      change: '+5.3%',
      trend: 'up',
      href: '/inventory/stock'
    },
    {
      name: 'Low Stock Items',
      value: dashboardStats.lowStockProducts,
      icon: ExclamationCircleIcon,
      color: 'bg-red-500',
      change: '+2.1%',
      trend: 'up',
      href: '/inventory/stock?lowStock=true'
    },
    {
      name: 'Total Sales',
      value: `₹${dashboardStats.totalSales.toLocaleString()}`,
      icon: ShoppingBagIcon,
      color: 'bg-green-500',
      change: '+12.5%',
      trend: 'up',
      href: '/sales/invoice'
    },
    {
      name: 'Monthly Revenue',
      value: `₹${dashboardStats.monthlyRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-purple-500',
      change: '+3.2%',
      trend: 'up',
      href: '/reports'
    }
  ];
  
  // Find which data point has maximum value to set the chart height
  const maxChartValue = Math.max(
    ...monthlyData.map(item => Math.max(item.sales, item.purchases, item.profit))
  );

  // Fix line 195 with proper Entity references
  const welcomeText = "Welcome back! Here&apos;s what&apos;s happening with your inventory.";
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: welcomeText }}></p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-white shadow-sm rounded-md p-1 flex">
              <button
                onClick={() => handleTimeFilterChange('week')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTimeFilter === 'week'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimeFilterChange('month')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTimeFilter === 'month'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => handleTimeFilterChange('quarter')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTimeFilter === 'quarter'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => handleTimeFilterChange('year')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTimeFilter === 'year'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Year
              </button>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {stat.trend === 'up' ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span 
                      className={`text-sm ml-1 ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                  <Link 
                    href={stat.href}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales Chart */}
          <div className="bg-white shadow rounded-lg lg:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
                <div className="flex space-x-2">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-500">Sales</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-500">Purchases</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-500">Profit</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4">
              <div className="h-64 relative">
                <div className="flex h-full items-end relative z-0">
                  {monthlyData.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center group">
                      <div className="w-full px-2 flex flex-col items-center h-full justify-end space-y-1">
                        <div 
                          className="w-full bg-green-500 rounded-t"
                          style={{ 
                            height: `${(item.profit / maxChartValue) * 100}%`,
                            transition: 'height 0.5s ease-out'
                          }}
                        ></div>
                        <div 
                          className="w-full bg-red-500 rounded-t"
                          style={{ 
                            height: `${(item.purchases / maxChartValue) * 100}%`,
                            transition: 'height 0.5s ease-out'
                          }}
                        ></div>
                        <div 
                          className="w-full bg-blue-500 rounded-t"
                          style={{ 
                            height: `${(item.sales / maxChartValue) * 100}%`,
                            transition: 'height 0.5s ease-out'
                          }}
                        ></div>
                      </div>
                      <span className="mt-2 text-xs text-gray-600">{item.month}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded p-2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-center mb-1 font-medium">{item.month}</div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Sales: ₹{item.sales.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Purchases: ₹{item.purchases.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Profit: ₹{item.profit.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Chart base line */}
                <div className="absolute bottom-6 left-0 right-0 border-t border-gray-200"></div>
              </div>
            </div>
          </div>
          
          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
                </div>
                <Link 
                  href="/inventory/stock?lowStock=true"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All
                  <ChevronRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="px-5 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-red-500">
                            {product.quantity} / {product.lowStockThreshold} units
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {Math.max(0, product.lowStockThreshold - product.quantity)} units needed
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            product.quantity / product.lowStockThreshold < 0.3 
                              ? 'bg-red-500' 
                              : product.quantity / product.lowStockThreshold < 0.7
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (product.quantity / product.lowStockThreshold) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-gray-500">No low stock items found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <Link 
                href="/dashboard/transactions"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(transaction.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'sale' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.party}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.items} items
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-right">
                      <Link
                        href={`/${transaction.type === 'sale' ? 'sales' : 'purchase'}/invoice/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/${transaction.type === 'sale' ? 'sales' : 'purchase'}/invoice/${transaction.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 