import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Product from '@/models/product';
import Transaction from '@/models/transaction';

export async function GET() {
  try {
    await connectToDB();
    
    // Get total products
    const totalProducts = await Product.countDocuments();
    
    // Get low stock products
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    });
    
    // Calculate current month's range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get total sales (all time)
    const salesTransactions = await Transaction.find({ type: 'sale' });
    const totalSales = salesTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
    
    // Get total purchases (all time)
    const purchaseTransactions = await Transaction.find({ type: 'purchase' });
    const totalPurchases = purchaseTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
    
    // Get monthly revenue
    const monthlySalesTransactions = await Transaction.find({
      type: 'sale',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthlyRevenue = monthlySalesTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
    
    return NextResponse.json({
      totalProducts,
      lowStockProducts,
      totalSales,
      totalPurchases,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 