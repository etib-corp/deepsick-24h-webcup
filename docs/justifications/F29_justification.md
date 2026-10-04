# F29 — Alerte crue : informer rapidement le quartier sud

> **Besoin officiel (F29, Difficile, 840 XP)** — Une montée inhabituelle du niveau de l'eau est observée dans le quartier sud. Les habitants doivent être informés rapidement. L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Branche :** `F73-high-council-official-announcement` (canal d'alerte) — scénario de crue semé depuis `main`
**Commit :** `c49554d` — « feat: add High Council official announcements » ; semis : `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `prisma/seed.ts` (diffusion « Alerte crue — secteur sud »), `components/layout/BroadcastBanner.tsx`, `components/layout/BroadcastMessages.tsx`, `lib/data.ts` (`getActiveBroadcasts`), `app/council/broadcasts/page.tsx`, `components/colony/BroadcastForm.tsx`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Nous utilisons le **canal d'alerte officiel** de la colonie (les « messages généraux » du Haut Conseil) pour l'alerte de crue :

- **Information visible immédiatement** — la diffusion s'affiche en **bandeau en haut de toutes les pages** (site public, espace citoyen, consoles des services, Conseil), y compris pour un visiteur **non connecté**. Le bandeau est rafraîchi par polling (5 s) et mis en pause quand l'onglet est masqué.
- **Visible « au bon moment »** — chaque diffusion porte une **fenêtre horaire** (`startsAt` / `endsAt`) et un état actif : une alerte n'apparaît que pendant la période voulue, et peut être activée/désactivée en un clic depuis `/council/broadcasts`.
- **Comprendre quoi savoir ou faire** — le message de crue est **actionnable** : « Le niveau de l'eau monte anormalement au sud de la colonie. Évitez les niveaux bas et les tunnels du Secteur 05 ; les équipes Hephaestus sont mobilisées. Suivez les consignes de sécurité. » avec un bouton **« Consulter les consignes »** vers les annonces officielles.
- **Le scénario est semé** — le jeu de démonstration (`prisma/seed.ts`) contient la diffusion active **« Alerte crue — secteur sud »**, aux côtés de la tempête de poussière et de l'alerte chaleur (F31), donc démontrable sur une base fraîche.

Côté sécurité, seuls les membres du **Haut Conseil** (`COUNCIL`) créent, activent ou suppriment des diffusions (vérifié serveur dans `lib/actions/admin.ts`) ; la lecture publique ne renvoie que les diffusions actives dans leur fenêtre.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Bandeau d'alerte** : page d'accueil `/` (aucune connexion requise) — visible aussi sur `/citizen`, `/operations/*`, `/council`.
- **Gestion des alertes** : `/council/broadcasts` (compte `conseil@terranova.fr`, mot de passe `password123`).
- **Destination du bouton** : `/announcements` (consignes et actualités officielles).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Voir l'alerte** — ouvrir `/` sans être connecté : le bandeau **« Alerte crue — secteur sud »** s'affiche immédiatement, avec son message de sécurité et le bouton « Consulter les consignes ».
2. **Vérifier « au bon moment »** — se connecter en Conseil (`conseil@terranova.fr`) et ouvrir `/council/broadcasts` : la diffusion est **Active** ; la **désactiver** puis rafraîchir l'accueil : le bandeau disparaît ; la réactiver : il revient.
3. **Créer une alerte soi-même** — dans `/council/broadcasts`, publier un message (titre, texte, éventuellement une fenêtre `début`/`fin`) : il apparaît sur toutes les pages, pour tous les profils, en quelques secondes.
4. **Vérifier la cohérence** — « Alerte crue » et « Vague de chaleur » apparaissent ensemble, comme sur une journée de crise réelle ; chacune reste individuellement activable/désactivable.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont la diffusion par fenêtre horaire).
