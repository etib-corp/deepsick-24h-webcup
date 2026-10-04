# F43 — Couleurs lisibles et information jamais portée par la seule couleur

> **Besoin officiel (F43, Facile, 310 XP)** — J'ai du mal à distinguer certaines couleurs sur la plateforme. L'objectif est que ce besoin améliore réellement l'usage de la plateforme, sans isoler ces utilisateurs dans un parcours incomplet.

**Branche :** `F23-F24-accessibility-readability` (PR #19)
**Commit :** `604735d` — « fix: improve accessibility »

**Emplacements dans le code :** `app/globals.css` (tokens de contraste, anneau de focus), `components/ui/Badge.tsx`, `components/ui/StatusBadge.tsx`, `components/shadcn/button.tsx`, `components/colony/ConsoleShell.tsx`, `components/layout/PublicHeader.tsx`, `components/colony/IncidentConsole.tsx` (états de filtre), `docs/F23_F24_accessibility.md`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Les contrastes ont été mesurés avec axe-core sur 19 pages, puis corrigés **dans tous les thèmes** :

- **Contrastes corrigés** — les tokens de couleurs (primaire, info, destructif, graphiques, textes secondaires) ont été ajustés thème par thème, y compris les **thèmes clairs** (« Grand Jour », « Paper Terminal ») : badges ouverts/info/warning/success, indicateurs « Colonie nominale », bordure des champs éditables. Les ratios passent le seuil WCAG AA (4,5:1) sur les parcours audités.
- **Jamais la couleur seule** — les statuts et priorités restent portés par des **badges + libellés localisés** (ex. « En traitement », « Urgente ») ; les filtres actifs de la console ajoutent un **soulignement** et `aria-pressed` à la couleur ; la navigation courante est soulignée et exposée (`aria-current`).
- **États sûrs au survol/focus** — boutons primaires à fond opaque au survol, anneau de focus commun visible sur tous les fonds, compteurs de notification lisibles dans chaque thème.
- **Vérifié sur les 10 thèmes** — l'accueil et le tableau de bord citoyen ont été contrôlés dans les dix thèmes ; l'audit final ne relève plus de violation de contraste sur les routes testées.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Choix de thème** : `/apparence` (galerie) ou le sélecteur de thème dans l'en-tête.
- **Éléments concernés** : badges de statut sur `/citizen/reports`, `/citizen/requests`, `/operations/administration` ; filtres sur `/operations/security`.
- **Détail des mesures** : `docs/F23_F24_accessibility.md` (tableau des ratios avant/après).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Changer de thème** — passer sur les thèmes clairs (« Grand Jour », « Paper Terminal ») puis sombres : les badges de statut, les messages d'alerte et les boutons gardent un texte lisible.
2. **Vérifier la double information** — sur un signalement (« En cours », « Ouvert »…), constater que le **libellé** est toujours écrit à côté de la couleur.
3. **Filtres de console** — sur `/operations/security`, activer un filtre : la couleur **et** le soulignement (plus `aria-pressed`) indiquent l'état.
4. **Mesurer** — lancer un audit axe-core (Lighthouse ou extension) sur `/`, `/services`, `/citizen` dans au moins trois thèmes : aucun problème de contraste n'est remonté sur ces pages.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; audit axe-core documenté (19 pages × thèmes, mesures avant/après dans `docs/F23_F24_accessibility.md`).
