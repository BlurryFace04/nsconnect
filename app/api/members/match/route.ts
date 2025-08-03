import { type NextRequest, NextResponse } from "next/server"

// External API configuration
const EXTERNAL_API_BASE_URL = "https://0cb8abb68973.ngrok-free.app"

// Transform external API profile to our Member format
function transformProfileToMember(profile: any, index: number) {
  return {
    id: profile.username || `member-${index}`,
    name: profile.name || profile.username || "Unknown Member",
    avatar: profile.profile_image || "/placeholder.svg?height=40&width=40",
    interests: [], // The external API doesn't have structured interests, we'll extract from description
    goals: [], // The external API doesn't have structured goals, we'll extract from description
    bio: profile.description || "No description available",
    matchScore: profile.similarity || 75,
    discordHandle: `@${profile.username}#0000`, // Placeholder format
    location: profile.location || "Location not specified",
    experience: "Experience not specified", // Not available in external API
  }
}

// Search profiles using external API
async function searchProfiles(query: string, limit: number = 4) {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
      }),
    })

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error calling external API:", error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { conversation } = await req.json()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation is required" }, { status: 400 })
    }

    // Use the conversation directly as a search query to the external API
    const profiles = await searchProfiles(conversation, 4)
    
    // Transform external API profiles to our Member format
    const recommendedMembers = profiles.map((profile: any, index: number) => 
      transformProfileToMember(profile, index)
    )

    return NextResponse.json({
      members: recommendedMembers,
      keywords: [conversation.slice(0, 100)], // Simplified keywords
      reasoning: `Found ${recommendedMembers.length} members based on semantic similarity to your conversation`,
    })
  } catch (error) {
    console.error("Error matching members:", error)
    return NextResponse.json({ error: "Failed to match members" }, { status: 500 })
  }
}
