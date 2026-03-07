import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Complaint } from "@/models/Complaint"
import jwt from "jsonwebtoken"

export const runtime = "nodejs"

function getToken(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return null
  const token = auth.slice("Bearer ".length)
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as {
      sub: string
      username: string
      role: string
    }
  } catch {
    return null
  }
}

/** Normalize Mongoose document for JSON response (id from _id, ensure comments array). */
function toResponseComplaint(doc: { _id?: unknown; id?: string; comments?: unknown[]; [k: string]: unknown }) {
  const raw = doc && typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === "function"
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : { ...doc }
  const id = (raw._id != null && typeof (raw._id as { toString: () => string }).toString === "function")
    ? (raw._id as { toString: () => string }).toString()
    : (raw.id as string) ?? String(raw._id)
  const comments = Array.isArray(raw.comments)
    ? raw.comments.map((c: Record<string, unknown>, i: number) => ({
        id: c.id ?? `cm-${i}-${Date.now()}`,
        userId: c.userId,
        userName: c.userName,
        userRole: c.userRole,
        content: c.content,
        createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString(),
      }))
    : []
  return { ...raw, id, comments }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getToken(request)
    const { id } = await params

    const body = await request.json()
    const { action } = body as { action: string }

    await connectToDatabase()

    let updated

    switch (action) {
      case "toggleLike": {
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const existing = await Complaint.findById(id)
        if (!existing) {
          return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
        }

        const alreadyLiked = (existing.likedBy ?? []).includes(user.sub)

        if (alreadyLiked) {
          // Unlike: decrement likes and remove user from likedBy
          updated = await Complaint.findByIdAndUpdate(
            id,
            {
              $inc: { likes: -1 },
              $pull: { likedBy: user.sub },
            },
            { new: true }
          )
        } else {
          // Like: increment likes and add user to likedBy
          updated = await Complaint.findByIdAndUpdate(
            id,
            {
              $inc: { likes: 1 },
              $addToSet: { likedBy: user.sub },
            },
            { new: true }
          )
        }
        break
      }
      case "faceSameIssue": {
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const existingFsi = await Complaint.findById(id).lean()
        if (!existingFsi) {
          return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
        }
        const fsiBy: string[] = Array.isArray((existingFsi as { facingSameIssueBy?: string[] }).facingSameIssueBy)
          ? (existingFsi as { facingSameIssueBy: string[] }).facingSameIssueBy
          : []
        const alreadyFacing = fsiBy.includes(user.sub)
        if (alreadyFacing) {
          updated = await Complaint.findByIdAndUpdate(
            id,
            { $inc: { facingSameIssue: -1 }, $pull: { facingSameIssueBy: user.sub } },
            { new: true }
          )
        } else {
          updated = await Complaint.findByIdAndUpdate(
            id,
            { $inc: { facingSameIssue: 1 }, $addToSet: { facingSameIssueBy: user.sub } },
            { new: true }
          )
        }
        break
      }
      case "addComment": {
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const { content, userRole } = body as {
          content: string
          userRole: string
        }
        const newComment = {
          id: "cm" + Date.now(),
          userId: user.sub,
          userName: user.username,
          userRole,
          content,
          createdAt: new Date().toISOString(),
        }
        updated = await Complaint.findByIdAndUpdate(
          id,
          {
            $push: { comments: newComment },
          },
          { new: true }
        )
        break
      }
      case "updateStatus": {
        if (!user || user.role !== "authority") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { status, proofImage } = body as {
          status: string
          proofImage?: string
        }
        updated = await Complaint.findByIdAndUpdate(
          id,
          {
            status,
            proofImage,
            updatedAt: new Date().toISOString(),
            resolvedAt: status === "solved" ? new Date().toISOString() : undefined,
          },
          { new: true }
        )
        break
      }
      case "verifyComplaint": {
        if (!user || user.role !== "citizen") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { verified } = body as { verified: boolean }
        updated = await Complaint.findByIdAndUpdate(
          id,
          {
            status: verified ? "verified" : "unsolved",
            verifiedAt: verified ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          },
          { new: true }
        )
        break
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    if (!updated) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    const complaint = toResponseComplaint(updated as Record<string, unknown>)
    const likedByCurrentUser =
      user && Array.isArray((complaint as Record<string, unknown>).likedBy)
        ? ((complaint as Record<string, unknown>).likedBy as string[]).includes(user.sub)
        : false
    const facingSameIssueBy = (complaint as Record<string, unknown>).facingSameIssueBy as string[] | undefined
    const facingSameIssueByCurrentUser =
      user && Array.isArray(facingSameIssueBy) && facingSameIssueBy.includes(user.sub)
    const complaintData = { ...complaint, likedByCurrentUser, facingSameIssueByCurrentUser }
    return NextResponse.json({ complaint: complaintData }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

