# F87 — Vérifier que les données importantes peuvent être sauvegardées

> **Besoin officiel (F87, Difficile, 1260 XP)** — Les responsables souhaitent vérifier que les données importantes peuvent être sauvegardées correctement. Le résultat doit être suffisamment clair et exploitable pour permettre au demandeur d'en tirer une information utile, pas seulement d'afficher des données brutes.

**Emplacements dans le code :** `app/council/backups/page.tsx` (rapport), `lib/actions/backup.ts` (`runBackupVerificationAction`), `lib/backup.ts` (JSON canonique, empreintes, contrôle de restauration), `app/api/council/backup-report/route.ts` (téléchargement JSON), modèle `BackupCheck`, `tests/backup.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Une console **« Vérification des sauvegardes »** côté Haut Conseil :

- **Un exercice réel, pas une maquette** — le bouton « Vérifier les sauvegardes » exporte **huit jeux de données critiques** (comptes, demandes, signalements, commandes, rendez-vous, messages de contact, notifications, transactions) dans un **instantané JSON canonique** (clés triées, dates normalisées), puis **relit chaque sérialisation et la recompare** (contrôle de restauration) : une donnée qui ne survit pas à ce aller-retour est signalée « Échec ».
- **Résultat clair** — le rapport du dernier exercice affiche : verdict global (**Vérifiée / En échec**), date, **durée**, total de lignes et volume, puis un **tableau par jeu de données** : lignes, taille, **empreinte SHA-256**, verdict OK/Échec. Une phrase de lecture rend le résultat exploitable sans être expert.
- **Exploitable et archivé** — chaque exercice est **conservé** (historique des 10 derniers : date, lignes, volume, durée, verdict) et **téléchargeable en JSON** (`/api/council/backup-report`), p. ex. pour être joint à une revue d'exploitation. L'exécution est journalisée (`BACKUP_VERIFIED` dans `/council/security`).
- **Sûr par construction** — l'exercice est en **lecture seule** (aucune écriture dans les données métier) et plafonné (5 000 lignes par jeu) ; la logique pure (canonicalisation, empreintes, verdict) est couverte par 6 tests unitaires.

### URL ou emplacement pour tester la fonctionnalité

**`/council/backups`** (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/council/backups` : état vide au départ (« Lancez la première »).
2. Cliquer **« Vérifier les sauvegardes »** : le rapport « Dernier rapport » apparaît — badge **Vérifiée**, durée, total, et le tableau des 8 jeux de données avec empreintes et verdicts OK.
3. Cliquer **« Télécharger le rapport (JSON) »** : le rapport structuré s'ouvre (verdict, totaux, détail par jeu de données).
4. Relancer l'exercice : la ligne s'ajoute à l'**historique** ; en Conseil → `/council/security`, l'événement « Vérification de sauvegarde » est tracé.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/backup.test.ts` (6 OK) — exercice lancé en navigateur : « 40 lignes · 7 Ko · 7 ms · VÉRIFIÉE ».
