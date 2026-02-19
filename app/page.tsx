"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "@/components/auth-page"
import { CitizenDashboard } from "@/components/citizen-dashboard"
import { AuthorityDashboard } from "@/components/authority-dashboard"

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <AuthPage />
  }

  if (user?.role === "authority") {
    return <AuthorityDashboard />
  }

  return <CitizenDashboard />
}
