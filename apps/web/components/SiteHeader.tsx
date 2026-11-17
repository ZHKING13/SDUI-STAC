import Link from 'next/link';

const NAV = [
  { href: '/#histoire', label: 'Notre histoire' },
  { href: '/#racines', label: 'Nos racines' },
  { href: '/#rassemble', label: 'Ce qui nous rassemble' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader({ familyName }: { familyName: string }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand">
          {familyName}
        </Link>
        <nav aria-label="Navigation du site public" className="site-header__nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/espace-famille" className="button button--outline button--small site-header__cta">
          <LockIcon />
          Espace famille
        </Link>
      </div>
    </header>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
