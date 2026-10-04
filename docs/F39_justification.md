# F39 — Prendre rendez-vous avec un agent

> **Besoin officiel (F39, Moyenne, 600 XP)** — Les citoyens devraient pouvoir prendre rendez-vous avec un agent. Le parcours doit éviter les ambiguïtés sur le créneau choisi et donner à l'habitant les informations nécessaires pour préparer son rendez-vous.

**Branche :** `features/appointment-booking` (PR #92)
**Commit :** `b47240f` — « feat: taking appointment is now possible »

**Emplacements dans le code :** `app/citizen/appointments/page.tsx` (à venir / historique), `app/citizen/appointments/nouveau/page.tsx`, `components/colony/AppointmentForm.tsx`, `lib/actions/appointments.ts`, `lib/services.ts` (`createAppointment`, `cancelAppointment`, `ensureAppointmentReminders`, `isAppointmentSlotTaken`), modèle `Appointment` (`prisma/schema.prisma`), `prisma/seed.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un parcours complet de prise de rendez-vous, **sans ambiguïté sur le créneau** et avec les informations de préparation :

- **Choisir un service et un créneau** — `/citizen/appointments/nouveau` liste les services publiés, puis des créneaux de 30 minutes ; le créneau choisi est confirmé explicitement.
- **Pas de double réservation** — la réservation est **sérialisée en base** (verrou SQL sur le service) et re-vérifiée avant écriture : si deux personnes visent le même créneau, une seule obtient la place, l'autre reçoit le message clair « Ce créneau vient d'être réservé. » (testé par 15 réservations concurrentes).
- **Confirmation et préparation** — le rendez-vous confirmé porte une **référence**, une **notification** de confirmation, et les **instructions de préparation du service** (documents à apporter, heure de présentation) sont recopiées sur la réservation et visibles dans `/citizen/appointments`.
- **Annulation et rappel** — l'habitant annule depuis sa liste ; un **rappel automatique** est envoyé (une seule fois) dans les 24 h précédant le rendez-vous (F40).
- **Traçable et sûr** — seuls les `CITIZEN` créent leurs propres rendez-vous (propriétaire = session) ; un service désactivé ne peut pas être réservé (F63/F38).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Prise de rendez-vous** : `/citizen/appointments/nouveau` (la fiche d'un service propose aussi « Prendre rendez-vous »).
- **Mes rendez-vous** : `/citizen/appointments`.
- **Comptes** : habitant `citoyen@terranova.fr` / `password123` ; le formulaire est aussi accessible depuis une fiche service, ex. `/services/medical`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Réserver** — connecté en habitant, ouvrir `/citizen/appointments/nouveau` (ou `/services/medical` → « Prendre rendez-vous ») : choisir un service, une date, un créneau ; valider. Un accusé avec **référence** s'affiche.
2. **Vérifier le créneau** — le rendez-vous apparaît dans `/citizen/appointments` avec sa date, son service et ses **instructions de préparation**. Recharger `/citizen/requests` : le rendez-vous figure dans le suivi global.
3. **Tester l'ambiguïté de créneau** — dans un second navigateur (ou après reconnexion), tenter de réserver **le même créneau** : la seconde réservation est refusée avec un message explicite ; le premier rendez-vous reste intact.
4. **Annuler** — annuler le rendez-vous depuis la liste : le statut passe à « Annulé » et une notification le confirme.
5. **Rappel** — créer un rendez-vous à moins de 24 h : la notification « Rappel — rendez-vous à venir » est livrée une seule fois (visible dans `/citizen/notifications`).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont réservations concurrentes et rappels idempotents).
