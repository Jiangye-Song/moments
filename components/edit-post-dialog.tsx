"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Loader2, Plus, X } from "lucide-react"
import type { Post, Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditPostDialogProps {
  post: Post
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function EditPostDialog({ post, open, onClose, onUpdate }: EditPostDialogProps) {
  const [description, setDescription] = useState(post.description)
  const [date, setDate] = useState(format(new Date(post.date), "yyyy-MM-dd"))
  const [photos, setPhotos] = useState<Photo[]>(post.photos)
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<{ file: File; preview: string }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Max 9 photos total
    const totalPhotos = photos.length + newPhotoPreviews.length + files.length
    if (totalPhotos > 9) {
      alert(`You can only have up to 9 photos. Currently have ${photos.length + newPhotoPreviews.length}.`)
      return
    }

    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewPhotoPreviews((prev) => [...prev, ...previews])
  }

  const handleRemoveExistingPhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    if (photos.length === 0 && newPhotoPreviews.length === 0) {
      alert("A post must have at least one photo")
      return
    }

    setIsSaving(true)
    try {
      let uploadedPhotos: Photo[] = []
      if (newPhotoPreviews.length > 0) {
        setIsUploading(true)
        const uploadPromises = newPhotoPreviews.map(async ({ file }) => {
          const formData = new FormData()
          formData.append("file", file)
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          const data = await res.json()
          return { url: data.url }
        })
        uploadedPhotos = await Promise.all(uploadPromises)
        setIsUploading(false)
      }

      // Combine existing and new photos
      const allPhotos = [...photos, ...uploadedPhotos]

      await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, date, photos: allPhotos }),
      })

      // Clean up previews
      newPhotoPreviews.forEach(({ preview }) => URL.revokeObjectURL(preview))
      setNewPhotoPreviews([])

      onUpdate()
      onClose()
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  const totalPhotos = photos.length + newPhotoPreviews.length
  const canAddMore = totalPhotos < 9

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Photos ({totalPhotos}/9)</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Existing photos */}
              {photos.map((photo, index) => (
                <div key={photo.url} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => handleRemoveExistingPhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}

              {/* New photo previews */}
              {newPhotoPreviews.map(({ preview }, index) => (
                <div key={preview} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={`New photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-white bg-primary/80 px-2 py-0.5 rounded">New</span>
                  </div>
                  <button
                    onClick={() => handleRemoveNewPhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              {canAddMore && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddPhotos}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
