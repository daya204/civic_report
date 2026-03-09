import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "@/lib/db"
import { User } from "@/models/User"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { usernameOrEmail, password } = body

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      )
    }

    // connect to MongoDB
    await connectToDatabase()

    // find user by username OR email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    }).lean() // .lean() for plain JS object

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // compare password
    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const role = user.role || "citizen"

    // Build JWT payload
    const tokenPayload: { sub: string; username: string; role: string; district?: string } = {
      sub: user._id.toString(),
      username: user.username,
      role,
    }

    // Include district if authority
    if (role === "authority" && user.district) {
      tokenPayload.district = user.district
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name || null,
          username: user.username,
          email: user.email || null,
          phone: user.phone || null,
          address: user.address || null,
          role,
          region: user.region || null,
          district: user.district || null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}