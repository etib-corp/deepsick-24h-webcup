# F53 — Vérification supplémentaire à la connexion (deux étapes)

> **Besoin officiel (F53, Difficile, 1020 XP)** — Nous souhaitons renforcer la sécurité des comptes citoyens avec une vérification supplémentaire. Le parcours doit rester compréhensible pour l'utilisateur tout en évitant qu'une personne non autorisée puisse accéder à son espace.

**Emplacements dans le code :** `components/forms/TwoFactorCard.tsx` (activation), `app/citizen/account/page.tsx`, `lib/auth.ts` (`authorize` : `TWO_STEP_REQUIRED` + vérification), `lib/actions/access.ts` (`startTwoStepAction`, `setTwoFactorAction`), `components/forms/LoginForm.tsx` (étape code), champ `User.twoFactorEnabled`, `tests/one-time-code.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Une **vérification en deux étapes** optionnelle, activable par chaque compte :

- **Activation simple** — dans `/citizen/account`, une carte « Vérification en deux étapes » affiche l'état (Activée / Désactivée), explique le principe et bascule en un clic. Chaque bascule est journalisée (`TWO_FACTOR_CHANGED` dans `/council/security`).
- **Parcours compréhensible** — à la connexion, le mot de passe est vérifié d'abord ; si l'option est active, le formulaire ouvre **l'étape « Vérification en deux étapes »** : un code à usage unique est généré pour ce compte et le résident le saisit sur le même écran (message clair, lien « Revenir à la connexion classique »).
- **Personne non autorisée** — l'application est **imposée côté serveur dans `authorize`** : avec l'option active, un mot de passe correct sans code valide **ne crée jamais de session** (erreur `TWO_STEP_REQUIRED`, puis vérification du code HMAC, à usage unique, 5 min, 5 essais). Un client modifié ne peut pas contourner l'étape.
- **Mêmes garanties que D02** — codes hachés en base, limités (3 demandes / 10 min), throttle anti-force brute (F37), refus tracés (`ACCESS_CODE_DENIED`). La transmission est simulée comme D02 (`SIMULATED_TRANSMISSIONS=off` pour la masquer en production durcie).

### URL ou emplacement pour tester la fonctionnalité

Activation : **`/citizen/account`** → carte « Vérification en deux étapes » (`citoyen@terranova.fr` / `password123`). Connexion : **`/login`**.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Connecté en citoyen, ouvrir `/citizen/account` et **activer** la vérification : badge « Activée » + message de confirmation (option désactivable à tout moment).
2. Se déconnecter, ouvrir `/login` et saisir identifiant + mot de passe : l'étape **« Vérification en deux étapes »** apparaît avec la transmission simulée du code.
3. Saisir un **mauvais code** : refusé. Saisir le bon : connexion vers `/citizen`.
4. En Conseil, `/council/security` montre `Vérification en deux étapes modifiée` et les émissions/refus de codes.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/*.test.ts` (88 OK) — parcours complet activé/désactivé également vérifié en navigateur.
