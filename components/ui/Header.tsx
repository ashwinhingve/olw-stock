import { useState } from 'react';
import Link from 'next/link';
import { 
  BellIcon, 
  Cog6ToothIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useStore } from '@/context/storeContext';

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { currentStore, logout } = useStore();
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="text-lg font-semibold text-blue-600">{currentStore}</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span className="sr-only">Notifications</span>
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-medium">Notifications</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="px-4 py-2 hover:bg-gray-50">
                    <p className="text-sm text-gray-700">Low stock alert: 5 items are below threshold</p>
                    <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50">
                    <p className="text-sm text-gray-700">New order received from Customer A</p>
                    <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t text-center">
                  <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              className="flex items-center text-sm rounded-full focus:outline-none"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 text-gray-500" />
              <span className="ml-2 hidden md:block">Admin</span>
              <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-500" />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserCircleIcon className="mr-2 h-5 w-5 text-gray-500" />
                  Your Profile
                </Link>
                <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Cog6ToothIcon className="mr-2 h-5 w-5 text-gray-500" />
                  Settings
                </Link>
                <button 
                  onClick={logout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5 text-gray-500" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex space-x-2">
          <Link 
            href="/dashboard"
            className="px-3 py-1 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-50"
          >
            Dashboard
          </Link>
          <Link 
            href="/inventory/stock"
            className="px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
          >
            Products
          </Link>
          <Link 
            href="/sales/invoice"
            className="px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
          >
            Sales
          </Link>
          <Link 
            href="/purchase/invoice"
            className="px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
          >
            Purchases
          </Link>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            More Options
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </button>
          <button className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">
            Purchase
          </button>
          <button className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Sale / Bill
          </button>
        </div>
      </div>
    </header>
  );
} 