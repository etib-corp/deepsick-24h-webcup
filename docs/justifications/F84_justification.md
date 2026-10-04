# F84 — Répondre directement aux demandes depuis l'interface agent

> **Besoin officiel (F84, Moyenne, 820 XP)** — Les agents doivent pouvoir répondre directement à certaines demandes depuis leur interface. Dans l'espace de travail des agents, cette information doit être facile à retrouver et suffisamment claire pour faciliter le suivi quotidien.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** modèle `RequestReply` (`prisma/schema.prisma`), `lib/services.ts` (`addRequestReply`), `lib/actions/agent.ts` (`replyToRequestAction`), carte « Répondre au colon » dans `app/operations/administration/[id]/page.tsx`, affichage citoyen dans `lib/request-tracking.ts` + `components/colony/RequestTrackingCard.tsx`, badge de file `app/operations/administration/page.tsx`, événement `REQUEST_REPLY_ADDED` (`lib/security.ts` + journal Conseil), seed (2 réponses)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Réponse directe depuis le dossier** — la fiche demande du Bureau des démarches contient un formulaire « Répondre au colon » ; la réponse est horodatée, signée du nom de l'agent et listée sous le formulaire.
- **Facile à retrouver côté agent** — la file `/operations/administration` affiche un badge ✉ avec le nombre de réponses par demande, donc les dossiers traités se repèrent au premier regard.
- **Visible côté habitant** — la réponse apparaît dans le détail de la demande (`Réponses du service`) et une notification « Réponse à votre demande REQ-… » est créée avec lien direct.
- **Traçable** — chaque réponse écrit un événement d'audit `REQUEST_REPLY_ADDED` consultable dans `/council/security` (qui a répondu, quand, à quelle demande).
- **Cadre serveur** — action réservée aux rôles `ADMIN_AGENT`/`COUNCIL`, texte validé (3–4 000 caractères, neutralisé), échecs silencieux et sûrs.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Agent** : `/operations/administration` puis la demande « Permis de conduire rover » (compte `administration@terranova.fr` / `password123`).
- **Citoyen** : `/citizen/requests/request/<id>` (compte `citoyen@terranova.fr`) — la demande REQ-2026-0002 a déjà deux réponses seedées.
- **Journal** : `/council/security` (compte `conseil@terranova.fr`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Répondre** — en agent, ouvrir REQ-2026-0002, écrire une réponse et l'envoyer : elle s'ajoute à l'historique de réponses et le badge ✉ apparaît dans la file.
2. **Vérifier côté citoyen** — se connecter en citoyen, ouvrir le détail de la demande : « Réponses du service » affiche les réponses ; la cloche contient la notification.
3. **Vérifier l'audit** — `/council/security` montre l'événement « Réponse ajoutée ».

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
