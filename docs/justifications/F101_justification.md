# F101 — Panne électrique secteur nord : informer sans délai

> **Besoin officiel (F101, Difficile, 1380 XP)** — Une panne électrique touche le secteur nord. Les habitants doivent être informés sans délai. L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Emplacements dans le code :** `app/(public)/alertes/page.tsx` (page des consignes), `components/layout/BroadcastMessages.tsx` (bandeau), `lib/actions/feed.ts` (bandeau + alertes en un aller-retour), `app/council/alerts/page.tsx` + `components/colony/AlertForm.tsx` (cellule de crise), `lib/actions/alerts.ts`, `lib/alerts.ts` (`isAlertLive`, tri par gravité, étapes), modèle `ColonyAlert`, `tests/alerts.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **canal d'alerte de colonie** dédié aux incidents (distinct des messages généraux F73) :

- **Informer sans délai** — publier une alerte depuis la cellule de crise (`/council/alerts`) la fait apparaître **en tête de toutes les pages dans la seconde** (bandeau rouge au-dessus des messages du Conseil, rafraîchissement 5 s tant que l'information bouge, immédiat au retour sur l'onglet) **et envoie une notification** aux habitants du secteur concerné (tous les habitants si l'alerte est générale).
- **Visible au bon moment** — une alerte est portée par son état (ACTIVE / levée) et son horaire de début : elle peut être programmée, résolue d'un clic (« Lever l'alerte ») — le bandeau disparaît alors et une notification « Alerte levée » part aux mêmes habitants. Les alertes levées restent listées quelques jours sur `/alertes`.
- **Comprendre immédiatement quoi savoir et quoi faire** — chaque alerte a **deux blocs explicites** : « Ce que vous devez savoir » (situation) et « Ce que vous devez faire » (consignes **numérotées**, une par ligne, ex. couper les appareils non essentiels, éviter l'ascenseur, rester joignable). Le bandeau résume les deux premières consignes et pointe vers `/alertes`. Le **secteur concerné** est affiché (« Secteur concerné : Secteur nord »), avec gravité lisible (Information / Vigilance / Critique).
- **Scénario semé** — la panne électrique du secteur nord (scénario du besoin) est active sur une base fraîche, accompagnée d'une alerte levée ; le tri par gravité et la fenêtre sont couverts par 4 tests unitaires.

### URL ou emplacement pour tester la fonctionnalité

- Public : n'importe quelle page (**bandeau rouge en haut**) ; consignes complètes sur **`/alertes`**.
- Conseil : **`/council/alerts`** (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/` (même en navigation privée) : le bandeau **« 🚨 Alerte colonie · Critique — Panne électrique — secteur nord »** s'affiche, résume les consignes et « Secteur concerné : Secteur nord » ; « Voir les consignes » mène à `/alertes` (situation + étapes numérotées).
2. En Conseil sur `/council/alerts`, cliquer **« Lever l'alerte »** : rafraîchir l'accueil — le bandeau a disparu, l'alerte rejoint « Alertes récemment levées » sur `/alertes`.
3. **Publier une alerte** (ex. coupure d'eau, secteur 05, 3 consignes) : elle apparaît partout en quelques secondes et la notification arrive dans l'espace personnel des habitants du secteur.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/alerts.test.ts` (4 OK) — bandeau et page vérifiés en navigateur.
