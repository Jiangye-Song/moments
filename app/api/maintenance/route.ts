import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/posts"

export async function GET() {
  try {
    const enabled = await getMaintenanceMode()
    return NextResponse.json({ enabled })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get maintenance status" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated (admin only)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const enabled = await setMaintenanceMode(body.enabled === true)
    
    return NextResponse.json({ enabled })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update maintenance status" }, { status: 500 })
  }
}
