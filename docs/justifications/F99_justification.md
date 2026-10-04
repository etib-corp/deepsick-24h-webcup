# F99 — Partenaires extérieurs proposant leurs services

> **Besoin officiel (F99, Difficile, 1350 XP)** — Des partenaires extérieurs souhaitent proposer leurs services aux habitants via la plateforme de la ville. L'habitant doit pouvoir identifier rapidement ce qui est disponible, ce qui ne l'est pas et la prochaine action possible.

**Emplacements dans le code :** `app/(public)/partenaires/page.tsx` (annuaire public), `app/council/partners/page.tsx` (gestion Conseil), `components/colony/PartnerForm.tsx`, `lib/actions/partners.ts`, `lib/partners.ts` (disponibilité calculée), modèle `Partner`, `tests/partners.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **annuaire de partenaires** alimenté par le Conseil, lisible côté habitant :

- **Ce qui est disponible, maintenant** — chaque partenaire a une **fenêtre d'ouverture optionnelle** ; la disponibilité est **calculée à l'affichage** : badge « Disponible » + « Ferme à 17:00 », ou « Fermé » + « Ouvre à 09:00 » pour ceux à venir. Les fenêtres passant minuit sont gérées ; sans horaire, « Disponible en permanence ». La page sépare « **Disponibles maintenant** » et « **Actuellement indisponibles** ».
- **La prochaine action possible** — chaque carte porte une **action concrète** (« Demander un devis », « Prendre rendez-vous »…) avec son lien, plus le contact et la description en une phrase.
- **Pilotage par le Conseil** — `/council/partners` permet de **publier** un partenaire (nom, catégorie, description, contact, libellé/lien d'action, ouverture/fermeture), de le **masquer** (il disparaît de l'annuaire) ou de le supprimer ; chaque opération est journalisée (`CONTENT_CHANGED`).
- **Démonstrable** — trois partenaires semés (assurance, recyclage privé, fret orbital) dont un disponible en permanence ; la disponibilité (dont fenêtres de nuit) est couverte par 5 tests unitaires.

### URL ou emplacement pour tester la fonctionnalité

- Public : **`/partenaires`** (aussi via le menu « Plus » → Explorer).
- Conseil : **`/council/partners`** (`conseil@terranova.fr` / `password123`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/partenaires` : « Disponibles maintenant » liste Phoenix Assurance (« Ferme à 17:00 »), Aqua Vitae (« Ferme à 22:00 ») et Orbit Express (« Disponible en permanence »), chacun avec son action.
2. Se connecter en Conseil sur `/council/partners`, **masquer** un partenaire puis rafraîchir `/partenaires` : il a disparu ; le réafficher : il revient.
3. Publier un nouveau partenaire avec une fenêtre **passée** (ex. 02:00–03:00) : il apparaît côté habitant dans « Actuellement indisponibles » avec « Ouvre à 02:00 ».

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/partners.test.ts` (5 OK, dont fenêtre de nuit) — parcours vérifié en navigateur.
