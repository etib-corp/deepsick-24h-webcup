# F88 — Exporter les données de suivi pour les autres services

> **Besoin officiel (F88, Moyenne, 840 XP)** — Nos équipes doivent transmettre régulièrement une partie des données de suivi à d'autres services. Nous avons besoin de sélectionner les informations utiles et de les récupérer dans un format simple à réutiliser.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `lib/csv.ts` (écriture CSV sûre), route `app/api/operations/requests/export/route.ts`, carte « Export des données de suivi » dans `app/operations/administration/page.tsx`, `lib/data.ts` (`getStaffRequests`), garde `requireApiRole(["ADMIN_AGENT","COUNCIL"])`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Export direct depuis la console** — deux boutons sur la file du Bureau des démarches : « Tout exporter (CSV) » et « Exporter à traiter (CSV) » (équivalent de l'onglet « à traiter » de l'agent).
- **Sélection des informations utiles** — colonnes choisis pour les autres services : référence, sujet, catégorie, priorité, statut, demandeur, courriel, agent assigné, dates (ISO 8601, réutilisables telles quelles).
- **Format simple et sûr** — CSV séparé par points-virgules, BOM UTF-8 (ouverture directe dans un tableur), échappement des guillemets/retours ligne et neutralisation des formules (`=`, `+`, `-`, `@` préfixés).
- **Cloisonné** — la route vérifie le rôle côté serveur (401/403), ne renvoie jamais de données aux citoyens, et n'est jamais mise en cache (`no-store`).

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Agent / Conseil** : `/operations/administration` (comptes `administration@terranova.fr` ou `conseil@terranova.fr` / `password123`) → boutons d'export.
- **Direct** : `/api/operations/requests/export?scope=actionable` (avec session staff).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Exporter** — se connecter en agent, cliquer « Tout exporter (CSV) » : le fichier `nova-terra-demandes-all-<date>.csv` se télécharge.
2. **Ouvrir le fichier** — les 4 demandes seedées apparaissent avec statuts et dates lisibles (tableur ou éditeur de texte).
3. **Filtrer** — « Exporter à traiter (CSV) » ne contient que les demandes encore ouvertes (SUBMITTED/IN_REVIEW/IN_PROGRESS).
4. **Vérifier le cloisonnement** — appeler l'URL sans session staff : réponse 401/403, aucune donnée.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
