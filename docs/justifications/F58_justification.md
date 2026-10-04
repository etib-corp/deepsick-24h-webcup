# F58 — Sobriété numérique : des choix appliqués, pas seulement un diagnostic

> **Besoin officiel (F58, Difficile, 1050 XP)** — La colonie souhaite réduire durablement l'impact environnemental de ses outils numériques. Au-delà d'un simple diagnostic, la plateforme doit appliquer des choix de conception et de chargement plus sobres sur ses principaux parcours.

**Emplacements dans le code :** `lib/motion.ts` (arrêt complet des animations en mode allégé), `app/(public)/eco/page.tsx` (section « Choix de conception appliqués »), `components/layout/PublicFooter.tsx` (préchargement désactivé), `app/globals.css` (`.cv-auto`), `components/layout/BroadcastMessages.tsx` (sondage adaptatif), `app/(public)/page.tsx` (sections hors écran)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Au-delà du diagnostic (F57), des **choix de conception et de chargement concrets sont appliqués et documentés sur `/eco`** :

1. **Animations arrêtées, pas seulement atténuées** — en mode allégé (choisi ou auto-détecté via l'économiseur de données, F59/F96), `lib/motion.ts` coupe **entièrement** les scripts d'animation : les helpers deviennent des no-ops, anime.js n'exécute plus rien. La carte de l'accueil est déjà chargée à la demande.
2. **Poids par parcours** — un seul bitmap sur tout le site, le reste en CSS/SVG ; les scripts d'animation ne sont chargés que sur les pages qui en ont (accueil, consoles) — constat vérifiable dans le build (First Load JS).
3. **Requêtes d'anticipation maîtrisées** — liens de pied de page en `prefetch={false}` (toujours montés sur le site public) et sondage du bandeau **adaptatif** (5 s quand l'info bouge, 30 s au repos, pause complète onglet masqué).
4. **Rendu à la demande** — les sections hors écran de l'accueil utilisent `content-visibility: auto` : le navigateur ignore ce qui n'est pas visible.
5. **Transparence** — la page `/eco` liste ces choix appliqués sous « Choix de conception appliqués (F58) », en regard des estimations par visite.

### URL ou emplacement pour tester la fonctionnalité

**`/eco`** (aucune connexion requise). Le mode allégé se bascule depuis le pied de page (« Mode complet / Mode allégé »).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/eco` : la section « Choix de conception appliqués (F58) » liste les mesures réellement en place ; les estimations par visite sont en regard.
2. Activer le **mode allégé** dans le pied de page puis revenir à l'accueil : animations et carte disparaissent, la page reste complète.
3. Inspecter le réseau du navigateur sur `/eco` : aucune requête d'animation ni préchargement de pied de page ; les sondages d'alerte s'espacent après quelques minutes sans changement.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/*.test.ts` (88 OK).
