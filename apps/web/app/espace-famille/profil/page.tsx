import type { Metadata } from 'next';
import { PasswordForm, ProfileForm } from '@/components/family/ProfileForms';
import { requireMe } from '@/lib/session';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilePage() {
  const me = await requireMe();
  return (
    <>
      <p className="kicker">Mon profil</p>
      <h1 className="page-title">
        {me.firstName} {me.lastName}
      </h1>
      <div className="split">
        <section aria-labelledby="infos" className="split__col">
          <h2 id="infos" className="rubric">
            Mes informations
          </h2>
          <ProfileForm me={me} />
        </section>
        <section aria-labelledby="mdp" className="split__col">
          <h2 id="mdp" className="rubric">
            {me.hasPassword ? 'Changer de mot de passe' : 'Choisir un mot de passe'}
          </h2>
          <PasswordForm hasPassword={me.hasPassword} />
        </section>
      </div>
    </>
  );
}
