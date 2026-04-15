"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import "./profile-tour.css"

const FULL_TOUR_STEPS: DriveStep[] = [
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
      description:
        "Set your opening and closing hours, daily fee range, and pricing details so families know what to expect.",
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
]

const SPROUT_TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Welcome",
      description:
        "Let's get your basic listing ready for families. We'll walk through the fields needed for your Sprout submission.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-business-name]",
    popover: {
      title: "Business Name",
      description: "Enter the name families will see in the directory.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-location]",
    popover: {
      title: "Location",
      description: "Add your address so parents know where your program is located.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-type]",
    popover: {
      title: "Provider Type",
      description: "Select the provider type or types you want displayed on your listing.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-verification]",
    popover: {
      title: "Verification Documents",
      description: "Upload at least one verification document for admin review before submitting.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-submit]",
    popover: {
      title: "Submit",
      description: "Submit your basic listing when these fields are complete. The admin team will review it.",
      side: "left",
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
  variant?: "full" | "sprout"
}

export function ProfileTour({
  autoStart = false,
  isReady = true,
  variant = "full",
}: ProfileTourProps) {
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
        steps: variant === "sprout" ? SPROUT_TOUR_STEPS : FULL_TOUR_STEPS,
        popoverClass: "profile-tour-popover",
        onDestroyed: () => {
          void markTourShown()
        },
      })
      driverObj.drive()
    }, 500)

    return () => clearTimeout(timer)
  }, [autoStart, isReady, searchParams, variant])

  return null
}
