"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "./dashboard-header"
import { ComplaintCard } from "./complaint-card"
import { ComplaintFilters } from "./complaint-filters"
import { ComplaintDetail } from "./complaint-detail"
import { CreateComplaint } from "./create-complaint"
import { ProfileView } from "./profile-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  Plus,
} from "lucide-react"

export function CitizenDashboard() {
  const { complaints } = useComplaints()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("posts")
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("All Districts")
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

  const filterComplaints = useMemo(() => {
    return (list: typeof complaints) => {
      return list.filter((c) => {
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
      })
    }
  }, [selectedRegion, selectedCategory, searchQuery])

  const unsolvedComplaints = useMemo(
    () =>
      filterComplaints(
        complaints.filter((c) =>
          ["unsolved", "read", "on_the_way", "in_progress"].includes(c.status)
        )
      ),
    [complaints, filterComplaints]
  )

  const solvedComplaints = useMemo(() => {
    const solved = complaints.filter((c) => ["solved", "verified"].includes(c.status))
    const byId = new Map<string, (typeof complaints)[0]>()
    solved.forEach((c) => byId.set(c.id, c))
    return filterComplaints(Array.from(byId.values()))
  }, [complaints, filterComplaints])

  const allSearchResults = useMemo(
    () => filterComplaints(complaints),
    [complaints, filterComplaints]
  )

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
          onVerified={() => {
            setSelectedComplaintId(null)
            setActiveTab("solved")
          }}
          onNotResolved={() => {
            setSelectedComplaintId(null)
            setActiveTab("posts")
          }}
        />
      </>
    )
  }

  if (showCreate) {
    return (
      <>
        <DashboardHeader onProfileClick={() => setActiveTab("profile")} />
        <CreateComplaint onBack={() => setShowCreate(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onProfileClick={() => setActiveTab("profile")} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and report civic issues in your area
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl shadow-sm">
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="sticky top-16 z-40 -mx-4 mb-6 flex flex-col gap-4 border-b border-border/70 bg-background/85 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl border border-border/70 bg-card/70 sm:w-auto">
              <TabsTrigger value="posts" className="gap-1.5 text-xs sm:text-sm">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Posts</span>
                <span className="sm:hidden">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
              <TabsTrigger value="solved" className="gap-1.5 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Solved</span>
                <span className="sm:hidden">Solved</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
            </TabsList>

            {activeTab !== "profile" && (
              <ComplaintFilters
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            )}
          </div>

          <TabsContent value="posts" className="mt-0">
            <div className="space-y-4">
              {unsolvedComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No unsolved complaints</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All issues seem to be resolved. Report a new one if you find something.
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

          <TabsContent value="search" className="mt-0">
            <div className="mb-4">
              <Input
                placeholder="Search complaints by title, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-lg"
              />
            </div>
            <div className="space-y-4">
              {allSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                allSearchResults.map((c) => (
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
                  <h3 className="text-lg font-medium text-foreground">No solved complaints yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Solved complaints will appear here once issues are resolved
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
          <ProfileView onSelectComplaint={handleSelectComplaint} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
