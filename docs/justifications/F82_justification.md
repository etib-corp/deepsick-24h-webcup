# F82 — Empêcher les envois multiples des mêmes formulaires

> **Besoin officiel (F82, Moyenne, 820 XP)** — Il semble qu'on puisse envoyer plusieurs fois le même formulaire sans contrôle. Cette évolution doit répondre à un usage concret de la plateforme et rester suffisamment claire pour être comprise sans explication technique.

**Branche :** `D16-request-submission-confirmation` (PR #28) + `103-security-f-81-protect-forms-against-automated-submissions` (PR #112) + `F78-improve-platform-stability` (PR #110)
**Commit :** `4eb243d` — « Feat: Add confirmation to submission » ; `92987e7` — « feat: add security on forms to prevent from bots spamming » ; `a242b1c` — « perf: improve platform stability under load »

**Emplacements dans le code :** `components/forms/SubmissionForm.tsx` (verrou de soumission immédiat), `components/forms/SubmissionConfirmation.tsx`, `lib/bot-guard.ts` + `lib/bot-signals.ts` (jeton signé à usage unique), modèle `BotGuardToken`, `lib/services.ts` (références `cuid()`), `tests/bot-guard.test.ts`, `docs/F81_forms_anti_bot.md`, `docs/D16_submission_confirmation.md`

---

### Qu'avez-vous mis en place pour répondre à cette demande ?

Trois protections complémentaires empêchent les envois multiples, **sans gêner l'usage normal** :

- **Verrou de soumission immédiat** — tous les formulaires de création (contact, inscription, connexion, signalement, commande, rendez-vous) passent par `SubmissionForm` : dès le premier clic/Entrée, les soumissions suivantes sont **bloquées avant même le rendu d'attente**, puis débloquées après la réponse du serveur (réessai possible seulement après une erreur).
- **Jeton anti-robot à usage unique** — chaque formulaire public embarque un **défi signé** (`nt-challenge`) invisible ; le serveur le **consomme** avant d'écrire. Rejouer un envoi déjà traité (duplicata réseau, re-soumission du même formulaire) est **refusé et tracé** (`FORM_BLOCKED`), et un envoi trop rapide est rejeté. Aucun CAPTCHA : l'utilisateur ne voit rien.
- **Pas de doublons de références** — les références ne sont plus générées par compteur (`count()+1`) mais par identifiant unique : deux créations simultanées ne peuvent pas produire la même référence (testé avec 30 créations concurrentes).
- **Feedback compréhensible** — en cas de blocage, un message localisé explique de « Recharger la page puis réessayer » ; en cas de succès, l'accusé remplace le formulaire, ce qui décourage naturellement le renvoi.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Formulaires concernés** : `/contact`, `/register`, `/login`, `/citizen/report`, `/citizen/orders`, `/citizen/appointments/nouveau`.
- **Journal des blocages** : `/council/security` (compteur « Formulaires bloqués ») — `conseil@terranova.fr` / `password123`.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Double soumission** — sur `/contact` (ou un signalement), cliquer **plusieurs fois très vite** sur « Envoyer » : un seul envoi part ; un seul accusé (avec une seule référence) est affiché.
2. **Rejeu de requête** — renvoyer le même envoi rejoué (par ex. via l'historique/outil de développement) : la requête est **bloquée** ; l'événement `FORM_BLOCKED` apparaît dans `/council/security`.
3. **Lire le message** — le blocage affiche un message compréhensible invitant à recharger la page, sans jargon ; après rechargement, l'envoi normal fonctionne.
4. **Concurrence** — lancer les tests : des créations simultanées produisent des références toutes distinctes et une seule entrée par envoi.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `tests/bot-guard.test.ts` + `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (31 OK, dont 30 créations concurrentes à références uniques).
