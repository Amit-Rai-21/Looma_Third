"use client"

import { useEffect, useState } from "react"
import { scansAPI } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { NepalMap } from "./nepal-map"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileDown, Trash2, Loader2, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ScanRow = {
  id: string
  serial: string
  technician: string
  school: string
  software_version: string
  condition: string
  latitude: string
  longitude: string
  lot_number: string
  timestamp: string
}

function safe(v: any): string {
  if (v === null || v === undefined) return "-"
  return String(v)
}

function formatCoordinate(v: any): string {
  if (v === null || v === undefined || v === "-") return "-"
  const num = parseFloat(String(v))
  if (isNaN(num)) return "-"
  return num.toFixed(2)
}
interface QRScansPanelProps {
  viewMode?: "list" | "map"
  onScanSelect?: (scan: ScanRow) => void
}
export function QRScansPanel({ viewMode = "list", onScanSelect }: QRScansPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === "admin"

  const [rows, setRows] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<"serial" | "school" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchScans = async () => {
    try {
      setLoading(true)

      const res = await scansAPI.list({ limit: 100, skip: 0 })
      const scans = Array.isArray(res?.scans) ? res.scans : []

      const mapped: ScanRow[] = scans.map((s: any) => ({
        id: safe(s._id ?? s.id),
        serial: safe(s.serial ?? s.serial_number),
        technician: safe(s.technician ?? s.scanner ?? s.user),
        school: safe(s.school ?? s.school_name),
        software_version: safe(s.software_version ?? s.version),
        condition: safe(s.condition),
        latitude: formatCoordinate(s.latitude),
        longitude: formatCoordinate(s.longitude),
        lot_number: safe(s.lot_number),
        timestamp: s.timestamp
          ? new Date(s.timestamp).toLocaleString()
          : s.created_at
          ? new Date(s.created_at).toLocaleString()
          : "-",
      }))

      setRows(mapped)
    } catch (err) {
      console.error("Failed to fetch QR scans:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const interval = setInterval(() => {
      if (mounted) fetchScans()
    }, 5000) // auto refresh

    fetchScans()

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])
  const handleSort = (field: "serial" | "school") => {
  if (sortField !== field) {
    setSortField(field)
    setSortDirection("asc")
  } else if (sortDirection === "asc") {
    setSortDirection("desc")
  } else {
    // third click: reset to original (unsorted) order
    setSortField(null)
    setSortDirection("asc")
  }
}

const sortedRows = [...rows].sort((a, b) => {
  if (!sortField) return 0
  const aVal = a[sortField]?.toLowerCase() ?? ""
  const bVal = b[sortField]?.toLowerCase() ?? ""
  if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
  if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
  return 0
})

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleExport = () => {
    const selectedScans = rows.filter((r) => selectedIds.has(r.id))
    
    if (selectedScans.length === 0) {
      toast({
        title: "No scans selected",
        description: "Please select at least one scan to export.",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Serial",
      "Technician",
      "School",
      "Software Version",
      "Condition",
      "Latitude",
      "Longitude",
      "Lot Number",
      "Timestamp",
    ]

    const csvRows = selectedScans.map((s) => [
      s.serial,
      s.technician,
      s.school,
      s.software_version,
      s.condition,
      s.latitude,
      s.longitude,
      s.lot_number,
      s.timestamp,
    ])

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `looma-qr-scans-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Exported ${selectedScans.length} scan${selectedScans.length > 1 ? "s" : ""} to CSV.`,
    })

    setSelectedIds(new Set())
  }

  const handleRemove = async () => {
    setIsDeleting(true)
    const selectedScans = rows.filter((r) => selectedIds.has(r.id))
    let successCount = 0
    let failCount = 0

    try {
      for (const scan of selectedScans) {
        try {
          await scansAPI.delete(scan.id)
          successCount++
        } catch (error) {
          console.error(`Failed to delete scan ${scan.id}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Scans removed",
          description: `Successfully removed ${successCount} scan${successCount > 1 ? "s" : ""}.`,
        })
        setSelectedIds(new Set())
        fetchScans()
      }

      if (failCount > 0) {
        toast({
          title: "Some deletions failed",
          description: `Failed to remove ${failCount} scan${failCount > 1 ? "s" : ""}.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove scans. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      {isAdmin && selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1a2c5b] to-[#2d4278] border border-[#3d5080] rounded-xl shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f5c842] flex items-center justify-center">
              <span className="text-[#1a2c5b] font-bold text-sm">{selectedIds.size}</span>
            </div>
            <span className="text-white font-semibold">selected</span>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
            onClick={handleExport}
          >
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-rose-500/20 border-rose-400/30 text-rose-100 hover:bg-rose-500/30 hover:text-white backdrop-blur-sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Remove
          </Button>
        </div>
      )}
      {viewMode === "map" ? (
        <NepalMap schools={[]} onSchoolSelect={() => {}} />
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>QR Scans</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th className="px-3 py-2 text-left w-12">
                      <Checkbox
                        checked={selectedIds.size === rows.length && rows.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className="border-gray-400 data-[state=checked]:bg-[#1a2c5b] data-[state=checked]:border-[#1a2c5b]"
                      />
                    </th>
                  )}
                  <th
  className="px-3 py-2 text-left cursor-pointer select-none"
  onClick={() => handleSort("serial")}
>
  <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
    Serial
    {sortField === "serial" ? (
      sortDirection === "asc" ? (
        <ChevronUp className="h-4 w-4 text-[#f5c842]" strokeWidth={3} />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#f5c842]" strokeWidth={3} />
      )
    ) : (
      <ChevronUp className="h-4 w-4 text-gray-300" strokeWidth={3} />
    )}
  </span>
</th>
<th className="px-3 py-2 text-left">Technician</th>
<th
  className="px-3 py-2 text-left cursor-pointer select-none"
  onClick={() => handleSort("school")}
>
  <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
    School
    {sortField === "school" ? (
      sortDirection === "asc" ? (
        <ChevronUp className="h-4 w-4 text-[#f5c842]" strokeWidth={3} />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#f5c842]" strokeWidth={3} />
      )
    ) : (
      <ChevronUp className="h-4 w-4 text-gray-300" strokeWidth={3} />
    )}
  </span>
</th>
                  <th className="px-3 py-2 text-left">Software Version</th>
                  <th className="px-3 py-2 text-left">Condition</th>
                  <th className="px-3 py-2 text-left">Latitude</th>
                  <th className="px-3 py-2 text-left">Longitude</th>
                  <th className="px-3 py-2 text-left">Lot #</th>
                  <th className="px-3 py-2 text-left">Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="px-4 py-6 text-center text-muted-foreground">
                      {loading ? "Loading scans..." : "No scans found"}
                    </td>
                  </tr>
                ) : (//new change
                  sortedRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => onScanSelect?.(r)}
                    >
                      {isAdmin && (
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                            aria-label={`Select scan ${r.serial}`}
                            className="border-gray-400 data-[state=checked]:bg-[#1a2c5b] data-[state=checked]:border-[#1a2c5b]"
                          />
                        </td>
                      )}
                      
                      <td className="px-3 py-2 font-mono">{r.serial}</td>
                      <td className="px-3 py-2">{r.technician}</td>
                      <td className="px-3 py-2">{r.school}</td>
                      <td className="px-3 py-2">{r.software_version}</td>
                      <td className="px-3 py-2">{r.condition}</td>
                      <td className="px-3 py-2 font-mono">{r.latitude}</td>
                      <td className="px-3 py-2 font-mono">{r.longitude}</td>
                      <td className="px-3 py-2">{r.lot_number}</td>
                      <td className="px-3 py-2">{r.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1a2c5b]"></div>
              <span className="font-medium">Showing {rows.length} scans</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} scan{selectedIds.size > 1 ? "s" : ""} from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}