# F47 — Justifier clairement les actions réalisées sur la plateforme

> **Besoin officiel (F47, Difficile, 960 XP)** — La ville doit pouvoir justifier clairement les actions réalisées sur la plateforme. Certaines opérations doivent rester consultables et traçables dans le temps. Dans l'espace de travail des agents, cette information doit être facile à retrouver et suffisamment claire pour faciliter le suivi quotidien.

**Branche :** `82-security-f-69-harden-the-platform-against-exploitation-of-sensitive-data` (PR #98)
**Commit :** `9fb531a` — « refactor: improve higly security »

**Emplacements dans le code :** modèle `SecurityEvent` (`prisma/schema.prisma`), `lib/security.ts` (`recordSecurityEvent`, `getSecurityEvents`, `getSecurityStats`), `app/council/security/page.tsx` (console), `app/council/page.tsx` (compteurs), `lib/actions/*` (journalisation des opérations), `docs/F69_security.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Toutes les opérations sensibles sont **enregistrées, consultables et lisibles** dans le temps :

- **Journal append-only** — le modèle `SecurityEvent` conserve chaque opération sans modification ni suppression possible par l'application : type, résultat, **acteur** (id + rôle), **cible** (type + id), contexte lisible, IP/agent, horodatage indexé.
- **Couverture des actions** — échecs et blocages de connexion, accès refusés, changements de rôle, changements de contenu (services, annonces, diffusions, consultations), transitions de statut (demandes, signalements, commandes), assignations, procès-verbaux, entrées neutralisées et formulaires bloqués.
- **Espace de travail lisible** — la console `/council/security` (entrée « Sécurité » dans la navigation) affiche **cinq compteurs 24 h** (connexions bloquées, accès refusés, entrées neutralisées, formulaires bloqués, actions tracées) puis le **flux des événements récents** avec libellé traduit, contexte, acteur, IP et date. Les compteurs sont repris sur la vue d'ensemble `/council`.
- **Suivi quotidien** — les événements sont relus à chaque ouverture (pas de cache), la console indique explicitement « Journal en lecture seule : chaque entrée est conservée sans modification ni suppression ».

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Console** : `/council/security` (Conseil — `conseil@terranova.fr` / `password123`).
- **Compteurs et accès** : `/council` (vue d'ensemble).
- **Détail du modèle de menace et des événements** : `docs/F69_security.md`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Provoquer des événements** — faire échouer une connexion (mauvais mot de passe), tenter d'ouvrir `/council` en habitant, publier une annonce ou changer le statut d'une demande en agent/Conseil.
2. **Consulter la trace** — ouvrir `/council/security` : chaque action apparaît avec son **type traduit**, son **auteur**, sa **cible** et son **horodatage** ; les compteurs 24 h augmentent en conséquence.
3. **Vérifier la clarté** — identifier par exemple « Demande mise à jour · {référence} · {acteur} · {date} » ou « Accès refusé · {rôle requis} » ; le détail est compréhensible sans outil technique.
4. **Vérifier la persistance** — recharger la page, redémarrer l'application : les événements restent présents (journal en base, append-only) ; aucune action d'édition/suppression n'existe dans l'interface.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `tests/security.test.ts` (neutralisation, erreurs utilisateur) et `tests/f78.test.ts`.
