"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function PostCardSkeleton() {
  return (
    <article className="border-b border-border py-4">
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0">
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-24 mb-2" />

          {/* Description skeleton */}
          <div className="space-y-2 mb-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Photo grid skeleton */}
          <Skeleton className="aspect-[4/3] w-full max-w-[560px] rounded-lg" />

          {/* Footer skeleton */}
          <div className="flex items-center justify-between mt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>

          {/* Interactions skeleton */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </article>
  )
}

export function MomentsFeedSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex">
          {/* Timeline skeleton */}
          <div className="flex-shrink-0 w-12 sm:w-16 md:w-20 pr-2 sm:pr-4 md:pr-6 text-right">
            {i === 1 && (
              <>
                <Skeleton className="h-6 sm:h-8 md:h-9 w-full mb-1" />
                <Skeleton className="h-4 sm:h-5 md:h-6 w-8 sm:w-10 ml-auto" />
              </>
            )}
          </div>
          
          {/* Timeline line skeleton */}
          <div className="flex-shrink-0 w-px bg-border relative">
            <Skeleton className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" />
          </div>
          
          {/* Posts skeleton */}
          <div className="flex-1 pl-2 sm:pl-4 md:pl-6">
            <PostCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}
