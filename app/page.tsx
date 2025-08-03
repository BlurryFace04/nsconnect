"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Network, Send, MessageSquare, User, Search, ExternalLink, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface Member {
  id: string
  name: string
  avatar: string
  interests: string[]
  goals: string[]
  bio: string
  matchScore: number
  discordHandle: string
  location: string
  experience: string
}

// Sample members for preview
const SAMPLE_MEMBERS = [
  {
    id: "preview-1",
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=40&width=40&text=SC",
    interests: ["React", "TypeScript", "UI/UX Design", "Startups"],
    goals: ["Build SaaS products", "Find co-founder"],
    bio: "Full-stack developer building productivity apps. Looking for technical co-founder for my next venture.",
    matchScore: 95,
    discordHandle: "@sarahchen#1234",
    location: "San Francisco, CA",
    experience: "5+ years in tech",
  },
  {
    id: "preview-2",
    name: "Marcus Johnson",
    avatar: "/placeholder.svg?height=40&width=40&text=MJ",
    interests: ["Entrepreneurship", "AI", "Product Management", "Growth Hacking"],
    goals: ["Scale startup", "Network with founders", "Learn about AI"],
    bio: "Serial entrepreneur, currently building AI-powered marketing tools. Happy to mentor early-stage founders.",
    matchScore: 92,
    discordHandle: "@marcusj#5678",
    location: "Austin, TX",
    experience: "10+ years entrepreneurship",
  },
  {
    id: "preview-3",
    name: "Elena Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40&text=ER",
    interests: ["Design Systems", "User Research", "Accessibility", "Figma"],
    goals: ["Lead design team", "Improve accessibility", "Mentor designers"],
    bio: "Senior UX Designer with 8 years experience. Passionate about inclusive design and building design systems.",
    matchScore: 88,
    discordHandle: "@elenadesign#9012",
    location: "New York, NY",
    experience: "8+ years design",
  },
  {
    id: "preview-4",
    name: "David Kim",
    avatar: "/placeholder.svg?height=40&width=40&text=DK",
    interests: ["Machine Learning", "Python", "Data Science", "Open Source"],
    goals: ["Contribute to AI research", "Build ML products", "Teach others"],
    bio: "Data scientist and ML engineer. Love working on computer vision projects and contributing to open source.",
    matchScore: 85,
    discordHandle: "@davidml#3456",
    location: "Seattle, WA",
    experience: "6+ years ML/AI",
  },
  {
    id: "preview-5",
    name: "Priya Patel",
    avatar: "/placeholder.svg?height=40&width=40&text=PP",
    interests: ["Product Strategy", "User Analytics", "B2B SaaS", "Team Leadership"],
    goals: ["Become VP of Product", "Launch successful product", "Build great teams"],
    bio: "Product manager at a fast-growing SaaS company. Focused on user-driven product development and team growth.",
    matchScore: 90,
    discordHandle: "@priyapm#7890",
    location: "Boston, MA",
    experience: "7+ years product",
  },
]

type TabType = "chat" | "profile" | "discover"

export default function CommunityChat() {
  const [activeTab, setActiveTab] = useState<TabType>("chat")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [recommendedMembers, setRecommendedMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: userMessage,
    }

    setMessages((prev) => [...prev, newUserMessage])

    try {
      // Call the real chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "",
      }
      
      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            assistantResponse += chunk
            
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: assistantResponse }
                  : msg
              )
            )
          }
        } finally {
          reader.releaseLock()
        }
      }

      // Fetch member recommendations using the full conversation
      const fullConversation = [...messages, newUserMessage].map(m => m.content).join(' ')
      fetchMemberRecommendations(fullConversation)
      
    } catch (error) {
      console.error('Error calling chat API:', error)
      // Fallback to dummy response
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "I'm sorry, I'm having trouble connecting right now. Could you try again?",
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsLoading(false)
    }
  }



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const fetchMemberRecommendations = async (conversation: string) => {
    setIsLoadingMembers(true)

    try {
      const response = await fetch('/api/members/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversation,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setRecommendedMembers(data.members || [])
    } catch (error) {
      console.error("Failed to fetch member recommendations:", error)
      // Fallback to empty array or show error message
      setRecommendedMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const renderMemberProfile = (member: Member) => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-heading text-card-foreground flex items-center gap-3">
              <User className="h-6 w-6" />
              {member.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMember(null)}
              className="hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
              <AvatarFallback className="text-2xl font-bold bg-gray-100 dark:bg-gray-900 text-card-foreground">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl text-heading text-card-foreground mb-2">{member.name}</h3>
              <p className="text-muted-foreground text-lg mb-1">{member.location}</p>
              <p className="text-gray-500 dark:text-gray-500">{member.experience}</p>
              <div className="mt-4">
                <Badge
                  variant="secondary"
                  className="font-semibold text-base px-3 py-1 bg-secondary text-secondary-foreground"
                >
                  {member.matchScore}% match
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">About</h4>
              <p className="text-body text-gray-700 dark:text-gray-300 leading-relaxed">{member.bio}</p>
            </div>

            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {member.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="font-medium px-3 py-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Current Goals</h4>
              <div className="flex flex-wrap gap-2">
                {member.goals.map((goal) => (
                  <Badge
                    key={goal}
                    variant="secondary"
                    className="font-medium px-3 py-1 bg-secondary text-secondary-foreground"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 text-lg"
                onClick={() => window.open(`https://discord.com/users/${member.discordHandle}`, "_blank")}
              >
                <ExternalLink className="h-5 w-5 mr-3" />
                Connect on Discord: {member.discordHandle}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderChatInterface = () => (
    <div className="h-full animate-fade-in-up">
      <Card className="h-full flex flex-col bg-card border-border shadow-lg">
        <CardHeader className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-pulse"></div>
              <CardTitle className="text-2xl text-heading text-card-foreground">Network School Connect</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-medium">
                <Users className="h-3 w-3 mr-1" />
                AI-Powered Matching
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center mt-20 space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl text-display text-card-foreground">
                  Start Conversations That Help You Grow
                </h1>
                <p className="text-xl text-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Whether you're raising, hiring, growing, or pivoting — start the conversation and get matched with
                  people who can help.
                </p>
              </div>
              <div className="flex items-center justify-center gap-8 mt-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Your Goals</p>
                </div>
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mb-3">
                    <Network className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Get Matched</p>
                </div>
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Connect & Grow</p>
                </div>
              </div>
            </div>
          )}

          {/* {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-6 py-4 ${
                  message.role === "user"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
                }`}
              >
                <p className="text-body whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))} */}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-4 w-4 border-2 border-black dark:border-white border-t-transparent rounded-full"></div>
                  <span className="text-body text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Member Recommendations */}
          {(recommendedMembers.length > 0 || isLoadingMembers) && (
            <div className="mt-8 p-6 bg-muted rounded-lg border-border">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-card-foreground" />
                <h3 className="text-heading text-xl text-card-foreground">Recommended Connections</h3>
              </div>
              <p className="text-body text-muted-foreground mb-6 leading-relaxed">
                Based on your conversation, here are some community members who might be able to help or collaborate with you on your goals.
              </p>

              {isLoadingMembers ? (
                <div className="flex gap-6 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-64 animate-pulse">
                      <div className="bg-white dark:bg-black rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                  {recommendedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex-shrink-0 w-64 bg-card rounded-lg p-6 border-border hover-lift cursor-pointer group"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-border flex-shrink-0">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-900 text-card-foreground text-lg font-bold">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-xl text-heading text-card-foreground group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors truncate pr-2">
                              {member.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="bg-secondary text-secondary-foreground font-semibold px-2 py-1 text-xs flex-shrink-0"
                            >
                              {member.matchScore}%
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-sm">{member.location}</p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm">{member.experience}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-body text-gray-700 dark:text-gray-300 leading-relaxed text-sm line-clamp-3">
                        {member.bio}
                      </p>

                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {member.interests.slice(0, 3).map((interest) => (
                            <Badge
                              key={interest}
                              variant="secondary"
                              className="text-xs px-3 py-1 bg-secondary text-secondary-foreground hover:text-gray-400 dark:hover:text-gray-600 transition-colors border-0"
                            >
                              {interest}
                            </Badge>
                          ))}
                          {member.interests.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-700"
                            >
                              +{member.interests.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {member.goals.slice(0, 2).map((goal) => (
                            <Badge
                              key={goal}
                              variant="secondary"
                              className="text-xs px-3 py-1 bg-secondary text-secondary-foreground hover:text-gray-400 dark:hover:text-gray-600 transition-colors border-0"
                            >
                              {goal}
                            </Badge>
                          ))}
                          {member.goals.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-700"
                            >
                              +{member.goals.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMember(member)
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-4 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent h-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://discord.com/users/${member.discordHandle}`, "_blank")
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t border-border p-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="What are you building, solving, or seeking help with right now?"
              className="flex-1 h-12 px-4 bg-input border-border text-card-foreground placeholder-gray-500 dark:placeholder-gray-500 focus-ring"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl text-heading text-card-foreground flex items-center gap-3">
            <User className="h-6 w-6" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src="/placeholder.svg?height=80&width=80&text=You" alt="Your profile" />
              <AvatarFallback className="text-2xl font-bold bg-gray-100 dark:bg-gray-900 text-card-foreground">
                You
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl text-heading text-card-foreground mb-2">Your Name</h3>
              <p className="text-body text-muted-foreground text-lg">Network School Member</p>
              <p className="text-gray-500 dark:text-gray-500">San Francisco, CA</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Bio</h4>
              <p className="text-body text-muted-foreground leading-relaxed">
                Tell the community about yourself, what you're working on, and what you're looking for.
              </p>
            </div>

            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {["Entrepreneurship", "AI", "Product Management", "Startups"].map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground font-medium px-3 py-1"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Goals</h4>
              <div className="flex flex-wrap gap-2">
                {["Scale my business", "Find co-founder", "Raise funding"].map((goal) => (
                  <Badge
                    key={goal}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium px-3 py-1"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-subheading text-card-foreground text-lg mb-3">Discord</h4>
              <p className="text-body text-muted-foreground">@yourhandle#1234</p>
            </div>
          </div>

          <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg">
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const filteredMembers = SAMPLE_MEMBERS.filter((member) => {
    const query = searchQuery.toLowerCase()
    return (
      member.name.toLowerCase().includes(query) ||
      member.bio.toLowerCase().includes(query) ||
      member.interests.some((interest) => interest.toLowerCase().includes(query)) ||
      member.goals.some((goal) => goal.toLowerCase().includes(query)) ||
      member.location.toLowerCase().includes(query) ||
      member.experience.toLowerCase().includes(query)
    )
  })

  const renderDiscoverMembers = () => (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-12">
        <h1 className="text-4xl text-display text-card-foreground mb-4">Discover Members</h1>
        <p className="text-xl text-body text-muted-foreground">Connect with like-minded professionals in your field</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-12 bg-card border-border shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col">
            {/* Search Bar */}
            <div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, skills, location, or goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-input border-border text-card-foreground placeholder-gray-500 dark:placeholder-gray-500 focus-ring"
                />
              </div>
            </div>

            {/* Quick Filters */}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-6 flex items-center gap-3">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-semibold px-3 py-1">
                {filteredMembers.length} results
              </Badge>
              <span className="text-body text-muted-foreground">for "{searchQuery}"</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl text-heading text-card-foreground mb-4">No members found</h3>
            <p className="text-body text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              We couldn't find any members matching your search. Try different keywords or browse all members.
            </p>
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 font-semibold px-6 py-3"
            >
              Show All Members
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="group hover-lift cursor-pointer border-border bg-card shadow-lg overflow-hidden"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="p-8">
                {/* Member Header */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-16 w-16 border-2 border-border flex-shrink-0">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-900 text-card-foreground text-lg font-bold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl text-heading text-card-foreground group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors truncate pr-2">
                        {member.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground font-semibold px-2 py-1 text-xs flex-shrink-0"
                      >
                        {member.matchScore}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm">{member.location}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">{member.experience}</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <p className="text-body text-gray-700 dark:text-gray-300 leading-relaxed text-sm line-clamp-3">
                    {member.bio}
                  </p>
                </div>

                {/* Skills/Interests */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-3">
                    Skills & Interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.interests.slice(0, 3).map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="text-xs px-3 py-1 bg-secondary text-secondary-foreground hover:text-gray-400 dark:hover:text-gray-600 transition-colors border-0"
                      >
                        {interest}
                      </Badge>
                    ))}
                    {member.interests.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs px-3 py-1 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-700"
                      >
                        +{member.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Goals */}
                <div className="mb-8">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-3">
                    Current Goals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.goals.slice(0, 2).map((goal) => (
                      <Badge
                        key={goal}
                        variant="secondary"
                        className="text-xs px-3 py-1 bg-secondary text-secondary-foreground hover:text-gray-400 dark:hover:text-gray-600 transition-colors border-0"
                      >
                        {goal}
                      </Badge>
                    ))}
                    {member.goals.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-xs px-3 py-1 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-700"
                      >
                        +{member.goals.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMember(member)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-4 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 bg-transparent h-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`https://discord.com/users/${member.discordHandle}`, "_blank")
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-8 px-8 py-6 bg-card rounded-lg shadow-lg border-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
            <span className="text-subheading text-card-foreground">{SAMPLE_MEMBERS.length} Active Members</span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-black dark:text-white" />
            <span className="text-body text-muted-foreground">Growing Community</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Menu */}
      <div className="w-80 bg-muted border-border shadow-sm">
        <div className="p-8">
          <div className="mb-12">
            <h2 className="text-2xl text-heading text-card-foreground mb-3">Navigation</h2>
          </div>

          <div className="space-y-2">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              className={`w-full justify-start h-14 text-left px-6 text-lg font-semibold ${
                activeTab === "chat"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <MessageSquare className="h-5 w-5 mr-4" />
              New Chat
            </Button>

            {/* <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className={`w-full justify-start h-14 text-left px-6 text-lg font-semibold ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-5 w-5 mr-4" />
              My Profile
            </Button> */}

            {/* <Button
              variant={activeTab === "discover" ? "default" : "ghost"}
              className={`w-full justify-start h-14 text-left px-6 text-lg font-semibold ${
                activeTab === "discover"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
              onClick={() => setActiveTab("discover")}
            >
              <Search className="h-5 w-5 mr-4" />
              Discover Members
            </Button> */}
          </div>

          <div className="mt-12 p-6 bg-card rounded-lg border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full"></div>
              <p className="text-subheading text-card-foreground">
                {activeTab === "chat" ? "New Chat" : ""}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Current workspace</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        {activeTab === "chat" && renderChatInterface()}
        {/* {activeTab === "profile" && renderProfile()} */}
        {/* {activeTab === "discover" && renderDiscoverMembers()} */}
      </div>

      {/* Member Profile Modal */}
      {selectedMember && renderMemberProfile(selectedMember)}
    </div>
  )
}
