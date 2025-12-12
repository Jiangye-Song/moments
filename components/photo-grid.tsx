"use client"

import Image from "next/image"
import type { Photo } from "@/types"

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick: (index: number) => void
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (photos.length === 0) return null

  if (photos.length === 1) {
    return (
      <div className="relative rounded-lg overflow-hidden cursor-pointer max-w-[280px]" onClick={() => onPhotoClick(0)}>
        <Image
          src={photos[0].url || "/placeholder.svg"}
          alt=""
          width={280}
          height={280}
          className="object-cover w-full h-auto max-h-[280px]"
        />
      </div>
    )
  }

  if (photos.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 max-w-[280px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <Image src={photo.url || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (photos.length === 3) {
    return (
      <div className="grid grid-cols-3 gap-1 max-w-[280px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <Image src={photo.url || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (photos.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 max-w-[200px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <Image src={photo.url || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  // 5+ photos: 3-column grid
  return (
    <div className="grid grid-cols-3 gap-1 max-w-[280px]">
      {photos.slice(0, 9).map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
          onClick={() => onPhotoClick(index)}
        >
          <Image src={photo.url || "/placeholder.svg"} alt="" fill className="object-cover" />
          {index === 8 && photos.length > 9 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">+{photos.length - 9}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
