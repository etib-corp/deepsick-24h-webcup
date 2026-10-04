# F96 — Pages adaptées au mobile et aux connexions limitées

> **Besoin officiel (F96, Moyenne, 880 XP)** — Sur mobile et avec une connexion limitée, certaines pages restent trop lourdes. J'aimerais accéder à l'essentiel rapidement, avec une présentation adaptée qui évite les contenus non indispensables.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `components/layout/LiteModeAuto.tsx` (auto-activation sur `saveData`/2G/3G), `lib/lite-cookie.ts` + `lib/lite-mode.ts` (cookie `nt-lite`, rendu serveur), `app/layout.tsx` (`data-lite`), `app/globals.css` (`[data-lite-hide]` masqué, animations coupées), `app/(public)/page.tsx` (décor et tutoriels masqués), `components/public/ServicesView.tsx` (liste par défaut, carte sur demande), pied de page (bascule)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Présentation adaptée sur mobile/connexion limitée** — dès que le navigateur signale l'économiseur de données ou un réseau 2G/3G, le mode allégé s'active automatiquement ; il fonctionne évidemment aussi sur mobile en un clic.
- **Éviter les contenus non indispensables** — en mode allégé : la scène décorative de l'accueil et la carte des tutoriels ne sont plus rendues, la carte interactive des services n'est chargée que si on la demande (liste par défaut), les entrées animées sont coupées.
- **L'essentiel reste en premier** — services, annonces, demandes, contact et consignes (/statut) conservent exactement la même structure et les mêmes actions.
- **Choix respecté** — un choix explicite de l'utilisateur (mode complet) n'est jamais écrasé par la détection automatique ; la préférence est mémorisée en cookie et appliquée côté serveur.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Mobile** : émulation « iPhone/Pixel » dans DevTools + « Slow 3G » ; vider le cookie `nt-lite` et recharger.
- **Public** : bascule « Mode allégé » dans le pied de page.

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Simuler mobile + data-saver** — DevTools en 3G, économiseur de données activé (ou `navigator.connection.saveData`), recharger `/` : le mode allégé s'active seul, la page est plus légère.
2. **Comparer le poids** — onglet Réseau : en mode allégé, la scène et la carte (image `terra-nova-map.webp`) ne sont plus transférées tant qu'on ne les demande pas.
3. **Vérifier la réversibilité** — « Mode complet » dans le pied de page restaure immédiatement la version riche.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
