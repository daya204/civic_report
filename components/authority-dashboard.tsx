"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "./dashboard-header"
import { ComplaintCard } from "./complaint-card"
import { ComplaintFilters } from "./complaint-filters"
import { ComplaintDetail } from "./complaint-detail"
import { ProfileView } from "./profile-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  Wrench,
} from "lucide-react"

export function AuthorityDashboard() {
  const { complaints } = useComplaints()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("posts")
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState(user?.region || "All Districts")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const scrollPositions = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!selectedComplaintId) {
      const pos = scrollPositions.current[activeTab] ?? 0
      window.scrollTo(0, pos)
    }
  }, [selectedComplaintId, activeTab])

  const handleSelectComplaint = (id: string) => {
    scrollPositions.current[activeTab] = window.scrollY
    setSelectedComplaintId(id)
  }

  const handleTabChange = (tab: string) => {
    scrollPositions.current[activeTab] = window.scrollY
    setActiveTab(tab)

    // Always restore scroll position if it exists
    const savedPosition = scrollPositions.current[tab]
    if (savedPosition !== undefined) {
      setTimeout(() => {
        window.scrollTo(0, savedPosition)
      }, 0)
    } else {
      window.scrollTo(0, 0)
    }
  }

  // Authority only sees their region by default
  const regionComplaints = useMemo(
    () =>
      complaints.filter((c) => {
        const matchesRegion =
          selectedRegion === "All Districts" || c.region === selectedRegion
        const matchesCategory =
          selectedCategory === "all" || c.category === selectedCategory
        const matchesSearch =
          !searchQuery ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesRegion && matchesCategory && matchesSearch
      }),
    [complaints, selectedRegion, selectedCategory, searchQuery]
  )

  const unsolvedComplaints = useMemo(
    () => regionComplaints.filter((c) => c.status === "unsolved"),
    [regionComplaints]
  )

  const inProgressComplaints = useMemo(
    () =>
      regionComplaints.filter((c) =>
        ["read", "on_the_way", "in_progress"].includes(c.status)
      ),
    [regionComplaints]
  )

  const solvedComplaints = useMemo(() => {
    const solved = regionComplaints.filter((c) =>
      ["solved", "verified"].includes(c.status)
    )
    const byId = new Map<string, (typeof regionComplaints)[0]>()
    solved.forEach((c) => byId.set(c.id, c))
    return Array.from(byId.values())
  }, [regionComplaints])

  if (selectedComplaintId) {
    return (
      <>
        <DashboardHeader
          onProfileClick={() => {
            setSelectedComplaintId(null)
            setActiveTab("profile")
          }}
        />
        <ComplaintDetail
          complaintId={selectedComplaintId}
          onBack={() => setSelectedComplaintId(null)}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onProfileClick={() => setActiveTab("profile")} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Authority Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Managing complaints for {user?.region || "your region"}
          </p>
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-medium text-muted-foreground">Unsolved</p>
            <p className="mt-1 text-2xl font-bold text-destructive">
              {unsolvedComplaints.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-medium text-muted-foreground">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {inProgressComplaints.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-medium text-muted-foreground">Solved</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {solvedComplaints.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {regionComplaints.length}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="sticky top-16 z-40 -mx-4 mb-6 flex flex-col gap-4 border-b border-border/70 bg-background/85 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid h-11 w-full grid-cols-5 rounded-xl border border-border/70 bg-card/70 sm:w-auto">
              <TabsTrigger value="posts" className="gap-1.5 text-xs sm:text-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unsolved</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
              <TabsTrigger value="wip" className="gap-1.5 text-xs sm:text-sm relative">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">In Progress</span>
                <span className="sm:hidden">WIP</span>
                {inProgressComplaints.length > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground border-0">
                    {inProgressComplaints.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Find</span>
              </TabsTrigger>
              <TabsTrigger value="solved" className="gap-1.5 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Solved</span>
                <span className="sm:hidden">Done</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Me</span>
              </TabsTrigger>
            </TabsList>

            {activeTab !== "profile" && (
              <ComplaintFilters
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showRegionFilter={false}
              />
            )}
          </div>

          <TabsContent value="posts" className="mt-0">
            <div className="space-y-4">
              {unsolvedComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">All clear</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No new unsolved complaints in your region
                  </p>
                </div>
              ) : (
                unsolvedComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={handleSelectComplaint}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="wip" className="mt-0">
            <div className="space-y-4">
              {inProgressComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No work in progress</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start working on unsolved complaints to see them here
                  </p>
                </div>
              ) : (
                inProgressComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={handleSelectComplaint}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <div className="mb-4">
              <Input
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-lg"
              />
            </div>
            <div className="space-y-4">
              {regionComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                regionComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={handleSelectComplaint}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="solved" className="mt-0">
            <div className="space-y-4">
              {solvedComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No solved complaints</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Resolved cases will appear here
                  </p>
                </div>
              ) : (
                solvedComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={handleSelectComplaint}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <ProfileView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
