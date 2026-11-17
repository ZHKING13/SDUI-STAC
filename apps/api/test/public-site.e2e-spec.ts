import { execSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { defaultHomeContent, defaultLegalNotice } from '@famille/shared';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.factory';
import { PrismaService } from '../src/prisma/prisma.service';
import { resetDatabase } from './helpers';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://famille:famille@localhost:5432/famille_test';

describe('Vitrine publique (API)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  let ipCounter = 0;
  // Une adresse IP différente par test, pour que la limitation de débit ne déborde pas d'un test à l'autre.
  const nextIp = () => `10.0.0.${++ipCounter}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    execSync('npx prisma migrate deploy', { env: { ...process.env }, stdio: 'ignore' });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ trustProxy: true }));
    await configureApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  /** Requête HTTP réelle ; renvoie le statut, le corps JSON et les en-têtes. */
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(baseUrl + path, init);
    const text = await res.text();
    return { statusCode: res.status, headers: res.headers, json: () => JSON.parse(text) };
  };
  const get = (path: string) => call(path);
  const post = (path: string, payload: object, ip = nextIp()) =>
    call(path, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    });

  describe('GET /api/v1/public/pages/:slug', () => {
    it("renvoie la page d'accueil", async () => {
      await prisma.publicPage.create({
        data: { slug: 'accueil', title: 'Famille Wodie', content: defaultHomeContent },
      });
      const res = await get('/api/v1/public/pages/accueil');
      expect(res.statusCode).toBe(200);
      expect(res.json().content.hero.title).toBe(defaultHomeContent.hero.title);
      expect(res.headers.get('cache-control')).toBe('public, max-age=60');
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    });

    it('renvoie une page légale', async () => {
      await prisma.publicPage.create({
        data: { slug: 'mentions-legales', title: 'Mentions légales', content: defaultLegalNotice },
      });
      const res = await get('/api/v1/public/pages/mentions-legales');
      expect(res.statusCode).toBe(200);
      expect(res.json().title).toBe('Mentions légales');
    });

    it("répond 404 pour une page inconnue ou absente", async () => {
      expect((await get('/api/v1/public/pages/inconnue')).statusCode).toBe(404);
      expect((await get('/api/v1/public/pages/accueil')).statusCode).toBe(404);
    });

    it('refuse de servir un contenu invalide', async () => {
      await prisma.publicPage.create({ data: { slug: 'accueil', title: 'x', content: { hero: 1 } } });
      const res = await get('/api/v1/public/pages/accueil');
      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /api/v1/public/join-requests", () => {
    const valid = {
      fullName: 'Awa Wodie',
      email: 'AWA@example.com',
      relationship: "Fille de Paul, petite-fille d'Hélène",
    };

    it('enregistre une demande valide en attente de validation', async () => {
      const res = await post('/api/v1/public/join-requests', valid);
      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ received: true });
      const stored = await prisma.joinRequest.findMany();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ email: 'awa@example.com', status: 'PENDING' });
    });

    it('renvoie les erreurs par champ', async () => {
      const res = await post('/api/v1/public/join-requests', { ...valid, email: 'faux' });
      expect(res.statusCode).toBe(400);
      expect(res.json().errors).toEqual({ email: "L'adresse e-mail n'est pas valide." });
      expect(await prisma.joinRequest.count()).toBe(0);
    });

    it("ignore silencieusement un robot qui remplit le champ piège", async () => {
      const res = await post('/api/v1/public/join-requests', { ...valid, website: 'http://spam.example' });
      expect(res.statusCode).toBe(201);
      expect(await prisma.joinRequest.count()).toBe(0);
    });

    it('limite à 5 envois par heure et par adresse IP', async () => {
      const ip = nextIp();
      for (let i = 0; i < 5; i++) {
        expect((await post('/api/v1/public/join-requests', valid, ip)).statusCode).toBe(201);
      }
      expect((await post('/api/v1/public/join-requests', valid, ip)).statusCode).toBe(429);
      expect((await post('/api/v1/public/join-requests', valid)).statusCode).toBe(201);
    });
  });

  describe('POST /api/v1/public/contact', () => {
    it('enregistre un message valide', async () => {
      const res = await post('/api/v1/public/contact', {
        name: 'Jean',
        email: 'jean@example.com',
        message: 'Bonjour, je voudrais retirer une photo.',
      });
      expect(res.statusCode).toBe(201);
      expect(await prisma.contactMessage.count()).toBe(1);
    });

    it('refuse un message vide', async () => {
      const res = await post('/api/v1/public/contact', { name: 'Jean', email: 'jean@example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.json().errors.message).toBe('Le message est obligatoire.');
    });
  });

  it('GET /api/v1/health', async () => {
    const res = await get('/api/v1/health');
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
