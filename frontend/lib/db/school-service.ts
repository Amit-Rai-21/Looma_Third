import { ObjectId } from "mongodb"
import { getDatabase } from "./mongodb"
import { type SchoolDocument, type MongoSchoolDocument, mongoToSchoolDocument, COLLECTIONS } from "./models"
import { mockSchools } from "../mock-data"

function getMockSchoolDocuments(): SchoolDocument[] {
  return mockSchools.map((school) => ({
    _id: new ObjectId(),
    name: school.name,
    latitude: school.latitude,
    longitude: school.longitude,
    contact: school.contact,
    province: school.province,
    district: school.district,
    palika: school.palika,
    status: school.status,
    lastSeen: new Date(school.lastSeen),
    loomaId: school.loomaId,
    looma: {
      id: school.looma.id,
      serialNumber: school.looma.serialNumber,
      version: school.looma.version,
      lastUpdate: new Date(school.looma.lastUpdate),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

let mockSchoolDocs: SchoolDocument[] | null = null

function getMockSchools(): SchoolDocument[] {
  if (!mockSchoolDocs) {
    mockSchoolDocs = getMockSchoolDocuments()
  }
  return mockSchoolDocs
}

export async function getAllSchools(): Promise<SchoolDocument[]> {
  const db = await getDatabase()

  if (!db) {
    return getMockSchools()
  }

  const mongoDocs = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).find({}).toArray()
  return mongoDocs.map(mongoToSchoolDocument)
}

export async function getSchoolById(id: string): Promise<SchoolDocument | null> {
  const db = await getDatabase()

  if (!db) {
    const schools = getMockSchools()
    return schools.find((s) => s._id?.toString() === id) || schools[Number.parseInt(id) - 1] || null
  }

  const mongoDoc = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).findOne({ _id: new ObjectId(id) })
  return mongoDoc ? mongoToSchoolDocument(mongoDoc) : null
}

export async function getSchoolByLoomaId(loomaId: string): Promise<SchoolDocument | null> {
  const db = await getDatabase()

  if (!db) {
    return getMockSchools().find((s) => s.loomaId === loomaId) || null
  }

  const mongoDoc = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).findOne({ Looma_Id: loomaId })
  return mongoDoc ? mongoToSchoolDocument(mongoDoc) : null
}

export async function createSchool(
  school: Omit<SchoolDocument, "_id" | "createdAt" | "updatedAt">,
): Promise<SchoolDocument> {
  const db = await getDatabase()
  const now = new Date()
  
  const mongoDoc: MongoSchoolDocument = {
    "Name of the School": school.name,
    Province: school.province,
    District: school.district,
    Municipality: school.palika,
    Looma_Id: school.loomaId,
    "Lat long": school.latitude && school.longitude ? `${school.latitude}, ${school.longitude}` : undefined,
    Principal_Email: school.contact.email || undefined,
    Principal_name: school.contact.headmaster || undefined,
    principal_number: school.contact.phone || undefined,
    Serial_Number: school.looma.serialNumber || undefined,
    Version: school.looma.version || undefined,
    status: school.status,
    lastSeen: school.lastSeen,
    createdAt: now,
    updatedAt: now,
  }

  if (!db) {
    const doc = mongoToSchoolDocument({ ...mongoDoc, _id: new ObjectId() })
    getMockSchools().push(doc)
    return doc
  }

  const result = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).insertOne(mongoDoc)
  return mongoToSchoolDocument({ ...mongoDoc, _id: result.insertedId })
}

export async function updateSchool(id: string, updates: Partial<SchoolDocument>): Promise<SchoolDocument | null> {
  const db = await getDatabase()

  if (!db) {
    const schools = getMockSchools()
    const index = schools.findIndex((s) => s._id?.toString() === id)
    if (index > -1) {
      schools[index] = { ...schools[index], ...updates, updatedAt: new Date() }
      return schools[index]
    }
    return null
  }

  const mongoUpdates: Partial<MongoSchoolDocument> = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) mongoUpdates["Name of the School"] = updates.name
  if (updates.province !== undefined) mongoUpdates.Province = updates.province
  if (updates.district !== undefined) mongoUpdates.District = updates.district
  if (updates.palika !== undefined) mongoUpdates.Municipality = updates.palika
  if (updates.loomaId !== undefined) mongoUpdates.Looma_Id = updates.loomaId
  if (updates.latitude !== undefined || updates.longitude !== undefined) {
    mongoUpdates["Lat long"] = `${updates.latitude || 0}, ${updates.longitude || 0}`
  }
  if (updates.contact) {
    if (updates.contact.email !== undefined) mongoUpdates.Principal_Email = updates.contact.email || undefined
    if (updates.contact.headmaster !== undefined) mongoUpdates.Principal_name = updates.contact.headmaster || undefined
    if (updates.contact.phone !== undefined) mongoUpdates.principal_number = updates.contact.phone || undefined
  }
  if (updates.looma) {
    if (updates.looma.serialNumber !== undefined) mongoUpdates.Serial_Number = updates.looma.serialNumber || undefined
    if (updates.looma.version !== undefined) mongoUpdates.Version = updates.looma.version || undefined
  }
  if (updates.status !== undefined) mongoUpdates.status = updates.status
  if (updates.lastSeen !== undefined) mongoUpdates.lastSeen = updates.lastSeen

  const result = await db
    .collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: mongoUpdates },
      { returnDocument: "after" },
    )
  return result ? mongoToSchoolDocument(result) : null
}

export async function deleteSchool(id: string): Promise<boolean> {
  const db = await getDatabase()

  if (!db) {
    const schools = getMockSchools()
    const index = schools.findIndex((s) => s._id?.toString() === id)
    if (index > -1) {
      schools.splice(index, 1)
      return true
    }
    return false
  }

  const result = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount === 1
}

export async function getSchoolsByProvince(province: string): Promise<SchoolDocument[]> {
  const db = await getDatabase()

  if (!db) {
    return getMockSchools().filter((s) => s.province === province)
  }

  const mongoDocs = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).find({ Province: province }).toArray()
  return mongoDocs.map(mongoToSchoolDocument)
}

export async function getSchoolsByStatus(status: "online" | "offline" | "maintenance"): Promise<SchoolDocument[]> {
  const db = await getDatabase()

  if (!db) {
    return getMockSchools().filter((s) => s.status === status)
  }

  const mongoDocs = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).find({ status }).toArray()
  return mongoDocs.map(mongoToSchoolDocument)
}

export async function updateSchoolStatus(id: string, status: "online" | "offline" | "maintenance"): Promise<boolean> {
  const db = await getDatabase()

  if (!db) {
    const schools = getMockSchools()
    const school = schools.find((s) => s._id?.toString() === id)
    if (school) {
      school.status = status
      school.lastSeen = new Date()
      return true
    }
    return false
  }

  const result = await db
    .collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS)
    .updateOne({ _id: new ObjectId(id) }, { $set: { status, lastSeen: new Date(), updatedAt: new Date() } })
  return result.modifiedCount === 1
}

export async function getSchoolStats(): Promise<{
  total: number
  online: number
  offline: number
  maintenance: number
}> {
  const db = await getDatabase()

  if (!db) {
    const schools = getMockSchools()
    return {
      total: schools.length,
      online: schools.filter((s) => s.status === "online").length,
      offline: schools.filter((s) => s.status === "offline").length,
      maintenance: schools.filter((s) => s.status === "maintenance").length,
    }
  }

  const collection = db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS)

  const [total, online, offline, maintenance] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: "online" }),
    collection.countDocuments({ status: "offline" }),
    collection.countDocuments({ status: "maintenance" }),
  ])

  const noStatus = total - online - offline - maintenance

  return { total, online: online + noStatus, offline, maintenance }
}

export async function searchSchools(query?: string, status?: string, province?: string): Promise<SchoolDocument[]> {
  const db = await getDatabase()

  if (!db) {
    let results = getMockSchools()

    if (query) {
      const q = query.toLowerCase()
      results = results.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.district?.toLowerCase().includes(q) ||
          s.province?.toLowerCase().includes(q) ||
          s.palika?.toLowerCase().includes(q) ||
          s.contact?.headmaster?.toLowerCase().includes(q) ||
          s.loomaId?.toLowerCase().includes(q),
      )
    }

    if (status && status !== "all") {
      results = results.filter((s) => s.status === status)
    }

    if (province && province !== "all") {
      results = results.filter((s) => s.province === province)
    }

    return results
  }

  const filter: Record<string, unknown> = {}

  if (query) {
    filter.$or = [
      { "Name of the School": { $regex: query, $options: "i" } },
      { District: { $regex: query, $options: "i" } },
      { Province: { $regex: query, $options: "i" } },
      { Municipality: { $regex: query, $options: "i" } },
      { Principal_name: { $regex: query, $options: "i" } },
      { Looma_Id: { $regex: query, $options: "i" } },
    ]
  }

  if (status && status !== "all") {
    filter.status = status
  }

  if (province && province !== "all") {
    filter.Province = province
  }

  const mongoDocs = await db.collection<MongoSchoolDocument>(COLLECTIONS.SCHOOLS).find(filter).toArray()
  return mongoDocs.map(mongoToSchoolDocument)
}
