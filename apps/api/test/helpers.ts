import { execSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { hash } from 'argon2';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.factory';
import { MailService, type MailMessage } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://famille:famille@localhost:5432/famille_test';

/** Remplace l'envoi d'e-mails : les messages sont gardés pour être lus par les tests. */
export class FakeMailService {
  readonly sent: MailMessage[] = [];
  async send(message: MailMessage) {
    this.sent.push(message);
  }
  /** Dernier jeton présent dans un lien envoyé à cette adresse. */
  lastToken(to: string): string {
    const message = [...this.sent].reverse().find((m) => m.to === to);
    const match = message?.text.match(/(?:token=|invitation\/)([A-Za-z0-9_-]{20,})/);
    if (!match) throw new Error(`Aucun lien envoyé à ${to}`);
    return decodeURIComponent(match[1]);
  }
}

export interface TestContext {
  app: NestFastifyApplication;
  prisma: PrismaService;
  mail: FakeMailService;
  baseUrl: string;
  call: (path: string, init?: { method?: string; body?: unknown; token?: string; ip?: string }) => Promise<{
    status: number;
    headers: Headers;
    body: any;
  }>;
}

let ipCounter = 0;
/** Une adresse IP différente par appel par défaut, pour que la limitation de débit n'interfère pas. */
export const nextIp = () => `10.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}.1`;

export async function createTestContext(): Promise<TestContext> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  execSync('npx prisma migrate deploy', { env: { ...process.env }, stdio: 'ignore' });

  const mail = new FakeMailService();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ trustProxy: true }));
  await configureApp(app);
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  const call: TestContext['call'] = async (path, init = {}) => {
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      body: init.body ? JSON.stringify(init.body) : undefined,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        'x-forwarded-for': init.ip ?? nextIp(),
      },
    });
    const text = await res.text();
    return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
  };

  return { app, prisma: app.get(PrismaService), mail, baseUrl, call };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Session", "LoginToken", "Membership", "Invitation", "JoinRequest", "ContactMessage", "PublicPage", "Group", "Member" CASCADE',
  );
}

/** Crée un membre avec mot de passe et renvoie un jeton de session obtenu par l'API. */
export async function createMemberAndLogin(
  ctx: TestContext,
  data: { email: string; role?: 'MEMBER' | 'MODERATOR' | 'ADMIN'; firstName?: string; lastName?: string },
  password = 'motdepasse-solide',
) {
  const member = await ctx.prisma.member.create({
    data: {
      email: data.email,
      firstName: data.firstName ?? 'Prénom',
      lastName: data.lastName ?? 'Nom',
      role: data.role ?? 'MEMBER',
      passwordHash: await hash(password),
    },
  });
  const res = await ctx.call('/auth/login', { body: { email: data.email, password } });
  if (res.status !== 200) throw new Error(`Connexion impossible : ${res.status}`);
  return { member, token: res.body.token as string };
}
