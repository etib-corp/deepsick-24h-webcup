# F77 — Rester utilisable quand le serveur est fortement sollicité

> **Besoin officiel (F77, Difficile, 1200 XP)** — Une surcharge importante est détectée sur les serveurs. La plateforme doit rester agréable à utiliser dans des conditions moins favorables, sans sacrifier les informations et actions essentielles.

**Branche :** `F78-improve-platform-stability` (PR #110)
**Commit :** `a242b1c` — « perf: improve platform stability under load »

**Emplacements dans le code :** `lib/data.ts` (cache de contenu + coalescence), `lib/coalesce.ts`, `components/colony/IncidentConsole.tsx` (polling adaptatif), `lib/services.ts` (verrous SQL des réservations, rappels idempotents), `prisma/schema.prisma` (références `cuid()`), `docs/F78.md` + `docs/F78-results.json` (mesures), `tests/f78.test.ts`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

La plateforme a été durcie **sous charge** et les résultats sont **mesurés** :

- **Moins de travail à chaque requête** — les consoles filtrent leur propre service **en SQL** et ne sélectionnent que les colonnes utiles ; une fiche citoyenne ne lit que la catégorie demandée **avec la propriété dans la requête** ; les pages publiques (services, annonces) sont servies depuis un **cache persistant** avec invalidation à l'écriture, et les lectures simultanées à froid sont **coalescées** (une seule requête SQL pour 100 lectures identiques).
- **Interactions protégées** — le **polling s'arrête** quand l'onglet est masqué ou hors ligne (et reprend au retour) ; les rafraîchissements ne se chevauchent pas ; les réservations de créneaux sont **sérialisées en base** (verrou SQL) — 15 tentatives concurrentes donnent **une** réservation et **une** confirmation ; les rappels sont **idempotents** (livrés une seule fois).
- **Charge utile réduite** — JSON des consoles retenu ~**98 % plus petit** ; First Load JS réduit (−16 à −32 Ko sur de nombreuses routes, voir `docs/PERFORMANCE.md`).
- **Résultats mesurés** — à **500 appels simultanés** : tableau d'incidents p95 **2 897 → 165 ms**, fiche citoyenne p95 **3 061 → 54 ms**, **zéro erreur** ; test HTTP chargé (jusqu'à 500 clients virtuels) **zéro erreur**, p95 4–6 ms sur le chemin mis en cache. Détail complet : `docs/F78.md` (`F78-results.json`).
- **Gestes de dégradation utiles** — un échec de connexion affiche un message clair et **réactive le bouton** pour réessayer (pas d'interface bloquée) ; les pages critiques restent rendues côté serveur, donc consultables même sous contrainte.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Consoles (chargées)** : `/operations/security`, `/operations/administration`.
- **Pages publiques mises en cache** : `/services`, `/announcements`.
- **Mesures et reproduction** : `docs/F78.md`, commandes `npm run benchmark:f78` et `npm run test:f78`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Mesures fournies** — ouvrir `docs/F78.md` : tableaux avant/après (temps de réponse p95, taille des réponses, zéro erreur) et `docs/F78-results.json` (sortie brute).
2. **Rejouer les tests de charge/concurrence** — exécuter `npm run benchmark:f78` et les tests `tests/f78.test.ts` (réservations concurrentes, rappels idempotents, cache, fenêtres de diffusion) : tout passe.
3. **Vérifier le comportement réel** — ouvrir une console, masquer l'onglet puis revenir : aucun appel de fond pendant l'absence, rafraîchissement immédiat au retour ; simuler une connexion lente (devtools) : l'interface reste utilisable, sans rafales d'appels superposés.
4. **Vérifier la robustesse des écritures** — réserver deux fois le même créneau depuis deux sessions : un seul rendez-vous est créé, l'autre reçoit un message explicite.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK).
