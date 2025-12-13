"use client"
import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, Loader2, User } from "lucide-react"
import type { ProfileSettings } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileEditorProps {
  profile?: ProfileSettings
  onUpdate: () => void
}

export function ProfileEditor({ profile, onUpdate }: ProfileEditorProps) {
  const [name, setName] = useState(profile?.name || "Moments")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "")
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl || "")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File, type: "avatar" | "banner") => {
    const setUploading = type === "avatar" ? setIsUploadingAvatar : setIsUploadingBanner
    const setUrl = type === "avatar" ? setAvatarUrl : setBannerUrl

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const [photo] = await res.json()
      setUrl(photo.url)
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl: avatarUrl || null,
          bannerUrl: bannerUrl || null,
        }),
      })
      onUpdate()
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Customize your profile picture, banner, and display name</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Banner Preview */}
        <div className="space-y-2">
          <Label>Banner Image</Label>
          <div
            className="relative h-40 rounded-lg overflow-hidden bg-muted cursor-pointer group"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerUrl ? (
              <Image src={bannerUrl || "/placeholder.svg"} alt="Banner" fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-primary/20 to-muted" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploadingBanner ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file, "banner")
            }}
          />
        </div>

        {/* Avatar Preview */}
        <div className="space-y-2">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-4">
            <div
              className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl ? (
                <Image src={avatarUrl || "/placeholder.svg"} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Click to upload a new profile picture</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file, "avatar")
            }}
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
