# F56 — Télécharger un récapitulatif de mes démarches

> **Besoin officiel (F56, Moyenne, 680 XP)** — Je voudrais télécharger un récapitulatif de mes demandes. Le résultat doit être suffisamment clair et exploitable pour permettre au demandeur d'en tirer une information utile, pas seulement d'afficher des données brutes.

**Commit :** `60bdfcb` — « feat: add downloadable recap of citizen requests »

**Emplacements dans le code :** `app/api/citizen/recap/route.ts` (téléchargement), `lib/recap.ts` (`buildRecapHtml`), `lib/request-tracking.ts` (`getCitizenRequestTracking`, source des démarches — D11), boutons dans `app/citizen/page.tsx` et `app/citizen/requests/page.tsx`, textes `citizen.recap` dans `lib/i18n/dictionaries/{fr,en,es}.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **récapitulatif téléchargeable en un clic** depuis l'espace personnel :

- **Un bouton, un fichier** — « Télécharger le récapitulatif » est présent sur l'accueil citoyen (`/citizen`) **et** sur la liste des démarches (`/citizen/requests`). Le fichier est un **document HTML auto-portant** (`nova-terra-recap-AAAA-MM-JJ.html`, `Content-Disposition: attachment`) : il s'ouvre dans n'importe quel navigateur, **sans la plateforme**, et s'imprime en PDF (`@media print`).
- **Clair : une synthèse d'abord** — le document s'ouvre sur le demandeur, la date de génération et une section **« Synthèse »** : nombre total de démarches et **comptage par type** (demande administrative, signalement, commande, rendez-vous, message à la mairie). L'essentiel se lit en trois secondes.
- **Exploitable : le détail utile, pas des données brutes** — chaque démarche forme une **fiche lisible** : référence et intitulé, **type**, **statut en clair** (« Soumise », « En cours », « Résolue »…), priorité lorsqu'elle existe, dates de création et de mise à jour, puis les **« Étapes » enregistrées** (statut + date + note) quand l'historique existe — l'information utile pour un dossier administratif, pas un export technique.
- **Cohérent avec le suivi existant** — la source est le suivi citoyen (D11) : le récapitulatif regroupe exactement les mêmes démarches que « Mes démarches », avec leurs statuts du moment.
- **Sûr et cadré** — l'API est **scopée à la session** (elle ne peut contenir que les démarches du connecté), **réservée au rôle `CITIZEN`** (`requireApiRole`, sinon « Accès refusé »), en `Cache-Control: no-store`, et tout contenu dynamique est **échappé HTML**. Un compte sans démarches obtient un document valide avec un état vide explicite.
- **Multilingue** — le document suit la langue de l'interface (fr / en / es), y compris les libellés de statuts.

### URL ou emplacement pour tester la fonctionnalité

Site : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- Espace personnel : `/citizen` et `/citizen/requests` — bouton **« Télécharger le récapitulatif »**.
- Téléchargement direct (connecté) : `/api/citizen/recap`.

Compte de démonstration : `citoyen@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Se connecter avec `citoyen@terranova.fr` / `password123` puis ouvrir `/citizen` : le bouton **« Télécharger le récapitulatif »** est visible ; il existe aussi sur `/citizen/requests`.
2. Cliquer : un fichier **`nova-terra-recap-<date>.html`** est téléchargé. L'ouvrir : le document affiche le demandeur, la date de génération et la **« Synthèse »** (ex. sur les données de démo : *22 démarche(s) — 5 demandes administratives, 9 signalements, 4 commandes, 2 rendez-vous, 2 messages*).
3. Parcourir les fiches : chacune montre référence, type, **statut en clair**, priorités, dates, et les **étapes** du suivi (ex. `REQ-2026-0006 — Panne d'éclairage — chemin HAB 12` avec l'étape « Soumise ») ; les statuts correspondent à ceux affichés dans `/citizen/requests`.
4. Imprimer le document (`Ctrl/Cmd + P`) : la mise en page est prévue pour un export PDF propre.
5. Sans session, appeler `/api/citizen/recap` : réponse **« Accès refusé »** (rôle citoyen requis, données jamais accessibles à un autre compte).
6. Changer la langue de l'interface (EN/ES) puis retélécharger : le document suit la langue choisie.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (88 OK, dont le suivi citoyen qui alimente le récapitulatif). Téléchargement vérifié en navigateur : `200`, document auto-portant (22 fiches, 14 historiques, synthèse et comptages), accès anonyme refusé (`403`).
