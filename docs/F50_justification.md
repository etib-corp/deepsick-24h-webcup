# F50 — Tableau de bord simplifié pour suivre l'activité

> **Besoin officiel (F50, Difficile, 990 XP)** — Un tableau de bord simplifié serait utile pour suivre l'activité de la plateforme. Dans l'espace de travail des agents, cette information doit être facile à retrouver et suffisamment claire pour faciliter le suivi quotidien.

**Branche :** `main` — tableau de bord consolidé au fil des itérations (vue d'ensemble + consoles)
**Commit :** vue d'ensemble `/council` et tuiles de consoles (voir emplacements)

**Emplacements dans le code :** `app/council/page.tsx` (6 tuiles + répartition + sécurité + activité récente), `app/operations/administration/page.tsx` (À traiter / En examen / Traitées), `app/operations/security|medical|maintenance|transport|commerce/page.tsx` (tuiles de charge et files), `components/colony/StatTile.tsx`, `components/colony/FeedRow.tsx`, `lib/data.ts` (`getCouncilStats`), `lib/security.ts` (`getSecurityStats`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'espace de travail propose un **tableau de bord d'activité simple à lire**, à deux niveaux :

- **Vue d'ensemble du Conseil** (`/council`) — six indicateurs cliquables d'un coup d'œil : signalements **ouverts**, **en cours**, **services**, **annonces**, **comptes**, **commandes** ; la **répartition des signalements par service** ; les **compteurs de sécurité 24 h** (connexions bloquées, accès refusés, entrées neutralisées, formulaires bloqués, actions tracées) avec lien vers le journal ; et les **derniers signalements** avec leur statut.
- **Consoles des services** — chaque service dispose de ses propres indicateurs de charge et de sa file de travail : par ex. `/operations/administration` affiche **À traiter / En examen / Traitées** au-dessus de la file d'instruction ; sécurité, médical, maintenance, transport et commerce ont leurs tuiles et files dédiées.
- **Lisible et vivant** — chiffres en gros caractères monospace, tonalités cohérentes (danger/info/succès), animation d'entrée discrète et respect de `prefers-reduced-motion` ; les compteurs se rafraîchissent (polling 5 s des consoles) sans rechargement brutal.
- **Mêmes chiffres partout** — les indicateurs proviennent des mêmes fonctions de lecture que les listes (`getCouncilStats`, `getSecurityStats`), donc cohérents avec le détail.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Vue d'ensemble** : `/council` (Conseil — `conseil@terranova.fr` / `password123`).
- **File d'administration** : `/operations/administration` (agent `administration@terranova.fr` / `password123`).
- **Consoles** : `/operations/security`, `/operations/medical`, `/operations/maintenance`, `/operations/transport`, `/operations/commerce`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Vue d'ensemble** — se connecter en Conseil et ouvrir `/council` : les six tuiles affichent des compteurs exacts ; les liens « Gérer les comptes » / console de sécurité / journal fonctionnent.
2. **Cohérence** — comparer un compteur avec la liste correspondante (par ex. signalements ouverts sur `/council` puis la liste des signalements) : les chiffres concordent.
3. **File de travail** — ouvrir `/operations/administration` : « À traiter / En examen / Traitées » résument la file affichée juste en dessous ; mettre à jour un dossier et constater l'évolution des compteurs.
4. **Sécurité** — ouvrir `/council/security` depuis la vue d'ensemble : les cinq compteurs 24 h et le flux d'événements confirment l'activité.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`.
