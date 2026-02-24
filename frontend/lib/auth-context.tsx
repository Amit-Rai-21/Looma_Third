"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { authAPI } from "./api-client"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  loginAsViewer: () => void
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      // If viewer session exists in sessionStorage, restore it
      const viewerSession = sessionStorage.getItem("viewer_session")
      if (viewerSession === "true") {
        setUser({ id: "viewer", username: "Viewer", email: "", role: "viewer" } as User)
        setIsLoading(false)
        return
      }
      try {
        const data = await authAPI.me()
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login(username, password)
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }

  const loginAsViewer = () => {
    // Clear any existing token so fetchAPI sends no Authorization header
    localStorage.removeItem("access_token")
    const viewerUser = { id: "viewer", username: "Viewer", email: "", role: "viewer" } as User
    sessionStorage.setItem("viewer_session", "true")
    setUser(viewerUser)
  }

  const logout = async () => {
    sessionStorage.removeItem("viewer_session")
    try {
      await authAPI.logout()
    } catch {
      // Ignore errors on logout
    }
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const data = await authAPI.me()
      setUser(data.user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsViewer, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}