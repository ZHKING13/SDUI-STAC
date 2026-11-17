'use client';

import { useActionState, useRef } from 'react';
import { GROUP_TYPES, GROUP_TYPE_LABELS, type GroupDto, type JoinRequestDto } from '@famille/shared';
import { createGroupAction, decideJoinRequestAction, inviteAction } from '@/app/espace-famille/actions';
import { initialFormState } from '@/lib/form-state';
import { FormField } from '../FormField';
import { FormStatus } from '../FormStatus';
import { GroupCheckboxes } from './GroupCheckboxes';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export function JoinRequestCard({ request, groups }: { request: JoinRequestDto; groups: GroupDto[] }) {
  const [state, action, pending] = useActionState(decideJoinRequestAction, initialFormState);
  // La décision est inscrite au clic : on ne déduit jamais un refus d'un bouton non transmis.
  const decision = useRef<HTMLInputElement>(null);
  if (state.status === 'success') return <FormStatus state={state} />;
  return (
    <article className="request">
      <header className="request__header">
        <h3 className="request__name">{request.fullName}</h3>
        <span className="note">{dateFormat.format(new Date(request.createdAt))}</span>
      </header>
      <p className="body-text">
        <strong>Lien avec la famille :</strong> {request.relationship}
      </p>
      {request.message && <p className="body-text">« {request.message} »</p>}
      <p className="note">{request.email}</p>
      <form action={action} className="form">
        <input type="hidden" name="id" value={request.id} />
        <input type="hidden" name="decision" ref={decision} defaultValue="" />
        <GroupCheckboxes groups={groups} legend="Ajouter aux groupes" />
        <FormStatus state={state} />
        <div className="actions actions--tight">
          <button
            type="submit"
            className="button button--primary button--small"
            disabled={pending}
            onClick={() => {
              if (decision.current) decision.current.value = 'approve';
            }}
          >
            Accepter
          </button>
          <button
            type="submit"
            className="button button--outline button--small"
            disabled={pending}
            onClick={(event) => {
              if (!window.confirm(`Refuser la demande de ${request.fullName} ?`)) {
                event.preventDefault();
                return;
              }
              if (decision.current) decision.current.value = 'reject';
            }}
          >
            Refuser
          </button>
        </div>
      </form>
    </article>
  );
}

export function InviteForm({ groups }: { groups: GroupDto[] }) {
  const [state, action, pending] = useActionState(inviteAction, initialFormState);
  const v = state.status === 'error' ? (state.values ?? {}) : {};
  return (
    <form action={action} className="form" noValidate key={state.status === 'success' ? state.message : 'invite'}>
      <div className="form__row">
        <FormField name="firstName" label="Prénom" errors={state.errors} defaultValue={v.firstName} />
        <FormField name="lastName" label="Nom" errors={state.errors} defaultValue={v.lastName} />
      </div>
      <FormField name="email" label="E-mail" type="email" errors={state.errors} defaultValue={v.email} />
      <GroupCheckboxes groups={groups} legend="Groupes de la personne invitée" />
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer l’invitation'}
      </button>
    </form>
  );
}

export function GroupForm() {
  const [state, action, pending] = useActionState(createGroupAction, initialFormState);
  const v = state.status === 'error' ? (state.values ?? {}) : {};
  return (
    <form action={action} className="form" noValidate key={state.status === 'success' ? state.message : 'group'}>
      <div className="form__row">
        <FormField name="name" label="Nom du groupe" errors={state.errors} defaultValue={v.name} />
        <div className="field">
          <label htmlFor="field-type" className="field__label">
            Type
          </label>
          <select id="field-type" name="type" defaultValue={v.type ?? 'BRANCH'} className="field__input">
            {GROUP_TYPES.map((type) => (
              <option key={type} value={type}>
                {GROUP_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FormField name="description" label="Description" required={false} errors={state.errors} defaultValue={v.description} />
      <FormStatus state={state} />
      <button type="submit" className="button button--outline" disabled={pending}>
        {pending ? 'Création…' : 'Créer le groupe'}
      </button>
    </form>
  );
}
