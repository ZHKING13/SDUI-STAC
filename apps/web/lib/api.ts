import 'server-only';
import {
  defaultHomeContent,
  defaultLegalNotice,
  defaultPrivacyPolicy,
  homeContentSchema,
  legalPageContentSchema,
  type HomeContent,
  type LegalPageContent,
  type PublicPageDto,
} from '@famille/shared';
import type { ZodType } from 'zod';

export const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/** Les pages publiques sont régénérées au plus toutes les 5 minutes. */
export const REVALIDATE_SECONDS = 300;

async function fetchPage<T>(slug: string, schema: ZodType<T>, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/pages/${slug}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [`page:${slug}`] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const page = (await res.json()) as PublicPageDto;
    return schema.parse(page.content);
  } catch (error) {
    // Le site reste consultable même si l'API est indisponible.
    console.error(`Page « ${slug} » indisponible, contenu par défaut utilisé :`, error);
    return fallback;
  }
}

export const getHomeContent = (): Promise<HomeContent> =>
  fetchPage('accueil', homeContentSchema, defaultHomeContent);

export const getLegalNotice = (): Promise<LegalPageContent> =>
  fetchPage('mentions-legales', legalPageContentSchema, defaultLegalNotice);

export const getPrivacyPolicy = (): Promise<LegalPageContent> =>
  fetchPage('confidentialite', legalPageContentSchema, defaultPrivacyPolicy);
