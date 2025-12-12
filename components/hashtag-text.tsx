"use client"

import { Fragment } from "react"

interface HashtagTextProps {
  text: string
  onHashtagClick?: (hashtag: string) => void
}

export function HashtagText({ text, onHashtagClick }: HashtagTextProps) {
  // Split text by hashtags while preserving them
  const hashtagRegex = /(#[\w\u4e00-\u9fff]+)/g
  const parts = text.split(hashtagRegex)

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(hashtagRegex)) {
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                onHashtagClick?.(part)
              }}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </button>
          )
        }
        return <Fragment key={index}>{part}</Fragment>
      })}
    </>
  )
}
