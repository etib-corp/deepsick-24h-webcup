# F31 — Vague de chaleur : alerter avec des recommandations adaptées

> **Besoin officiel (F31, Difficile, 840 XP)** — Une vague de chaleur extrême touche actuellement plusieurs secteurs de la ville. Certaines personnes sont particulièrement vulnérables et doivent être informées rapidement avec des recommandations adaptées.

**Branche :** `F73-high-council-official-announcement` (canal d'alerte) — scénario chaleur semé depuis `main`
**Commit :** `c49554d` — « feat: add High Council official announcements » ; semis : `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `prisma/seed.ts` (diffusion « Vague de chaleur — consignes aux habitants »), `components/layout/BroadcastBanner.tsx`, `components/layout/BroadcastMessages.tsx`, `lib/data.ts` (`getActiveBroadcasts`), `app/council/broadcasts/page.tsx`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'alerte chaleur utilise le **même canal officiel** que F29, avec un message porteur de **recommandations adaptées** :

- **Alerte immédiate et visible** — bandeau en haut de **toutes les pages** (même pour un visiteur anonyme), rafraîchi en continu (polling 5 s, pause onglet masqué), avec fenêtre horaire contrôlée par le Haut Conseil.
- **Recommandations pour les personnes vulnérables** — le message semé contient les consignes : « Hydratez-vous régulièrement, évitez les sorties entre 11 h et 16 h et prenez des nouvelles des habitants vulnérables de votre module. »
- **Action claire** — bouton **« Consulter les consignes »** vers `/announcements` ; le régime de crise (tempête + crue + chaleur) est directement démontrable sur une base fraîche grâce au jeu de données.
- **Gouvernance** — seul le rôle `COUNCIL` publie/active les alertes ; chaque action est tracée (`CONTENT_CHANGED` dans `/council/security`).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Bandeau d'alerte** : `/` (accueil, sans connexion) — et sur toutes les pages de l'application.
- **Gestion** : `/council/broadcasts` (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Voir l'alerte** — ouvrir `/` : le bandeau **« Vague de chaleur — consignes aux habitants »** affiche les recommandations (hydratation, horaires à éviter, entraide envers les personnes vulnérables).
2. **La retrouver partout** — naviguer vers `/services`, `/citizen` ou une console : l'alerte est présente sur chaque page.
3. **Contrôler la fenêtre** — en Conseil (`/council/broadcasts`), désactiver l'alerte puis rafraîchir : elle disparaît ; la réactiver : elle revient. Créer une alerte datée (`début`/`fin`) pour vérifier qu'elle n'apparaît que dans sa fenêtre.
4. **Vérifier la trace** — `/council/security` montre les changements de contenu liés aux diffusions.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont la diffusion par fenêtre horaire).
