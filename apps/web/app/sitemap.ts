import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

/** Plan du site limité aux pages publiques (exigence PUB-12). */
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/contact', '/mentions-legales', '/confidentialite'].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'monthly',
  }));
}
