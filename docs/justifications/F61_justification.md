# F61 — Performance sur appareils peu puissants

> **Besoin officiel (F61, Difficile, 1080 XP)** — La plateforme doit rester rapide même sur des appareils peu puissants. La plateforme doit rester agréable à utiliser dans des conditions moins favorables, sans sacrifier les informations et actions essentielles.

**Branche :** `perf/low-powered-devices`

**Emplacements dans le code :** `components/tour/TourProvider.tsx`, `components/motion/Reveal.tsx`, `components/colony/StatTile.tsx`, `components/colony/FeedRow.tsx`, `components/ui/PageHeader.tsx`, `components/colony/IncidentConsole.tsx`, `next.config.mjs`, `docs/PERFORMANCE.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Nous avons d'abord **mesuré** avant d'optimiser (poids du JS par route avec `ANALYZE=true next build`, tailles « First Load JS » au build, et Lighthouse avec **CPU bridé** `--throttling.cpuSlowdownMultiplier=4`). L'audit a montré qu'**anime.js était embarqué sur toutes les pages** : `TourProvider` (monté dans le layout racine) importait le module de motion basé sur anime.js.

Corrections apportées :

- **anime.js sorti du bundle partagé** : `TourProvider` n'importe plus `lib/motion` ; son effet d'anneau utilise l'API native **Web Animations** et un test local `prefers-reduced-motion`.
- **Animations d'entrée en CSS pur** (`motion-safe:` + `tw-animate-css`) sur `Reveal`, `StatTile`, `FeedRow` et `PageHeader` : plus de JS client, et le contenu reste visible si l'animation ne s'exécute pas. Le « count-up » JS de `StatTile` est supprimé (valeurs affichées immédiatement).
- **Travail de fond non bloquant** : le polling de `IncidentConsole` (console agents) **se met en pause quand l'onglet est masqué** (`document.visibilityState`), pour ne jamais recalculer l'arbre serveur en arrière-plan.
- **Listes qui montent en volume** : `content-visibility: auto` + `contain-intrinsic-size` sur les lignes de flux, afin de **ne pas rendre les lignes hors écran** (rendu paresseux natif).

**Résultat mesuré** (First Load JS, avant → après) : jusqu'à **−32 kB** sur `/announcements`, **−27 kB** sur `/citizen/consultations`, `/citizen/contributions`, `/citizen/notifications`, **−28 kB** sur `/citizen/wallet`, et **−16/−17 kB** sur la plupart des pages citoyen, Conseil et opérations (détail dans `docs/PERFORMANCE.md`).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Site public : `https://deepsick.lareunion.webcup.hodi.cloud/`

Espaces internes (connexion requise) :

- Espace citoyen (tableau de bord + récapitulatif) : `/citizen`
- Console agents (polling en direct) : `/operations/security`
- Console Conseil (listes) : `/council`

Détail des mesures et commandes de reproduction : `docs/PERFORMANCE.md`.

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir la plateforme puis les DevTools du navigateur (onglet **Performance** ou **Lighthouse**) et **brider le CPU** (×4 ou ×6) — ou utiliser un appareil peu puissant.
2. Se connecter avec `citoyen@terranova.fr` / `password123` et parcourir `/citizen` : la navigation, l'ouverture d'une fiche et les listes restent **fluides et lisibles** ; aucune action essentielle n'exige un appareil puissant.
3. Vérifier la **baisse du JS chargé** : comparer « First Load JS » (ou l'onglet Réseau / le treemap `ANALYZE=true next build`) avant/après — voir le tableau de `docs/PERFORMANCE.md`.
4. Ouvrir `/operations/security` (`securite@terranova.fr` / `password123`), puis **passer l'onglet en arrière-plan** : le rafraîchissement automatique se met en pause (aucune requête répétée), et l'interface ne bloque jamais la saisie au retour.
5. Faire défiler une longue liste (flux d'incidents, annonces, comptes) : le défilement reste **régulier**, car les lignes hors écran ne sont pas rendues (`content-visibility`).
6. (Optionnel) Relancer `rm -rf .next && npx next build` et comparer les tailles de route affichées, ou `npx lighthouse <URL> --preset=perf --throttling.cpuSlowdownMultiplier=4` sur un build de production.
