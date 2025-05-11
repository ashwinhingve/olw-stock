import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/item';

// GET all items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const store = searchParams.get('store') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    const filter: any = { userId: session.user.id };
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } },
        { hsnCode: { $regex: query, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (store) {
      filter.storeId = store;
    }

    const sort: any = {};
 // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(filter),
    ]);

    const categories = await Item.distinct('category', { userId: session.user.id });

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
      categories,
    });
  } catch (error) {
    console.error('Error in GET /api/items:', error);
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST a new item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await req.json();
    data.userId = session.user.id;

    // Generate barcode if not provided
    if (!data.barcode) {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      data.barcode = `${timestamp}${random}`;
    }

    const item = await Item.create(data);
    
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error in POST /api/items:', error);
    const err = error as Error;
    return NextResponse.json(
      { 
        success: false, 
        error: err.code === 11000 ? 'Duplicate barcode found' : err.message || 'Internal server error'
      },
      { status: err.code === 11000 ? 400 : 500 }
    );
  }
} 