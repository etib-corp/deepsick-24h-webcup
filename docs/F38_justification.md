# F38 — Service momentanément interrompu : l'annoncer avant la démarche

> **Besoin officiel (F38, Moyenne, 600 XP)** — Un service municipal peut parfois être interrompu pour maintenance ou à cause d'un incident. Les habitants doivent pouvoir savoir qu'il est indisponible avant de commencer une démarche et comprendre quand revenir ou quoi faire à la place.

**Branche :** `76-feature-f-63-allow-administrators-to-disable-a-faulty-service` (PR #111)
**Commit :** `42f8ce1` — « feat: let administrators disable and re-enable a service »

**Emplacements dans le code :** `app/(public)/services/[slug]/page.tsx` (badge + alerte + actions), `components/public/ServiceList.tsx` et `components/public/ServicesView.tsx` (badge dans la liste et sur la carte), `lib/services.ts` (`createAppointment` refuse un service désactivé), `app/council/services/page.tsx` + `components/colony/ServiceForm.tsx` (activation/désactivation par le Conseil), `lib/i18n/dictionaries/*` (`unavailableBadge`, `unavailableTitle`, `unavailableBody`, `unavailableAction`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Le Conseil peut **désactiver un service défectueux en un clic**, et l'information est immédiatement visible côté habitant :

- **Savoir avant de commencer** — un service désactivé affiche un **badge « Indisponible »** dans la liste `/services`, sur la carte de la colonie et sur sa fiche ; la fiche ouvre sur une **alerte « Service temporairement indisponible »** visible avant toute action.
- **Comprendre quoi faire** — le message indique la conduite à tenir : « Une intervention est en cours sur ce service. Vous ne pouvez pas démarrer de nouvelle démarche pour le moment. Réessayez plus tard ou contactez l'administration. » et le bouton principal devient **« Contacter l'administration »**.
- **Aucune démarche ne peut être engagée par erreur** — les actions « Créer une demande liée » et « Prendre rendez-vous » **disparaissent**, et le serveur **refuse** de toute façon toute réservation sur un service désactivé (`createAppointment` vérifie `published`), même via un lien ancien ou forgé.
- **Réversible** — le Conseil réactive le service quand l'intervention est terminée ; les habitants retrouvent immédiatement les actions normales. Chaque (dés)activation est tracée (`CONTENT_CHANGED` dans `/council/security`).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Côté habitant** : `/services` (liste) et `/services/[slug]` (fiche) — ex. `/services/maintenance`.
- **Côté Conseil** : `/council/services` (bouton désactiver/réactiver) — `conseil@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Désactiver** — connecté en Conseil, ouvrir `/council/services` et désactiver un service (par ex. « Infrastructure »).
2. **Constater côté habitant** — ouvrir `/services` : le service porte le badge **« Indisponible »** ; ouvrir sa fiche `/services/maintenance` : l'alerte s'affiche, les boutons « Créer une demande liée » / « Prendre rendez-vous » ont disparu au profit de « Contacter l'administration ».
3. **Vérifier le refus serveur** — tenter de forcer une réservation sur ce service (par ex. depuis `/citizen/appointments/nouveau?service=<id>` ou en soumettant le formulaire) : la création est refusée avec le message « Ce service est temporairement indisponible… ».
4. **Réactiver** — réactiver le service en Conseil : la fiche retrouve ses actions normales.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont le refus de réservation sur service désactivé).
