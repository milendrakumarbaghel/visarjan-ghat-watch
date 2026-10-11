import { useId } from 'react'

/** The app mark: a water drop holding a lotus. */
export function BrandMark({ className = 'size-10' }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-drop`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#4cc3f5" />
          <stop offset="0.55" stopColor="#1e8fd6" />
          <stop offset="1" stopColor="#0f8a7b" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M24 1.5C24 1.5 3.5 24.5 3.5 36.5a20.5 20.5 0 0 0 41 0C44.5 24.5 24 1.5 24 1.5Z" fill={`url(#${id}-drop)`} />
      <path d="M24 1.5C24 1.5 9 19 6.5 31c6-10 13-16 17.5-18.5Z" fill={`url(#${id}-shine)`} />
      <g fill="#fff">
        <path d="M24 23c4.2 4.6 4.8 10.6 0 17-4.8-6.4-4.2-12.4 0-17Z" />
        <path d="M23 40.5c-6.4-.4-10.6-4.6-11.6-10.6 5.4.8 9.6 4.6 11.6 10.6Z" opacity="0.92" />
        <path d="M25 40.5c6.4-.4 10.6-4.6 11.6-10.6-5.4.8-9.6 4.6-11.6 10.6Z" opacity="0.92" />
        <path d="M14 43.2c6.6 2.6 13.4 2.6 20 0-6.4 4.4-13.6 4.4-20 0Z" opacity="0.8" />
      </g>
    </svg>
  )
}
