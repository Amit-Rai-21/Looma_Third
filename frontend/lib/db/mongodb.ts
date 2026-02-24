import { MongoClient, type Db, type Document } from "mongodb"

const uri = process.env.MONGODB_URI || ""
const dbName = process.env.MONGODB_DB_NAME || "looma-dashboard"

// Enhanced connection options with pooling and performance settings
const options = {
  maxPoolSize: 10,           // Maximum connections in pool
  minPoolSize: 5,            // Minimum connections in pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000,    // Socket timeout
  connectTimeoutMS: 10000,   // Connection timeout
}

let client: MongoClient
let clientPromise: Promise<MongoClient> | null = null
let cachedDb: Db | null = null

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Check if the MongoDB URI is valid
function isValidMongoUri(uri: string): boolean {
  return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")
}

// Export helper to check demo mode
export function isDemoMode(): boolean {
  return !uri || !isValidMongoUri(uri)
}

// Get database instance with caching
export async function getDatabase(): Promise<Db | null> {
  if (!uri || !isValidMongoUri(uri)) {
    console.warn("MONGODB_URI not set or invalid - running in demo mode")
    return null
  }

  // Return cached database if available
  if (cachedDb) {
    return cachedDb
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
  }

  try {
    const connectedClient = await clientPromise
    cachedDb = connectedClient.db(dbName)
    console.log(`✅ Connected to MongoDB database: ${dbName}`)
    return cachedDb
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    throw error
  }
}

// Get database synchronously (assumes connection is already established)
export function getDb(): Db {
  if (!cachedDb) {
    throw new Error("Database not connected. Call getDatabase() first.")
  }
  return cachedDb
}

// Connect to database and return both client and db (for compatibility)
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!uri || !isValidMongoUri(uri)) {
    throw new Error("MONGODB_URI not set or invalid")
  }

  const db = await getDatabase()
  if (!db) {
    throw new Error("Failed to connect to database")
  }

  const connectedClient = await (clientPromise as Promise<MongoClient>)
  return { client: connectedClient, db }
}

// Disconnect from database (useful for CLI scripts)
export async function disconnectFromDatabase(): Promise<void> {
  if (clientPromise) {
    const connectedClient = await clientPromise
    await connectedClient.close()
    clientPromise = null
    cachedDb = null
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = undefined
    }
    console.log("✅ Disconnected from MongoDB")
  }
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const db = await getDatabase()
    if (!db) return false
    
    // Ping the database
    await db.admin().ping()
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

// Get collection with type safety helper
export async function getCollection<T extends Document = Document>(collectionName: string) {
  const db = await getDatabase()
  if (!db) {
    throw new Error("Database not available in demo mode")
  }
  return db.collection<T>(collectionName)
}

export default clientPromise