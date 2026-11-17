# Site de la famille Wodie

Vitrine publique et, à terme, espace famille privé (gazette, agenda, archives, arbre généalogique).
Spécifications et architecture : dossier [`docs/`](docs/).

## État actuel : la vitrine publique

| Partie | Contenu |
| --- | --- |
| `apps/web` | Site Next.js 15 : accueil public, contact, mentions légales, confidentialité, page d'attente de l'espace famille, `robots.txt` et plan du site |
| `apps/api` | API NestJS 11 (Fastify) + Prisma/PostgreSQL : pages publiques, demandes d'adhésion, messages de contact |
| `packages/shared` | Schémas de validation (Zod) partagés par l'API et le site, contenu initial de la vitrine |

Les textes entre crochets (`[N]`, `[lieu]`, `[année]`…) sont à remplacer par le comité : rien n'a été inventé sur l'histoire de la famille.

### Exigences couvertes (cahier des charges, section 3.1)

PUB-01 à PUB-08, PUB-12 et PUB-13. Restent à faire :
- **PUB-09** : modification des pages par les administrateurs (dépend des comptes, lot 2). En attendant, le contenu se modifie dans la table `PublicPage`.
- **PUB-10 et PUB-11** : publication publique de contenus de la gazette (lots 2 et 5).
- La notification des référents lors d'une demande d'adhésion (lot 2) : les demandes sont enregistrées avec le statut `PENDING`.

## Démarrer

Prérequis : Node.js 22, pnpm 10, PostgreSQL 16 (ou `docker compose up -d`).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @famille/shared build
pnpm db:migrate && pnpm db:seed

pnpm dev:api   # http://localhost:3001/api/v1/health
pnpm dev:web   # http://localhost:3000
```

Si l'API est indisponible, le site affiche le contenu par défaut au lieu d'une erreur.

## Tests

```bash
pnpm test        # schémas partagés, composants du site, API de bout en bout
pnpm typecheck
pnpm build
```

Les tests de l'API utilisent une vraie base PostgreSQL (`famille_test` par défaut, ou la variable `TEST_DATABASE_URL`) ; ils y appliquent les migrations et la vident entre chaque test.

## API publique

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | `/api/v1/public/pages/:slug` | Contenu d'une page (`accueil`, `mentions-legales`, `confidentialite`) |
| POST | `/api/v1/public/join-requests` | Demande d'adhésion (5 envois par heure et par adresse IP) |
| POST | `/api/v1/public/contact` | Message au comité (même limite) |
| GET | `/api/v1/health` | État du service |

Protection anti-robots sans service externe : un champ piège invisible ; une demande qui le remplit reçoit la même réponse mais n'est pas enregistrée.
