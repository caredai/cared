import { LandingBento } from './-bento'
import { LandingCodeBlock } from './-code-block'
import { LandingCta } from './-cta'
import { LandingDevelopers } from './-developers'
import { LandingFaq } from './-faq'
import { LandingFeatures } from './-features'
import { LandingFooter } from './-footer'
import { LandingHero } from './-hero'
import { LandingHowItWorks } from './-how-it-works'
import { LandingMetrics } from './-metrics'
import { LandingPricingTease } from './-pricing-tease'
import { SiteHeader } from './-site-header'
import { LandingStackDiagram } from './-stack-diagram'

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
