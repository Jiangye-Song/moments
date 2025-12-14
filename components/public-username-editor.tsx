"use client"
import { useState, useEffect } from "react"
import { User, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUsername, setUsername } from "@/lib/user"

export function PublicUsernameEditor() {
  const [currentUsername, setCurrentUsername] = useState<string>("")
  const [newUsername, setNewUsername] = useState("")

  useEffect(() => {
    const stored = getUsername()
    if (stored) {
      setCurrentUsername(stored)
      setNewUsername(stored)
    }
  }, [])

  const handleSave = () => {
    const trimmed = newUsername.trim()
    if (!trimmed) {
      toast.error("Username cannot be empty")
      return
    }
    
    setUsername(trimmed)
    setCurrentUsername(trimmed)
    toast.success("Public username updated")
  }

  const handleClear = () => {
    // Clear the cookie by setting it to expire in the past
    document.cookie = "moments_username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
    setCurrentUsername("")
    setNewUsername("")
    toast.success("Public username cleared")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Public Username
        </CardTitle>
        <CardDescription>
          Set the username you use when liking or commenting on posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUsername && (
          <div className="text-sm text-muted-foreground">
            Currently signed in as: <span className="font-medium text-foreground">{currentUsername}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="public-username">Username</Label>
          <div className="flex gap-2">
            <Input
              id="public-username"
              placeholder="Enter your public username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
            <Button onClick={handleSave} disabled={!newUsername.trim()}>
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {currentUsername && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear Username
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
