"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setUsername } from "@/lib/user"

interface UsernameDialogProps {
  open: boolean
  onComplete: (username: string) => void
  onCancel: () => void
}

export function UsernameDialog({ open, onComplete, onCancel }: UsernameDialogProps) {
  const [name, setName] = useState("")

  const handleSubmit = () => {
    const trimmedName = name.trim()
    if (trimmedName) {
      setUsername(trimmedName)
      onComplete(trimmedName)
      setName("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Welcome!
          </DialogTitle>
          <DialogDescription>Enter your name to interact with posts</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
