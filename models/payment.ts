import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: [true, 'Payment number is required'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['incoming', 'outgoing'],
  },
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Check', 'Online Payment', 'Other'],
  },
  reference: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  // For incoming payments
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customerName: {
    type: String,
    trim: true,
  },
  // For outgoing payments
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  supplierName: {
    type: String,
    trim: true,
  },
  // Related invoice or purchase order
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  invoiceNumber: {
    type: String,
    trim: true,
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
  },
  purchaseOrderNumber: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
    default: 'Completed',
  },
  attachments: [{
    fileName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  account: {
    type: String,
    trim: true,
  },
  // Additional fields for record-keeping
  processedBy: {
    type: String,
    trim: true,
  },
  transactionId: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Pre-save validation for making sure either customer or supplier is provided based on type
PaymentSchema.pre('validate', function(next) {
  if (this.type === 'incoming' && !this.customer) {
    this.invalidate('customer', 'Customer is required for incoming payments');
  } else if (this.type === 'outgoing' && !this.supplier) {
    this.invalidate('supplier', 'Supplier is required for outgoing payments');
  }
  next();
});

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 