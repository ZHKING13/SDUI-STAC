# Site familial – Cahier des spécifications fonctionnelles

> Version 0.2 – Octobre 2026 – Document de travail

---

## 1. Contexte et objectifs

### 1.1 Contexte
- Une famille d'environ **600 à 700 membres**, répartis dans **plusieurs pays et fuseaux horaires**.
- Les échanges passent aujourd'hui sans doute par WhatsApp, Facebook ou des e-mails : l'information se perd, les photos sont éparpillées et les documents importants (actes, archives, photos anciennes, comptes rendus) n'ont pas de lieu de rangement.

### 1.2 Objectifs
| # | Objectif | Indicateur de réussite |
|---|----------|------------------------|
| O1 | Centraliser l'**actualité familiale** (naissances, décès, mariages, rencontres, annonces) | ≥ 60 % des membres inscrits connectés au moins une fois par mois |
| O2 | Offrir une **bibliothèque / cloud familial** de documents et médias | Archives importantes numérisées et retrouvables en moins de 3 clics |
| O3 | Gérer **finement qui voit quoi** (documents et publications) | Aucun accès non autorisé ; droits gérables par des non-informaticiens |
| O4 | Être **simple pour tous les âges** et utilisable sur mobile, même avec une connexion lente | Un membre de 70 ans publie une photo sans aide |
| O5 | Rester **privé** : rien n'est visible publiquement sur Internet | Site fermé, pas de référencement par les moteurs de recherche |
| O6 | Construire et faire vivre l'**arbre généalogique** de la famille, relié aux membres, aux photos et aux archives | 80 % des membres inscrits rattachés à l'arbre 6 mois après l'ouverture |

### 1.3 Hors périmètre (V1)
- Réseau social public, monétisation, publicité.
- Messagerie temps réel complète type WhatsApp (on pourra la prévoir en V2).

---

## 2. Acteurs et rôles

| Rôle | Description | Droits principaux |
|------|-------------|-------------------|
| **Super-administrateur** | 1 à 3 personnes (comité technique) | Tout : configuration, rôles, sauvegardes, suppression de comptes |
| **Administrateur** | Comité familial | Valide les inscriptions, gère les groupes, modère, gère les droits documentaires |
| **Modérateur / Référent de branche** | 1 ou 2 par branche familiale | Valide les membres de sa branche, modère les publications de son espace |
| **Membre** | Membre de la famille validé | Publie, commente, réagit, dépose des documents dans les espaces autorisés |
| **Membre junior** (mineur) | Compte rattaché à un parent | Droits limités ; profil non visible hors de la famille proche |
| **Invité** (conjoint récent, ami proche, prestataire) | Accès temporaire ou limité | Lecture seule sur des espaces précis, avec date d'expiration |

### 2.1 Groupes
Les droits ne s'attribuent pas personne par personne mais surtout **par groupe**. Un membre peut appartenir à plusieurs groupes.
- **Groupes structurels** (créés par les admins) : branches familiales (ex. « Descendants de X »), générations, pays/villes.
- **Groupes thématiques** : comité d'organisation de la réunion annuelle, conseil de famille, gestion du patrimoine, etc.
- **Groupes ad hoc** : créés par des membres (ex. « Cousins Montréal »), soumis à validation.

---

## 3. Parcours clés (cas d'usage)

1. **Rejoindre la famille** : je reçois un lien d'invitation (ou je fais une demande) → je renseigne mon identité et mon rattachement (« fils de… ») → un référent valide → j'accède au site.
2. **Annoncer une naissance** : je crée une publication de type « Naissance » → j'ajoute nom, date, photos → je choisis la visibilité (toute la famille) → les membres reçoivent une notification.
3. **Annoncer un décès** : publication de type « Décès » avec un modèle sobre → informations sur les obsèques → **livre de condoléances** où chacun laisse un message → épinglée en haut du fil pendant X jours.
4. **Organiser une rencontre** : je crée un événement (date, lieu, lien visio) → les membres répondent présent / absent / peut-être → après l'événement, un album partagé reçoit les photos de tous.
5. **Déposer un document restreint** : je dépose le compte rendu du conseil de famille dans le dossier « Conseil de famille » → seuls les membres de ce groupe le voient.
6. **Retrouver une archive** : je cherche « mariage grand-père 1962 » → je trouve la photo numérisée et l'acte, si j'y ai droit.

---

## 4. Spécifications fonctionnelles

Priorités : **M** = indispensable (V1), **S** = souhaitable (V1 si possible), **C** = plus tard (V2+).

### 4.1 Comptes, inscription et profils
| ID | Exigence | Prio |
|----|----------|------|
| CPT-01 | Inscription **uniquement sur invitation ou sur demande validée** (pas d'inscription libre) | M |
| CPT-02 | Lors de l'inscription, l'utilisateur **se situe dans l'arbre généalogique** (« je suis l'enfant de… ») ; le référent valide à la fois le compte et ce rattachement | M |
| CPT-03 | Validation par un admin ou par le référent de la branche, avec une file d'attente et des rappels | M |
| CPT-04 | Connexion par e-mail + mot de passe, **lien magique** (connexion sans mot de passe) et éventuellement Google/Apple | M |
| CPT-05 | Double authentification (2FA) obligatoire pour les admins, facultative pour les autres | S |
| CPT-06 | Profil : photo, nom (y compris nom de jeune fille), pays, ville, langue, date de naissance (visibilité réglable), coordonnées (visibilité réglable) | M |
| CPT-07 | **Annuaire familial** consultable, avec recherche par nom, branche ou pays | M |
| CPT-08 | Comptes « junior » gérés par un parent ; comptes « mémoriaux » pour les membres décédés | S |
| CPT-09 | Désactivation et suppression de compte (droit à l'effacement RGPD) | M |
| CPT-10 | Comptes invités avec date d'expiration | S |

### 4.2 Fil d'actualité et publications
| ID | Exigence | Prio |
|----|----------|------|
| ACT-01 | Fil d'actualité chronologique, filtrable par type, groupe ou branche | M |
| ACT-02 | **Types de publication** avec des modèles : Naissance, Décès, Mariage, Rencontre/Événement, Annonce, Réussite (diplôme, etc.), Souvenir/Archive, Publication libre | M |
| ACT-03 | Texte enrichi, **photos multiples, vidéos**, documents joints, liens | M |
| ACT-04 | **Visibilité par publication** : toute la famille / un ou plusieurs groupes / moi seul (brouillon) | M |
| ACT-05 | Commentaires, réactions (« j'aime », « condoléances », « félicitations ») | M |
| ACT-06 | Mention de membres (@nom) avec notification | S |
| ACT-07 | Épinglage des annonces importantes par un admin, avec date de fin | M |
| ACT-08 | Livre de condoléances / livre d'or associé à une publication | S |
| ACT-09 | Modération : signalement, masquage, suppression, historique des actions | M |
| ACT-10 | Publication possible par un tiers « au nom de » (ex. un petit-fils publie pour sa grand-mère) | S |
| ACT-11 | Programmation d'une publication (date et heure de mise en ligne) | C |

### 4.3 Événements et calendrier
| ID | Exigence | Prio |
|----|----------|------|
| EVT-01 | Création d'événements : titre, date/heure **avec fuseau horaire**, lieu (carte), lien visio | M |
| EVT-02 | Réponses (présent / absent / peut-être + nombre d'accompagnants) | M |
| EVT-03 | Calendrier familial (anniversaires facultatifs, événements) et export iCal / Google Agenda | S |
| EVT-04 | Album photo automatiquement lié à l'événement | S |
| EVT-05 | Rappels automatiques (J-7, J-1) | S |
| EVT-06 | Cagnotte ou contributions financières (ex. réunion annuelle), via un lien vers un service externe | C |

### 4.4 Médiathèque (photos et vidéos)
| ID | Exigence | Prio |
|----|----------|------|
| MED-01 | Albums (par événement, par année, par branche) avec la même gestion des droits que les documents | M |
| MED-02 | Envoi en masse depuis le mobile ou l'ordinateur, avec **reprise en cas de coupure** | M |
| MED-03 | Compression et miniatures automatiques ; vidéos converties pour une lecture fluide, y compris avec une connexion lente | M |
| MED-04 | Identification des personnes sur les photos (manuelle) | S |
| MED-05 | Reconnaissance faciale automatique (désactivée par défaut à cause du RGPD) | C |
| MED-06 | Téléchargement de l'original selon les droits | M |
| MED-07 | Frise chronologique « La famille à travers les années » | C |

### 4.5 Bibliothèque documentaire (cloud familial)
| ID | Exigence | Prio |
|----|----------|------|
| DOC-01 | Arborescence de **dossiers et sous-dossiers** | M |
| DOC-02 | Dépôt de tout type de fichier (PDF, Word, images, audio, vidéo) avec une taille maximale configurable | M |
| DOC-03 | **Aperçu en ligne** (PDF, images, Office) sans téléchargement | M |
| DOC-04 | Métadonnées : titre, description, date du document (≠ date de dépôt), personnes concernées, mots-clés, catégorie (état civil, foncier, archives, comptes rendus…) | M |
| DOC-05 | **Recherche** plein texte sur les titres, les métadonnées et, si possible, le contenu des documents (OCR des scans) | S |
| DOC-06 | Gestion des versions (historique, retour à une version précédente) | S |
| DOC-07 | Corbeille avec restauration pendant 30 jours | M |
| DOC-08 | Journal des accès et des téléchargements pour les documents sensibles | S |
| DOC-09 | Filigrane ou blocage du téléchargement (consultation seule) pour certains documents | C |
| DOC-10 | Lien de partage externe temporaire et protégé par mot de passe (désactivable globalement) | C |

### 4.6 Gestion des autorisations (point central)

**Principe** : chaque objet (publication, album, dossier, document) a un **niveau de visibilité** et une **liste d'accès** (ACL).

#### Niveaux de visibilité prédéfinis
| Niveau | Qui voit |
|--------|----------|
| 🟢 **Famille** | Tous les membres validés |
| 🔵 **Groupe(s)** | Les membres d'un ou plusieurs groupes choisis (branche, comité…) |
| 🟠 **Restreint** | Une liste nominative de personnes |
| 🔴 **Privé** | Le déposant (et les admins, en cas de besoin) |

#### Droits possibles sur un dossier ou un document
| Droit | Effet |
|-------|-------|
| Voir | Consulter et afficher l'aperçu |
| Télécharger | Récupérer le fichier original |
| Contribuer | Ajouter des fichiers dans le dossier |
| Modifier | Renommer, déplacer, remplacer, modifier les métadonnées |
| Gérer | Modifier les droits du dossier |

#### Règles
| ID | Exigence | Prio |
|----|----------|------|
| AUT-01 | Les droits sont **hérités** du dossier parent, avec la possibilité de les restreindre au niveau d'un sous-dossier | M |
| AUT-02 | Attribution des droits **par groupe** (recommandé) et par personne (exception) | M |
| AUT-03 | Interface simple : « Qui peut voir ce document ? » avec des cases à cocher, sans jargon | M |
| AUT-04 | Indicateur visuel du niveau de visibilité sur chaque élément (pastille de couleur) | M |
| AUT-05 | Un document non autorisé est **invisible** (il n'apparaît ni dans les listes ni dans la recherche) | M |
| AUT-06 | Demande d'accès : un membre peut demander l'accès à un dossier dont il connaît l'existence ; le gestionnaire accepte ou refuse | S |
| AUT-07 | Accès temporaire (date d'expiration) | S |
| AUT-08 | Vue « Ce que voit X » pour que les admins vérifient les droits d'un membre | S |
| AUT-09 | Journal (audit) des modifications de droits | M |

### 4.7 Notifications et communication
| ID | Exigence | Prio |
|----|----------|------|
| NOT-01 | Notifications dans l'application et notifications push (mobile) | M |
| NOT-02 | **Récapitulatif par e-mail** (quotidien, hebdomadaire ou désactivé), choisi par chaque membre ; c'est essentiel pour les membres peu connectés | M |
| NOT-03 | Notifications immédiates pour les annonces majeures (décès, naissance), configurables | M |
| NOT-04 | Lettre d'information mensuelle générée à partir des publications du mois | C |
| NOT-05 | Pont vers WhatsApp/Telegram (lien vers la publication) | C |
| NOT-06 | Messagerie privée entre membres | C |

### 4.8 Généalogie (V1)

**Principe** : l'arbre contient des **personnes** (vivantes ou décédées, inscrites ou non). Un **membre** du site est relié à une seule personne de l'arbre ; la plupart des personnes de l'arbre (ancêtres, enfants en bas âge, membres non inscrits) n'ont pas de compte. L'arbre devient la colonne vertébrale du site : il sert à situer les nouveaux inscrits, à constituer automatiquement les branches et à relier photos et archives aux bonnes personnes.

#### Fiches et liens
| ID | Exigence | Prio |
|----|----------|------|
| GEN-01 | **Fiche personne** : nom(s), prénoms, surnom, sexe, dates et lieux de naissance et de décès (dates approximatives possibles : « vers 1890 », « avant 1920 »), professions, biographie, photo de profil | M |
| GEN-02 | **Liens familiaux** : parents/enfants (biologique, adoption, famille recomposée) et unions (mariage, union libre, divorce, veuvage, avec dates) ; plusieurs unions possibles | M |
| GEN-03 | Rattachement d'un compte membre à sa fiche, avec validation par un référent | M |
| GEN-04 | **Galerie et archives liées** : photos de la médiathèque, documents de la bibliothèque (actes, faire-part), publications (naissance, décès) reliés à la fiche, en respectant les droits de chacun | M |
| GEN-05 | **Sources** : chaque information peut citer un document de la bibliothèque ou une référence externe (archives départementales, registre paroissial…) | S |
| GEN-06 | Création automatique ou proposée d'une fiche lors d'une publication « Naissance », « Mariage » ou « Décès » | S |

#### Visualisation et navigation
| ID | Exigence | Prio |
|----|----------|------|
| GEN-07 | **Arbre interactif** : vue centrée sur une personne (ascendants et descendants), zoom, déplacement, recentrage par clic, fonctionne sur mobile | M |
| GEN-08 | Plusieurs vues : arbre de descendance, arbre d'ascendance, **éventail**, liste par génération | S |
| GEN-09 | **« Quel est notre lien ? »** : calcul et affichage du lien de parenté entre deux personnes (« cousin issu de germain », « grand-oncle »), avec le chemin dans l'arbre | M |
| GEN-10 | Recherche de personnes par nom (y compris nom de naissance), lieu, période | M |
| GEN-11 | Carte des lieux (naissances, mariages, résidences) et des migrations de la famille | S |
| GEN-12 | Impression ou export PDF d'un arbre (pour un mur, une réunion de famille) | S |
| GEN-13 | Calendrier des anniversaires et des commémorations de décès, alimenté par l'arbre | S |

#### Contribution et qualité
| ID | Exigence | Prio |
|----|----------|------|
| GEN-14 | **Contribution collaborative** : chaque membre peut modifier sa propre fiche, celles de ses enfants mineurs et de ses ascendants directs ; les autres modifications sont des **propositions** validées par un référent de la branche | M |
| GEN-15 | **Historique** complet des modifications de chaque fiche, avec retour en arrière possible | M |
| GEN-16 | Détection des **doublons** (même nom, dates proches) et fusion de deux fiches | S |
| GEN-17 | Contrôles de cohérence (enfant né avant son parent, parent de 8 ans, décès avant la naissance…) affichés comme avertissements | S |
| GEN-18 | Discussion ou commentaires sur une fiche (« quelqu'un a-t-il une photo de lui ? ») | S |

#### Import, export et branches
| ID | Exigence | Prio |
|----|----------|------|
| GEN-19 | **Import GEDCOM** (5.5.1 et 7) pour reprendre un arbre existant (Geneanet, MyHeritage, Heredis, Gramps…), avec un rapport d'import et une prévisualisation avant validation | M |
| GEN-20 | **Export GEDCOM** de tout ou partie de l'arbre (selon les droits) | M |
| GEN-21 | **Branches générées depuis l'arbre** : un administrateur désigne un ancêtre et le groupe « Descendants de X » est créé et **mis à jour automatiquement** (nouveau membre rattaché → ajouté au groupe) ; les conjoints peuvent être inclus ou non | M |

#### Confidentialité
| ID | Exigence | Prio |
|----|----------|------|
| GEN-22 | **Protection des vivants** : pour une personne vivante, les dates et lieux précis ne sont visibles que de sa famille proche (réglable) ; les autres voient seulement le nom et la place dans l'arbre | M |
| GEN-23 | Une personne présumée vivante (née il y a moins de 100 ans, sans date de décès) est traitée comme vivante | M |
| GEN-24 | Fiches mineures : visibilité réduite (prénom et place dans l'arbre seulement) hors de la famille proche | M |
| GEN-25 | Possibilité de masquer certaines informations sensibles (adoption, filiation) à la demande de la personne ou de sa famille | S |
| GEN-26 | L'export GEDCOM n'inclut les données des vivants que pour les administrateurs et sur demande explicite (journalisée) | M |

### 4.9 Administration
| ID | Exigence | Prio |
|----|----------|------|
| ADM-01 | Tableau de bord : inscriptions en attente, signalements, espace de stockage utilisé, membres actifs | M |
| ADM-02 | Gestion des groupes et des rôles | M |
| ADM-03 | Quotas de stockage (global, par membre) | S |
| ADM-04 | Paramétrage des types de publication et des catégories de documents | S |
| ADM-05 | Export complet des données (réversibilité) | M |

---

## 5. Exigences non fonctionnelles

| Domaine | Exigence |
|---------|----------|
| **Accès** | Site **entièrement privé** : aucune page n'est publique hormis la connexion, et le site n'est pas indexé par les moteurs de recherche |
| **Plateformes** | Responsive et mobile d'abord ; **application installable (PWA)** au minimum, applications natives iOS/Android en option |
| **Langues** | Français en V1 ; anglais (et autres langues de la diaspora) en option. Dates et heures affichées dans le fuseau de chaque utilisateur |
| **Performance** | Utilisable avec une connexion 3G : images optimisées, vidéos adaptatives, chargement progressif du fil |
| **Accessibilité** | Grande taille de police possible, contrastes élevés (WCAG AA), parcours simples pour les seniors |
| **Volumétrie** | 700 utilisateurs, environ 50 à 150 actifs en même temps lors d'un pic (annonce de décès). Stockage : **prévoir 1 à 3 To sur 5 ans** (les vidéos représentent la plus grande part) |
| **Sécurité** | HTTPS, mots de passe chiffrés, 2FA pour les admins, protection contre les attaques par force brute, fichiers servis via des liens signés et temporaires (jamais d'URL publique permanente) |
| **Sauvegardes** | Quotidiennes, chiffrées, **hors site** (règle 3-2-1), test de restauration chaque trimestre |
| **Disponibilité** | 99,5 % suffisent (ce n'est pas un service critique) |
| **RGPD** | Hébergement dans l'UE de préférence ; consentement à l'inscription ; droit à l'image (un membre peut demander à être retiré d'une photo) ; protection renforcée des mineurs ; droit d'accès et d'effacement ; politique de confidentialité et charte d'utilisation |
| **Réversibilité** | Export de toutes les données et de tous les fichiers dans des formats ouverts ; éviter l'enfermement chez un fournisseur |
| **Pérennité** | La plateforme doit survivre au départ de la personne qui l'a créée : documentation, plusieurs admins, coûts portés par la famille (association ou cagnotte) |

---

## 6. Gouvernance (non technique mais indispensable)

- **Charte d'utilisation** : ce qu'on publie ou non, respect de la vie privée, ton des échanges, photos d'enfants.
- **Comité** : 3 à 5 admins issus de différentes branches et de différents pays.
- **Référents de branche** pour valider les inscriptions (personne ne connaît 700 personnes).
- **Financement** : une petite cotisation ou une cagnotte annuelle couvre largement les coûts d'hébergement. Une association loi 1901 « famille X » peut porter le service.
- **Plan de lancement** : commencer avec 30 à 50 « ambassadeurs », numériser quelques archives emblématiques pour donner envie, puis ouvrir largement (par exemple lors d'une réunion de famille).

---

## 7. Solutions existantes (état du marché)

### 7.1 Solutions « clé en main » (SaaS)
| Solution | Description | Points forts | Limites |
|----------|-------------|--------------|---------|
| **Famicity** (FR) | Réseau social familial privé avec arbre, albums et souvenirs | Français, pensé pour la famille, privé | Peu adapté à une gestion fine des droits documentaires pour 700 personnes ; fonctionnalités avancées payantes |
| **MyHeritage – sites familiaux / Geneanet** | Plateformes de généalogie avec un espace familial | Arbre excellent, ancrage généalogique | Orientées généalogie plutôt qu'actualité ; pas un vrai cloud documentaire |
| **Famileo** | Gazette papier pour les grands-parents à partir des publications | Idéal pour les aînés non connectés | Pas de bibliothèque ; complément plutôt que solution principale |
| **Mighty Networks / Circle / Skool** | Plateformes de communautés privées (fil, événements, groupes, apps mobiles) | Très bonne expérience, applis mobiles, événements | Coût mensuel non négligeable, hébergement aux États-Unis, gestion de fichiers basique |
| **Google Workspace / Microsoft 365 (Teams + SharePoint)** | Suite collaborative | Droits documentaires puissants, fiable | Pas convivial pour un fil d'actualité familial ; coût par utilisateur prohibitif pour 700 personnes |
| **Groupes Facebook / WhatsApp Communautés** | Ce que les familles utilisent souvent déjà | Gratuit, tout le monde l'a déjà | Pas de bibliothèque, pas de droits fins, données chez Meta, informations noyées |

### 7.2 Briques open source (auto-hébergeables)
| Solution | Rôle | Commentaire |
|----------|------|-------------|
| **HumHub** | Réseau social privé : fil, espaces (= groupes), événements, fichiers, wiki, application mobile | **Très proche du besoin** « actualité + groupes + droits par espace ». Open source (PHP), modules nombreux |
| **Nextcloud** | Cloud documentaire : dossiers, partages par groupe, versions, aperçus, application mobile, synchronisation photos | **Référence pour la partie bibliothèque** et ses droits fins. Intègre aussi Talk, Agenda, Photos |
| **Immich** | Alternative à Google Photos auto-hébergée (albums partagés, reconnaissance faciale) | Excellente pour la médiathèque, mais ses droits sont plus simples |
| **Gramps Web** | Généalogie collaborative en ligne (GEDCOM) | Couvre la partie arbre dans les propositions B et C |
| **Keycloak / Authentik** | Authentification unique (SSO) | Un seul compte pour HumHub, Nextcloud, Immich… |
| **Discourse** | Forum moderne | Bon pour les discussions, moins pour les annonces visuelles |
| **WordPress + BuddyBoss / BuddyPress** | CMS avec une couche de réseau social | Très personnalisable, mais un empilement de plugins à maintenir |

---

## 8. Propositions de solutions

### Proposition A – SaaS clé en main (le plus rapide)
**Exemple** : Mighty Networks ou Circle pour le fil et les événements, et un Google Drive partagé ou un compte Nextcloud hébergé pour les documents. Pour l'arbre : **Geneanet** ou **MyHeritage** (site familial), avec un lien depuis la plateforme.
- ✅ Opérationnel en **1 à 2 semaines**, aucune maintenance technique, applications mobiles incluses.
- ❌ Coût récurrent (plateforme par abonnement), trois outils distincts, arbre non relié aux membres ni aux archives, droits documentaires séparés du reste, dépendance au fournisseur, données hors UE.
- 👉 Adapté si personne ne peut porter la technique.

### Proposition B – Assemblage open source HumHub + Nextcloud + Gramps Web (⭐ recommandée pour démarrer)
**Architecture** :
```
              ┌───────────────────────────────┐
              │  Authentik / Keycloak (SSO)   │  ← un seul compte par membre
              └──────────────┬────────────────┘
          ┌──────────────────┼──────────────────┬──────────────────┐
   ┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐   ┌───────▼──────┐
   │   HumHub    │   │   Nextcloud   │   │ Gramps Web  │   │ Immich (opt) │
   │ Actualités, │   │ Bibliothèque, │   │ Arbre,      │   │ Photos /     │
   │ événements, │   │ droits fins,  │   │ GEDCOM,     │   │ vidéos       │
   │ groupes     │   │ versions      │   │ sources     │   │              │
   └─────────────┘   └───────┬───────┘   └─────────────┘   └──────────────┘
                     ┌───────▼────────┐
                     │ Stockage objet │  (S3 – Scaleway, OVH, Backblaze…)
                     └────────────────┘
```
- Les **groupes** (branches, comités) sont définis une seule fois dans le SSO et utilisés par HumHub et Nextcloud.
- **Gramps Web** apporte l'arbre collaboratif (import/export GEDCOM, sources, médias, protection des vivants, rôles d'édition). Ses limites ici : les branches ne sont pas générées automatiquement dans le SSO, les fiches ne sont pas reliées aux comptes HumHub, et le calcul « quel est notre lien ? » reste basique. Ces exigences (GEN-03, GEN-09, GEN-21) demanderaient des scripts d'intégration.
- Hébergement : un serveur VPS (8 à 16 Go de RAM) chez un hébergeur européen + du stockage objet. **Coût indicatif : 30 à 80 €/mois** pour l'ensemble, selon le volume de vidéos ; à confirmer auprès des hébergeurs.
- Alternative sans administration système : **Nextcloud géré** (offres hébergées d'hébergeurs européens) + HumHub en version hébergée (offre SaaS de l'éditeur).
- ✅ Couvre environ 75 à 80 % du cahier des charges dès la V1 (moins qu'avant l'ajout de la généalogie, faute d'intégration native de l'arbre), données maîtrisées, faible coût, applications mobiles existantes, réversible.
- ❌ Trois interfaces à apprendre (atténuable avec des liens croisés et un thème commun), maintenance (mises à jour, sauvegardes) à confier à une personne compétente, expérience moins « léchée » qu'un produit sur mesure.
- 👉 Délai : **4 à 8 semaines** de mise en place et de paramétrage, plus la migration des archives.

### Proposition C – WordPress + BuddyBoss + extension documentaire
- ✅ Une seule interface, énorme écosystème, nombreux prestataires disponibles.
- ❌ Gestion fine des droits documentaires fragile (dépend de plugins), généalogie à ajouter via un plugin (par ex. de type TNG ou un plugin GEDCOM) ou Gramps Web à part, sécurité et mises à jour à surveiller de près, performance médiocre avec beaucoup de vidéos.
- 👉 Une option intermédiaire, que je ne recommande pas en priorité pour les besoins d'autorisations.

### Proposition D – Développement sur mesure (la plus adaptée à long terme, la plus coûteuse)
**Stack indicative** :
- **Front** : Next.js (web + PWA) ; application mobile **React Native / Expo** en option.
- **Back** : Supabase (PostgreSQL + authentification + **Row Level Security** pour les droits) ou une API Node/NestJS.
- **Fichiers** : stockage S3 avec des URL signées ; vidéos via Mux, Cloudflare Stream ou Bunny Stream (conversion et lecture adaptative).
- **Recherche** : PostgreSQL plein texte ou Meilisearch ; OCR des scans (Tesseract).
- **E-mails** : Resend / Brevo pour les récapitulatifs.
- **Modèle de droits** : tables `groups`, `memberships`, `resources`, `acl_entries (resource, principal, permission)` + héritage par dossier, appliqué directement dans la base de données (RLS) afin qu'aucun contenu non autorisé ne puisse fuiter.

Exemple de modèle de données simplifié :
```
Member(id, nom, prénoms, branche_id, rôle, statut, langue, fuseau)
Group(id, nom, type[branche|comité|adhoc])
Membership(member_id, group_id, rôle_dans_groupe)
Post(id, auteur_id, type[naissance|décès|…], contenu, visibilité, épinglé_jusqu_au)
Event(id, post_id, début, fin, fuseau, lieu, lien_visio)
Rsvp(event_id, member_id, réponse, accompagnants)
Person(id, member_id?, noms, prénoms, sexe, naissance, décès, lieux, vivant, confidentialité)
ParentChild(parent_id, child_id, type[biologique|adoption|recomposée])
Union(id, personne_a, personne_b, type, début, fin)
Folder(id, parent_id, nom, hérite_droits)
Document(id, folder_id, fichier, métadonnées, version)
AclEntry(ressource_type, ressource_id, principal_type[groupe|membre], principal_id, permission, expire_le)
AuditLog(acteur_id, action, cible, date)
```
- ✅ Expérience unifiée et pensée pour la famille (modèles de publication, livre de condoléances, **arbre relié aux membres, aux branches et aux archives**), évolutif.
- ❌ Coût : MVP d'environ **55 à 90 jours de développement** (généalogie comprise) (soit plusieurs dizaines de milliers d'euros avec un prestataire, ou plusieurs mois pour un bénévole), et une maintenance à vie à assurer.
- 👉 Pertinent si un membre de la famille est développeur et motivé, ou si la famille veut un produit vraiment à son image.

### Synthèse comparative
| Critère | A – SaaS | B – HumHub + Nextcloud | C – WordPress | D – Sur mesure |
|---------|:--------:|:----------------------:|:-------------:|:--------------:|
| Délai de mise en route | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| Coût initial | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Coût récurrent | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Droits documentaires fins | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| Expérience unifiée | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Généalogie intégrée au reste | ⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| Maîtrise des données / RGPD | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Maintenance requise | ⭐⭐⭐ (aucune) | ⭐⭐ | ⭐ | ⭐ |

### Recommandation
1. **Démarrer avec la proposition B** (HumHub + Nextcloud + Gramps Web + SSO), éventuellement en version hébergée pour éviter l'administration système. Cela valide les usages réels à faible coût.
2. Mesurer l'adoption pendant 6 à 12 mois (qui publie, quelles fonctions sont utilisées).
3. Si des limites apparaissent (expérience, fonctionnalités familiales spécifiques, intégration de l'arbre), **migrer vers la proposition D** avec un cahier des charges affiné par l'usage réel. Les données sont exportables, donc la migration reste possible.

> **Effet de l'ajout de la généalogie en V1** : si l'arbre doit être le cœur du site dès le lancement (rattachement des membres, branches calculées automatiquement, liens de parenté, photos d'ancêtres reliées aux fiches), l'intégration entre outils séparés devient le point faible de la proposition B, et la **proposition D** gagne en intérêt. Son architecture est détaillée dans [architecture-technique-nestjs.md](./architecture-technique-nestjs.md).

---

## 9. Feuille de route indicative

| Phase | Contenu | Durée |
|-------|---------|-------|
| 0 – Cadrage | Valider ce cahier, constituer le comité, définir les branches et les groupes, rédiger la charte | 2 à 4 semaines |
| 1 – MVP | Comptes et validation, fil d'actualité typé, événements, bibliothèque avec droits par groupe, **arbre généalogique** (import GEDCOM, rattachement des membres, branches automatiques), récapitulatif e-mail | 5 à 9 semaines (B) / 4 à 5 mois (D) |
| 2 – Pilote | 30 à 50 ambassadeurs, corrections, numérisation des premières archives, **complétion de l'arbre par branche** | 1 mois |
| 3 – Ouverture | Invitation de toute la famille par branche, formation (tutoriels vidéo courts) | 1 à 2 mois |
| 4 – V2 | Multilingue, reconnaissance des personnes sur les photos, lettre d'information, messagerie | Selon les besoins |

---

## 10. Questions ouvertes à trancher
1. Quelles **langues** parle la famille (français seulement ou aussi anglais, etc.) ?
2. Existe-t-il une **personne compétente techniquement** pour administrer la plateforme, ou faut-il une solution sans maintenance ?
3. **Budget** annuel acceptable, et qui le porte (association, cotisation) ?
4. Quel **volume d'archives** existe-t-il déjà (photos anciennes, vidéos, documents à numériser) ?
5. Faut-il une **application mobile native** dans les stores, ou une PWA suffit-elle ?
6. Y a-t-il des **documents très sensibles** (patrimoine, successions) qui demanderaient un niveau de sécurité supérieur (chiffrement, journal des accès obligatoire) ?
7. Existe-t-il déjà un **arbre généalogique** (fichier GEDCOM, Geneanet, MyHeritage, papier) ? Qui en est le gardien aujourd'hui ?
8. Les **conjoints** et les membres par alliance sont-ils des membres à part entière ou des invités ?
