"use client"

import { useState } from "react"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminLoginProps {
  isSetup: boolean
  onSuccess: () => void
}

export function AdminLogin({ isSetup, onSuccess }: AdminLoginProps) {
  const [passcode, setPasscode] = useState("")
  const [confirmPasscode, setConfirmPasscode] = useState("")
  const [showPasscode, setShowPasscode] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (isSetup) {
      if (passcode.length < 4) {
        setError("Passcode must be at least 4 characters")
        return
      }
      if (passcode !== confirmPasscode) {
        setError("Passcodes do not match")
        return
      }
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSetup ? "setup" : "login",
          passcode,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Authentication failed")
        return
      }
      
      onSuccess()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{isSetup ? "Set Up Admin Access" : "Admin Login"}</CardTitle>
          <CardDescription>
            {isSetup 
              ? "Create a passcode to secure your admin panel" 
              : "Enter your passcode to access the admin panel"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">{isSetup ? "New Passcode" : "Passcode"}</Label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasscode(!showPasscode)}
                >
                  {showPasscode ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPasscode">Confirm Passcode</Label>
                <Input
                  id="confirmPasscode"
                  type={showPasscode ? "text" : "password"}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Confirm passcode"
                />
              </div>
            )}
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSetup ? "Setting up..." : "Logging in..."}
                </>
              ) : (
                isSetup ? "Create Passcode" : "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
