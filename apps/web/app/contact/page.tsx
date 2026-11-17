import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Nous écrire',
  description: 'Écrire au comité de la famille Wodie.',
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="container page">
        <p className="kicker">Contact</p>
        <h1 className="page-title">Écrire au comité de la famille</h1>
        <p className="lead">
          Une question, une photo à retirer, une information sur l’histoire de la famille ? Le comité lit chaque message.
        </p>
        <div className="page__form">
          <ContactForm />
        </div>
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
