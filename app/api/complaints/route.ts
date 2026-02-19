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

export async function GET() {
  try {
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
          likedByCurrentUser: c.likedByCurrentUser,
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
    return NextResponse.json({ complaints }, { status: 200 })
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

