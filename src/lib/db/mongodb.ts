import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB. Reuses existing connection in serverless (e.g. Vercel).
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? "";
  if (!uri) {
    throw new Error(
      "MONGODB_URI (or DATABASE_URL) is not set. Please define it in your environment variables."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
