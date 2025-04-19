"use client"
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AlertType, DashboardStats, Product, Store, Supplier } from '@/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface StoreContextType {
  // User state
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // Store state
  currentStore: string;
  setCurrentStore: (store: string) => void;
  
  // Loading state
  isLoading: boolean;
  setLoading: (value: boolean) => void;
  
  // Alert state
  alert: AlertType | null;
  setAlert: (alert: AlertType | null) => void;
  
  // Dashboard stats
  dashboardStats: DashboardStats;
  fetchDashboardStats: () => Promise<void>;
  
  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  fetchProducts: (params?: Record<string, string>) => Promise<void>;
  
  // Stores
  stores: Store[];
  fetchStores: () => Promise<void>;
  
  // Suppliers
  suppliers: Supplier[];
  fetchSuppliers: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  totalProducts: 0,
  lowStockProducts: 0,
  totalSales: 0,
  totalPurchases: 0,
  monthlyRevenue: 0
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Store state
  const [currentStore, setCurrentStore] = useState('MyStore');
  
  // Loading state
  const [isLoading, setLoading] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState<AlertType | null>(null);
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(defaultStats);
  
  // Products
  const [products, setProducts] = useState<Product[]>([]);
  
  // Stores
  const [stores, setStores] = useState<Store[]>([]);
  
  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);
  
  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      router.push('/dashboard');
      toast.success('Logged in successfully');
    } catch (error) {
      console.error('Login error:', error);
      setAlert({
        id: Date.now().toString(),
        type: 'error',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/login');
    toast.success('Logged out successfully');
  }, [router]);
  
  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setAlert({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to fetch dashboard stats'
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch products
  const fetchProducts = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      
      let url = '/api/products';
      
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAlert({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to fetch products'
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/stores');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setAlert({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to fetch stores'
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/suppliers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setAlert({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to fetch suppliers'
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  const contextValue: StoreContextType = {
    isLoggedIn,
    login,
    logout,
    currentStore,
    setCurrentStore,
    isLoading,
    setLoading,
    alert,
    setAlert,
    dashboardStats,
    fetchDashboardStats,
    products,
    setProducts,
    fetchProducts,
    stores,
    fetchStores,
    suppliers,
    fetchSuppliers
  };
  
  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  
  return context;
};