import Link from 'next/link';

export function SiteFooter({ familyName }: { familyName: string }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span className="site-footer__brand">{familyName}</span>
        <nav aria-label="Liens utiles" className="site-footer__links">
          <Link href="/contact">Nous écrire</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
        </nav>
        <span>Les informations des membres ne sont jamais publiques.</span>
      </div>
    </footer>
  );
}
