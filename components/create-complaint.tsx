"use client"

import { useState, useMemo } from "react"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import type { ComplaintCategory } from "@/lib/types"
import { categoryLabels } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplaintCard } from "./complaint-card"
import { ArrowLeft, Image as ImageIcon, MapPin, Send, X } from "lucide-react"

interface CreateComplaintProps {
  onBack: () => void
}

export function CreateComplaint({ onBack }: CreateComplaintProps) {
  const { addComplaint, complaints } = useComplaints()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ComplaintCategory | "">("")
  const [location, setLocation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024 // 3MB
  const MAX_IMAGES = 3

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

  const uploadToCloudinary = async (file: File) => {
    const image = await fileToDataUrl(file)
    const res = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.url as string
  }

  // Similar complaints nearby
  const similarComplaints = useMemo(() => {
    if (!title && !category) return []
    return complaints
      .filter((c) => {
        const matchesCategory = category && c.category === category
        const matchesTitle =
          title.length > 3 &&
          c.title.toLowerCase().includes(title.toLowerCase().slice(0, 10))
        return (matchesCategory || matchesTitle) && c.status !== "verified"
      })
      .slice(0, 3)
  }, [title, category, complaints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !category || !location || !user) return
    if (images.length === 0) {
      setUploadError("At least one image is required.")
      return
    }

    setIsUploading(true)
    setUploadError("")

    try {
      const uploadedUrls = await Promise.all(images.map(uploadToCloudinary))

      await addComplaint({
      title,
      description,
      category: category as ComplaintCategory,
      status: "unsolved",
      location,
      region: user.region,
      latitude: 28.6139 + Math.random() * 0.01,
      longitude: 77.209 + Math.random() * 0.01,
      images: uploadedUrls,
      userId: user.id,
      userName: user.name,
      })

      setSubmitted(true)
    } catch {
      setUploadError("Failed to upload image(s). Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <MapPin className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Complaint Registered Successfully
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Your complaint has been submitted and mapped to your local municipality. You will receive updates as it progresses.
          </p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Report an Issue</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Describe the civic issue and we will route it to the right authority
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="complaint-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="complaint-title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ComplaintCategory)}
            >
              <SelectTrigger id="complaint-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="complaint-description"
              placeholder="Detailed description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-location">
              Location <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="complaint-location"
                placeholder="Enter the location of the issue"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-images">
              Images <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="complaint-images"
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => {
                  setUploadError("")
                  const files = Array.from(e.target.files || [])
                  const remaining = MAX_IMAGES - images.length
                  const next = files.slice(0, Math.max(0, remaining)).filter((f) => {
                    if (f.size > MAX_IMAGE_SIZE_BYTES) {
                      setUploadError("Each image must be 3MB or less.")
                      return false
                    }
                    return true
                  })
                  setImages((prev) => [...prev, ...next])
                  e.currentTarget.value = ""
                }}
              />
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Up to {MAX_IMAGES} images, max 3MB each
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.size}-${idx}`}
                    className="relative overflow-hidden rounded-lg border border-border bg-muted/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-24 w-full object-cover"
                      onLoad={(e) => {
                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground hover:bg-background"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove image"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>

          {/* Similar complaints */}
          {similarComplaints.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Similar complaints found nearby
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {"You can support an existing complaint instead of creating a new one using the \"Facing Same Issue\" button."}
              </p>
              <div className="space-y-3">
                {similarComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={() => {}}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={
              !title || !description || !category || !location || images.length === 0 || isUploading
            }
          >
            <Send className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Submit Complaint"}
          </Button>
        </form>
      </div>
    </main>
  )
}
