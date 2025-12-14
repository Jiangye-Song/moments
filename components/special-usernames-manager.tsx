"use client"
import { useState } from "react"
import useSWR from "swr"
import { Plus, Trash2, Loader2, User, Palette, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SpecialUsername {
  id: string
  username: string
  color: string | null
  restricted: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const colorOptions = [
  { value: "", label: "None (Default)", class: "text-primary" },
  { value: "orange", label: "Orange", class: "text-orange-500" },
  { value: "red", label: "Red", class: "text-red-500" },
  { value: "blue", label: "Blue", class: "text-blue-500" },
  { value: "green", label: "Green", class: "text-green-500" },
  { value: "purple", label: "Purple", class: "text-purple-500" },
  { value: "pink", label: "Pink", class: "text-pink-500" },
  { value: "yellow", label: "Yellow", class: "text-yellow-500" },
  { value: "cyan", label: "Cyan", class: "text-cyan-500" },
  { value: "emerald", label: "Emerald", class: "text-emerald-500" },
  { value: "violet", label: "Violet", class: "text-violet-500" },
  { value: "amber", label: "Amber", class: "text-amber-500" },
  { value: "teal", label: "Teal", class: "text-teal-500" },
  { value: "indigo", label: "Indigo", class: "text-indigo-500" },
  { value: "rose", label: "Rose", class: "text-rose-500" },
  { value: "sky", label: "Sky", class: "text-sky-500" },
]

export function SpecialUsernamesManager() {
  const { data: usernames, mutate } = useSWR<SpecialUsername[]>("/api/special-usernames", fetcher)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newColor, setNewColor] = useState("")
  const [newRestricted, setNewRestricted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newUsername.trim()) {
      toast.error("Username is required")
      return
    }

    setIsAdding(true)
    try {
      const res = await fetch("/api/special-usernames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          color: newColor || null,
          restricted: newRestricted,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add")
      }

      toast.success("Username added")
      setNewUsername("")
      setNewColor("")
      setNewRestricted(false)
      setIsAddDialogOpen(false)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add username")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/special-usernames?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete")
      }

      toast.success("Username removed")
      mutate()
    } catch (error) {
      toast.error("Failed to delete username")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleRestricted = async (item: SpecialUsername) => {
    try {
      const res = await fetch("/api/special-usernames", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          restricted: item.restricted !== "true",
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update")
      }

      mutate()
    } catch (error) {
      toast.error("Failed to update")
    }
  }

  const handleColorChange = async (item: SpecialUsername, color: string) => {
    try {
      const res = await fetch("/api/special-usernames", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          color: color || null,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update")
      }

      mutate()
    } catch (error) {
      toast.error("Failed to update color")
    }
  }

  const getColorClass = (color: string | null) => {
    const found = colorOptions.find((c) => c.value === (color || ""))
    return found?.class || "text-primary"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Special Usernames
            </CardTitle>
            <CardDescription>
              Manage usernames with custom colors or restrictions
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Special Username</DialogTitle>
                <DialogDescription>
                  Add a username with custom highlighting or restriction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Highlight Color</Label>
                  <select
                    id="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {newColor && (
                    <p className={`text-sm font-medium ${getColorClass(newColor)}`}>
                      Preview: {newUsername || "Username"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restricted"
                    checked={newRestricted}
                    onChange={(e) => setNewRestricted(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="restricted" className="text-sm font-normal">
                    Restricted (guests cannot use this name)
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Username"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!usernames ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : usernames.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No special usernames yet</p>
            <p className="text-sm">Add usernames to apply custom colors or restrictions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {usernames.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className={`font-medium flex-1 ${getColorClass(item.color)}`}>
                  {item.username}
                </span>
                <div className="flex items-center gap-2">
                  {/* Color selector */}
                  <div className="flex items-center gap-1">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={item.color || ""}
                      onChange={(e) => handleColorChange(item, e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-input bg-background"
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Restricted toggle */}
                  <Button
                    variant={item.restricted === "true" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleRestricted(item)}
                    className="gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    {item.restricted === "true" ? "Restricted" : "Open"}
                  </Button>
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
