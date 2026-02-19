"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Complaint, ComplaintStatus, Comment } from "./types"
import { mockComplaints } from "./mock-data"

interface ComplaintsContextType {
  complaints: Complaint[]
  addComplaint: (
    complaint: Omit<
      Complaint,
      "id" | "likes" | "likedByCurrentUser" | "facingSameIssue" | "comments" | "createdAt" | "updatedAt"
    >
  ) => Promise<void>
  updateStatus: (complaintId: string, status: ComplaintStatus, proofImage?: string) => void
  toggleLike: (complaintId: string) => void
  faceSameIssue: (complaintId: string) => void
  addComment: (complaintId: string, comment: Omit<Comment, "id" | "createdAt">) => void
  verifyComplaint: (complaintId: string, verified: boolean) => void
}

const ComplaintsContext = createContext<ComplaintsContextType | undefined>(undefined)

export function ComplaintsProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>([])

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const res = await fetch("/api/complaints")
        if (!res.ok) {
          setComplaints(mockComplaints)
          return
        }
        const data = await res.json()
        setComplaints(
          data.complaints.map((c: any) => ({
            ...c,
            id: c._id ?? c.id,
          }))
        )
      } catch {
        setComplaints(mockComplaints)
      }
    }
    void loadComplaints()
  }, [])

  const addComplaint = useCallback(
    async (
      data: Omit<
        Complaint,
        "id" | "likes" | "likedByCurrentUser" | "facingSameIssue" | "comments" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null

        const res = await fetch("/api/complaints", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        })

        if (!res.ok) return

        const { complaint } = await res.json()
        const newComplaint: Complaint = {
          ...complaint,
          id: complaint._id ?? complaint.id ?? "c" + Date.now(),
          likes: complaint.likes ?? 0,
          likedByCurrentUser: false,
          facingSameIssue: complaint.facingSameIssue ?? 0,
          comments: complaint.comments ?? [],
          createdAt: complaint.createdAt ?? new Date().toISOString(),
          updatedAt: complaint.updatedAt ?? new Date().toISOString(),
        }

        setComplaints((prev) => [newComplaint, ...prev])
      } catch {
        // On failure, keep current state
      }
    },
    []
  )

  const updateStatus = useCallback(
    async (complaintId: string, status: ComplaintStatus, proofImage?: string) => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null
        const res = await fetch(`/api/complaints/${complaintId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: "updateStatus", status, proofImage }),
        })
        if (res.ok) {
          const { complaint } = await res.json()
          setComplaints((prev) =>
            prev.map((c) =>
              c.id === complaintId
                ? {
                    ...c,
                    ...complaint,
                    id: complaint._id ?? complaint.id,
                  }
                : c
            )
          )
        } else {
          // Optimistic local update if server fails
          setComplaints((prev) =>
            prev.map((c) =>
              c.id === complaintId
                ? {
                    ...c,
                    status,
                    proofImage: proofImage ?? c.proofImage,
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          )
        }
      } catch {
        // Optimistic local update on network error
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  status,
                  proofImage: proofImage ?? c.proofImage,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        )
      }
    },
    []
  )

  const toggleLike = useCallback(async (complaintId: string) => {
    try {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null

      // Optimistic UI update
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id !== complaintId) return c
          const delta = c.likedByCurrentUser ? -1 : 1
          return {
            ...c,
            likes: Math.max(0, c.likes + delta),
            likedByCurrentUser: !c.likedByCurrentUser,
          }
        })
      )

      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "toggleLike" }),
      })
      if (!res.ok) return

      const { complaint } = await res.json()
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id !== complaintId) return c
          // Preserve local likedByCurrentUser flag; trust server for counts and other fields
          return {
            ...c,
            ...complaint,
            id: complaint._id ?? complaint.id,
            likedByCurrentUser: c.likedByCurrentUser,
          }
        })
      )
    } catch {
      // ignore; optimistic update already applied
    }
  }, [])

  const faceSameIssue = useCallback(async (complaintId: string) => {
    try {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null

      // Optimistic UI update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                facingSameIssue: c.facingSameIssue + 1,
              }
            : c
        )
      )

      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "faceSameIssue" }),
      })
      if (!res.ok) return
      const { complaint } = await res.json()
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                ...complaint,
                id: complaint._id ?? complaint.id,
              }
            : c
        )
      )
    } catch {
      // ignore; optimistic update already applied
    }
  }, [])

  const addComment = useCallback(
    async (complaintId: string, comment: Omit<Comment, "id" | "createdAt">) => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null
        const res = await fetch(`/api/complaints/${complaintId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: "addComment",
            content: comment.content,
            userRole: comment.userRole,
          }),
        })
        if (!res.ok) return
        const { complaint } = await res.json()
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, ...complaint, id: complaint._id ?? complaint.id } : c))
        )
      } catch {
        // ignore
      }
    },
    []
  )

  const verifyComplaint = useCallback(
    async (complaintId: string, verified: boolean) => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null

        // Optimistic update so the complaint immediately moves between solved/unsolved lists
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  status: verified ? "verified" : "unsolved",
                  verifiedAt: verified ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        )

        const res = await fetch(`/api/complaints/${complaintId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: "verifyComplaint", verified }),
        })
        if (!res.ok) return
        const { complaint } = await res.json()
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  ...complaint,
                  id: complaint._id ?? complaint.id,
                }
              : c
          )
        )
      } catch {
        // ignore; optimistic update already applied
      }
    },
    []
  )

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        addComplaint,
        updateStatus,
        toggleLike,
        faceSameIssue,
        addComment,
        verifyComplaint,
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  )
}

export function useComplaints() {
  const context = useContext(ComplaintsContext)
  if (context === undefined) {
    throw new Error("useComplaints must be used within a ComplaintsProvider")
  }
  return context
}
