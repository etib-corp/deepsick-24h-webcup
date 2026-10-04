# F76 — Laisser un commentaire après avoir utilisé un service

> **Besoin officiel (F76, Moyenne, 780 XP)** — J'aimerais laisser un commentaire après avoir utilisé un service. Cette participation doit être simple à comprendre et laisser une trace suffisamment claire pour que l'habitant sache que sa contribution a bien été prise en compte.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** modèle `ServiceFeedback` (`prisma/schema.prisma`), `lib/services.ts` (`upsertServiceFeedback`), `lib/data.ts` (`getFeedbacksByService`, `getFeedbackByAuthorAndService`), `lib/actions/feedback.ts`, formulaire `components/public/ServiceFeedbackForm.tsx`, section « Avis des habitants » sur `app/(public)/services/[slug]/page.tsx`, seed (2 avis)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Commentaire intégré à la fiche service** — une section « Avis des habitants » liste les derniers commentaires ; le formulaire est affiché aux citoyens connectés, avec lien « Connectez-vous pour laisser un commentaire » sinon.
- **Trace claire** — après envoi, un message de confirmation « Merci ! Votre commentaire est enregistré. » s'affiche, et le commentaire apparaît immédiatement dans la liste avec auteur et date.
- **Un commentaire par habitant, modifiable** — `@@unique([serviceId, authorId])` + `upsert` : le formulaire se pré-remplit du commentaire existant ; on peut le corriger à tout moment sans créer de doublon.
- **Cadre serveur** — dépôt réservé aux citoyens, texte validé (5–1 200 caractères, entrées neutralisées et auditées), erreurs génériques sans fuite technique.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Citoyen** : `/services/medical` (compte `citoyen@terranova.fr` / `password123` ; avis déjà déposés sur Médical et Transport).
- **Visiteur** : même page sans connexion → liste publique + invitation à se connecter.

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Lire les avis** — ouvrir `/services/transport` : deux commentaires seedés s'affichent (dont celui d'Iris Halden), visibles sans connexion.
2. **Commenter** — se connecter en citoyen, saisir un commentaire sur `/services/medical` : confirmation immédiate et commentaire visible.
3. **Modifier** — recharger la page : le formulaire est pré-rempli ; corriger le texte et envoyer : le même commentaire est mis à jour (pas de doublon).

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
