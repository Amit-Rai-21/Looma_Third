"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Shield, Upload, Loader2, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { schoolsAPI, usersAPI } from "@/lib/api-client"
import { SpreadsheetImport } from "./spreadsheet-import"
import { useAuth } from "@/lib/auth-context"
import type { School, User } from "@/lib/types"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
  onSchoolAdded?: () => void
}

function toOptionalNumber(value: string): number | undefined {
  const v = value.trim()
  if (!v) return undefined
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizeForCreate(input: Partial<School>): any | null {
  const name = (input.name ?? "").toString().trim()
  const province = (input.province ?? "").toString().trim()
  const district = (input.district ?? "").toString().trim()
  if (!name || !province || !district) return null

  const palika = (input.palika ?? "").toString().trim() || undefined
  const loomaId = (input.loomaId ?? "").toString().trim() || undefined

  const headmaster =
    (input.contact?.headmaster ?? (input as any).headmaster ?? "").toString().trim() || undefined
  const email = (input.contact?.email ?? (input as any).email ?? "").toString().trim() || undefined
  const phone = (input.contact?.phone ?? (input as any).phone ?? "").toString().trim() || undefined

  const latitude =
    typeof input.latitude === "number"
      ? input.latitude
      : toOptionalNumber(((input as any).latitude ?? "").toString())
  const longitude =
    typeof input.longitude === "number"
      ? input.longitude
      : toOptionalNumber(((input as any).longitude ?? "").toString())

  const serialNumber =
    (input as any).serialNumber ??
    input.looma?.serialNumber ??
    (input as any).loomaSerialNumber ??
    undefined

  const version = (input as any).version ?? input.looma?.version ?? (input as any).loomaVersion ?? undefined

  const payload: any = {
    name,
    province,
    district,
    palika,
    ...(loomaId ? { loomaId } : {}),
    latitude,
    longitude,
    contact: { headmaster, email, phone },
  }

  if (serialNumber || version) {
    payload.looma = {
      serialNumber: (serialNumber ?? "N/A").toString(),
      version: (version ?? "2.1.0").toString(),
    }
  }

  return payload
}

export function AdminPanel({ isOpen, onClose, onSchoolAdded }: AdminPanelProps) {
  const { user: currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // School form state
  const [loomaIdError, setLoomaIdError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [newSchool, setNewSchool] = useState({
    name: "",
    district: "",
    province: "",
    palika: "",
    headmaster: "",
    email: "",
    phone: "",
    loomaId: "",
    latitude: "",
    longitude: "",
    serialNumber: "",
    version: "",
  })

  // User management state
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Add user dialog — default role is "staff" (viewer removed)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff" as "admin" | "staff",
  })
  const [addUserError, setAddUserError] = useState<string | null>(null)
  
  // Edit user dialog — default role is "staff" (viewer removed)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUserData, setEditUserData] = useState({
    username: "",
    email: "",
    role: "staff" as "admin" | "staff",
  })
  const [editUserError, setEditUserError] = useState<string | null>(null)
  
  // Delete user dialog
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const provinces = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"]

  // Fetch users when Users tab is active
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const data = await usersAPI.getAll()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setAddUserError("Please fill in all required fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setAddUserError("Please enter a valid email address")
      return
    }

    if (newUser.password.length < 6) {
      setAddUserError("Password must be at least 6 characters long")
      return
    }

    setIsSubmitting(true)
    setAddUserError(null)
    
    try {
      const addedUser = await usersAPI.add({
        username: newUser.username.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        role: newUser.role,
      })

      setUsers(prev => [...prev, addedUser])
      setNewUser({ username: "", email: "", password: "", role: "staff" })
      setShowAddUserDialog(false)
      setIsSubmitting(false)
    } catch (error: any) {
      setIsSubmitting(false)
      const message = error?.message || "Failed to add user"
      if (message.includes("already exists") || message.includes("User exists")) {
        setAddUserError("Username already exists")
      } else if (message.includes("email") && message.includes("exists")) {
        setAddUserError("Email already exists")
      } else {
        setAddUserError(message)
      }
    }
  }

  const handleEditUser = async () => {
    if (!editingUser || !editUserData.username || !editUserData.email) {
      setEditUserError("Please fill in all required fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editUserData.email)) {
      setEditUserError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    setEditUserError(null)

    try {
      const updatedUser = await usersAPI.update(editingUser.id, {
        username: editUserData.username.trim(),
        email: editUserData.email.trim().toLowerCase(),
        role: editUserData.role,
      })

      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u))
      setShowEditUserDialog(false)
      setEditingUser(null)
      setIsSubmitting(false)
    } catch (error: any) {
      setIsSubmitting(false)
      const message = error?.message || "Failed to update user"
      if (message.includes("already exists") || message.includes("User exists")) {
        setEditUserError("Username already exists")
      } else if (message.includes("email") && message.includes("exists")) {
        setEditUserError("Email already exists")
      } else {
        setEditUserError(message)
      }
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    const userIdToDelete = deletingUser.id
    setShowDeleteUserDialog(false)
    setDeletingUser(null)
    
    try {
      await usersAPI.delete(userIdToDelete)
      setUsers(prev => prev.filter(u => u.id !== userIdToDelete))
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("Failed to delete user. Please try again.")
      fetchUsers()
    }
  }

  const openEditUserDialog = (user: User) => {
    setEditingUser(user)
    setEditUserData({
      username: user.username,
      email: user.email,
      // If existing user has viewer role, default to staff in edit dialog
      role: user.role === "viewer" ? "staff" : user.role as "admin" | "staff",
    })
    setEditUserError(null)
    setShowEditUserDialog(true)
  }

  const openDeleteUserDialog = (user: User) => {
    setDeletingUser(user)
    setShowDeleteUserDialog(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="w-fit">Admin</Badge>
      case "staff":
        return <Badge variant="secondary" className="w-fit">Staff</Badge>
      default:
        return <Badge variant="outline" className="w-fit">Viewer</Badge>
    }
  }

  const resetForm = () => {
    setNewSchool({
      name: "",
      district: "",
      province: "",
      palika: "",
      headmaster: "",
      email: "",
      phone: "",
      loomaId: "",
      latitude: "",
      longitude: "",
      serialNumber: "",
      version: "",
    })
    setLoomaIdError(null)
    setFormError(null)
  }

  const handleAddSchool = async () => {
    if (!newSchool.name || !newSchool.province || !newSchool.district) return

    try {
      setFormError(null)
      setLoomaIdError(null)
      setIsSubmitting(true)

      const loomaIdClean = newSchool.loomaId.trim()

      if (loomaIdClean) {
        const existing = await schoolsAPI.getAll()
        const exists = (existing.schools ?? []).some(
          (s: any) => (s.loomaId ?? "").toString().trim().toLowerCase() === loomaIdClean.toLowerCase()
        )
        if (exists) {
          setLoomaIdError("Looma ID must be unique")
          return
        }
      }

      const payload: any = {
        name: newSchool.name.trim(),
        province: newSchool.province.trim(),
        district: newSchool.district.trim(),
        palika: newSchool.palika.trim() || undefined,
        ...(loomaIdClean ? { loomaId: loomaIdClean } : {}),
        latitude: toOptionalNumber(newSchool.latitude),
        longitude: toOptionalNumber(newSchool.longitude),
        contact: {
          headmaster: newSchool.headmaster.trim() || undefined,
          email: newSchool.email.trim() || undefined,
          phone: newSchool.phone.trim() || undefined,
        },
        ...(newSchool.serialNumber.trim() || newSchool.version.trim()
          ? {
              looma: {
                serialNumber: newSchool.serialNumber.trim() || "N/A",
                version: newSchool.version.trim() || "2.1.0",
              },
            }
          : {}),
      }

      await schoolsAPI.create(payload)
      resetForm()
      onSchoolAdded?.()
      onClose()
    } catch (error: any) {
      const msg = String(error?.message ?? error)
      if (msg.includes("11000") || msg.toLowerCase().includes("duplicate")) {
        setLoomaIdError("Looma ID must be unique")
      } else {
        setFormError("Failed to add school. Please try again.")
      }
      console.error("Failed to add school:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImportSchools = async (rows: Partial<School>[]) => {
    setIsSubmitting(true)
    setFormError(null)
    setLoomaIdError(null)

    try {
      const existing = await schoolsAPI.getAll()
      const existingIds = new Set(
        (existing.schools ?? [])
          .map((s: any) => (s.loomaId ?? "").toString().trim().toLowerCase())
          .filter(Boolean)
      )

      for (const row of rows) {
        const payload = normalizeForCreate(row)
        if (!payload) {
          console.error("Skipping invalid row (missing name/province/district):", row)
          continue
        }

        const id = (payload.loomaId ?? "").toString().trim().toLowerCase()
        if (!id) {
          delete payload.loomaId
        } else {
          if (existingIds.has(id)) {
            console.error(`Skipping duplicate loomaId during import: ${payload.loomaId}`)
            continue
          }
          existingIds.add(id)
        }

        try {
          await schoolsAPI.create(payload)
        } catch (error: any) {
          const msg = String(error?.message ?? error)
          if (msg.includes("11000") || msg.toLowerCase().includes("duplicate")) {
            console.error(`Skipping duplicate loomaId during import (server): ${payload.loomaId}`, error)
            continue
          }
          console.error("Failed to import school:", payload?.name, error)
        }
      }

      onSchoolAdded?.()
      setShowImportDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </SheetTitle>
            <SheetDescription>Manage schools, users, and system settings</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="add-school" className="mt-6" onValueChange={(value) => {
            if (value === "users") fetchUsers()
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-school">Add School</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="add-school" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setShowImportDialog(true)}
                    disabled={isSubmitting}
                  >
                    <Upload className="h-4 w-4" />
                    Import from Spreadsheet
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    placeholder="e.g., Shree Kathmandu Secondary School"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select value={newSchool.province} onValueChange={(v) => setNewSchool({ ...newSchool, province: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      placeholder="District"
                      value={newSchool.district}
                      onChange={(e) => setNewSchool({ ...newSchool, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="palika">Local Body (Palika)</Label>
                  <Input
                    id="palika"
                    placeholder="e.g., Kathmandu Metropolitan"
                    value={newSchool.palika}
                    onChange={(e) => setNewSchool({ ...newSchool, palika: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loomaId">Looma Device ID (unique)</Label>
                  <Input
                    id="loomaId"
                    placeholder="e.g., LMA-001"
                    value={newSchool.loomaId}
                    onChange={(e) => {
                      setNewSchool({ ...newSchool, loomaId: e.target.value })
                      if (loomaIdError) setLoomaIdError(null)
                    }}
                    aria-invalid={!!loomaIdError}
                  />
                  {loomaIdError && <p className="text-xs text-red-600 mt-1">{loomaIdError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      placeholder="e.g., 27.7172"
                      value={newSchool.latitude}
                      onChange={(e) => setNewSchool({ ...newSchool, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      placeholder="e.g., 85.3240"
                      value={newSchool.longitude}
                      onChange={(e) => setNewSchool({ ...newSchool, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Device Serial (optional)</Label>
                    <Input
                      id="serialNumber"
                      placeholder="e.g., SN-XXXX"
                      value={newSchool.serialNumber}
                      onChange={(e) => setNewSchool({ ...newSchool, serialNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Looma Version (optional)</Label>
                    <Input
                      id="version"
                      placeholder="e.g., 2.1.0"
                      value={newSchool.version}
                      onChange={(e) => setNewSchool({ ...newSchool, version: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-3">Contact Information</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="headmaster">Headmaster Name</Label>
                      <Input
                        id="headmaster"
                        placeholder="Full name"
                        value={newSchool.headmaster}
                        onChange={(e) => setNewSchool({ ...newSchool, headmaster: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          value={newSchool.email}
                          onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="+977-XX-XXXXXX"
                          value={newSchool.phone}
                          onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}

                <Button className="w-full gap-2" onClick={handleAddSchool} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Adding...</>
                  ) : (
                    <><Plus className="h-4 w-4" />Add School</>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 mt-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage dashboard users and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{user.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {currentUser?.id !== user.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditUserDialog(user)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => openDeleteUserDialog(user)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={() => {
                        setNewUser({ username: "", email: "", password: "", role: "staff" })
                        setAddUserError(null)
                        setShowAddUserDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add User
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <SpreadsheetImport
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportSchools}
      />

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with specified role</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username *</Label>
              <Input
                id="new-username"
                placeholder="Enter username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Role *</Label>
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Viewer option removed — viewers access via "Continue as Viewer" on login page */}
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addUserError && <p className="text-sm text-destructive">{addUserError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding...</>
              ) : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                placeholder="Enter username"
                value={editUserData.username}
                onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={editUserData.role} onValueChange={(v: any) => setEditUserData({ ...editUserData, role: v })}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Viewer option removed — viewers access via "Continue as Viewer" on login page */}
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editUserError && <p className="text-sm text-destructive">{editUserError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</>
              ) : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      {showDeleteUserDialog && (
        <AlertDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteUserDialog(false)
              setDeletingUser(null)
            }
          }}
        >
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user <strong>{deletingUser?.username}</strong>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteUserDialog(false)
                  setDeletingUser(null)
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  await handleDeleteUser()
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}