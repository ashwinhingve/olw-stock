import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false,
  },
  supplierName: {
    type: String,
    required: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  taxAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'received', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  paymentHistory: [{
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      required: true,
      enum: ['cash', 'bank', 'credit_card', 'check', 'other'],
    },
    reference: String,
    notes: String,
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for item count
PurchaseSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save hook to calculate totals
PurchaseSchema.pre('save', function(next) {
  const purchaseDoc = this as any;
  
  // Calculate item totals if not already set
  purchaseDoc.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!item.total) {
      item.total = item.quantity * item.price;
    }
  });
  
  // Calculate subtotal
  purchaseDoc.subtotal = purchaseDoc.items.reduce((sum: number, item: any) => sum + item.total, 0); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Calculate final total (including tax if applicable)
  purchaseDoc.total = purchaseDoc.subtotal + (purchaseDoc.taxAmount || 0);
  
  next();
});

// Function to generate unique purchase reference
PurchaseSchema.statics.generateReference = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = await this.countDocuments();
  return `PO-${year}${month}${String(count + 1).padStart(4, '0')}`;
};

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema); 