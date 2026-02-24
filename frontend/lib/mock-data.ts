import type { School } from "./types"

const nepalProvinces = [
  {
    name: "Koshi",
    districts: [
      "Jhapa",
      "Morang",
      "Sunsari",
      "Ilam",
      "Taplejung",
      "Panchthar",
      "Dhankuta",
      "Terhathum",
      "Sankhuwasabha",
      "Bhojpur",
      "Solukhumbu",
      "Okhaldhunga",
      "Khotang",
      "Udayapur",
    ],
  },
  {
    name: "Madhesh",
    districts: ["Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
  },
  {
    name: "Bagmati",
    districts: [
      "Kathmandu",
      "Bhaktapur",
      "Lalitpur",
      "Kavrepalanchok",
      "Sindhupalchok",
      "Rasuwa",
      "Nuwakot",
      "Dhading",
      "Makwanpur",
      "Chitwan",
      "Ramechhap",
      "Dolakha",
      "Sindhuli",
    ],
  },
  {
    name: "Gandaki",
    districts: [
      "Kaski",
      "Lamjung",
      "Tanahu",
      "Gorkha",
      "Manang",
      "Mustang",
      "Myagdi",
      "Parbat",
      "Baglung",
      "Syangja",
      "Nawalpur",
    ],
  },
  {
    name: "Lumbini",
    districts: [
      "Rupandehi",
      "Kapilvastu",
      "Palpa",
      "Arghakhanchi",
      "Gulmi",
      "Nawalparasi",
      "Dang",
      "Banke",
      "Bardiya",
      "Pyuthan",
      "Rolpa",
      "Rukum East",
    ],
  },
  {
    name: "Karnali",
    districts: ["Surkhet", "Dailekh", "Jajarkot", "Dolpa", "Jumla", "Kalikot", "Mugu", "Humla", "Salyan", "Rukum West"],
  },
  {
    name: "Sudurpashchim",
    districts: ["Kailali", "Kanchanpur", "Dadeldhura", "Baitadi", "Darchula", "Bajhang", "Bajura", "Achham", "Doti"],
  },
]

const schoolPrefixes = [
  "Shree",
  "Janakalyan",
  "Adarsha",
  "Rastriya",
  "Himalaya",
  "Buddha",
  "Saraswati",
  "Janata",
  "Praja",
  "Nepal",
]
const schoolSuffixes = [
  "Secondary School",
  "Higher Secondary School",
  "Basic School",
  "Model School",
  "Community School",
]

const firstNames = [
  "Ram",
  "Shyam",
  "Hari",
  "Krishna",
  "Sita",
  "Gita",
  "Maya",
  "Laxmi",
  "Bishnu",
  "Ganesh",
  "Sarita",
  "Kamala",
  "Prem",
  "Deepak",
  "Anita",
  "Bimala",
  "Gopal",
  "Suresh",
  "Mahesh",
  "Rajesh",
]
const lastNames = [
  "Sharma",
  "Thapa",
  "Adhikari",
  "Gurung",
  "Tamang",
  "Rai",
  "Limbu",
  "Magar",
  "KC",
  "Shrestha",
  "Poudel",
  "Gautam",
  "Neupane",
  "Bhattarai",
  "Khadka",
  "Basnet",
  "Bhandari",
  "Karki",
  "Ghimire",
  "Pandey",
]

function generateSchools(): School[] {
  const schools: School[] = []
  let schoolId = 1

  // Base coordinates for Nepal (roughly center)
  const baseLatMin = 26.3
  const baseLatMax = 30.4
  const baseLngMin = 80.0
  const baseLngMax = 88.2

  for (const province of nepalProvinces) {
    const schoolsPerProvince =
      Math.ceil(144 / 7) + (province.name === "Bagmati" ? 4 : province.name === "Koshi" ? 2 : 0)

    for (let i = 0; i < Math.min(schoolsPerProvince, Math.ceil(144 / 7) + 4) && schoolId <= 144; i++) {
      const district = province.districts[i % province.districts.length]
      const prefix = schoolPrefixes[Math.floor(Math.random() * schoolPrefixes.length)]
      const suffix = schoolSuffixes[Math.floor(Math.random() * schoolSuffixes.length)]
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

      // Generate random status with realistic distribution
      const statusRoll = Math.random()
      const status: "online" | "offline" | "maintenance" =
        statusRoll < 0.75 ? "online" : statusRoll < 0.9 ? "offline" : "maintenance"

      // Generate last seen based on status
      const now = new Date()
      let lastSeen: Date
      if (status === "online") {
        lastSeen = new Date(now.getTime() - Math.random() * 30 * 60 * 1000) // Within 30 minutes
      } else if (status === "offline") {
        lastSeen = new Date(now.getTime() - (1 + Math.random() * 7) * 24 * 60 * 60 * 1000) // 1-7 days ago
      } else {
        lastSeen = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000) // Within 2 hours
      }

      // Generate coordinates within Nepal bounds
      const lat = baseLatMin + Math.random() * (baseLatMax - baseLatMin)
      const lng = baseLngMin + Math.random() * (baseLngMax - baseLngMin)

      const loomaId = `LMA-${String(schoolId).padStart(3, "0")}`

      schools.push({
        id: String(schoolId),
        name: `${prefix} ${district} ${suffix}`,
        latitude: lat,
        longitude: lng,
        contact: {
          email: `school${schoolId}@edu.gov.np`,
          phone: `+977-${Math.floor(10 + Math.random() * 90)}-${Math.floor(100000 + Math.random() * 900000)}`,
          headmaster: `${firstName} ${lastName}`,
        },
        province: province.name,
        district: district,
        palika: `${district} Municipality`,
        status,
        lastSeen: lastSeen.toISOString(),
        loomaId,
        loomaCount: Math.floor(1 + Math.random() * 10),
        qrScans: generateQRScans(schoolId, loomaId),
        accessLogs: generateAccessLogs(schoolId),
        looma: {
          id: loomaId,
          serialNumber: `SN${String(2024000 + schoolId)}`,
          version: `v${Math.floor(2 + Math.random() * 2)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          lastUpdate: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      schoolId++
    }
  }

  return schools.slice(0, 144)
}

function generateQRScans(schoolId: number, loomaId: string) {
  const scans = []
  const count = Math.floor(Math.random() * 5)
  const staffNames = ["Sita Sharma", "Bikash KC", "Anita Gurung", "Mohan Yadav", "Hari Oli", "Gita Poudel", "Ram Thapa"]

  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 14))
    scans.push({
      id: `qr-${schoolId}-${i}`,
      timestamp: date.toISOString(),
      staffName: staffNames[Math.floor(Math.random() * staffNames.length)],
      loomaId: loomaId,
      notes: ["Regular check", "Software update", "Hardware inspection", "Content sync"][Math.floor(Math.random() * 4)],
    })
  }
  return scans
}

function generateAccessLogs(schoolId: number) {
  const logs = []
  const count = Math.floor(Math.random() * 6)
  const actions = ["SSH Access", "View Status", "Remote Shell", "System Check", "Content Upload", "Maintenance Mode"]
  const users = ["admin", "staff1", "staff2", "staff3"]

  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 14))
    logs.push({
      id: `al-${schoolId}-${i}`,
      timestamp: date.toISOString(),
      user: users[Math.floor(Math.random() * users.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      details: ["Routine check", "System update", "Troubleshooting", "Content update"][Math.floor(Math.random() * 4)],
    })
  }
  return logs
}

export const mockSchools: School[] = generateSchools()
