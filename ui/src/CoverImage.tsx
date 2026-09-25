import { useState } from 'react'

interface CoverImageProps {
  src: string
  alt: string
  loading?: 'eager' | 'lazy'
}

/** Show a quiet local placeholder when an upstream cover is missing or unavailable. */
export function CoverImage({ src, alt, loading = 'eager' }: CoverImageProps) {
  const [failedSource, setFailedSource] = useState('')

  if (!src || failedSource === src) {
    return (
      <div className="mw-cover-fallback" aria-hidden="true">
        <span>✦</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailedSource(src)}
    />
  )
}
