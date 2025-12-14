"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import type { Photo } from "@/types"

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick: (index: number) => void
}

// Fade-in image component
interface FadeInImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
}

function FadeInImage({ src, alt, fill, width, height, className = "" }: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={`fade-in-image ${isLoaded ? "loaded" : ""} ${className}`}
      onLoad={handleLoad}
    />
  )
}

// Helper to get the best URL for grid view (prefer thumbnail)
function getGridUrl(photo: Photo): string {
  return photo.thumbnailUrl || photo.url || "/placeholder.svg"
}

export function PhotoGrid({ photos: rawPhotos, onPhotoClick }: PhotoGridProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false)
  
  // Ensure photos is always an array
  const photos = Array.isArray(rawPhotos) ? rawPhotos : []

  // Handle expand with loading state
  const handleExpand = () => {
    setIsLoadingExpanded(true)
    setShowAllPhotos(true)
  }

  // Simulate loading delay for smoother transition
  useEffect(() => {
    if (showAllPhotos && isLoadingExpanded) {
      const timer = setTimeout(() => {
        setIsLoadingExpanded(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [showAllPhotos, isLoadingExpanded])
  
  if (photos.length === 0) return null

  if (photos.length === 1) {
    return (
      <div className="relative rounded-lg overflow-hidden cursor-pointer max-w-[280px]" onClick={() => onPhotoClick(0)}>
        <FadeInImage
          src={getGridUrl(photos[0])}
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
      <div className="grid grid-cols-2 gap-[1vw] max-w-[560px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <FadeInImage src={getGridUrl(photo)} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (photos.length === 3) {
    return (
      <div className="grid grid-cols-3 gap-[1vw] max-w-[560px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <FadeInImage src={getGridUrl(photo)} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (photos.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-[1vw] max-w-[560px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <FadeInImage src={getGridUrl(photo)} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  // 5+ photos: 3-column grid
  const maxVisible = 6
  const remainingCount = photos.length - maxVisible
  const hasMore = remainingCount > 0

  return (
    <>
      <div className="grid grid-cols-3 gap-[1vw] max-w-[560px]">
        {photos.slice(0, maxVisible).map((photo, index) => {
          const isLastVisible = index === maxVisible - 1 && hasMore
          
          return (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
              onClick={() => {
                if (isLastVisible) {
                  handleExpand()
                } else {
                  onPhotoClick(index)
                }
              }}
            >
              <FadeInImage src={getGridUrl(photo)} alt="" fill className="object-cover" />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{remainingCount}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded view for all photos */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">All Photos ({photos.length})</h3>
              <button
                onClick={() => setShowAllPhotos(false)}
                className="text-white hover:text-gray-300 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {isLoadingExpanded ? (
                // Loading skeleton
                Array.from({ length: Math.min(photos.length, 12) }).map((_, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted animate-pulse"
                  />
                ))
              ) : (
                photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setShowAllPhotos(false)
                      onPhotoClick(index)
                    }}
                  >
                    <FadeInImage src={getGridUrl(photo)} alt="" fill className="object-cover" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
