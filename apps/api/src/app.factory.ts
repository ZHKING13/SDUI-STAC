import helmet from '@fastify/helmet';
import { INestApplication, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

export const API_PREFIX = 'api/v1';

/** Configure l'application ; partagée par le serveur et les tests. */
export async function configureApp(app: NestFastifyApplication): Promise<NestFastifyApplication> {
  app.setGlobalPrefix(API_PREFIX);
  await app.register(helmet);
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    methods: ['GET', 'POST'],
  });
  // L'API n'a pas vocation à être indexée : seules les pages du site le sont.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (_request, reply) => {
      reply.header('X-Robots-Tag', 'noindex, nofollow');
    });
  app.enableShutdownHooks();
  return app;
}

export async function createApp(rootModule: Type<unknown>): Promise<INestApplication> {
  // trustProxy : l'adresse IP réelle (utilisée par la limitation de débit) vient du reverse proxy.
  const app = await NestFactory.create<NestFastifyApplication>(
    rootModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 64 * 1024 }),
  );
  return configureApp(app);
}
