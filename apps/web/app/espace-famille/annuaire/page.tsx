import type { Metadata } from 'next';
import type { DirectoryEntryDto, GroupDto } from '@famille/shared';
import { apiFetch } from '@/lib/session';

export const metadata: Metadata = { title: 'Annuaire' };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; groupe?: string }> }) {
  const { q = '', groupe = '' } = await searchParams;
  const params = new URLSearchParams({ q, ...(groupe && { group: groupe }) });
  const [members, groups] = await Promise.all([
    apiFetch<DirectoryEntryDto[]>(`/members?${params}`),
    apiFetch<GroupDto[]>('/groups'),
  ]);

  return (
    <>
      <p className="kicker">Annuaire</p>
      <h1 className="page-title">Les membres de la famille</h1>
      <form className="search" role="search">
        <div className="field search__query">
          <label htmlFor="q" className="field__label">
            Rechercher un nom, une ville, un pays
          </label>
          <input id="q" name="q" type="search" defaultValue={q} className="field__input" />
        </div>
        {groups.length > 0 && (
          <div className="field">
            <label htmlFor="groupe" className="field__label">
              Groupe
            </label>
            <select id="groupe" name="groupe" defaultValue={groupe} className="field__input">
              <option value="">Tous</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="button button--primary">
          Rechercher
        </button>
      </form>

      <p className="note" aria-live="polite">
        {members.length} membre{members.length > 1 ? 's' : ''}
      </p>
      <ul className="directory">
        {members.map((m) => (
          <li key={m.id} className="directory__item">
            <h2 className="directory__name">
              {m.firstName} {m.lastName}
              {m.birthName && <span className="directory__birth"> (nom de naissance : {m.birthName})</span>}
            </h2>
            <p className="note">{[m.city, m.country].filter(Boolean).join(', ') || 'Lieu non renseigné'}</p>
            {m.groups.length > 0 && <p className="directory__groups">{m.groups.map((g) => g.name).join(' · ')}</p>}
            <p className="directory__contact">
              {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
              {m.phone && <a href={`tel:${m.phone.replace(/\s/g, '')}`}>{m.phone}</a>}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
