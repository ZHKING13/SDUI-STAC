import { PrismaClient } from '@prisma/client';
import { defaultHomeContent, defaultLegalNotice, defaultPrivacyPolicy } from '@famille/shared';

const prisma = new PrismaClient();

/** Crée les pages manquantes sans jamais écraser un contenu déjà modifié. */
async function main() {
  const pages = [
    { slug: 'accueil', title: defaultHomeContent.familyName, content: defaultHomeContent },
    { slug: 'mentions-legales', title: defaultLegalNotice.title, content: defaultLegalNotice },
    { slug: 'confidentialite', title: defaultPrivacyPolicy.title, content: defaultPrivacyPolicy },
  ];
  for (const page of pages) {
    await prisma.publicPage.upsert({ where: { slug: page.slug }, create: page, update: {} });
  }
  console.log(`Pages publiques présentes : ${pages.map((p) => p.slug).join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
