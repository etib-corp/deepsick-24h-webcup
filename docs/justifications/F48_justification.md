# F48 — Savoir qui a modifié quoi dans l'administration

> **Besoin officiel (F48, Moyenne, 640 XP)** — Les agents doivent savoir qui a modifié quoi dans l'administration. Dans l'espace de travail des agents, cette information doit être facile à retrouver et suffisamment claire pour faciliter le suivi quotidien.

**Branche :** `82-security-f-69-harden-the-platform-against-exploitation-of-sensitive-data` (PR #98) + `main` (affichage des auteurs)
**Commit :** `9fb531a` — « refactor: improve higly security » ; affichage : `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `app/operations/administration/[id]/page.tsx` (historique avec auteur), modèle `RequestStatusEvent` (`actorId`), `lib/services.ts` (`updateRequestStatus`), `app/council/security/page.tsx` (journal complet), `lib/security.ts`, `docs/F69_security.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Le poste de travail de l'administration affiche désormais **qui a fait quoi, quand** :

- **Historique nominatif d'une demande** — la fiche `/operations/administration/[id]` liste chaque étape (`Soumise`, `En cours d'examen`, `En traitement`, …) avec **la date et le nom de l'auteur** (« par Amina Okafor », « par Claire Fontaine ») et la note d'instruction associée. L'information vient de `RequestStatusEvent.actorId`, enregistré à chaque mise à jour (`updateRequestStatus`).
- **Trace complète pour l'administration** — chaque opération d'administration est également journalisée dans `SecurityEvent` (qui, quoi, quand), consultable dans `/council/security` : changements de rôle, modifications de contenu, publications, transitions de statut, assignations.
- **Facile à retrouver** — l'historique est sur la fiche même du dossier (colonne « Instruction »), sans requête ni outil externe ; le flux de sécurité liste les événements du plus récent au plus ancien, avec acteur et cible.
- **Vérifié en démonstration** — le dossier semé `REQ-2026-0001` affiche « par Amina Okafor » à la création ; après une mise à jour par l'agent, une ligne « par {nom de l'agent} » apparaît immédiatement.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Fiche demande** : `/operations/administration` → ouvrir une demande (ex. `REQ-2026-0001`) → bloc « Historique ».
- **Journal d'administration** : `/council/security` (événements avec acteur).
- **Comptes** : agent `administration@terranova.fr` / `password123` ; Conseil `conseil@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Voir « qui a créé quoi »** — connecté en agent (`administration@terranova.fr`), ouvrir `/operations/administration`, puis une demande : l'historique indique l'auteur de la création (« par Amina Okafor »).
2. **Faire une modification** — changer le statut (par ex. « En traitement ») et saisir une note, puis valider : la nouvelle entrée de l'historique indique **votre nom** (« par {votre nom} ») avec l'horodatage.
3. **Recouper avec le journal** — ouvrir `/council/security` en Conseil : l'événement de mise à jour apparaît avec l'acteur, la cible (`request`) et le contexte ; les changements de rôle et de contenu y figurent également.
4. **Vérifier la permanence** — recharger la page : l'historique et le journal conservent les informations (pas d'édition/suppression possible).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont l'historique complet des cinq types de dossiers).
