# Site de la famille Wodie

Vitrine publique et, à terme, espace famille privé (gazette, agenda, archives, arbre généalogique).
Spécifications et architecture : dossier [`docs/`](docs/).

## État actuel : vitrine publique (lot 1) et comptes (lot 2)

| Partie | Contenu |
| --- | --- |
| `apps/web` | Site Next.js 15 : vitrine publique, connexion, invitation, espace famille (la une, annuaire, profil, administration) |
| `apps/api` | API NestJS 11 (Fastify) + Prisma/PostgreSQL : pages publiques, comptes et sessions, annuaire, demandes d'adhésion, invitations, groupes |
| `packages/shared` | Schémas de validation (Zod) partagés par l'API et le site, contenu initial de la vitrine |

Les textes entre crochets (`[N]`, `[lieu]`, `[année]`…) sont à remplacer par le comité : rien n'a été inventé sur l'histoire de la famille.

### Exigences couvertes (cahier des charges)

- **Vitrine (3.1)** : PUB-01 à PUB-08, PUB-12, PUB-13 ; PUB-09 côté API (`PUT /admin/pages/:slug`, validé par le schéma), sans écran d'édition pour l'instant.
- **Comptes (3.2)** : CPT-01, CPT-03 (validation par un administrateur ou un référent), CPT-04 (mot de passe et lien de connexion par e-mail), CPT-06 (profil et visibilité des coordonnées), CPT-07 (annuaire).
- **Administration (3.9)** : ADM-02 (groupes, rôles par API).

Restent à faire : rattachement à l'arbre à l'inscription (CPT-02, lot 4), double authentification des administrateurs (CPT-05), comptes junior et invités (CPT-08, CPT-09), export et suppression de compte (CPT-10), écran d'édition de la vitrine, notification des référents à chaque nouvelle demande.

### Comptes : fonctionnement

- Les sessions sont des jetons opaques (30 jours) stockés hachés en base, révocables. Le site Next.js les garde dans un cookie `httpOnly` et appelle l'API pour le navigateur : le jeton n'est jamais lisible en JavaScript.
- Les liens envoyés par e-mail (connexion 15 minutes, bienvenue 7 jours, invitation 14 jours) sont à usage unique. Ils ouvrent une page avec un bouton, pour que les robots de messagerie ne les consomment pas.
- Rôles : `MEMBER`, `MODERATOR` (référent : valide les demandes et invite), `ADMIN` (groupes, rôles, vitrine).
- Premier administrateur : `pnpm --filter @famille/api admin:create <e-mail> <prénom> <nom>` affiche un lien de connexion valable 1 heure.

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

Routes avec session (en-tête `Authorization: Bearer`) : `/auth/*`, `/me`, `/me/password`, `/members`, `/groups`, `/admin/*` ; publiques : `/invitations/:token`, `/invitations/accept`.

Protection anti-robots sans service externe : un champ piège invisible ; une demande qui le remplit reçoit la même réponse mais n'est pas enregistrée.
