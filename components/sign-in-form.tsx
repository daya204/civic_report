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
    if (!username || !password) {
      setError("Please fill in all fields")
      return
    }
    const success = await signIn(username, password)
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Demo Accounts</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Citizen: <span className="font-mono text-foreground">arjun_m</span>
            </p>
            <p>
              Authority: <span className="font-mono text-foreground">muni_sec5</span>
            </p>
            <p className="text-muted-foreground/70">Any password works for demo</p>
          </div>
        </div>

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
    </div>
  )
}
