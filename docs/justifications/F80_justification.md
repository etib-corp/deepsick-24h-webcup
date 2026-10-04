# F80 — Identifier et classer les dossiers prioritaires côté agents

> **Besoin officiel (F80, Moyenne, 800 XP)** — Le volume de demandes augmente et toutes n'ont pas la même urgence. Les agents doivent pouvoir identifier et classer les dossiers prioritaires dans leur espace de travail afin d'organiser leur traitement.

**Branche :** `main` — audit du 4 octobre 2026
**Commit :** `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `lib/roles.ts` (`REQUEST_PRIORITY_RANK`, `REQUEST_PRIORITY_LABELS`), `lib/data.ts` (`getStaffRequests` — tri par priorité puis récence), `components/ui/StatusBadge.tsx` (`PriorityBadge`), `app/operations/administration/page.tsx` (file), `app/api/requests/route.ts` (API staff)

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

La file de travail des agents **classe elle-même les urgences** :

- **Tri par priorité** — les demandes sont ordonnées **Urgente → Haute → Normale → Basse**, puis de la plus récente à la plus ancienne : l'agent ouvre sa file et voit immédiatement par quoi commencer, sans manipulation.
- **Priorité visible sur chaque ligne** — chaque dossier affiche son **badge de priorité** (« Urgente », « Haute », « Normale », « Basse ») à côté de son statut, dans la file comme dans le détail.
- **Un seul classement partout** — le tri est appliqué dans la fonction de lecture partagée (`getStaffRequests`) : la console `/operations/administration` **et** l'API staff (`GET /api/requests`) renvoient le même ordre, donc les outils dérivés (intégrations, agent workspace) héritent du classement.
- **Organisation du traitement** — combiné aux tuiles « À traiter / En examen / Traitées » et aux statuts, l'agent organise sa journée : traiter d'abord l'urgent, puis suivre l'avancement.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **File d'instruction** : `/operations/administration` (agent `administration@terranova.fr` / `password123`).
- **API** : `GET /api/requests` (staff connecté).
- **Données de démonstration** : les demandes semées couvrent les priorités Haute / Normale / Basse.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Observer le classement** — connecté en agent, ouvrir `/operations/administration` : la file affiche « Haute » avant « Normale » avant « Basse », chaque ligne avec son badge de priorité.
2. **Vérifier la cohérence API** — appeler `GET /api/requests` avec la session staff : les demandes reviennent dans le même ordre de priorité.
3. **Créer un dossier urgent** — déposer une demande urgente (ou passer la priorité d'un dossier existant) : elle remonte en tête de file au rechargement.
4. **S'organiser** — utiliser les compteurs « À traiter / En examen / Traitées » pour visualiser la charge, puis traiter un dossier et vérifier sa sortie de la file active.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont la file filtrée des incidents).
