import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GROUP_TYPE_LABELS, isStaff, type GroupDto, type InvitationDto, type JoinRequestDto } from '@famille/shared';
import { GroupForm, InviteForm, JoinRequestCard } from '@/components/family/AdminForms';
import { apiFetch, requireMe } from '@/lib/session';

export const metadata: Metadata = { title: 'Administration' };

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

export default async function AdminPage() {
  const me = await requireMe();
  if (!isStaff(me.role)) redirect('/espace-famille');
  const [requests, groups, invitations] = await Promise.all([
    apiFetch<JoinRequestDto[]>('/admin/join-requests'),
    apiFetch<GroupDto[]>('/groups'),
    apiFetch<InvitationDto[]>('/admin/invitations'),
  ]);

  return (
    <>
      <p className="kicker">Administration</p>
      <h1 className="page-title">Faire entrer la famille</h1>

      <section aria-labelledby="demandes" className="admin-section">
        <h2 id="demandes" className="rubric">
          Demandes d’adhésion ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <p className="body-text">Aucune demande en attente.</p>
        ) : (
          requests.map((request) => <JoinRequestCard key={request.id} request={request} groups={groups} />)
        )}
      </section>

      <div className="split">
        <section aria-labelledby="inviter" className="split__col admin-section">
          <h2 id="inviter" className="rubric">
            Inviter un membre
          </h2>
          <InviteForm groups={groups} />
          {invitations.length > 0 && (
            <ul className="plain-list plain-list--ruled">
              {invitations.map((i) => (
                <li key={i.id}>
                  {i.firstName} {i.lastName} <span className="note">· {i.email} ·{' '}
                  {i.acceptedAt ? 'acceptée' : new Date(i.expiresAt) < new Date() ? 'expirée' : `envoyée le ${dateFormat.format(new Date(i.createdAt))}`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="groupes" className="split__col admin-section">
          <h2 id="groupes" className="rubric">
            Groupes et branches
          </h2>
          {me.role === 'ADMIN' && <GroupForm />}
          <ul className="plain-list plain-list--ruled">
            {groups.map((g) => (
              <li key={g.id}>
                {g.name}{' '}
                <span className="note">
                  · {GROUP_TYPE_LABELS[g.type]} · {g.memberCount} membre{g.memberCount > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
