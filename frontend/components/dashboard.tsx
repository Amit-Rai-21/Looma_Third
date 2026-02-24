"use client"

import { useState, useMemo, useEffect } from "react"
import type { School } from "@/lib/types"
import { schoolsAPI } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "./dashboard-header"
import { SchoolList } from "./school-list"
import { NepalMap } from "./nepal-map"
import { SchoolDetailModal } from "./school-detail-modal"
import { AdminPanel } from "./admin-panel"
import { QRScansPanel } from "./qr-scans-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Plus, Filter, Loader2 } from "lucide-react"
import { QrCode, School as SchoolIcon } from "lucide-react"

export function Dashboard() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [provinceFilter, setProvinceFilter] = useState<string>("all")
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [sidebarView, setSidebarView] = useState<"schools" | "scans">("schools")

  const isAdmin = user?.role === "admin"
  const isViewer = user?.role === "viewer"

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchSchools = async () => {
    try {
      setIsLoading(true)
      const data = await schoolsAPI.getAll({
        search: debouncedSearch || undefined,
        province: provinceFilter !== "all" ? provinceFilter : undefined,
      })
      setSchools(data.schools)
    } catch (error: any) {
      console.error("Failed to fetch schools:", error)
      // For viewers with no backend session, just show empty list — no crash
      if (isViewer) {
        setSchools([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [debouncedSearch, provinceFilter])

  const provinces = useMemo(() => {
    return Array.from(
      new Set(
        schools
          .map((s) => s.province)
          .filter((p) => p && p.trim() !== "")
      )
    ).sort()
  }, [schools])

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Looma ID", "District", "Province", "Palika", "Headmaster", "Email", "Phone"]
    const rows = schools.map((s) => [
      s.id,
      s.name,
      s.loomaId,
      s.district,
      s.province,
      s.palika,
      s.contact.headmaster,
      s.contact.email,
      s.contact.phone,
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "looma-schools-export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSchoolAdded = () => {
    fetchSchools()
  }

  const handleSchoolsChanged = () => {
    fetchSchools()
  }

  const handleSchoolUpdated = (updated: School) => {
    setSelectedSchool(updated)
    setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  if (sidebarView === "schools" && isLoading && schools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a2c5b]" />
          <p className="text-gray-600 font-medium">Loading schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#1a2c5b] text-white flex flex-col fixed left-0 top-0 h-screen">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Looma Dashboard</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => setSidebarView("schools")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              sidebarView === "schools" ? "bg-white/10" : "hover:bg-white/10"
            }`}
          >
            <SchoolIcon className="h-4 w-4" />
            Schools
          </button>

          {/* QR Scans tab — hidden for viewer */}
          {!isViewer && (
            <button
              type="button"
              onClick={() => setSidebarView("scans")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                sidebarView === "scans" ? "bg-white/10" : "hover:bg-white/10"
              }`}
            >
              <QrCode className="h-4 w-4" />
              QR Scans
            </button>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 ml-64">
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
          {sidebarView === "scans" && !isViewer ? (
            <QRScansPanel />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {debouncedSearch || provinceFilter !== "all" ? "Filtered Results" : "All Schools"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1a2c5b]"></span>
                      <span className="font-semibold text-gray-900">{schools.length}</span>
                    </span>
                    school{schools.length !== 1 ? "s" : ""} found
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Filter className="h-4 w-4" />
                      <span className="text-sm font-medium">Filter:</span>
                    </div>
                    <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                      <SelectTrigger className="w-44 h-10 border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Provinces" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Provinces</SelectItem>
                        {provinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 pl-3 border-l border-gray-300">
                      <Button
                        size="sm"
                        className="gap-2 h-10 bg-gradient-to-r from-[#1a2c5b] to-[#2d4278] hover:from-[#152447] hover:to-[#253862] text-white shadow-md"
                        onClick={handleExportCSV}
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium">Export</span>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 h-10 bg-gradient-to-r from-[#1a2c5b] to-[#2d4278] hover:from-[#152447] hover:to-[#253862] text-white shadow-md"
                        onClick={() => setShowAdminPanel(true)}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium">Add School</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full">
                {viewMode === "list" ? (
                  <SchoolList
                    schools={schools}
                    onSchoolSelect={setSelectedSchool}
                    onSchoolsChanged={handleSchoolsChanged}
                  />
                ) : (
                  <NepalMap schools={schools} onSchoolSelect={setSelectedSchool} />
                )}
              </div>
            </>
          )}
        </main>

        <SchoolDetailModal
          school={selectedSchool}
          isOpen={!!selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onUpdated={handleSchoolUpdated}
        />

        {isAdmin && (
          <AdminPanel
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            onSchoolAdded={handleSchoolAdded}
          />
        )}
      </div>
    </div>
  )
}