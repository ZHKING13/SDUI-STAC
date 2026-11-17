import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getPrivacyPolicy } from '@/lib/api';

// Doit rester une valeur littérale (contrainte de Next.js) ; identique à REVALIDATE_SECONDS.
export const revalidate = 300;
export const metadata: Metadata = { title: 'Politique de confidentialité' };

export default async function PrivacyPage() {
  const content = await getPrivacyPolicy();
  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="page">
        <LegalPage content={content} />
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
