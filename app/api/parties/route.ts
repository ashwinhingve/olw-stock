import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Party from '@/models/party';

// GET /api/parties - Get all parties with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDb();
    
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const searchQuery = searchParams.get('search') || '';
    
    let query: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Apply filter
    if (filter === 'payable') {
      query.balanceType = 'Payable';
    } else if (filter === 'receivable') {
      query.balanceType = 'Receivable';
    } else if (filter === 'zeroBalance') {
      query.openingBalance = 0;
    } else if (filter === 'hideZeroBalance') {
      query.openingBalance = { $ne: 0 };
    }
    
    // Apply search
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { mobileNumber: { $regex: searchQuery, $options: 'i' } },
      ];
    }
    
    const parties = await Party.find(query).sort({ name: 1 });
    
    // Calculate totals
    const payableTotal = await Party.aggregate([
      { $match: { balanceType: 'Payable' } },
      { $group: { _id: null, total: { $sum: '$openingBalance' } } }
    ]);
    
    const receivableTotal = await Party.aggregate([
      { $match: { balanceType: 'Receivable' } },
      { $group: { _id: null, total: { $sum: '$openingBalance' } } }
    ]);
    
    return NextResponse.json({
      parties,
      totals: {
        payable: payableTotal.length > 0 ? payableTotal[0].total : 0,
        receivable: receivableTotal.length > 0 ? receivableTotal[0].total : 0
      }
    });
  } catch (error) {
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/parties - Create a new party
export async function POST(request: NextRequest) {
  try {
    await connectDb();
    
    const body = await request.json();
    
    // Handle shipping address if same as billing
    if (body.sameShippingAddress && body.billingAddress) {
      body.shippingAddress = body.billingAddress;
    }
    
    const party = await Party.create(body);
    
    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    const err = error as Error; 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 