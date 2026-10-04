# F35 — Des indications au bon moment pour les premières actions

> **Besoin officiel (F35, Facile, 290 XP)** — Bonjour, je viens d'arriver à Nova Terra et je découvre la plateforme. Je comprends les grandes rubriques, mais quelques indications au bon moment m'aideraient à effectuer mes premières actions sans devoir lire un long guide.

**Branche :** `feat/add-tutorial` (PR #43)
**Commit :** `ad7a9f9` — « feat: add tutorial »

**Emplacements dans le code :** `lib/tour.ts` (leçons et étapes), `components/tour/TourProvider.tsx` (moteur du tutoriel), `components/tour/TourLauncher.tsx` / `TourMenu.tsx` (points d'entrée), `app/(public)/guide/page.tsx` (guide écrit), `components/guide/GuideExplorer.tsx`, attributs `data-tour` dans le balisage

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

La plateforme embarque un **tutoriel interactif « pas à pas »** qui guide l'utilisateur directement dans l'interface réelle — pas une page de documentation :

- **Des indications au bon moment** — chaque leçon met en **surbrillance l'élément exact** à utiliser (le reste de la page est bloqué), affiche une consigne courte, et l'étape s'avance quand l'utilisateur **fait réellement l'action** (ou via « Suivant »). Pas de guide à lire : on apprend en faisant.
- **Une leçon par profil** — « Découvrir la ville » (public : services, annonce, guide), « Citoyen » (faire une première demande / un signalement), consoles de service et Conseil (traiter un dossier, publier une annonce). `canStartLesson(role, id)` masque les leçons non accessibles à chaque profil.
- **Accessible et robuste** — navigation clavier, `role="dialog"`, texte annoncé (`aria-live`), sortie par `Esc`, respect de `prefers-reduced-motion` ; l'état survit aux changements de page (`sessionStorage`).
- **Complément écrit** — `/guide` propose les mêmes parcours en version lisible, avec le tutoriel interactif en point d'entrée ; le tour est lancé depuis l'accueil, `/guide` et chaque espace personnel.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Accueil (visiteur)** : `/` → carte « Tutoriel interactif » → « Lancer la visite ».
- **Citoyen** : `/citizen` → bouton « Tutoriel interactif » dans l'en-tête.
- **Guide écrit** : `/guide`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Visiteur** — ouvrir `/` sans compte : la carte « Tutoriel interactif » propose « Découvrir la ville ». La lancer : l'écran s'assombrit, le premier élément (par ex. le bouton « Découvrir les services ») est surligné avec une consigne ; cliquer dessus **navigue réellement** vers `/services` et la leçon continue.
2. **Habitant** — se connecter (`citoyen@terranova.fr` / `password123`), lancer la visite « Citoyen » depuis `/citizen` : elle guide vers le formulaire de signalement et sa première action.
3. **Se repérer** — vérifier qu'à chaque étape le reste de la page est neutralisé, que « Suivant »/« Quitter » restent accessibles et que `Esc` termine la visite.
4. **Contrôle des droits** — un visiteur ne voit que la leçon publique ; les leçons de console ne sont proposées qu'aux profils concernés (et listées verrouillées sur `/guide`).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`.
