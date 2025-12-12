import { db } from "./db"
import { settings } from "./schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"

const ADMIN_PASSCODE_KEY = "admin_passcode_hash"
const SESSION_COOKIE_NAME = "admin_session"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// Simple hash function using Web Crypto API
async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(passcode)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Generate a random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Check if passcode is set up
export async function isPasscodeConfigured(): Promise<boolean> {
  const result = await db.select().from(settings).where(eq(settings.key, ADMIN_PASSCODE_KEY))
  return result.length > 0
}

// Get stored passcode hash
async function getStoredHash(): Promise<string | null> {
  const result = await db.select().from(settings).where(eq(settings.key, ADMIN_PASSCODE_KEY))
  return result.length > 0 ? result[0].value : null
}

// Set or update passcode
export async function setPasscode(passcode: string): Promise<void> {
  const hash = await hashPasscode(passcode)
  const existing = await db.select().from(settings).where(eq(settings.key, ADMIN_PASSCODE_KEY))
  
  if (existing.length > 0) {
    await db.update(settings)
      .set({ value: hash })
      .where(eq(settings.key, ADMIN_PASSCODE_KEY))
  } else {
    await db.insert(settings).values({
      key: ADMIN_PASSCODE_KEY,
      value: hash,
    })
  }
}

// Verify passcode
export async function verifyPasscode(passcode: string): Promise<boolean> {
  const storedHash = await getStoredHash()
  if (!storedHash) return false
  
  const inputHash = await hashPasscode(passcode)
  return inputHash === storedHash
}

// Create session
export async function createSession(): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = Date.now() + SESSION_DURATION
  
  // Store session token with expiry
  const sessionKey = `session_${token}`
  const existing = await db.select().from(settings).where(eq(settings.key, sessionKey))
  
  if (existing.length > 0) {
    await db.update(settings)
      .set({ value: expiresAt.toString() })
      .where(eq(settings.key, sessionKey))
  } else {
    await db.insert(settings).values({
      key: sessionKey,
      value: expiresAt.toString(),
    })
  }
  
  return token
}

// Verify session token
export async function verifySession(token: string): Promise<boolean> {
  if (!token) return false
  
  const sessionKey = `session_${token}`
  const result = await db.select().from(settings).where(eq(settings.key, sessionKey))
  
  if (result.length === 0) return false
  
  const expiresAt = parseInt(result[0].value, 10)
  if (Date.now() > expiresAt) {
    // Clean up expired session
    await db.delete(settings).where(eq(settings.key, sessionKey))
    return false
  }
  
  return true
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  const sessionKey = `session_${token}`
  await db.delete(settings).where(eq(settings.key, sessionKey))
}

// Get session from cookies
export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

// Check if current request is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionFromCookies()
  if (!token) return false
  return verifySession(token)
}
