import { ProgramCard } from "@/components/program-card"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  programTypeToCardShape,
} from "@/lib/program-types"

export const metadata = {
  title: "Decision Support Programs | Twooky",
  description: "Review available childcare program types in your parent decision support dashboard.",
}

export default async function ParentDecisionSupportProgramsPage() {
  const [rows, ageGroupsById] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
  ])
  const programs = rows.map((row) => programTypeToCardShape(row, ageGroupsById))

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-8">
        <h1 className="text-2xl font-semibold text-foreground">Program Decision Support</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Explore all available childcare program types and open each one to review details, benefits,
          and frequently asked questions.
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {programs.length > 0 ? (
            programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={{
                  ...program,
                  href: `/dashboard/parent/decision-support/programs/${program.slug}`,
                }}
                compact
              />
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              No program types available at the moment.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
