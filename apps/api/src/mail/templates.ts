import type { MailMessage } from './mail.service';

export const webUrl = () => (process.env.WEB_URL ?? process.env.WEB_ORIGIN?.split(',')[0] ?? 'http://localhost:3000').replace(/\/$/, '');

export const loginLinkUrl = (token: string) => `${webUrl()}/connexion/lien?token=${encodeURIComponent(token)}`;
export const invitationUrl = (token: string) => `${webUrl()}/invitation/${encodeURIComponent(token)}`;

const signature = '\n\nÀ bientôt,\nLe comité de la famille Wodie';

export const loginLinkMail = (to: string, firstName: string, token: string, minutes: number): MailMessage => ({
  to,
  subject: 'Votre lien de connexion à l’espace famille',
  text:
    `Bonjour ${firstName},\n\nPour vous connecter à l’espace famille, ouvrez ce lien :\n${loginLinkUrl(token)}\n\n` +
    `Il est valable ${minutes} minutes et ne fonctionne qu’une fois. Si vous n’avez rien demandé, ignorez cet e-mail.` +
    signature,
});

export const welcomeMail = (to: string, firstName: string, token: string): MailMessage => ({
  to,
  subject: 'Bienvenue dans l’espace famille Wodie',
  text:
    `Bonjour ${firstName},\n\nVotre demande pour rejoindre l’espace famille a été acceptée.\n` +
    `Ouvrez ce lien pour vous connecter une première fois, puis choisissez un mot de passe dans votre profil :\n${loginLinkUrl(token)}\n\n` +
    `Ce lien est valable 7 jours et ne fonctionne qu’une fois. Ensuite, vous pourrez toujours recevoir un nouveau lien depuis la page de connexion.` +
    signature,
});

export const invitationMail = (
  to: string,
  firstName: string,
  invitedBy: string,
  token: string,
  days: number,
): MailMessage => ({
  to,
  subject: 'Invitation à rejoindre l’espace famille Wodie',
  text:
    `Bonjour ${firstName},\n\n${invitedBy} vous invite à rejoindre l’espace privé de la famille Wodie : ` +
    `nouvelles, agenda, archives et arbre généalogique.\n\nPour créer votre compte, ouvrez ce lien :\n${invitationUrl(token)}\n\n` +
    `L’invitation est valable ${days} jours.` +
    signature,
});
