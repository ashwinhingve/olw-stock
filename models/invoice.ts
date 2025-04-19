import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required'],
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Invoice date is required'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount must be a positive number'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax must be a positive number'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be a positive number'],
    },
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be a positive number'],
  },
  taxTotal: {
    type: Number,
    required: [true, 'Tax total is required'],
    default: 0,
    min: [0, 'Tax total must be a positive number'],
  },
  discountTotal: {
    type: Number,
    required: [true, 'Discount total is required'],
    default: 0,
    min: [0, 'Discount total must be a positive number'],
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total must be a positive number'],
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid must be a positive number'],
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    min: [0, 'Balance must be a positive number'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Paid', 'Unpaid', 'Partial', 'Overdue'],
    default: 'Unpaid',
  },
  notes: {
    type: String,
    trim: true,
  },
  paymentTerms: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Virtual for determining if invoice is overdue
InvoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'Paid' && new Date(this.dueDate) < new Date();
});

// Pre-save hook to update status based on payment 
InvoiceSchema.pre('save', function(next) {
  if (this.amountPaid >= this.total) {
    this.status = 'Paid';
    this.balance = 0;
  } else if (this.amountPaid > 0) {
    this.status = 'Partial';
    this.balance = this.total - this.amountPaid;
  } else {
    if (new Date(this.dueDate) < new Date()) {
      this.status = 'Overdue';
    } else {
      this.status = 'Unpaid';
    }
    this.balance = this.total;
  }
  next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema); 