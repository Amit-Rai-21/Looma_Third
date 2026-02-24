import { ObjectId } from "mongodb"
import { getDatabase } from "./mongodb"
import { type AccessLogDocument, COLLECTIONS } from "./models"

export async function createAccessLog(log: {
  schoolId: string
  userId: string
  user: string
  action: string
  details?: string
  ipAddress?: string
}): Promise<AccessLogDocument> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  const doc: AccessLogDocument = {
    schoolId: new ObjectId(log.schoolId),
    userId: new ObjectId(log.userId),
    timestamp: new Date(),
    user: log.user,
    action: log.action,
    details: log.details,
    ipAddress: log.ipAddress,
  }

  const result = await db.collection<AccessLogDocument>(COLLECTIONS.ACCESS_LOGS).insertOne(doc)
  return { ...doc, _id: result.insertedId }
}

export async function getAccessLogsBySchool(schoolId: string): Promise<AccessLogDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<AccessLogDocument>(COLLECTIONS.ACCESS_LOGS)
    .find({ schoolId: new ObjectId(schoolId) })
    .sort({ timestamp: -1 })
    .toArray()
}

export async function getAccessLogsByUser(userId: string): Promise<AccessLogDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<AccessLogDocument>(COLLECTIONS.ACCESS_LOGS)
    .find({ userId: new ObjectId(userId) })
    .sort({ timestamp: -1 })
    .toArray()
}

export async function getRecentAccessLogs(limit = 100): Promise<AccessLogDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<AccessLogDocument>(COLLECTIONS.ACCESS_LOGS)
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
}