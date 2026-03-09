import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Complaint } from "@/models/Complaint"
import jwt from "jsonwebtoken"

export const runtime = "nodejs"

function getUserFromAuthHeader(request: Request) {
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

export async function GET(request: Request) {
  try {
    const user = getUserFromAuthHeader(request)
    await connectToDatabase()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all complaints currently stored; if the database is empty, just return an empty list.
    let complaints = await Complaint.find().sort({ createdAt: -1 }).lean()

    // Auto-hide verified complaints older than 7 days
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    let visibleComplaints = complaints.filter((c: any) => {
      if (c.status !== "verified" || !c.verifiedAt) return true
      const verifiedTime = new Date(c.verifiedAt).getTime()
      if (Number.isNaN(verifiedTime)) return true
      return now - verifiedTime <= sevenDaysMs
    })

    // Filter complaints for authority by district
    if (user.role === "authority") {
      // Fetch authority user to get district
      const { User } = await import("@/models/User")
      const authority = await User.findById(user.sub).lean()
      if (authority && authority.district) {
        visibleComplaints = visibleComplaints.filter(
          (c: any) => c.region === authority.district
        )
      }
    }

    // Attach likedByCurrentUser and facingSameIssueByCurrentUser
    const complaintsWithLikeState = visibleComplaints.map((c: any) => {
      const likedBy: string[] = Array.isArray(c.likedBy) ? c.likedBy : []
      const facingSameIssueBy: string[] = Array.isArray(c.facingSameIssueBy) ? c.facingSameIssueBy : []
      const likedByCurrentUser = user && user.sub ? likedBy.includes(user.sub) : false
      const facingSameIssueByCurrentUser = user && user.sub ? facingSameIssueBy.includes(user.sub) : false
      return {
        ...c,
        likedByCurrentUser,
        facingSameIssueByCurrentUser,
      }
    })

    return NextResponse.json({ complaints: complaintsWithLikeState }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromAuthHeader(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      location,
      region,
      latitude,
      longitude,
      images,
    } = body

    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !region ||
      !latitude ||
      !longitude ||
      !images ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()

    const complaint = await Complaint.create({
      title,
      description,
      category,
      location,
      region,
      latitude,
      longitude,
      images,
      status: "unsolved",
      userId: user.sub,
      userName: user.username,
      likes: 0,
      likedByCurrentUser: false,
      facingSameIssue: 0,
      facingSameIssueBy: [],
      comments: [],
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}