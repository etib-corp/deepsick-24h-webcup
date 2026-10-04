# F94 — Consulter l'essentiel pendant un incident

> **Besoin officiel (F94, Moyenne, 880 XP)** — Lorsqu'un incident touche la plateforme, je n'ai pas forcément besoin de tout faire. Je voudrais au moins continuer à consulter les informations essentielles, les consignes et les coordonnées utiles.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** page `app/(public)/statut/page.tsx` (contacts essentiels, consignes en cours, dernières annonces, liens directs ; lectures en `try/catch` avec repli statique), `components/layout/OfflineNotice.tsx` (bandeau hors-ligne, monté dans `app/layout.tsx`), `app/global-error.tsx` (dernière frontière, styles inline, sans dépendance), pied de page + fil d'Ariane (`/statut`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Page « État du service »** — regroupe les contacts essentiels (Sécurité 100, Médical 112, Maintenance 115, Administration 101), les consignes en cours (diffusions actives) et les dernières annonces, avec liens directs vers services/annonces/contact.
- **Résiliente par construction** — chaque lecture de données est best-effort : si la base ou une fonction tombe, la page affiche quand même les contacts statiques et l'explication du mode dégradé.
- **Internet coupé** — un bandeau discret apparaît automatiquement (`navigator.onLine`) et renvoie vers les informations essentielles.
- **Dernière frontière** — `app/global-error.tsx` remplace l'application si le rendu plante : erreur sobre, consignes et contacts, bouton « Réessayer », styles embarqués (aucune dépendance à l'application ni au thème).
- **Toujours trouvable** — lien « État du service » dans le pied de page public.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/statut` (aucune connexion requise ; consignes seedées : crue secteur sud, vague de chaleur, tempête de poussière).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Ouvrir `/statut`** — contacts essentiels, consignes en cours et annonces s'affichent sur un seul écran.
2. **Simuler la coupure** — DevTools → Network → « Offline » : le bandeau « Connexion perdue. Mode dégradé… » apparaît ; la page `/statut` déjà chargée reste lisible.
3. **Simuler la panne** — couper la base (ou observer une route en erreur) : `/statut` renvoie toujours les contacts statiques ; `global-error` ne montre jamais de trace technique.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
