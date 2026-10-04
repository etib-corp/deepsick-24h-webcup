# F30 — Prévenir les habitants quand une annonce importante est publiée

> **Besoin officiel (F30, Moyenne, 560 XP)** — Les habitants souhaitent être prévenus lorsqu'une annonce importante est publiée. L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Branche :** `main` — audit du 4 octobre 2026
**Commit :** `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `lib/services.ts` (`notifyCitizens`, `createAnnouncement`, `setAnnouncementPublished`), `app/council/announcements/page.tsx`, `components/colony/AnnouncementForm.tsx`, `app/citizen/notifications/page.tsx`, `lib/actions/notifications.ts`, modèle `Notification` (`prisma/schema.prisma`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Chaque **publication d'annonce** prévient désormais **tous les habitants** par une notification interne :

- **Notification au bon moment** — lorsqu'une annonce passe de **brouillon → publiée** (bouton « Publier » dans `/council/announcements`, ou création directement publiée), une notification est créée pour **chaque compte `CITIZEN`**, dans la même transaction que la publication. Re-enregistrer une annonce déjà publiée **ne renotifie pas** (pas de spam).
- **Information compréhensible immédiatement** — la notification porte le **titre de l'annonce** et un lien direct vers `/announcements/{slug}`, où l'annonce complète est lisible ; elle apparaît dans `/citizen/notifications` avec pastille de non-lu et bouton « tout marquer lu », et est reprise dans la cloche de l'en-tête citoyen.
- **Traçable** — la publication est aussi enregistrée dans le journal de sécurité (`CONTENT_CHANGED`), consultable sur `/council/security`.
- **Vérifié en conditions réelles** — la publication d'un brouillon de test a créé les notifications pour **les deux comptes citoyens** de la démonstration (dont le compte sans e-mail d'iris.nouvelle, F71).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Publier** : `/council/announcements` (Conseil — `conseil@terranova.fr` / `password123`).
- **Recevoir** : `/citizen/notifications` (habitant — `citoyen@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Créer un brouillon** — connecté en Conseil, ouvrir `/council/announcements`, saisir un titre et un contenu **sans** cocher « Publier immédiatement », puis « Publier l'annonce » : l'annonce apparaît en **Brouillon**.
2. **Publier** — cliquer sur **« Publier »** à côté du brouillon : le statut passe à **Publiée**.
3. **Recevoir la notification** — se reconnecter en habitant (`citoyen@terranova.fr`) : la **cloche** affiche un nouveau message ; `/citizen/notifications` montre **« Nouvelle annonce municipale »** avec le titre de l'annonce ; le lien ouvre la publication.
4. **Vérifier l'absence de doublon** — re-cliquer sur « Publier/Re-enregistrer » une annonce déjà publiée ne crée **aucune** notification supplémentaire.
5. **Vérifier la traçabilité** — en Conseil, `/council/security` montre l'événement `CONTENT_CHANGED` correspondant.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`.
