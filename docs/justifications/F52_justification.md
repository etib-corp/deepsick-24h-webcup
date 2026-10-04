# F52 — Soutenir une demande déjà déposée

> **Besoin officiel (F52, Moyenne, 660 XP)** — Peut-on soutenir une demande déjà déposée par d'autres habitants ? Cette participation doit être simple à comprendre et laisser une trace suffisamment claire pour que l'habitant sache que sa contribution a bien été prise en compte.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** modèle `RequestSupport` + champ `ServiceRequest.shareForSupport` (`prisma/schema.prisma`), `lib/services.ts` (`toggleRequestSupport`, `setRequestShared`), `lib/actions/supports.ts`, `app/citizen/soutien/page.tsx`, `lib/data.ts` (`getSharedRequests`, `getOwnRequestsForSharing`, `getSupportedRequestIds`), badges de la file agent (`app/operations/administration/page.tsx`), seed (`REQ-2026-0004`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Partage choisi par l'auteur** — chaque habitant partage (ou retire) ses propres demandes depuis « Demandes du quartier » ; rien n'est visible sans son accord (`shareForSupport`, opt-in).
- **Soutien en un clic, avec trace** — bouton « Je soutiens » / « Soutenu » (`aria-pressed`), compteur de soutiens affiché partout, et retour immédiat après enregistrement ; un seul soutien par habitant et par demande (`@@unique`).
- **L'auteur est prévenu** — chaque nouveau soutien crée une notification « Nouveau soutien pour REQ-… » dans l'espace du demandeur.
- **Visible côté agents** — le nombre de soutiens apparaît sur la file du Bureau des démarches, pour prioriser si besoin.
- **Cadre serveur** — soutenir sa propre demande est refusé, soutenir une demande non partagée est refusé, le partage est limité à l'auteur (`updateMany` avec `authorId`).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Citoyen** : `/citizen/soutien` (compte `citoyen@terranova.fr` / `password123` ; une demande partagée d'Iris Halden est seedée, et `REQ-2026-0001` / `REQ-2026-0004` sont partagées).
- **Agent** : `/operations/administration` (compte `administration@terranova.fr`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Soutenir** — se connecter en citoyen, cliquer « Je soutiens » : le bouton passe à « Soutenu », le compteur s'incrémente.
2. **Vérifier la trace** — se reconnecter en tant qu'Iris (identifiant `iris.nouvelle` / `password123`) : la notification « Nouveau soutien » attend dans la cloche.
3. **Partager sa demande** — dans « Mes demandes récentes », « Partager » rend la demande visible sur le tableau.
4. **Côté agent** — la file affiche le badge 🤝 avec le nombre de soutiens.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
