export type UserRole = "citizen" | "authority"

export type ComplaintStatus =
  | "unsolved"
  | "read"
  | "on_the_way"
  | "in_progress"
  | "solved"
  | "verified"

export type ComplaintCategory =
  | "road"
  | "garbage"
  | "drainage"
  | "water_supply"
  | "electricity"
  | "sanitation"
  | "other"

export interface User {
  id: string
  name: string
  username: string
  email: string
  phone?: string
  address: string
  role: UserRole
  avatar?: string
  region: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  content: string
  createdAt: string
}

export interface Complaint {
  id: string
  title: string
  description: string
  category: ComplaintCategory
  status: ComplaintStatus
  location: string
  region: string
  latitude: number
  longitude: number
  images: string[]
  proofImage?: string
  userId: string
  userName: string
  userAvatar?: string
  likes: number
  likedByCurrentUser: boolean
  facingSameIssue: number
  comments: Comment[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  verifiedAt?: string
}
