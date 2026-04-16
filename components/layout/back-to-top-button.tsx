'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MIN_SCROLL_PX = 300
const VIEWPORT_SCROLL_RATIO = 0.35

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const threshold = Math.max(
        MIN_SCROLL_PX,
        Math.round(window.innerHeight * VIEWPORT_SCROLL_RATIO)
      )
      setIsVisible(window.scrollY > threshold)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Back to top"
      onClick={scrollToTop}
      className={[
        'fixed bottom-6 right-6 z-40 rounded-full shadow-lg',
        'transition-all duration-200',
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-2 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <ChevronUp />
    </Button>
  )
}
