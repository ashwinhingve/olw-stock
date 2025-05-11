import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Database connection function 
 * Returns a mongoose instance
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Clear the promise if it's been more than 5 minutes since the last attempt
  if (cached.lastAttempt && Date.now() - cached.lastAttempt > 5 * 60 * 1000) {
    console.log('Clearing stale connection promise');
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      connectTimeoutMS: 10000, // Connection timeout
      socketTimeoutMS: 45000, // Socket timeout
    };

    // Save the attempt timestamp
    cached.lastAttempt = Date.now();

    try {
      console.log(`Connecting to MongoDB at: ${MONGODB_URI!.replace(/:([^:@]+)@/, ':****@')}`);
      
      cached.promise = mongoose.connect(MONGODB_URI!, opts)
        .then((mongoose) => {
          console.log('Connected to MongoDB successfully');
          return mongoose;
        })
        .catch((error) => {
          console.error('Error connecting to MongoDB:', error);
          // Clear the promise so next attempt can try again
          cached.promise = null;
          throw error;
        });
    } catch (initError) {
      console.error('Failed to initialize MongoDB connection:', initError);
      cached.promise = null;
      throw initError;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    console.error('Error awaiting MongoDB connection:', e);
    cached.promise = null;
    throw e;
  }
}

export default dbConnect; 