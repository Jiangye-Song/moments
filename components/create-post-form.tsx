"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { X, ImagePlus, Calendar, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Photo } from "@/types"

interface CreatePostFormProps {
  onCreated: () => void
}

export function CreatePostForm({ onCreated }: CreatePostFormProps) {
  const [photos, setPhotos] = useState<{ id: string; url: string; file?: File }[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

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
    setIsUploading(true)
    
    try {
      const photosToUpload = photos.filter((p) => p.file)
      
      if (photosToUpload.length === 0) {
        throw new Error("No valid photos to upload")
      }
      
      const uploadedPhotos: Photo[] = []
      const failedUploads: string[] = []

      // Upload each file one at a time (request presigned URL via GET, then upload)
      for (let i = 0; i < photosToUpload.length; i++) {
        const photo = photosToUpload[i]
        if (!photo.file) continue

        console.log(`[Upload ${i + 1}/${photosToUpload.length}] Starting upload for: ${photo.file.name}`)

        try {
          // Get presigned URL using GET with query params
          const params = new URLSearchParams({
            name: photo.file.name,
            type: photo.file.type,
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
            body: photo.file,
            headers: {
              "Content-Type": photo.file.type,
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
          console.error(`Upload error for ${photo.file.name}:`, uploadError)
          failedUploads.push(photo.file.name)
        }
      }

      setIsUploading(false)

      // Check if any uploads succeeded
      if (uploadedPhotos.length === 0) {
        throw new Error(`All uploads failed: ${failedUploads.join(", ")}`)
      }
      
      // Warn about partial failures
      if (failedUploads.length > 0) {
        toast.warning(`${failedUploads.length} file(s) failed to upload: ${failedUploads.join(", ")}`)
      }

      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: uploadedPhotos,
          title,
          description,
          date,
        }),
      })

      // Reset form
      setPhotos([])
      setTitle("")
      setDescription("")
      setDate(format(new Date(), "yyyy-MM-dd"))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onCreated()
    } catch (error) {
      console.error("Failed to create post:", error)
      const message = error instanceof Error ? error.message : "Failed to create post"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
        <CardDescription>Add a new moment to your feed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Give your moment a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

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
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}

            <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-muted-foreground/50 transition-colors"
              >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </button>
          </div>
          <p className="text-xs text-muted-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>

        <Button onClick={handleSubmit} disabled={photos.length === 0 || isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Uploading..." : "Posting..."}
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Posted!
            </>
          ) : (
            "Create Post"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
