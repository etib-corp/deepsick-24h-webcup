# F59 — Rester utilisable sur une connexion lente

> **Besoin officiel (F59, Moyenne, 700 XP)** — Ma connexion est très lente dans mon quartier. La plateforme met longtemps à charger. Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `components/layout/LiteModeAuto.tsx` (détection `navigator.connection` : `saveData`, `effectiveType` 2G/3G → bascule automatique), `lib/lite-mode.ts` (`isLiteMode`), `app/layout.tsx` (`data-lite`), `app/globals.css` (animations coupées), `app/(public)/page.tsx` (décor retiré), `components/public/ServicesView.tsx` (liste par défaut), `app/(public)/eco/page.tsx` (explication)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Détection concrète de la connexion** — `LiteModeAuto` lit l'API Network Information : si l'économiseur de données est actif ou si le réseau est en 2G/3G, le mode allégé est activé automatiquement (sauf choix explicite de l'utilisateur, qui prime toujours).
- **Chargement allégé sans explication technique** — décor animé supprimé, animations d'entrée désactivées par CSS, page Services ouverte directement en liste (la carte n'est chargée que si on la demande), contenu essentiel identique.
- **Choix visible et réversible** — bouton « Mode allégé / Mode complet » dans le pied de page et sur `/eco`, persisté en cookie.
- **Le reste du socle aide déjà** — cache serveur et requêtes regroupées (F77/F78), une seule image bitmap (F60) : le mode allégé s'ajoute sans remplacer.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : n'importe quelle page ; la bascule est dans le pied de page.
- **Démo technique** : Chrome → DevTools → Network → « Slow 4G/3G » + case « Disable cache », vider le cookie `nt-lite`, recharger.

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Simuler un réseau lent** — DevTools en 3G, effacer le cookie `nt-lite`, recharger : le mode allégé s'active tout seul (l'attribut `data-lite="1"` apparaît sur `<html>`).
2. **Comparer** — désactiver le mode allégé : le décor et les animations reviennent.
3. **Vérifier le choix utilisateur** — activer « Mode complet » puis recharger en 3G : le mode complet est conservé (le choix explicite gagne).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
