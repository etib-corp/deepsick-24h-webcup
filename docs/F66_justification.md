# F66 — Donner son avis sur les projets de la ville (sans vote officiel)

> **Besoin officiel (F66, Moyenne, 740 XP)** — J'aimerais pouvoir donner mon avis sur certains projets de Nova Terra sans que cela soit forcément un vote officiel. Un moyen simple de répondre à une consultation et de savoir que mon avis a été enregistré serait utile.

**Branche :** `79-feature-f-66-collect-opinions-on-city-projects` (PR #95)
**Commit :** `434e263` — « feat: add citizen opinions on city projects »

**Emplacements dans le code :** `app/citizen/consultations/page.tsx` + `[slug]/page.tsx`, `app/citizen/contributions/page.tsx`, `components/colony/OpinionForm.tsx`, `lib/actions/opinions.ts` (`submitOpinionAction`), `lib/services.ts` (`upsertOpinion`), `app/council/consultations/*`, `app/operations/administration/consultations/*`, modèle `Opinion` (`prisma/schema.prisma`), `prisma/seed.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Les **consultations citoyennes** permettent de donner un avis **non contraignant** (ce n'est pas un vote), avec une trace claire :

- **Répondre simplement** — sur `/citizen/consultations`, chaque projet ouvert propose une position simple (**Favorable / Défavorable / Neutre**) et un commentaire ; un seul écran suffit.
- **Savoir que l'avis est enregistré** — chaque contribution reçoit une **référence lisible** (`OPN-5xx`), affichée dans l'accusé (« Votre avis OPN-501 a bien été enregistré. »), sur la page du projet, et dans **« Mes contributions »** (`/citizen/contributions`). L'habitant retrouve donc toujours la preuve que sa contribution a été prise en compte.
- **Une seule contribution, modifiable** — la contrainte d'unicité `@@unique([consultationId, authorId])` garantit **une contribution par habitant et par projet** ; re-soumettre **met à jour** l'avis existant (même référence, pas de doublon).
- **Des projets à consulter** — le Conseil ouvre les consultations (`/council/consultations`) avec description et contexte ; les projets clôturés restent consultables avec leur résultat public ; les agents d'administration peuvent lire les avis (`/operations/administration/consultations`), avec option d'anonymat (F65).
- **Localisé et sûr** — interface fr/en/es ; seuls les `CITIZEN` soumettent un avis, vérifié serveur ; une consultation clôturée n'accepte plus de contribution.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Habitant** : `/citizen/consultations` → `/citizen/consultations/extension-secteur-05` ; contributions : `/citizen/contributions`.
- **Conseil** : `/council/consultations` (`conseil@terranova.fr` / `password123`).
- **Comptes** : habitant `citoyen@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Donner un avis** — connecté en habitant, ouvrir `/citizen/consultations/extension-secteur-05`, choisir une position, écrire un commentaire et envoyer : l'accusé affiche la **référence** (`Votre avis OPN-5xx a bien été enregistré.`).
2. **Retrouver la trace** — la référence reste visible sur la page du projet et dans `/citizen/contributions`, avec le statut du projet.
3. **Vérifier l'unicité** — modifier l'avis et renvoyer : **même référence**, une seule entrée dans « Mes contributions » (la contrainte est aussi en base).
4. **Voir le parcours complet** — en Conseil, ouvrir une consultation et consulter les avis reçus ; clôturer avec un résultat puis vérifier que le projet clôturé reste consultable côté habitant (avis en lecture seule).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont 15 contributions concurrentes donnant une seule entrée).
