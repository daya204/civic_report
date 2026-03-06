"use client"

import { formatDistanceToNow } from "date-fns"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import type { Complaint } from "@/lib/types"
import { categoryLabels, statusLabels, statusColors } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  ThumbsUp,
  MessageCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComplaintCardProps {
  complaint: Complaint
  onSelect: (id: string) => void
  compact?: boolean
}

export function ComplaintCard({ complaint, onSelect, compact }: ComplaintCardProps) {
  const { toggleLike } = useComplaints()
  const { user } = useAuth()

  const categoryIcon: Record<string, string> = {
    road: "Road",
    garbage: "Garbage",
    drainage: "Drainage",
    water_supply: "Water",
    electricity: "Electric",
    sanitation: "Sanitation",
    other: "Other",
  }

  return (
    <article
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md"
      onClick={() => onSelect(complaint.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(complaint.id)}
      aria-label={`Complaint: ${complaint.title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Top row: category + status */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {categoryIcon[complaint.category] || categoryLabels[complaint.category]}
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
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {complaint.title}
          </h3>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {complaint.description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{complaint.location}</span>
          </div>

          {/* Bottom row: stats */}
          <div className="flex items-center gap-4 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2 text-xs",
                complaint.likedByCurrentUser && "text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (user) toggleLike(complaint.id)
              }}
              aria-label={`${complaint.likes} likes`}
            >
              <ThumbsUp
                className={cn(
                  "h-3.5 w-3.5",
                  complaint.likedByCurrentUser && "fill-primary"
                )}
              />
              {complaint.likes}
            </Button>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{complaint.facingSameIssue} facing</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{complaint.comments.length}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
            </div>

            {complaint.likes >= 50 && (
              <div className="flex items-center gap-1 text-xs font-medium text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span>High Priority</span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
      </div>

      {/* Posted by */}
      <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {complaint.userName.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground">
          {complaint.userName}
        </span>
      </div>
    </article>
  )
}
