# F79 — Trier et filtrer ses démarches par sujet

> **Besoin officiel (F79, Facile, 400 XP)** — Je consulte de plus en plus de demandes et de signalements sur la plateforme. J'aimerais pouvoir les trier ou les filtrer par sujet afin de retrouver plus rapidement ce qui m'intéresse.

**Branche :** `main` — audit du 4 octobre 2026
**Commit :** `a271697` — « feat: adapt code with maximum checkpoints »

**Emplacements dans le code :** `app/citizen/requests/page.tsx` (filtres + compteurs), `lib/request-tracking.ts` (`getCitizenRequestTracking`, types `TrackingKind`), `components/colony/RequestTrackingCard.tsx`, dictionnaires `t.citizen.tracking.*` (libellés des sujets, fr/en/es)

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

La liste de suivi **« Mes démarches »** est maintenant **filtrable par sujet**, en un clic :

- **Filtres par sujet** — une rangée de filtres couvre les cinq types de dossiers : **Demande administrative, Signalement, Commande, Rendez-vous, Message à la mairie**, plus « **Toutes** ». Chaque filtre affiche un **compteur** du nombre d'éléments de ce type.
- **Résultat immédiat et clair** — le filtre actif est mis en évidence (`aria-current` + style), l'URL reflète le choix (`/citizen/requests?type=report`) — partageable et rechargeable — et le compteur d'en-tête ainsi que la liste se limitent au sujet choisi.
- **Tri utile** — la liste est triée du plus récent au plus ancien par défaut, ce qui, combiné aux filtres, permet de retrouver vite « ce qui m'intéresse ».
- **Localisé et accessible** — libellés fr/en/es, filtre annoncé (`nav` étiquetée), compteurs lisibles, aucune action masquée : les cartes gardent le détail, le statut et les références.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Page** : `/citizen/requests` (habitant `citoyen@terranova.fr` / `password123`).
- **Exemples** : `/citizen/requests?type=report` (signalements), `?type=order` (commandes), `?type=appointment`, `?type=contact`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Ouvrir la liste** — connecté en habitant, aller sur `/citizen/requests` : la rangée de filtres affiche « Toutes · N », « Signalement · n », « Commande · n », etc.
2. **Filtrer** — cliquer « Signalement » : l'URL passe à `?type=report`, le compteur d'en-tête et la liste ne montrent que les signalements ; le filtre actif est visuellement marqué.
3. **Alterner** — cliquer un autre sujet puis « Toutes » : la liste complète revient ; les compteurs restent cohérents avec le nombre de cartes affichées.
4. **Recharger/partager** — copier l'URL filtrée dans un nouvel onglet : le même sous-ensemble s'affiche (état porté par l'URL).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont le suivi complet des cinq types de dossiers).
