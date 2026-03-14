export const metadata = {
  title: "About | Early Learning Directory",
  description: "Learn more about the mission behind Early Learning Directory.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            About Early Learning Directory
          </h1>
          <p className="text-muted-foreground">
            We built Early Learning Directory to make finding quality childcare simpler, clearer,
            and less stressful for families.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 space-y-6 text-sm md:text-base text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Our mission</h2>
            <p>
              Our mission is to help parents quickly understand their options, compare trusted
              providers, and feel confident in the childcare decisions they make for their family.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How we help families</h2>
            <p>
              We combine detailed provider profiles, transparent reviews, and clear program
              information to give you a complete picture of each option&mdash;all in one place.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How we help providers</h2>
            <p>
              For providers, we offer tools to showcase their programs, respond to inquiries, and
              build trust with families through verified reviews and up-to-date information.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

