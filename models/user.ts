import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define roles and permissions
export const ROLES = {
  STORE_ADMIN: 'store_admin',
  SALES_OPERATOR: 'sales_operator',
  SALES_PURCHASE_OPERATOR: 'sales_purchase_operator',
};

// Define permissions
export const PERMISSIONS = {
  // User/Staff permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Inventory permissions
  VIEW_INVENTORY: 'view_inventory',
  CREATE_INVENTORY: 'create_inventory',
  EDIT_INVENTORY: 'edit_inventory',
  DELETE_INVENTORY: 'delete_inventory',
  
  // Sales permissions
  VIEW_SALES: 'view_sales',
  CREATE_SALES: 'create_sales',
  EDIT_SALES: 'edit_sales',
  DELETE_SALES: 'delete_sales',
  
  // Purchase permissions
  VIEW_PURCHASES: 'view_purchases',
  CREATE_PURCHASES: 'create_purchases',
  EDIT_PURCHASES: 'edit_purchases',
  DELETE_PURCHASES: 'delete_purchases',
  
  // Reports permissions
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports'
};

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters']
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.SALES_OPERATOR
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dataVisibility: {
    type: String,
    enum: ['own', 'store', 'admin_group', 'all'],
    default: 'own'
  },
  // For admin users, this indicates the admin who created them
  // For regular users, this indicates which admin's data they can access
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = new Date();
});

// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user has a specific permission
UserSchema.methods.hasPermission = function(permission: string) {
  // Role-based permission mapping
  const rolePermissions = {
    // Store Admin has all permissions
    [ROLES.STORE_ADMIN]: [
      // User permissions
      PERMISSIONS.VIEW_USERS, PERMISSIONS.CREATE_USERS, 
      PERMISSIONS.EDIT_USERS, PERMISSIONS.DELETE_USERS,
      // Inventory permissions
      PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.CREATE_INVENTORY, 
      PERMISSIONS.EDIT_INVENTORY, PERMISSIONS.DELETE_INVENTORY,
      // Sales permissions
      PERMISSIONS.VIEW_SALES, PERMISSIONS.CREATE_SALES, 
      PERMISSIONS.EDIT_SALES, PERMISSIONS.DELETE_SALES,
      // Purchase permissions
      PERMISSIONS.VIEW_PURCHASES, PERMISSIONS.CREATE_PURCHASES, 
      PERMISSIONS.EDIT_PURCHASES, PERMISSIONS.DELETE_PURCHASES,
      // Reports permissions
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.GENERATE_REPORTS
    ],
    // Sales Operator can only view inventory and manage sales
    [ROLES.SALES_OPERATOR]: [
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_SALES, PERMISSIONS.CREATE_SALES, PERMISSIONS.EDIT_SALES,
      PERMISSIONS.VIEW_REPORTS
    ],
    // Sales Purchase Operator can manage sales and purchases
    [ROLES.SALES_PURCHASE_OPERATOR]: [
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_SALES, PERMISSIONS.CREATE_SALES, PERMISSIONS.EDIT_SALES,
      PERMISSIONS.VIEW_PURCHASES, PERMISSIONS.CREATE_PURCHASES, PERMISSIONS.EDIT_PURCHASES,
      PERMISSIONS.VIEW_REPORTS
    ]
  };
  
  // Check if the user's role has the required permission
  return rolePermissions[this.role]?.includes(permission) || false;
};

// Method to check if user can access specific data
UserSchema.methods.canAccessData = function(adminId: string) {
  // Store Admins can only access their own data
  if (this.role === ROLES.STORE_ADMIN) {
    return this._id.toString() === adminId.toString();
  }
  
  // Other users can access data based on their assigned adminId
  return this.adminId.toString() === adminId.toString();
};

// Method to check if a user can manage staff (create/edit/delete)
UserSchema.methods.canManageStaff = function() {
  return this.role === ROLES.STORE_ADMIN;
};

export default mongoose.models.User || mongoose.model('User', UserSchema); 