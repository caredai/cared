'use client'

import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from './landing/-site-header'
import { LandingFooter } from './landing/-footer'

export const Route = createFileRoute('/privacy-policy')({
  component: PrivacyPolicy,
})

// Table of contents structure
const TOC = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-collection', title: 'Information Collection' },
  { id: 'information-use', title: 'Information Use' },
  { id: 'information-sharing', title: 'Information Sharing' },
  { id: 'data-security', title: 'Data Security' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'cookies', title: 'Cookies and Tracking Technologies' },
  { id: 'third-party-services', title: 'Third-Party Services' },
  { id: 'children-privacy', title: 'Children Privacy' },
  { id: 'international-transfers', title: 'International Data Transfers' },
  { id: 'changes', title: 'Policy Changes' },
  { id: 'contact', title: 'Contact Us' },
] as const

function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>(TOC[0].id)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    // Initialize refs
    TOC.forEach((item) => {
      const element = document.getElementById(item.id)
      sectionRefs.current[item.id] = element
    })

    // Scroll spy to highlight active section
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150

      for (let i = TOC.length - 1; i >= 0; i--) {
        const item = TOC[i]
        if (!item) continue
        const section = sectionRefs.current[item.id]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(item.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id]
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
          {/* Sidebar Navigation - Hidden on mobile */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <nav className="space-y-1">
                <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </p>
                {TOC.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left font-sans text-sm transition-colors ${
                      activeSection === item.id
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="mt-4 font-sans text-sm text-muted-foreground">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="mt-12 space-y-12">
                {/* Introduction */}
                <section id="introduction" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    1. Introduction
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      CaredMore Inc. (&quot;we&quot;, &quot;our&quot;, or &quot;Cared&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit and use{' '}
                      <a href="https://cared.dev" className="text-foreground underline">
                        https://cared.dev
                      </a>
                      {' '}(the &quot;Service&quot;).
                    </p>
                    <p>
                      By using our Service, you agree to the terms of this Privacy Policy. If you do not agree with any part of this policy, please do not use our Service.
                    </p>
                  </div>
                </section>

                {/* Information Collection */}
                <section id="information-collection" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    2. Information Collection
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>We collect the following types of information:</p>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">2.1 Information You Provide</h3>
                        <ul className="ml-6 mt-2 list-disc space-y-2">
                          <li>Account registration information (name, email address, password)</li>
                          <li>Profile information (avatar, bio, etc.)</li>
                          <li>Payment information (through secure third-party payment processors)</li>
                          <li>Content you create while using the Service (AI agents, conversation records, configurations, etc.)</li>
                          <li>Any information you provide through customer service or feedback channels</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">2.2 Automatically Collected Information</h3>
                        <ul className="ml-6 mt-2 list-disc space-y-2">
                          <li>Device information (device type, operating system, browser type and version)</li>
                          <li>IP address and geolocation information</li>
                          <li>Usage data (access times, page views, clickstream data)</li>
                          <li>Cookies and similar tracking technologies (see Section 7 for details)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Information Use */}
                <section id="information-use" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    3. Information Use
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>We use the collected information for the following purposes:</p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>To provide, maintain, and improve our Service</li>
                      <li>To process your transactions and manage your account</li>
                      <li>To communicate with you (including service updates, security notices, and customer support)</li>
                      <li>To personalize your experience and recommend relevant content</li>
                      <li>To detect, prevent, and address technical issues, fraud, or abuse</li>
                      <li>To comply with legal obligations and enforce our Terms of Service</li>
                      <li>To conduct data analysis to improve service quality and user experience</li>
                      <li>To send marketing communications (with your consent, which you can opt out of at any time)</li>
                    </ul>
                  </div>
                </section>

                {/* Information Sharing */}
                <section id="information-sharing" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    4. Information Sharing
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">4.1 Service Providers</h3>
                        <p>
                          We may share information with third-party service providers who help us operate the Service, including cloud storage, payment processing, analytics, customer support, etc. These service providers are only authorized to use your information for the purposes necessary to provide the service.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">4.2 Legal Requirements</h3>
                        <p>
                          We may disclose your information if required by law or to protect our rights, property, or safety, or to protect the rights, property, or safety of users or the public.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">4.3 Business Transfers</h3>
                        <p>
                          If a merger, acquisition, asset sale, or other business transfer occurs, your information may be transferred to the new owner.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">4.4 With Your Consent</h3>
                        <p>We may share your information with other parties with your explicit consent.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Security */}
                <section id="data-security" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    5. Data Security
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      We employ industry-standard security measures to protect your personal information, including encryption, access controls, security audits, etc. However, no data transmission or storage system is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                    </p>
                    <p>
                      We recommend that you use strong passwords, do not share your account credentials with others, and remain vigilant when using public networks.
                    </p>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    6. Your Rights
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>Under applicable data protection laws, you may have the following rights:</p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        <strong>Right of Access:</strong> You may request access to personal information we hold about you
                      </li>
                      <li>
                        <strong>Right of Rectification:</strong> You may request correction of inaccurate or incomplete personal information
                      </li>
                      <li>
                        <strong>Right of Erasure:</strong> Under certain circumstances, you may request deletion of your personal information
                      </li>
                      <li>
                        <strong>Right to Restrict Processing:</strong> You may request restriction of our processing of your personal information
                      </li>
                      <li>
                        <strong>Right to Data Portability:</strong> You may request to receive your data in a structured, commonly used, and machine-readable format
                      </li>
                      <li>
                        <strong>Right to Object:</strong> You may object to our processing of your personal information for certain purposes
                      </li>
                      <li>
                        <strong>Right to Withdraw Consent:</strong> If processing is based on your consent, you may withdraw consent at any time
                      </li>
                    </ul>
                    <p>
                      To exercise these rights, please contact us at{' '}
                      <a href="mailto:privacy@cared.dev" className="text-foreground underline">
                        privacy@cared.dev
                      </a>.
                    </p>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    7. Cookies and Tracking Technologies
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      We use cookies and similar technologies to collect information and improve your experience. Cookies are small text files stored on your device.
                    </p>
                    <p>We use the following types of cookies:</p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        <strong>Essential Cookies:</strong> These cookies are necessary for basic website functionality and cannot be disabled
                      </li>
                      <li>
                        <strong>Functional Cookies:</strong> These cookies allow the website to remember your choices and provide enhanced features
                      </li>
                      <li>
                        <strong>Analytics Cookies:</strong> These cookies help us understand how visitors use the website
                      </li>
                      <li>
                        <strong>Marketing Cookies:</strong> These cookies are used to track visitors to deliver relevant advertising
                      </li>
                    </ul>
                    <p>
                      You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of the Service.
                    </p>
                  </div>
                </section>

                {/* Third Party Services */}
                <section id="third-party-services" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    8. Third-Party Services
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Our Service may contain links to third-party websites, services, or applications. We are not responsible for the privacy practices of these third parties. We recommend that you carefully read the privacy policies of these third parties.
                    </p>
                    <p>
                      Third-party services we integrate include, but are not limited to: cloud service providers, payment processors, analytics services, AI model providers, etc. These services may have their own privacy policies, and we recommend that you review the relevant terms.
                    </p>
                  </div>
                </section>

                {/* Children Privacy */}
                <section id="children-privacy" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    9. Children Privacy
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Our Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected such information, we will delete it immediately. If you are a parent or guardian and discover that your child has provided us with personal information, please contact us.
                    </p>
                  </div>
                </section>

                {/* International Transfers */}
                <section id="international-transfers" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    10. International Data Transfers
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Your information may be transferred to and processed in locations outside your country or region. By using our Service, you consent to the transfer of your information to these locations. We will take appropriate measures to ensure your information is adequately protected and complies with applicable data protection laws.
                    </p>
                  </div>
                </section>

                {/* Changes */}
                <section id="changes" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    11. Policy Changes
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      We may update this Privacy Policy from time to time. Material changes will be notified to you via email or by posting a notice on the website. We recommend that you review this policy periodically to stay informed.
                    </p>
                    <p>
                      The &quot;Last Updated&quot; date at the top of this policy indicates when it was last revised. Continued use of the Service indicates your acceptance of the revised policy.
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    12. Contact Us
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>If you have any questions, comments, or concerns about this Privacy Policy, please contact us:</p>
                    <div className="space-y-2">
                      <p>
                        <strong>Company Name:</strong> CaredMore Inc.
                      </p>
                      <p>
                        <strong>Website:</strong>{' '}
                        <a href="https://cared.dev" className="text-foreground underline">
                          https://cared.dev
                        </a>
                      </p>
                      <p>
                        <strong>Privacy Inquiries:</strong>{' '}
                        <a href="mailto:privacy@cared.dev" className="text-foreground underline">
                          privacy@cared.dev
                        </a>
                      </p>
                      <p>
                        <strong>General Inquiries:</strong>{' '}
                        <a href="mailto:contact@cared.dev" className="text-foreground underline">
                          contact@cared.dev
                        </a>
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
      <LandingFooter />
    </>
  )
}
