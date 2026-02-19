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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getToken(request)
    const { id } = params

    const body = await request.json()
    const { action } = body as { action: string }

    await connectToDatabase()

    let updated

    switch (action) {
      case "toggleLike": {
        updated = await Complaint.findByIdAndUpdate(
          id,
          {
            $inc: { likes: 1 },
          },
          { new: true }
        )
        break
      }
      case "faceSameIssue": {
        updated = await Complaint.findByIdAndUpdate(
          id,
          { $inc: { facingSameIssue: 1 } },
          { new: true }
        )
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

    return NextResponse.json({ complaint: updated }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

