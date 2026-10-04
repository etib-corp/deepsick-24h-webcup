# F49 — Être prévenu quand une demande change d'état

> **Besoin officiel (F49, Facile, 330 XP)** — J'aimerais être informée quand ma demande change d'état. L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Branche :** `main` — audit du 4 octobre 2026
**Commit :** `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `lib/services.ts` (`updateRequestStatus` — notification dans la transaction d'historique), `app/citizen/notifications/page.tsx`, `lib/actions/notifications.ts` (`markNotificationsReadAction`), `app/citizen/requests/[kind]/[id]/page.tsx` (destination du lien), modèle `Notification` (`prisma/schema.prisma`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Chaque **changement de statut d'une demande administrative** prévient son auteur :

- **Notification au bon moment** — au moment exact où l'agent met à jour le statut, une notification est créée **dans la même transaction** que l'événement d'historique (pas d'état intermédiaire incohérent). Le message est : « Demande {référence} mise à jour · Nouveau statut : {statut} ».
- **Comprendre immédiatement** — le **statut est écrit en toutes lettres** dans la notification (« En cours d'examen », « En traitement », « Résolue », « Clôturée ») ; un **lien direct** ouvre la fiche de suivi de la demande, avec son historique complet.
- **Visible au bon endroit** — la notification apparaît dans `/citizen/notifications` (pastille de non-lu dans l'en-tête, bouton « Tout marquer lu »), aux côtés des autres nouvelles du parcours (signalements, commandes, rendez-vous).
- **Pas de doublon** — rejouer le **même** statut n'envoie rien ; seul un vrai changement notifie.
- **Vérifié en conditions réelles** — un changement de statut par l'agent a créé la notification attendue pour l'auteur (contrôlé en base et dans l'interface).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Déclencher** : `/operations/administration` → ouvrir une demande → changer le statut (agent `administration@terranova.fr` / `password123`).
- **Recevoir** : `/citizen/notifications` (habitant `citoyen@terranova.fr` / `password123`).
- **Suivre** : le lien de la notification ouvre le détail dans `/citizen/requests`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Préparer** — se connecter en habitant et relever l'état de ses notifications. Se reconnecter en agent (`administration@terranova.fr`).
2. **Changer un statut** — ouvrir `/operations/administration`, choisir une demande de l'habitant (ex. `REQ-2026-0001`), passer le statut à « En traitement » avec une note, valider.
3. **Constater côté habitant** — se reconnecter en habitant : la **cloche** signale un nouveau message ; `/citizen/notifications` affiche « **Demande {référence} mise à jour** · Nouveau statut : En traitement » ; le lien ouvre la demande avec l'historique à jour.
4. **Vérifier l'absence de doublon** — remettre le **même** statut : aucune nouvelle notification n'est créée.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont les notifications de rendez-vous et l'historique des demandes).
