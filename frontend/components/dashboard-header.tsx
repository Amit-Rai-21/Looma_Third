"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, LogOut, User, List, Map } from "lucide-react"
import Image from "next/image"
import { UserProfileModal } from "@/components/user-profile-modal"

interface DashboardHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: "list" | "map"
  onViewModeChange: (mode: "list" | "map") => void
}

export function DashboardHeader({ searchQuery, onSearchChange, viewMode, onViewModeChange }: DashboardHeaderProps) {
  const { user, logout } = useAuth()

  const [profileOpen, setProfileOpen] = useState(false)

  const isViewer = user?.role === "viewer"

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#1a2c5b] border-b border-[#2d4278] shadow-lg">
        <div className="container flex h-20 items-center justify-between px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-40 relative -translate-y-6">
              <Image src="/Looma-2019.svg" alt="Looma Education" width={160} height={48} className="object-contain" priority />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8b9dc3] group-focus-within:text-[#f5c842] transition-colors" />
              <Input
                type="search"
                placeholder="Search schools, districts, provinces..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 h-12 bg-[#0f1d3d] border-[#2d4278] text-white placeholder:text-[#6b7a99] rounded-xl focus:bg-[#152847] focus:ring-2 focus:ring-[#f5c842] focus:border-[#f5c842] transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-[#0f1d3d] rounded-xl p-1.5 border border-[#2d4278]">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={`h-9 px-5 gap-2 transition-all rounded-lg ${
                  viewMode === "list"
                    ? "bg-[#f5c842] text-[#1a2c5b] hover:bg-[#f5c842] font-semibold shadow-md"
                    : "hover:bg-[#2d4278] text-[#8b9dc3] hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("map")}
                className={`h-9 px-5 gap-2 transition-all rounded-lg ${
                  viewMode === "map"
                    ? "bg-[#f5c842] text-[#1a2c5b] hover:bg-[#f5c842] font-semibold shadow-md"
                    : "hover:bg-[#2d4278] text-[#8b9dc3] hover:text-white"
                }`}
              >
                <Map className="h-4 w-4" />
                <span>Map</span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-xl p-0 hover:ring-2 hover:ring-[#f5c842] transition-all">
                  <Avatar className="h-11 w-11 border-2 border-[#f5c842]">
                    <AvatarFallback className="bg-gradient-to-br from-[#f5c842] to-[#e8b626] text-[#1a2c5b] text-base font-bold">
                      {isViewer ? "V" : user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72 p-3 bg-white border-[#e2e8f0]">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-[#f5c842]">
                        <AvatarFallback className="bg-gradient-to-br from-[#f5c842] to-[#e8b626] text-[#1a2c5b] text-lg font-bold">
                          {isViewer ? "V" : user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-base font-semibold text-gray-900">
                          {isViewer ? "Viewer" : user?.username}
                        </p>
                        {!isViewer && (
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#1a2c5b] to-[#2d4278] px-3 py-1.5 text-xs font-semibold text-white w-fit capitalize shadow-sm">
                      {isViewer ? "Viewer" : user?.role}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2" />

                {/* Profile option — hidden for viewer */}
                {!isViewer && (
                  <>
                    <DropdownMenuItem
                      className="p-3 cursor-pointer rounded-lg hover:bg-gray-50"
                      onSelect={(e) => {
                        e.preventDefault()
                        setProfileOpen(true)
                      }}
                    >
                      <User className="mr-3 h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-2" />
                  </>
                )}

                <DropdownMenuItem
                  onClick={logout}
                  className="p-3 cursor-pointer rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Profile modal — only for non-viewer */}
      {!isViewer && (
        <UserProfileModal user={user ?? null} open={profileOpen} onOpenChange={setProfileOpen} />
      )}
    </>
  )
}