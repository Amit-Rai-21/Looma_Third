import type { ObjectId } from "mongodb"

export interface MongoSchoolDocument {
  _id?: ObjectId
  Looma_Id?: string
  District?: string
  "Lat long"?: string
  Municipality?: string
  "Name of the School"?: string
  Principal_Email?: string
  Principal_name?: string
  Province?: string
  Serial_Number?: string
  Version?: string
  principal_number?: number | string
  status?: "online" | "offline" | "maintenance"
  lastSeen?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface SchoolDocument {
  _id?: ObjectId
  name: string
  latitude: number | null
  longitude: number | null
  contact: {
    email: string | null
    phone: string | null
    headmaster: string | null
  }
  province: string
  district: string
  palika: string
  status: "online" | "offline" | "maintenance"
  lastSeen: Date
  loomaId: string
  loomaCount?: number
  looma: {
    id: string | null
    serialNumber: string | null
    version: string | null
    lastUpdate: Date | null
  }
  createdAt: Date
  updatedAt: Date
}

export function parseLatLong(latLong: string | undefined): { lat: number | null; lng: number | null } {
  if (!latLong) return { lat: null, lng: null }
  try {
    const parts = latLong.split(",")
    const lat = parseFloat(parts[0].trim())
    const lng = parts[1] ? parseFloat(parts[1].trim()) : null
    return { lat: isNaN(lat) ? null : lat, lng: isNaN(lng as number) ? null : lng }
  } catch {
    return { lat: null, lng: null }
  }
}

export function mongoToSchoolDocument(doc: MongoSchoolDocument): SchoolDocument {
  const { lat, lng } = parseLatLong(doc["Lat long"])
  
  return {
    _id: doc._id,
    name: doc["Name of the School"] || "",
    latitude: lat,
    longitude: lng,
    contact: {
      email: doc.Principal_Email || null,
      phone: doc.principal_number ? String(doc.principal_number) : null,
      headmaster: doc.Principal_name || null,
    },
    province: doc.Province || "",
    district: doc.District || "",
    palika: doc.Municipality || "",
    status: doc.status || "online",
    lastSeen: doc.lastSeen || new Date(),
    loomaId: doc.Looma_Id || "",
    loomaCount: 0,
    looma: {
      id: doc.Looma_Id || null,
      serialNumber: doc.Serial_Number || null,
      version: doc.Version || null,
      lastUpdate: null,
    },
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  }
}

export interface UserDocument {
  _id?: ObjectId
  username: string
  email: string
  password: string
  role: "admin" | "staff" | "viewer"
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

export interface QRScanDocument {
  _id?: ObjectId
  schoolId: ObjectId
  loomaId: string
  timestamp: Date
  staffName: string
  notes?: string
}

export interface AccessLogDocument {
  _id?: ObjectId
  schoolId: ObjectId
  userId: ObjectId
  timestamp: Date
  user: string
  action: string
  details?: string
  ipAddress?: string
}

export interface SessionDocument {
  _id?: ObjectId
  userId: ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

export const COLLECTIONS = {
  SCHOOLS: "schools",
  USERS: "users",
  QR_SCANS: "qr_scans",
  ACCESS_LOGS: "access_logs",
  SESSIONS: "sessions",
} as const
