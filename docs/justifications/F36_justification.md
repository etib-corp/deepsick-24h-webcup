# F36 — Horaires et infos des transports municipaux

> **Besoin officiel (F36, Moyenne, 580 XP)** — Les habitants doivent pouvoir consulter les horaires et infos des transports municipaux. L'habitant doit pouvoir comprendre rapidement l'information utile à sa situation et agir sans devoir parcourir plusieurs écrans.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `lib/transit.ts` (lignes, arrêts, fréquences, `nextDepartures`, `isLineRunning`), `app/(public)/transport/page.tsx` (page publique), `app/(public)/services/[slug]/page.tsx` (lien depuis le service Transport), `components/layout/PublicFooter.tsx`, `lib/breadcrumbs.ts`, `tests/transit.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Trois lignes Hermes lisibles en un écran** — chaque carte affiche la ligne, ses arrêts dans l'ordre, la fréquence, l'état « En service / Hors service » et les trois prochains départs calculés à l'instant de la consultation (`nextDepartures`).
- **Action immédiate** — un lien direct « Commander un rover » mène à la commande de trajet citoyenne, sans quitter le parcours.
- **Accès naturel** — la page est liée depuis la fiche du service « Transport & logistique », depuis le pied de page public et le fil d'Ariane ; aucune navigation profonde.
- **Logique testée** — départs suivants, départ exact à l'instant, fin de service et reprise matinale sont couverts par `tests/transit.test.ts`.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Public** : `/transport` (aucune connexion requise).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Ouvrir `/transport`** — les trois navettes s'affichent avec arrêts, fréquence et prochains départs réels (heure serveur).
2. **Cliquer « Commander un rover »** — la page de commande citoyenne s'ouvre (connexion `citoyen@terranova.fr` / `password123`).
3. **Vérifier le lien en contexte** — `/services/transport` propose « Voir les horaires des navettes ».

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
