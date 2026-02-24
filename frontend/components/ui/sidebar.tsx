"use client"

import { Home, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  active: "schools" | "scans"
  onChange: (v: "schools" | "scans") => void
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="h-screen w-16 bg-[#0f172a] text-white flex flex-col border-r border-white/10">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-white/10">
        <span className="text-xs font-semibold">L</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-3">
        <button
          onClick={() => onChange("schools")}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-md transition-colors",
            active === "schools"
              ? "bg-white/15 text-white"
              : "text-white/60 hover:bg-white/10"
          )}
          title="Schools"
        >
          <Home className="h-5 w-5" />
        </button>

        <button
          onClick={() => onChange("scans")}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-md transition-colors",
            active === "scans"
              ? "bg-white/15 text-white"
              : "text-white/60 hover:bg-white/10"
          )}
          title="QR Scans"
        >
          <QrCode className="h-5 w-5" />
        </button>
      </nav>

      {/* Bottom spacer (ensures clean bottom alignment) */}
      <div className="h-4" />
    </aside>
  )
}
