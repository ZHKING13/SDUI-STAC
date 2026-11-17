import type { Metadata } from 'next';
import Link from 'next/link';
import { isStaff } from '@famille/shared';
import { FamilyNav } from '@/components/family/FamilyNav';
import { logoutAction } from '@/app/auth-actions';
import { requireMe } from '@/lib/session';

export const metadata: Metadata = {
  title: { default: 'Espace famille', template: '%s · Espace famille Wodie' },
  robots: { index: false, follow: false },
};

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMe();
  const nav = [
    { href: '/espace-famille', label: 'La une' },
    { href: '/espace-famille/annuaire', label: 'Annuaire' },
    { href: '/espace-famille/profil', label: 'Mon profil' },
    ...(isStaff(me.role) ? [{ href: '/espace-famille/admin', label: 'Administration' }] : []),
  ];

  return (
    <>
      <header className="masthead">
        <div className="container">
          <div className="masthead__top">
            <span className="masthead__edition">{capitalize(monthFormat.format(new Date()))}</span>
            <div className="masthead__user">
              <span>
                {me.firstName} {me.lastName}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="link-button">
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
          <Link href="/espace-famille" className="masthead__title">
            La Gazette de la famille Wodie
          </Link>
          <FamilyNav items={nav} />
        </div>
      </header>
      <main id="contenu" className="container page page--family">
        {children}
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Link href="/">Voir la vitrine publique</Link>
          <span>Espace privé : ce que vous voyez ici n’est visible que par les membres.</span>
        </div>
      </footer>
    </>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
