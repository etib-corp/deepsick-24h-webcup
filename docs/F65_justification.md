# F65 — Participation : consultations sur les décisions de la ville

> **Besoin officiel (F65, Difficile, 1110 XP)** — Certaines décisions pourraient être soumises à l'avis des habitants. Cette participation doit être simple à comprendre et laisser une trace suffisamment claire pour que l'habitant sache que sa contribution a bien été prise en compte.

**Branche :** `78-feature-f-65-add-consultations-on-city-decisions`
**Commit :** `963c774` — « feat: implemtn consultations on city decisions »

**Emplacements dans le code :** `app/citizen/consultations/`, `app/citizen/contributions/`, `app/council/consultations/`, `app/operations/administration/consultations/`, `components/colony/ConsultationForm.tsx`, `components/colony/ConsultationOutcomeForm.tsx`, `components/colony/OpinionForm.tsx`, `components/colony/ConsultationOpinions.tsx`, `lib/actions/opinions.ts`, `lib/actions/admin.ts`, `lib/services.ts`, `lib/data.ts`, `prisma/schema.prisma` (+ migration `20261004150000_consultation_outcome_anonymity`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

_Décrivez concrètement ce que votre équipe a réalisé pour répondre à la demande._

Le Haut Conseil peut **ouvrir une consultation** sur une décision de la ville (titre, chapeau, contexte et question posée, ouverture/clôture prévues) depuis `/council/consultations`. Chaque habitant exprime **un avis simple à comprendre** : une position (Favorable / Défavorable / Neutre) et un commentaire.

Chaque critère d’acceptation est couvert :

- **Trace claire pour l’habitant** — chaque contribution reçoit une **référence lisible** (`OPN-5xx`), affichée dans l’accusé de réception (« Votre avis OPN-501 a bien été enregistré. »), sur la page de la consultation (« Référence de votre avis : OPN-501 ») et dans l’espace personnel **« Mes contributions »**. L’habitant ne peut donc jamais douter que sa contribution a été prise en compte.
- **Une seule participation par habitant** — contrainte d’unicité en base (`@@unique([consultationId, authorId])`) ; re-soumettre **met à jour** la contribution existante (même référence, une seule entrée). Une consultation clôturée n’accepte plus aucune soumission (contrôle serveur dans `submitOpinionAction`).
- **Clôture et résultat lisibles** — le Conseil enregistre un **résultat public** (texte libre) depuis la fiche de la consultation ; les habitants le lisent dans un encart mis en évidence une fois la consultation clôturée, avec un badge « Résultat disponible » dans la liste.
- **Anonymisation quand la consultation l’exige** — au moment de la création, le Conseil coche « Anonymiser les contributions ». Les vues agents/Conseil affichent alors « Contribution anonyme » au lieu du nom, tandis que l’habitant conserve son propre avis et voit la mention « Consultation anonyme ».
- **Les consultations clôturées restent consultables** — elles restent listées (après les consultations ouvertes), avec leur résultat, leur description et la contribution de l’habitant en lecture seule.

Côté **sécurité**, tout est vérifié serveur : seuls les `CITIZEN` soumettent un avis, seuls les `COUNCIL` créent/clôturent/ publient le résultat ; les routes sont également protégées par le middleware. L’interface est **localisée fr/en/es** comme le reste de la plateforme, et le jeu de démonstration (`prisma/seed.ts`) contient une consultation ouverte et une consultation clôturée/ anonymisée avec résultat, pour que le parcours soit démontrable sur une base fraîche.

Détails techniques et critères → code : `docs/F65_participation.md`.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Habitant** — liste des consultations : `/citizen/consultations` ; détail + avis : `/citizen/consultations/extension-secteur-05` ; trace de ses contributions : `/citizen/contributions`
- **Haut Conseil** — ouverture / clôture / résultat : `/council/consultations`
- **Agents d’administration** — lecture des avis (et de la synthèse) : `/operations/administration/consultations`

**Comptes de démonstration** (mot de passe `password123`) : habitant `citoyen@terranova.fr` — Conseil `conseil@terranova.fr` — agent `administration@terranova.fr`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. **Participer et recevoir sa trace** — connecté en habitant (`citoyen@terranova.fr`), ouvrir `/citizen/consultations/extension-secteur-05`, choisir une position, écrire un avis et envoyer : un accusé s’affiche avec la **référence** (`Votre avis OPN-5xx a bien été enregistré.`). La référence reste visible sur la page et dans `/citizen/contributions`.
2. **Impossible de participer deux fois** — modifier l’avis et renvoyer : la référence **ne change pas** et « Mes contributions » ne contient qu’**une seule entrée** pour cette consultation. La contrainte est aussi en base de données, pas seulement dans l’interface.
3. **Clôturer avec un résultat** — connecté en Conseil (`conseil@terranova.fr`), ouvrir `/council/consultations`, puis la fiche de la consultation : saisir le **« Résultat de la consultation »**, l’enregistrer, puis **« Clôturer »** dans la liste.
4. **Lire le résultat côté habitant** — de retour en habitant, la consultation apparaît **« Clôturée »** avec le badge **« Résultat disponible »** ; la fiche affiche le résultat dans un encart dédié, l’avis de l’habitant en lecture seule, et le formulaire a disparu.
5. **Anonymisation** — en Conseil, créer une consultation en cochant **« Anonymiser les contributions »**, puis laisser un habitant participer. Dans la fiche Conseil (ou `/operations/administration/consultations`), la contribution s’affiche comme **« Contribution anonyme »** (aucun nom), alors que l’habitant voit toujours son propre avis et la mention « Consultation anonyme ».
6. **Les clôturées restent consultables** — vérifier que la consultation clôturée reste présente dans `/citizen/consultations` (après les consultations ouvertes) et que sa fiche reste accessible en lecture seule.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `node --import tsx --test tests/breadcrumbs.test.ts tests/security.test.ts` (11 tests), migration appliquée via `npx prisma migrate deploy`.
