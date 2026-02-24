"use client"

import type { School } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, User, Mail, Monitor } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface SchoolCardProps {
  school: School
  onClick: () => void
}

const schoolImages = [
  "/schools/school-1.jpg",
  "/schools/school-2.jpg",
  "/schools/school-3.jpg",
  "/schools/school-4.jpg",
  "/schools/school-5.jpg",
]

function getSchoolImage(schoolId: string): string {
  const hash = schoolId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return schoolImages[hash % schoolImages.length]
}

export function SchoolCard({ school, onClick }: SchoolCardProps) {
  const loomaCount = school.loomaCount || 1

  return (
    <Card
      className="cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden bg-white border-0 shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={getSchoolImage(school.id)}
            alt={school.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="font-bold text-white text-xl line-clamp-2 drop-shadow-lg">{school.name}</h3>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium line-clamp-1">
              {school.district}, {school.province}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a2c5b] to-[#2d4278] flex items-center justify-center shadow-md">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Devices</span>
                <span className="text-sm font-bold text-gray-900">
                  {loomaCount} Looma{loomaCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">
                {formatDistanceToNow(new Date(school.lastSeen), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5c842] to-[#e8b626] flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-[#1a2c5b]" />
              </div>
              <span className="text-sm font-semibold text-gray-900 truncate flex-1">{school.contact.headmaster}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600 truncate flex-1">{school.contact.email}</span>
            </div>
          </div>
        </div>

        <div className="h-1.5 bg-gradient-to-r from-[#1a2c5b] via-[#f5c842] to-[#0891b2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      </CardContent>
    </Card>
  )
}
