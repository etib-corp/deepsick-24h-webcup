# D20 — Plateforme utilisable par tous, y compris en situation de handicap

> **Besoin officiel (D20, Difficile, 930 XP)** — La plateforme doit être utilisable par tous les habitants, y compris les personnes en situation de handicap. L'objectif est que ce besoin améliore réellement l'usage de la plateforme, sans isoler ces utilisateurs dans un parcours incomplet.

**Branche :** `F21-screen-reader-accessibility` (PR #21) + `F23-F24-accessibility-readability` (PR #19)
**Commit :** `c8dadf2` — « feat: improve screen reader accessibility » ; `604735d` — « fix: improve accessibility »

**Emplacements dans le code :** `components/layout/SkipLink.tsx`, `components/ui/Field.tsx`, `components/ui/Alert.tsx`, `components/layout/PublicHeader.tsx`, `components/colony/ConsoleShell.tsx`, `app/globals.css` (contrastes, tailles en `rem`, focus), `components/colony/ColonyMap.tsx` (alternative liste), `lib/motion.ts` + `components/motion/Reveal.tsx` (reduced motion), `docs/F21_accessibility.md`, `docs/F23_F24_accessibility.md`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

L'accessibilité est traitée **de façon transverse sur les parcours réels**, sans « parcours handicapé » séparé :

- **Voir** — contrastes mesurés et corrigés dans **tous les thèmes** (y compris clairs) ; information jamais portée par la seule couleur (badges + libellés, états soulignés) ; le contenu grossit sans casser l'affichage (testé à 200 %/400 % de zoom et 32 px de texte).
- **Naviguer** — parcours complet **au clavier** : lien d'évitement, focus visible partout, menus accessibles (flèches, Échap, retour du focus), filtres avec `aria-pressed`.
- **Comprendre** — libellés et aides reliés aux champs, erreurs annoncées (`role=alert`), confirmations focalisées, noms accessibles sur tous les contrôles icône, texte simplifié là où il faut (arrivants F71).
- **Mouvement** — `prefers-reduced-motion` coupe les animations ; le contenu n'est **jamais** masqué par une animation non jouée (les bibliothèques d'animation rendent l'état final).
- **Alternatives** — la carte des services dispose d'une **liste HTML** équivalente ; les images décoratives sont ignorées des technologies d'assistance ; la visite interactive reste pilotable au clavier.
- **Portée** — audits documentés : 23 routes (axe-core A/AA, sans violation de contraste après corrections), 19 pages testées en reflow (1280/640/320 px, 16/32 px), 17 assertions clavier/lecteur d'écran ciblées ; vérifications restantes humaines listées honnêtement dans les documents.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Pages de référence** : `/`, `/services` (+ fiche), `/contact`, `/login`, `/citizen`, `/operations/security`.
- **Thèmes de contraste** : `/apparence` → « Grand Jour », « Paper Terminal » (clairs), « Mars Civic OS » (défaut).
- **Documents d'audit** : `docs/F21_accessibility.md`, `docs/F23_F24_accessibility.md`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Clavier seul** — sur `/` puis `/services`, naviguer uniquement au clavier (Tab, Entrée, Échap, flèches) : toutes les actions sont atteignables, le focus est toujours visible ; le lien d'évitement saute au contenu.
2. **Lecteur d'écran** — sur `/contact`, remplir le formulaire au lecteur d'écran : libellés, aides et erreurs sont annoncés ; l'accusé de réception est focalisé et lu.
3. **Zoom et contraste** — agrandir à 200 %/400 % sur `/citizen` : pas de débordement ; basculer sur « Grand Jour » et vérifier la lisibilité des badges et alertes.
4. **Mouvement réduit** — activer « Réduire les animations » dans le système : les pages restent complètes et lisibles, sans élément bloqué en état masqué.
5. **Alternative carte** — sur `/services`, passer en vue « Liste » : mêmes informations que la carte.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build` ; audits axe-core et reflow documentés (23 routes / 19 pages) dans `docs/F21_accessibility.md` et `docs/F23_F24_accessibility.md`.
