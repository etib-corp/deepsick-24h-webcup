# F67 — Consulter les projets en cours de la ville

> **Besoin officiel (F67, Moyenne, 740 XP)** — Les citoyens devraient pouvoir consulter les projets en cours dans la ville. Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** modèle `Project` (`prisma/schema.prisma`), `lib/data.ts` (`getPublishedProjects`, `getProjectBySlug`, `getAllProjects`), `lib/services.ts` (CRUD projet), `lib/actions/projects.ts`, pages publiques `app/(public)/projects/page.tsx` + `[slug]/page.tsx`, console `app/council/projects/page.tsx` + `components/colony/ProjectForm.tsx`, `lib/roles.ts` (`PROJECT_STATUSES`), seed (3 projets)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Annuaire public des projets** — `/projects` liste les projets publiés avec statut (Planifié / En cours / Terminé), secteur, résumé et barre d'avancement ; `/projects/[slug]` détaille le projet avec dates prévues.
- **Suivi clair pour tous** — chaque carte affiche l'avancement en pourcentage et le statut en badge coloré, lisible sans explication.
- **Gestion par le Haut Conseil** — `/council/projects` permet de créer un projet, le publier/dépublier, changer son statut et le supprimer ; chaque action est auditée (`CONTENT_CHANGED`).
- **Accès naturel** — entrées de navigation (en-tête public, pied de page), fil d'Ariane et contenu de démonstration seedé (extension du Secteur 05, réseau d'eau nord, parc du BioDôme).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/projects` et `/projects/extension-secteur-05`.
- **Haut Conseil** : `/council/projects` (compte `conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Consulter** — ouvrir `/projects` : trois projets avec leurs statuts et avancements.
2. **Détailler** — ouvrir « Extension du Secteur 05 » : description, secteur, avancement.
3. **Administrer** — en tant que conseil, créer un projet dans `/council/projects`, le voir apparaître côté public (publication immédiate), puis changer son statut.
4. **Dépublier** — le projet disparaît de la liste publique, le brouillon reste dans la console.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
