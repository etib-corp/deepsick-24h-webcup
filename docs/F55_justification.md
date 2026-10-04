# F55 — Récupérer ses données personnelles

> **Besoin officiel (F55, Difficile, 1020 XP)** — « Bonjour, j’aimerais récupérer les informations personnelles que la ville possède sur moi. » Le citoyen doit pouvoir obtenir une copie **structurée et réutilisable** de ses données, sans dépendre du support.

**Branche :** `68-privacy-f-55-let-citizens-export-their-personal-data`

**Emplacements dans le code :** `lib/data-export.ts`, `app/api/citizen/data-export/route.ts`, `components/forms/DataExportCard.tsx`, `app/citizen/account/page.tsx`, `lib/i18n/dictionaries/{fr,en,es}.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Nous avons ajouté un **export en libre-service** des données personnelles, directement depuis l’espace citoyen, dans un **format réutilisable (JSON) et non une simple copie d’écran** :

- **Carte « Exporter mes données »** (`components/forms/DataExportCard.tsx`) sur la page `Mon compte` (`/citizen/account`), avec la **liste du contenu** et le **nombre d’éléments** par catégorie, un bouton de téléchargement et un état d’erreur avec **nouvelle tentative**.
- **Assemblage côté serveur** (`lib/data-export.ts`) de **toutes les données rattachées au citoyen** : profil (nom, e-mail, rôle, secteur, solde, date d’inscription), demandes (avec leur historique de statut), signalements (avec leurs événements), commandes, rendez-vous, avis sur les consultations, messages à l’administration, mouvements du portefeuille, notifications et messagerie.
- **Format réutilisable et lisible par un tiers** : date de génération (`generatedAt`), **manifeste** listant les sections et le total d’enregistrements, puis les données. Les **dates sont en ISO 8601**, les **statuts/types/priorités sont traduits** (libellés localisés fr/en/es) et seules les **références publiques** sont exportées — **jamais d’identifiants internes** de base de données.
- **Accès strictement personnel et vérifié côté serveur** : la route `GET /api/citizen/data-export` exige le rôle `CITIZEN` et **s’appuie uniquement sur la session** (aucun paramètre d’identifiant), il est donc impossible de demander les données d’un autre citoyen. Réponse en pièce jointe `nova-terra-donnees-AAAA-MM-JJ.json`, en `no-store`.
- **Échec jamais silencieux** : en cas d’erreur, une **notification de suivi** est enregistrée pour le citoyen (titre + corps localisés, lien vers `Mon compte`) et l’API renvoie un message générique (`errors.exportFailed`).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Site : `https://deepsick.lareunion.webcup.hodi.cloud/`

- Espace citoyen — export : `https://deepsick.lareunion.webcup.hodi.cloud/citizen/account` (rubrique **« Exporter mes données »**)
- Point d’entrée API (session requise) : `https://deepsick.lareunion.webcup.hodi.cloud/api/citizen/data-export`

Compte de démonstration : `citoyen@terranova.fr` / `password123`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec `citoyen@terranova.fr` / `password123`, puis ouvrir `/citizen/account`.
2. Dans la carte **« Exporter mes données »**, vérifier que les **catégories et leurs compteurs** s’affichent (demandes, signalements, commandes, rendez-vous, avis, messages, portefeuille, notifications, messagerie).
3. Cliquer sur **« Télécharger mes données »** : le navigateur télécharge `nova-terra-donnees-AAAA-MM-JJ.json`.
4. Ouvrir le fichier et vérifier qu’il contient `generatedAt`, `profile`, `manifest` (sections + `totalRecords`) et `data` ; que les **dates sont en ISO**, les **statuts traduits** et qu’**aucun identifiant interne** n’apparaît (seulement les références comme `NT-…`).
5. Contrôle de sécurité : ouvrir `/api/citizen/data-export` **sans être connecté** (ou connecté avec un compte non citoyen, ex. `securite@terranova.fr`) → l’accès est refusé ; avec le compte citoyen, ouvrir l’URL renvoie bien le JSON en pièce jointe.
6. Isolation : recommencer avec un **autre** compte citoyen et vérifier que le fichier ne contient que **ses** données.
