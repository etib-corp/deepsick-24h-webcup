# F98 — Services les plus utilisés par les habitants

> **Besoin officiel (F98, Difficile, 1350 XP)** — Nous souhaitons savoir quels services sont les plus utilisés par les habitants. Le résultat doit être suffisamment clair et exploitable pour permettre au demandeur d'en tirer une information utile, pas seulement d'afficher des données brutes.

**Emplacements dans le code :** `app/council/insights/page.tsx` (rapport), `lib/insights.ts` (agrégation pure), `lib/services.ts` (`recordServiceVisit`), `app/(public)/services/[slug]/page.tsx` (comptage), `app/api/council/insights/export/route.ts` (CSV), modèle `ServiceVisit`, `tests/insights.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **observatoire d'usage** des services, anonyme et exploitable :

- **Comptage anonyme** — chaque consultation d'une fiche service incrémente un **compteur par service et par jour** (`ServiceVisit`) : aucun identifiant d'habitant n'est stocké. Le comptage est best-effort : une erreur ne casse jamais la page.
- **Rapport clair** — `/council/insights` affiche, sur **7 ou 30 jours** : total des consultations, **moyenne par jour**, service le plus consulté, puis le **classement** avec barres, nombre, **part en %** et **variation vs période précédente** (ex. « Transport & logistique — 780 · 27 % »). Les services en baisse restent visibles (variation négative), les nouveaux entrants sont marqués.
- **Une phrase de lecture** — « Les trois premiers services concentrent X % des consultations » : l'information utile, pas le tableau brut. Une note rappelle l'anonymat des statistiques.
- **Exploitable** — export **CSV** des mêmes chiffres (service, consultations, part, période précédente, variation) pour être réutilisé hors de la console.
- **Démonstrable** — 30 jours de compteurs plausibles sont semés (classement stable) ; la logique d'agrégation (découpage des périodes, parts, variations, concentration) est couverte par 6 tests unitaires.

### URL ou emplacement pour tester la fonctionnalité

**`/council/insights`** (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/council/insights` : classement sur 30 jours (Transport & logistique en tête, parts, variations) et phrase de concentration (« 69 % » avec les données de démo).
2. Basculer sur **7 jours** : les chiffres et le classement se recalculent.
3. Visiter `/services/transport` (ou toute fiche), revenir sur `/council/insights?days=7` : le compteur du service a augmenté.
4. Cliquer **« Exporter (CSV) »** : fichier exploitable contenant le même rapport.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/insights.test.ts` (6 OK) — rapport vérifié en navigateur (concentration 69 %, 10 barres de classement).
