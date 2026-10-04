# F57 — Limiter l'impact environnemental de la plateforme

> **Besoin officiel (F57, Moyenne, 700 XP)** — La ville souhaite limiter l'impact environnemental de sa plateforme numérique. Il est demandé d'évaluer la performance environnementale du site et d'améliorer sa légèreté. La plateforme doit rester agréable à utiliser dans des conditions moins favorables, sans sacrifier les informations et actions essentielles.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `app/(public)/eco/page.tsx` (évaluation + mesures), `lib/lite-mode.ts` + `lib/lite-cookie.ts` (mode allégé), `components/layout/LiteModeToggle.tsx`, `components/layout/LiteModeAuto.tsx`, `app/layout.tsx` (`data-lite`), `app/globals.css` (règles du mode allégé), pied de page (`/eco`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Évaluation transparente** — la page `/eco` publie une estimation par type de page (poids transféré mesuré → énergie → gCO₂e pour 1 000 visites) avec la méthode explicitée (0,8 kWh/GB × 442 gCO₂e/kWh), révisable.
- **Légèreté mesurée et documentée** — une seule image bitmap sur tout le site, décor en CSS/SVG, animations conditionnelles, cache serveur (acquis F60/F61/F77/F78, rappelés sur la page).
- **Mode allégé** — bascule manuelle et détection automatique (économiseur de données, 2G/3G) : animations coupées, carte chargée sur demande, contenus décoratifs masqués (mutualisé avec F59/F62/F96).
- **Sans perte d'essentiel** — le mode allégé conserve navigation, services, annonces, contact et consignes ; il ne retire que le décor.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/eco` (bouton « Mode allégé » en bas de page et dans le pied de page).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Ouvrir `/eco`** — le tableau d'estimation et les mesures sont affichés, méthode comprise.
2. **Activer le mode allégé** — l'accueil perd son décor animé, la page Services s'ouvre en liste, les entrées d'animation disparaissent.
3. **Vérifier la sobriété** — dans l'onglet Réseau, recharger en mode allégé : moins d'octets transférés et aucune animation superflue.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
