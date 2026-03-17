/**
 * Shared types and step definitions for the Add Provider wizard.
 * Step 1: Basics (businessName*, description*)
 * Step 2: Location & Visibility (address*, city*)
 * Step 3: Program Details (all optional)
 * Step 4: Operations & Media (all optional)
 * Step 5: Review & Submit
 */

export type FaqItem = { id: string; question: string; answer: string }
export type PhotoItem = { key: string; file: File; caption: string }

export const WIZARD_STEPS = [
  { id: 1, label: "Basics", requiredFields: ["businessName", "description"] },
  { id: 2, label: "Location", requiredFields: ["address", "city"] },
  { id: 3, label: "Program", requiredFields: [] },
  { id: 4, label: "Media", requiredFields: [] },
  { id: 5, label: "Review", requiredFields: [] },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"]
