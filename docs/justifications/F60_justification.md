# F60 — Des images et médias qui n'alourdissent pas les pages

> **Besoin officiel (F60, Facile, 350 XP)** — Les images et médias de la plateforme ne doivent pas alourdir inutilement les pages. La plateforme doit rester agréable à utiliser dans des conditions moins favorables, sans sacrifier les informations et actions essentielles.

**Branche :** `perf/low-powered-devices` (PR #107)
**Commit :** `e828ef0` — « perf: cut client JS and pause background work on low-powered devices » ; `6d514a7` — « chore: add bundle analyzer and document performance results »

**Emplacements dans le code :** `public/terra-nova-map.webp` (unique média bitmap), `components/colony/ColonyMap.tsx`, `components/colony/ColonyScene.tsx` (décor CSS/SVG), `docs/PERFORMANCE.md` (mesures), `next.config.mjs` (analyse des bundles)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

La plateforme ne charge **aucun média superflu** et documente ses résultats :

- **Un seul média bitmap** — toute l'application n'utilise qu'**une image** : la carte de la colonie `terra-nova-map.webp` (≈ **126 Ko**, format WebP optimisé) ; le reste du décor (scène d'accueil, radar, icônes) est en **CSS/SVG** vectoriel, sans photo ni vidéo.
- **Aucune image lourde importée** — les icônes sont des emoji/SVG inline ou des pictogrammes `lucide` ; les listes et fiches ne chargent pas d'images distantes. La carte est chargée uniquement sur les pages qui l'affichent (`/services`, `/citizen/map`).
- **Réduction du poids de la page** — le travail performance a aussi supprimé de la charge utile JS et API : animations CSS à la place d'anime.js sur la plupart des pages, compteurs rendus immédiatement, `content-visibility` sur les listes, réponses JSON réduites de ~98 % sur les consoles (mesuré dans `docs/PERFORMANCE.md` et `docs/F78.md`).
- **Toujours utilisable en conditions dégradées** — les informations restent lisibles si les animations ne s'exécutent pas (elles sont purement décoratives et désactivées en `prefers-reduced-motion`) ; la carte possède une alternative « liste » lisible.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Pages concernées** : `/` (scène CSS), `/services` (carte WebP), `/citizen/map`.
- **Mesures** : `docs/PERFORMANCE.md` (tableau First Load JS avant/après) ; commande `ANALYZE=true npx next build`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Inventorier les médias** — dans le projet : `find public -type f -size +100k` ne retourne **que** la carte (`terra-nova-map.webp`, 126 Ko) ; aucun autre fichier image/vidéo n'existe.
2. **Mesurer une page** — ouvrir l'onglet Réseau du navigateur sur `/services` : la seule ressource image est la carte WebP ; sur `/`, aucune image bitmap (scène en CSS).
3. **Vérifier les bundles** — lancer `rm -rf .next && npx next build` : consulter le tableau « First Load JS » (≈ 87 Ko partagé) ; `ANALYZE=true npx next build` ouvre la carte des bundles pour vérification.
4. **Conditions dégradées** — activer une limitation réseau (Slow 3G) : les pages restent consultables (contenu rendu côté serveur), les animations n'étant pas nécessaires à l'information.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; chiffres avant/après dans `docs/PERFORMANCE.md`.
