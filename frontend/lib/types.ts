export interface School {
  id: string
  name: string
  latitude: number
  longitude: number
  contact: {
    email: string
    phone: string
    headmaster: string
  }
  province: string
  district: string
  palika: string
  status: "online" | "offline" | "maintenance"
  lastSeen: string
  loomaId: string
  loomaCount: number
  looma: {
    id: string
    serialNumber: string
    version: string
    lastUpdate: string
  }
  studentCount?: number
  teacherCount?: number
  qrScans: QRScan[]
  accessLogs: AccessLog[]
  // Base64 data URL for school hero image, null/undefined means use default
  image?: string | null
}

export interface QRScan {
  id: string
  timestamp: string
  staffName: string
  loomaId: string
  notes?: string
}

// Scan record produced by the QR Scan Form project (stored in MongoDB)
export interface ScanRecord {
  id: string
  serial: string
  technician: string
  school: string
  software_version: string
  condition: string
  latitude?: string | null
  longitude?: string | null
  build_date?: string | null
  mfg_location?: string | null
  lot_number?: string | null
  timestamp: string
}

export interface AccessLog {
  id: string
  timestamp: string
  user: string
  action: string
  details?: string
}

export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "staff" | "viewer"
}