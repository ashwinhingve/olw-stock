import mongoose from 'mongoose';

const SalesReturnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false,
  },
  customerName: {
    type: String,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false,
  },
  invoiceNumber: {
    type: String,
    required: false,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
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
    },
    reason: {
      type: String,
      required: true,
      enum: ['Damaged Product', 'Wrong Item', 'Item Not Needed', 'Quality Issues', 'Other'],
    },
    notes: {
      type: String,
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
    enum: ['Pending', 'Approved', 'Completed', 'Rejected'],
    default: 'Pending',
  },
  reason: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  refundStatus: {
    type: String,
    enum: ['Not Refunded', 'Partially Refunded', 'Fully Refunded'],
    default: 'Not Refunded',
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for item count
SalesReturnSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save hook to calculate totals
SalesReturnSchema.pre('save', function(next) {
  const returnDoc = this as any;
  
  // Calculate item totals if not already set
  returnDoc.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!item.total) {
      item.total = item.quantity * item.price;
    }
  });
  
  // Calculate subtotal
  returnDoc.subtotal = returnDoc.items.reduce((sum: number, item: any) => sum + item.total, 0); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Calculate final total (including tax if applicable)
  returnDoc.total = returnDoc.subtotal + returnDoc.taxAmount;
  
  next();
});

// Function to generate unique return number
SalesReturnSchema.statics.generateReturnNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = await this.countDocuments();
  return `RET-${year}${month}${String(count + 1).padStart(4, '0')}`;
};

export default mongoose.models.SalesReturn || mongoose.model('SalesReturn', SalesReturnSchema); 