import { SiDiscord, SiGithub, SiX } from '@icons-pack/react-simple-icons'
import { Link } from '@tanstack/react-router'

const FOOTER_LINKS = {
  products: [
    { label: 'AI Gateway', to: '/ai-gateway' },
    { label: 'Sandbox', to: '/sandbox' },
    { label: 'Memory', to: '/memory' },
    { label: 'Tools', to: '/tools' },
    { label: 'Auth', to: '/auth' },
    { label: 'Sites', to: '/sites' },
    { label: 'Functions', to: '/functions' },
    { label: 'Database', to: '/database' },
    { label: 'Storage', to: '/storage' },
    { label: 'Graph', to: '/graph' },
    { label: 'Workflow', to: '/workflow' },
  ],
  apps: [
    { label: 'Chat', to: '/chat' },
    { label: 'Hands', to: '/hands' },
    { label: 'Flow', to: '/flow' },
  ],
  resources: [
    { label: 'Docs', to: '/docs' },
    { label: 'Pricing', to: '/pricing' },
  ],
  company: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms-of-service' },
  ],
} as const

const SOCIAL_LINKS = [
  {
    href: 'https://x.com',
    ariaLabel: 'X (Twitter)',
    Icon: SiX,
  },
  {
    href: 'https://discord.gg',
    ariaLabel: 'Discord',
    Icon: SiDiscord,
  },
  {
    href: 'https://github.com',
    ariaLabel: 'GitHub',
    Icon: SiGithub,
  },
] as const

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; to: string }[]
}) {
  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link
              to={link.to}
              className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-mono text-sm font-semibold tracking-tight text-foreground">Cared</p>
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              Use, build, deploy, and run agents with one platform.
            </p>
          </div>

          <FooterColumn title="Products" links={FOOTER_LINKS.products} />
          <FooterColumn title="Apps" links={FOOTER_LINKS.apps} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} CaredMore Inc.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs"
            aria-label="Social links"
          >
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.ariaLabel}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.ariaLabel}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <social.Icon size={20} className="block" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
