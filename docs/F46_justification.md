# F46 — Retrouver rapidement les hôpitaux et services d'urgence

> **Besoin officiel (F46, Facile, 320 XP)** — Où se trouvent les hôpitaux et services d'urgence ? L'habitant doit pouvoir comprendre rapidement l'information utile à sa situation et agir sans devoir parcourir plusieurs écrans.

**Branche :** `feat/services-interactive-map` (PR #32)
**Commit :** `8c5bb6b` — « feat: add service map positions »

**Emplacements dans le code :** `app/citizen/map/page.tsx`, `components/colony/ColonyMap.tsx`, `lib/map-layout.ts`, `public/terra-nova-map.webp`, `app/(public)/services/page.tsx` + `app/(public)/services/[slug]/page.tsx`, `prisma/seed.ts` (`mapX`, `mapY`, `sector`, `preparation`, service « Soins médicaux »), `lib/roles.ts` (`COLONY_SECTORS`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'habitant trouve le lieu **en un écran**, puis agit directement :

- **Carte des services physiques** — `/citizen/map` affiche la carte de la colonie avec un **module par service** positionné (`mapX`/`mapY`) et son **secteur** : le service médical « Soins médicaux — Asclepius » est visible dans le **BioDôme (Secteur 02)**, avec la liste des secteurs sous la carte.
- **Mise en avant** — « Soins médicaux » est un service **prioritaire** (`featured`) sur `/services` (catégorie « Santé », icône ✚) ; sa fiche précise le secteur, la description des urgences prises en charge (« triage des urgences, soins courants, accès aux modules médicaux ») et la **préparation** (« présentez-vous 10 minutes avant l'heure »).
- **Agir sans multiplier les écrans** — depuis la fiche, liens directs « Créer une demande liée » et « Prendre rendez-vous » ; en cas d'incident médical, le formulaire de signalement (`/citizen/report`, type **Médical**) route la demande vers le service compétent avec secteur et description.
- **Accessible sur tous les supports** — la carte a une alternative lisible (liste HTML des services et leurs fiches), donc l'information reste disponible même sans carte.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Carte** : `/citizen/map` (habitant connecté — `citoyen@terranova.fr` / `password123`).
- **Annuaire** : `/services` → « Soins médicaux » → `/services/medical`.
- **Urgence** : `/citizen/report` (type « Médical »).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Localiser** — connecté en habitant, ouvrir `/citizen/map` : le module **Soins médicaux** apparaît sur la carte avec son secteur (BioDôme) ; la liste des secteurs est visible sous la carte.
2. **Vérifier la mise en avant** — ouvrir `/services` : « Soins médicaux » est dans les **services prioritaires** avec sa catégorie « Santé » ; ouvrir sa fiche : secteur, description (urgences) et consignes de préparation sont affichés.
3. **Agir** — depuis la fiche, cliquer « Prendre rendez-vous » (créneau médical) ou « Créer une demande liée » ; en parallèle, tester `/citizen/report` avec le type « Médical » : le formulaire collecte le secteur et le détail de la situation.
4. **Sans carte** — passer la carte en vue « Liste » (ou lire la liste HTML) : les mêmes informations restent accessibles.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`.
