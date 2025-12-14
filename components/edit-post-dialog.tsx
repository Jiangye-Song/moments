"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar, Loader2, Plus, X, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import type { Post, Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadPhotos, type UploadProgress } from "@/lib/upload"

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
  const [endDate, setEndDate] = useState(post.endDate ? format(new Date(post.endDate), "yyyy-MM-dd") : "")
  const [photos, setPhotos] = useState<Photo[]>(post.photos)
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<{ file: File; preview: string }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [reorderSelection, setReorderSelection] = useState<number[]>([])
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

  // Combined items for reordering (existing photos + new previews)
  type CombinedItem = { type: 'existing'; index: number; photo: Photo } | { type: 'new'; index: number; preview: { file: File; preview: string } }
  
  const getCombinedItems = (): CombinedItem[] => {
    const existingItems: CombinedItem[] = photos.map((photo, index) => ({ type: 'existing', index, photo }))
    const newItems: CombinedItem[] = newPhotoPreviews.map((preview, index) => ({ type: 'new', index, preview }))
    return [...existingItems, ...newItems]
  }

  const handleItemClick = (combinedIndex: number) => {
    if (!isReordering) return
    
    setReorderSelection((prev) => {
      if (prev.includes(combinedIndex)) {
        return prev.filter((i) => i !== combinedIndex)
      }
      return [...prev, combinedIndex]
    })
  }

  const startReordering = () => {
    setIsReordering(true)
    setReorderSelection([])
  }

  const finishReordering = () => {
    if (reorderSelection.length > 0) {
      const combinedItems = getCombinedItems()
      
      // Get selected items in tap order
      const selectedItems = reorderSelection
        .map((idx) => combinedItems[idx])
        .filter((item): item is CombinedItem => !!item)
      
      // Get remaining items
      const remainingItems = combinedItems.filter((_, idx) => !reorderSelection.includes(idx))
      
      // Combine and separate back into photos and newPhotoPreviews
      const reorderedItems = [...selectedItems, ...remainingItems]
      
      const newPhotos: Photo[] = []
      const newPreviews: { file: File; preview: string }[] = []
      
      for (const item of reorderedItems) {
        if (item.type === 'existing') {
          newPhotos.push(item.photo)
        } else {
          newPreviews.push(item.preview)
        }
      }
      
      setPhotos(newPhotos)
      setNewPhotoPreviews(newPreviews)
    }
    setIsReordering(false)
    setReorderSelection([])
  }

  const cancelReordering = () => {
    setIsReordering(false)
    setReorderSelection([])
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
        setUploadProgress(null)
        
        const files = newPhotoPreviews.map((p) => p.file)
        const result = await uploadPhotos(files, setUploadProgress)
        uploadedPhotos = result.uploadedPhotos
        
        if (result.failedUploads.length > 0) {
          toast.warning(`${result.failedUploads.length} file(s) failed to upload: ${result.failedUploads.join(", ")}`)
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
        body: JSON.stringify({ title, description, date, endDate: endDate || undefined, photos: allPhotos }),
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
      setUploadProgress(null)
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
            <div className="flex items-center justify-between">
              <Label>Photos ({totalPhotos})</Label>
              {totalPhotos > 1 && !isReordering && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startReordering}
                  className="h-7 text-xs"
                >
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Reorder
                </Button>
              )}
              {isReordering && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelReordering}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={finishReordering}
                    className="h-7 text-xs"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
            {isReordering && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Tap photos in the order you want them. Unselected photos will be added to the end.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Existing photos */}
              {photos.map((photo, index) => {
                const combinedIndex = index
                const selectionIndex = reorderSelection.indexOf(combinedIndex)
                const isSelected = selectionIndex !== -1
                
                return (
                  <div 
                    key={photo.url} 
                    className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer ${
                      isReordering ? 'ring-2 ring-offset-2 ' + (isSelected ? 'ring-primary' : 'ring-transparent') : ''
                    }`}
                    onClick={() => handleItemClick(combinedIndex)}
                  >
                    <Image
                      src={photo.url || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {isReordering && isSelected && (
                      <div className="absolute top-1 left-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {selectionIndex + 1}
                      </div>
                    )}
                    {!isReordering && (
                      <button onClick={() => handleRemoveExistingPhoto(index)} className="icon-close-btn">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                )
              })}

              {/* New photo previews */}
              {newPhotoPreviews.map(({ preview }, index) => {
                const combinedIndex = photos.length + index
                const selectionIndex = reorderSelection.indexOf(combinedIndex)
                const isSelected = selectionIndex !== -1
                
                return (
                  <div 
                    key={preview} 
                    className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer ${
                      isReordering ? 'ring-2 ring-offset-2 ' + (isSelected ? 'ring-primary' : 'ring-transparent') : ''
                    }`}
                    onClick={() => handleItemClick(combinedIndex)}
                  >
                    <Image
                      src={preview || "/placeholder.svg"}
                      alt={`New photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {!isReordering && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-medium text-white bg-primary/80 px-2 py-0.5 rounded">New</span>
                      </div>
                    )}
                    {isReordering && isSelected && (
                      <div className="absolute top-1 left-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {selectionIndex + 1}
                      </div>
                    )}
                    {!isReordering && (
                      <button onClick={() => handleRemoveNewPhoto(index)} className="icon-close-btn">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Add photo button */}
              {!isReordering && (
                <button onClick={() => fileInputRef.current?.click()} className="add-photo-btn">
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
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10" />
              </div>
              <span className="text-muted-foreground text-sm">to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="pl-10"
                  min={date}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">End date is optional. Leave empty for single-day events.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isReordering}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading && uploadProgress 
                  ? `Uploading [${uploadProgress.current}/${uploadProgress.total}]` 
                  : "Saving..."}
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
