import type { FormState } from '@/app/actions';

/** Message de résultat annoncé aux lecteurs d'écran. */
export function FormStatus({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <p role={state.status === 'error' ? 'alert' : 'status'} className={`form__status form__status--${state.status}`}>
      {state.message}
    </p>
  );
}
