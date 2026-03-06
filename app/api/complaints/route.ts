import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Complaint } from "@/models/Complaint"
import { mockComplaints } from "@/lib/mock-data"
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
    let complaints = await Complaint.find().sort({ createdAt: -1 }).lean()

    // Seed database with mock complaints if empty, so dashboards have initial data
    if (complaints.length === 0) {
      await Complaint.insertMany(
        mockComplaints.map((c) => ({
          title: c.title,
          description: c.description,
          category: c.category,
          status: c.status,
          location: c.location,
          region: c.region,
          latitude: c.latitude,
          longitude: c.longitude,
          images: c.images,
          proofImage: c.proofImage,
          userId: c.userId,
          userName: c.userName,
          userAvatar: c.userAvatar,
          likes: c.likes,
          likedByCurrentUser: false,
          likedBy: [],
          facingSameIssue: c.facingSameIssue,
          comments: c.comments,
          resolvedAt: c.resolvedAt,
          verifiedAt: c.verifiedAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }))
      )
      complaints = await Complaint.find().sort({ createdAt: -1 }).lean()
    }

    // Auto-hide verified complaints older than 7 days
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

    const visibleComplaints = complaints.filter((c: any) => {
      if (c.status !== "verified" || !c.verifiedAt) return true
      const verifiedTime = new Date(c.verifiedAt).getTime()
      if (Number.isNaN(verifiedTime)) return true
      return now - verifiedTime <= sevenDaysMs
    })

    // Attach likedByCurrentUser dynamically based on the authenticated user
    const complaintsWithLikeState = visibleComplaints.map((c: any) => {
      const likedBy: string[] = Array.isArray(c.likedBy) ? c.likedBy : []
      const likedByCurrentUser =
        user && user.sub ? likedBy.includes(user.sub) : false
      return {
        ...c,
        likedByCurrentUser,
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
      comments: [],
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

