"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

interface PhotoViewerProps {
  photos: Photo[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const SWIPE_THRESHOLD = 50
const ZOOM_SENSITIVITY = 0.002

export function PhotoViewer({ photos, initialIndex, open, onClose }: PhotoViewerProps) {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  // Zoom and pan state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Horizontal swipe drag state (finger-following)
  const [dragOffset, setDragOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeAxisRef = useRef<"none" | "horizontal" | "vertical">("none")

  // Image loading state - track which photo ids have finished loading the full-res image
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const markLoaded = useCallback((id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])
  const isImageLoading = !loadedIds.has(photos[currentIndex]?.id ?? "")
  
  // Refs for gesture tracking
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  
  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTouchDistanceRef = useRef<number | null>(null)
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null)
  const isPinchingRef = useRef(false)
  const isDraggingRef = useRef(false)
  
  // Mouse drag state
  const isMouseDraggingRef = useRef(false)
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null)

  // Reset zoom when changing images
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    setCurrentIndex(initialIndex)
    resetZoom()
  }, [initialIndex, resetZoom])

  // (loading state is now derived per-photo from loadedIds)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const goToPrev = useCallback(() => {
    resetZoom()
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }, [photos.length, resetZoom])

  const goToNext = useCallback(() => {
    resetZoom()
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }, [photos.length, resetZoom])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") {
        if (scale > 1) {
          resetZoom()
        } else {
          onClose()
        }
      }
      if (e.key === "ArrowLeft") goToPrev()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, currentIndex, scale, goToPrev, goToNext, onClose, resetZoom])

  // Constrain position to keep image within reasonable bounds
  const constrainPosition = useCallback((pos: { x: number; y: number }, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 }
    
    const container = containerRef.current
    if (!container) return pos
    
    const maxOffset = (currentScale - 1) * Math.min(container.clientWidth, container.clientHeight) / 2
    
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, pos.x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, pos.y))
    }
  }, [])

  // Get distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Get center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    }
  }

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - potential swipe or pan
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      }
      swipeAxisRef.current = "none"
      if (scale > 1) {
        isDraggingRef.current = true
      }
    } else if (e.touches.length === 2) {
      // Two finger touch - pinch zoom
      isPinchingRef.current = true
      isDraggingRef.current = false
      setIsSwiping(false)
      setDragOffset(0)
      lastTouchDistanceRef.current = getTouchDistance(e.touches)
      lastTouchCenterRef.current = getTouchCenter(e.touches)
    }
  }, [scale])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      // Pinch zoom (touch-action: none on container prevents browser default)
      const distance = getTouchDistance(e.touches)
      const center = getTouchCenter(e.touches)
      
      if (distance && lastTouchDistanceRef.current && center) {
        const scaleDelta = distance / lastTouchDistanceRef.current
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleDelta))
        setScale(newScale)
        
        // Pan while pinching
        if (lastTouchCenterRef.current) {
          const dx = center.x - lastTouchCenterRef.current.x
          const dy = center.y - lastTouchCenterRef.current.y
          setPosition(prev => constrainPosition({
            x: prev.x + dx,
            y: prev.y + dy
          }, newScale))
        }
        
        lastTouchCenterRef.current = center
      }
      lastTouchDistanceRef.current = distance
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      // Pan when zoomed
      const touch = e.touches[0]
      if (touchStartRef.current) {
        const dx = touch.clientX - touchStartRef.current.x
        const dy = touch.clientY - touchStartRef.current.y
        setPosition(prev => constrainPosition({
          x: prev.x + dx,
          y: prev.y + dy
        }, scale))
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: touchStartRef.current.time
        }
      }
    } else if (e.touches.length === 1 && scale <= 1 && touchStartRef.current && photos.length > 1) {
      // Horizontal swipe with finger-following
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y

      // Lock axis after small movement
      if (swipeAxisRef.current === "none") {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          swipeAxisRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical"
          if (swipeAxisRef.current === "horizontal") {
            setIsSwiping(true)
          }
        }
      }

      if (swipeAxisRef.current === "horizontal") {
        setDragOffset(dx)
      }
    }
  }, [scale, constrainPosition, photos.length])


  // Pending commit: when set, the track first animates to ±containerWidth,
  // then on transition end we swap currentIndex and snap dragOffset back to 0.
  const pendingCommitRef = useRef<"prev" | "next" | null>(null)

  const commitSwipe = useCallback(
    (direction: "prev" | "next") => {
      const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
      pendingCommitRef.current = direction
      setIsSwiping(false) // re-enable transition
      // Animate track fully off in the swipe direction
      setDragOffset(direction === "next" ? -containerWidth : containerWidth)
    },
    []
  )

  const handleTrackTransitionEnd = useCallback(() => {
    const pending = pendingCommitRef.current
    if (!pending) return
    pendingCommitRef.current = null
    // Swap index and reset drag without animation
    setIsSwiping(true) // disable transition for the snap
    setDragOffset(0)
    if (pending === "next") {
      goToNext()
    } else {
      goToPrev()
    }
    // Re-enable transitions on next frame so future swipes animate again
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsSwiping(false))
    })
  }, [goToNext, goToPrev])

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isPinchingRef.current && e.touches.length < 2) {
      isPinchingRef.current = false
      lastTouchDistanceRef.current = null
      lastTouchCenterRef.current = null
      
      // If zoomed out below 1, snap back
      if (scale < 1) {
        resetZoom()
      }
    }
    
    if (e.touches.length === 0 && touchStartRef.current && !isPinchingRef.current) {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
      const dx = touchEnd.x - touchStartRef.current.x
      const dy = touchEnd.y - touchStartRef.current.y
      const elapsed = Date.now() - touchStartRef.current.time

      // Horizontal swipe commit - finger-following
      if (scale <= 1 && swipeAxisRef.current === "horizontal" && photos.length > 1) {
        const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
        const velocity = Math.abs(dx) / Math.max(elapsed, 1) // px/ms
        const distanceThreshold = containerWidth * 0.2
        const velocityThreshold = 0.4

        if (Math.abs(dx) > distanceThreshold || velocity > velocityThreshold) {
          commitSwipe(dx > 0 ? "prev" : "next")
        } else {
          // Snap back to current
          setIsSwiping(false)
          setDragOffset(0)
        }
      } else if (scale <= 1 && elapsed < 300 && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < Math.abs(dx)) {
        // Fallback quick swipe (no axis lock triggered)
        commitSwipe(dx > 0 ? "prev" : "next")
      } else {
        setIsSwiping(false)
        setDragOffset(0)
      }
    }

    swipeAxisRef.current = "none"
    isDraggingRef.current = false
    touchStartRef.current = null
  }, [scale, resetZoom, photos.length, commitSwipe])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (1 + delta)))
    
    // Zoom toward cursor position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const cursorX = e.clientX - rect.left - rect.width / 2
      const cursorY = e.clientY - rect.top - rect.height / 2
      
      if (newScale > scale) {
        // Zooming in - move toward cursor
        const factor = (newScale - scale) / scale
        setPosition(prev => constrainPosition({
          x: prev.x - cursorX * factor * 0.5,
          y: prev.y - cursorY * factor * 0.5
        }, newScale))
      } else if (newScale < scale) {
        // Zooming out - move toward center
        const factor = (scale - newScale) / scale
        setPosition(prev => constrainPosition({
          x: prev.x * (1 - factor),
          y: prev.y * (1 - factor)
        }, newScale))
      }
    }
    
    setScale(newScale)
    
    // Reset if zoomed out to 1
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale, constrainPosition])

  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault()
      isMouseDraggingRef.current = true
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMouseDraggingRef.current && lastMousePosRef.current && scale > 1) {
      const dx = e.clientX - lastMousePosRef.current.x
      const dy = e.clientY - lastMousePosRef.current.y
      
      setPosition(prev => constrainPosition({
        x: prev.x + dx,
        y: prev.y + dy
      }, scale))
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [scale, constrainPosition])

  const handleMouseUp = useCallback(() => {
    isMouseDraggingRef.current = false
    lastMousePosRef.current = null
  }, [])

  // Double tap/click to zoom
  const lastTapRef = useRef<number>(0)
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (scale > 1) {
        resetZoom()
      } else {
        // Zoom to 2x at tap position
        const clientX = 'touches' in e ? e.changedTouches?.[0]?.clientX ?? 0 : e.clientX
        const clientY = 'touches' in e ? e.changedTouches?.[0]?.clientY ?? 0 : e.clientY
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const cursorX = clientX - rect.left - rect.width / 2
          const cursorY = clientY - rect.top - rect.height / 2
          
          setScale(2.5)
          setPosition(constrainPosition({
            x: -cursorX * 0.6,
            y: -cursorY * 0.6
          }, 2.5))
        }
      }
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }, [scale, resetZoom, constrainPosition])

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Image counter and zoom indicator - vertically aligned with close button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm flex gap-4 h-10 items-center">
        <span>{currentIndex + 1} / {photos.length}</span>
        {scale > 1 && <span>{Math.round(scale * 100)}%</span>}
      </div>

      {/* Small loading indicator at top-left while full-resolution image loads */}
      {isImageLoading && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white text-xs bg-black/40 rounded-full px-3 h-10">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {/* Main image container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none"
        style={{ cursor: scale > 1 ? (isMouseDraggingRef.current ? 'grabbing' : 'grab') : 'default' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleDoubleTap}
      >
        {/* Horizontal track holding prev/current/next slides */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${dragOffset}px, 0, 0)`,
            transition: isSwiping ? "none" : "transform 250ms ease-out",
            willChange: "transform",
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName === "transform") handleTrackTransitionEnd()
          }}
        >
          {[-1, 0, 1].map((offset) => {
            const idx =
              photos.length > 1
                ? (currentIndex + offset + photos.length) % photos.length
                : currentIndex
            const isCurrent = offset === 0
            // Don't render neighbors if only one photo
            if (offset !== 0 && photos.length <= 1) return null
            const photo = photos[idx]
            const loaded = loadedIds.has(photo.id)
            return (
              <div
                key={photo.id}
                className="absolute inset-0"
                style={{
                  transform: `translate3d(${offset * 100}%, 0, 0)`,
                }}
              >
                <div
                  ref={isCurrent ? imageRef : undefined}
                  className="relative w-full h-full"
                  style={
                    isCurrent
                      ? {
                          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                          transformOrigin: "center center",
                          transition: "transform 75ms",
                        }
                      : undefined
                  }
                >
                  {/* Thumbnail: always rendered so neighbors are visible during swipe
                      and the current slide has something to show while full-res loads. */}
                  {photo.thumbnailUrl && (
                    <Image
                      src={photo.thumbnailUrl}
                      alt=""
                      fill
                      className="object-contain pointer-events-none select-none"
                      unoptimized
                      draggable={false}
                    />
                  )}
                  {/* Full-resolution image: only loaded for the current slide,
                      so the loading indicator triggers on each navigation. */}
                  {isCurrent && (
                    <Image
                      src={photo.url || "/placeholder.svg"}
                      alt=""
                      fill
                      className={`object-contain pointer-events-none select-none transition-opacity duration-300 ${
                        loaded ? "opacity-100" : "opacity-0"
                      }`}
                      priority
                      draggable={false}
                      onLoad={() => markLoaded(photo.id)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation buttons - hide when zoomed */}
      {photos.length > 1 && scale <= 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 hidden sm:flex"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 hidden sm:flex"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Reset zoom button - show when zoomed */}
      {scale > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-20 right-4 z-10 text-white hover:bg-white/10"
          onClick={resetZoom}
        >
          {t("resetZoom")}
        </Button>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              className={`relative h-12 w-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex ? "border-white" : "border-transparent opacity-50"
              }`}
              onClick={() => {
                resetZoom()
                setCurrentIndex(index)
              }}
            >
              <Image src={photo.thumbnailUrl || photo.url || "/placeholder.svg"} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
