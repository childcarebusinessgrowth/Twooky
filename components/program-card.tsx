import Link from "next/link"
import { Baby, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { iconMap, type ProgramCardData } from "@/lib/program-types"

interface ProgramCardProps {
  program: ProgramCardData
  compact?: boolean
}

export function ProgramCard({ program, compact = false }: ProgramCardProps) {
  const Icon = iconMap[program.icon] ?? Baby

  if (compact) {
    return (
      <Link href={`/programs/${program.slug}`} className="group block h-full">
        <Card className="h-full rounded-3xl border-border/60 bg-linear-to-b from-card to-card/70 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/30 cursor-pointer">
          <CardContent className="p-6 md:p-7 flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="relative h-14 w-14 rounded-2xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-sm" />
                <Icon className="relative h-7 w-7 text-primary" />
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary/80">
                {program.ageGroupLabel}
              </span>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {program.title}
            </h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {program.shortDescription}
            </p>

            <div className="mt-5 border-t border-border/60 pt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Explore program
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/programs/${program.slug}`}>
      <Card className="h-full rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{program.title}</h3>
              <p className="text-sm text-muted-foreground">
                {program.shortDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
