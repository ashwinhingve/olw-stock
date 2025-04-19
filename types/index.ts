export interface Product {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  barcode?: string;
  store?: string;
  supplier?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Supplier {
  _id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Store {
  _id?: string;
  name: string;
  location?: string;
  manager?: string;
  contact?: string;
}

export interface Transaction {
  _id?: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment';
  date: Date;
  products: {
    product: string | Product;
    quantity: number;
    price: number;
  }[];
  party?: string;
  total: number;
  notes?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'manager';
  isActive: boolean;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: any;
  children?: NavigationItem[];
  current?: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSales: number;
  totalPurchases: number;
  monthlyRevenue: number;
}

export interface AlertType {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
} 