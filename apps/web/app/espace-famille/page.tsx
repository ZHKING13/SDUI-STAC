import Link from 'next/link';
import { GROUP_TYPE_LABELS, isStaff, type JoinRequestDto } from '@famille/shared';
import { apiFetch, requireMe } from '@/lib/session';

const UPCOMING = [
  { title: 'La gazette et le carnet', text: 'Naissances, mariages, avis de décès, rencontres et annonces de la famille.' },
  { title: 'L’agenda', text: 'Les réunions et rendez-vous, avec les réponses de chacun et l’heure de votre pays.' },
  { title: 'Les archives', text: 'Actes, photos anciennes et comptes rendus, rangés par dossier et protégés par branche.' },
  { title: 'L’arbre généalogique', text: 'Toutes les branches de la famille et le lien de parenté entre deux personnes.' },
];

export default async function FamilyHomePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const me = await requireMe();
  const { bienvenue } = await searchParams;
  const pending = isStaff(me.role) ? await apiFetch<JoinRequestDto[]>('/admin/join-requests') : [];

  return (
    <div className="family-home">
      <section className="family-home__main">
        <p className="kicker">{bienvenue ? 'Bienvenue dans la famille' : 'La une'}</p>
        <h1 className="page-title">Bonjour {me.firstName}</h1>
        <p className="lead">
          L’espace famille ouvre ses portes. Les rubriques arrivent les unes après les autres ; voici ce qui vous attend.
        </p>
        <ul className="columns columns--two">
          {UPCOMING.map((item) => (
            <li key={item.title} className="columns__item">
              <h2 className="columns__title">{item.title}</h2>
              <p className="body-text">{item.text}</p>
              <p className="note">Bientôt disponible</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="family-home__aside">
        {pending.length > 0 && (
          <section className="aside-block aside-block--accent">
            <h2 className="rubric">À traiter</h2>
            <p className="body-text">
              <Link href="/espace-famille/admin">
                {pending.length} demande{pending.length > 1 ? 's' : ''} d’adhésion en attente
              </Link>
            </p>
          </section>
        )}
        <section className="aside-block">
          <h2 className="rubric">Vos groupes</h2>
          {me.groups.length > 0 ? (
            <ul className="plain-list">
              {me.groups.map((group) => (
                <li key={group.id}>
                  <Link href={`/espace-famille/annuaire?groupe=${group.id}`}>{group.name}</Link>
                  <span className="note"> · {GROUP_TYPE_LABELS[group.type]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-text">Vous ne faites encore partie d’aucun groupe.</p>
          )}
        </section>
        {!me.hasPassword && (
          <section className="aside-block">
            <h2 className="rubric">Votre compte</h2>
            <p className="body-text">
              Vous vous êtes connecté avec un lien. <Link href="/espace-famille/profil">Choisissez un mot de passe</Link> pour
              revenir plus facilement.
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}
