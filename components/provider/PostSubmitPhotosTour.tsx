"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import "./profile-tour.css"

const PHOTOS_REMINDER_STORAGE_KEY = "eld:post-submit-photos-tour-shown"

const PHOTOS_REMINDER_STEP = {
  popover: {
    title: "Don't forget to add Photos",
    description:
      "Go to the Photos section to upload images of your facility. Photos help families visualize your space.",
    side: "bottom" as const,
    align: "center" as const,
  },
}

export function PostSubmitPhotosTour({
  show,
  isReady,
}: {
  show: boolean
  isReady: boolean
}) {
  const router = useRouter()
  const hasShown = useRef(false)

  useEffect(() => {
    if (!show || !isReady || hasShown.current) return
    if (typeof window !== "undefined" && sessionStorage.getItem(PHOTOS_REMINDER_STORAGE_KEY) === "1") return

    const timer = setTimeout(() => {
      hasShown.current = true
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.5,
        progressText: "Step 1 of 1",
        nextBtnText: "Next",
        doneBtnText: "Go to Photos",
        prevBtnText: "Back",
        steps: [PHOTOS_REMINDER_STEP],
        popoverClass: "profile-tour-popover",
        onNextClick: (_element, _step, options) => {
          options.driver.destroy()
          router.push("/dashboard/provider/photos")
        },
        onDestroyed: () => {
          try {
            sessionStorage.setItem(PHOTOS_REMINDER_STORAGE_KEY, "1")
          } catch {
            // ignore
          }
        },
      })
      driverObj.drive()
    }, 1000)

    return () => clearTimeout(timer)
  }, [show, isReady, router])

  return null
}
