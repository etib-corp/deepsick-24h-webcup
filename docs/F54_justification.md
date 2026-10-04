# F54 — Prévenir en cas de connexion depuis un nouvel appareil

> **Besoin officiel (F54, Moyenne, 680 XP)** — Est-ce possible d'être prévenue quand quelqu'un se connecte à mon compte depuis un nouvel appareil ? L'information doit être visible au bon moment et permettre aux personnes concernées de comprendre immédiatement ce qu'elles doivent savoir ou faire.

**Branche :** `main` — lot « easy & medium » du 4 octobre 2026
**Commit :** `9c8b1fe` — « feat: implement easy & medium Webcup needs batch »

**Emplacements dans le code :** `lib/login-device.ts` (`trackLoginDevice`, `isNewDevice`), `lib/auth.ts` (appel dans `authorize` après une connexion valide), `lib/security.ts` (nouveau type `LOGIN_SUCCESS`), libellé dans les trois dictionnaires (`council.security.eventTypes.LOGIN_SUCCESS`), notifications via `pushNotification`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?
- **Empreinte d'appareil sans base invasive** — chaque connexion réussie est tracée (`LOGIN_SUCCESS`) avec l'adresse IP et le user-agent ; l'empreinte « appareil » est le couple (IP, user-agent) comparé aux 50 dernières connexions de la personne.
- **Notification immédiate et actionnable** — quand l'empreinte est inconnue et que le compte est citoyen, une notification « Nouvelle connexion détectée » explique quoi faire : « Si vous êtes à l'origine de cette connexion, ignorez ce message. Sinon, contactez sans délai l'administration. »
- **Visible au bon moment** — la notification apparaît dans la cloche de l'espace personnel (`/citizen/notifications`) avec lien direct.
- **Traçable par le Haut Conseil** — l'événement `LOGIN_SUCCESS` (détail « nouvel appareil ») alimente le journal de sécurité `/council/security`.
- **Sans bloquer la connexion** — le suivi est best-effort : une erreur d'écriture ne bloque jamais un sign-in valide.

### URL ou emplacement pour tester la fonctionnalité
Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)
- **Citoyen** : `/citizen/notifications` (compte `citoyen@terranova.fr` / `password123`).
- **Haut Conseil** : `/council/security` (compte `conseil@terranova.fr`).

### Comment le jury peut-il vérifier que cela fonctionne ?
1. **Première connexion** — se connecter en citoyen : une notification « Nouvelle connexion détectée » est créée (l'empreinte est inédite).
2. **Simuler un nouvel appareil** — se déconnecter, puis se reconnecter depuis un autre navigateur (ou une fenêtre privée) : une nouvelle notification est créée car l'empreinte diffère.
3. **Vérifier le journal** — `/council/security` montre l'événement « Connexion réussie » avec le détail « nouvel appareil » le cas échéant.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`, tests `node --require ./scripts/f78-test-env.cjs --import tsx --test tests/*.test.ts` (42 OK).
