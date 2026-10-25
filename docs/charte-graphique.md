# Site familial – Charte graphique

> Version 0.2 – Octobre 2026 – Direction « **La Gazette de la famille** »
> Maquettes : [canevas « Site familial – Charte et maquettes »](https://claude.ai/artifact/FwURo1LVsM51WFocSYHPBS)
>
> La v0.1 (cartes arrondies, pastilles colorées, compteurs de « j'aime », bouton flottant, barre d'onglets) a été jugée **trop « réseau social »**. La v0.2 s'inspire du journal de famille et de l'archive (style « Editorial Grid / Magazine » du skill ui-ux-pro-max).

---

## 1. Intention : un journal de famille, pas un réseau social

| Principe | Traduction |
|----------|------------|
| **On lit, on ne fait pas défiler** | Une page d'accueil « La une », des rubriques, une **édition mensuelle** (N° 42 · Octobre 2026) avec ses archives. Pas de flux infini ni de fil algorithmique. |
| **Des mots, pas des compteurs** | Pas de « j'aime », de pastilles rouges ni d'avatars empilés. On « laisse un mot », et le nombre de messages s'écrit discrètement en toutes lettres (« 23 mots de la famille »). |
| **L'archive avant l'instant** | Rubrique « Il y a 50 ans », liens vers l'arbre et les archives, Carnet du mois. |
| **Lisible par tous** | Corps de 18 px avec empattements, contraste AA, cibles de 48 px. La visibilité est écrite en clair (« Visible par toute la famille »). |

## 2. Ce qu'on bannit / ce qu'on adopte

| ❌ Codes « réseau social » | ✅ Codes « gazette » |
|----------------------------|----------------------|
| Cartes arrondies avec ombre | Filets fins (1 px), doubles filets sous le titre du journal, angles de 4 px, aucune ombre |
| Pastilles colorées par type | **Rubriques** en petites capitales (« Carnet · Naissance ») dans la couleur d'accent |
| Compteurs de réactions, badges de notifications | Texte discret, récapitulatif par e-mail (« la gazette du mois ») |
| Barre d'onglets à icônes + bouton « + » flottant | Bandeau de rubriques textuel ; lien « Écrire dans la gazette » |
| Avatars ronds partout | Signature (« Par Thomas B. »), photos légendées |
| Palette multicolore | Papier, encre et **une seule couleur d'accent** |

## 3. Couleurs

| Jeton | Valeur | Usage |
|-------|--------|-------|
| `--paper` | `#F7F3EC` | Fond |
| `--paper-raised` | `#FFFDF9` | Encadré d'article |
| `--vellum` | `#EDE6DB` | Encadrés, archives, agenda |
| `--ink` | `#1F1B18` | Texte, filets forts, titre du journal |
| `--ink-soft` | `#3D3631` | Chapôs, texte d'article |
| `--graphite` | `#5E554D` | Dates, légendes, signatures (≥ 4,5:1 sur papier) |
| `--rule` | `#D8CEC0` | Filets fins |
| `--accent` (terre cuite) | `#9A3F22` | Rubriques, liens, bouton principal (le **seul** accent) |
| `--mourning` | `#4A4F55` | Rubrique Décès ; la page d'avis de décès passe entièrement en gris (`#F5F4F2` / `#2B2D30`) |

Mode sombre : fond `#191613`, texte `#EFE8DE`, accent `#E08A66`, filets `#3A332D`.

## 4. Typographie

| Rôle | Police | Tailles |
|------|--------|---------|
| Titre du journal, titres, noms | **Newsreader** | Titre du journal 64 à 72 px · une 46 px · titre d'article 28 px · noms du Carnet 19 à 21 px |
| Texte des articles | **Source Serif 4** | 18 px (17 px sur mobile), interligne 1,55 à 1,6 ; chapô de 20 px |
| Interface (rubriques, boutons, formulaires, métadonnées) | **Source Sans 3** | Rubriques de 13 à 15 px en capitales, interlettrage de 1,5 à 2,5 px ; métadonnées de 14 à 15 px |

Ornements autorisés : lettrine d'article, citation en italique avec filet d'accent, double filet sous le titre du journal.

## 5. Gabarits

- **La une (ordinateur)** : titre du journal centré · bandeau de rubriques · article principal (2/3, photo légendée) · colonne « Carnet du mois » et « Agenda » (1/3) séparée par un filet · rangée de trois colonnes (Chronique, « Il y a 50 ans » sur fond vélin, Courrier de la famille) · pied de page avec l'édition précédente.
- **La une (mobile)** : titre du journal sur deux lignes, rubriques défilant à l'horizontale, article principal, Carnet, encadré Agenda. Pas de barre d'onglets.
- **Avis de décès** : faire-part sobre en gris, portrait ovale, obsèques, lien vers la fiche de l'arbre, **livre de condoléances** (aucune réaction).
- **Agenda / invitation** : carton à double filet (« Vous êtes invités »), heure dans plusieurs fuseaux, réponse Je viens / Peut-être / Absent.
- **Archives et arbre** : mêmes en-têtes (titre du journal + rubriques soulignées), contenus en tableaux et filets. Les outils (panneau des droits, arbre) gardent une interface fonctionnelle, mais sans ombres ni arrondis.

## 6. Composants

| Composant | Règle |
|-----------|-------|
| Bouton principal | 48 px, fond terre cuite, texte blanc, rayon de 4 px (« Écrire dans la gazette ») |
| Bouton secondaire | Contour encre de 1 px, fond transparent (« Laisser un mot ») |
| Lien | Terre cuite, souligné au survol (« Lire la suite → ») |
| Rubrique | Petites capitales, poids 700, interlettrage de 2 px, accent (graphite pour Décès) |
| Visibilité | Icône au trait + phrase : « Visible par toute la famille », « Réservé au conseil de famille » |
| Champ | Libellé visible au-dessus, 48 px, bordure encre ou filet, rayon de 4 px |
| Icônes | Lucide, trait de 1,75 px, utilisées avec parcimonie ; pas d'émojis |

## 7. Accessibilité (contrôles avant livraison)

- [ ] Contraste du texte ≥ 4,5:1 (graphite `#5E554D` sur papier : ≈ 6,6:1)
- [ ] Cibles ≥ 44 px (48 px recommandés), y compris les liens de rubrique sur mobile
- [ ] Focus clavier visible, aucune information transmise par la seule couleur
- [ ] `prefers-reduced-motion` respecté (quasiment aucune animation dans cette direction)
- [ ] Tests en 375, 768, 1024 et 1440 px, sans défilement horizontal de la page
