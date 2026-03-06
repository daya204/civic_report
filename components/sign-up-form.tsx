"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, UserPlus } from "lucide-react"

interface SignUpFormProps {
  onSwitchToSignIn: () => void
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const { signUp } = useAuth()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [address, setAddress] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name || !username || !email || !password || !address) {
      setError("Please fill in all required fields")
      return
    }
    const success = await signUp({ name, username, email, phone, password, address })
    if (!success) {
      setError("Username or email already taken")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="text-muted-foreground">
          Join the community and start making a difference
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-username"
              placeholder="Unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-phone">Phone Number (optional)</Label>
          <Input
            id="signup-phone"
            type="tel"
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-address">
            Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signup-address"
            placeholder="Your full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={onSwitchToSignIn}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}
