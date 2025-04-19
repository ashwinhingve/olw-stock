import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  ShoppingCartIcon, 
  HomeIcon, 
  CubeIcon, 
  TruckIcon, 
  BuildingStorefrontIcon, 
  UsersIcon, 
  DocumentChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useStore } from '@/context/storeContext';
import { NavigationItem } from '@/types';

// Define navigation outside the component to prevent recreation on every render
const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { 
    name: 'Sales', 
    href: '#', 
    icon: ShoppingCartIcon,
    children: [
      { name: 'Sales Invoice', href: '/sales/invoice' },
      { name: 'Sales Return', href: '/sales/return' },
      { name: 'Payment In', href: '/sales/payment-in' },
      { name: 'Sales Orders', href: '/sales/orders' },
      { name: 'Quotations', href: '/sales/quotes' },
    ]
  },
  { 
    name: 'Purchase', 
    href: '#', 
    icon: TruckIcon,
    children: [
      { name: 'Purchase Invoice', href: '/purchase/invoice' },
      { name: 'Purchase Return', href: '/purchase/return' },
      { name: 'Purchase Orders', href: '/purchase/orders' },
      { name: 'Payment Out', href: '/purchase/payment-out' },
    ]
  },
  { 
    name: 'Inventory', 
    href: '#', 
    icon: CubeIcon,
    children: [
      { name: 'Stock', href: '/inventory/stock' },
      { name: 'Items', href: '/inventory/items' },
      { name: 'Barcode', href: '/inventory/barcode' },
      { name: 'Manage Stores', href: '/inventory/stores' },
    ]
  },
  { 
    name: 'Accounting', 
    href: '#', 
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Expense', href: '/accounting/expense' },
      { name: 'Cash & Bank', href: '/accounting/cash-bank' },
    ]
  },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Manage Staff', href: '/staff', icon: UsersIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Manage Plan', href: '/plan', icon: BuildingStorefrontIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentStore, logout } = useStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Track which sections are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Auto-expand the section of the current active page
  useEffect(() => {
    if (pathname) {
      const activeParent = navigation.find(item => 
        item.children?.some(child => child.href === pathname || pathname.startsWith(child.href + '/'))
      );
      
      if (activeParent) {
        setExpanded(prev => ({
          ...prev,
          [activeParent.name]: true
        }));
      }
    }
  }, [pathname]); // Remove navigation from dependencies
  
  const toggleExpand = (name: string) => {
    setExpanded(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };
  
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Close mobile menu when clicking outside on small screens
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      
      if (isMobileMenuOpen && sidebar && toggle && 
          !sidebar.contains(e.target as Node) && 
          !toggle.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobileMenuOpen]);
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 m-4">
        <button
          id="sidebar-toggle"
          className="p-2 bg-gray-800 rounded-md text-gray-200 hover:bg-gray-700 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Sidebar backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`bg-gray-900 text-white h-full flex-col fixed lg:sticky top-0 left-0 z-30 w-64 transition-transform duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:flex`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-800">
          <Link href="/dashboard" className="text-blue-400 font-semibold">
            {currentStore}
          </Link>
        </div>
        
        <nav className="flex-1 pt-2 pb-4 overflow-y-auto">
          <ul>
            {navigation.map((item) => (
              <li key={item.name} className="mb-1">
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`flex items-center w-full px-4 py-3 text-sm hover:bg-gray-800 ${
                        expanded[item.name] ? 'bg-gray-800' : ''
                      } ${item.children.some(child => isActive(child.href)) ? 'text-blue-400' : 'text-gray-300'}`}
                    >
                      {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                      <span>{item.name}</span>
                      <span className="ml-auto">
                        {expanded[item.name] ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </span>
                    </button>
                    
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expanded[item.name] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="pl-4 mt-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={`flex items-center px-4 py-2 text-sm ${
                                isActive(child.href)
                                  ? 'bg-gray-700 text-white font-medium'
                                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                              } rounded-md my-1 transition duration-150 ease-in-out`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm rounded-md ${
                      isActive(item.href)
                        ? 'bg-gray-700 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    } transition duration-150 ease-in-out`}
                  >
                    {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 bg-indigo-900">
          <div>
            <p className="text-sm font-medium">Business Plan</p>
            <p className="text-xs">Active until Apr 2025</p>
          </div>
          <button 
            onClick={() => logout()}
            className="mt-2 w-full bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm transition duration-150 ease-in-out"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
} 