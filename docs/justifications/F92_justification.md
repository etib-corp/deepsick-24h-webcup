# F92 — Être orienté vers le bon service à partir d'une description simple

> **Besoin officiel (F92, Moyenne, 860 XP)** — Je sais expliquer mon problème, mais je ne sais pas quel service municipal est compétent. J'aimerais décrire mon besoin simplement et être orientée vers le bon service ou la bonne démarche.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `lib/orientation.ts` (moteur déterministe `orientServices`), `components/public/ServiceFinder.tsx` (formulaire client), intégration en tête de `app/(public)/services/page.tsx`, `tests/orientation.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Décrire son besoin avec ses mots** — en haut de `/services`, un champ « Votre situation » accepte une phrase libre (« Un lampadaire est cassé dans ma rue ») et renvoie jusqu'à trois services pertinents, cliquables.
- **Orientations compréhensibles** — chaque résultat affiche le service, sa catégorie et les « mots reconnus » (ex. « lampadaire, voirie »), donc l'habitant comprend pourquoi on l'oriente là.
- **Aucune dépendance à une IA externe** — moteur déterministe et explicable : lexique français par service (santé, sécurité, voirie, transport, commerce, démarches) + recouvrement avec le nom, la catégorie et la description du service.
- **Sans réponse claire** — si rien ne correspond, le message propose de reformuler ou de contacter l'administration (lien direct), et la liste complète des services reste en dessous.
- **Testé** — six cas couverts (`tests/orientation.test.ts`) : voirie, santé, démarches, transport, hors-sujet, saisie trop courte.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/services` — encadré « Vous ne savez pas quel service choisir ? » ; trois exemples cliquables sont proposés.

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Décrire** — saisir « Un lampadaire est cassé dans ma rue » : Infrastructure est proposé avec « mots reconnus : lampadaire ».
2. **Essayer santé** — « Je cherche un médecin pour mon enfant » → Soins médicaux ; « attestation de résidence » → Démarches administratives.
3. **Hors-sujet** — une phrase sans rapport affiche le message d'aide et le lien vers le contact, sans résultat trompeur.
4. **Cliquer un résultat** — la fiche du service s'ouvre pour agir immédiatement.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
