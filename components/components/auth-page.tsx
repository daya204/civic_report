"use client"

import { useState } from "react"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import { MapPin, Shield, Users } from "lucide-react"

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">CivicPulse</span>
          </div>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Your voice matters. Report issues, track progress, build better communities.
          </h1>
          <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-md">
            Connect with your municipality, report civic issues, and see real change happen in your neighborhood.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Location-Aware</p>
                <p className="text-sm text-primary-foreground/60">
                  Complaints auto-map to the right municipality
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Community Driven</p>
                <p className="text-sm text-primary-foreground/60">
                  Support issues others face and amplify your voice
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/40">
          CivicPulse - Empowering citizens since 2026
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold text-foreground">CivicPulse</span>
          </div>

          {mode === "signin" ? (
            <SignInForm onSwitchToSignUp={() => setMode("signup")} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setMode("signin")} />
          )}
        </div>
      </div>
    </div>
  )
}
