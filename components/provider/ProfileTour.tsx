"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import "./profile-tour.css"

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Welcome",
      description:
        "Let's get your listing ready for families. We'll walk you through each section.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-tab-business]",
    popover: {
      title: "Business Information",
      description:
        "Add your business name, description, contact details, and address. Families use this to find and reach you.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-tab-program]",
    popover: {
      title: "Program Details",
      description:
        "Select age groups, curriculum, languages, and amenities. This helps parents find the right fit.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-tab-operating]",
    popover: {
      title: "Operating Details",
      description: "Set your hours, tuition range, and capacity.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-submit]",
    popover: {
      title: "Submit for approval",
      description:
        "Submit your listing first. We'll review and notify you when it's live.",
      side: "top",
      align: "end",
    },
  },
  {
    element: "[data-tour-photos]",
    popover: {
      title: "Photos",
      description:
        "After submitting, go to Photos to add images. Photos are very important—families use them to visualize your space.",
      side: "bottom",
      align: "center",
    },
  },
]

async function markTourShown() {
  try {
    await fetch("/api/provider/onboarding", { method: "PATCH" })
  } catch {
    // ignore
  }
}

type ProfileTourProps = {
  autoStart?: boolean
  /** When false, the tour waits. Pass true once the page content (tabs, buttons) is rendered. */
  isReady?: boolean
}

export function ProfileTour({ autoStart = false, isReady = true }: ProfileTourProps) {
  const searchParams = useSearchParams()
  const hasStarted = useRef(false)

  useEffect(() => {
    const shouldStart =
      (autoStart || searchParams.get("tour") === "1") && isReady && !hasStarted.current
    if (!shouldStart) return

    const timer = setTimeout(() => {
      hasStarted.current = true
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.5,
        progressText: "Step {{current}} of {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        steps: TOUR_STEPS,
        popoverClass: "profile-tour-popover",
        onDestroyed: () => {
          void markTourShown()
        },
      })
      driverObj.drive()
    }, 500)

    return () => clearTimeout(timer)
  }, [autoStart, isReady, searchParams])

  return null
}
