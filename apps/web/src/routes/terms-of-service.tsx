import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { LandingFooter } from './landing/-footer'
import { SiteHeader } from './landing/-site-header'

export const Route = createFileRoute('/terms-of-service')({
  component: TermsOfService,
})

// Table of contents structure
const TOC = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'description', title: 'Service Description' },
  { id: 'account', title: 'Account Registration and Security' },
  { id: 'usage', title: 'Usage Rules' },
  { id: 'content', title: 'User Content' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'payment', title: 'Payment and Billing' },
  { id: 'termination', title: 'Termination' },
  { id: 'disclaimers', title: 'Disclaimers' },
  { id: 'limitation', title: 'Limitation of Liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'changes', title: 'Changes to Terms' },
  { id: 'contact', title: 'Contact Us' },
] as const

function TermsOfService() {
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
                Terms of Service
              </h1>
              <p className="mt-4 font-sans text-sm text-muted-foreground">
                Last Updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              <div className="mt-12 space-y-12">
                {/* Introduction */}
                <section id="introduction" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    1. Introduction
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Welcome to Cared. These Terms of Service (&quot;Terms&quot;) constitute a
                      legal agreement between you and CaredMore Inc. (&quot;we&quot;,
                      &quot;our&quot;, or &quot;Cared&quot;) regarding your use of{' '}
                      <a href="https://cared.dev" className="text-foreground underline">
                        https://cared.dev
                      </a>{' '}
                      and its related services (the &quot;Service&quot;).
                    </p>
                    <p>
                      Please read these Terms carefully. By accessing or using our Service, you
                      agree to be bound by these Terms. If you do not agree to any part of these
                      Terms, please do not use our Service.
                    </p>
                  </div>
                </section>

                {/* Acceptance */}
                <section id="acceptance" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    2. Acceptance of Terms
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      By accessing or using the Service, you represent that you have read,
                      understood, and agree to be bound by these Terms and our Privacy Policy. If
                      you are using the Service on behalf of an organization, you represent and
                      warrant that you have the authority to accept these Terms on behalf of that
                      organization.
                    </p>
                    <p>
                      If you do not agree to these Terms, you must immediately stop using the
                      Service. We reserve the right to refuse service to anyone at any time.
                    </p>
                  </div>
                </section>

                {/* Description */}
                <section id="description" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    3. Service Description
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Cared is an AI agent infrastructure platform that provides unified APIs and
                      toolkits for building, deploying, and running AI agents. Our Service includes,
                      but is not limited to:
                    </p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>AI model gateway and unified API</li>
                      <li>Tool integration and management</li>
                      <li>Sandbox execution environments</li>
                      <li>Memory and knowledge base management</li>
                      <li>Authentication and authorization services</li>
                      <li>Database and storage services</li>
                      <li>Application building and deployment tools</li>
                    </ul>
                    <p>
                      We reserve the right to modify, suspend, or terminate any Service features at
                      any time without notice. We are not liable for any interruptions or errors in
                      the Service.
                    </p>
                  </div>
                </section>

                {/* Account */}
                <section id="account" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    4. Account Registration and Security
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">4.1 Account Registration</h3>
                        <p>
                          To use certain Service features, you need to create an account. You agree
                          to provide accurate, complete, and up-to-date information and to maintain
                          and update such information to keep it accurate.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">4.2 Account Security</h3>
                        <p>
                          You are responsible for maintaining the confidentiality of your account
                          credentials and for all activities under your account. You agree to:
                        </p>
                        <ul className="ml-6 mt-2 list-disc space-y-2">
                          <li>
                            Immediately notify us of any unauthorized account use or security breach
                          </li>
                          <li>Ensure you log out from your account (if using shared devices)</li>
                          <li>Use strong passwords and change them regularly</li>
                          <li>Not make any unauthorized use of your account credentials</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">4.3 Account Eligibility</h3>
                        <p>
                          You must be at least 13 years old to use the Service. If you are under 18,
                          you must use the Service under the supervision of a parent or guardian. We
                          reserve the right to request proof of age at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Usage */}
                <section id="usage" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    5. Usage Rules
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>You agree not to use the Service to:</p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        Violate any applicable laws, regulations, rules, or ordinances, or encourage
                        others to violate them
                      </li>
                      <li>
                        Infringe upon the intellectual property, privacy rights, or other rights of
                        others
                      </li>
                      <li>
                        Transmit any malicious code, viruses, worms, trojans, or other harmful or
                        destructive code
                      </li>
                      <li>
                        Attempt to gain unauthorized access to the Service, other accounts, computer
                        systems, or networks connected to the Service
                      </li>
                      <li>
                        Interfere with or disrupt the integrity or performance of the Service or
                        interfere with other users&apos; use of the Service
                      </li>
                      <li>
                        Collect or store personal information of other users without explicit
                        consent
                      </li>
                      <li>
                        Use the Service for any illegal, fraudulent, false, or misleading activities
                      </li>
                      <li>
                        Create or disseminate spam, unsolicited marketing messages, or harassing
                        content
                      </li>
                      <li>
                        Use automated systems (bots, crawlers, etc.) to access the Service unless
                        explicitly authorized
                      </li>
                      <li>
                        Circumvent or attempt to circumvent any security measures or access
                        restrictions
                      </li>
                      <li>
                        Use the Service to develop or distribute AI applications that may cause harm
                        (such as deepfakes, malware, etc.)
                      </li>
                    </ul>
                    <p>
                      Violation of these Terms may result in immediate termination of your account
                      and access, and may subject you to legal liability.
                    </p>
                  </div>
                </section>

                {/* Content */}
                <section id="content" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    6. User Content
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">6.1 Content Ownership</h3>
                        <p>
                          You retain all rights to any content you create, upload, post, or transmit
                          through the Service (&quot;User Content&quot;). You grant us a
                          non-exclusive, worldwide, royalty-free, sublicensable license to use,
                          copy, modify, distribute, and display User Content solely for the purpose
                          of providing and improving the Service.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          6.2 Content Responsibility
                        </h3>
                        <p>
                          You represent and warrant that you own or have the right to license User
                          Content and that User Content does not infringe upon any third-party
                          rights. You are solely responsible for User Content.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">6.3 Content Review</h3>
                        <p>
                          We reserve the right to review, edit, delete, or refuse to publish any
                          User Content, but we have no obligation to do so. We are not responsible
                          for the accuracy, completeness, or quality of User Content.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">6.4 Content Deletion</h3>
                        <p>
                          If you delete User Content or terminate your account, we may delete
                          related content from active systems within a reasonable time, but backups
                          and caches may still exist.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual-property" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    7. Intellectual Property
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      The Service and all its content, features, and technology (including but not
                      limited to software, text, graphics, logos, icons, images, audio clips,
                      digital downloads, data compilations, and software) are the property of
                      CaredMore Inc. or its licensors and are protected by international copyright,
                      trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                    <p>
                      These Terms do not grant you any rights, title, or interest in the Service or
                      its content, except as expressly stated. You may not copy, modify, distribute,
                      sell, lease, rent, reverse engineer, or create derivative works of the Service
                      without our prior written permission.
                    </p>
                    <p>
                      &quot;Cared&quot; and related logos are our trademarks. You may not use these
                      trademarks without our prior written permission.
                    </p>
                  </div>
                </section>

                {/* Payment */}
                <section id="payment" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    8. Payment and Billing
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">8.1 Paid Services</h3>
                        <p>
                          Certain Service features may require paid subscriptions or pay-as-you-go
                          pricing. All fees are calculated in USD or other specified currencies and
                          charged when you use the Service.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">8.2 Pricing Changes</h3>
                        <p>
                          We reserve the right to change Service prices at any time. Price changes
                          will be notified to you via email or in-service notification before they
                          take effect. Continued use of the Service indicates your acceptance of the
                          new prices.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">8.3 Payment Methods</h3>
                        <p>
                          You agree to pay all fees using a valid payment method. You are
                          responsible for keeping your payment information up to date. If payment
                          fails, we may suspend or terminate your Service access.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">8.4 Refund Policy</h3>
                        <p>
                          Unless required by law or we state otherwise in writing, all payments are
                          final and non-refundable. Subscription fees are charged for the
                          subscription period, and early cancellation does not result in a pro-rated
                          refund.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">8.5 Taxes</h3>
                        <p>
                          You are responsible for paying all taxes, duties, and government charges
                          (if any) related to your use of the Service. We may collect and remit
                          taxes when required by applicable law.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Termination */}
                <section id="termination" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    9. Termination
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">9.1 Termination by You</h3>
                        <p>
                          You may terminate your account at any time by deleting your account or
                          ceasing to use the Service. Certain services may require specific
                          cancellation procedures.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">9.2 Termination by Us</h3>
                        <p>
                          We reserve the right to terminate or suspend your account and access to
                          the Service at any time, with or without cause, including but not limited
                          to violation of these Terms, prolonged inactivity, or legal requirements.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">9.3 Effect of Termination</h3>
                        <p>
                          Upon termination, your right to access the Service will immediately cease.
                          We may delete or disable your account and related User Content. We are not
                          liable for any loss or damage resulting from termination.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Disclaimers */}
                <section id="disclaimers" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    10. Disclaimers
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      The Service is provided on an &quot;as is&quot; and &quot;as available&quot;
                      basis. To the maximum extent permitted by law, we expressly disclaim all
                      warranties, express or implied, including but not limited to:
                    </p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        Merchantability, fitness for a particular purpose, or non-infringement of
                        the Service
                      </li>
                      <li>That the Service will be uninterrupted, timely, secure, or error-free</li>
                      <li>
                        The accuracy or reliability of any information or results obtained through
                        the Service
                      </li>
                      <li>That defects in the Service will be corrected</li>
                      <li>
                        That the Service or servers are free of viruses or other harmful components
                      </li>
                    </ul>
                    <p>
                      Some jurisdictions do not allow the exclusion of implied warranties, so the
                      above exclusion may not apply to you.
                    </p>
                  </div>
                </section>

                {/* Limitation */}
                <section id="limitation" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    11. Limitation of Liability
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      To the maximum extent permitted by law, CaredMore Inc., its affiliates,
                      licensors, service providers, employees, agents, officers, and directors shall
                      not be liable for any indirect, incidental, special, consequential, or
                      punitive damages, including but not limited to loss of profits, data loss,
                      loss of goodwill, or other intangible losses, whether based on contract, tort
                      (including negligence), strict liability, or other theory, even if we have
                      been advised of the possibility of such damages.
                    </p>
                    <p>
                      Our total liability (whether based on contract, tort, or other theory) shall
                      not exceed the amount you paid to us in the transaction giving rise to the
                      claim, or one hundred dollars ($100), whichever is greater.
                    </p>
                    <p>
                      Some jurisdictions do not allow the limitation of liability for incidental or
                      consequential damages, so the above limitation may not apply to you.
                    </p>
                  </div>
                </section>

                {/* Indemnification */}
                <section id="indemnification" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    12. Indemnification
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      You agree to indemnify, defend, and hold harmless CaredMore Inc., its
                      affiliates, licensors, service providers, and their respective employees,
                      agents, officers, and directors from any claims, liabilities, damages, losses,
                      and expenses (including reasonable attorneys&apos; fees) arising from:
                    </p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>Your use or misuse of the Service</li>
                      <li>Your violation of these Terms</li>
                      <li>Your infringement of any third-party rights</li>
                      <li>Your User Content</li>
                    </ul>
                    <p>
                      We reserve the right to assume exclusive defense and control of any such
                      matter, and you agree to cooperate with our defense.
                    </p>
                  </div>
                </section>

                {/* Governing Law */}
                <section id="governing-law" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    13. Governing Law
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      These Terms shall be governed by the laws of the State of California, United
                      States, without regard to its conflict of law principles. Any disputes arising
                      from these Terms or the Service shall be submitted to the competent courts of
                      California.
                    </p>
                    <p>
                      If you are located in the European Union or other jurisdictions, you may have
                      additional consumer rights, and these Terms do not affect those rights.
                    </p>
                  </div>
                </section>

                {/* Changes */}
                <section id="changes" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    14. Changes to Terms
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      We reserve the right to modify these Terms at any time. Material changes will
                      be notified to you via email or by posting a notice on the website. We
                      recommend that you review these Terms periodically to stay informed.
                    </p>
                    <p>
                      The &quot;Last Updated&quot; date at the top of these Terms indicates when
                      they were last revised. Continued use of the Service indicates your acceptance
                      of the revised Terms. If you do not agree to the revised Terms, you must stop
                      using the Service.
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-24">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                    15. Contact Us
                  </h2>
                  <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    <p>
                      If you have any questions, comments, or concerns about these Terms of Service,
                      please contact us:
                    </p>
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
                        <strong>Legal Inquiries:</strong>{' '}
                        <a href="mailto:legal@cared.dev" className="text-foreground underline">
                          legal@cared.dev
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
