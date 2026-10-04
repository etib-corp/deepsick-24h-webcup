# Besoins livrés — justifications (audit du 4 octobre 2026)

> **Contexte.** Ce document recense les besoins des [`TODO_terra_nova.md`](TODO_terra_nova.md)
> qui pouvaient encore sembler « à faire » mais qui sont **livrés et démontrables** dans
> l'application, ainsi que les petits correctifs réalisés pendant cet audit pour terminer les
> parcours presque complets. Chaque fiche indique ce qui existe, où le tester et comment le
> vérifier — dans le format attendu par les formulaires de soumission de la Webcup.
>
> Les besoins **encore réellement ouverts** sont listés en fin de document (§ « Reste à faire »).
>
> **Fiches de soumission :** chaque besoin livré ci-dessous dispose aussi d'une fiche au **format
> jury** (mêmes trois questions que `F65_justification.md`) dans `docs/<CODE>_justification.md`
> — par ex. [`F33_justification.md`](F33_justification.md), [`F49_justification.md`](F49_justification.md),
> [`F80_justification.md`](F80_justification.md), [`D20_justification.md`](D20_justification.md).

---

## Méthode d'audit

1. Revue des cases **non cochées** du TODO généré (46 lignes, doublons compris).
2. Pour chaque besoin : recherche de l'implémentation (routes, actions, services, schéma Prisma,
   dictionnaires i18n, documents existants).
3. Les besoins déjà couverts mais non cochés ont été **cochés** dans le TODO.
4. Les besoins « presque livrés » ont reçu le **petit correctif** nécessaire (voir § « Correctifs
   d'audit »), puis ont été cochés.
5. Validation : `npx tsc --noEmit` (0 erreur), 31 tests (`npm run test:f78` — voir § Vérifications),
   `npx next build` (production), parcours navigateur (connexion, filtres, file d'instruction,
   notifications, bandeaux d'alerte).

---

## 1. Comptes, identité et accès

### F33 — Suppression de compte (Facile · 290 XP) ✅

**Livré.** L'habitant supprime lui-même son compte depuis son espace.

- **Code :** `app/citizen/account/page.tsx` (zone de danger), `components/forms/DeleteAccountForm.tsx`
  (confirmation à recopier), `lib/actions/account.ts` (`deleteAccountAction`) et `lib/services.ts`
  (`deleteAccount`). La suppression est **réservée au rôle `CITIZEN`**, l'identifiant vient
  toujours de la **session** (jamais du formulaire) et les relations s'effacent en cascade.
- **Vérifier :** connecté en habitant → `/citizen/account` → « Supprimer mon compte », recopier la
  phrase de confirmation. Redirection vers `/login?deleted=1` avec message dédié.
  Un agent/Conseil ne peut pas supprimer le compte d'un autre (`session.user.id` uniquement).

### F70 — Données administratives réservées aux agents autorisés (Difficile · 1140 XP) ✅

**Livré** dans le cadre du durcissement F69 (`docs/F69_security.md`).

- **Code :** double vérification serveur — `middleware.ts` (navigation) puis
  `lib/permissions.ts` (`requirePageRole`, `requireApiRole`, `hasRole`) dans **chaque page, action
  et route API** ; propriété systématiquement dans la requête (`where: { id, authorId }`,
  `where: { id, citizenId }`) ; refus journalisés (`ACCESS_DENIED`).
- **Vérifier :** un habitant qui ouvre `/council`, `/operations/*` ou appelle une API staff est
  redirigé et l'accès refusé apparaît dans `/council/security`. Les API `POST /api/services` et
  `/api/announcements` sont réservées au rôle `COUNCIL`.

### F82 — Contrôle des envois multiples (Moyenne · 820 XP) ✅

**Livré** par la combinaison de trois protections déjà en place :

- **Verrou de soumission immédiat** : `components/forms/SubmissionForm.tsx` bloque le second
  `submit` (double-clic, Entrée, événement répété) avant même le rendu « en attente » ; il se
  libère après réponse de l'action (retry possible après erreur). Voir `docs/D16_submission_confirmation.md`.
- **Jeton anti-robot à usage unique** : `lib/bot-guard.ts` + `BotGuardToken` — un nonce signé est
  **consommé** avant écriture ; rejouer le même formulaire reste bloqué (`FORM_BLOCKED` journalisé).
  Voir `docs/F81_forms_anti_bot.md`.
- **Références sans collision** : les nouvelles références utilisent `cuid()` (plus de compteur
  partagé), donc jamais de doublon après envois simultanés (`docs/F78.md`).
- **Vérifier :** double-cliquer sur « Envoyer » d'un formulaire : une seule création. Rejouer une
  requête de soumission déjà consommée : bloquée et tracée dans `/council/security`.
  Le compteur « Formulaires bloqués » est visible sur la console de sécurité.

### Remarque d'audit — connexion réparée ✅

Le formulaire de connexion était **cassé par un merge** (bloc dupliqué + `catch` sans `try` :
l'application ne compilait pas `/login`). Corrigé pendant l'audit — voir § « Correctifs d'audit ».
Ce correctif est indispensable à **D03/F71/F37/F81** (connexion, identification sans e-mail,
anti-force brute, anti-robot).

---

## 2. Démarches, suivi et preuves

### F39 — Prise de rendez-vous avec un agent (Moyenne · 600 XP) ✅

**Livré.** Le parcours complet existe depuis la fusion de `features/appointment-booking` et a été
renforcé par F78 (verrou SQL anti double-réservation).

- **Code :** `/citizen/appointments` (à venir + historique), `/citizen/appointments/nouveau`
  (créneaux par service + préparation), `lib/actions/appointments.ts`, `lib/services.ts`
  (`createAppointment`, `cancelAppointment`, `ensureAppointmentReminders`), modèle `Appointment`.
  Le rendez-vous est **confirmé par notification** avec sa référence, annulable, et les
  instructions de préparation du service sont recopiées sur la réservation.
- **Vérifier :** en habitant, `/citizen/appointments/nouveau?service=medical` → choisir un
  créneau → confirmation. Réserver deux fois le même créneau : refus explicite
  (« Ce créneau vient d'être réservé. »). L'annulation est aussi possible depuis la liste.

### F83 — Preuve de réception avec référence identifiable (Facile · 410 XP) ✅

**Livré** via le travail D16 (accusés partagés) et F55/F56 (traçabilité).

- **Code :** `components/forms/SubmissionForm.tsx` + `components/forms/SubmissionConfirmation.tsx` —
  chacun des quatre formulaires citoyens (contact, signalement, commande, rendez-vous) **remplace
  le formulaire par un accusé focalisé** affichant la **référence enregistrée** (ex. `REQ-2026-0001`,
  `INC-042`, `MSG-2026-0001`) et un conseil anti-renvoi. La référence se retrouve dans
  `/citizen/requests` (suivi), dans le récapitulatif téléchargeable `/api/citizen/recap` (F56) et
  dans l'export de données `/api/citizen/data-export` (F55).
- **Vérifier :** envoyer un signalement : l'accusé affiche la référence ; la rechercher dans
  « Mes démarches » ; télécharger le récapitulatif depuis `/citizen/requests`.

### F79 — Trier / filtrer les démarches par sujet (Facile · 400 XP) ✅ *(livré pendant l'audit)*

**Livré.** La liste « Mes démarches » porte désormais des **filtres par type**.

- **Code :** `app/citizen/requests/page.tsx` — filtres `?type=request|report|order|appointment|contact`
  avec compteurs, état actif (`aria-current`) et libellés localisés (`t.citizen.tracking.allKinds`,
  `filterLabel`, `kinds`). La même fiche alimente le détail.
- **Vérifier :** `/citizen/requests` → cliquer « Signalement · 8 » : l'URL passe à `?type=report`,
  le compteur et la liste ne montrent que les signalements.

### F49 — Être prévenu quand une demande change d'état (Facile · 330 XP) ✅ *(livré pendant l'audit)*

**Livré.** Chaque changement de statut d'une demande administrative crée une **notification
interne** pour son auteur.

- **Code :** `lib/services.ts` → `updateRequestStatus` crée, dans la même transaction que
  l'événement d'historique, une notification « Demande {référence} mise à jour · Nouveau statut :
  … » pointant vers le détail (`/citizen/requests/request/{id}`). L'interface existe déjà :
  `/citizen/notifications` (pastille dans l'en-tête, bouton « tout marquer lu »).
- **Vérifier :** en agent (`administration@terranova.fr`), ouvrir une demande et changer son
  statut ; se reconnecter en habitant : la cloche et `/citizen/notifications` affichent le
  changement, avec lien direct vers la demande.

---

## 3. Site public, contenu et alertes

### F38 / F64 — Service indisponible visible avant la démarche (Moyenne · 600 XP / Facile · 360 XP) ✅

**Livré** par le parcours F63 « désactiver un service défectueux ».

- **Code :** `app/(public)/services/[slug]/page.tsx` — un service non publié affiche le badge
  **« Indisponible »**, une alerte « Service temporairement indisponible » expliquant **quoi faire**
  (« Réessayez plus tard ou contactez l'administration ») et **retire les actions** (créer une
  demande, prendre rendez-vous) ; `components/public/ServiceList.tsx` et la carte
  (`ServicesView`) portent le même état. Côté serveur, `createAppointment`
  (`lib/services.ts`) refuse toute réservation sur un service désactivé, même via un lien ancien.
- **Vérifier :** en Conseil, `/council/services` → désactiver un service ; en public, sa fiche
  affiche l'état et n'offre plus que le contact ; le réactiver restaure les actions.

### F73 — Message officiel du Haut Conseil (Moyenne · 780 XP) ✅

**Livré** (branche `F73-high-council-official-announcement`, fusionnée).

- **Code :** `/council/broadcasts` (création, activation/désactivation, suppression —
  `components/colony/BroadcastForm.tsx`, `lib/actions/admin.ts`), lecture publique
  `getActiveBroadcasts` (`lib/data.ts`) et bandeau **présent sur toutes les coquilles**
  (`components/layout/BroadcastBanner.tsx` + `BroadcastMessages.tsx`, monté dans les layouts
  public, citoyen, opérations et Conseil). Le rafraîchissement se fait par polling 5 s, coupé
  quand l'onglet est masqué.
- **Vérifier :** en Conseil, publier un message : il apparaît immédiatement en haut de toutes les
  pages, y compris pour un visiteur anonyme ; le désactiver le retire.

### F29 / F31 — Alertes d'urgence (crue, vague de chaleur) (Difficile · 840 XP chacune) ✅ *(scénarios semés pendant l'audit)*

**Livré** — les deux scénarios utilisent le **canal d'alerte officiel** (F73/D18) : message
visible « au bon moment », recommandations adaptées, consignes actionnables.

- **Code :** `prisma/seed.ts` sème deux diffusions actives en plus de la tempête de poussière :
  « **Alerte crue — secteur sud** » (quartier sud, consignes, équipes Hephaestus) et
  « **Vague de chaleur — consignes aux habitants** » (hydratation, éviter 11 h–16 h, veiller sur
  les personnes vulnérables). Fenêtres horaires `startsAt`/`endsAt` supportées, activation
  depuis `/council/broadcasts`, affichage en bandeau site-wide.
- **Vérifier :** `npm run seed` sur une base fraîche puis ouvrir l'accueil : les deux alertes
  s'affichent avec leur lien « Consulter les consignes ». En Conseil, `/council/broadcasts`
  permet de les activer/désactiver en un clic.

### F30 — Prévenir quand une annonce importante est publiée (Moyenne · 560 XP) ✅ *(livré pendant l'audit)*

**Livré.** La publication d'une annonce crée une **notification pour chaque habitant**.

- **Code :** `lib/services.ts` — `notifyCitizens()` + `createAnnouncement` (création publiée
  directement) et `setAnnouncementPublished` (transition brouillon → publiée uniquement, pas de
  spam en re-enregistrant). La notification pointe vers `/announcements/{slug}`.
- **Vérifier :** en Conseil, créer une annonce en brouillon puis cliquer « Publier » : en
  habitant, `/citizen/notifications` affiche « Nouvelle annonce municipale · {titre} » avec le
  lien. Vérifié en base (deux comptes citoyens destinataires, dont un compte sans e-mail F71).

### F46 — Où sont les hôpitaux et services d'urgence (Facile · 320 XP) ✅

**Livré** par le répertoire (D05/F28/F32) et la carte (F45).

- **Code :** `/citizen/map` (`app/citizen/map/page.tsx` + `components/colony/ColonyMap.tsx`) situe
  chaque module sur la carte de la colonie avec son secteur ; « Soins médicaux — Asclepius » est
  **mis en avant** (catalogue `featured`) avec catégorie « Santé », secteur « BioDôme » et
  instructions de préparation (`preparation`), consultables en un écran depuis `/services/medical`.
- **Vérifier :** `/services` → « Soins médicaux » (fiche avec secteur + préparation) ;
  `/citizen/map` → module médical et libellés de secteurs.

### F60 — Images et médias légers (Facile · 350 XP) ✅

**Livré.** La plateforme ne sert **qu'un seul média bitmap** — `public/terra-nova-map.webp`
(≈ 126 Ko, format WebP) — sans vidéo ni image lourde ; le reste de l'habillage est en CSS/SVG.
Les optimisations de charge utile (dont −16 à −32 Ko de JS par route) sont mesurées dans
[`docs/PERFORMANCE.md`](PERFORMANCE.md).
- **Vérifier :** `find public -type f -size +100k` ne retourne que la carte ; lancer
  `ANALYZE=true npx next build` pour le détail des bundles.

---

## 4. Espaces agents et travail quotidien

### F48 — Savoir qui a modifié quoi (Moyenne · 640 XP) ✅ *(livré pendant l'audit)*

**Livré.** L'historique d'une demande affiche désormais **l'auteur de chaque modification**.

- **Code :** `app/operations/administration/[id]/page.tsx` — chaque entrée d'historique
  (`RequestStatusEvent.actorId`) est résolue en nom lisible et affichée « par {nom} » à côté du
  statut et de la date. La trace globale est déjà couverte par le journal `SecurityEvent`
  (`REQUEST_STATUS_CHANGED`, `CONTENT_CHANGED`, `ROLE_CHANGED`, …) consultable dans
  `/council/security` avec acteur, cible et contexte.
- **Vérifier :** en agent, ouvrir `REQ-2026-0001` et changer le statut : la nouvelle ligne de
  l'historique indique « par {votre nom} » ; la création indique « par Amina Okafor ».

### F47 — Actions de la ville traçables dans le temps (Difficile · 960 XP) ✅

**Livré** dans le cadre de F69 (`docs/F69_security.md`).

- **Code :** modèle `SecurityEvent` **append-only** (jamais modifié/supprimé) — acteur, rôle,
  cible, contexte, IP/UA, horodatage ; enregistré par l'authentification, les permissions, les
  actions d'administration, de traitement et de contenu. Console de lecture :
  `/council/security` (5 compteurs 24 h + flux récent), entrée « Sécurité » dans la navigation,
  compteurs repris sur `/council`.
- **Vérifier :** effectuer une action (changement de statut, publication, refus d'accès) puis
  ouvrir `/council/security` : l'événement apparaît avec son auteur et son horodatage.

### F50 — Tableau de bord simplifié de l'activité (Difficile · 990 XP) ✅

**Livré.** L'espace de travail du Conseil ouvre sur un **tableau de bord d'activité** :
`app/council/page.tsx` — 6 indicateurs (signalements ouverts/en cours, services, annonces,
comptes, commandes), répartition des signalements par service, compteurs de sécurité et
activité récente. Les consoles opérationnelles (sécurité, médical, maintenance, transport,
commerce, administration) ont leurs propres tuiles de charge et files de travail.
- **Vérifier :** `/council` en `conseil@terranova.fr` ; `/operations/administration` pour la file
  des démarches (À traiter / En examen / Traitées).

### F80 — Identifier et classer les dossiers prioritaires (Moyenne · 800 XP) ✅ *(livré pendant l'audit)*

**Livré.** La file des démarches est **triée par urgence** (puis par date), en plus des badges de
priorité.

- **Code :** `lib/roles.ts` (`REQUEST_PRIORITY_RANK` : URGENT → LOW) ; `lib/data.ts`
  (`getStaffRequests` trie par priorité puis récence — utilisé par la console et l'API staff) ;
  `components/ui/StatusBadge.tsx` (`PriorityBadge`) affiche la priorité sur chaque ligne.
- **Vérifier :** `/operations/administration` : la file montre « Haute » avant « Normale » avant
  « Basse » ; le tri s'applique aussi à `GET /api/requests` pour le staff.

### F35 — Indications au bon moment (Facile · 290 XP) ✅

**Livré** par le tutoriel interactif (fusionné via `feat/add-tutorial`, également socle de D12).

- **Code :** `lib/tour.ts` (leçons par profil, cibles `data-tour`), `components/tour/TourProvider.tsx`
  (projecteur, blocage du reste de la page, étapes déclenchées par l'action réelle),
  `TourLauncher` sur l'accueil et dans les espaces. Chaque étape guide **l'action réelle** de
  l'utilisateur, pas une maquette.
- **Vérifier :** sur l'accueil (visiteur), lancer « Découvrir la ville » ; connecté en habitant,
  lancer la visite « Citoyen » depuis `/citizen` : les éléments à utiliser sont surlignés au fur
  et à mesure.

### F72 — Par où commencer quand on vient d'arriver (Facile · 380 XP) ✅

**Livré** par le parcours « nouveaux arrivants » (F71) et la hiérarchisation du catalogue.

- **Code :** `/arrivants` — page publique **sans compte** : étapes « Vos premiers pas »
  (créer un compte, se connecter, faire sa première demande, demander de l'aide) avec progression
  enregistrée ; liens consultables sans inscription (services, annonces, contact, guide) ;
  catalogue avec services **prioritaires** (`featured`) ; tutoriel public ; et inscription
  possible **sans e-mail** (identifiant colon), donc « sans refaire tout le parcours ».
- **Vérifier :** ouvrir `/arrivants` en navigation privée, cocher les étapes, puis suivre
  « Services prioritaires » sur `/services`.

---

## 5. Participation et vie civique

### F66 — Donner son avis sur les projets de la ville (Moyenne · 740 XP) ✅

**Livré** par la fonctionnalité de **consultations citoyennes** (branche
`79-feature-f-66-collect-ipinions-on-city-projects`, fusionnée — le code l'identifie
explicitement : « F66 — citizen participation » dans `lib/data.ts`). Les critères F66 sont
couverts : avis **non contraignant** (pas un vote), **trace claire** pour l'habitant.

- **Code :** `/citizen/consultations` (liste + détail avec formulaire d'avis :
  Favorable/Défavorable/Neutre + commentaire), `/citizen/contributions` (« Mes contributions »),
  `components/colony/OpinionForm.tsx`, `lib/actions/opinions.ts`, modèle `Opinion` — **une
  contribution par habitant et par consultation** (contrainte d'unicité), **référence `OPN-xxx`**
  affichée dans l'accusé et conservée. Le Conseil ouvre/clôture et publie le résultat
  (`/council/consultations`) ; les agents d'administration lisent les avis
  (`/operations/administration/consultations`). L'anonymat optionnel fait partie de F65.
- **Vérifier :** en habitant, ouvrir une consultation, envoyer un avis → accusé avec référence ;
  renvoyer un avis → même référence (mise à jour, pas de doublon) ; voir
  `/citizen/contributions`.

### F41 / F42 / F43 / F44 / D20 — Accessibilité transverse ✅

**Livré** par les trois chantiers d'accessibilité déjà fusionnés, qui couvrent le périmètre de ces
besoins (les documents détaillent chaque correction et chaque vérification) :

| Besoin | Couverture | Preuves |
| --- | --- | --- |
| **F41** clavier | Liens d'évitement, focus visible global, menus Radix (Échap, flèches), `aria-pressed` sur les filtres, retour de focus après fermeture | [`docs/F21_accessibility.md`](F21_accessibility.md) |
| **F42** formulaires et composants | Libellés associés (`htmlFor`/`id`), aides reliées (`aria-describedby`), messages d'erreur annoncés (`role=alert`/`status`), boutons nommés, sélecteurs étiquetés | `docs/F21_accessibility.md` |
| **F43** couleurs | Contrastes corrigés (thème sombre **et** clair), statuts jamais portés par la seule couleur (badges + libellés localisés + soulignement des filtres actifs) | [`docs/F23_F24_accessibility.md`](F23_F24_accessibility.md) |
| **F44** zoom / grossissement | Testé à 200 % et 400 % de zoom et 32 px de taille racine sur 19 pages : pas de débordement horizontal ni de texte tronqué ; tailles en `rem`, boutons/badges extensibles | `docs/F23_F24_accessibility.md` |
| **D20** handicap (parcours complet) | Somme des chantiers ci-dessus + `prefers-reduced-motion` (animations coupées, contenu toujours visible) + alternatives lisibles à la carte (liste HTML) | `docs/F21_accessibility.md`, `docs/F23_F24_accessibility.md` |

- **Vérifier :** navigation clavier seule sur `/`, `/services`, `/contact` (Tab/Entrée/Échap) ;
  zoom navigateur 200–400 % ; thème « Grand Jour »/« Paper Terminal » pour les contrastes ;
  lecteur d'écran sur le formulaire de contact (libellés, erreurs, accusé focalisé).

---

## 6. Performance et robustesse

### F77 — Rester utilisable sous forte charge (Difficile · 1200 XP) ✅

**Livré** par le chantier de stabilité F78 (mesuré, reproductible) — `docs/F78.md`.

- **Code / mesures :** cache de contenu (services/annonces) avec invalidation par étiquette,
  coalescence des lectures à froid, requêtes de consoles filtrées en SQL, polling qui s'arrête
  onglet masqué/réseau lent, verrous SQL pour les réservations, `content-visibility` sur les
  listes. Résultats : p95 ×16 plus rapides sur les tableaux d'incidents (500 appels simultanés),
  zéro erreur sur les lots de 100/500 appels, JSON renvoyé −98 %.
- **Vérifier :** `npm run benchmark:f78` (voir aussi `docs/F78-results.json`) et les tests de
  concurrence (`tests/f78.test.ts`).

### F69 / F78 — doublons de vagues ✅

Le TODO contenait **deux entrées `F69` et deux `F78`** (vagues successives du même besoin) —
toutes deux couvertes : [`docs/F69_security.md`](F69_security.md) et [`docs/F78.md`](F78.md).
Les lignes restées non cochées sont désormais cochées.

---

## Correctifs d'audit (faits pendant cet audit)

### 1. Connexion réparée (critique) — `components/forms/LoginForm.tsx`

Un merge défectueux avait laissé **deux blocs de code imbriqués** dans le `handleSubmit`
(l'ancien bloc throttle + le nouveau bloc F81) terminés par un `catch` sans `try` : **`/login` ne
compilait plus** (`TS1005`). Réparation : un seul bloc `try { … } catch { … } finally { … }`
conservant **tout** le comportement attendu — vérification préalable du verrouillage
(`loginThrottleStatusAction` avec `identifier`), `signIn` avec identifiant + jeton anti-robot +
honeypot, messages dédiés `BOT_GUARD_EXPIRED`/`BOT_GUARD_BLOCKED`, puis redirection par rôle.
Vérifié en navigateur (connexion citoyen, agent, Conseil) et par le test anti-robot (une
soumission trop rapide est bloquée puis re-fonctionne après rechargement — F82 en action).

### 2. Dictionnaires i18n réparés — `lib/i18n/dictionaries/{fr,en,es}.ts`

Encore des séquelles du merge : `fr.ts` (dictionnaire de référence) n'avait **pas** les clés F81
`council.security.formBlocked` / `formBlockedHint` / `eventTypes.FORM_BLOCKED` (présentes en
`en`), et les trois dictionnaires contenaient des **clés d'erreur dupliquées**
(`consultationFailed`, `opinionFailed`, `consultationClosed`, `registerFailed`). Clés manquantes
ajoutées (fr + es), doublons supprimés (message le plus précis conservé), `npx tsc --noEmit`
repasse à **0 erreur**.

### 3. Correctifs fonctionnels liés aux besoins ci-dessus

| Fichier | Besoin | Changement |
| --- | --- | --- |
| `lib/services.ts` | F49 | Notification à l'auteur lors d'un changement de statut (`updateRequestStatus`) |
| `lib/services.ts` | F30 | `notifyCitizens()` + notification à la publication d'une annonce (création publiée ou brouillon → publié) |
| `lib/roles.ts`, `lib/data.ts` | F80 | Rangs de priorité + tri de la file staff (console et API) |
| `app/citizen/requests/page.tsx` + i18n | F79 | Filtres par type de démarche avec compteurs |
| `app/operations/administration/[id]/page.tsx` + i18n | F48 | Auteur affiché sur chaque événement d'historique |
| `prisma/seed.ts` | F29/F31 | Alertes crue + vague de chaleur semées, avec consignes |

---

## Reste à faire (non couvert par cet audit)

| Code | Sujet | Note |
| --- | --- | --- |
| `D02` | Connexion sans mot de passe | L'identification sans e-mail (F71) existe ; le « sans mot de passe » (lien magique) reste à faire |
| `F36` | Horaires / infos transports | Le service Transport existe (Hermes) ; pas d'horaires publics dédiés |
| `F51` | Transparence sur l'usage des données | L'export (F55) existe ; page d'explication + remontée d'inquiétudes à faire |
| `F52` | Soutenir une demande existante | Pas de mécanisme de soutien (modèle dédié à créer) |
| `F53` | Vérification supplémentaire (2FA) | À faire |
| `F54` | Alerte de connexion depuis un nouvel appareil | Le verrouillage F37 et le verrouillage de connexion existent ; la notification « nouvel appareil » reste à faire |
| `F57`/`F58` | Impact environnemental | Les optimisations de [`PERFORMANCE.md`](PERFORMANCE.md) réduisent la charge ; l'audit environnemental formel reste à faire |
| `F59` | Connexions lentes | Amélioré par F61/F78 (bundle, cache, polling adaptatif) ; à documenter spécifiquement |
| `F62` | Versions allégées de certaines pages | Pistes dans `PERFORMANCE.md` (anime.js en lazy) ; non fait |
| `F68` | Proposer des idées | Les consultations (F65/F66) couvrent l'avis sur projets ; le dépôt d'idées libre reste à faire |
| `F67` | Consulter les projets en cours | Les consultations (F65/F66) présentent les projets soumis à avis ; un annuaire de projets dédié reste à faire |
| `F74` | Horaires et adresses des partenaires | La localisation existe (carte/secteurs) ; les horaires à ajouter (schéma + seed) |
| `F75` | Repérer les demandes similaires | À faire (regroupement/aide au tri) |
| `F76` | Commenter après un service | À faire (modèle d'avis à créer) |
| `F84` | Répondre aux demandes depuis l'espace agent | La « réponse officielle » (note d'instruction) existe sur `ServiceRequest` ; la messagerie de réponse dédiée reste à faire |

---

## Vérifications de l'audit

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | **0 erreur** (après réparation LoginForm + dictionnaires + `prisma generate`) |
| `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` | **31 tests, 31 OK** (le mode `npx tsx --test` seul échoue : le préchargement F78 est requis — voir `package.json` script `test:f78`) |
| `npx next build` | **Compilation production OK** |
| Navigateur (dev local, port 3100) | Connexion citoyen/agent/Conseil OK ; filtres `/citizen/requests?type=report` (8 éléments) OK ; file `/operations/administration` triée Haute → Normale → Basse OK ; mise à jour de statut + « par {nom} » OK ; notification F49 créée en base OK ; publication d'annonce → notifications F30 pour les 2 comptes citoyens OK ; 3 bandeaux d'alerte (tempête, crue, chaleur) visibles sur l'accueil OK |
| Base de données | Données de test (annonce de test + notifications) supprimées après vérification |

> **Note d'environnement :** le client Prisma doit être régénéré après un merge qui touche
> `prisma/schema.prisma` (`npx prisma generate`), sinon des types manquants (ex. `anonymous`,
> `consultation`) font échouer `tsc`. C'était le cas sur ce checkout.
