"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function ChangePasscode() {
  const [currentPasscode, setCurrentPasscode] = useState("")
  const [newPasscode, setNewPasscode] = useState("")
  const [confirmPasscode, setConfirmPasscode] = useState("")
  const [showPasscodes, setShowPasscodes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPasscode.length < 4) {
      toast.error("New passcode must be at least 4 characters")
      return
    }
    
    if (newPasscode !== confirmPasscode) {
      toast.error("New passcodes do not match")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          currentPasscode,
          newPasscode,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || "Failed to change passcode")
        return
      }
      
      toast.success("Passcode changed successfully")
      setCurrentPasscode("")
      setNewPasscode("")
      setConfirmPasscode("")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Change Passcode</CardTitle>
        </div>
        <CardDescription>
          Update your admin passcode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPasscode">Current Passcode</Label>
            <div className="relative">
              <Input
                id="currentPasscode"
                type={showPasscodes ? "text" : "password"}
                value={currentPasscode}
                onChange={(e) => setCurrentPasscode(e.target.value)}
                placeholder="Enter current passcode"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPasscodes(!showPasscodes)}
              >
                {showPasscodes ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPasscode">New Passcode</Label>
            <Input
              id="newPasscode"
              type={showPasscodes ? "text" : "password"}
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="Enter new passcode"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmNewPasscode">Confirm New Passcode</Label>
            <Input
              id="confirmNewPasscode"
              type={showPasscodes ? "text" : "password"}
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
              placeholder="Confirm new passcode"
            />
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              "Change Passcode"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
