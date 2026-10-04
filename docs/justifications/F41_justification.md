# F41 — Navigation clavier sur toute la plateforme

> **Besoin officiel (F41, Moyenne, 620 XP)** — Bonjour, j'utilise uniquement le clavier pour naviguer. Certaines actions sont difficiles à atteindre. L'objectif est que ce besoin améliore réellement l'usage de la plateforme, sans isoler ces utilisateurs dans un parcours incomplet.

**Branche :** `F21-screen-reader-accessibility` (PR #21)
**Commit :** `c8dadf2` — « feat: improve screen reader accessibility » (passe clavier incluse)

**Emplacements dans le code :** `components/layout/SkipLink.tsx`, `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `components/layout/PublicHeader.tsx`, `components/colony/ConsoleShell.tsx`, `components/colony/IncidentConsole.tsx`, `components/theme/ThemePicker.tsx`, `components/i18n/LocaleSwitcher.tsx`, `app/globals.css` (anneau de focus commun), `docs/F21_accessibility.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

La plateforme a été auditée et corrigée pour être **utilisable au clavier seul**, profil par profil (visiteur, habitant, services, Conseil) :

- **Atteindre le contenu** — un **lien d'évitement** (« Aller au contenu principal ») est le premier élément focusable de chaque gabarit (public, connexion, consoles) et déplace réellement le focus sur `main`.
- **Tout atteindre** — chaque **anneau de focus est visible et commun** à tous les contrôles ; les boutons, champs, menus déroulants et actions sont des éléments natifs ou Radix, donc tabulables et actionnables au clavier.
- **Menus et popups** — les menus Radix (thème, langue, comptes) gardent la **navigation aux flèches, l'état sélectionné exposé** (`aria-checked`/`role=radio`) et la fermeture par **Échap** avec **retour du focus** sur le déclencheur ; la navigation mobile expose son état déplié/replié et fonctionne à l'Échap.
- **Repérer où l'on est** — l'élément de navigation courant est exposé (`aria-current`), les filtres de console émettent `aria-pressed` et un **soulignement** s'ajoute à la couleur pour l'état actif.
- **Aucun parcours séparé** — ces corrections s'appliquent aux parcours normaux (pas de « version clavier » isolée) ; l'audit a couvert 23 routes et 17 assertions ciblées.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Pages publiques** : `/`, `/services`, `/contact`, `/login` — au clavier uniquement (Tab, Entrée, Échap, flèches).
- **Consoles** : `/operations/security` (filtres), `/council` (navigation).
- **Détail de l'audit** : `docs/F21_accessibility.md`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Lien d'évitement** — sur `/`, appuyer sur **Tab** dès le chargement : « Aller au contenu principal » reçoit le focus ; **Entrée** amène au contenu (le focus suit).
2. **Parcours complet sans souris** — depuis `/`, tabuler jusqu'à « Découvrir les services », ouvrir une fiche, revenir à la liste, ouvrir le menu mobile (Entrée, Échap) : tout est atteignable sans souris, avec un focus toujours visible.
3. **Menus** — ouvrir le sélecteur de thème ou de langue au clavier : navigation aux **flèches**, sélection à l'Entrée, fermeture à l'Échap avec retour du focus sur le bouton d'origine.
4. **Console** — sur `/operations/security`, activer/désactiver les filtres au clavier : `aria-pressed` et soulignement indiquent l'état actif.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; l'audit F21 a validé 17 assertions clavier/souris (documentées dans `docs/F21_accessibility.md`).
