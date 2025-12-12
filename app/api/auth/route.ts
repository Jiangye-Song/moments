import { NextRequest, NextResponse } from "next/server"
import { 
  isPasscodeConfigured, 
  verifyPasscode, 
  setPasscode, 
  createSession, 
  deleteSession,
  verifySession,
  isAuthenticated
} from "@/lib/auth"

const SESSION_COOKIE_NAME = "admin_session"
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

export async function GET() {
  try {
    const configured = await isPasscodeConfigured()
    const authenticated = await isAuthenticated()
    
    return NextResponse.json({ 
      configured,
      authenticated
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Failed to check auth status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, passcode, currentPasscode, newPasscode } = body
    
    if (action === "login") {
      const isValid = await verifyPasscode(passcode)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid passcode" }, { status: 401 })
      }
      
      const token = await createSession()
      const response = NextResponse.json({ success: true })
      
      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION,
        path: "/",
      })
      
      return response
    }
    
    if (action === "setup") {
      // Initial setup - only allowed if no passcode configured
      const configured = await isPasscodeConfigured()
      if (configured) {
        return NextResponse.json({ error: "Passcode already configured" }, { status: 400 })
      }
      
      if (!passcode || passcode.length < 4) {
        return NextResponse.json({ error: "Passcode must be at least 4 characters" }, { status: 400 })
      }
      
      await setPasscode(passcode)
      const token = await createSession()
      
      const response = NextResponse.json({ success: true })
      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION,
        path: "/",
      })
      
      return response
    }
    
    if (action === "change") {
      // Change passcode - requires current passcode
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      
      const isValidCurrent = await verifyPasscode(currentPasscode)
      if (!isValidCurrent) {
        return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 401 })
      }
      
      if (!newPasscode || newPasscode.length < 4) {
        return NextResponse.json({ error: "New passcode must be at least 4 characters" }, { status: 400 })
      }
      
      await setPasscode(newPasscode)
      return NextResponse.json({ success: true })
    }
    
    if (action === "logout") {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
      if (token) {
        await deleteSession(token)
      }
      
      const response = NextResponse.json({ success: true })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth action error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
