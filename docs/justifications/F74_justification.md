# F74 — Voir les horaires et l'emplacement des services

> **Besoin officiel (F74, Facile, 390 XP)** — Nous souhaiterions que les habitants puissent voir facilement nos horaires et l'endroit où nous trouver. L'habitant doit pouvoir comprendre rapidement l'information utile à sa situation et agir sans devoir parcourir plusieurs écrans.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** champs `MunicipalService.openingHours` + `address` (`prisma/schema.prisma`, migration `20261004220000_community_medium_easy`), fiche service `app/(public)/services/[slug]/page.tsx`, panneau de la carte `components/colony/ColonyMap.tsx` + `lib/map-layout.ts`, formulaire Conseil `components/colony/ServiceForm.tsx`, validation `serviceSchema` (`lib/validation.ts`), seed (horaires + adresse sur les 7 services, dont la Maison des associations)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Horaires et adresse sur la fiche** — chaque service publié affiche un bloc « Horaires d'ouverture » / « Adresse » directement sous sa description ; visible en un écran, avant les actions.
- **Visibles aussi sur la carte** — le panneau de détail de la carte interactive affiche les horaires du service survolé/sélectionné.
- **Renseignables par le Conseil** — le formulaire de création de service (`/council/services`) propose les deux champs, validés et stockés (nettoyage des entrées).
- **Association partenaire incluse** — un service « Maison des associations » est seedé avec horaires et adresse (demande portée par une association partenaire).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/services/associations`, `/services/demarches` (fiches), `/services` (carte → panneau d'un service).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Ouvrir une fiche** — `/services/associations` affiche « Horaires d'ouverture : Lun.–Ven. · 14:00–19:00 ; Sam. · 10:00–13:00 » et l'adresse du module.
2. **Survoler la carte** — sur `/services`, sélectionner un module : les horaires apparaissent dans le panneau.
3. **Administrer** — en Conseil (`/council/services`), créer un service en renseignant horaires/adresse : la fiche publique les affiche.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
