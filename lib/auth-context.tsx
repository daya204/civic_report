"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  signIn: (username: string, password: string) => Promise<boolean>
  signUp: (data: SignUpData) => Promise<boolean>
  signOut: () => void
}

interface SignUpData {
  name: string
  username: string
  password: string
  email: string
  phone?: string
  address: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedToken = window.localStorage.getItem("auth_token")
      const storedUser = window.localStorage.getItem("auth_user")
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch {
      // ignore
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: username, password }),
      })

      if (!res.ok) return false

      const data = await res.json()
      setUser(data.user)
      setToken(data.token)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", data.token)
        window.localStorage.setItem("auth_user", JSON.stringify(data.user))
      }
      return true
    } catch {
      return false
    }
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) return false

      const resData = await res.json()
      setUser(resData.user)
      setToken(resData.token)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", resData.token)
        window.localStorage.setItem("auth_user", JSON.stringify(resData.user))
      }
      return true
    } catch {
      return false
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token")
      window.localStorage.removeItem("auth_user")
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, token, signIn, signUp, signOut }}
    >
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
