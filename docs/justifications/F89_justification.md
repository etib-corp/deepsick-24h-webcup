# F89 — Version en langage clair des informations essentielles

> **Besoin officiel (F89, Moyenne, 860 XP)** — Certains citoyens nous signalent que des contenus administratifs restent trop complexes. Nous souhaitons proposer une version en langage clair des informations essentielles, tout en conservant le sens et les éléments importants.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** champs `MunicipalService.plainLanguage` + `Announcement.plainLanguage` (`prisma/schema.prisma`, migration `20261004220000_community_medium_easy`), formulaires Conseil `components/colony/ServiceForm.tsx` + `components/colony/AnnouncementForm.tsx`, validation `serviceSchema`/`announcementSchema` (`lib/validation.ts`), rendu public `app/(public)/services/[slug]/page.tsx` + `app/(public)/announcements/[slug]/page.tsx`, seed (service « Démarches administratives » et annonce « Campagne de vaccination »)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Un bloc « L'essentiel en langage clair »** — quand une version simplifiée existe, elle est affichée sur la fiche service ou l'annonce, dans un encadré distinct, sous le texte administratif d'origine (le sens et les éléments importants restent visibles).
- **Rédaction côté Conseil** — les formulaires de création de service et d'annonce proposent un champ facultatif « Version en langage clair » ; l'équipe éditoriale garde la main sur le contenu simplifié.
- **Exemples réels seedés** — le service « Démarches administratives » explique en mots simples comment déposer et suivre une demande ; l'annonce vaccination explique où aller et ce qu'il faut apporter.
- **Validé et nettoyé** — mêmes règles que les autres contenus (longueur, neutralisation, audit `CONTENT_CHANGED`).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/services/demarches` et `/announcements/campagne-vaccination`.
- **Haut Conseil** : `/council/services` et `/council/announcements` (compte `conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Consulter** — ouvrir `/services/demarches` : l'encadré « L'essentiel en langage clair » résume la démarche en phrases simples.
2. **Vérifier l'annonce** — `/announcements/campagne-vaccination` affiche la version simplifiée sous le corps officiel.
3. **Créer** — en Conseil, rédiger une annonce en renseignant le champ « Version en langage clair » : le bloc apparaît aussitôt sur la page publique une fois publiée.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
