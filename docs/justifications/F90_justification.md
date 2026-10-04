# F90 — Demander une explication plus simple, seulement quand on en a besoin

> **Besoin officiel (F90, Facile, 430 XP)** — Je comprends la plupart des pages, mais certains passages administratifs sont difficiles. J'aimerais pouvoir demander une explication plus simple uniquement lorsque j'en ai besoin, sans changer toute la plateforme.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `components/ui/PlainExplanation.tsx` (composant `<details>` accessible, zéro JavaScript), textes dans `t.plain.*` (fr/en/es), intégrations : détail d'une demande `app/citizen/requests/[kind]/[id]/page.tsx`, prise de rendez-vous `app/citizen/appointments/nouveau/page.tsx`, formulaire de contact `app/(public)/contact/page.tsx`, fiche service `app/(public)/services/[slug]/page.tsx`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Une aide repliée, ouverte à la demande** — chaque passage administratif clé propose un dépliant « Que veut dire « statut » ? », « Comment se préparer à votre rendez-vous ? », « À quoi sert la référence de suivi ? », « Comment se passe une demande ou un rendez-vous ? ». Rien ne change tant qu'on ne l'ouvre pas.
- **Sans changer la plateforme** — le composant s'insère dans les pages existantes ; il fonctionne sans JavaScript (balise `<details>` native), reste accessible au clavier et aux lecteurs d'écran.
- **Texte en langage clair** — phrases courtes, sans jargon, qui expliquent chaque étape (statuts, préparation, référence, traitement de la demande).
- **Trois langues** — les explications existent en français, anglais et espagnol (dictionnaires synchronisés).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Citoyen** : `/citizen/requests/request/<id>` (« Que veut dire « statut » ? »), `/citizen/appointments/nouveau` (« Comment se préparer ? »).
- **Public** : `/services/demarches` (« Comment se passe une demande ? »), `/contact` (« À quoi sert la référence ? »).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Ouvrir un dépliant** — sur la fiche d'une demande, cliquer « Que veut dire « statut » ? » : l'explication simple se déplie sur place.
2. **Vérifier la discrétion** — sans clic, la page est inchangée ; l'aide ne s'impose jamais.
3. **Fonctionne sans JavaScript** — désactiver JS : le dépliant s'ouvre quand même (élément natif).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
