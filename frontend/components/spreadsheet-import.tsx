"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, FileText } from "lucide-react"
import type { School } from "@/lib/types"
import * as XLSX from "xlsx"

interface SpreadsheetImportProps {
  onImport: (schools: Partial<School>[]) => Promise<void>
  isOpen: boolean
  onClose: () => void
}

interface ParsedRow {
  name: string
  principalName: string
  principalNumber: string
  principalEmail: string
  latLong: string
  serialNumber: string
  loomaId: string
  version: string
  province: string
  district: string
  municipality: string
}

// Header mapping: spreadsheet column name → ParsedRow key
const HEADER_MAP: Record<string, keyof ParsedRow> = {
  "Name of the School": "name",
  "Principal_name": "principalName",
  "principal_number": "principalNumber",
  "Principal_Email": "principalEmail",
  "Lat long": "latLong",
  "Serial_Number": "serialNumber",
  "Looma_Id": "loomaId",
  "Version": "version",
  "Province": "province",
  "District": "district",
  "Municipality": "municipality",
}

const TEMPLATE_HEADERS = [
  "Name of the School",
  "Principal_name",
  "principal_number",
  "Principal_Email",
  "Lat long",
  "Serial_Number",
  "Looma_Id",
  "Version",
  "Province",
  "District",
  "Municipality",
]

const TEMPLATE_ROWS = [
  [
    "Shree Saraswati Secondary School",
    "Ram Bahadur Thapa",
    "+977-1-4567890",
    "saraswati.school@edu.np",
    "27.7172, 85.3240",
    "SN-001",
    "LMA-001",
    "2.1.0",
    "Bagmati",
    "Kathmandu",
    "Kathmandu Metropolitan",
  ],
  [
    "Himalaya Higher Secondary School",
    "Krishna Prasad Sharma",
    "+977-61-234567",
    "himalaya.hss@edu.np",
    "28.2096, 83.9856",
    "SN-002",
    "LMA-002",
    "2.1.0",
    "Gandaki",
    "Kaski",
    "Pokhara Metropolitan",
  ],
  [
    "Buddha Secondary School",
    "Gita Devi Paudel",
    "+977-71-345678",
    "buddha.school@edu.np",
    "27.5000, 83.4500",
    "SN-003",
    "LMA-003",
    "2.1.0",
    "Lumbini",
    "Rupandehi",
    "Siddharthanagar Municipality",
  ],
]

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function buildCSV(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map(row => row.map(csvCell).join(",")),
  ]
  return "\uFEFF" + lines.join("\r\n") // BOM for Excel UTF-8 recognition
}

function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === delimiter) { cells.push(current.trim()); current = "" }
      else current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

// ─── Excel helpers ────────────────────────────────────────────────────────────

function buildWorkbook(headers: string[], rows: string[][]): XLSX.WorkBook {
  const worksheetData = [headers, ...rows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Auto-fit column widths
  worksheet["!cols"] = headers.map((h, colIdx) => ({
    wch: Math.max(h.length, ...rows.map(r => (r[colIdx] || "").length)) + 4,
  }))

  // Bold + styled header row
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })]
    if (!cell) continue
    cell.s = {
      font: { bold: true, color: { rgb: "1E3A5F" } },
      fill: { patternType: "solid", fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        bottom: { style: "thin", color: { rgb: "93C5FD" } },
      },
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Schools")
  return workbook
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRawToRow(raw: Record<string, string>): ParsedRow {
  const row: ParsedRow = {
    name: "", principalName: "", principalNumber: "", principalEmail: "",
    latLong: "", serialNumber: "", loomaId: "", version: "",
    province: "", district: "", municipality: "",
  }
  for (const [header, key] of Object.entries(HEADER_MAP)) {
    row[key] = raw[header] ?? ""
  }
  return row
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpreadsheetImport({ onImport, isOpen, onClose }: SpreadsheetImportProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Parsers ───────────────────────────────────────────────────────────────

  const parseCSVText = (text: string): ParsedRow[] => {
    const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines = clean.trim().split("\n")
    if (lines.length < 2) throw new Error("File must have a header row and at least one data row")

    const firstLine = lines[0]
    const delimiter =
      (firstLine.match(/\t/g) || []).length >= (firstLine.match(/,/g) || []).length ? "\t" : ","
    const rawHeaders = parseLine(firstLine, delimiter)
    const rows: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const values = parseLine(line, delimiter)
      const raw: Record<string, string> = {}
      rawHeaders.forEach((h, idx) => { raw[h] = values[idx] ?? "" })
      rows.push(mapRawToRow(raw))
    }

    return rows.filter(r => r.name.trim() !== "")
  }

  const parseExcelBuffer = (buffer: ArrayBuffer): ParsedRow[] => {
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonRows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      defval: "",
    })
    return jsonRows
      .map(raw => mapRawToRow(raw as Record<string, string>))
      .filter(r => r.name.trim() !== "")
  }

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setParsedData([])
    setImportSuccess(false)

    try {
      let parsed: ParsedRow[]
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")

      if (isExcel) {
        const buffer = await file.arrayBuffer()
        parsed = parseExcelBuffer(buffer)
      } else {
        const text = await file.text()
        parsed = parseCSVText(text)
      }

      if (parsed.length === 0) {
        throw new Error("No valid school data found. Make sure the file follows the template format.")
      }
      setParsedData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Downloads ──────────────────────────────────────────────────────────────

  const downloadExcel = () => {
    const workbook = buildWorkbook(TEMPLATE_HEADERS, TEMPLATE_ROWS)
    XLSX.writeFile(workbook, "school_import_template.xlsx")
  }

  const downloadCSV = () => {
    const csv = buildCSV(TEMPLATE_HEADERS, TEMPLATE_ROWS)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "school_import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)

    try {
      const schools: Partial<School>[] = parsedData.map((row, idx) => {
        let latitude: number | undefined
        let longitude: number | undefined

        if (row.latLong) {
          const parts = row.latLong.split(",").map(p => p.trim())
          if (parts.length === 2) {
            latitude = parseFloat(parts[0])
            longitude = parseFloat(parts[1])
          }
        }

        const school: Partial<School> = {
          id: `import-${Date.now()}-${idx}`,
          name: row.name,
          district: row.district,
          province: row.province,
          palika: row.municipality,
          latitude,
          longitude,
          contact: {
            headmaster: row.principalName,
            email: row.principalEmail,
            phone: row.principalNumber,
          },
          loomaId: row.loomaId || undefined,
          lastSeen: new Date().toISOString(),
        }

        if (row.serialNumber || row.version) {
          school.looma = {
            id: row.loomaId || `looma-${Date.now()}-${idx}`,
            serialNumber: row.serialNumber || "N/A",
            version: row.version || "2.1.0",
            lastUpdate: new Date().toISOString(),
          }
        }

        return school
      })

      await onImport(schools)
      setImportSuccess(true)
      setTimeout(() => {
        onClose()
        setParsedData([])
        setImportSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Schools from Spreadsheet
          </DialogTitle>
          <DialogDescription>
            Upload a spreadsheet file with school data. Download the template to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Successfully imported {parsedData.length} schools!
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Upload Spreadsheet File</CardTitle>
              <CardDescription className="text-xs">
                Upload your school data file. Download the template to see the required columns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>

                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={downloadExcel} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template (Excel)
                  </Button>
                  <Button variant="secondary" onClick={downloadCSV} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template (CSV)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Preview ({parsedData.length} schools found)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">School Name</TableHead>
                        <TableHead className="text-xs font-bold">Principal</TableHead>
                        <TableHead className="text-xs font-bold">Province</TableHead>
                        <TableHead className="text-xs font-bold">District</TableHead>
                        <TableHead className="text-xs font-bold">Looma ID</TableHead>
                        <TableHead className="text-xs font-bold">Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{row.name}</TableCell>
                          <TableCell className="text-xs">{row.principalName}</TableCell>
                          <TableCell className="text-xs">{row.province}</TableCell>
                          <TableCell className="text-xs">{row.district}</TableCell>
                          <TableCell className="text-xs font-mono">{row.loomaId || "(auto)"}</TableCell>
                          <TableCell className="text-xs">{row.version || "2.1.0"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      … and {parsedData.length - 10} more schools
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? "Importing…" : `Import ${parsedData.length} Schools`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}