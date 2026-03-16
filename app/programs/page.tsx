import { ProgramCard } from "@/components/program-card"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  programTypeToCardShape,
} from "@/lib/program-types"

export const metadata = {
  title: "Childcare Programs | Early Learning Directory",
  description: "Explore different types of childcare programs including infant care, toddler care, preschool, Montessori, home daycare, and after school programs.",
}

export default async function ProgramsPage() {
  const [rows, ageGroupsById] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
  ])
  const programs = rows.map((row) => programTypeToCardShape(row, ageGroupsById))

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Childcare Programs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the right program for your child. From infant care to after-school programs, 
            we help you understand your options.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.length > 0 ? (
              programs.map((program) => (
                <ProgramCard key={program.id} program={program} compact />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No program types available at the moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Choosing the Right Program
            </h2>
            <div className="prose prose-muted">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every child is unique, and finding the right childcare program depends on your 
                child&apos;s age, developmental needs, your family&apos;s schedule, and your educational 
                preferences. Here are some factors to consider:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Age and developmental stage:</strong> Infant care programs focus on nurturing and attachment, while preschool programs emphasize kindergarten readiness.</li>
                <li><strong className="text-foreground">Educational philosophy:</strong> Montessori, Reggio Emilia, play-based, and academic approaches each offer different benefits.</li>
                <li><strong className="text-foreground">Schedule needs:</strong> Full-time, part-time, and drop-in options are available at different providers.</li>
                <li><strong className="text-foreground">Location and convenience:</strong> Consider proximity to home or work, parking, and transportation options.</li>
                <li><strong className="text-foreground">Budget:</strong> Costs vary significantly by program type and location. Many providers offer sibling discounts or financial assistance.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
