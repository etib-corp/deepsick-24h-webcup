# F70 — Données administratives strictement réservées aux agents autorisés

> **Besoin officiel (F70, Difficile, 1140 XP)** — Certaines données administratives doivent être strictement réservées aux agents autorisés. La protection doit être perceptible dans le fonctionnement réel de la plateforme sans rendre l'usage normal inutilement compliqué.

**Branche :** `82-security-f-69-harden-the-platform-against-exploitation-of-sensitive-data` (PR #98)
**Commit :** `9fb531a` — « refactor: improve higly security »

**Emplacements dans le code :** `middleware.ts` (navigation), `lib/permissions.ts` (`requirePageRole`, `requireApiRole`, `hasRole`, `hasAnyRole`), `lib/api.ts` (`authErrorResponse`, `serverErrorResponse`), toutes les pages `app/council/*` et `app/operations/*`, `app/api/*` (rôles exigés avant traitement), `lib/data.ts` (propriété dans les requêtes), `docs/F69_security.md`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

L'accès aux données administratives est **vérifié côté serveur à chaque requête**, sans complexifier l'usage normal :

- **Double barrière** — `middleware.ts` oriente la navigation, puis **chaque page, action et route API re-vérifie le rôle** (`requirePageRole` / `requireApiRole`) avant de lire ou d'écrire quoi que ce soit. Le middleware seul n'est jamais considéré comme suffisant.
- **Données sensibles cloisonnées** — les espaces `/council/*` (comptes, services, annonces, diffusions, consultations, sécurité) et `/operations/*` (files et dossiers des services) exigent les rôles correspondants ; les API d'écriture de contenu (`POST /api/services`, `POST /api/announcements`) sont réservées au rôle `COUNCIL` (rôle erroné corrigé au passage).
- **Propriété toujours appliquée** — un habitant ne lit que **ses** données : les requêtes portent `where: { id, authorId }` / `where: { id, citizenId }` ; deviner un identifiant renvoie « introuvable », jamais le dossier d'un autre.
- **Refus visibles et tracés** — un accès non autorisé redirige vers l'espace légitime de l'utilisateur (jamais une impasse) et écrit un événement `ACCESS_DENIED` (acteur, rôle requis) visible dans `/council/security`.
- **Usage normal inchangé** — pas de CAPTCHA ni d'étape supplémentaire pour les parcours citoyens ; la protection est invisible tant que l'on reste dans son périmètre.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Cibles sensibles** : `/council`, `/council/users`, `/council/services`, `/operations/administration`.
- **Journal des refus** : `/council/security`.
- **Comptes** : habitant `citoyen@terranova.fr`, agent `administration@terranova.fr`, Conseil `conseil@terranova.fr` (mot de passe `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Tenter un accès interdit** — connecté en habitant (`citoyen@terranova.fr`), ouvrir `/council`, puis `/council/users` : redirection vers l'espace citoyen ; l'accès est **refusé** et tracé.
2. **Vérifier la trace** — connecté en Conseil, ouvrir `/council/security` : un événement **« Accès refusé »** apparaît avec l'acteur, le rôle requis et l'heure.
3. **Tester côté API** — appelé sans le bon rôle (par ex. `POST /api/services` en habitant), l'endpoint répond une erreur d'autorisation **avant** tout traitement ; en Conseil, le même appel fonctionne.
4. **Propriété** — en habitant, tenter d'ouvrir la fiche d'un dossier qui n'est pas le sien (identifiant deviné) : réponse « introuvable », aucune fuite de données.
5. **Usage normal** — vérifier que les parcours citoyens (services, demandes, rendez-vous) ne demandent aucune étape supplémentaire.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `tests/security.test.ts` + suite `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont propriété et hiérarchie des rôles).
