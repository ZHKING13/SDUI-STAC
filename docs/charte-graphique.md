# Site familial – Charte graphique

> Version 0.1 – Octobre 2026 – Maquettes : [canevas « Site familial – Charte et maquettes »](https://claude.ai/artifact/FwURo1LVsM51WFocSYHPBS)
>
> Point de départ : recherches avec le skill **ui-ux-pro-max** (installé dans `.claude/skills/ui-ux-pro-max`), puis arbitrages propres au contexte familial (voir §7).

---

## 1. Intention

| Principe | Traduction |
|----------|------------|
| **Chaleur** | Tons de terre, d'olive et de papier ancien : l'album de famille plutôt que le réseau social |
| **Sobriété** | Les moments graves (décès) ont leur propre traitement : gris ardoise, pas de réactions festives, pas de couleur vive |
| **Lisibilité** | Texte courant à 17 px minimum, contraste WCAG AA, zones tactiles de 48 px, mode « grand texte » |
| **Confiance** | La visibilité d'un contenu est **toujours affichée**, avec une icône et un mot (jamais la couleur seule) |

Style retenu : « Nature Distilled » (teintes terre et matière) sur une base minimaliste et très lisible. On écarte le néomorphisme, les dégradés et le glassmorphisme, peu lisibles pour les seniors.

## 2. Couleurs

### 2.1 Base (mode clair)
| Jeton | Valeur | Usage |
|-------|--------|-------|
| `--color-primary` (Terre cuite) | `#9A3F22` | Boutons principaux, liens, élément actif ; texte blanc dessus (contraste ≈ 7:1) |
| `--color-primary-tint` | `#F6E3D9` | Fond d'élément actif, avatar |
| `--color-secondary` (Olive) | `#556B2F` | Généalogie, succès, accents secondaires |
| `--color-gold` (Or patiné) | `#B7832F` | Décor, célébrations, logo. **Jamais pour du texte** (contraste insuffisant) |
| `--color-foreground` (Encre) | `#2B2420` | Texte principal |
| `--color-muted-foreground` | `#6A5D53` | Texte secondaire, métadonnées (≥ 4,5:1 sur ivoire) |
| `--color-background` (Ivoire) | `#FBF7F1` | Fond de page |
| `--color-card` | `#FFFFFF` | Cartes, panneaux |
| `--color-muted` (Sable) | `#F3ECE2` | Zones secondaires, boutons tertiaires |
| `--color-border` | `#E6DCCF` | Bordures ; champs : `#D9CCBC` |
| `--color-destructive` | `#9A3434` | Suppression, erreurs |

### 2.2 Mode sombre
Fond `#1C1916` · carte `#26221E` · bordure `#3A332D` · texte `#F3EDE6` · texte secondaire `#C9BFB4` · terre `#E0825E` · olive `#9DB37A` · or `#D9AE62`.

### 2.3 Types de publication (texte foncé sur fond teinté)
| Type | Texte | Fond | Icône |
|------|-------|------|-------|
| Naissance | `#2F6B5E` | `#E3F0EC` | étincelle |
| Mariage | `#7A4F0E` | `#F7EBD3` | deux anneaux |
| Décès | `#46505C` | `#ECEEF1` | bougie |
| Rencontre | `#4E3F80` | `#ECE8F6` | calendrier |
| Annonce | `#8A3519` | `#F6E3D9` | haut-parleur |
| Réussite | `#2D5A8A` | `#E3ECF6` | médaille |
| Souvenir | `#6E5640` | `#EFE6DB` | livre |

**Annonce de décès** : la page entière passe en palette neutre (fond `#F5F4F2`, texte `#2B2D30`, action `#46505C`). Les réactions sont remplacées par le **livre de condoléances**.

### 2.4 Visibilité
| Niveau | Texte | Fond | Bordure | Icône |
|--------|-------|------|---------|-------|
| Famille | `#35602E` | `#EEF4EA` | `#C9D8C2` | personnes |
| Groupe / branche | `#2D5A8A` | `#EAF0F8` | `#C3D3E6` | arbre |
| Restreint | `#8F500C` | `#FBF1E2` | `#E8CFA8` | personne cochée |
| Privé | `#9A3434` | `#F9ECEC` | `#E5C3C3` | cadenas |

## 3. Typographie

| Rôle | Police | Tailles | Remarques |
|------|--------|---------|-----------|
| Titres, noms, citations | **Newsreader** (Google Fonts, serif à tailles optiques) | 40 / 32 / 26 / 22 px, poids 500 | Évoque le faire-part et l'archive ; l'italique sert aux dates de vie et aux citations |
| Texte, interface | **Source Sans 3** (Google Fonts, sans-serif humaniste) | 20 / 17 / 15 px, interligne 1,55 | Très lisible, chiffres bien distincts, bonne prise en charge des accents |

Règles : jamais moins de 15 px (métadonnées) ni de 13 px (étiquettes de la barre de navigation). Mode « grand texte » : toutes les tailles × 1,2.

## 4. Formes, espacements, icônes

- **Rayons** : 12 px (boutons, champs), 14 à 16 px (cartes), 999 px (pastilles de type).
- **Espacements** : base 4 px, échelle 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Marge latérale mobile de 16 px.
- **Ombres** : rares et douces (`0 8px 24px rgba(43,36,32,.06)`), réservées aux panneaux flottants et au bouton « + ».
- **Icônes** : Lucide (trait de 1,75 px, 20 à 24 px). **Pas d'émojis comme icônes.** Un bouton composé d'une seule icône porte toujours un `aria-label`.
- **Avatars** : photo, ou initiales sur une teinte douce. Les conjoints par alliance sont signalés dans l'arbre par une bordure en pointillés.
- **Logo** : un arbre stylisé dans un cercle terre cuite clair, avec trois « fruits » (olive, or) pour les générations, et le nom « Famille [Nom] » en Newsreader.

## 5. Composants clés

| Composant | Règle |
|-----------|-------|
| Bouton principal | 48 px de haut, fond terre cuite, texte blanc en 16 à 17 px, poids 600 |
| Bouton secondaire | Contour terre cuite de 1,5 px sur fond blanc |
| Bouton tertiaire | Fond sable, texte encre |
| Champ | Libellé **visible au-dessus** (jamais un simple placeholder), 48 px, bordure `#D9CCBC`, aide en 15 px dessous |
| Carte de publication | Pastille de type, auteur et branche, média, titre en Newsreader, actions (réaction contextuelle + commentaires), **pastille de visibilité** en bas à droite |
| Navigation mobile | 5 entrées au maximum : Accueil, Agenda, Bibliothèque, Arbre, Profil ; bouton flottant « + » pour publier |
| Panneau « Qui peut voir ? » | Case d'héritage du dossier parent, une ligne par branche, groupe ou personne avec une liste déroulante Voir → Gérer, une date d'expiration pour les invités, et le **nombre total de personnes** ayant accès |

## 6. Accessibilité (contrôles avant livraison)

- [ ] Contraste du texte ≥ 4,5:1 (3:1 au-delà de 24 px) dans les deux modes
- [ ] Zones tactiles ≥ 44 px (48 px recommandés)
- [ ] Focus clavier visible ; aucune information transmise par la seule couleur
- [ ] `prefers-reduced-motion` respecté (animations de 150 à 300 ms, discrètes)
- [ ] Mise en page testée en 375, 768, 1024 et 1440 px, sans défilement horizontal de la page
- [ ] Heures affichées dans le fuseau de l'utilisateur, avec mention des autres fuseaux pour les événements

## 7. Arbitrages par rapport aux recommandations du skill

| Recommandation automatique | Décision | Raison |
|----------------------------|----------|--------|
| Palette « rose vif + bleu d'engagement » (catégorie réseau social) | Écartée | Trop « application sociale » et inadaptée aux annonces de deuil ; on vise l'album de famille |
| Titres en Inter et texte en Playfair Display | Inversée et remplacée | Une police à empattements contrastée gêne la lecture longue ; on prend une serif pour les titres (Newsreader, de la famille « News Editorial ») et une sans-serif humaniste pour le texte |
| Style « Nature Distilled » (tons terre, matière) | Retenu, sans texture | Correspond à la chaleur recherchée ; le grain de papier est omis pour la lisibilité et le poids des pages |
| Règles UX : texte ≥ 16 px, interligne de 1,5 à 1,75, cibles 44/48, pas d'émojis | Retenues et renforcées (17 px) | Public intergénérationnel |
