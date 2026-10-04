# F72 — Indiquer par où commencer quand on vient d'arriver

> **Besoin officiel (F72, Facile, 380 XP)** — Bonjour, je viens d'arriver en ville et je ne sais pas encore quels services sont utiles dans ma situation. J'aimerais qu'on m'indique rapidement par où commencer sans refaire tout le parcours d'inscription.

**Branche :** `84-feature-f-71-simplify-access-for-new-arrivals-without-email` (PR #108)
**Commit :** `6586fed` — « feat: add arrivals page with no email login »

**Emplacements dans le code :** `app/(public)/arrivants/page.tsx`, `components/arrivals/ArrivalsChecklist.tsx`, `lib/arrivals.ts` (étapes + progression), `app/(public)/services/page.tsx` (services prioritaires `featured`), `lib/tour.ts` (visite « Découvrir la ville »), `app/(public)/guide/page.tsx`, dictionnaires `t.arrivals.*`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

Une page d'accueil publique dédiée aux nouveaux arrivants, **sans inscription**, qui répond « par où commencer » :

- **« Vos premiers pas » en 4 étapes** — `/arrivants` propose une checklist illustrée : **créer un compte, se connecter, faire sa première demande, demander de l'aide**, avec pictogrammes (carte, clé, document, bouée) et **progression conservée sur l'appareil** (indépendante de la langue : changer de langue ne réinitialise rien).
- **Sans refaire le parcours d'inscription** — la page indique explicitement ce qui est consultable **sans compte** (services, annonces, contact, guide) avec des liens directs ; et un lien explique même comment créer un compte **sans e-mail** (identifiant colon) pour ceux qui n'en ont pas.
- **Savoir quels services sont utiles** — le catalogue met en avant les **services prioritaires** (`featured`) et chaque étape pointe vers l'action correspondante ; le **tutoriel interactif** « Découvrir la ville » guide la première visite directement dans l'interface ; `/guide` donne les parcours détaillés par profil.
- **Multilingue et simple** — la page est traduite fr/en/es en langage volontairement simple (phrases courtes, texte vérifié par des tests), avec changement de langue sur place.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Page d'accueil des arrivants** : `/arrivants` (publique, aucune connexion).
- **Suite du parcours** : `/register` (avec ou sans e-mail), `/login`, `/citizen`.
- **Visite guidée** : lancement depuis `/` ou `/arrivants` → « Découvrir la ville ».

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Sans compte** — ouvrir `/arrivants` en navigation privée : les 4 étapes, les liens gratuits et les pictogrammes s'affichent ; cocher les étapes montre la progression (conservée après rechargement).
2. **Changer de langue** — basculer en `EN` ou `ES` sur la page : tout est traduit, la progression des étapes n'est pas perdue.
3. **Suivre « par où commencer »** — cliquer l'étape « Créer un compte » → `/register` ; vérifier le chemin « Je n'ai pas d'e-mail » ; revenir et utiliser le lien « Services » pour voir les **services prioritaires**.
4. **Être guidé dans l'interface** — lancer la visite « Découvrir la ville » : elle surligne les éléments réels (accès aux services, annonces, guide) pour les premières actions.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `tests/arrivals.test.ts` (progression indépendante de la langue) inclus dans la suite (31 OK).
