"use client"

import * as React from "react"

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/lib/api/auth"
import type { LoginPayload, RegisterPayload, User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoadingUser: boolean
  error: string | null
  refreshUser: () => Promise<void>
  login: (payload: LoginPayload) => Promise<User | null>
  register: (payload: RegisterPayload) => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refreshUser = React.useCallback(async () => {
    setIsLoadingUser(true)
    setError(null)

    try {
      setUser(await getCurrentUser())
    } catch {
      setError("Unable to connect to the authentication service.")
      setUser(null)
    } finally {
      setIsLoadingUser(false)
    }
  }, [])

  React.useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = React.useCallback(async (payload: LoginPayload) => {
    const nextUser = await loginRequest(payload)
    setUser(nextUser)
    return nextUser
  }, [])

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const nextUser = await registerRequest(payload)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = React.useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingUser,
      error,
      refreshUser,
      login,
      register,
      logout,
    }),
    [error, isLoadingUser, login, logout, refreshUser, register, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
