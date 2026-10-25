# Site familial – Architecture technique « from scratch » (backend NestJS)

> Version 0.3 – Octobre 2026 – Complète le [cahier des spécifications fonctionnelles](./cahier-des-specifications-site-familial.md) (proposition D)

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
| Généalogie | **Table de fermeture PostgreSQL** + `pg_trgm` ; front `family-chart` (D3) ; MapLibre pour la carte | Requêtes de parenté rapides, détection des doublons, visualisation interactive |
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
| `InvitationsModule` | Invitations, demandes d'adhésion (y compris depuis la vitrine publique), parrainage |
| `PublicSiteModule` | Contenus de la vitrine (pages, sections, frise, chiffres clés), contact, endpoints publics en lecture seule mis en cache |
| `GroupsModule` | Branches, comités, groupes ad hoc, adhésions |
| `GenealogyModule` | Personnes, filiations, unions, table de fermeture, liens de parenté, branches automatiques, confidentialité des vivants, propositions de modification, GEDCOM (§6) |
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

Les modules communiquent par **appels de service** pour les lectures et par **événements de domaine** (`@nestjs/event-emitter`, relayés vers BullMQ quand le traitement est lourd) pour les effets de bord : `post.published` → notifications et indexation ; `acl.changed` → recalcul des droits et réindexation ; `tree.changed` → recalcul de la table de fermeture et des branches.

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
2. On calcule `principaux(U) = {member:U} ∪ {group:G | U ∈ G} ∪ {family} ∪ {public}`. Un visiteur **anonyme** n'a que `{public}`.
3. On remonte la chaîne `R → parent → … → racine`, en s'arrêtant **après** le premier nœud dont `inheritPermissions = false`.
4. On garde les entrées ACL de ces nœuds dont le principal appartient à `principaux(U)` et qui ne sont pas expirées.
5. Le **propriétaire** (déposant) a au minimum `EDIT` sur ce qu'il a créé.
6. Droit effectif = **maximum** des niveaux retenus, ou *aucun* (la ressource est alors **invisible**, et l'API répond 404, jamais 403, pour ne pas révéler son existence).

Publications et événements : une publication porte une **audience** (`PUBLIC`, `FAMILY`, liste de groupes, liste de membres, ou `PRIVATE`) qui se traduit en entrées ACL `VIEW`. On réutilise ainsi un seul moteur.

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

## 6. Le module généalogie

### 6.1 Principes
- **Personne ≠ membre** : `Person` représente un individu de l'arbre (vivant ou décédé, avec ou sans compte) ; `Member` représente un compte. Le lien `Member.personId` est unique et validé par un référent.
- L'arbre est un **graphe** et non un arbre strict : deux parents (ou plus avec les adoptions et les familles recomposées), plusieurs unions, et des **implexes** (des cousins qui se marient entre eux, donc un même ancêtre atteint par plusieurs chemins). Le modèle et les algorithmes doivent le supporter.
- Le module expose trois services utilisés par le reste du système :
  1. `KinshipService` : le lien de parenté entre deux personnes ;
  2. `BranchSyncService` : les groupes « Descendants de X » calculés automatiquement ;
  3. `PersonPrivacyService` : ce qu'un membre peut voir de la fiche d'une personne vivante.

### 6.2 Table de fermeture (closure table)
Pour répondre vite à « tous les descendants de X », « les ancêtres communs de A et B » ou « quelle distance entre A et B », on maintient une **table de fermeture** :

```
person_ancestry(ancestor_id, descendant_id, depth)   -- depth 0 = soi-même
```

- **Ajout d'un lien parent → enfant (P → E)** : on insère toutes les paires (ancêtre de P, descendant de E) avec `depth = dA + dE + 1`. En cas d'implexe, on garde la **profondeur minimale** et un compteur de chemins.
- **Suppression ou modification d'un lien** : le worker recalcule la fermeture des descendants de E. Avec quelques milliers de personnes, un recalcul **complet** prend moins d'une seconde, ce qui reste la solution de secours en cas de doute.
- **Anti-cycle** : un lien P → E est refusé si E est déjà un ancêtre de P (`EXISTS (E, P)` dans la table).
- Volumétrie : avec 3 000 à 6 000 personnes et environ 15 ancêtres connus en moyenne, la table compte environ 100 000 lignes, ce qui est négligeable pour PostgreSQL.

### 6.3 Calcul du lien de parenté (GEN-09)

```sql
-- ancêtres communs de A et B, du plus proche au plus lointain
SELECT a.ancestor_id, a.depth AS d1, b.depth AS d2
FROM person_ancestry a
JOIN person_ancestry b ON b.ancestor_id = a.ancestor_id
WHERE a.descendant_id = $A AND b.descendant_id = $B
ORDER BY a.depth + b.depth
LIMIT 10;
```

Avec `d1` (générations entre A et l'ancêtre commun le plus proche) et `d2` (générations entre B et ce même ancêtre) :

| (d1, d2) | A est… de B | Degré civil (d1 + d2) |
|----------|-------------|:---------------------:|
| (0, n) | ascendant : parent, grand-parent, arrière-grand-parent… | n |
| (n, 0) | descendant : enfant, petit-enfant… | n |
| (1, 1) | frère / sœur (**demi** si un seul parent commun) | 2 |
| (1, 2) / (2, 1) | oncle-tante / neveu-nièce | 3 |
| (1, 3) / (3, 1) | grand-oncle / petit-neveu | 4 |
| (2, 2) | cousin germain | 4 |
| (2, 3) / (3, 2) | cousin germain d'un parent (« oncle à la mode de Bretagne ») / enfant d'un cousin germain | 5 |
| (3, 3) | cousin issu de germain (petit-cousin) | 6 |
| (4, 4) | cousin issu d'issu de germain | 8 |
| cas général | cousin au (min(d1, d2) − 1)ᵉ degré, avec \|d1 − d2\| génération(s) d'écart | d1 + d2 |

- Le service renvoie un objet structuré `{ d1, d2, half, commonAncestors[], path[], labelKey }`. Le libellé est **traduit côté client** (masculin, féminin ou neutre selon le sexe renseigné ; plusieurs langues possibles).
- Liens **par alliance** (S) : si aucun ancêtre commun n'existe, on cherche un chemin qui passe par **une** union (conjoint de A ou de B), ce qui donne beau-frère, belle-sœur, belle-mère, etc.
- En cas d'implexe, plusieurs liens sont affichés (« cousin germain par votre père et cousin issu de germain par votre mère »).

### 6.4 Branches calculées automatiquement (GEN-21)
- `Group` reçoit trois champs : `rootPersonId` (l'ancêtre), `includeSpouses` et `includeAdopted`.
- `Membership` reçoit un champ `source` : `MANUAL` (ajout à la main) ou `TREE` (ajout par l'arbre).
- À chaque événement `tree.changed`, `person.linked` ou `member.validated`, un job `branch.sync` :
  1. calcule les descendants : `SELECT descendant_id FROM person_ancestry WHERE ancestor_id = root`, plus les conjoints si l'option est cochée ;
  2. retient les membres dont `personId` figure dans cet ensemble ;
  3. crée les adhésions `TREE` manquantes et supprime celles qui ne sont plus valides (les adhésions `MANUAL` ne sont jamais touchées) ;
  4. émet `membership.changed`, ce qui déclenche le recalcul de `effective_access` (§5.3).
- Résultat : un nouveau cousin validé et rattaché à l'arbre **voit automatiquement** les dossiers de sa branche.

### 6.5 Confidentialité des personnes vivantes (GEN-22 à GEN-26)

| Champ | Personne décédée | Personne vivante, visiteur proche* | Personne vivante, autre membre |
|-------|:----------------:|:----------------------------------:|:------------------------------:|
| Nom, prénom, place dans l'arbre | ✅ | ✅ | ✅ |
| Photo de profil | ✅ | ✅ | selon le réglage de la personne |
| Dates et lieux précis | ✅ | ✅ | année seule, ou rien (réglable) |
| Biographie, professions | ✅ | ✅ | selon le réglage |
| Champs sensibles (adoption, filiation particulière) | réservé aux personnes autorisées | réservé aux personnes autorisées | ❌ |

\* *Proche* = degré civil ≤ 4 par défaut (parents, grands-parents, frères et sœurs, oncles et tantes, cousins germains) **ou** conjoint **ou** membre de la même branche définie comme « proche ». Le seuil est réglable par chaque personne et plafonné par l'administration.

- **Présomption de vie** : sans date de décès et avec une naissance il y a moins de 100 ans (ou une date inconnue chez un descendant d'une personne née il y a moins de 120 ans), la personne est considérée comme vivante.
- **Mineurs** : uniquement le prénom et la place dans l'arbre en dehors des proches.
- **Mise en œuvre** : le `PersonPrivacyService` calcule en **une seule requête** le degré de parenté entre le visiteur et toutes les personnes affichées (jointure de la table de fermeture), puis un **sérialiseur** retire les champs non autorisés. Aucune donnée masquée n'est envoyée au navigateur.

### 6.6 Contributions, propositions et historique (GEN-14, GEN-15)
- **`GenealogyPolicy`** (règles relationnelles, distinctes des ACL documentaires). Modification **directe** autorisée pour :
  - soi-même ;
  - ses pupilles (comptes junior) ;
  - ses ascendants en ligne directe ;
  - son conjoint ;
  - les référents, pour les personnes de leur branche ;
  - les administrateurs.
- **Sinon**, une `ChangeProposal` (création, modification, fusion, ajout ou suppression d'un lien) est créée avec le statut `PENDING` et notifiée aux référents de la branche concernée, qui l'acceptent, la refusent ou la modifient.
- **Historique** : chaque écriture crée une `PersonRevision` (instantané JSON, auteur, motif). Revenir en arrière consiste à appliquer un ancien instantané, ce qui crée une nouvelle révision.
- **Contrôles de cohérence** (GEN-17) : règles pures dans `packages/shared` (parent âgé de moins de 12 ans à la naissance de l'enfant, décès avant la naissance, plus de 120 ans…). Elles renvoient des **avertissements**, jamais des blocages, car les données anciennes sont souvent approximatives.
- **Doublons** (GEN-16) : normalisation des noms (suppression des accents, minuscules), similarité `pg_trgm` et phonétique française, année de naissance à ±3 ans. Les candidats sont présentés aux référents, qui décident de **fusionner** ou non. Une fusion réattribue les liens, les médias, les sources et le compte membre, puis conserve un alias pour les anciens identifiants.

### 6.7 Dates généalogiques
Les dates anciennes sont souvent imprécises, d'où un type dédié, stocké en JSON avec une colonne de tri :

```ts
type GenDate = {
  qualifier: 'EXACT' | 'ABOUT' | 'BEFORE' | 'AFTER' | 'BETWEEN' | 'ESTIMATED' | 'CALCULATED';
  precision: 'YEAR' | 'MONTH' | 'DAY';
  date1: string;           // ISO partielle : '1890', '1890-05', '1890-05-14'
  date2?: string;          // pour BETWEEN
  original?: string;       // texte d'origine (GEDCOM ou saisie libre), ex. 'ABT 1890'
};
// + colonne sortDate (date) dérivée, indexée, utilisée pour les tris, les filtres et la présomption de vie
```

Les dates sont converties sans perte vers et depuis la syntaxe GEDCOM (`ABT`, `BEF`, `AFT`, `BET … AND …`, `EST`, `CAL`). Calendrier grégorien en V1 ; calendrier julien ou républicain à prévoir si des archives anciennes l'exigent.

### 6.8 Import et export GEDCOM (GEN-19, GEN-20)
- **Analyse** : bibliothèque npm (par ex. `read-gedcom` ou `parse-gedcom`, licence à vérifier) dans le worker. Prise en charge des encodages UTF-8, ANSI et **ANSEL** (fréquent dans les anciens fichiers Heredis) et des versions 5.5.1 et 7.0.
- **Import en trois temps** :
  1. **Analyse** : `INDI`, `FAM`, `SOUR`, `OBJE`, `NOTE` → tables de préparation `GedcomImport` et `GedcomImportItem`, avec un rapport (nombre de personnes, erreurs, dates non reconnues).
  2. **Rapprochement** : chaque individu importé est comparé à l'arbre existant (doublons, §6.6) et reçoit une proposition « créer », « fusionner avec #123 » ou « ignorer ».
  3. **Validation** par un administrateur ou un référent après prévisualisation, puis application dans **une seule transaction**. On conserve les identifiants GEDCOM d'origine (`externalRefs`) pour pouvoir **réimporter** une version plus récente du même fichier sans créer de doublons.
- **Export** : le worker génère un fichier GEDCOM 5.5.1 en UTF-8 (le plus compatible), et en 7.0 en option, pour tout l'arbre ou pour les ascendants ou descendants d'une personne. Les vivants sont remplacés par « Personne vivante » (sauf pour un administrateur, avec journalisation). Les médias peuvent être joints dans un ZIP (format GEDZIP pour la 7.0), selon les droits.

### 6.9 Visualisation (front)
- **Arbre interactif** : bibliothèque `family-chart` (D3, licence MIT) ou un composant D3 maison. Le **chargement est progressif** : l'API renvoie un voisinage de N générations autour de la personne centrale, puis le reste au fil de la navigation. On n'envoie jamais tout l'arbre d'un coup.
- **Éventail** et **liste par génération** : composants D3 maison. Le visualiseur Topola peut servir de référence (licence à vérifier).
- **Carte** : MapLibre GL avec un fond OpenStreetMap. Les lieux sont normalisés dans une table `Place` et **géocodés par le worker** (Photon ou Nominatim, avec respect des quotas, ou une instance auto-hébergée).
- **Export PDF ou affiche** (GEN-12) : le worker affiche l'arbre en SVG avec Playwright, puis produit un PDF en grand format (A3 à A0).

### 6.10 Intégrations avec les autres modules

| Module | Intégration |
|--------|-------------|
| Inscription | Le candidat recherche son parent dans l'arbre et se crée (ou se reconnaît) comme enfant ; la validation du référent active le compte **et** le rattachement → `branch.sync` |
| Publications | Les publications Naissance, Mariage et Décès portent un `personId` ; à la publication, une proposition de création ou de mise à jour de la fiche est générée (GEN-06). Un décès fait passer le compte du membre au statut mémorial. |
| Médiathèque | `MediaTag.personId` (et non `memberId`) : on peut identifier un **ancêtre** sur une photo ancienne ; la fiche affiche ses photos dans la limite des droits du visiteur |
| Bibliothèque | `PersonDocument` (lien) et `Citation` (source d'un fait). **Un lien ne donne aucun droit** : un document lié reste invisible pour qui n'y a pas accès. |
| Calendrier | Anniversaires (vivants, si autorisé) et commémorations de décès générés depuis l'arbre |
| Recherche | Les personnes sont indexées dans Meilisearch (noms, noms de naissance, lieux, années) ; pour un vivant, seuls les champs publics sont indexés |
| Notifications | « Un nouveau cousin a rejoint votre branche », « Proposition de modification à valider » |

---

## 7. Modèle de données (extrait Prisma)

```prisma
enum Role          { SUPER_ADMIN ADMIN MODERATOR MEMBER JUNIOR GUEST }
enum MemberStatus  { PENDING ACTIVE SUSPENDED DECEASED DELETED }
enum GroupType     { BRANCH GENERATION LOCATION COMMITTEE ADHOC }
enum PostType      { BIRTH DEATH WEDDING EVENT ANNOUNCEMENT ACHIEVEMENT MEMORY FREE }
enum ResourceType  { FOLDER DOCUMENT ALBUM MEDIA POST EVENT }
enum PrincipalType { MEMBER GROUP FAMILY PUBLIC }
enum FileStatus    { UPLOADING SCANNING PROCESSING READY REJECTED }
enum MembershipSource { MANUAL TREE }
enum Sex           { MALE FEMALE OTHER UNKNOWN }
enum FiliationType { BIOLOGICAL ADOPTIVE STEP FOSTER UNKNOWN }
enum UnionType     { MARRIAGE CIVIL_UNION PARTNERSHIP OTHER }
enum UnionEndType  { DIVORCE SEPARATION WIDOWHOOD ANNULMENT }
enum ProposalStatus { PENDING APPROVED REJECTED }

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
  personId     String?      @unique             // fiche de l'arbre, rattachement validé
  person       Person?      @relation(fields: [personId], references: [id])
  memberships  Membership[]
  createdAt    DateTime     @default(now())
}

model Group {
  id             String       @id @default(uuid())
  name           String
  type           GroupType
  parentId       String?                       // une branche peut contenir des sous-branches
  rootPersonId   String?                       // branche calculée : « Descendants de X »
  includeSpouses Boolean      @default(true)
  includeAdopted Boolean      @default(true)
  memberships    Membership[]
}

model Membership {
  memberId  String
  groupId   String
  isManager Boolean  @default(false)           // référent de la branche ou du groupe
  source    MembershipSource @default(MANUAL)  // MANUAL | TREE (géré par branch.sync)
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
  principalKey String                           // 'member:<id>' | 'group:<id>' | 'family' | 'public'
  level        Int
  @@id([resourceType, resourceId, principalKey])
  @@index([principalKey, resourceType])
}

// ---------- Généalogie ----------

model Person {
  id            String    @id @default(uuid())
  givenNames    String                          // prénoms
  surname       String                          // nom d'usage
  birthSurname  String?                         // nom de naissance
  nickname      String?
  sex           Sex       @default(UNKNOWN)
  birth         Json?                           // GenDate (§6.7)
  birthSort     DateTime?
  birthPlaceId  String?
  death         Json?
  deathSort     DateTime?
  deathPlaceId  String?
  isLiving      Boolean   @default(true)        // calculé (présomption de vie), modifiable
  occupations   String[]
  biography     Json?                           // texte riche
  photoMediaId  String?
  privacy       Json      @default("{}")        // seuils et champs masqués (§6.5)
  sensitive     Json      @default("{}")        // champs sensibles et qui peut les voir
  externalRefs  Json      @default("{}")        // xref GEDCOM, identifiants Geneanet…
  mergedIntoId  String?                         // alias après une fusion
  member        Member?
  parents       ParentChild[] @relation("Child")
  children      ParentChild[] @relation("Parent")
  createdBy     String
  updatedAt     DateTime  @updatedAt
  @@index([surname, givenNames])
  @@index([birthSort])
}

model ParentChild {
  parentId  String
  childId   String
  type      FiliationType @default(BIOLOGICAL)
  parent    Person @relation("Parent", fields: [parentId], references: [id])
  child     Person @relation("Child",  fields: [childId],  references: [id])
  @@id([parentId, childId])
  @@index([childId])
}

model Union {
  id        String        @id @default(uuid())
  partnerAId String
  partnerBId String
  type      UnionType     @default(MARRIAGE)
  start     Json?                               // GenDate
  placeId   String?
  end       Json?
  endType   UnionEndType?
  @@index([partnerAId])
  @@index([partnerBId])
}

model PersonAncestry {                          // table de fermeture (§6.2), maintenue par le worker
  ancestorId   String
  descendantId String
  depth        Int                              // 0 = soi-même
  pathCount    Int    @default(1)               // > 1 en cas d'implexe
  @@id([ancestorId, descendantId])
  @@index([descendantId, depth])
}

model Place {
  id         String  @id @default(uuid())
  name       String                             // « Saint-Louis, Sénégal »
  normalized String
  country    String?
  lat        Float?
  lng        Float?
}

model PersonRevision {
  id        BigInt   @id @default(autoincrement())
  personId  String
  snapshot  Json
  authorId  String
  reason    String?
  createdAt DateTime @default(now())
  @@index([personId])
}

model ChangeProposal {
  id         String         @id @default(uuid())
  kind       String                             // 'person.update', 'link.add', 'merge'…
  targetId   String?
  payload    Json
  status     ProposalStatus @default(PENDING)
  authorId   String
  reviewerId String?
  comment    String?
  createdAt  DateTime       @default(now())
  @@index([status])
}

model Citation {                                // source d'un fait (GEN-05)
  id         String  @id @default(uuid())
  personId   String
  fact       String                             // 'birth', 'death', 'union:<id>'…
  documentId String?                            // document de la bibliothèque (soumis à ses ACL)
  reference  String?                            // référence externe (AD, registre…)
  note       String?
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

Les autres tables (non détaillées) : `Comment`, `Reaction`, `Event`, `Rsvp`, `Album`, `Media`, `MediaTag` (personnes identifiées, liées à `Person` et non à `Member`), `PersonDocument`, `GedcomImport`, `GedcomImportItem`, `Invitation`, `AccessRequest`, `Notification`, `NotificationPreference`, `PushSubscription`, `Session`.

---

## 8. Flux principaux

### 8.1 Authentification
- **Jeton d'accès JWT** (15 minutes) et **jeton de rafraîchissement** opaque (30 jours, avec **rotation** et détection de réutilisation), stocké haché dans `Session`.
- Le web utilise des **cookies `httpOnly` `SameSite=Lax`** et une protection CSRF par en-tête ; le mobile stocke les jetons dans le SecureStore.
- **Lien magique** : jeton aléatoire à usage unique, valable 15 minutes, envoyé par e-mail. C'est le mode de connexion par défaut pour les seniors.
- Mots de passe hachés avec **argon2id** ; **2FA TOTP** (otplib) obligatoire pour les administrateurs, codes de secours fournis.
- `@nestjs/throttler` limite les tentatives de connexion et de demande de lien (par IP et par adresse e-mail).

### 8.2 Inscription
```
Invitation (lien signé, peut pointer vers une fiche de l'arbre)
   ─▶ formulaire ─▶ « Retrouvez-vous dans l'arbre » : recherche du parent → choix de la fiche existante
      ou création de sa fiche comme enfant de ce parent ─▶ Member(status=PENDING) + rattachement en attente
   ─▶ notification aux référents de la branche de ce parent
   ─▶ validation ─▶ status=ACTIVE, personId confirmé ─▶ branch.sync (adhésions TREE) + groupe pays
   ─▶ e-mail de bienvenue (« Vous êtes le cousin germain de 23 membres… »)
```

### 8.3 Envoi d'un fichier
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

### 8.4 Téléchargement
`GET /documents/:id/download-url` → contrôle `DOWNLOAD` → URL S3 signée (5 minutes, `Content-Disposition` attachment) → entrée d'audit si le document est `sensitive`.
Les miniatures et vidéos passent par un CDN avec un **jeton signé** valable quelques heures, pour éviter de générer une URL par image.

### 8.5 Publication et notifications
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

## 9. API REST (extrait)

Préfixe `/api/v1`. Documentation Swagger sur `/api/docs` (accès réservé aux administrateurs en production).

| Domaine | Endpoints |
|---------|-----------|
| Auth | `POST /auth/login`, `POST /auth/magic-link`, `POST /auth/magic-link/verify`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/2fa/setup`, `POST /auth/2fa/verify` |
| Vitrine (public) | `GET /public/pages/:slug`, `GET /public/timeline`, `GET /public/events`, `GET /public/posts` (contenus `PUBLIC` uniquement), `POST /public/join-requests` (captcha), `POST /public/contact` (captcha) ; admin : `PUT /admin/public/pages/:slug`, `POST /admin/public/publish/:type/:id` |
| Invitations | `POST /invitations`, `GET /invitations/:token`, `POST /join-requests`, `POST /join-requests/:id/approve` |
| Membres | `GET /members?q=&branch=&country=`, `GET /members/:id`, `PATCH /members/me`, `GET /members/me/export` |
| Groupes | `GET /groups`, `POST /groups`, `POST /groups/:id/members`, `DELETE /groups/:id/members/:memberId` |
| Fil | `GET /feed?type=&group=&cursor=`, `POST /posts`, `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/pin` |
| Interactions | `GET/POST /posts/:id/comments`, `PUT/DELETE /posts/:id/reactions` |
| Événements | `POST /events`, `GET /events?from=&to=`, `PUT /events/:id/rsvp`, `GET /calendar.ics?token=` |
| Médias | `GET/POST /albums`, `GET /albums/:id/media`, `POST /media/:id/tags` |
| Bibliothèque | `GET /folders/:id/children`, `POST /folders`, `PATCH /folders/:id` (renommer ou déplacer), `POST /documents`, `GET /documents/:id`, `GET /documents/:id/versions`, `GET /documents/:id/download-url`, `DELETE /documents/:id`, `POST /trash/:id/restore` |
| Droits | `GET /acl/:type/:id`, `PUT /acl/:type/:id` (remplacement de la liste + `inheritPermissions`), `POST /access-requests`, `POST /access-requests/:id/decide`, `GET /admin/members/:id/effective-access` (« ce que voit X ») |
| Généalogie | `GET /persons?q=&place=&from=&to=`, `GET /persons/:id`, `POST /persons`, `PATCH /persons/:id`, `GET /persons/:id/revisions`, `POST /persons/:id/revert/:rev`, `POST /persons/:id/parents`, `DELETE /persons/:id/parents/:parentId`, `POST /unions`, `PATCH /unions/:id`, `GET /tree/:personId?up=4&down=3` (voisinage), `GET /kinship?a=&b=`, `GET /persons/:id/duplicates`, `POST /persons/:id/merge`, `GET/POST /proposals`, `POST /proposals/:id/decide`, `POST /gedcom/imports`, `GET /gedcom/imports/:id` (rapport + rapprochements), `POST /gedcom/imports/:id/apply`, `POST /gedcom/exports`, `GET /places?q=` |
| Envois | `POST /uploads`, `POST /uploads/:id/parts`, `POST /uploads/:id/complete` |
| Recherche | `GET /search/token` (clé Meilisearch à portée restreinte) ou `GET /search?q=` (proxy) |
| Notifications | `GET /notifications`, `POST /notifications/read`, `GET /notifications/stream` (SSE), `PUT /notifications/preferences`, `POST /push-subscriptions` |
| Admin | `GET /admin/dashboard`, `GET /admin/audit`, `GET /admin/reports`, `PATCH /admin/members/:id/role` |

Conventions : pagination par **curseur** ; les erreurs suivent la RFC 9457 (`problem+json`) ; **idempotence** des créations grâce à l'en-tête `Idempotency-Key` (utile avec les connexions instables) ; les dates sont en ISO 8601 UTC et c'est le client qui les affiche dans le fuseau du membre.

---

## 10. Sécurité et RGPD

| Sujet | Mesure |
|-------|--------|
| Transport | HTTPS partout (Caddy + Let's Encrypt), HSTS |
| En-têtes | `@fastify/helmet`, CSP stricte côté web ; `X-Robots-Tag: noindex` sur l'espace famille et l'API, indexation autorisée uniquement sur les pages de la vitrine |
| Vitrine publique | Lecture seule, pages générées statiquement (ISR de Next.js) et mises en cache CDN ; les endpoints publics ne lisent que des ressources dont `effective_access` contient `public` ; passage en `PUBLIC` réservé aux admins, avec double confirmation et audit ; captcha (Cloudflare Turnstile ou hCaptcha) et limitation de débit sur l'adhésion et le contact ; les médias publics sont servis depuis un préfixe S3 distinct, les médias privés n'ont jamais d'URL publique |
| Entrées | Validation avec zod (`nestjs-zod`) sur tous les DTO ; contenu riche nettoyé côté serveur (liste blanche des nœuds autorisés) |
| Fichiers | Liste blanche de types MIME, vérification des magic bytes, ClamAV, buckets **privés** uniquement, aucune URL publique |
| Secrets | Variables d'environnement chiffrées (SOPS ou gestionnaire de secrets de l'hébergeur), rotation des clés S3 |
| Droits | Moteur central, réponse 404 pour une ressource non autorisée, tests d'architecture, audit des changements de droits et des accès aux documents sensibles |
| Données personnelles | Hébergement dans l'UE ; GPS retiré des photos ; date de naissance et coordonnées masquées par défaut ; export de ses données (`/members/me/export`, archive ZIP) ; effacement (anonymisation des contributions, au choix du membre) ; retrait d'une photo sur simple demande |
| Généalogie | Les fiches de **vivants non inscrits** sont des données personnelles de tiers : minimisation (pas de coordonnées), information de la famille, **droit d'opposition** (une personne peut demander que sa fiche soit réduite au nom ou supprimée), exports filtrés et journalisés, présomption de vie appliquée partout. Les informations sur l'origine ou la filiation peuvent être sensibles : elles sont masquables. |
| Mineurs | Profil visible uniquement par les parents et la famille proche ; pas d'identification sur les photos sans l'accord du tuteur |
| Sauvegardes | PostgreSQL : `pgBackRest` (sauvegarde complète hebdomadaire, journaux WAL en continu) vers un bucket situé dans **une autre région**. S3 : versioning + réplication. Test de restauration trimestriel documenté. |

---

## 11. Infrastructure et déploiement

### 11.1 Démarrage (environ 700 membres)
- **1 VPS** (4 vCPU, 16 Go de RAM, par exemple chez Hetzner ou Scaleway) avec Docker Compose : `caddy`, `api` (2 répliques), `worker`, `postgres`, `redis`, `meilisearch`, `clamav`.
- **Stockage objet** S3 européen + CDN (Bunny CDN ou CDN de l'hébergeur).
- Déploiement simplifié avec **Coolify** ou **Dokku**, ou une GitHub Action qui construit les images (GHCR) puis exécute `docker compose pull && up -d`, avec les migrations Prisma lancées avant le démarrage de l'API.
- Variante plus confortable : **PostgreSQL géré** par l'hébergeur (sauvegardes incluses) et le reste sur le VPS.

### 11.2 Environnements
`local` (docker compose avec MinIO et Mailpit) → `staging` (même VPS, autre base de données, données fictives) → `production`.

### 11.3 Coûts indicatifs (à confirmer auprès des fournisseurs)
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

## 12. Qualité et tests

| Niveau | Outils | Cible |
|--------|--------|-------|
| Unitaires | Vitest ou Jest | Moteur de droits (matrice exhaustive), règles métier des publications et des récapitulatifs |
| Intégration / e2e | Supertest + **Testcontainers** (PostgreSQL, Redis, MinIO) | Chaque endpoint : cas autorisé, cas non autorisé (404), membre d'une autre branche |
| Généalogie | Vitest + fixtures | Libellés de parenté (tableau §6.3, demi-frères, implexes), cohérence de la table de fermeture après ajout ou suppression (comparaison avec un recalcul complet), anti-cycle, présomption de vie, sérialiseur de confidentialité, import/export GEDCOM aller-retour sur des fichiers réels (Heredis, Geneanet, Gramps) |
| Architecture | Test qui inspecte les métadonnées des contrôleurs | Aucune route sans règle d'accès |
| Front | Playwright | Parcours clés : inscription, publication d'une naissance, dépôt d'un document restreint |
| CI | GitHub Actions | lint, typecheck, tests, build des images, scan des dépendances (`pnpm audit`, Trivy) |

---

## 13. Planning de réalisation (MVP)

Estimation pour **1 développeur full-stack expérimenté**, ou 2 développeurs à mi-temps.

| Sprint (2 semaines) | Contenu |
|---------------------|---------|
| S1 | Monorepo, CI, infrastructure locale, schéma Prisma de base, authentification (lien magique, JWT, sessions) |
| S2 | Membres, invitations, validation, groupes, annuaire ; squelette web Next.js ; **vitrine publique** (pages éditables, demande d'adhésion, contact) |
| S3 | **Moteur d'autorisations** (ACL, héritage, `effective_access`, guards, tests) |
| S4 | **Généalogie 1** : personnes, filiations, unions, dates généalogiques, table de fermeture, anti-cycle, fiches, historique, `GenealogyPolicy` et propositions, rattachement à l'inscription |
| S5 | **Généalogie 2** : arbre interactif, lien de parenté, branches automatiques, confidentialité des vivants, import/export GEDCOM, doublons et fusion |
| S6 | Envois S3, worker (antivirus, images, PDF), bibliothèque (dossiers, documents, aperçu, corbeille), sources et documents liés aux fiches |
| S7 | Fil d'actualité, publications typées (avec lien vers les fiches), commentaires et réactions, audiences |
| S8 | Événements et réponses de présence, albums, vidéos (HLS ou Bunny), identification des personnes sur les photos, anniversaires et commémorations |
| S9 | Notifications (in-app, SSE, push, récapitulatif par fuseau), recherche Meilisearch avec droits (y compris les personnes), carte des lieux |
| S10 | Administration, audit, RGPD (export et effacement), export PDF de l'arbre, PWA, durcissement de la sécurité, recette avec les ambassadeurs |

**Total : environ 20 semaines** (≈ 75 à 100 jours de développement, back et front compris), puis environ 2 à 4 jours par mois de maintenance et d'évolutions.
Si l'on doit gagner du temps, les éléments S de la généalogie (carte, éventail, export PDF, liens par alliance) peuvent glisser en V1.1 sans remettre en cause le modèle.

**V2** : application Expo, multilingue, lettre d'information mensuelle, messagerie, reconnaissance faciale (facultative et désactivée par défaut).

---

## 14. Décisions à confirmer

1. **Prisma ou Drizzle** : Prisma par défaut (plus accessible) ; Drizzle si l'on veut davantage de SQL brut (`ltree`, CTE).
2. **Vidéo** : traitement maison avec ffmpeg (aucun coût de service, mais du CPU sur le VPS) ou **Bunny Stream** (plus simple, avec une facture à l'usage). Je recommande Bunny Stream pour le MVP.
3. **Recherche** : Meilisearch dès la V1, ou la recherche plein texte de PostgreSQL au départ (une brique de moins) puis Meilisearch en V1.1.
4. **Mobile** : PWA seule pour le MVP, puis Expo en V2 (recommandé).
5. **Arbre existant** : récupérer dès maintenant le ou les fichiers GEDCOM existants pour tester l'import en S5 sur des données réelles.
6. **Seuil de « proximité »** pour la confidentialité des vivants (degré civil ≤ 4 par défaut) et **qui valide les propositions** (référents de branche seuls ou un comité généalogie).
7. **Hébergement** : VPS administré par un membre de la famille, ou services gérés (un peu plus cher, mais moins de risque si cette personne n'est plus disponible).
