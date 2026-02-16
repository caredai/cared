import { SiteHeader } from './-site-header'
import { LandingHero } from './-hero'
import { LandingMetrics } from './-metrics'
import { LandingDevelopers } from './-developers'
import { LandingFeatures } from './-features'
import { LandingBento } from './-bento'
import { LandingCodeBlock } from './-code-block'
import { LandingStackDiagram } from './-stack-diagram'
import { LandingHowItWorks } from './-how-it-works'
import { LandingPricingTease } from './-pricing-tease'
import { LandingFaq } from './-faq'
import { LandingCta } from './-cta'
import { LandingFooter } from './-footer'

export function Landing() {
  return (
    <>
      <SiteHeader />

      <div className="min-h-screen bg-background">
        <LandingHero />
        <LandingMetrics />
        <LandingDevelopers />
        <LandingFeatures />
        <LandingBento />
        <LandingCodeBlock />
        <LandingStackDiagram />
        <LandingHowItWorks />
        <LandingPricingTease />
        <LandingFaq />
        <LandingCta />
        <LandingFooter />
      </div>
    </>
  )
}
