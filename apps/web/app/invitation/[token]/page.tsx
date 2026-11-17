import type { Metadata } from 'next';
import type { InvitationPreviewDto } from '@famille/shared';
import { AcceptInvitationForm } from '@/components/AuthForms';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ApiError, apiFetch } from '@/lib/session';

export const metadata: Metadata = { title: 'Invitation', robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invitation: InvitationPreviewDto | null = null;
  let problem: string | null = null;
  try {
    invitation = await apiFetch<InvitationPreviewDto>(`/invitations/${encodeURIComponent(token)}`, { auth: false });
  } catch (error) {
    problem = error instanceof ApiError ? error.message : 'Le service est momentanément indisponible.';
  }

  return (
    <>
      <SiteHeader familyName="Famille Wodie" />
      <main id="contenu" className="container page">
        <p className="kicker">Invitation</p>
        <h1 className="page-title">Rejoindre l’espace famille</h1>
        {invitation ? (
          <>
            <p className="lead">
              Cette invitation est destinée à <strong>{invitation.email}</strong>. Vérifiez votre nom et choisissez un mot de
              passe.
            </p>
            <div className="page__form">
              <AcceptInvitationForm token={token} firstName={invitation.firstName} lastName={invitation.lastName} />
            </div>
          </>
        ) : (
          <p className="lead">
            {problem} Si vous avez déjà un compte, <a href="/connexion">connectez-vous</a>.
          </p>
        )}
      </main>
      <SiteFooter familyName="Famille Wodie" />
    </>
  );
}
