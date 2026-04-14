import { describe, expect, it } from "vitest"
import {
  buildGuestInquiryNotification,
  buildInquiryNotification,
  buildReviewNotification,
} from "@/lib/providerNotificationPayloads"

describe("providerNotifications", () => {
  it("builds parent inquiry notifications", () => {
    expect(
      buildInquiryNotification({
        providerProfileId: "provider-1",
        inquiryId: "inquiry-1",
        fromName: "Sam Parent",
        subject: "Need availability for September",
      })
    ).toMatchObject({
      provider_profile_id: "provider-1",
      type: "inquiry",
      title: "New inquiry from Sam Parent",
      href: "/dashboard/provider/inquiries?open=inquiry-1",
    })
  })

  it("builds guest inquiry notifications", () => {
    expect(
      buildGuestInquiryNotification({
        providerProfileId: "provider-1",
        inquiryId: "guest-1",
        fromName: "Jamie Guest",
      })
    ).toMatchObject({
      provider_profile_id: "provider-1",
      type: "inquiry",
      title: "New inquiry from Jamie Guest",
      message: "Guest inquiry",
    })
  })

  it("builds review notifications with a snippet", () => {
    expect(
      buildReviewNotification({
        providerProfileId: "provider-1",
        reviewId: "review-1",
        rating: 5,
        reviewText: "Amazing staff and communication throughout the year.",
        fromName: "Taylor Parent",
      })
    ).toMatchObject({
      provider_profile_id: "provider-1",
      type: "review",
      title: "New 5★ review from Taylor Parent",
      href: "/dashboard/provider/reviews?open=review-1",
    })
  })
})
