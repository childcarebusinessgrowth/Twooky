"use client"

type WizardStepHeaderProps = {
  title: string
  description?: string
}

export function WizardStepHeader({ title, description }: WizardStepHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
