# F83 — Conserver une preuve de réception avec référence

> **Besoin officiel (F83, Facile, 410 XP)** — J'ai envoyé une demande importante mais je voudrais conserver une preuve que la ville l'a bien reçue. Un accusé de réception avec une référence identifiable me permettrait de la retrouver ou de la citer plus tard.

**Branche :** `D16-request-submission-confirmation` (PR #28) — complété par F55 (`68-privacy-f-55-...`) et F56 (`69-feature-f-56-...`)
**Commit :** `4eb243d` — « Feat: Add confirmation to submission » ; récapitulatif : `60bdfcb` ; export : `0ef6c2e`

**Emplacements dans le code :** `components/forms/SubmissionForm.tsx` + `components/forms/SubmissionConfirmation.tsx` (accusé avec référence), `lib/actions/reports.ts`, `lib/actions/orders.ts`, `lib/actions/appointments.ts`, `lib/actions/contact.ts`, `lib/services.ts` (`createServiceRequest`, `createContactMessage` — références uniques), `app/citizen/requests/*` (suivi), `app/api/citizen/recap/route.ts` (récapitulatif), `app/api/citizen/data-export/route.ts` (export), `components/forms/DataExportCard.tsx`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

Chaque envoi important produit une **preuve de réception avec une référence identifiable** :

- **Accusé de réception immédiat** — après l'envoi d'un signalement, d'une commande, d'un rendez-vous ou d'un message, le formulaire est remplacé par un **accusé focalisé** (lu par les lecteurs d'écran) affichant la **référence enregistrée** (ex. `INC-042`, `REQ-2026-0001`, `TRN-118`, `OPN-501`), le message de confirmation et un lien de suivi.
- **Référence identifiable et unique** — générée par identifiant unique (jamais de doublon, y compris en envois simultanés), elle identifie le dossier dans toute la plateforme : suivi « Mes démarches » (`/citizen/requests`), détail, et côté agent.
- **Retrouver et citer plus tard** — la **référence reste consultable** dans le suivi ; le **récapitulatif téléchargeable** (`/api/citizen/recap` depuis `/citizen/requests`, F56) regroupe les démarches avec leurs références ; l'**export de données personnel** (`/citizen/account` → export, F55) inclut l'historique complet. Les copies de contact (message à la mairie) sont également conservées avec leur référence.
- **Cohérence** — l'accusé n'apparaît **qu'après succès réel** de l'écriture serveur (pas de faux positif basé sur l'URL), et un rappel « ne pas renvoyer » accompagne la confirmation.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Envoyer** : `/citizen/report`, `/citizen/orders`, `/citizen/appointments/nouveau`, `/contact`.
- **Retrouver** : `/citizen/requests` (suivi + récapitulatif), `/citizen/account` (export de données).
- **Compte** : habitant `citoyen@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Envoyer une demande importante** — connecté en habitant, créer un signalement (`/citizen/report`) : l'accusé affiche « Référence : **INC-…** » ; noter la référence.
2. **La retrouver** — ouvrir `/citizen/requests` : la même référence apparaît dans la liste et dans le détail (statut et historique).
3. **La citer plus tard** — télécharger le **récapitulatif** depuis `/citizen/requests` : le document contient la démarche et sa référence ; dans `/citizen/account`, l'**export de données** contient l'ensemble des informations personnelles (dont ces dossiers).
4. **Vérifier l'unicité** — envoyer deux fois rapidement : une seule création, une seule référence (F82).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont références uniques en créations concurrentes).
