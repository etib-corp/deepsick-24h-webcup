# Formulaires de preuve — demandes fermées

Un formulaire par demande fermée sur [`etib-corp/deepsick-24h-webcup`](https://github.com/etib-corp/deepsick-24h-webcup), dans l'ordre de fermeture.

**30 demandes** — pré-rempli depuis le code de `main` (commit `21b70a8`) le 2026-10-04.

## Mode d'emploi

Chaque section contient les trois champs du formulaire :

1. **Qu'avez-vous mis en place pour répondre à cette demande ?** — texte brut
2. **URL ou emplacement pour tester la fonctionnalité** — URL complète ou chemin interne
3. **Comment le jury peut-il vérifier que cela fonctionne ?** — étapes de reproduction

Les réponses proposées sont déduites du code réel : relisez-les et ajustez-les avant de coller dans le formulaire. Un champ marqué `⚠️ À COMPLÉTER` n'a pas pu être vérifié dans le code.

Comptes de démonstration (mot de passe `password123`) : `citoyen@terranova.fr` (citoyen), `securite@terranova.fr`, `medical@terranova.fr`, `maintenance@terranova.fr`, `transport@terranova.fr`, `commerce@terranova.fr`, `administration@terranova.fr` (agent administratif), `conseil@terranova.fr` (Haut Conseil).

---

## 1. #2 · `F23` — [Accessibility] F-23 Improve interface accessibility and readability

> **Besoin officiel (F23, Moyenne, 520 XP)** — Bonjour, ma vue baisse et certaines parties de la plateforme sont difficiles à distinguer. Les informations importantes manquent parfois de contraste et l’interface devient fatigante à parcourir. J’aimerais disposer d’un affichage plus lisible sans perdre les fonctions essentielles.

**Références :** [issue #2](https://github.com/etib-corp/deepsick-24h-webcup/issues/2) · [PR #19](https://github.com/etib-corp/deepsick-24h-webcup/pull/19)

**Emplacements dans le code :** `app/globals.css`, `components/ui/Badge.tsx`, `components/colony/ConsoleShell.tsx`, `components/colony/IncidentConsole.tsx`, `lib/themes.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les jetons de couleur ont été ajustés dans app/globals.css (primaire, information, destructif, graphiques) pour atteindre le ratio de contraste 4,5:1 sur les dix thèmes, et les tons success et warning de components/ui/Badge.tsx assombrissent leur texte en thème clair. ConsoleShell souligne la navigation active et expose aria-current, IncidentConsole ajoute aria-pressed à ses filtres, et un contour de focus commun (:focus-visible, 2px) est défini globalement. La couleur n'est jamais le seul signal : libellés, icônes et coches la complètent.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen.
2. Cliquer sur l'icône palette et tester les thèmes clairs (Paper Terminal, Grand Jour) : les badges restent lisibles.
3. Taber sur les liens et boutons pour vérifier le contour de focus visible.
4. Sur /operations/security (securite@terranova.fr / password123), vérifier que le filtre actif est souligné en plus d'être coloré.
5. Contrôler au besoin les ratios avec un outil de contraste (objectif 4,5:1 pour le texte courant).

---

## 2. #3 · `F24` — [Accessibility] F-24 Improve text size and readability

> **Besoin officiel (F24, Facile, 260 XP)** — Bonjour, même avec mes lunettes, certains textes restent trop petits pour être lus confortablement. Est-ce que je pourrais augmenter la taille des caractères sans que les pages deviennent inutilisables ou que les informations se chevauchent ?

**Références :** [issue #3](https://github.com/etib-corp/deepsick-24h-webcup/issues/3) · [PR #19](https://github.com/etib-corp/deepsick-24h-webcup/pull/19)

**Emplacements dans le code :** `app/globals.css`, `components/colony/FeedRow.tsx`, `components/ui/Badge.tsx`, `components/colony/ColonyMap.tsx`, `components/layout/PublicHeader.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les anciennes tailles en pixels (9 à 11 px) sont remplacées centralement par 0,75rem dans app/globals.css, et les champs de formulaire suivent la taille de texte de l'utilisateur (font-size 1rem). Boutons et badges utilisent une hauteur intrinsèque et des libellés qui passent à la ligne ; FeedRow, ConsoleShell, StatusStrip et PublicHeader laissent le contenu se replier, et les grilles compactes passent à une colonne sous 40rem. ColonyMap déplace son texte descriptif dans le flux tout en conservant l'illustration proportionnelle et ses points d'intérêt.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen.
2. Réduire la fenêtre vers 320 px ou augmenter la taille de police du navigateur : aucun débordement horizontal ni texte tronqué.
3. Vérifier que les tuiles, les lignes de flux et les badges se replient proprement.
4. Ouvrir /citizen/map : le texte descriptif reste dans le flux et lisible, la carte garde ses proportions.

---

## 3. #18 · `F40` — [Feature] F40 · Appointment reminder and user journey clarity

> **Besoin officiel (F40, Facile, 300 XP)** — Je voudrais recevoir un rappel avant mon rendez-vous. Le parcours doit éviter les ambiguïtés sur le créneau choisi et donner à l’habitant les informations nécessaires pour préparer son rendez-vous.

**Références :** [issue #18](https://github.com/etib-corp/deepsick-24h-webcup/issues/18) · [PR #20](https://github.com/etib-corp/deepsick-24h-webcup/pull/20)

**Emplacements dans le code :** `app/citizen/appointments/page.tsx`, `app/citizen/appointments/nouveau/page.tsx`, `components/colony/AppointmentForm.tsx`, `lib/actions/appointments.ts`, `lib/services.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le citoyen réserve un créneau de 30 minutes sur /citizen/appointments/nouveau : getAvailableSlots calcule les créneaux libres sur sept jours, AppointmentForm laisse choisir le jour et l'heure, et createAppointment revérifie l'absence de doublon puis crée le rendez-vous (statut BOOKED) et une notification. ensureAppointmentReminders, appelé à l'affichage de /citizen/appointments, génère une notification de rappel une seule fois (champ reminderSent) pour tout rendez-vous à venir dans les 24 heures ; la carte affiche aussi un décompte avant le rendez-vous.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/appointments`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/appointments.
2. Vérifier les rendez-vous semés APT-0001 (Soins médicaux) et APT-0002 (Démarches) avec compte à rebours et bloc Préparation.
3. Cliquer sur Nouveau rendez-vous, choisir un service, un jour et un créneau puis confirmer : un accusé avec référence APT-… s'affiche.
4. Ouvrir /citizen/notifications : la confirmation, puis le rappel si le rendez-vous est dans les 24 heures, y figurent.
5. Annuler un rendez-vous et vérifier le passage au statut Annulé.

---

## 4. #1 · `F21` — [Accessibility] F-21 Improve screen reader accessibility

> **Besoin officiel (F21, Moyenne, 520 XP)** — Bonjour, j’utilise un lecteur d’écran pour naviguer sur internet. Sur certaines pages, je n’arrive pas à comprendre correctement les boutons, les formulaires ou l’organisation du contenu. J’aimerais pouvoir utiliser les services de Nova Terra avec mon outil d’assistance comme n’importe quel autre habitant.

**Références :** [issue #1](https://github.com/etib-corp/deepsick-24h-webcup/issues/1) · [PR #21](https://github.com/etib-corp/deepsick-24h-webcup/pull/21)

**Emplacements dans le code :** `components/layout/SkipLink.tsx`, `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `components/ui/Field.tsx`, `components/ui/Alert.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Un lien d'évitement partagé (SkipLink) pointe vers main#main-content (tabIndex=-1) dans les layouts public et auth ainsi que dans ConsoleShell. Les champs relient label et indice au contrôle via Field et aria-describedby, les navigations sont nommées et marquent la page courante (aria-current), et le menu mobile expose aria-expanded et se ferme avec Échap en rendant le focus au bouton. Les retours utilisent role=alert pour les erreurs et role=status pour les confirmations (focus géré), et l'état lu/non-lu des notifications est doublé d'un texte sr-only.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir / et appuyer sur Tab dès l'arrivée : le lien Aller au contenu principal apparaît et déplace le focus vers #main-content.
2. Activer un lecteur d'écran (VoiceOver ou NVDA) et parcourir les navigations : elles sont nommées et la page courante est annoncée.
3. Sur /contact, provoquer une erreur de validation : l'alerte d'erreur est annoncée (role=alert).
4. Sur /login ou /register, vérifier qu'il n'y a qu'un seul repère main et une hiérarchie de titres logique.
5. Se connecter avec citoyen@terranova.fr / password123, ouvrir /citizen/notifications : l'état lu/non-lu est annoncé.

---

## 5. #4 · `D11` — [Feature] D-11 Add request tracking dashboard

> **Besoin officiel (D11, Moyenne, 540 XP)** — Bonjour, j’ai déjà effectué plusieurs démarches sur la plateforme et je ne sais pas toujours où elles en sont. J’aimerais retrouver au même endroit mes demandes, leur état actuel et les principales étapes déjà réalisées, sans devoir contacter la mairie.

**Références :** [issue #4](https://github.com/etib-corp/deepsick-24h-webcup/issues/4) · [PR #22](https://github.com/etib-corp/deepsick-24h-webcup/pull/22)

**Emplacements dans le code :** `app/citizen/requests/page.tsx`, `components/colony/RequestTrackingCard.tsx`, `lib/request-tracking.ts`, `app/citizen/requests/[kind]/[id]/page.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /citizen/requests agrège en une vue unique les cinq types de demandes (démarches, signalements, commandes, rendez-vous, messages) via getCitizenRequestTracking, filtrée par l'identifiant de session. Chaque RequestTrackingCard affiche type, référence, statut courant, étapes enregistrées (événements RequestStatusEvent ou ReportEvent) et dernière mise à jour ; le détail read-only est sur /citizen/requests/[kind]/[id]. L'accès est cloisonné par auteur et un enregistrement étranger renvoie un 404.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/requests`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/requests.
2. Vérifier la liste unifiée : REQ-2026-0001, INC-042, CLN-014, TRN-118, APT-0001 et le message MSG-2026-0001.
3. Ouvrir Voir le détail d'un signalement : statut actuel, étapes horodatées et notes s'affichent.
4. Vérifier que les demandes résolues et clôturées restent présentes.
5. Cliquer sur Tout voir depuis /citizen pour confirmer l'accès depuis le tableau de bord.

---

## 6. #6 · `D14` — [Feature] D-14 Add multi-language support

> **Besoin officiel (D14, Moyenne, 540 XP)** — Bonjour, le français n’est pas la langue avec laquelle je suis le plus à l’aise. J’aimerais pouvoir choisir une autre langue pour comprendre les éléments essentiels de l’interface et effectuer mes démarches plus sereinement.

**Références :** [issue #6](https://github.com/etib-corp/deepsick-24h-webcup/issues/6)

**Emplacements dans le code :** `lib/i18n/config.ts`, `lib/i18n/server.ts`, `lib/i18n/client.tsx`, `lib/format.ts`, `components/i18n/LocaleSwitcher.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

L'application propose trois locales (fr par défaut, en, es) déclarées dans lib/i18n/config.ts (LOCALES, LOCALE_LABELS, cookie nt-locale, sans préfixe d'URL). Le RootLayout lit le cookie, définit lang sur html et fournit le dictionnaire via LocaleProvider ; les composants serveur appellent getDictionary() et les composants clients useT(). Les dates et heures sont formatées par locale (lib/format.ts, fr-FR / en-US / es-ES) et un dictionnaire incomplet provoque une erreur TypeScript (Dictionary = typeof fr).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir / et cliquer sur l'icône globe dans l'en-tête.
2. Choisir English : la navigation et les contenus de la page changent de langue.
3. Ouvrir /announcements : les dates de publication passent au format anglais.
4. Choisir Español puis revenir au Français : le réglage est mémorisé dans le cookie nt-locale.
5. Vérifier que les noms propres (Terra Nova, Ares Security Command) et le contenu semé gardent leur langue.

---

## 7. #7 · `D15` — [Feature] D-15 Add breadcrumb navigation

> **Besoin officiel (D15, Facile, 270 XP)** — Je passe d’un service à l’autre et il m’arrive de ne plus savoir dans quelle partie de la plateforme je me trouve. J’aimerais disposer d’un repère simple pour comprendre mon emplacement et revenir facilement aux niveaux précédents.

**Références :** [issue #7](https://github.com/etib-corp/deepsick-24h-webcup/issues/7) · [PR #24](https://github.com/etib-corp/deepsick-24h-webcup/pull/24)

**Emplacements dans le code :** `lib/breadcrumbs.ts`, `components/layout/Breadcrumbs.tsx`, `components/ui/PageHeader.tsx`, `components/colony/ConsoleShell.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

lib/breadcrumbs.ts est un registre explicite reliant chaque route à des libellés lisibles du dictionnaire. Le composant Breadcrumbs rend un élément nav nommé avec une liste ordonnée, des liens ancêtres accessibles au clavier, des séparateurs décoratifs (aria-hidden) et la page courante en texte marquée aria-current=page, jamais cliquable. Il est intégré dans PageHeader (pages publiques) et ConsoleShell (citoyen, opérations, council) ; les pages dynamiques (/services/[slug], /announcements/[slug], /citizen/reports/[id], /operations/*/[id]) passent le titre déjà chargé via currentLabel.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/services/securite`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /services puis cliquer sur un service : le fil Accueil › Services › nom du service s'affiche.
2. Vérifier que le dernier élément est du texte non cliquable (aria-current=page) et que Services est un lien.
3. Naviguer au clavier (Tab puis Entrée) sur le lien ancêtre pour revenir à la liste.
4. Passer la langue en anglais : le libellé du fil suit la locale alors que le titre semé reste inchangé.

---

## 8. #8 · `D16` — [Feature] D-16 Add request submission confirmation

> **Besoin officiel (D16, Facile, 270 XP)** — Après avoir envoyé une demande, je ne sais pas toujours si elle a réellement été prise en compte. J’aimerais obtenir une confirmation claire immédiatement après l’envoi afin d’éviter de recommencer inutilement la démarche.

**Références :** [issue #8](https://github.com/etib-corp/deepsick-24h-webcup/issues/8) · [PR #28](https://github.com/etib-corp/deepsick-24h-webcup/pull/28)

**Emplacements dans le code :** `components/forms/SubmissionForm.tsx`, `components/forms/SubmissionConfirmation.tsx`, `lib/actions/reports.ts`, `lib/actions/appointments.ts`, `components/colony/ReportForm.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les quatre formulaires de création (contact, signalement, commande, rendez-vous) partagent un verrou de soumission immédiat (SubmissionForm) et n'affichent l'accusé qu'après succès réel de la server action. SubmissionConfirmation remplace alors le formulaire par une Alert focalisée (role=status) contenant le titre de réception, la référence enregistrée, un conseil contre le double envoi et un lien de suivi. lib/actions/reports.ts, orders.ts et appointments.ts renvoient { ok: true, reference } au lieu de rediriger sur un simple drapeau d'URL.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/report`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 puis ouvrir /citizen/report.
2. Remplir service, objet, priorité, secteur et description (10 caractères minimum), puis transmettre.
3. Vérifier que le formulaire disparaît au profit d'un accusé focalisé avec le titre de réception et une référence de type INC-….
4. Suivre le lien de suivi : le signalement apparaît dans /citizen/reports.
5. Contrôle : double-cliquer rapidement sur le bouton ne crée qu'un seul enregistrement.

---

## 9. #13 · `F28` — [Feature] F-28 Highlight priority services

> **Besoin officiel (F28, Facile, 270 XP)** — Le catalogue de services commence à s’étoffer et les habitants ne doivent pas avoir à tout parcourir pour trouver les démarches les plus courantes. Nous souhaitons pouvoir mettre en avant les services prioritaires ou les plus utilisés.

**Références :** [issue #13](https://github.com/etib-corp/deepsick-24h-webcup/issues/13) · [PR #38](https://github.com/etib-corp/deepsick-24h-webcup/pull/38)

**Emplacements dans le code :** `app/(public)/page.tsx`, `components/public/ServiceList.tsx`, `lib/data.ts`, `lib/services.ts`, `lib/actions/admin.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le modèle MunicipalService porte un champ featured (migration add_service_featured) et getPublishedServices() trie par featured décroissant avant order. La page d'accueil affiche les quatre premiers services, dont les trois prioritaires semés (Sécurité, Soins médicaux, Démarches), et ServiceList les regroupe dans une section Services prioritaires avec un badge Prioritaire. Le Haut Conseil peut basculer ce statut via toggleServiceFeaturedAction depuis /council/services.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/services`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /services et passer en vue Liste.
2. Vérifier la section Services prioritaires en tête (Sécurité publique, Soins médicaux, Démarches administratives) avec le badge Prioritaire.
3. Ouvrir / : les mêmes services prioritaires apparaissent dans la section Réseau civique.
4. Contrôle admin : avec conseil@terranova.fr / password123 sur /council/services, mettre en avant un autre service et vérifier sa remontée.

---

## 10. #11 · `F26` — [Feature] F-26 Add request history

> **Besoin officiel (F26, Facile, 270 XP)** — J’ai déjà envoyé plusieurs demandes à la ville et j’aimerais pouvoir retrouver les précédentes sans avoir à les rechercher une par une. Un historique dans mon espace personnel m’aiderait à vérifier ce que j’ai déjà signalé.

**Références :** [issue #11](https://github.com/etib-corp/deepsick-24h-webcup/issues/11)

**Emplacements dans le code :** `app/citizen/reports/page.tsx`, `app/citizen/reports/[id]/page.tsx`, `lib/request-tracking.ts`, `app/citizen/requests/[kind]/[id]/page.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /citizen/reports liste tous les signalements de l'habitant et /citizen/reports/[id] affiche la chronologie complète des ReportEvent (statut, horodatage, note) ainsi que le dossier de sécurité éventuel. La vue unifiée /citizen/requests reprend l'historique des cinq types via getCitizenRequestTracking, et /citizen/requests/[kind]/[id] en affiche le détail ; les demandes résolues et clôturées restent consultables. L'accès est limité à l'auteur (requirePageRole plus contrôle authorId) et un enregistrement étranger renvoie un 404.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/reports`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/reports.
2. Vérifier la présence des signalements semés : INC-042, INC-029, MED-118, MNT-482, CLN-014 et INC-038 (clôturé).
3. Ouvrir INC-042 : lire la chronologie (statuts, dates, unité affectée) et le dossier sécurité éventuel.
4. Ouvrir /citizen/requests et vérifier que les démarches terminées (REQ-2026-0003) restent visibles.
5. Contrôle d'accès : l'URL de détail d'un signalement d'un autre colon renvoie une page 404.

---

## 11. #9 · `D17` — [Feature] D-17 Add pending requests counter

> **Besoin officiel (D17, Facile, 270 XP)** — Les premières demandes citoyennes arrivent et nos agents doivent pouvoir évaluer la charge de travail en un coup d’œil. Nous avons besoin de savoir immédiatement combien de demandes attendent encore une prise en charge.

**Références :** [issue #9](https://github.com/etib-corp/deepsick-24h-webcup/issues/9)

**Emplacements dans le code :** `app/operations/administration/page.tsx`, `components/colony/IncidentConsole.tsx`, `lib/data.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La console administrative /operations/administration affiche trois compteurs calculés côté serveur à partir de getStaffRequests() : À traiter (statuts SUBMITTED, IN_REVIEW, IN_PROGRESS), En examen et Traitées. La file liste ensuite chaque démarche avec auteur, date, catégorie et badges de priorité et de statut, ce qui permet d'évaluer la charge. Les consoles d'incidents (IncidentConsole) appliquent le même principe avec quatre tuiles (à traiter, critiques, engagés, résolus).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/operations/administration`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec administration@terranova.fr / password123.
2. Ouvrir /operations/administration : lire les tuiles À traiter, En examen et Traitées.
3. Vérifier que la file contient REQ-2026-0001 (en cours d'examen), REQ-2026-0002 (en traitement) et REQ-2026-0003 (résolue).
4. Ouvrir REQ-2026-0001, le faire passer à Clôturée, puis vérifier la mise à jour du compteur À traiter.

---

## 12. #14 · `D18` — [Feature] D-18 Add general announcements

> **Besoin officiel (D18, Difficile, 840 XP)** — La plateforme doit pouvoir diffuser rapidement un message général à tous les habitants. L’information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu’elles doivent savoir ou faire.

**Références :** [issue #14](https://github.com/etib-corp/deepsick-24h-webcup/issues/14) · [PR #23](https://github.com/etib-corp/deepsick-24h-webcup/pull/23)

**Emplacements dans le code :** `components/layout/BroadcastBanner.tsx`, `components/colony/BroadcastForm.tsx`, `app/council/broadcasts/page.tsx`, `lib/actions/admin.ts`, `lib/data.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le modèle Broadcast (titre, message, libellé et lien d'action, fenêtre startsAt/endsAt, active) porte les messages généraux. getActiveBroadcasts() ne renvoie que les diffusions actives dans leur fenêtre horaire, et BroadcastBanner les affiche dans un bandeau role=region sur le site public et dans chaque ConsoleShell. Le Haut Conseil les gère sur /council/broadcasts via BroadcastForm et les actions créer, activer/désactiver et supprimer.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/council/broadcasts`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec conseil@terranova.fr / password123 et ouvrir /council/broadcasts.
2. Vérifier la diffusion semée Tempête de poussière — confinement temporaire, marquée active.
3. Créer une diffusion (titre et message, case active cochée) et valider.
4. Ouvrir / (ou /citizen) : le bandeau Message du Haut Conseil affiche la diffusion.
5. Désactiver une diffusion et vérifier que le bandeau disparaît après rechargement.

---

## 13. #37 · `F40` — [Feature] F-40 Add appointment reminders

> **Besoin officiel (F40, Facile, 300 XP)** — Je voudrais recevoir un rappel avant mon rendez-vous. Le parcours doit éviter les ambiguïtés sur le créneau choisi et donner à l’habitant les informations nécessaires pour préparer son rendez-vous.

**Références :** [issue #37](https://github.com/etib-corp/deepsick-24h-webcup/issues/37)

**Emplacements dans le code :** `app/citizen/appointments/page.tsx`, `app/citizen/appointments/nouveau/page.tsx`, `components/colony/AppointmentForm.tsx`, `lib/actions/appointments.ts`, `lib/services.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le citoyen réserve un créneau de 30 minutes sur /citizen/appointments/nouveau : getAvailableSlots calcule les créneaux libres sur sept jours, AppointmentForm laisse choisir le jour et l'heure, et createAppointment revérifie l'absence de doublon puis crée le rendez-vous (statut BOOKED) et une notification. ensureAppointmentReminders, appelé à l'affichage de /citizen/appointments, génère une notification de rappel une seule fois (champ reminderSent) pour tout rendez-vous à venir dans les 24 heures ; la carte affiche aussi un décompte avant le rendez-vous.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/appointments`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/appointments.
2. Vérifier les rendez-vous semés APT-0001 (Soins médicaux) et APT-0002 (Démarches) avec compte à rebours et bloc Préparation.
3. Cliquer sur Nouveau rendez-vous, choisir un service, un jour et un créneau puis confirmer : un accusé avec référence APT-… s'affiche.
4. Ouvrir /citizen/notifications : la confirmation, puis le rappel si le rendez-vous est dans les 24 heures, y figurent.
5. Annuler un rendez-vous et vérifier le passage au statut Annulé.

---

## 14. #39 · `D13` — [Accessibility] D-13 Improve platform language clarity

> **Besoin officiel (D13, Facile, 310 XP)** — Certains mots utilisés dans la plateforme sont difficiles à comprendre. Cela complique les démarches. Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Références :** [issue #39](https://github.com/etib-corp/deepsick-24h-webcup/issues/39)

**Emplacements dans le code :** `lib/i18n/dictionaries/fr.ts`, `lib/i18n/server.ts`, `lib/i18n/client.tsx`, `components/i18n/LocaleSwitcher.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Toute la copie destinée aux habitants passe par des dictionnaires localisés (lib/i18n/dictionaries/fr.ts, en.ts, es.ts) : aucun texte n'est codé en dur dans les composants. Le serveur résout le libellé via getDictionary() et le client via useT(), format() interpole les {placeholders}, et les dates suivent la locale (lib/format.ts). Le besoin D13 n'apparaît pas dans docs/TODO_terra_nova.md de l'arborescence extraite ; l'implémentation retenue correspond au système de libellés localisés indiqué par la piste de recherche.

> ⚠️ À confirmer : formulation déduite du code, à relire avant envoi.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir / : l'interface est en français par défaut.
2. Cliquer sur l'icône globe de l'en-tête et choisir English : tous les libellés changent sans préfixe d'URL.
3. Choisir Español et vérifier que l'attribut lang du document et les libellés suivent.
4. Revenir au français : le choix est conservé par le cookie nt-locale.

---

## 15. #10 · `F25` — [Feature] F-25 Add incident reporting

> **Besoin officiel (F25, Moyenne, 540 XP)** — Bonjour, un lampadaire est cassé dans ma rue et je ne sais pas quel service contacter. La plateforme pourrait-elle me permettre de signaler directement ce type de problème en indiquant ce qui s’est passé et où il se trouve ?

**Références :** [issue #10](https://github.com/etib-corp/deepsick-24h-webcup/issues/10)

**Emplacements dans le code :** `app/citizen/report/page.tsx`, `components/colony/ReportForm.tsx`, `lib/actions/reports.ts`, `lib/roles.ts`, `lib/services.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Depuis /citizen/report, ReportForm propose les quatre types de signalement (SECURITY, MEDICAL, MAINTENANCE, CLEANLINESS) avec objet, priorité, secteur et description. createReportAction valide les données (Zod), createReport génère une référence lisible (INC-, MED-, MNT-, CLN-) et crée le Report en statut OPEN, puis REPORT_TYPE_ROLE oriente automatiquement le dossier vers le service compétent. Le citoyen n'a pas à choisir l'unité : chaque console ne voit que les types qui la concernent.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/report`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/report.
2. Choisir Maintenance, saisir un objet (ex. Lampadaire cassé rue principale), une priorité, un secteur et une description, puis transmettre.
3. Noter la référence affichée (MNT-…) et vérifier le signalement dans /citizen/reports.
4. Se déconnecter puis se connecter avec maintenance@terranova.fr / password123 : le signalement apparaît dans la console maintenance, pas chez la sécurité.

---

## 16. #29 · `F32` — [Feature] F-32 Improve service discovery and attention visibility

> **Besoin officiel (F32, Facile, 280 XP)** — Je cherche les services de santé mais je ne les trouve pas facilement. À mesure que le volume augmente, les utilisateurs doivent pouvoir retrouver rapidement les éléments qui nécessitent leur attention.

**Références :** [issue #29](https://github.com/etib-corp/deepsick-24h-webcup/issues/29)

**Emplacements dans le code :** `components/public/ServicesView.tsx`, `components/public/ServiceList.tsx`, `app/(public)/services/page.tsx`, `lib/map-layout.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /services propose deux vues commutables carte et liste via ServicesView, avec boutons aria-pressed. La vue Carte (ColonyMap) place les services géolocalisés sur l'illustration de la colonie, et la vue Liste (ServiceList) regroupe les services par catégorie et met les prioritaires en avant, chaque carte menant à /services/[slug]. Réserve : cette arborescence n'offre pas de champ de recherche plein texte ni de filtre par catégorie explicite, la découverte repose donc sur le regroupement et la carte.

> ⚠️ À confirmer : formulation déduite du code, à relire avant envoi.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/services`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /services : la vue carte s'affiche par défaut avec un commutateur Carte / Liste.
2. Cliquer sur Liste : les services sont regroupés par catégorie (Protection, Santé, Technique, Mobilité, Administration…).
3. Vérifier le compteur de modules cartographiés et que chaque carte ouvre une fiche service.
4. Revenir en vue Carte et survoler ou activer un module pour ouvrir sa fiche.

---

## 17. #5 · `D12` — [Feature] D-12 Add onboarding for new users

> **Besoin officiel (D12, Moyenne, 540 XP)** — De nouveaux habitants arrivent régulièrement à Nova Terra et beaucoup découvrent les services municipaux pour la première fois. Lors de leur première connexion, ils doivent comprendre rapidement comment compléter leur profil, trouver un service et commencer une démarche.

**Références :** [issue #5](https://github.com/etib-corp/deepsick-24h-webcup/issues/5)

**Emplacements dans le code :** `app/(public)/guide/page.tsx`, `lib/guide.ts`, `components/guide/GuideExplorer.tsx`, `lib/tour.ts`, `components/tour/TourProvider.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /guide présente un parcours écrit par profil (GuideExplorer et lib/guide.ts) : pour chaque profil, l'espace d'atterrissage, le compte de démonstration, les étapes numérotées et une astuce. Un tutoriel interactif (TourProvider, lib/tour.ts) surligne un élément réel repéré par data-tour, bloque le reste de l'interface et avance soit par l'action réelle, soit avec Suivant ; les quatre leçons (découvrir la ville, parcours citoyen, traiter un dossier, piloter la colonie) sont filtrées selon le rôle via canStartLesson / accessibleLessons.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/guide`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /guide sans compte : le parcours Visiteur s'affiche par défaut.
2. Parcourir le sélecteur de profils (Visiteur, Citoyen, Sécurité, … Haut Conseil) et lire les étapes.
3. Cliquer sur Lancer la visite d'une leçon publique : l'élément cible est surligné et le reste de la page est bloqué.
4. Se connecter avec citoyen@terranova.fr / password123 puis rouvrir /guide : le profil Citoyen est présélectionné.
5. Depuis une console, utiliser le bouton boussole (TourMenu) pour lancer uniquement les leçons accessibles au rôle.

---

## 18. #12 · `F27` — [Feature] F-27 Add multilingual service content

> **Besoin officiel (F27, Moyenne, 540 XP)** — Notre service accueille des habitants qui ne maîtrisent pas tous la même langue. Au-delà des menus de l’interface, les contenus essentiels des services et des démarches doivent pouvoir être proposés dans plusieurs langues.

**Références :** [issue #12](https://github.com/etib-corp/deepsick-24h-webcup/issues/12)

**Emplacements dans le code :** `components/i18n/LocaleSwitcher.tsx`, `components/colony/ConsoleShell.tsx`, `lib/i18n/dictionaries/fr.ts`, `lib/i18n/dictionaries/en.ts`, `lib/i18n/dictionaries/es.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les consoles agents utilisent les mêmes dictionnaires localisés que le reste de la plateforme : la copie des consoles (t.ops, t.council) vient de lib/i18n/dictionaries/*, et les server actions construisent leurs messages via getDictionary(). L'en-tête de chaque console embarque LocaleSwitcher, qui écrit le cookie nt-locale puis rafraîchit la page, permettant à un agent de travailler en français, anglais ou espagnol. Statuts, priorités et rôles sont traduits (t.requestStatus, t.reportStatus, t.roles) et les dates suivent la locale.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/operations/security`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec securite@terranova.fr / password123.
2. Sur /operations/security, cliquer sur l'icône globe et choisir English : titres, filtres et statuts passent en anglais.
3. Choisir Español : l'interface de console suit la nouvelle langue.
4. Revenir au français : les contenus semés (ex. Alerte intrusion airlock) conservent leur langue d'origine.

---

## 19. #31 · `F34` — [Feature] F-34 Add citizen account management

> **Besoin officiel (F34, Moyenne, 580 XP)** — Les agents doivent pouvoir administrer les comptes citoyens. Le parcours doit rester compréhensible pour l’utilisateur tout en évitant qu’une personne non autorisée puisse accéder à son espace.

**Références :** [issue #31](https://github.com/etib-corp/deepsick-24h-webcup/issues/31)

**Emplacements dans le code :** `app/council/users/page.tsx`, `lib/actions/admin.ts`, `lib/data.ts`, `lib/roles.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /council/users liste tous les comptes via getUsers() avec un badge de rôle et, pour chaque ligne, un sélecteur de rôle nommé (aria-label Rôle de {name}) suivi d'un bouton Mettre à jour. La server action setUserRoleAction vérifie requirePageRole(['COUNCIL']), valide le rôle avec isRole et refuse de modifier son propre compte, puis met à jour l'utilisateur et revalide la page. Les libellés des huit rôles proviennent du dictionnaire (t.roles).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/council/users`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec conseil@terranova.fr / password123 et ouvrir /council/users.
2. Vérifier la liste des huit comptes semés avec leur badge de rôle.
3. Changer le rôle d'un compte (ex. passer un citoyen en Agent administratif) puis cliquer Mettre à jour.
4. Se reconnecter avec ce compte : sa page d'atterrissage reflète le nouveau rôle.
5. Vérifier que le propre compte du Conseil affiche vous et reste non modifiable.

---

## 20. #46 · `D01` — [Feature] D-01 Add resident account registration

> **Besoin officiel (D01, Facile, 250 XP)** — La plateforme va accueillir les habitants de Nova Terra et chacun doit pouvoir disposer de son propre accès. Nous devons permettre à un nouvel habitant de créer simplement un compte afin d’utiliser les services numériques de la ville et de retrouver ensuite son espace personnel.

**Références :** [issue #46](https://github.com/etib-corp/deepsick-24h-webcup/issues/46)

**Emplacements dans le code :** `app/(auth)/register/page.tsx`, `components/forms/RegisterForm.tsx`, `lib/actions/auth.ts`, `lib/services.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le formulaire /register (RegisterForm) crée une identité colon avec nom, e-mail et mot de passe (min. 8 caractères, autoComplete). La server action registerAction valide les champs via Zod (registerSchema), puis registerCitizen rejette un e-mail déjà utilisé, hache le mot de passe avec bcrypt et crée un User de rôle CITIZEN. En cas de succès, redirection vers /login?inscription=1 où une alerte de confirmation est affichée.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/register`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /register (aucune connexion requise).
2. Renseigner un nom, une adresse e-mail unique et un mot de passe d'au moins 8 caractères, puis valider.
3. Vérifier la redirection vers /login accompagnée du message d'inscription réussie (paramètre inscription=1).
4. Se connecter avec ces identifiants : l'arrivée se fait sur /citizen, confirmant le rôle CITIZEN.
5. Contrôle : retenter la même adresse e-mail, le formulaire affiche que le compte existe déjà.

---

## 21. #48 · `D03` — [Feature] D-03 Add sign-in and personal space

> **Besoin officiel (D03, Facile, 250 XP)** — Une fois inscrits, les citoyens doivent pouvoir revenir sur la plateforme sans recommencer leur parcours. Ils doivent pouvoir se connecter à un espace personnel clairement identifié et y retrouver les informations et démarches qui les concernent.

**Références :** [issue #48](https://github.com/etib-corp/deepsick-24h-webcup/issues/48)

**Emplacements dans le code :** `app/(auth)/login/page.tsx`, `components/forms/LoginForm.tsx`, `lib/auth.ts`, `app/citizen/page.tsx`, `lib/roles.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le formulaire /login (LoginForm) appelle NextAuth signIn avec le provider credentials, puis relit la session et redirige via homeForRole(session.user.role). lib/auth.ts configure un Credentials provider qui compare le mot de passe bcrypt et un JWT dont les callbacks jwt/session exposent id et role. L'espace personnel /citizen (tableau de bord, indicateurs colonie, demandes actives, réseau civique) est protégé par requirePageRole(['CITIZEN']) ; les huit rôles ont chacun leur page d'atterrissage.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/login`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Aller sur /login et se connecter avec citoyen@terranova.fr / password123.
2. Vérifier l'arrivée sur /citizen (salutation, indicateurs de la colonie, demandes actives).
3. Cliquer sur Quitter en haut de la console, puis se reconnecter avec securite@terranova.fr / password123.
4. Vérifier l'arrivée sur /operations/security : l'espace d'atterrissage dépend bien du rôle.
5. Se reconnecter avec conseil@terranova.fr / password123 pour atterrir sur /council.

---

## 22. #49 · `D04` — [Feature] D-04 Add contact form with acknowledgement

> **Besoin officiel (D04, Facile, 250 XP)** — Même avec des services en ligne, un habitant doit pouvoir joindre l’administration lorsqu’il a une question ou rencontre une difficulté. Prévoyez un moyen simple de transmettre un message aux services municipaux et de confirmer que la demande a bien été envoyée.

**Références :** [issue #49](https://github.com/etib-corp/deepsick-24h-webcup/issues/49)

**Emplacements dans le code :** `app/(public)/contact/page.tsx`, `components/forms/ContactForm.tsx`, `lib/actions/contact.ts`, `lib/services.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page publique /contact embarque ContactForm (objet, e-mail, message). La server action contactAction valide les données via contactSchema (Zod) puis createContactMessage enregistre un ContactMessage de statut RECEIVED doté d'une référence unique. En cas de succès, le formulaire est remplacé par une alerte focalisée (autoFocus, role=status) affichant l'accusé de réception et la référence de suivi.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/contact`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /contact (page publique, aucune connexion).
2. Remplir l'objet, une adresse e-mail et un message d'au moins 10 caractères, puis Envoyer le message.
3. Vérifier que le formulaire est remplacé par un accusé focalisé indiquant Référence de suivi et un code du type MSG-….
4. Conserver la référence affichée : elle correspond au ContactMessage enregistré.
5. Contrôle : aucun e-mail réel n'est envoyé, l'accusé s'affiche uniquement à l'écran.

---

## 23. #50 · `D05` — [Feature] D-05 Add municipal services directory

> **Besoin officiel (D05, Facile, 250 XP)** — Les habitants ne savent pas toujours quels services municipaux existent ni lequel correspond à leur besoin. La plateforme doit présenter les principaux services de Nova Terra de manière claire et permettre d’accéder facilement aux informations utiles pour chacun d’eux.

**Références :** [issue #50](https://github.com/etib-corp/deepsick-24h-webcup/issues/50)

**Emplacements dans le code :** `app/(public)/services/page.tsx`, `app/(public)/services/[slug]/page.tsx`, `components/public/ServicesView.tsx`, `lib/data.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le répertoire public /services liste les MunicipalService publiés via getPublishedServices() (tri par featured puis order) et propose une vue carte ou liste. La fiche /services/[slug] affiche catégorie, icône, description et trois actions (créer une demande liée, prendre rendez-vous, poser une question). Le back-office /council/services permet de créer (slug unique), mettre en avant ou supprimer un service.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/services`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /services : le réseau des services s'affiche (vue carte par défaut).
2. Cliquer sur le service Sécurité publique (/services/securite) et lire sa présentation et ses actions.
3. Revenir à la liste, passer en vue Liste et vérifier le regroupement par catégorie.
4. Contrôle admin : se connecter avec conseil@terranova.fr / password123 puis ouvrir /council/services.

---

## 24. #51 · `D06` — [Feature] D-06 Add municipal announcements

> **Besoin officiel (D06, Facile, 250 XP)** — La ville publie régulièrement des informations utiles à tous : annonces municipales, changements de service ou informations pratiques. Les habitants doivent pouvoir retrouver ces publications facilement depuis la plateforme et consulter leur contenu.

**Références :** [issue #51](https://github.com/etib-corp/deepsick-24h-webcup/issues/51)

**Emplacements dans le code :** `app/(public)/announcements/page.tsx`, `app/(public)/announcements/[slug]/page.tsx`, `app/council/announcements/page.tsx`, `lib/actions/admin.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page /announcements liste les annonces publiées (getPublishedAnnouncements, tri par date de publication) et /announcements/[slug] affiche le corps complet avec auteur et date. Le Haut Conseil les gère depuis /council/announcements via createAnnouncementAction et toggleAnnouncementAction (brouillon ou publication, slug unique). Seules les annonces marquées published sont visibles publiquement.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/announcements`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir /announcements : trois annonces publiées apparaissent, dont Phase deux de colonisation : ouverture du Secteur 05.
2. Ouvrir une annonce pour lire son contenu complet et sa date.
3. Se connecter avec conseil@terranova.fr / password123 puis ouvrir /council/announcements.
4. Créer une annonce en la publiant et vérifier son apparition immédiate sur /announcements.

---

## 25. #52 · `D07` — [Feature] D-07 Add hierarchical home page

> **Besoin officiel (D07, Moyenne, 500 XP)** — En arrivant sur la plateforme, un habitant doit immédiatement comprendre où il se trouve et ce qu’il peut y faire. La page d’accueil doit hiérarchiser les informations essentielles et donner un accès évident aux principaux services de Nova Terra.

**Références :** [issue #52](https://github.com/etib-corp/deepsick-24h-webcup/issues/52)

**Emplacements dans le code :** `app/(public)/page.tsx`, `lib/roles.ts`, `lib/data.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

La page d'accueil publique / suit une hiérarchie explicite : hero avec accroche et CTA, lanceur de tutoriels, actions rapides (signaler, commander, démarches, annonces), services prioritaires, dernières annonces puis cycle de vie du signalement. Les données proviennent de getPublishedServices et getPublishedAnnouncements, et le CTA principal dépend du rôle via homeForRole. La page est marquée force-dynamic et reste consultable sans compte.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Ouvrir / sans être connecté : lire le hero indiquant où l'on est et ce que l'on peut faire.
2. Descendre la page : actions rapides, services prioritaires (Sécurité, Soins médicaux, Démarches), dernières annonces, cycle OUVERT vers CLÔTURÉ.
3. Cliquer sur Découvrir les services et vérifier la navigation vers /services.
4. Se connecter puis revenir sur / : le bouton principal devient Mon espace et mène au tableau de bord du rôle.

---

## 26. #53 · `D08` — [Feature] D-08 Add citizen, agent and admin roles

> **Besoin officiel (D08, Moyenne, 500 XP)** — La plateforme sera utilisée par plusieurs catégories de personnes : citoyens, agents municipaux et administrateurs. Le système doit pouvoir distinguer clairement ces profils afin d’adapter les outils et les responsabilités disponibles pour chacun.

**Références :** [issue #53](https://github.com/etib-corp/deepsick-24h-webcup/issues/53)

**Emplacements dans le code :** `lib/roles.ts`, `lib/auth.ts`, `app/council/users/page.tsx`, `lib/actions/admin.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les rôles sont déclarés dans lib/roles.ts (ROLES : huit profils CITIZEN, SECURITY, MEDIC, MAINTENANCE, DRIVER, MERCHANT, ADMIN_AGENT, COUNCIL) avec libellés et pages d'atterrissage (homeForRole). Le rôle est chargé dans le JWT par lib/auth.ts puis exposé dans la session. Le Haut Conseil peut changer le rôle d'un compte depuis /council/users via setUserRoleAction, protégé par requirePageRole(['COUNCIL']).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/council/users`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec conseil@terranova.fr / password123 (Haut Conseil).
2. Ouvrir /council/users : la liste des comptes affiche un badge de rôle pour chacun.
3. Sur un autre compte, changer le rôle via le sélecteur puis cliquer Mettre à jour.
4. Se déconnecter et se reconnecter avec ce compte : la page d'atterrissage correspond au nouveau rôle.
5. Contrôle : le Conseil ne peut pas modifier son propre rôle (ligne affichée en lecture seule).

---

## 27. #54 · `D09` — [Security] D-09 Enforce role-based access control

> **Besoin officiel (D09, Moyenne, 500 XP)** — Tous les utilisateurs ne doivent pas accéder aux mêmes informations ni aux mêmes actions. Un citoyen ne doit pas atteindre les outils réservés aux agents, et les fonctions sensibles doivent rester limitées aux profils autorisés.

**Références :** [issue #54](https://github.com/etib-corp/deepsick-24h-webcup/issues/54)

**Emplacements dans le code :** `middleware.ts`, `lib/permissions.ts`, `lib/roles.ts`, `app/api/requests/route.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

L'autorisation est vérifiée à deux niveaux. `middleware.ts` intercepte `/citizen/:path*`, `/operations/:path*` et `/council/:path*` : sans session, redirection vers `/login` avec `callbackUrl` ; avec un rôle non autorisé, redirection vers `homeForRole(role)` — jamais une impasse. Chaque page et server action rappelle ensuite la garde côté serveur via `requirePageRole`, et chaque route handler via `requireApiRole` (401/403). `/api/requests` restreint un citoyen à ses propres demandes.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/operations/administration`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Non connecté, ouvrir /citizen/requests : redirection vers /login.
2. Se connecter avec citoyen@terranova.fr / password123 puis ouvrir /operations/administration : redirection vers /citizen.
3. Se connecter avec administration@terranova.fr / password123 : l'accès à /operations/administration est autorisé.
4. Contrôle API : appeler /api/agent/activity sans session (401) puis avec un compte citoyen (403).

---

## 28. #55 · `D19` — [Feature] D-19 Add agent workspace fed by the Nova Terra API

> **Besoin officiel (D19, Difficile, 750 XP)** — Avant l’ouverture de la plateforme aux habitants, les services municipaux doivent disposer de leur propre espace de travail. Les agents doivent pouvoir accéder à une interface distincte de l’espace citoyen et y consulter de façon claire les informations transmises par l’API Nova Terra. Cette base doit leur permettre de commencer à suivre l’activité de la plateforme dès sa mise en service.

**Références :** [issue #55](https://github.com/etib-corp/deepsick-24h-webcup/issues/55)

**Emplacements dans le code :** `app/api/agent/activity/route.ts`, `app/operations/security/page.tsx`, `components/colony/IncidentConsole.tsx`, `lib/data.ts`, `app/operations/layout.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Les agents disposent de consoles dédiées et distinctes de l'espace citoyen : /operations/security, /operations/medical, /operations/maintenance, /operations/transport, /operations/commerce et /operations/administration, chacune rendue par ConsoleShell et protégée par son rôle. Le endpoint /api/agent/activity, gardé par requireApiRole(STAFF_ROLES), expose getPlatformStats() et getActivityFeed() sérialisés par toActivityDto : c'est la surface Nova Terra API. Réserve : dans cette arborescence, les consoles lisent les données via des composants serveur et aucune interface n'appelle encore /api/agent/activity directement.

> ⚠️ À confirmer : formulation déduite du code, à relire avant envoi.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/operations/security`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec securite@terranova.fr / password123 : arrivée sur /operations/security (Ares Security Command).
2. Vérifier que l'espace est nettement distinct du tableau de bord citoyen (console, radar, file d'incidents, voyant LIVE).
3. Traiter un incident : ouvrir INC-042, le prendre en charge, changer le statut et enregistrer.
4. Contrôle API : avec un compte staff, appeler /api/agent/activity (statistiques et flux) ; sans session la route répond 401.

---

## 29. #56 · `F22` — [Feature] F-22 Add resident requests view with statuses

> **Besoin officiel (F22, Facile, 250 XP)** — Dès la mise en service, les agents vont recevoir les premières demandes des habitants dans leur espace de travail. Ils doivent pouvoir les retrouver dans une vue claire, identifier leur état et distinguer rapidement celles qui nécessitent encore une action.

**Références :** [issue #56](https://github.com/etib-corp/deepsick-24h-webcup/issues/56)

**Emplacements dans le code :** `app/operations/administration/page.tsx`, `lib/data.ts`, `lib/roles.ts`, `components/colony/IncidentConsole.tsx`, `components/ui/StatusBadge.tsx`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

lib/roles.ts définit ACTIONABLE_STATUSES (SUBMITTED, IN_REVIEW, IN_PROGRESS) et needsAction(), et getStaffRequests({ actionable }) filtre la file. La console /operations/administration liste toutes les démarches (référence, auteur, date, catégorie, badges de priorité et de statut) et met en avant les éléments à traiter. Le même principe s'applique aux incidents : IncidentConsole propose des puces Tous / Critiques / À traiter / Résolus avec aria-pressed, et StatusBadge rend chaque statut lisible.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/operations/administration`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec administration@terranova.fr / password123 et ouvrir /operations/administration.
2. Vérifier que chaque ligne affiche un badge de statut lisible (Soumise, En cours d'examen, En traitement, Résolue, Clôturée).
3. Ouvrir REQ-2026-0001 et faire évoluer son statut : la liste et le compteur À traiter se mettent à jour.
4. Contrôle côté incidents : se connecter avec securite@terranova.fr / password123 et utiliser la puce À traiter sur /operations/security.

---

## 30. #58 · `F45` — [Feature] F-45 Add map localisation of physical services

> **Besoin officiel (F45, Difficile, 960 XP)** — Les habitants ont du mal à localiser certains services physiques dans la ville. L’habitant doit pouvoir comprendre rapidement l’information utile à sa situation et agir sans devoir parcourir plusieurs écrans.

**Références :** [issue #58](https://github.com/etib-corp/deepsick-24h-webcup/issues/58)

**Emplacements dans le code :** `app/citizen/map/page.tsx`, `components/colony/ColonyMap.tsx`, `lib/map-layout.ts`, `prisma/schema.prisma`, `prisma/seed.ts`

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Chaque service semé possède des coordonnées normalisées (mapX, mapY) et un sector ; buildMapServices les convertit en points de carte, avec un repli déterministe par secteur lorsque les coordonnées manquent. ColonyMap superpose à l'illustration terra-nova-map.webp des hotspots focusables (liens avec aria-label) qui révèlent secteur, nom, description et lien vers la fiche, plus une liste HTML équivalente. La carte est accessible depuis /citizen/map et depuis la vue Carte de /services.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

`/citizen/map`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec citoyen@terranova.fr / password123 et ouvrir /citizen/map.
2. Survoler ou tabuler jusqu'aux points : secteur, nom et description s'affichent dans le panneau.
3. Activer Consulter pour ouvrir la fiche du service correspondant.
4. Lire la liste des secteurs sous la carte, puis retrouver les mêmes points dans la vue Carte de /services.

---

## Régénérer ce fichier

```fish
gh issue list --state closed --limit 500 --repo etib-corp/deepsick-24h-webcup \
    --json number,title,body,closedAt
```
