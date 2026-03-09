"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"

interface SignInFormProps {
  onSwitchToSignUp: () => void
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) {
      setError("Please fill in all fields")
      return
    }
    const success = await signIn(trimmedUsername, password)
    if (!success) {
      setError("Invalid credentials")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
        <h3 className="text-sm font-semibold text-foreground">How CivicPulse works</h3>
        <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>1. Report a civic issue with details and photos.</li>
          <li>2. Local authorities review and update complaint status.</li>
          <li>3. Citizens track progress and verify when resolved.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
          <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <button
            onClick={onSwitchToSignUp}
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </button>
        </p>
    </div>
  )
}
