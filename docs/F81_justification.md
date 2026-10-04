# F81 — Protection des formulaires contre les envois automatisés

## Qu’avez-vous mis en place pour répondre à cette demande ?

Nous avons déployé une protection anti-robot **invisible et sans friction** sur les formulaires publics
de la plateforme :

- **Aucune étape supplémentaire, aucune énigme** : pas de CAPTCHA, pas de puzzle. L’habitant remplit
  et envoie exactement comme avant ; une mention discrète « Protégé contre les envois automatisés. »
  l’informe que la vérification est active.
- **Piège à robots (honeypot)** : un champ caché, hors écran et inatteignable au clavier, que seuls
  les robots remplissent — toute soumission qui le remplit est refusée.
- **Défi signé à usage unique** : chaque formulaire reçoit un jeton signé (HMAC) et horodaté. Le serveur
  vérifie la signature, le formulaire d’origine, un **temps de remplissage minimum** (un envoi en
  quelques millisecondes est automatisé) et une durée de validité (2 h). Un jeton accepté ou bloqué est
  **brûlé dans un registre** : rejouer une requête bloquée ne fonctionne jamais, et un jeton récupéré ne
  peut pas servir à spammer.
- **Limitation par adresse IP** (contact : 8 envois / 10 min ; inscription : 10 / h) avec détection de
  l’excès et délai de réessai clair.
- **Blocage côté serveur avant toute écriture** : impossible de contourner en appelant l’action ou l’API
  directement ; `POST /api/contact` exige désormais le même défi que le formulaire.
- **Messages clairs et non techniques** (fr/en/es) sur toute soumission bloquée : « L’envoi n’a pas pu
  être vérifié et a été bloqué par la protection anti-robot. Rechargez la page, puis réessayez. »
- **Traces pour les équipes** : chaque tentative bloquée est écrite dans le journal d’audit
  (`FORM_BLOCKED`) et dans le registre anti-robot ; la console `/council/security` affiche une tuile
  « Envois bloqués · 24 h · protection anti-robot » et le détail des tentatives (formulaire, raison, IP,
  agent utilisateur). Les mêmes compteurs figurent sur la vue d’ensemble du Conseil.
- **Connexion restée fluide** : le garde s’exécute avant la vérification des identifiants ; la protection
  F37 existante est conservée, et une simple erreur de mot de passe ne consomme pas le défi (on peut
  réessayer sans recharger la page).

Formulaires couverts : **contact**, **inscription**, **connexion** — ainsi que l’API `POST /api/contact`.

Détails techniques : `docs/F81_forms_anti_bot.md`.

## URL ou emplacement pour tester la fonctionnalité

- **Formulaires publics** : `/contact`, `/register`, `/login` — sur l’instance de démo :
  `http://localhost:3000/contact`
- **API protégée** : `POST http://localhost:3000/api/contact`
- **Console du Conseil** : `http://localhost:3000/council/security` (tuile « Envois bloqués » + flux des
  événements)
- **Comptes** : Conseil `conseil@terranova.fr` / `password123` — habitant `citoyen@terranova.fr` /
  `password123`
- Documentation : `docs/F81_forms_anti_bot.md` — tests : `tests/bot-guard.test.ts`

## Comment le jury peut-il vérifier que cela fonctionne ?

1. **Usage normal inchangé** — ouvrir `/contact`, remplir et envoyer un message : succès immédiat,
   référence de suivi affichée, aucune question ni étape supplémentaire.
2. **Robot bloqué, message clair** — envoyer une requête automatisée sans le défi :

   ```bash
   curl -i -X POST http://localhost:3000/api/contact \
     -H 'content-type: application/json' \
     -d '{"subject":"Test jury","email":"jury@terranova.fr","body":"Tentative automatisée de vérification F81."}'
   ```

   → **403** avec le message non technique « L’envoi n’a pas pu être vérifié et a été bloqué par la
   protection anti-robot […] ».
3. **Le rejeu ne contourne pas la protection** — relancer **à l’identique** la commande de l’étape 2 :
   toujours **403**. Plus généralement, tout jeton consommé ou bloqué est refusé définitivement par le
   registre.
4. **Piège à robots** — via l’inspecteur du navigateur, remplir le champ hors écran du formulaire
   (étiquette « Ne pas remplir ce champ ») puis soumettre : la soumission est bloquée avec le même
   message, sans exposer de détail technique.
5. **Inscription et connexion intactes** — créer un compte depuis `/register` (redirection vers la
   connexion) puis se connecter depuis `/login` : parcours normal, protection invisible.
6. **Traces pour les équipes** — connecté en Conseil, ouvrir `/council/security` : la tuile « Envois
   bloqués » a augmenté et le flux liste les tentatives des étapes 2 à 4 (« Envoi automatisé bloqué »
   avec formulaire, raison — `token`, `trap`, `tooFast`, `replay` —, IP et date).
7. **Preuve automatisée** — `npx tsx --test tests/*.test.ts` : 15 tests, dont 4 nouveaux (signature,
   altération du jeton, temps de remplissage minimal, expiration, piège). Sur une base fraîche, le
   `seed` fournit déjà une tentative bloquée de démonstration.
