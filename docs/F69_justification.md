# F69 — Protection des données sensibles

## Qu’avez-vous mis en place pour répondre à cette demande ?

Nous avons durci la plateforme sans ajouter aucune friction aux parcours habitants :

- **Accès vérifié côté serveur** sur chaque page, action et route API (rôle + propriété) ; les deux routes API qui exigeaient un rôle inexistant (`ADMIN`) sont désormais réservées au `COUNCIL`.
- **Entrées validées et neutralisées** (`lib/sanitize.ts`) via les schémas partagés formulaires/API : balises HTML/script et caractères de contrôle supprimés, tailles bornées, liens en liste blanche (rejet de `javascript:`, `data:`, `vbscript:`).
- **Journal d’audit en ajout seul** (`SecurityEvent`) : échecs/blocages de connexion, accès refusés, changements de rôle et de contenu, transitions de statut, dossiers de sécurité, entrées neutralisées — avec acteur, rôle, cible, IP et date.
- **Console « Sécurité » du Conseil** (`/council/security`) : compteurs 24 h et flux des événements ; les mêmes compteurs figurent sur la vue d’ensemble du Conseil.
- **Aucune fuite technique** en cas d’échec : messages génériques localisés (`PublicError`), erreur 500 générique côté API, page d’erreur globale sans trace.
- **En-têtes HTTP de durcissement** sur toutes les réponses (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP).

Détails techniques : `docs/F69_security.md`.

## URL ou emplacement pour tester la fonctionnalité

- **Console de sécurité : `/council/security`** — sur l’instance de démo : `http://localhost:3000/council/security`
- **Comptes** : Conseil `conseil@terranova.fr` / `password123` — habitant `citoyen@terranova.fr` / `password123`
- Points d’entrée pour générer des événements : `/login`, `/contact`, `/citizen` (tentative `/council`), `/council/users`, `/api/agent/activity`.
- Documentation : `docs/F69_security.md`.

## Comment le jury peut-il vérifier que cela fonctionne ?

1. **Accès refusé côté serveur** — connecté en habitant, ouvrir `/council` : redirection immédiate vers `/citizen`, le contenu du Conseil n’est jamais servi.
2. **Entrée piégée neutralisée** — dans `/contact`, envoyer un objet `Test <script>alert("x")</script>` et un message contenant `<img src=x onerror="alert(1)">` : le message est accepté (référence de suivi affichée) sans conserver les balises.
3. **Échec de connexion sans fuite** — se reconnecter avec un mauvais mot de passe : message générique uniquement (« Identifiant colon ou mot de passe incorrect. »).
4. **Journal d’audit** — connecté en Conseil, ouvrir `/council/security` : les événements des étapes 1 à 3 y figurent (accès refusé, entrée neutralisée, échec de connexion) avec acteur, rôle, IP et date ; changer un rôle dans `/council/users` ajoute un événement « Rôle modifié ».
5. **API et en-têtes** — `curl -i http://localhost:3000/api/agent/activity` sans session → `401` et message générique seulement ; `curl -I http://localhost:3000/login` → `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.

Vérifications automatiques : `npx tsx --test tests/*.test.ts` (11 tests) et `npx next build`. Sur une base fraîche, le `seed` fournit déjà des événements de démonstration.
