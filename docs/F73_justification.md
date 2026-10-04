# F73 — Publier un message officiel visible par tous immédiatement

> **Besoin officiel (F73, Moyenne, 780 XP)** — Le Haut Conseil souhaite publier un message officiel visible par tous immédiatement. L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Branche :** `F73-high-council-official-announcement` (PR #96)
**Commit :** `c49554d` — « feat: add High Council official announcements » ; `cbb868c` — « feat: rotate active broadcasts in a carousel »

**Emplacements dans le code :** `app/council/broadcasts/page.tsx` (gestion), `components/colony/BroadcastForm.tsx`, `lib/actions/admin.ts` (`createBroadcastAction`, `toggleBroadcastAction`, `deleteBroadcastAction`), `lib/data.ts` (`getActiveBroadcasts`, `getAllBroadcasts`), `components/layout/BroadcastBanner.tsx` + `BroadcastMessages.tsx` (bandeau), `lib/actions/broadcasts.ts` (`getPublicBroadcasts`), monté dans `app/(public)/layout.tsx`, `app/citizen/layout.tsx`, `app/operations/layout.tsx`, `app/council/layout.tsx`, modèle `Broadcast`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

Le Haut Conseil dispose d'un **canal de diffusion officiel** :

- **Visible par tous, immédiatement** — le message s'affiche dans un **bandeau en haut de toutes les pages** : site public (y compris visiteurs non connectés), espace citoyen, consoles des services et espace Conseil. La publication apparaît en quelques secondes (rafraîchissement 5 s, immédiat au retour sur l'onglet), sans rechargement brutal de la page.
- **Au bon moment** — chaque diffusion est **activable/désactivable en un clic** et peut porter une **fenêtre horaire** (`startsAt` / `endsAt`) : le message n'apparaît que pendant la période voulue, puis disparaît automatiquement.
- **Compréhensible et actionnable** — titre, texte libre (les sauts de ligne sont conservés), et **bouton d'action optionnel** (libellé + lien relatif ou externe). Les consignes (« Confinez-vous… », « Consultez les consignes ») sont directement lisibles dans le bandeau.
- **Gouvernance et traçabilité** — seul le rôle `COUNCIL` crée/modifie/supprime les diffusions (`/council/broadcasts`) ; chaque opération est journalisée (`CONTENT_CHANGED` dans `/council/security`). Le jeu de démonstration contient trois diffusions actives (tempête, crue F29, chaleur F31).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Gestion** : `/council/broadcasts` (Conseil — `conseil@terranova.fr` / `password123`).
- **Diffusion** : n'importe quelle page de l'application (`/`, `/services`, `/citizen`, `/operations/*`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Publier** — connecté en Conseil, ouvrir `/council/broadcasts`, saisir un titre, un message et éventuellement un lien d'action, puis valider : le message apparaît dans la liste.
2. **Le voir partout** — ouvrir `/` (même en navigation privée) : le message est affiché **en haut**, avant le contenu ; naviguer vers `/services` ou `/citizen` : il reste présent.
3. **Tester la fenêtre** — créer une diffusion avec une date de début future (ou en désactiver une) : le bandeau ne l'affiche pas ; l'activer/supprimer réagit immédiatement.
4. **Vérifier la trace** — `/council/security` montre la création/modification de la diffusion (`CONTENT_CHANGED`).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont la sélection des diffusions actives par fenêtre horaire).
