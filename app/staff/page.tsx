'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/ui/Layout';
import { useStore } from '@/context/storeContext';
import toast from 'react-hot-toast';

// Define staff interface
interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

// Sample staff data
const generateStaffData = (): StaffMember[] => {
  const roles = ['Admin', 'Manager', 'Cashier', 'Inventory Manager', 'Sales Representative'];
  const lastActive = [
    'Today',
    'Yesterday',
    '2 days ago',
    'Last week',
    '2 weeks ago',
    'A month ago',
    'Inactive'
  ];
  
  return Array.from({ length: 12 }).map((_, index) => {
    return {
      id: index + 1,
      name: [
        'John Smith',
        'Sarah Johnson',
        'Michael Williams',
        'Emily Brown',
        'David Jones',
        'Jessica Miller',
        'Daniel Davis',
        'Lisa Wilson',
        'Robert Taylor',
        'Jennifer Martinez',
        'Christopher Anderson',
        'Amanda Thomas',
      ][index],
      email: [
        'john.smith@example.com',
        'sarah.j@example.com',
        'michael.w@example.com',
        'emily.brown@example.com',
        'david.jones@example.com',
        'jessica.m@example.com',
        'daniel.davis@example.com',
        'lisa.wilson@example.com',
        'robert.t@example.com',
        'jennifer.m@example.com',
        'chris.a@example.com',
        'amanda.t@example.com',
      ][index],
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      isActive: Math.random() > 0.2, // 80% are active
      lastActive: lastActive[Math.floor(Math.random() * lastActive.length)],
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      ).toISOString().split('T')[0]
    };
  });
};

export default function StaffManagementPage() {
  const { isLoading, setLoading } = useStore();
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        // In a real app, you'd fetch data from your API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const data = generateStaffData();
        setStaff(data);
        setFilteredStaff(data);
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast.error('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaff();
  }, [setLoading]);
  
  // Get unique roles for filter
  const roles = ['all', ...new Set(staff.map(employee => employee.role))];
  
  // Handle search and filters
  useEffect(() => {
    const filtered = staff.filter(employee => {
      const matchesSearch = searchTerm === '' || 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && employee.isActive) || 
        (statusFilter === 'inactive' && !employee.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setFilteredStaff(filtered);
  }, [staff, searchTerm, roleFilter, statusFilter]);
  
  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, you'd make an API call to delete the staff member
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      setStaff(staff.filter(employee => employee.id !== id));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (id: number) => {
    setLoading(true);
    try {
      // In a real app, you'd make an API call to update the staff status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      setStaff(staff.map(employee => 
        employee.id === id ? { ...employee, isActive: !employee.isActive } : employee
      ));
      
      toast.success('Staff status updated successfully');
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${name}? They will receive an email with instructions.`)) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, you'd make an API call to reset the password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      toast.success(`Password reset link sent to ${name}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage user accounts and permissions</p>
          </div>
          <Link
            href="/staff/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Staff
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-1/2">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-1/4">
                <label htmlFor="roleFilter" className="sr-only">Role</label>
                <select
                  id="roleFilter"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {roles.filter(role => role !== 'all').map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="sm:w-1/4">
                <label htmlFor="statusFilter" className="sr-only">Status</label>
                <select
                  id="statusFilter"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 uppercase font-bold">
                              {employee.name.charAt(0)}
                            </div>
                            {employee.isActive && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">Added on {new Date(employee.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.email}</div>
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.lastActive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <Link
                            href={`/staff/${employee.id}`}
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/staff/${employee.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleResetPassword(employee.id, employee.name)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Reset Password"
                          >
                            <KeyIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(employee.id)}
                            className={`${
                              employee.isActive 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={employee.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {employee.isActive ? (
                              <XCircleIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 