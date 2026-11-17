import type { Metadata } from 'next';
import { ConfirmLoginLinkForm } from '@/components/AuthForms';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: false } };

export default async function LoginLinkPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="container page">
        <p className="kicker">Espace famille</p>
        <h1 className="page-title">Bienvenue</h1>
        {token ? (
          <>
            <p className="lead">Cliquez sur le bouton pour ouvrir votre session.</p>
            <div className="page__form">
              <ConfirmLoginLinkForm token={token} />
            </div>
          </>
        ) : (
          <p className="lead">
            Ce lien est incomplet. <a href="/connexion">Demandez un nouveau lien de connexion</a>.
          </p>
        )}
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
