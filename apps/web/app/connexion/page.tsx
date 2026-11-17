import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginLinkForm, PasswordLoginForm } from '@/components/AuthForms';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getMe, safeNextPath } from '@/lib/session';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  if (await getMe()) redirect(safeNextPath(suite));

  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="container page">
        <p className="kicker">Espace famille</p>
        <h1 className="page-title">Connexion</h1>
        <div className="split">
          <section aria-labelledby="mot-de-passe" className="split__col">
            <h2 id="mot-de-passe" className="rubric">
              Avec mon mot de passe
            </h2>
            <PasswordLoginForm next={suite} />
          </section>
          <section aria-labelledby="lien" className="split__col">
            <h2 id="lien" className="rubric">
              Sans mot de passe
            </h2>
            <LoginLinkForm />
          </section>
        </div>
        <p className="note">
          Pas encore de compte ? <a href="/#rejoindre">Demandez à rejoindre la famille</a>.
        </p>
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
