import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getLegalNotice } from '@/lib/api';

// Doit rester une valeur littérale (contrainte de Next.js) ; identique à REVALIDATE_SECONDS.
export const revalidate = 300;
export const metadata: Metadata = { title: 'Mentions légales' };

export default async function LegalNoticePage() {
  const content = await getLegalNotice();
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
