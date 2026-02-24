"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/lib/types"
import { Mail, Shield, User as UserIcon, Edit, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { usersAPI } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function UserProfileModal({
  user,
  open,
  onOpenChange,
}: {
  user: User | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Profile edit state
  const [editData, setEditData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!user) return null

  const initials = (user.username || "U").slice(0, 1).toUpperCase()

  const handleSaveProfile = async () => {
    if (!editData.username || !editData.email) {
      setError("Please fill in all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editData.email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      await usersAPI.updateMe({
        username: editData.username.trim(),
        email: editData.email.trim().toLowerCase(),
      })

      setSuccessMessage("Profile updated successfully!")
      setIsEditing(false)
      
      // Refresh user data in auth context
      await refreshUser()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      const message = err?.message || "Failed to update profile"
      if (message.includes("already exists") || message.includes("User exists")) {
        setError("Username already exists")
      } else if (message.includes("email") && message.includes("exists")) {
        setError("Email already exists")
      } else {
        setError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError("Please fill in all password fields")
      return
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match")
      return
    }

    try {
      setIsSubmitting(true)
      setPasswordError(null)
      setPasswordSuccess(null)

      await usersAPI.updatePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })

      setPasswordSuccess("Password changed successfully!")
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" })
      
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (err: any) {
      const message = err?.message || "Failed to change password"
      if (message.includes("incorrect") || message.includes("wrong")) {
        setPasswordError("Current password is incorrect")
      } else {
        setPasswordError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      username: user.username,
      email: user.email,
    })
    setError(null)
    setSuccessMessage(null)
  }

  const resetPasswordForm = () => {
    setPasswordData({ old_password: "", new_password: "", confirm_password: "" })
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Manage your account details and security</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[#f5c842] text-[#1a2c5b] flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{user.username}</h3>
              <Badge className="bg-[#1a2c5b] text-white hover:bg-[#1a2c5b]">
                {user.role?.toUpperCase?.() ?? "USER"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="mt-4" onValueChange={resetPasswordForm}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {!isEditing ? (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-gray-600">Username</span>
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-gray-600">Role</span>
                        <span className="text-sm font-medium text-gray-900">{user.role}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {successMessage && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}

                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={user.role} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Role cannot be changed</p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="old-password"
                    type={showOldPassword ? "text" : "password"}
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">{passwordSuccess}</p>
                </div>
              )}

              <Button 
                onClick={handleChangePassword} 
                disabled={isSubmitting}
                className="w-full gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}