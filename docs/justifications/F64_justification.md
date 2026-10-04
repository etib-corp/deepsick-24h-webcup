# F64 — Voir clairement l'état d'un service avant de commencer

> **Besoin officiel (F64, Facile, 360 XP)** — Je suis arrivé sur un service sans savoir s'il fonctionnait encore. J'aimerais voir clairement son état actuel avant de commencer une démarche, surtout lorsqu'une interruption est déjà connue par la ville.

**Branche :** `76-feature-f-63-allow-administrators-to-disable-a-faulty-service` (PR #111)
**Commit :** `42f8ce1` — « feat: let administrators disable and re-enable a service »

**Emplacements dans le code :** `app/(public)/services/[slug]/page.tsx` (badge « Indisponible » + alerte + actions retirées), `components/public/ServiceList.tsx` (badge dans la liste), `components/public/ServicesView.tsx` (badge sur la carte), `lib/services.ts` (refus serveur de réservation), `app/council/services/page.tsx` (état géré par le Conseil), dictionnaires `t.publicPages.services.*`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'état **actuel** d'un service est visible **avant** toute démarche, et pas seulement en cas d'erreur :

- **État affiché en évidence** — un service interrompu porte un **badge rouge « Indisponible »** : visible dès la liste `/services`, sur la carte des services et en tête de sa fiche, avant même de lire la description.
- **Explication immédiate** — la fiche ouvre sur l'alerte « **Service temporairement indisponible** » : « Une intervention est en cours sur ce service. Vous ne pouvez pas démarrer de nouvelle démarche pour le moment. Réessayez plus tard ou contactez l'administration. »
- **Aucune ambiguïté sur les actions** — les boutons « Créer une demande liée » et « Prendre rendez-vous » **disparaissent** ; à la place, « Contacter l'administration ». Le serveur refuse par ailleurs toute réservation ou soumission visant un service désactivé, même via un ancien lien.
- **Interruption déjà connue de la ville** — c'est exactement le scénario prévu : le Conseil désactive le service (`/council/services`) dès qu'il connaît l'interruption, et l'information est publique **immédiatement** ; la réactivation restaure les actions normales.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Côté habitant** : `/services` → fiche d'un service désactivé (ex. `/services/maintenance`).
- **Côté ville** : `/council/services` (désactiver/réactiver) — `conseil@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Désactiver un service** — connecté en Conseil, ouvrir `/council/services` et désactiver « Infrastructure » (ou tout autre service).
2. **Voir l'état avant de commencer** — en visiteur, ouvrir `/services` : le badge **« Indisponible »** est déjà visible ; ouvrir la fiche : l'alerte d'interruption s'affiche en premier, les boutons de démarche ont disparu.
3. **Vérifier qu'on ne peut pas commencer** — tenter malgré tout une réservation (lien direct vers `/citizen/appointments/nouveau?service=…`) : la création est refusée par le serveur avec le message d'indisponibilité.
4. **Fin d'interruption** — réactiver le service en Conseil : le badge disparaît, les actions reviennent immédiatement.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont le refus de réservation sur service désactivé).
