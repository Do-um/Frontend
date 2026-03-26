"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"

const INTRO_DURATION_MS = 2600
const INTRO_LETTERS = ["H", "E", "L", "L", "O"]

export function HomeIntro() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="home-intro" aria-hidden="true">
      <div className="home-intro__backdrop" />
      <div className="home-intro__word">
        {INTRO_LETTERS.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="home-intro__letter"
            style={{ "--intro-delay": `${index * 0.08}s` } as CSSProperties}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}
