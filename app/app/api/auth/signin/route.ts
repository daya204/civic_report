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

async function ensureAuthorityUsers() {
  const usernames = Array.from(getAuthorityUsernames())
  if (usernames.length === 0) return

  const defaultPassword =
    process.env.AUTHORITY_DEFAULT_PASSWORD || "Authority@123"
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  await Promise.all(
    usernames.map(async (username) => {
      const existing = await User.findOne({ username })
      if (existing) return

      await User.create({
        name: `Municipal Officer - ${username}`,
        username,
        email: `${username}@gov.local`,
        address: "Municipal Office",
        passwordHash,
        role: "authority",
        region: "Sector 5",
      })
    })
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { usernameOrEmail, password } = body

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    await connectToDatabase()

    // Ensure authority users exist with a known default password
    await ensureAuthorityUsers()

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isAuthority = getAuthorityUsernames().has(user.username)
    const effectiveRole = isAuthority ? "authority" : "citizen"

    if (user.role !== effectiveRole) {
      user.role = effectiveRole
      await user.save()
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: effectiveRole },
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
          role: effectiveRole,
          region: user.region,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

