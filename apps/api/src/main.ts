import 'reflect-metadata';
import { AppModule } from './app.module';
import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp(AppModule);
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
