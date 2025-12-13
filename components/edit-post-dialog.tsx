"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import type { Post, Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

interface EditPostDialogProps {
  post: Post
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function EditPostDialog({ post, open, onClose, onUpdate }: EditPostDialogProps) {
  const [title, setTitle] = useState(post.title || "")
  const [description, setDescription] = useState(post.description)
  const [date, setDate] = useState(format(new Date(post.date), "yyyy-MM-dd"))
  const [photos, setPhotos] = useState<Photo[]>(post.photos)
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<{ file: File; preview: string }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      toast.error(`Some files are too large (max 10MB per file): ${oversizedFiles.map(f => f.name).join(", ")}`)
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
      toast.error("A post must have at least one photo")
      return
    }

    setIsSaving(true)
    try {
      let uploadedPhotos: Photo[] = []
      if (newPhotoPreviews.length > 0) {
        setIsUploading(true)
        setUploadProgress(0)
        
        const failedUploads: string[] = []

        // Upload each file one at a time (request presigned URL via GET, then upload)
        for (let i = 0; i < newPhotoPreviews.length; i++) {
          const { file } = newPhotoPreviews[i]

          try {
            // Get presigned URL using GET with query params (avoids body size issues)
            const params = new URLSearchParams({
              name: file.name,
              type: file.type,
            })
            const presignedRes = await fetch(`/api/upload?${params}`)

            if (!presignedRes.ok) {
              const contentType = presignedRes.headers.get("content-type")
              if (contentType?.includes("application/json")) {
                const error = await presignedRes.json()
                throw new Error(error.error || `Failed to get upload URL (${presignedRes.status})`)
              } else {
                const text = await presignedRes.text()
                throw new Error(`Server error (${presignedRes.status}): ${text.slice(0, 50)}`)
              }
            }

            const uploadInfo = await presignedRes.json()
            
            if (!uploadInfo?.presignedUrl) {
              throw new Error("Invalid upload URL received")
            }

            // Upload to B2 using presigned URL
            const uploadRes = await fetch(uploadInfo.presignedUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            })

            if (!uploadRes.ok) {
              throw new Error(`B2 upload failed with status ${uploadRes.status}`)
            }

            uploadedPhotos.push({
              id: crypto.randomUUID(),
              url: uploadInfo.publicUrl,
            })
          } catch (uploadError) {
            console.error(`Upload error for ${file.name}:`, uploadError)
            failedUploads.push(file.name)
          }

          setUploadProgress(Math.round(((i + 1) / newPhotoPreviews.length) * 100))
        }
        
        if (failedUploads.length > 0) {
          toast.warning(`${failedUploads.length} file(s) failed to upload: ${failedUploads.join(", ")}`)
        }
        
        setIsUploading(false)
      }

      // Combine existing and new photos
      const allPhotos = [...photos, ...uploadedPhotos]
      
      if (allPhotos.length === 0) {
        throw new Error("No photos available for the post")
      }

      await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, date, photos: allPhotos }),
      })

      // Clean up previews
      newPhotoPreviews.forEach(({ preview }) => URL.revokeObjectURL(preview))
      setNewPhotoPreviews([])

      onUpdate()
      onClose()
    } catch (error) {
      console.error("Save failed:", error)
      const message = error instanceof Error ? error.message : "Failed to save changes"
      toast.error(message)
    } finally {
      setIsSaving(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const totalPhotos = photos.length + newPhotoPreviews.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Photos ({totalPhotos})</Label>
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
                  <button onClick={() => handleRemoveExistingPhoto(index)} className="icon-close-btn">
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
                  <button onClick={() => handleRemoveNewPhoto(index)} className="icon-close-btn">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              <button onClick={() => fileInputRef.current?.click()} className="add-photo-btn">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </button>
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your moment a title"
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
                {isUploading ? `Uploading... ${uploadProgress}%` : "Saving..."}
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
