# TypeScript Guide: Fixing Common Type Errors

This guide provides solutions for common TypeScript errors in this codebase, especially addressing the "Unexpected any" errors.

## Common Error Types and How to Fix Them

### 1. Unexpected any. Specify a different type.

This error occurs when you use the `any` type, which defeats TypeScript's type checking. Here's how to fix it:

#### For Error Handling:

Instead of:
```typescript
try {
  // code
} catch (error: any) {
  console.error(error.message);
}
```

Use:
```typescript
try {
  // code
} catch (error) {
  const err = error as Error; // or a more specific error type
  console.error(err.message);
}
```

#### For API Responses:

Create proper interfaces for your API responses:

```typescript
// In types/index.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// In your component
const response = await fetch('/api/data') as ApiResponse<YourDataType>;
```

#### For MongoDB/Mongoose Errors:

```typescript
// In types/index.ts
export interface MongooseError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

// In your code
try {
  // database operation
} catch (error) {
  const dbError = error as MongooseError;
  if (dbError.code === 11000) {
    // Handle duplicate key error
  }
}
```

### 2. For Query Parameters and Filters:

Instead of:
```typescript
let query: Record<string, any> = {};
```

Create specific interfaces:
```typescript
interface QueryFilters {
  search?: string;
  category?: string;
  active?: boolean;
  $or?: Array<Record<string, unknown>>;
  // Add other fields as needed
  [key: string]: unknown; // For dynamic properties
}

const query: QueryFilters = {};
```

### 3. For Function Parameters and Return Types:

Instead of:
```typescript
function processData(data: any): any {
  // ...
}
```

Be specific:
```typescript
interface InputData {
  id: string;
  name: string;
  // other fields
}

interface ProcessedResult {
  processed: boolean;
  result: string;
  // other fields
}

function processData(data: InputData): ProcessedResult {
  // ...
}
```

## Best Practices

1. **Create interfaces for all data structures**:
   - API requests and responses
   - Database models
   - Component props
   - State objects

2. **Use built-in utility types**:
   - `Partial<T>` - Make all properties optional
   - `Required<T>` - Make all properties required
   - `Pick<T, K>` - Pick subset of properties
   - `Omit<T, K>` - Omit subset of properties
   - `Record<K, T>` - Object with keys of type K and values of type T

3. **Use type assertions only when necessary**:
   ```typescript
   // Try to avoid this when possible
   const user = data as User;
   
   // Better to use type guards
   if (isUser(data)) {
     // data is now typed as User
   }
   ```

4. **Create type guards when working with unknown data**:
   ```typescript
   function isUser(data: unknown): data is User {
     return (
       data !== null &&
       typeof data === 'object' &&
       'id' in data &&
       'name' in data
     );
   }
   ```

5. **Avoid using `unknown` without type narrowing**:
   ```typescript
   function handleData(data: unknown) {
     // Error: Object is of type 'unknown'
     console.log(data.name);
     
     // Correct: Check the type first
     if (typeof data === 'object' && data !== null && 'name' in data) {
       console.log(data.name);
     }
   }
   ```

By following these patterns, you can eliminate "any" types and improve type safety throughout the codebase. 