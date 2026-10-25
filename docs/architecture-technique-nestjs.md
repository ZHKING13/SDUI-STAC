# Site familial – Architecture technique « from scratch » (backend NestJS)

> Version 0.1 – Octobre 2026 – Complète le [cahier des spécifications fonctionnelles](./cahier-des-specifications-site-familial.md) (proposition D)

---

## 1. Principes directeurs

| Principe | Traduction concrète |
|----------|---------------------|
| **Monolithe modulaire** | Une seule API NestJS découpée en modules métier bien isolés, plus un *worker* séparé pour les traitements lourds. Pas de microservices : on a 700 utilisateurs, pas 7 millions. |
| **Sécurité des droits par défaut** | Toute lecture passe par le moteur d'autorisations ; un endpoint qui l'oublie doit faire échouer les tests. |
| **Fichiers hors de l'API** | Envois et téléchargements directement entre le client et le stockage S3 via des URL signées. L'API ne fait jamais transiter les octets. |
| **Asynchrone pour le lourd** | Miniatures, vidéos, OCR, antivirus, e-mails et indexation sont traités dans des files BullMQ. |
| **Typage de bout en bout** | Contrat OpenAPI généré par NestJS, client TypeScript généré pour le web et le mobile. |
| **Ennuyeux et pérenne** | Des technologies standard, documentées et faciles à reprendre par un autre développeur de la famille dans 5 ans. |

---

## 2. Stack retenue

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| API | **NestJS 11** (Node 22 LTS, TypeScript strict), adaptateur **Fastify** | Structure modulaire, injection de dépendances, guards et intercepteurs adaptés au moteur de droits |
| ORM | **Prisma** (alternative : Drizzle) | Schéma lisible, migrations, typage. Le SQL brut reste possible pour les requêtes de droits. |
| Base de données | **PostgreSQL 16** (extension `ltree`) | Relationnel, transactions, `ltree` pour l'arborescence des dossiers, recherche plein texte de secours |
| Cache et files | **Redis 7 + BullMQ** | Jobs asynchrones, tâches planifiées (récapitulatifs), limitation de débit, cache des droits |
| Stockage | **S3 compatible** (Scaleway Object Storage / OVH ; MinIO en développement) | Bon marché, versioning, réplication, URL pré-signées |
| Vidéo | **ffmpeg** dans le worker → HLS ; *ou* **Bunny Stream** (service géré, peu coûteux) | Lecture adaptative avec une connexion 3G |
| Images | **sharp** | Miniatures WebP/AVIF, suppression des données EXIF GPS |
| Antivirus | **ClamAV** (conteneur) | Les fichiers déposés par 700 personnes ne sont pas tous sains |
| OCR | **Tesseract** (`ocrmypdf`) | Rend les archives scannées consultables par la recherche |
| Recherche | **Meilisearch** | Rapide, tolère les fautes de frappe, filtres utilisés pour appliquer les droits (§5.5) |
| E-mail | **Brevo** ou **Resend** + modèles **React Email / MJML** | Récapitulatifs, liens magiques, invitations |
| Push | **Web Push (VAPID)** + **Expo Push** (mobile) | Notifications PWA et natives |
| Temps réel | **Server-Sent Events** (SSE) | Notifications dans l'application ; suffisant, plus simple que WebSocket |
| Web | **Next.js 15** (App Router) + PWA, Tailwind, shadcn/ui | Rendu côté serveur, i18n, application installable |
| Mobile (option) | **Expo / React Native** | Partage le client API et la logique avec le web |
| Observabilité | **Pino** (logs JSON), **Sentry**, **Uptime Kuma**, OpenTelemetry (option) | Diagnostiquer sans y passer ses soirées |

---

## 3. Vue d'ensemble

```
         ┌──────────────┐   ┌──────────────┐
         │  Web Next.js │   │ Mobile Expo  │
         │   (PWA)      │   │  (option)    │
         └──────┬───────┘   └──────┬───────┘
                │  HTTPS (REST + SSE)   │
                └─────────┬─────────────┘
                   ┌──────▼───────┐        ┌───────────────┐
                   │ Caddy / CDN  │───────▶│  S3 (fichiers)│◀── envois/téléchargements
                   └──────┬───────┘        └───────▲───────┘    directs via URL signées
                   ┌──────▼───────┐                │
                   │  API NestJS  │────────────────┤
                   └─┬───┬────┬───┘                │
         ┌───────────┘   │    └──────────┐         │
   ┌─────▼─────┐   ┌─────▼────┐   ┌──────▼──────┐  │
   │PostgreSQL │   │  Redis   │   │ Meilisearch │  │
   └─────▲─────┘   │ (BullMQ) │   └──────▲──────┘  │
         │         └─────┬────┘          │         │
         │         ┌─────▼──────────────┐│         │
         └─────────│  Worker NestJS     │┴─────────┘
                   │ médias, OCR, AV,   │──▶ Brevo (e-mail), Web Push, Expo Push
                   │ e-mails, index     │
                   └────────────────────┘
```

---

## 4. Organisation du code (monorepo)

```
family/
├── apps/
│   ├── api/                 # NestJS – HTTP
│   ├── worker/              # NestJS – processeurs BullMQ (même code métier, autre point d'entrée)
│   ├── web/                 # Next.js
│   └── mobile/              # Expo (V2)
├── packages/
│   ├── core/                # modules métier NestJS partagés api/worker (domain + services)
│   ├── db/                  # schéma Prisma, migrations, seed
│   ├── api-client/          # client généré depuis l'OpenAPI (orval)
│   ├── shared/              # schémas zod, enums, constantes (types de publication, permissions)
│   └── emails/              # modèles React Email
├── infra/                   # docker-compose, Caddyfile, scripts de sauvegarde
└── turbo.json / pnpm-workspace.yaml
```

### 4.1 Modules NestJS

| Module | Responsabilité |
|--------|----------------|
| `AuthModule` | Connexion, lien magique, rafraîchissement des jetons, 2FA TOTP, sessions |
| `MembersModule` | Profils, annuaire, validation des inscriptions, comptes junior et mémoriaux |
| `InvitationsModule` | Invitations, demandes d'adhésion, parrainage |
| `GroupsModule` | Branches, comités, groupes ad hoc, adhésions |
| `PermissionsModule` | **Moteur d'autorisations** (ACL, héritage, cache, guards) |
| `PostsModule` | Publications typées, audiences, épinglage |
| `InteractionsModule` | Commentaires, réactions, mentions, livre de condoléances |
| `EventsModule` | Événements, réponses de présence, export iCal |
| `MediaModule` | Albums, photos, vidéos, identification des personnes |
| `LibraryModule` | Dossiers, documents, versions, corbeille, demandes d'accès |
| `UploadsModule` | URL pré-signées, envoi multipart, confirmation, pipeline de traitement |
| `SearchModule` | Indexation et recherche filtrée par droits |
| `NotificationsModule` | In-app, push, e-mail, récapitulatifs, préférences |
| `AuditModule` | Journal des actions sensibles |
| `AdminModule` | Tableau de bord, quotas, modération |
| `PrivacyModule` | Export RGPD, effacement, retrait d'une photo |
| `GenealogyModule` (V2) | Arbre, import/export GEDCOM |

Les modules communiquent par **appels de service** pour les lectures et par **événements de domaine** (`@nestjs/event-emitter`, relayés vers BullMQ quand le traitement est lourd) pour les effets de bord : `post.published` → notifications et indexation ; `acl.changed` → recalcul des droits et réindexation.

---

## 5. Le moteur d'autorisations (cœur du système)

### 5.1 Concepts

- **Principal** : celui qui reçoit un droit, c'est-à-dire un membre (`member:<id>`), un groupe (`group:<id>`) ou toute la famille (`family`).
- **Ressource** : dossier, document, album, publication ou événement.
- **Niveau de permission**, ordonné du plus faible au plus fort :
  `VIEW (10) < DOWNLOAD (20) < CONTRIBUTE (30) < EDIT (40) < MANAGE (50)`
  Un niveau inclut tous les niveaux inférieurs, ce qui simplifie l'interface (une seule liste déroulante).
- **Pas de règles d'interdiction** : les droits sont uniquement additifs (union). Pour restreindre un sous-dossier, on **coupe l'héritage** et on redéfinit la liste. C'est beaucoup plus compréhensible pour des non-informaticiens qu'un mélange d'autorisations et de refus.

### 5.2 Règles de calcul

Pour un membre **U** et une ressource **R** :

1. Si U a le rôle `SUPER_ADMIN` ou `ADMIN` → `MANAGE`, mais l'accès « hors droits » à un contenu restreint est **journalisé**.
2. On calcule `principaux(U) = {member:U} ∪ {group:G | U ∈ G} ∪ {family}`.
3. On remonte la chaîne `R → parent → … → racine`, en s'arrêtant **après** le premier nœud dont `inheritPermissions = false`.
4. On garde les entrées ACL de ces nœuds dont le principal appartient à `principaux(U)` et qui ne sont pas expirées.
5. Le **propriétaire** (déposant) a au minimum `EDIT` sur ce qu'il a créé.
6. Droit effectif = **maximum** des niveaux retenus, ou *aucun* (la ressource est alors **invisible**, et l'API répond 404, jamais 403, pour ne pas révéler son existence).

Publications et événements : une publication porte une **audience** (`FAMILY`, liste de groupes, liste de membres, ou `PRIVATE`) qui se traduit en entrées ACL `VIEW`. On réutilise ainsi un seul moteur.

### 5.3 Stockage et performance

On distingue deux tables :
- `acl_entries` : la **source de vérité**, éditée par les utilisateurs ;
- `effective_access` : une **table dérivée** qui contient, pour chaque ressource, le droit effectif de chaque principal concerné.

Le worker recalcule `effective_access` pour le **sous-arbre concerné** à chaque événement `acl.changed`, `folder.moved` ou `membership.changed`. Avec environ 700 membres, quelques centaines de groupes et quelques dizaines de milliers de ressources, ce recalcul prend quelques millisecondes à quelques secondes.

Avantage : lister « tout ce que je peux voir dans ce dossier » devient une simple jointure indexée :

```sql
SELECT d.*
FROM documents d
JOIN effective_access ea
  ON ea.resource_type = 'DOCUMENT' AND ea.resource_id = d.id
WHERE d.folder_id = $1
  AND d.deleted_at IS NULL
  AND ea.principal_key = ANY($2)   -- {'member:42','group:7','group:9','family'}
  AND ea.level >= 10               -- VIEW
GROUP BY d.id;
```

Les principaux d'un membre sont mis en **cache dans Redis** (TTL de 5 minutes, invalidé quand ses adhésions changent).

### 5.4 Intégration NestJS

```ts
// permissions/permission-level.ts
export enum Perm { VIEW = 10, DOWNLOAD = 20, CONTRIBUTE = 30, EDIT = 40, MANAGE = 50 }
export type ResourceType = 'FOLDER' | 'DOCUMENT' | 'ALBUM' | 'MEDIA' | 'POST' | 'EVENT';
```

```ts
// permissions/require-permission.decorator.ts
export const REQUIRE_PERM = 'require_perm';
export const RequirePermission = (type: ResourceType, level: Perm, idParam = 'id') =>
  SetMetadata(REQUIRE_PERM, { type, level, idParam });
```

```ts
// permissions/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private perms: PermissionService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.get(REQUIRE_PERM, ctx.getHandler());
    if (!rule) return true;
    const req = ctx.switchToHttp().getRequest();
    const level = await this.perms.effectiveLevel(req.user, rule.type, req.params[rule.idParam]);
    if (level < rule.level) throw new NotFoundException(); // ne révèle pas l'existence
    req.effectiveLevel = level;
    return true;
  }
}
```

```ts
// library/documents.controller.ts
@Get(':id/download-url')
@RequirePermission('DOCUMENT', Perm.DOWNLOAD)
getDownloadUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
  return this.documents.signedDownloadUrl(id, user); // URL S3 valable 5 minutes + audit si sensible
}
```

**Garde-fous** :
- un **test d'architecture** parcourt tous les contrôleurs et échoue si une route `GET/POST/PATCH/DELETE` sur une ressource n'a ni `@RequirePermission`, ni `@Public()`, ni `@ListFilteredByAccess()` ;
- les dépôts de listes reçoivent obligatoirement un objet `AccessScope` (les principaux du membre) : il n'existe aucune méthode `findAll()` sans portée ;
- une **matrice de tests** du moteur couvre l'héritage, la coupure d'héritage, l'expiration, le propriétaire, les administrateurs et les adhésions multiples.

### 5.5 Recherche et droits

Chaque document indexé dans Meilisearch porte un attribut filtrable `access: ["group:7", "member:42", "family"]` (les principaux ayant au moins `VIEW`).
L'API génère pour chaque utilisateur une **clé de recherche à portée restreinte** (*tenant token*) contenant le filtre `access IN [ses principaux]`. Ainsi, même une requête faite directement sur Meilisearch ne peut rien renvoyer d'interdit.
À chaque événement `acl.changed`, le worker **réindexe** les ressources du sous-arbre.

---

## 6. Modèle de données (extrait Prisma)

```prisma
enum Role          { SUPER_ADMIN ADMIN MODERATOR MEMBER JUNIOR GUEST }
enum MemberStatus  { PENDING ACTIVE SUSPENDED DECEASED DELETED }
enum GroupType     { BRANCH GENERATION LOCATION COMMITTEE ADHOC }
enum PostType      { BIRTH DEATH WEDDING EVENT ANNOUNCEMENT ACHIEVEMENT MEMORY FREE }
enum ResourceType  { FOLDER DOCUMENT ALBUM MEDIA POST EVENT }
enum PrincipalType { MEMBER GROUP FAMILY }
enum FileStatus    { UPLOADING SCANNING PROCESSING READY REJECTED }

model Member {
  id           String       @id @default(uuid())
  email        String?      @unique            // null pour un junior ou un mémorial
  passwordHash String?
  firstName    String
  lastName     String
  birthName    String?
  birthDate    DateTime?
  country      String?
  city         String?
  locale       String       @default("fr")
  timezone     String       @default("Europe/Paris")
  role         Role         @default(MEMBER)
  status       MemberStatus @default(PENDING)
  guardianId   String?                         // parent d'un compte junior
  guardian     Member?      @relation("Guardian", fields: [guardianId], references: [id])
  wards        Member[]     @relation("Guardian")
  totpSecret   String?
  privacy      Json         @default("{}")     // visibilité des champs du profil
  accessExpiresAt DateTime?                    // invités
  memberships  Membership[]
  createdAt    DateTime     @default(now())
}

model Group {
  id          String       @id @default(uuid())
  name        String
  type        GroupType
  parentId    String?                          // une branche peut contenir des sous-branches
  memberships Membership[]
}

model Membership {
  memberId  String
  groupId   String
  isManager Boolean  @default(false)           // référent de la branche ou du groupe
  member    Member   @relation(fields: [memberId], references: [id])
  group     Group    @relation(fields: [groupId], references: [id])
  @@id([memberId, groupId])
}

model Folder {
  id                 String     @id @default(uuid())
  parentId           String?
  path               Unsupported("ltree")      // ex. root.archives.etat_civil
  name               String
  inheritPermissions Boolean    @default(true)
  ownerId            String
  deletedAt          DateTime?
  documents          Document[]
  @@index([parentId])
}

model Document {
  id           String    @id @default(uuid())
  folderId     String
  folder       Folder    @relation(fields: [folderId], references: [id])
  title        String
  description  String?
  documentDate DateTime?                       // date du document lui-même (ex. 1962)
  category     String?
  tags         String[]
  sensitive    Boolean   @default(false)       // journalise chaque accès
  inheritPermissions Boolean @default(true)
  ownerId      String
  currentVersionId String?
  versions     DocumentVersion[]
  deletedAt    DateTime?
}

model DocumentVersion {
  id         String   @id @default(uuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id])
  fileId     String   @unique
  file       StoredFile @relation(fields: [fileId], references: [id])
  number     Int
  createdBy  String
  createdAt  DateTime @default(now())
}

model StoredFile {
  id          String     @id @default(uuid())
  bucketKey   String     @unique                // originals/2026/10/<uuid>
  mimeType    String
  sizeBytes   BigInt
  sha256      String?
  status      FileStatus @default(UPLOADING)
  variants    Json       @default("{}")         // miniatures, HLS, PDF d'aperçu
  ocrText     String?
  uploadedBy  String
  createdAt   DateTime   @default(now())
}

model Post {
  id          String    @id @default(uuid())
  type        PostType
  authorId    String
  onBehalfOf  String?                           // publié pour quelqu'un (ex. une grand-mère)
  title       String?
  body        Json                              // contenu riche (TipTap/ProseMirror JSON)
  data        Json      @default("{}")          // champs propres au type (nom du bébé, date des obsèques…)
  pinnedUntil DateTime?
  publishAt   DateTime  @default(now())
  deletedAt   DateTime?
  attachments PostAttachment[]
  @@index([publishAt])
}

model AclEntry {
  id            String        @id @default(uuid())
  resourceType  ResourceType
  resourceId    String
  principalType PrincipalType
  principalId   String?                         // null si FAMILY
  level         Int                             // 10..50
  expiresAt     DateTime?
  grantedBy     String
  createdAt     DateTime      @default(now())
  @@index([resourceType, resourceId])
  @@unique([resourceType, resourceId, principalType, principalId])
}

model EffectiveAccess {                         // table dérivée, recalculée par le worker
  resourceType ResourceType
  resourceId   String
  principalKey String                           // 'member:<id>' | 'group:<id>' | 'family'
  level        Int
  @@id([resourceType, resourceId, principalKey])
  @@index([principalKey, resourceType])
}

model AuditLog {
  id        BigInt   @id @default(autoincrement())
  actorId   String?
  action    String                              // 'acl.grant', 'document.download', 'member.validate'…
  target    String?
  meta      Json     @default("{}")
  ip        String?
  createdAt DateTime @default(now())
  @@index([target])
}
```

Les autres tables (non détaillées) : `Comment`, `Reaction`, `Event`, `Rsvp`, `Album`, `Media`, `MediaTag` (personnes identifiées), `Invitation`, `AccessRequest`, `Notification`, `NotificationPreference`, `PushSubscription`, `Session`.

---

## 7. Flux principaux

### 7.1 Authentification
- **Jeton d'accès JWT** (15 minutes) et **jeton de rafraîchissement** opaque (30 jours, avec **rotation** et détection de réutilisation), stocké haché dans `Session`.
- Le web utilise des **cookies `httpOnly` `SameSite=Lax`** et une protection CSRF par en-tête ; le mobile stocke les jetons dans le SecureStore.
- **Lien magique** : jeton aléatoire à usage unique, valable 15 minutes, envoyé par e-mail. C'est le mode de connexion par défaut pour les seniors.
- Mots de passe hachés avec **argon2id** ; **2FA TOTP** (otplib) obligatoire pour les administrateurs, codes de secours fournis.
- `@nestjs/throttler` limite les tentatives de connexion et de demande de lien (par IP et par adresse e-mail).

### 7.2 Inscription
```
Invitation (lien signé) ─▶ formulaire + lien de parenté ─▶ Member(status=PENDING)
   ─▶ notification aux référents de la branche indiquée
   ─▶ validation ─▶ status=ACTIVE, ajout aux groupes (branche, pays) ─▶ e-mail de bienvenue
```

### 7.3 Envoi d'un fichier
```
1. Client  ─POST /uploads {nom, type, taille, destination}─▶ API
2. API     vérifie le droit CONTRIBUTE sur la destination, le quota et le type MIME autorisé
           ─▶ crée StoredFile(UPLOADING) ─▶ renvoie des URL S3 pré-signées multipart
3. Client  envoie les parties directement vers S3 (reprise possible en cas de coupure)
4. Client  ─POST /uploads/:id/complete─▶ API ─▶ finalise le multipart ─▶ job "file.process"
5. Worker  vérifie le type réel (magic bytes) ─▶ antivirus ClamAV ─▶ si infecté : REJECTED
           ─▶ image : sharp (miniatures 320/1080/2048 en WebP, suppression du GPS EXIF)
           ─▶ vidéo : ffmpeg → HLS 360p/720p (ou envoi à Bunny Stream)
           ─▶ PDF/scan : aperçu + OCR ─▶ ocrText
           ─▶ Office : conversion en PDF pour l'aperçu (LibreOffice headless)
           ─▶ status=READY ─▶ indexation Meilisearch ─▶ événement SSE "file.ready"
```

### 7.4 Téléchargement
`GET /documents/:id/download-url` → contrôle `DOWNLOAD` → URL S3 signée (5 minutes, `Content-Disposition` attachment) → entrée d'audit si le document est `sensitive`.
Les miniatures et vidéos passent par un CDN avec un **jeton signé** valable quelques heures, pour éviter de générer une URL par image.

### 7.5 Publication et notifications
```
POST /posts ─▶ validation zod ─▶ Post + AclEntry (audience) ─▶ émission de "post.published"
  └─▶ NotificationsModule : calcule les destinataires (effective_access ≥ VIEW)
        ├─ in-app : table Notification + SSE
        ├─ push immédiat si type ∈ {DEATH, BIRTH} ou mention, selon les préférences
        └─ sinon ajouté au récapitulatif
Tâche planifiée BullMQ (toutes les heures) : envoie le récapitulatif quotidien ou hebdomadaire
  aux membres dont il est 8 h dans **leur** fuseau horaire
```

---

## 8. API REST (extrait)

Préfixe `/api/v1`. Documentation Swagger sur `/api/docs` (accès réservé aux administrateurs en production).

| Domaine | Endpoints |
|---------|-----------|
| Auth | `POST /auth/login`, `POST /auth/magic-link`, `POST /auth/magic-link/verify`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/2fa/setup`, `POST /auth/2fa/verify` |
| Invitations | `POST /invitations`, `GET /invitations/:token`, `POST /join-requests`, `POST /join-requests/:id/approve` |
| Membres | `GET /members?q=&branch=&country=`, `GET /members/:id`, `PATCH /members/me`, `GET /members/me/export` |
| Groupes | `GET /groups`, `POST /groups`, `POST /groups/:id/members`, `DELETE /groups/:id/members/:memberId` |
| Fil | `GET /feed?type=&group=&cursor=`, `POST /posts`, `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/pin` |
| Interactions | `GET/POST /posts/:id/comments`, `PUT/DELETE /posts/:id/reactions` |
| Événements | `POST /events`, `GET /events?from=&to=`, `PUT /events/:id/rsvp`, `GET /calendar.ics?token=` |
| Médias | `GET/POST /albums`, `GET /albums/:id/media`, `POST /media/:id/tags` |
| Bibliothèque | `GET /folders/:id/children`, `POST /folders`, `PATCH /folders/:id` (renommer ou déplacer), `POST /documents`, `GET /documents/:id`, `GET /documents/:id/versions`, `GET /documents/:id/download-url`, `DELETE /documents/:id`, `POST /trash/:id/restore` |
| Droits | `GET /acl/:type/:id`, `PUT /acl/:type/:id` (remplacement de la liste + `inheritPermissions`), `POST /access-requests`, `POST /access-requests/:id/decide`, `GET /admin/members/:id/effective-access` (« ce que voit X ») |
| Envois | `POST /uploads`, `POST /uploads/:id/parts`, `POST /uploads/:id/complete` |
| Recherche | `GET /search/token` (clé Meilisearch à portée restreinte) ou `GET /search?q=` (proxy) |
| Notifications | `GET /notifications`, `POST /notifications/read`, `GET /notifications/stream` (SSE), `PUT /notifications/preferences`, `POST /push-subscriptions` |
| Admin | `GET /admin/dashboard`, `GET /admin/audit`, `GET /admin/reports`, `PATCH /admin/members/:id/role` |

Conventions : pagination par **curseur** ; les erreurs suivent la RFC 9457 (`problem+json`) ; **idempotence** des créations grâce à l'en-tête `Idempotency-Key` (utile avec les connexions instables) ; les dates sont en ISO 8601 UTC et c'est le client qui les affiche dans le fuseau du membre.

---

## 9. Sécurité et RGPD

| Sujet | Mesure |
|-------|--------|
| Transport | HTTPS partout (Caddy + Let's Encrypt), HSTS |
| En-têtes | `@fastify/helmet`, CSP stricte côté web, `X-Robots-Tag: noindex` |
| Entrées | Validation avec zod (`nestjs-zod`) sur tous les DTO ; contenu riche nettoyé côté serveur (liste blanche des nœuds autorisés) |
| Fichiers | Liste blanche de types MIME, vérification des magic bytes, ClamAV, buckets **privés** uniquement, aucune URL publique |
| Secrets | Variables d'environnement chiffrées (SOPS ou gestionnaire de secrets de l'hébergeur), rotation des clés S3 |
| Droits | Moteur central, réponse 404 pour une ressource non autorisée, tests d'architecture, audit des changements de droits et des accès aux documents sensibles |
| Données personnelles | Hébergement dans l'UE ; GPS retiré des photos ; date de naissance et coordonnées masquées par défaut ; export de ses données (`/members/me/export`, archive ZIP) ; effacement (anonymisation des contributions, au choix du membre) ; retrait d'une photo sur simple demande |
| Mineurs | Profil visible uniquement par les parents et la famille proche ; pas d'identification sur les photos sans l'accord du tuteur |
| Sauvegardes | PostgreSQL : `pgBackRest` (sauvegarde complète hebdomadaire, journaux WAL en continu) vers un bucket situé dans **une autre région**. S3 : versioning + réplication. Test de restauration trimestriel documenté. |

---

## 10. Infrastructure et déploiement

### 10.1 Démarrage (environ 700 membres)
- **1 VPS** (4 vCPU, 16 Go de RAM, par exemple chez Hetzner ou Scaleway) avec Docker Compose : `caddy`, `api` (2 répliques), `worker`, `postgres`, `redis`, `meilisearch`, `clamav`.
- **Stockage objet** S3 européen + CDN (Bunny CDN ou CDN de l'hébergeur).
- Déploiement simplifié avec **Coolify** ou **Dokku**, ou une GitHub Action qui construit les images (GHCR) puis exécute `docker compose pull && up -d`, avec les migrations Prisma lancées avant le démarrage de l'API.
- Variante plus confortable : **PostgreSQL géré** par l'hébergeur (sauvegardes incluses) et le reste sur le VPS.

### 10.2 Environnements
`local` (docker compose avec MinIO et Mailpit) → `staging` (même VPS, autre base de données, données fictives) → `production`.

### 10.3 Coûts indicatifs (à confirmer auprès des fournisseurs)
| Poste | Estimation mensuelle |
|-------|----------------------|
| VPS 16 Go | 20 à 40 € |
| Stockage objet (1 à 3 To) + trafic | 10 à 40 € |
| PostgreSQL géré (option) | 15 à 30 € |
| E-mail transactionnel (environ 30 000 e-mails/mois avec les récapitulatifs) | 0 à 25 € |
| Vidéo gérée (option Bunny Stream) | 5 à 20 € |
| Sentry, monitoring | 0 € (offres gratuites) |
| **Total** | **≈ 35 à 150 €/mois** |

---

## 11. Qualité et tests

| Niveau | Outils | Cible |
|--------|--------|-------|
| Unitaires | Vitest ou Jest | Moteur de droits (matrice exhaustive), règles métier des publications et des récapitulatifs |
| Intégration / e2e | Supertest + **Testcontainers** (PostgreSQL, Redis, MinIO) | Chaque endpoint : cas autorisé, cas non autorisé (404), membre d'une autre branche |
| Architecture | Test qui inspecte les métadonnées des contrôleurs | Aucune route sans règle d'accès |
| Front | Playwright | Parcours clés : inscription, publication d'une naissance, dépôt d'un document restreint |
| CI | GitHub Actions | lint, typecheck, tests, build des images, scan des dépendances (`pnpm audit`, Trivy) |

---

## 12. Planning de réalisation (MVP)

Estimation pour **1 développeur full-stack expérimenté**, ou 2 développeurs à mi-temps.

| Sprint (2 semaines) | Contenu |
|---------------------|---------|
| S1 | Monorepo, CI, infrastructure locale, schéma Prisma de base, authentification (lien magique, JWT, sessions) |
| S2 | Membres, invitations, validation, groupes, annuaire ; squelette web Next.js |
| S3 | **Moteur d'autorisations** (ACL, héritage, `effective_access`, guards, tests) |
| S4 | Envois S3, worker (antivirus, images, PDF), bibliothèque (dossiers, documents, aperçu, corbeille) |
| S5 | Fil d'actualité, publications typées, commentaires et réactions, audiences |
| S6 | Événements et réponses de présence, albums, vidéos (HLS ou Bunny) |
| S7 | Notifications (in-app, SSE, push, récapitulatif par fuseau), recherche Meilisearch avec droits |
| S8 | Administration, audit, RGPD (export et effacement), PWA, durcissement de la sécurité, recette avec les ambassadeurs |

**Total : environ 16 semaines** (≈ 60 à 80 jours de développement, back et front compris), puis environ 2 à 4 jours par mois de maintenance et d'évolutions.

**V2** : application Expo, arbre généalogique (GEDCOM), multilingue, lettre d'information mensuelle, messagerie, reconnaissance faciale (facultative et désactivée par défaut).

---

## 13. Décisions à confirmer

1. **Prisma ou Drizzle** : Prisma par défaut (plus accessible) ; Drizzle si l'on veut davantage de SQL brut (`ltree`, CTE).
2. **Vidéo** : traitement maison avec ffmpeg (aucun coût de service, mais du CPU sur le VPS) ou **Bunny Stream** (plus simple, avec une facture à l'usage). Je recommande Bunny Stream pour le MVP.
3. **Recherche** : Meilisearch dès la V1, ou la recherche plein texte de PostgreSQL au départ (une brique de moins) puis Meilisearch en V1.1.
4. **Mobile** : PWA seule pour le MVP, puis Expo en V2 (recommandé).
5. **Hébergement** : VPS administré par un membre de la famille, ou services gérés (un peu plus cher, mais moins de risque si cette personne n'est plus disponible).
