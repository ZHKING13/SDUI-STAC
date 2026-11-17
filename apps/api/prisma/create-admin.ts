/**
 * Crée (ou promeut) le premier administrateur et affiche un lien de connexion valable 1 heure.
 * Usage : pnpm admin:create <e-mail> <prénom> <nom>
 */
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  const [rawEmail, firstName, lastName] = process.argv.slice(2);
  if (!rawEmail || !firstName || !lastName) {
    console.error('Usage : pnpm admin:create <e-mail> <prénom> <nom>');
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();
  const member = await prisma.member.upsert({
    where: { email },
    create: { email, firstName, lastName, role: 'ADMIN' },
    update: { role: 'ADMIN', status: 'ACTIVE' },
  });
  const token = randomBytes(32).toString('base64url');
  await prisma.loginToken.create({
    data: {
      tokenHash: createHash('sha256').update(token).digest('hex'),
      memberId: member.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const web = (process.env.WEB_URL ?? process.env.WEB_ORIGIN?.split(',')[0] ?? 'http://localhost:3000').replace(/\/$/, '');
  console.log(`Administrateur : ${member.firstName} ${member.lastName} <${member.email}>`);
  console.log(`Lien de connexion (1 heure, usage unique) :\n${web}/connexion/lien?token=${token}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
