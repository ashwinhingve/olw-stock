'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useStore } from '@/context/storeContext';
import { useSession } from 'next-auth/react';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  store?: string;
}

interface Store {
  _id: string;
  name: string;
}

export default function UserCreationForm() {
  const router = useRouter();
  const { stores, fetchStores } = useStore();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [canCreateStaff, setCanCreateStaff] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales_operator',
    store: '',
  });

  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log('Checking permissions, session data:', session);
        
        // Direct check for store_admin role in session (bypass API for admins)
        if (session?.user?.role?.toLowerCase() === 'store_admin') {
          console.log('User is store_admin, granting access without API call');
          setCanCreateStaff(true);
          return;
        }
        
        const response = await fetch('/api/auth/permissions');
        const data = await response.json();
        
        console.log('Permissions API response:', data);
        
        if (data.success) {
          // Check if user is a store admin
          if (data.isStoreAdmin) {
            console.log('API confirms user is store_admin');
            setCanCreateStaff(true);
            return;
          }
          
          // Otherwise check specific permission
          const hasPermission = data.permissions.includes('create_users');
          setCanCreateStaff(hasPermission);
          
          if (!hasPermission) {
            setError('You do not have permission to create staff members');
          }
        } else {
          console.error('API returned error:', data.error);
          setError('Failed to check permissions: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError(&apos;Network error checking permissions. Please try again.');
      }
    };
    
    if (session) {
      checkPermissions();
    }
  }, [session]);

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Update available stores when stores change
  useEffect(() => {
    if (stores && stores.length > 0) {
      setAvailableStores(stores);
      // Set default store if available and not already set
      if (stores.length > 0 && !formData.store) {
        setFormData(prev => ({
          ...prev,
          store: stores[0]._id
        }));
      }
    }
  }, [stores]);

  const roles = [
    { id: 'store_admin', label: 'Store Admin' },
    { id: 'sales_operator', label: 'Sales Operator' },
    { id: 'sales_purchase_operator', label: 'Sales Purchase Operator' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!canCreateStaff) {
      setError('You do not have permission to create staff members');
      return false;
    }
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required fields');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.store) {
      setError('Please select a store for this user');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // API call to create new user
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          store: formData.store,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      router.push('/staff');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreateStaff) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
        <p className="text-red-700">
          Only Store Admins can create new staff members. Please contact a Store Admin for assistance.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-700">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-800 mb-1">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-700">
              {formData.role === 'store_admin' 
                ? 'Store Admins can manage all aspects of the system, including creating other users' 
                : formData.role === 'sales_operator'
                  ? 'Sales Operators can manage sales transactions only'
                  : 'Sales Purchase Operators can manage both sales and purchase transactions'}
            </p>
          </div>

          <div>
            <label htmlFor="store" className="block text-sm font-semibold text-gray-800 mb-1">
              Assign to Store *
            </label>
            <select
              id="store"
              name="store"
              value={formData.store}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select a store</option>
              {availableStores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-700">
              The store this staff member will be associated with
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/staff')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create User&apos;}
          </button>
        </div>
      </form>
    </div>
  );
} 