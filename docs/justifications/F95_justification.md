# F95 — Réduire les chargements et requêtes inutiles

> **Besoin officiel (F95, Difficile, 1320 XP)** — Nos mesures montrent que certaines pages chargent encore trop de ressources et déclenchent des requêtes inutiles. Réduisez ce qui n'est pas nécessaire afin de conserver une plateforme plus sobre et plus efficace.

**Emplacements dans le code :** `components/layout/BroadcastMessages.tsx` (sondage adaptatif + pause onglet masqué), `components/layout/PublicFooter.tsx` (préchargement désactivé), `app/globals.css` (`.cv-auto`), `app/(public)/page.tsx` (sections hors écran), `lib/motion.ts` (scripts d'animation en mode allégé), `lib/actions/feed.ts` (un seul aller-retour pour bandeau + alertes)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Quatre réductions mesurables sur les parcours principaux :

1. **Sondage adaptatif du bandeau d'information** — le rafraîchissement (bandeau du Conseil **et** alertes de colonie, dans un seul aller-retour serveur) passe de 5 s à **30 s dès qu'aucun changement n'est survenu depuis 60 s**, se met en **pause complète quand l'onglet est masqué**, et redevient immédiat au retour sur l'onglet. Sur une visite de 10 minutes sans changement : **~120 requêtes évitées** (contre 120 sondaies à 5 s).
2. **Zéro requête de préchargement inutile** — les liens du pied de page (toujours montés, rarement utilisés : ~10 liens) sont en `prefetch={false}` : le navigateur ne déclenche plus une dizaine de requêtes RSC d'anticipation par visite. Le préchargement reste actif sur la navigation principale.
3. **Rendu hors écran à la demande** — les sections basses de l'accueil (`content-visibility: auto`, classe `.cv-auto`) sont ignorées par le navigateur tant qu'elles ne sont pas approchées : moins de mise en page et de peinture au premier affichage, sans changement visuel.
4. **Scripts d'animation uniquement là où ils servent** — anime.js n'est importé que par l'accueil et les consoles ; en **mode allégé** (économiseur de données) les helpers d'animation deviennent des no-ops complets — aucun script d'animation ne s'exécute.

Le partage du JS reste stable (**87,4 kB** First Load partagé) et les nouvelles pages lourdes restent par construction dynamiques (`ƒ`) avec cache serveur et requêtes regroupées (F77/F78) conservés.

### URL ou emplacement pour tester la fonctionnalité

Toutes les pages publiques (bandeau + pied de page) ; mesures visibles dans le build (`npx next build`) et l'onglet Réseau du navigateur.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/` ou `/eco`, laisser l'onglet actif 2–3 minutes : dans l'onglet Réseau, les POST du bandeau s'espacent (5 s puis 30 s) puis **s'arrêtent** onglet masqué ; le retour sur l'onglet relance immédiatement.
2. Constater qu'aucune requête n'est émise pour les liens du pied de page au chargement (`prefetch` désactivé), alors que la navigation principale se précharge toujours.
3. `npx next build` : les poids par route restent contenus et la page `/eco` détaille ces choix (« Choix de conception appliqués », F58).

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/*.test.ts` (88 OK) ; parcours vérifiés en navigateur.
