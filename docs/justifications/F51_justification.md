# F51 — Inquiétudes sur l'usage des données personnelles

> **Besoin officiel (F51, Difficile, 990 XP)** — Plusieurs habitants disent ne pas comprendre comment leurs données sont utilisées par la plateforme et souhaitent pouvoir faire remonter leurs inquiétudes. Cette participation doit être simple à comprendre et laisser une trace suffisamment claire pour que l'habitant sache que sa contribution a bien été prise en compte.

**Emplacements dans le code :** `app/citizen/donnees/page.tsx` (espace habitant), `components/forms/DataConcernForm.tsx` (dépôt), `app/council/donnees/page.tsx` (traitement Conseil), `lib/actions/privacy.ts`, `lib/services.ts` (`createDataConcern`, `reviewDataConcern`), modèle `DataConcern`, statuts `RECEIVED → REVIEWED → ANSWERED` (`lib/roles.ts`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Une page **« Mes données & vie privée »** dans l'espace personnel :

- **Comprendre** — la page affiche **ce que la ville conserve** (compteurs réels par catégorie : demandes, signalements, commandes, rendez-vous, messages…, issus de l'export F55) et **comment ces données sont utilisées** (finalités, accès limité aux services concernés + audit du Conseil, statistiques agrégées et anonymes). Un lien direct mène à l'export/la suppression (`/citizen/account`).
- **Faire remonter une inquiétude** — formulaire simple (sujet + message), validation douce, **accusé immédiat avec référence unique** (convention D04), visible ensuite en tête de liste.
- **Trace suffisamment claire** — chaque inquiétude apparaît avec sa référence, sa date et son **statut suivi** (`Reçue → En cours d'examen → Réponse apportée`) ; la réponse écrite du Conseil s'affiche dans la fiche. Une **notification** (F49) prévient à chaque changement d'état.
- **Côté Conseil** — `/council/donnees` liste les inquiétudes (auteur, message, statut), permet de « marquer en examen » puis de répondre ; chaque action est journalisée (`CONTENT_CHANGED`). Une inquiétude déjà répondue est semée pour la démonstration.

### URL ou emplacement pour tester la fonctionnalité

- Habitant : **`/citizen/donnees`** (`citoyen@terranova.fr` / `password123`).
- Conseil : **`/council/donnees`** (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Connecté citoyen, ouvrir `/citizen/donnees` : lire « Ce que la ville conserve » et « Comment vos données sont utilisées » ; la fiche « Qui peut consulter mes signalements ? » montre une **réponse du Conseil** avec le statut « Réponse apportée ».
2. Déposer une nouvelle inquiétude : l'accusé affiche une **référence** ; la fiche apparaît aussitôt dans « Suivi de vos inquiétudes » au statut « Reçue ».
3. Se connecter en Conseil sur `/council/donnees` : la nouvelle inquiétude est en file ; la **marquer en examen**, puis **envoyer une réponse**.
4. Revenir côté citoyen : le statut a changé, la réponse est lisible et une **notification** a été envoyée.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/*.test.ts` (88 OK).
