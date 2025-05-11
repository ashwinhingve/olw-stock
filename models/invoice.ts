import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
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
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
  partyName: {
    type: String,
    required: true,
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: false,
  },
  purchaseReference: {
    type: String,
    required: false,
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
  taxRate: {
    type: Number,
    required: false,
    default: 0,
  },
  taxAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  discountAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  dueAmount: {
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

// Virtual for due amount calculation
InvoiceSchema.virtual('due').get(function() {
  return this.total - this.paidAmount;
});

// Pre-save hook to calculate totals
InvoiceSchema.pre('save', function(next) {
  const invoiceDoc = this as any;
  
  // Calculate item totals if not already set
  invoiceDoc.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!item.total) {
      item.total = item.quantity * item.price;
    }
  });
  
  // Calculate subtotal
  invoiceDoc.subtotal = invoiceDoc.items.reduce((sum: number, item: any) => sum + item.total, 0); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Calculate tax amount if tax rate is provided
  if (invoiceDoc.taxRate && invoiceDoc.taxRate > 0) {
    invoiceDoc.taxAmount = (invoiceDoc.subtotal * invoiceDoc.taxRate) / 100;
  } else {
    invoiceDoc.taxAmount = 0;
  }
  
  // Calculate final total
  invoiceDoc.total = invoiceDoc.subtotal + invoiceDoc.taxAmount - (invoiceDoc.discountAmount || 0);
  
  // Calculate due amount
  invoiceDoc.dueAmount = invoiceDoc.total - (invoiceDoc.paidAmount || 0);
  
  // Update payment status based on paid amount
  if (invoiceDoc.paidAmount >= invoiceDoc.total) {
    invoiceDoc.paymentStatus = 'paid';
  } else if (invoiceDoc.paidAmount > 0) {
    invoiceDoc.paymentStatus = 'partial';
  } else {
    invoiceDoc.paymentStatus = 'unpaid';
  }
  
  next();
});

// Function to generate unique invoice reference
InvoiceSchema.statics.generateReference = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = await this.countDocuments();
  return `INV-${year}${month}${String(count + 1).padStart(4, '0')}`;
};

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema); 