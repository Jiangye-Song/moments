"use client"

const USERNAME_COOKIE = "moments_username"
const COOKIE_EXPIRY = new Date("2099-12-31").toUTCString()

export function getUsername(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${USERNAME_COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

export function setUsername(username: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${USERNAME_COOKIE}=${encodeURIComponent(username)}; expires=${COOKIE_EXPIRY}; path=/`
}

export function hasUsername(): boolean {
  return !!getUsername()
}
