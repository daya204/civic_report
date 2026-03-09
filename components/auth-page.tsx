"use client"

import { useState } from "react"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MapPin,
  Megaphone,
  Shield,
  Users,
} from "lucide-react"

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  return (
    <div className="min-h-screen overflow-y-auto bg-background">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-accent/20 blur-2xl" />

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:py-14">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Trusted Civic Complaint Platform
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-foreground">
                  CivicPulse
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Report local issues. Track real progress. Build a better community .
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                CivicPulse connects citizens and authorities in one transparent workflow from first complaint to verified resolution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Map-based reporting</p>
                <p className="mt-1 text-xs text-muted-foreground">Pin exact issue location</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <Clock3 className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Live tracking</p>
                <p className="mt-1 text-xs text-muted-foreground">Follow status changes</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Verified closure</p>
                <p className="mt-1 text-xs text-muted-foreground">Confirm resolution quality</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/80 p-5">
              <p className="text-sm font-semibold text-foreground">How it works</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>1. Submit complaint with image and location.</li>
                <li>2. Route automatically to the correct district authority.</li>
                <li>3. Get updates as the issue moves to solved.</li>
                <li>4. Verify once work is completed.</li>
              </ol>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="pointer-events-none absolute -right-3 -top-3 hidden rotate-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary lg:block">
              Start in under a minute
            </div>

            {mode === "signin" && (
              <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                <p className="font-semibold">Welcome back to CivicPulse</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sign in to track your complaints, support nearby issues, and verify completed fixes.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              {mode === "signin" ? (
                <SignInForm onSwitchToSignUp={() => setMode("signup")} />
              ) : (
                <SignUpForm onSwitchToSignIn={() => setMode("signin")} />
              )}
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-5 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Community Voice</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              You can support existing complaints .
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">District Routing</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Reports are sent to the right authority for faster action.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">End-to-End Flow</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              From reporting to verification, every step stays visible.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>CivicPulse - Empowering citizens since 2026</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Transparent Tracking
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              Citizen + Authority Collaboration
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
