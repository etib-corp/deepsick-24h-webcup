# F62 — Version plus simple et plus rapide de certaines pages

> **Besoin officiel (F62, Moyenne, 720 XP)** — Serait-il possible d'avoir une version plus simple et plus rapide de certaines pages ? Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `components/layout/LiteModeToggle.tsx` (bascule persistée en cookie `nt-lite`), `lib/lite-mode.ts` + `lib/lite-cookie.ts`, `app/layout.tsx` (`data-lite` sur `<html>`), `app/globals.css` (animations coupées, `[data-lite-hide]` masqué), `app/(public)/page.tsx` (décor et carte tutorielle masqués), `components/public/ServicesView.tsx` (vue liste par défaut), `app/(public)/eco/page.tsx` (explications)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Une version allégée, à un clic** — le bouton du pied de page (et de `/eco`) bascule la plateforme en mode allégé ; le choix est mémorisé et s'applique dès le rendu serveur suivant.
- **Des pages réellement plus simples** — accueil sans scène décorative ni carte de tutoriels, services en liste (la carte interactive n'est chargée que sur demande), animations d'entrée désactivées globalement.
- **Sans jargon** — l'explication tient en une phrase sur `/eco` : « Réduit les animations et les contenus non essentiels — utile en connexion lente. »
- **Réversible et compatible** — aucune donnée perdue, l'essentiel (services, annonces, demandes, contacts) reste identique ; le mode est compatible avec les trois langues et tous les thèmes.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : bascule « Mode allégé » dans le pied de page ; pages comparables : `/`, `/services`, `/projects`, `/transport`.

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Activer le mode allégé** depuis le pied de page — l'accueil et la liste des services se rechargent en version simple.
2. **Vérifier l'allègement** — la scène d'accueil et la carte des services ne sont plus rendues ; les animations ont disparu (comparer l'onglet Réseau avant/après).
3. **Revenir en mode complet** — un clic suffit, l'affichage riche revient.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
