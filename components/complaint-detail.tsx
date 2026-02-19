"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import type { ComplaintStatus } from "@/lib/types"
import { categoryLabels, statusLabels, statusColors } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  MapPin,
  ThumbsUp,
  Clock,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ComplaintMap } from "./complaint-map"

interface ComplaintDetailProps {
  complaintId: string
  onBack: () => void
  onVerified?: () => void
  onNotResolved?: () => void
}

export function ComplaintDetail({
  complaintId,
  onBack,
  onVerified,
  onNotResolved,
}: ComplaintDetailProps) {
  const { complaints, toggleLike, faceSameIssue, addComment, updateStatus, verifyComplaint } =
    useComplaints()
  const { user } = useAuth()
  const [commentText, setCommentText] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | null>(null)

  const complaint = complaints.find((c) => c.id === complaintId)

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status)
    }
  }, [complaint?.status])

  if (!complaint) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <article className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">This complaint could not be found.</p>
        </article>
      </main>
    )
  }

  const isAuthority = user?.role === "authority"
  const isComplaintOwner = user?.id === complaint.userId
  const canComment = isAuthority || isComplaintOwner

  const handleAddComment = () => {
    if (!commentText.trim() || !user) return
    addComment(complaint.id, {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      content: commentText.trim(),
    })
    setCommentText("")
  }

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== complaint.status) {
      updateStatus(complaint.id, selectedStatus as ComplaintStatus)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <article className="rounded-xl border border-border bg-card p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {categoryLabels[complaint.category]}
          </Badge>
          <Badge
            className={cn(
              "text-xs font-medium border-0",
              statusColors[complaint.status]
            )}
          >
            {statusLabels[complaint.status]}
          </Badge>
          {complaint.status === "verified" && (
            <Badge className="bg-success/20 text-success border-0 text-xs">
              Verified
            </Badge>
          )}
          {complaint.likes >= 50 && (
            <Badge className="bg-warning/20 text-warning-foreground border-0 text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              High Priority
            </Badge>
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground mb-3 text-balance">
          {complaint.title}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {complaint.description}
        </p>

        {/* Images */}
        {complaint.images?.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {complaint.images.map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border border-border bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Complaint image ${idx + 1}`} className="h-56 w-full object-cover" />
                </a>
              ))}
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{complaint.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              Posted {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Map */}
        <ComplaintMap complaint={complaint} />

        {/* Posted by */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {complaint.userName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{complaint.userName}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(complaint.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Button
            variant={complaint.likedByCurrentUser ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => toggleLike(complaint.id)}
          >
            <ThumbsUp
              className={cn(
                "h-4 w-4",
                complaint.likedByCurrentUser && "fill-current"
              )}
            />
            Hype ({complaint.likes})
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => faceSameIssue(complaint.id)}
          >
            <Users className="h-4 w-4" />
            Facing Same Issue ({complaint.facingSameIssue})
          </Button>
        </div>

        {/* Authority status update */}
        {isAuthority && complaint.status !== "verified" && (
          <>
            <Separator className="my-4" />
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Update Status
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Select
                    value={selectedStatus ?? complaint.status}
                    onValueChange={(v) => setSelectedStatus(v as ComplaintStatus)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unsolved">Unsolved</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="on_the_way">On the Way</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="solved">Solved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || selectedStatus === complaint.status}
                >
                  Update
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Verification (for complaint owner when status is solved) */}
        {isComplaintOwner && complaint.status === "solved" && (
          <>
            <Separator className="my-4" />
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                This issue has been marked as solved
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Please verify if the issue has actually been resolved at your location.
              </p>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => {
                    verifyComplaint(complaint.id, true)
                    onVerified?.()
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes, Verified
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    verifyComplaint(complaint.id, false)
                    onNotResolved?.()
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Not Resolved
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Proof image (if solved) */}
        {complaint.proofImage && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Resolution Proof
              </h3>
              <a
                href={complaint.proofImage}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-border bg-muted/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={complaint.proofImage}
                  alt="Resolution proof"
                  className="h-56 w-full object-cover"
                />
              </a>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Comments ({complaint.comments.length})
          </h3>

          {complaint.comments.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No comments yet
            </p>
          )}

          <div className="space-y-4">
            {complaint.comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "rounded-lg border p-3",
                  comment.userRole === "authority"
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      comment.userRole === "authority"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {comment.userName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {comment.userName}
                  </span>
                  {comment.userRole === "authority" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Authority
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>

          {/* Add comment (only for authority, NGO, or post owner) */}
          {canComment && (
            <div className="mt-4 flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                size="sm"
                className="self-end"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!canComment && (
            <p className="mt-4 text-xs text-muted-foreground text-center rounded-lg border border-border bg-muted/30 p-3">
              Only the complaint author and authorities can comment on this post
            </p>
          )}
        </div>
      </article>
    </main>
  )
}
