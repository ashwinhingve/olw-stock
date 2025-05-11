import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: false,
    validate: {
      validator: function(v: string) {
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email!` // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  },
  customerPhone: {
    type: String,
    required: false,
  },
  customerAddress: {
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
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  taxRate: {
    type: Number,
    required: true,
    default: 0,
  },
  taxAmount: {
    type: Number,
    required: true,
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
  notes: {
    type: String,
    required: false,
  },
  expiryDate: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired', 'Converted'],
    default: 'Draft',
  },
  convertedToInvoice: {
    type: Boolean,
    default: false,
  },
  convertedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false,
  },
  termsAndConditions: {
    type: String,
    required: false,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for item count
QuoteSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum: number, item: any) => sum + item.quantity, 0); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
});

// Pre-save hook to calculate totals
QuoteSchema.pre('save', function(next) {
  const quote = this as any;
  
  // Calculate item totals if not already set
  quote.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!item.total) {
      item.total = item.quantity * item.price;
    }
  });
  
  // Calculate subtotal
  quote.subtotal = quote.items.reduce((sum: number, item: any) => sum + item.total, 0); // eslint-disable-line @typescript-eslint/no-explicit-any // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // Calculate tax amount
  quote.taxAmount = (quote.subtotal * quote.taxRate) / 100;
  
  // Calculate final total
  quote.total = quote.subtotal + quote.taxAmount - quote.discountAmount;
  
  next();
});

// Export model
export default mongoose.models.Quote || mongoose.model('Quote', QuoteSchema); 