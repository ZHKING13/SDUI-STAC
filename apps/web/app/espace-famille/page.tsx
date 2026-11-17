import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

// Page d'attente : la connexion à l'espace famille arrive avec le lot 2 (comptes).
export const metadata: Metadata = {
  title: 'Espace famille',
  robots: { index: false, follow: false },
};

export default function FamilySpacePage() {
  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="container page">
        <p className="kicker">Espace famille</p>
        <h1 className="page-title">L’espace famille ouvre bientôt</h1>
        <p className="lead">
          La gazette, l’agenda, les archives et l’arbre généalogique seront accessibles ici aux membres de la famille.
        </p>
        <p className="body-text">
          En attendant, vous pouvez <Link href="/#rejoindre">demander à rejoindre la famille</Link> : un référent de votre
          branche validera votre demande.
        </p>
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
