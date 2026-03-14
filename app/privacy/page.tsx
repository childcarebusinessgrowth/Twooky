export const metadata = {
  title: "Privacy Policy | Early Learning Directory",
  description: "Learn how Early Learning Directory collects, uses, and protects your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Your privacy is important to us. This policy explains what information we collect, how
            we use it, and the choices you have.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 space-y-6 text-sm md:text-base text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as when you create an account,
              submit inquiries to providers, or write reviews. We also collect limited usage data
              to understand how the site is used.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Information</h2>
            <p>
              We use your information to operate and improve Early Learning Directory, connect
              parents with providers, personalize content, and communicate with you about your
              account and activity.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Sharing with Providers</h2>
            <p>
              When you contact a provider through the platform, we share the details you submit
              (such as your name and contact information) with that provider so they can respond to
              your inquiry.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Your Choices</h2>
            <p>
              You can update or delete your account information at any time, and you may opt out of
              non-essential communications. Some usage of the service may require basic contact
              information.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please reach out through our{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact page
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

