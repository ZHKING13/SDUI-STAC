'use client';

import { useActionState } from 'react';
import {
  acceptInvitationAction,
  loginAction,
  requestLoginLinkAction,
  verifyLoginLinkAction,
} from '@/app/auth-actions';
import { initialFormState } from '@/lib/form-state';
import { FormField } from './FormField';
import { FormStatus } from './FormStatus';

export function PasswordLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialFormState);
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="suite" value={next ?? ''} />
      <FormField name="email" label="E-mail" type="email" autoComplete="email" errors={state.errors} defaultValue={state.values?.email} />
      <FormField name="password" label="Mot de passe" type="password" autoComplete="current-password" errors={state.errors} />
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

export function LoginLinkForm() {
  const [state, action, pending] = useActionState(requestLoginLinkAction, initialFormState);
  if (state.status === 'success') return <FormStatus state={state} />;
  return (
    <form action={action} className="form" noValidate>
      <FormField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        errors={state.errors}
        defaultValue={state.values?.email}
        hint="Vous recevrez un lien valable 15 minutes. Pratique si vous n’avez pas encore de mot de passe."
      />
      <FormStatus state={state} />
      <button type="submit" className="button button--outline" disabled={pending}>
        {pending ? 'Envoi…' : 'Recevoir un lien par e-mail'}
      </button>
    </form>
  );
}

export function ConfirmLoginLinkForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyLoginLinkAction, initialFormState);
  return (
    <form action={action} className="form">
      <input type="hidden" name="token" value={token} />
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Connexion…' : 'Me connecter à l’espace famille'}
      </button>
    </form>
  );
}

export function AcceptInvitationForm({ token, firstName, lastName }: { token: string; firstName: string; lastName: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, initialFormState);
  const v = state.values ?? {};
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="token" value={token} />
      <div className="form__row">
        <FormField name="firstName" label="Prénom" autoComplete="given-name" errors={state.errors} defaultValue={v.firstName ?? firstName} />
        <FormField name="lastName" label="Nom" autoComplete="family-name" errors={state.errors} defaultValue={v.lastName ?? lastName} />
      </div>
      <FormField
        name="password"
        label="Choisissez un mot de passe"
        type="password"
        autoComplete="new-password"
        errors={state.errors}
        hint="10 caractères au moins. Une petite phrase est facile à retenir."
      />
      <FormField name="confirmPassword" label="Confirmez le mot de passe" type="password" autoComplete="new-password" errors={state.errors} />
      <FormStatus state={state} />
      <button type="submit" className="button button--primary" disabled={pending}>
        {pending ? 'Création du compte…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
