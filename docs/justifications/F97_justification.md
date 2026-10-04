# F97 — Lignes de transport interrompues : trouver une solution de remplacement

> **Besoin officiel (F97, Difficile, 1350 XP)** — Plusieurs lignes de transport sont interrompues. Les habitants concernés doivent pouvoir trouver rapidement une solution de remplacement. Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Emplacements dans le code :** `app/(public)/transport/page.tsx` (bandeau + bloc par ligne), `app/operations/transport/page.tsx` (console Hermes), `components/colony/DisruptionForm.tsx` (publication), `lib/actions/disruptions.ts`, `lib/transit.ts` (`isDisruptionLive`), modèle `TransitDisruption`, `tests/transit.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un canal **« Info trafic »** entre la console Hermes et la page publique des transports :

- **Solution de remplacement au premier regard** — sur `/transport`, la ligne interrompue porte un bloc rouge « **Ligne interrompue** » : message aux voyageurs puis encadré « **Solution de remplacement** » (ex. « Empruntez la Navette A (arrêt Centre civique)… »), avec un **lien direct vers la ligne de remplacement** quand elle existe. Un bandeau de synthèse en tête (« 1 ligne(s) perturbée(s)… ») conduit à la bonne ligne.
- **Visible au bon moment** — chaque perturbation a un état actif et une **fenêtre horaire optionnelle** (`début` / `fin prévue`) : elle apparaît quand la fenêtre s'ouvre et disparaît une fois levée. Rien à comprendre techniquement : trois champs en clair (ligne, message, solution).
- **Pilotage par les équipes** — la console `/operations/transport` (rôles DRIVER / COUNCIL) liste les perturbations (« En cours / Levée »), permet de **publier** une perturbation (ligne, gravité, message, solution, navette de remplacement, fin prévue) et de la **lever** d'un clic ; publication et levée sont journalisées.
- **Scénario semé** — la Navette B est interrompue avec remplacement par la Navette A sur une base fraîche ; la logique de fenêtre est couverte par des tests unitaires.

### URL ou emplacement pour tester la fonctionnalité

- Public : **`/transport`** (aucune connexion requise).
- Console : **`/operations/transport`** (`transport@terranova.fr` ou `conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/transport` : bandeau « 1 ligne(s) perturbée(s) », bloc rouge sur la **Navette B** avec la solution : Navette A + **lien vers la Navette A** (ancrage vérifié).
2. Se connecter en transport sur `/operations/transport` : la perturbation est « En cours » ; cliquer **« Lever »** puis rafraîchir `/transport` : le bloc a disparu, la ligne revient à la normale.
3. Publier une nouvelle perturbation (ex. Navette C, avec solution et fin prévue) : elle apparaît immédiatement sur `/transport`.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/transit.test.ts` (7 OK, dont la fenêtre de perturbation) — parcours vérifié en navigateur.
