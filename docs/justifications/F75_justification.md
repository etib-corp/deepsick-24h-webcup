# F75 — Repérer les demandes similaires pour les agents

> **Besoin officiel (F75, Difficile, 1170 XP)** — Les agents reçoivent un grand nombre de demandes très similaires. Il faudrait les aider à repérer plus vite celles qui parlent du même problème. À mesure que le volume augmente, les utilisateurs doivent pouvoir retrouver rapidement les éléments qui nécessitent leur attention.

**Emplacements dans le code :** `lib/similarity.ts` (moteur de similarité), `app/operations/administration/page.tsx` (badges dans la file), `app/operations/administration/[id]/page.tsx` (carte « Demandes similaires détectées »), `tests/similarity.test.ts`, demandes semées `REQ-2026-0004/0005/0006`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **moteur de détection de doublons** intégré au bureau des démarches :

- **Comparaison sur les mots utiles** — sujets et descriptions sont normalisés (accents, pluriels, mots vides ignorés), puis comparés par **indice de similarité** (vocabulaire partagé), avec bonus lorsque deux demandes partagent la même catégorie. Le score est un pourcentage **explicable** : chaque correspondance liste les **mots communs**.
- **Repérage immédiat dans la file** — chaque demande ayant des voisines plausibles affiche un badge **« ≈ N »** (au survol : « doublons probables »), visible d'un coup d'œil à côté des badges existants (priorité, statut, soutiens).
- **Vue détaillée** — sur la fiche d'une demande, la carte **« Demandes similaires détectées »** liste les doublons probables, chacun avec sa référence, son statut et le détail `Similitude N % · mots communs : …`, reliés en un clic pour traiter le sujet une seule fois.
- **Démonstrable sur base fraîche** — le jeu de démonstration contient deux quasi-doublons (« Lampadaire en panne chemin HAB 12 », « Panne d'éclairage — chemin HAB 12 ») autour de la demande communautaire existante ; le seuil et le plafond sont paramétrables et testés (6 tests unitaires).

### URL ou emplacement pour tester la fonctionnalité

**`/operations/administration`** (`administration@terranova.fr` ou `conseil@terranova.fr` / `password123`), puis la fiche `REQ-2026-0004`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/operations/administration` : trois lignes portent le badge **≈** (les demandes d'éclairage du chemin HAB 12).
2. Ouvrir `REQ-2026-0004` (« Éclairage du chemin HAB 12 ») : la carte « Demandes similaires détectées » liste `REQ-2026-0005` (31 % · mots communs : chemin, hab, lampadaire, serre) et `REQ-2026-0006`.
3. Cliquer un doublon : on arrive sur sa fiche, qui cite en retour la demande d'origine.
4. Une demande sans voisine (ex. « Permis de conduire rover ») affiche « Aucune demande similaire détectée ».

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/similarity.test.ts` (6 OK) + suite complète (88 OK).
