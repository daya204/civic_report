"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useComplaints } from "@/lib/complaints-context"
import { ComplaintCard } from "./complaint-card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Mail, Phone, Home } from "lucide-react"

export function ProfileView() {
  const { user } = useAuth()
  const { complaints } = useComplaints()

  const userComplaints = useMemo(
    () => complaints.filter((c) => c.userId === user?.id),
    [complaints, user]
  )

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{user.region}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{userComplaints.length}</p>
          <p className="text-xs text-muted-foreground">Total Posts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-success">
            {userComplaints.filter((c) => ["solved", "verified"].includes(c.status)).length}
          </p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">
            {userComplaints.filter((c) => c.status === "unsolved").length}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* User's complaints */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {user.role === "citizen" ? "Your Complaints" : "Managed Cases"}
        </h3>
        {userComplaints.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {user.role === "citizen"
                ? "You haven't posted any complaints yet"
                : "No cases in your history"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userComplaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onSelect={() => {}}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
