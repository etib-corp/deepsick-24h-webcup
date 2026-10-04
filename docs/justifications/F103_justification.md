# F103 — Rapport synthétique de l'activité de la plateforme

> **Besoin officiel (F103, Difficile, 1410 XP)** — « Les responsables souhaitent récupérer un rapport synthétique de l'activité de la plateforme. Le résultat doit être suffisamment clair et exploitable pour permettre au demandeur d'en tirer une information utile, pas seulement d'afficher des données brutes. » Issu du **Service Qualité**.

**Branche :** `85-feature-f-103-synthetic-activity-report`

**Emplacements dans le code :** `lib/activity-report.ts`, `lib/activity-report-data.ts`, `app/operations/report/page.tsx`, `app/api/operations/report/export/route.ts`, `lib/i18n/dictionaries/{fr,en,es}.ts`, `app/council/layout.tsx`, `app/operations/layout.tsx`, `tests/activity-report.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Nous avons construit un **rapport synthétique de l'activité de la plateforme**, pensé pour être lu et exploité par un responsable, pas pour afficher des données brutes :

- **Données agrégées par domaine** (`lib/activity-report-data.ts`) : demandes, signalements, services, annonces, comptes, rendez-vous, commandes, messages et avis, comptés sur la **période courante** et la **période précédente** — aucune ligne brute, aucune information nominative. La sécurité est couverte par les **connexions bloquées**, **accès refusés** et **alertes critiques** (F85).
- **Lecture utile, pas un dump** : une **synthèse** (activité totale, moyenne par jour, évolution d'ensemble), des **tendances par domaine** comparées à la période précédente (variation en % ou « Nouveau ») avec une barre de proportion, et une section **« Points d'attention »** listant ce qui mérite une action (demandes à traiter, signalements ouverts, services désactivés, annonces sans date, rendez-vous sur service désactivé, alertes critiques…), chacune renvoyant vers la console concernée.
- **Période explicite** : le rapport affiche toujours la **période couverte** (`from → to`) et propose **7 / 30 / 90 jours**.
- **Accès limité aux profils autorisés** : **Haut Conseil** (`COUNCIL`) et **Administration** (`ADMIN_AGENT`), vérifié **côté page et côté API** ; le rapport est accessible depuis les deux consoles.
- **Export réutilisable** : un bouton **Exporter (CSV)** télécharge les mêmes chiffres agrégés (BOM UTF‑8, protection contre l'injection de formules), pour réutilisation dans un tableur.
- **Mise en page claire** : tuiles, listes à badges et barres de proportion — lisible par un public non technique.
- **Fiabilité** : l'agrégation est **pure et déterministe** (`lib/activity-report.ts`), couverte par des tests unitaires, si bien que l'écran et l'export donnent exactement les mêmes valeurs.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Site : `https://deepsick.lareunion.webcup.hodi.cloud/`

- Rapport d'activité : `https://deepsick.lareunion.webcup.hodi.cloud/operations/report`
- Export CSV (mêmes données) : `https://deepsick.lareunion.webcup.hodi.cloud/api/operations/report/export?days=30`

Comptes de démonstration (`password123`) : `conseil@terranova.fr` (Haut Conseil), `administration@terranova.fr` (Administration).

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec `conseil@terranova.fr` ou `administration@terranova.fr` (mot de passe `password123`).
2. Ouvrir `/operations/report` : vérifier la **période affichée**, les **tuiles de synthèse** (activité totale, moyenne/jour, évolution) et la liste des **tendances par domaine** comparées à la période précédente.
3. Basculer entre **7 / 30 / 90 jours** : les chiffres et la période se mettent à jour.
4. Parcourir la section **« Points d'attention »** : chaque ligne mène à la console concernée (administration, sécurité, services…).
5. Cliquer sur **Exporter (CSV)** : le fichier `nova-terra-rapport-activite-<jours>j-<date>.csv` se télécharge et reprend les **mêmes** chiffres agrégés (indicateur, période actuelle, période précédente, variation), plus les points d'attention.
6. Vérifier l'**accès restreint** : un compte non autorisé (par ex. `citoyen@terranova.fr`) ne peut pas atteindre `/operations/report` ni l'export.
7. (Optionnel) `npx tsx --test tests/activity-report.test.ts` : l'agrégation pure (période, variation, total, période vide) est vérifiée.
