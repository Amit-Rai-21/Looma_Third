import { ObjectId } from "mongodb"
import { getDatabase } from "./mongodb"
import { type QRScanDocument, COLLECTIONS } from "./models"

export async function createQRScan(scan: {
  schoolId: string
  loomaId: string
  staffName: string
  notes?: string
}): Promise<QRScanDocument> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  const doc: QRScanDocument = {
    schoolId: new ObjectId(scan.schoolId),
    loomaId: scan.loomaId,
    timestamp: new Date(),
    staffName: scan.staffName,
    notes: scan.notes,
  }

  const result = await db.collection<QRScanDocument>(COLLECTIONS.QR_SCANS).insertOne(doc)
  return { ...doc, _id: result.insertedId }
}

export async function getQRScansBySchool(schoolId: string): Promise<QRScanDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<QRScanDocument>(COLLECTIONS.QR_SCANS)
    .find({ schoolId: new ObjectId(schoolId) })
    .sort({ timestamp: -1 })
    .toArray()
}

export async function getRecentQRScans(limit = 50): Promise<QRScanDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<QRScanDocument>(COLLECTIONS.QR_SCANS)
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
}

export async function getQRScansByDateRange(startDate: Date, endDate: Date): Promise<QRScanDocument[]> {
  const db = await getDatabase()
  
  if (!db) {
    throw new Error('Database not available')
  }

  return db
    .collection<QRScanDocument>(COLLECTIONS.QR_SCANS)
    .find({
      timestamp: { $gte: startDate, $lte: endDate },
    })
    .sort({ timestamp: -1 })
    .toArray()
}