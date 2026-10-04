# F42 — Formulaires et composants utilisables avec les technologies d'assistance

> **Besoin officiel (F42, Difficile, 930 XP)** — Nos équipes d'inclusion ont testé plusieurs formulaires et composants interactifs de la plateforme. Certains restent difficiles à comprendre ou à utiliser avec des technologies d'assistance. Vérifiez que les actions essentielles, champs et messages d'erreur sont réellement accessibles.

**Branche :** `F21-screen-reader-accessibility` (PR #21)
**Commit :** `c8dadf2` — « feat: improve screen reader accessibility »

**Emplacements dans le code :** `components/ui/Field.tsx` (association libellés/aides), `components/ui/Alert.tsx` (rôle et focus des messages), `components/forms/*` (connexion, inscription, contact), `components/colony/ReportForm.tsx`, `components/colony/OrderForm.tsx`, `components/colony/AppointmentForm.tsx`, `components/colony/RequestStatusForm.tsx`, `components/colony/OrderStatusForm.tsx`, `app/council/users/page.tsx`, `lib/i18n/dictionaries/*` (libellés d'accessibilité), `docs/F21_accessibility.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Les formulaires et composants interactifs ont été revus **avec les technologies d'assistance**, sur les parcours essentiels :

- **Champs compréhensibles** — chaque contrôle a un **libellé associé** (`htmlFor`/`id` ou libellé englobant) ; les **aides et consignes sont reliées au champ** (`aria-describedby`) au lieu d'être seulement affichées à côté ; les groupes de choix utilisent `fieldset`/`legend`.
- **Messages d'erreur accessibles** — les erreurs sont annoncées avec le bon rôle (`role="alert"` pour les erreurs, `role="status"` pour les confirmations), chaque message est **atomique** et lisible par un lecteur d'écran ; les confirmations qui remplacent un formulaire **reçoivent le focus** (accusé de contact et de soumission).
- **Actions essentielles nommées** — les boutons icône (thème, langue, notifications) ont un nom accessible ; les galeries de thèmes incluent le nom du thème dans le bouton ; les sélecteurs de rôle (comptes) et de statut (commandes) sont étiquetés avec leur contexte.
- **États non visuels** — lecture/non-lu des notifications est doublé d'un texte lecteur d'écran ; l'état sélectionné des menus, filtres (`aria-pressed`) et navigation (`aria-current`) est exposé ; les alertes non urgentes ne sont plus annoncées comme urgentes.
- **Traces d'options dans le nom accessible** — les contrôles répétés (« Appliquer » d'une galerie) sont contextualisés (« Appliquer le thème Nébuleuse »).

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Formulaires clés** : `/login`, `/register`, `/contact`, `/citizen/report`, `/citizen/orders`, `/citizen/appointments/nouveau`.
- **Composants** : `/council/users` (sélecteurs de rôle), `/citizen/notifications` (états), en-têtes (menus thème/langue).
- **Détail de l'audit et des fichiers** : `docs/F21_accessibility.md`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Lecteur d'écran (VoiceOver/NVDA)** — sur `/contact` : tabuler dans le formulaire ; chaque champ annonce son libellé **et** son aide ; soumettre un champ invalide : l'erreur est annoncée ; après envoi réussi, l'accusé (avec référence) reçoit le focus et est lu.
2. **Connexion** — sur `/login`, l'erreur de connexion est annoncée comme alerte ; le bouton « Clé biométrique » désactivé est ignoré proprement.
3. **Inspection** — dans les outils développeur / arbre d'accessibilité : vérifier `aria-describedby` sur un champ, `role=alert`/`status` sur les messages, les noms accessibles des boutons icône et des sélecteurs de rôle/statut.
4. **Parcours complet** — créer un signalement et une commande au lecteur d'écran : chaque étape reste utilisable et la confirmation est identifiable.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; audit F21 : 23 routes vérifiées (axe-core A/AA sans violation hors contraste — corrigé par F23) et 17 assertions ciblées.
