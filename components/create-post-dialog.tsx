"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { X, ImagePlus, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { Photo } from "@/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

interface CreatePostDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { photos: Photo[]; description: string; date: string }) => Promise<void>
}

export function CreatePostDialog({ open, onClose, onSubmit }: CreatePostDialogProps) {
  const [photos, setPhotos] = useState<{ id: string; url: string; file?: File }[]>([])
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check file sizes before adding
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      toast.error(`Some files are too large (max 10MB per file): ${oversizedFiles.map(f => f.name).join(", ")}`)
      return
    }

    // Create preview URLs
    const newPhotos = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo && photo.file) {
        URL.revokeObjectURL(photo.url)
      }
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (photos.length === 0) return

    setIsSubmitting(true)
    try {
      // Upload photos to blob storage
      const formData = new FormData()
      photos.forEach((photo) => {
        if (photo.file) {
          formData.append("files", photo.file)
        }
      })

      setIsUploading(true)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || `Upload failed with status ${uploadRes.status}`)
      }

      const uploadedPhotos: Photo[] = await uploadRes.json()
      setIsUploading(false)

      await onSubmit({
        photos: uploadedPhotos,
        description,
        date,
      })

      // Reset form
      setPhotos([])
      setDescription("")
      setDate(format(new Date(), "yyyy-MM-dd"))
      onClose()
    } catch (error) {
      console.error("Failed to create post:", error)
      const message = error instanceof Error ? error.message : "Failed to create post"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    // Clean up object URLs
    photos.forEach((photo) => {
      if (photo.file) {
        URL.revokeObjectURL(photo.url)
      }
    })
    setPhotos([])
    setDescription("")
    setDate(format(new Date(), "yyyy-MM-dd"))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Moment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10" />
            </div>
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={photo.url || "/placeholder.svg"} alt="" fill className="object-cover" />
                  <button onClick={() => removePhoto(photo.id)} className="icon-close-btn">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}

              <button onClick={() => fileInputRef.current?.click()} className="add-photo-btn">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={photos.length === 0 || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Posting..."}
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
