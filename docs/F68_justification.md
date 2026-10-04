# F68 — Proposer des idées pour améliorer la colonie

> **Besoin officiel (F68, Facile, 370 XP)** — Peut-on proposer des idées pour améliorer la colonie ? Cette participation doit être simple à comprendre et laisser une trace suffisamment claire pour que l'habitant sache que sa contribution a bien été prise en compte.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** modèle `CitizenIdea` (`prisma/schema.prisma`), `lib/data.ts` (`getIdeasByAuthor`, `getAllIdeas`), `lib/services.ts` (`createIdea`, `reviewIdea`), `lib/actions/ideas.ts`, `app/citizen/ideas/page.tsx` + `components/citizen/IdeaForm.tsx`, console `app/council/ideas/page.tsx`, `lib/roles.ts` (`IDEA_STATUSES`), seed (2 idées)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Dépôt d'idée en un formulaire** — titre + description ; à l'envoi, la référence unique s'affiche immédiatement (« Idée transmise — référence IDEA-… ») : la trace est explicite.
- **Suivi par l'habitant** — « Mes idées » liste chaque proposition avec son statut (Reçue, Examinée, Retenue, Non retenue) et la réponse écrite du Conseil quand elle existe.
- **Réponse du Haut Conseil** — `/council/ideas` permet de changer le statut et de rédiger une réponse officielle ; chaque revue met à jour le suivi et notifie l'auteur (« Idée … mise à jour »).
- **Cadre serveur** — dépôt réservé aux citoyens connectés, revue réservée au Conseil, entrées neutralisées/auditées comme les autres contenus.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Citoyen** : `/citizen/ideas` (compte `citoyen@terranova.fr` / `password123` ; idée déjà répondue « Ombrières aux arrêts de navette »).
- **Haut Conseil** : `/council/ideas` (compte `conseil@terranova.fr`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Proposer** — en citoyen, envoyer une idée : la référence s'affiche et l'idée apparaît dans « Mes idées » au statut « Reçue ».
2. **Répondre** — en Conseil, choisir le statut « Retenue », écrire une réponse et l'enregistrer.
3. **Vérifier le retour** — côté citoyen, la réponse du Conseil apparaît et la cloche affiche la notification « Idée … mise à jour ».

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
