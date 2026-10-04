# D02 — Connexion sans mot de passe (code à usage unique)

> **Besoin officiel (D02, Difficile, 1020 XP)** — La ville souhaite simplifier l'accès à la plateforme : les habitants doivent pouvoir se connecter sans mot de passe classique, avec un haut niveau de sécurité. Le parcours doit rester compréhensible pour l'utilisateur tout en évitant qu'une personne non autorisée puisse accéder à son espace.

**Emplacements dans le code :** `components/forms/LoginForm.tsx` (parcours), `lib/actions/access.ts` (`requestLoginCodeAction`), `lib/access-codes.ts` + `lib/one-time-code.ts` (mécanique des codes), `lib/auth.ts` (`authorize`, mode `passwordless`), modèle `AccessCode`, `tests/one-time-code.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Un **parcours « Sans mot de passe »** sur la page de connexion :

- **Parcours compréhensible** — un sélecteur « Avec mot de passe / Sans mot de passe » ; l'habitant écrit son identifiant colon (ou son e-mail), reçoit un **code à 6 chiffres** et le saisit. Trois écrans maximum, chaque état expliqué (validité 5 minutes, code à usage unique).
- **Haut niveau de sécurité** — le code est **haché (HMAC-SHA256) en base**, jamais stocké en clair ; il est **à usage unique** (consommé à la connexion), **expire en 5 minutes**, meurt après **5 essais** et est limité à **3 demandes par 10 minutes** par compte. Le throttle anti-force brute (F37) s'applique aussi, chaque refus est journalisé (`ACCESS_CODE_DENIED` dans `/council/security`) et un code consommé ne peut jamais resservir.
- **Personne non autorisée** — la session n'est ouverte que par `authorize` après vérification du code ; une demande de code pour un identifiant inconnu est refusée sans émission.
- **Transmission simulée, assumée** — la colonie n'ayant pas d'e-mail réel, le code s'affiche dans un panneau « 📡 Transmission sécurisée · simulation » (convention D04 : « afficher + stocker »). En production durcie, `SIMULATED_TRANSMISSIONS=off` masque l'affichage : le code n'existe alors que haché.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo (ou `http://localhost:3000`) : **`/login`** → onglet **« Sans mot de passe »** (compte `citoyen@terranova.fr`).

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/login`, passer sur **« Sans mot de passe »**, saisir `citoyen@terranova.fr` et valider : le panneau de transmission affiche un **code à 6 chiffres**.
2. Saisir un **mauvais code** : refus explicite. Rejouer le bon code : connexion immédiate vers `/citizen`.
3. Revenir sur `/login` et **réutiliser le même code** : refusé (usage unique).
4. Se connecter en Conseil (`conseil@terranova.fr`) → `/council/security` : les événements `Code de connexion émis / refusé` tracent les tentatives.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (88 OK, dont 6 sur les codes à usage unique).
