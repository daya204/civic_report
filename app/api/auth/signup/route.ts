import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db"
import { User } from "@/models/User"

export const runtime = "nodejs"

function getAuthorityUsernames() {
  const raw = process.env.AUTHORITY_USERNAMES || ""
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, username, email, password, phone, address } = body

    if (!name || !username || !email || !password || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (getAuthorityUsernames().has(String(username))) {
      return NextResponse.json(
        { error: "This username is reserved for authority accounts" },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const existing = await User.findOne({ $or: [{ username }, { email }] })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      username,
      email,
      phone,
      address,
      passwordHash,
      role: "citizen",
      region: "Sector 5",
    })

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    )

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          region: user.region,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

