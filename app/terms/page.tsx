export const metadata = {
  title: "Terms of Service | Twooky",
  description: "Review the Terms of Service for using Twooky.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            These Terms of Service describe the rules and conditions for using Early Learning
            Directory. By accessing or using the site, you agree to these terms.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 space-y-6 text-sm md:text-base text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Overview</h2>
            <p>
              Twooky is a discovery platform that helps families find childcare
              providers. We do not own or operate the providers listed on the site.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Use of the Service</h2>
            <p>
              You agree to use the site only for lawful purposes, and not to misrepresent your
              identity, submit fraudulent reviews, or attempt to interfere with the operation of
              the platform.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Reviews and Content</h2>
            <p>
              Reviews and other user-submitted content should be honest, respectful, and based on
              real experiences. We reserve the right to moderate or remove content that violates
              our policies.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. No Professional Advice</h2>
            <p>
              Information on Twooky is provided for general informational
              purposes only and should not be considered professional, legal, medical, or licensing
              advice.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Changes to These Terms</h2>
            <p>
              We may update these Terms of Service from time to time. If we make material changes,
              we will update the effective date at the top of this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

