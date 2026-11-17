import { defaultHomeContent } from '@famille/shared';
import { createMemberAndLogin, createTestContext, resetDatabase, type TestContext } from './helpers';

describe('Comptes et espace famille (API)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ctx.mail.sent.length = 0;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('connexion par mot de passe', () => {
    it('ouvre une session et donne accès au profil', async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'awa@example.com', firstName: 'Awa' });
      const me = await ctx.call('/me', { token });
      expect(me.status).toBe(200);
      expect(me.body).toMatchObject({ email: 'awa@example.com', firstName: 'Awa', role: 'MEMBER', hasPassword: true });
    });

    it('renvoie le même message pour un mauvais mot de passe et un compte inconnu', async () => {
      await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      const wrong = await ctx.call('/auth/login', { body: { email: 'awa@example.com', password: 'faux-mot-de-passe' } });
      const unknown = await ctx.call('/auth/login', { body: { email: 'personne@example.com', password: 'x' } });
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('refuse une session absente, invalide ou fermée', async () => {
      expect((await ctx.call('/me')).status).toBe(401);
      expect((await ctx.call('/me', { token: 'jeton-inventé-de-plus-de-vingt-caractères' })).status).toBe(401);
      const { token } = await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      expect((await ctx.call('/auth/logout', { method: 'POST', token })).status).toBe(204);
      expect((await ctx.call('/me', { token })).status).toBe(401);
    });

    it("bloque un compte suspendu, même avec une session ouverte", async () => {
      const { member, token } = await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      await ctx.prisma.member.update({ where: { id: member.id }, data: { status: 'SUSPENDED' } });
      expect((await ctx.call('/me', { token })).status).toBe(401);
    });
  });

  describe('lien de connexion par e-mail', () => {
    it("n'envoie rien pour une adresse inconnue, sans le révéler", async () => {
      const res = await ctx.call('/auth/login-link', { body: { email: 'inconnu@example.com' } });
      expect(res.status).toBe(202);
      expect(ctx.mail.sent).toHaveLength(0);
    });

    it('envoie un lien utilisable une seule fois', async () => {
      await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      expect((await ctx.call('/auth/login-link', { body: { email: 'AWA@example.com' } })).status).toBe(202);
      const token = ctx.mail.lastToken('awa@example.com');

      const first = await ctx.call('/auth/login-link/verify', { body: { token } });
      expect(first.status).toBe(200);
      expect(first.body.member.email).toBe('awa@example.com');
      expect((await ctx.call('/me', { token: first.body.token })).status).toBe(200);

      const second = await ctx.call('/auth/login-link/verify', { body: { token } });
      expect(second.status).toBe(401);
    });

    it('refuse un lien expiré', async () => {
      await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      await ctx.call('/auth/login-link', { body: { email: 'awa@example.com' } });
      await ctx.prisma.loginToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
      const res = await ctx.call('/auth/login-link/verify', { body: { token: ctx.mail.lastToken('awa@example.com') } });
      expect(res.status).toBe(401);
    });
  });

  describe("demande d'adhésion validée par un référent", () => {
    it('crée le compte, ajoute la branche et envoie un lien de bienvenue', async () => {
      const { token: modToken } = await createMemberAndLogin(ctx, { email: 'ref@example.com', role: 'MODERATOR' });
      const branch = await ctx.prisma.group.create({ data: { name: 'Descendants d’Hélène', type: 'BRANCH' } });

      await ctx.call('/public/join-requests', {
        body: { fullName: 'Inès Marie Wodie', email: 'ines@example.com', relationship: 'Fille de Marie, branche Hélène' },
      });
      const pending = await ctx.call('/admin/join-requests', { token: modToken });
      expect(pending.body).toHaveLength(1);

      const approved = await ctx.call(`/admin/join-requests/${pending.body[0].id}/approve`, {
        body: { groupIds: [branch.id] },
        token: modToken,
      });
      expect(approved.status).toBe(201);
      expect((await ctx.call('/admin/join-requests', { token: modToken })).body).toHaveLength(0);

      // Le nouveau membre se connecte avec le lien reçu, puis choisit un mot de passe sans en avoir déjà un.
      const session = await ctx.call('/auth/login-link/verify', { body: { token: ctx.mail.lastToken('ines@example.com') } });
      expect(session.body.member).toMatchObject({
        firstName: 'Inès Marie',
        lastName: 'Wodie',
        hasPassword: false,
        groups: [{ name: 'Descendants d’Hélène', type: 'BRANCH', isManager: false }],
      });
      const setPassword = await ctx.call('/me/password', {
        body: { newPassword: 'un-mot-de-passe-long', confirmPassword: 'un-mot-de-passe-long' },
        token: session.body.token,
      });
      expect(setPassword.status).toBe(204);
      const login = await ctx.call('/auth/login', { body: { email: 'ines@example.com', password: 'un-mot-de-passe-long' } });
      expect(login.status).toBe(200);
    });

    it('refuse de traiter deux fois la même demande, ou de créer un doublon de compte', async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN' });
      await ctx.call('/public/join-requests', { body: { fullName: 'Admin Bis', email: 'admin@example.com', relationship: 'Déjà membre' } });
      const [request] = (await ctx.call('/admin/join-requests', { token })).body;
      expect((await ctx.call(`/admin/join-requests/${request.id}/approve`, { body: {}, token })).status).toBe(409);
      expect((await ctx.call(`/admin/join-requests/${request.id}/reject`, { method: 'POST', token })).status).toBe(204);
      expect((await ctx.call(`/admin/join-requests/${request.id}/reject`, { method: 'POST', token })).status).toBe(404);
    });
  });

  describe('invitations', () => {
    it("permet à la personne invitée de créer son compte, une seule fois", async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN', firstName: 'Samuel' });
      const created = await ctx.call('/admin/invitations', {
        body: { email: 'nina@example.com', firstName: 'Nina', lastName: 'Wodie' },
        token,
      });
      expect(created.status).toBe(201);
      expect(ctx.mail.sent[0].text).toContain('Samuel Nom vous invite');
      const inviteToken = ctx.mail.lastToken('nina@example.com');

      expect((await ctx.call(`/invitations/${inviteToken}`)).body).toEqual({
        email: 'nina@example.com',
        firstName: 'Nina',
        lastName: 'Wodie',
      });

      const mismatch = await ctx.call('/invitations/accept', {
        body: { token: inviteToken, firstName: 'Nina', lastName: 'Wodie', password: 'mot-de-passe-1', confirmPassword: 'autre' },
      });
      expect(mismatch.status).toBe(400);
      expect(mismatch.body.errors.confirmPassword).toBe('Les deux mots de passe ne sont pas identiques.');

      const accepted = await ctx.call('/invitations/accept', {
        body: { token: inviteToken, firstName: 'Nina', lastName: 'Wodie', password: 'mot-de-passe-1', confirmPassword: 'mot-de-passe-1' },
      });
      expect(accepted.status).toBe(201);
      expect(accepted.body.member.email).toBe('nina@example.com');

      const again = await ctx.call('/invitations/accept', {
        body: { token: inviteToken, firstName: 'Nina', lastName: 'Wodie', password: 'mot-de-passe-1', confirmPassword: 'mot-de-passe-1' },
      });
      expect(again.status).toBe(404);
      expect((await ctx.call(`/invitations/${inviteToken}`)).status).toBe(404);
    });

    it("refuse d'inviter une adresse déjà inscrite", async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN' });
      const res = await ctx.call('/admin/invitations', {
        body: { email: 'admin@example.com', firstName: 'A', lastName: 'B' },
        token,
      });
      expect(res.status).toBe(409);
    });
  });

  describe('droits', () => {
    it("réserve l'administration aux référents et administrateurs", async () => {
      const { token: memberToken } = await createMemberAndLogin(ctx, { email: 'm@example.com' });
      const { token: modToken } = await createMemberAndLogin(ctx, { email: 'ref@example.com', role: 'MODERATOR' });
      expect((await ctx.call('/admin/join-requests', { token: memberToken })).status).toBe(403);
      expect((await ctx.call('/admin/join-requests', { token: modToken })).status).toBe(200);
      // Les groupes et la vitrine sont réservés aux administrateurs.
      expect((await ctx.call('/admin/groups', { body: { name: 'Comité', type: 'COMMITTEE' }, token: modToken })).status).toBe(403);
      expect((await ctx.call('/groups', { token: memberToken })).status).toBe(200);
    });

    it("interdit à un administrateur de changer son propre rôle", async () => {
      const { member, token } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN' });
      const res = await ctx.call(`/admin/members/${member.id}/role`, { method: 'PATCH', body: { role: 'MEMBER' }, token });
      expect(res.status).toBe(403);
    });
  });

  describe('annuaire et profil', () => {
    it('masque les coordonnées privées aux membres, pas aux administrateurs', async () => {
      const { member: awa } = await createMemberAndLogin(ctx, { email: 'awa@example.com', firstName: 'Awa', lastName: 'Wodie' });
      await ctx.prisma.member.update({
        where: { id: awa.id },
        data: { phone: '+225 01 02 03 04', phoneVisibility: 'PRIVATE', emailVisibility: 'PRIVATE', city: 'Abidjan' },
      });
      const { token: memberToken } = await createMemberAndLogin(ctx, { email: 'jean@example.com', firstName: 'Jean' });
      const { token: adminToken } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN' });

      const seenByMember = (await ctx.call('/members?q=abidj', { token: memberToken })).body;
      expect(seenByMember).toHaveLength(1);
      expect(seenByMember[0]).toMatchObject({ firstName: 'Awa', city: 'Abidjan', email: null, phone: null });

      const seenByAdmin = (await ctx.call('/members?q=awa', { token: adminToken })).body;
      expect(seenByAdmin[0]).toMatchObject({ email: 'awa@example.com', phone: '+225 01 02 03 04' });
    });

    it('met à jour le profil et exige le mot de passe actuel pour le changer', async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      const updated = await ctx.call('/me', {
        method: 'PATCH',
        body: { firstName: 'Awa', lastName: 'Wodie', birthName: 'Kouadio', country: 'Canada', city: 'Montréal' },
        token,
      });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ birthName: 'Kouadio', city: 'Montréal', phone: null });

      const wrong = await ctx.call('/me/password', {
        body: { currentPassword: 'faux', newPassword: 'nouveau-mot-de-passe', confirmPassword: 'nouveau-mot-de-passe' },
        token,
      });
      expect(wrong.status).toBe(400);
      expect(wrong.body.errors.currentPassword).toBe('Le mot de passe actuel est incorrect.');
    });

    it('ferme les autres sessions après un changement de mot de passe', async () => {
      const { token: first } = await createMemberAndLogin(ctx, { email: 'awa@example.com' });
      const second = (await ctx.call('/auth/login', { body: { email: 'awa@example.com', password: 'motdepasse-solide' } })).body.token;
      const res = await ctx.call('/me/password', {
        body: { currentPassword: 'motdepasse-solide', newPassword: 'nouveau-mot-de-passe', confirmPassword: 'nouveau-mot-de-passe' },
        token: second,
      });
      expect(res.status).toBe(204);
      expect((await ctx.call('/me', { token: first })).status).toBe(401);
      expect((await ctx.call('/me', { token: second })).status).toBe(200);
    });
  });

  describe('modification de la vitrine (PUB-09)', () => {
    it('valide le contenu puis le publie', async () => {
      const { token } = await createMemberAndLogin(ctx, { email: 'admin@example.com', role: 'ADMIN' });
      const invalid = await ctx.call('/admin/pages/accueil', { method: 'PUT', body: { content: { hero: {} } }, token });
      expect(invalid.status).toBe(400);

      const content = { ...defaultHomeContent, hero: { ...defaultHomeContent.hero, title: 'Bienvenue chez les Wodie' } };
      expect((await ctx.call('/admin/pages/accueil', { method: 'PUT', body: { content }, token })).status).toBe(204);
      expect((await ctx.call('/public/pages/accueil')).body.content.hero.title).toBe('Bienvenue chez les Wodie');
    });
  });
});
