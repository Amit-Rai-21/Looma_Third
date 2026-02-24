"use client"

import { useState } from "react"
import type { School } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { schoolsAPI } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileDown,
  Loader2,
  Trash2,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SchoolListProps {
  schools: School[]
  onSchoolSelect: (school: School) => void
  onSchoolsChanged?: () => void
}

type SortField = "name" | "district" | "province"
type SortDirection = "asc" | "desc"

export function SchoolList({ schools, onSchoolSelect, onSchoolsChanged }: SchoolListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === "admin"
  const isViewer = user?.role === "viewer"

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedSchools = [...schools].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "district":
        comparison = (a.district || "").localeCompare(b.district || "")
        break
      case "province":
        comparison = (a.province || "").localeCompare(b.province || "")
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === schools.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(schools.map((s) => s.id)))
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
    const selectedSchools = schools.filter((s) => selectedIds.has(s.id))
    
    if (selectedSchools.length === 0) {
      toast({
        title: "No schools selected",
        description: "Please select at least one school to export.",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "ID",
      "Name",
      "Looma ID",
      "District",
      "Province",
      "Palika",
      "Headmaster",
      "Email",
      "Phone",
      "Latitude",
      "Longitude",
      "Serial Number",
      "Version",
    ]

    const rows = selectedSchools.map((s) => [
      s.id,
      s.name,
      s.loomaId || "",
      s.district || "",
      s.province || "",
      s.palika || "",
      s.contact?.headmaster || "",
      s.contact?.email || "",
      s.contact?.phone || "",
      s.latitude || "",
      s.longitude || "",
      s.looma?.serialNumber || "",
      s.looma?.version || "",
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `looma-schools-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Exported ${selectedSchools.length} school${selectedSchools.length > 1 ? "s" : ""} to CSV.`,
    })

    setSelectedIds(new Set())
  }

  const handleRemove = async () => {
    setIsDeleting(true)
    const selectedSchools = schools.filter((s) => selectedIds.has(s.id))
    let successCount = 0
    let failCount = 0

    try {
      for (const school of selectedSchools) {
        try {
          await schoolsAPI.delete(school.id)
          successCount++
        } catch (error) {
          console.error(`Failed to delete school ${school.id}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Schools removed",
          description: `Successfully removed ${successCount} school${successCount > 1 ? "s" : ""}.`,
        })
        setSelectedIds(new Set())
        onSchoolsChanged?.()
      }

      if (failCount > 0) {
        toast({
          title: "Some deletions failed",
          description: `Failed to remove ${failCount} school${failCount > 1 ? "s" : ""}.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove schools. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40" />
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-3.5 w-3.5 text-[#f5c842]" />
    ) : (
      <ChevronDown className="ml-2 h-3.5 w-3.5 text-[#f5c842]" />
    )
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Download className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No schools found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
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

      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-50 hover:to-gray-100 border-b-2 border-gray-200">
              {isAdmin && (
                <TableHead className="w-12 pl-6">
                  <Checkbox
                    checked={selectedIds.size === schools.length && schools.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className="border-gray-400 data-[state=checked]:bg-[#1a2c5b] data-[state=checked]:border-[#1a2c5b]"
                  />
                </TableHead>
              )}
              <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center font-semibold text-gray-700 hover:text-[#1a2c5b] transition-colors"
                >
                  School Name
                  <SortIcon field="name" />
                </button>
              </TableHead>
              {/* Looma ID column — hidden for viewer */}
              {!isViewer && (
                <TableHead className="font-semibold text-gray-700">Looma ID</TableHead>
              )}
              <TableHead>
                <button
                  onClick={() => handleSort("district")}
                  className="flex items-center font-semibold text-gray-700 hover:text-[#1a2c5b] transition-colors"
                >
                  District
                  <SortIcon field="district" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("province")}
                  className="flex items-center font-semibold text-gray-700 hover:text-[#1a2c5b] transition-colors"
                >
                  Province
                  <SortIcon field="province" />
                </button>
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Headmaster</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedSchools.map((school, index) => (
              <TableRow
                key={school.id}
                className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-gray-100 group"
                onClick={() => onSchoolSelect(school)}
              >
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()} className="pl-6">
                    <Checkbox
                      checked={selectedIds.has(school.id)}
                      onCheckedChange={() => toggleSelect(school.id)}
                      aria-label={`Select ${school.name}`}
                      className="border-gray-400 data-[state=checked]:bg-[#1a2c5b] data-[state=checked]:border-[#1a2c5b]"
                    />
                  </TableCell>
                )}
                <TableCell className="text-center text-gray-500 font-mono text-sm font-medium">{index + 1}</TableCell>
                <TableCell className="font-semibold text-gray-900 max-w-[300px] truncate group-hover:text-[#1a2c5b] transition-colors">
                  {school.name}
                </TableCell>
                {/* Looma ID cell — hidden for viewer */}
                {!isViewer && (
                  <TableCell className="font-mono text-sm text-[#0891b2] font-medium">{school.loomaId}</TableCell>
                )}
                <TableCell className="text-gray-700">{school.district}</TableCell>
                <TableCell className="text-gray-700">{school.province}</TableCell>
                <TableCell className="max-w-[180px] truncate text-gray-600">{school.contact?.headmaster || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1a2c5b]"></div>
          <span className="font-medium">Showing {schools.length} schools</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} school{selectedIds.size > 1 ? "s" : ""} from the database.
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