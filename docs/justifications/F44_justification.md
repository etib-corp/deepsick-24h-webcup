# F44 — Grossir le contenu sans casser l'affichage

> **Besoin officiel (F44, Moyenne, 620 XP)** — J'aimerais pouvoir grossir le contenu sans casser l'affichage. L'objectif est que ce besoin améliore réellement l'usage de la plateforme, sans isoler ces utilisateurs dans un parcours incomplet.

**Branche :** `F23-F24-accessibility-readability` (PR #19)
**Commit :** `604735d` — « fix: improve accessibility »

**Emplacements dans le code :** `app/globals.css` (tailles en `rem`, suppression des tailles en pixels héritées), `components/shadcn/button.tsx`, `components/shadcn/badge.tsx`, `components/colony/FeedRow.tsx`, `components/colony/ConsoleShell.tsx`, `components/colony/StatusStrip.tsx`, `components/layout/PublicHeader.tsx`, `components/colony/ColonyMap.tsx`, `docs/F23_F24_accessibility.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'affichage a été corrigé pour rester lisible **quand on agrandit le texte ou le zoom**, sur les parcours principaux :

- **Tailles relatives** — les tailles de texte héritées en pixels (9–11 px) ont été remplacées par des tailles en **`rem`** ; les champs de formulaire suivent la taille de texte de l'utilisateur ; boutons et badges ont des hauteurs intrinsèques et des libellés qui passent à la ligne au lieu d'être tronqués.
- **Pas de débordement** — testé sur 19 pages à **320 px de large** avec **200 % de taille de texte**, puis au **zoom navigateur 200 % et 400 %** : aucun débordement horizontal ni texte coupé après correction (dashboards citoyen et consoles inclus, qui débordaient initialement).
- **Listes et cartes robustes** — les lignes de flux (titres, métadonnées, badges) passent à la ligne ; les grilles des consoles s'effondrent proprement sur écran étroit ; les en-têtes ne consomment plus écran étroit ; la carte laisse son texte descriptif dans le flux du document.
- **Pas de fonctionnalité réservée** — le zoom est le comportement natif du navigateur ; aucune « version agrandie » séparée : tous les parcours restent complets et identiques.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Pages de contrôle** : `/`, `/services`, `/contact`, `/login`, `/citizen`, `/citizen/requests`, `/operations/administration`.
- **Méthode** : zoom navigateur (Cmd/Ctrl + +) jusqu'à 200 % puis 400 % ; ou réglage de la taille de police par défaut du navigateur à 32 px.
- **Détail des vérifications** : `docs/F23_F24_accessibility.md` (largeurs 1280/640/320 px, tailles 16/32 px).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Zoom 200 %** — sur `/citizen` puis `/operations/administration`, appliquer un zoom navigateur à 200 % : les tuiles, listes et boutons s'empilent proprement, sans barre de défilement horizontale.
2. **Zoom 400 %** — répéter sur `/`, `/services`, `/contact` : le contenu reste lisible et actionnable, sans chevauchement.
3. **Grande police** — régler la police par défaut du navigateur à 32 px : les formulaires (inscription, contact, signalement) restent intacts, les libellés ne sont plus tronqués.
4. **Mobile étroit** — à 320 px de large, vérifier qu'aucune page ne déborde et que les listes passent à la ligne.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; tests de reflow documentés (19 pages × 1280/640/320 px × 16/32 px, zoom Chrome 200 %/400 % — `docs/F23_F24_accessibility.md`).
