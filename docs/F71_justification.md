# F71 — Accès simplifié pour les nouveaux arrivants — justification jury

> Besoin **F71** · Difficile · 1140 XP — *Service d'Accueil des Nouveaux Arrivants*.
> Cette fiche répond aux trois champs du formulaire de soumission. Détail technique complet :
> [`docs/F71_arrivals.md`](F71_arrivals.md).

---

## 1. Qu'avez-vous mis en place pour répondre à cette demande ?

Environ 500 nouveaux habitants arrivent : certains n'ont pas d'adresse e-mail et tous ne parlent
pas la même langue. Nous avons rendu le parcours d'accès simple, multilingue et lisible sans
explication technique.

**a) Créer un compte sans adresse e-mail.**
- Le formulaire d'inscription (`/register`) propose deux chemins : « J'ai un e-mail » ou
  « Je n'ai pas d'e-mail ».
- Sans e-mail, l'habitant choisit un **identifiant colon** ; celui-ci est **proposé
  automatiquement à partir de son nom** (par ex. « Élodie Martin » → `elodie.martin`) et reste
  modifiable.
- La connexion (`/login`) accepte, dans un seul champ, **l'e-mail ou l'identifiant**.
- En base, l'e-mail est devenu facultatif et l'identifiant unique (migration Prisma fournie) :
  un habitant peut donc réellement exister sans e-mail.
- Un compte de démonstration sans e-mail est créé par le jeu de données : `iris.nouvelle` /
  `password123`.

**b) Un parcours d'accueil public, multilingue et en langue simple.**
- Nouvelle page **`/arrivants`** (accessible **sans compte**) : « Vos premiers pas » en 4 étapes —
  créer un compte, se connecter, faire sa première demande, demander de l'aide.
- Entièrement traduite en **français, anglais et espagnol** (`lib/i18n`), y compris les messages
  d'erreur de l'inscription, qui s'affichent dans la langue choisie.
- Textes volontairement simples et non techniques : phrases courtes, mots courants. Des **tests
  automatiques** refusent tout terme technique et toute phrase de plus de 15 mots dans les trois
  langues.
- La page indique explicitement ce qui est consultable **sans compte** (services, annonces,
  contact, guide) avec des liens directs.

**c) Changer de langue sans perdre sa progression.**
- Le sélecteur de langue est présent sur `/arrivants` **et** sur les pages d'inscription et de
  connexion.
- La **progression de la checklist** (cases « fait » + barre de progression) est conservée sur
  l'appareil, dans un stockage **indépendant de la langue** : changer de langue ne réinitialise
  rien.
- Les **valeurs déjà saisies** dans le formulaire d'inscription survivent aussi au changement de
  langue.
- Le choix de langue est mémorisé pour la prochaine visite.

**d) Des actions compréhensibles sans traduction.**
- Chaque étape et chaque bouton porte un **pictogramme** (carte d'identité, clé, document, bouée
  de secours) : les actions essentielles restent identifiables même sans lire.
- Les langues sont présentées par leurs codes `FR / EN / ES`, lisibles par tous.

**e) Intégration au reste de la plateforme.**
- Lien « Arrivants » dans le menu et le pied de page de **toutes les pages publiques**.
- Lien d'aide « Nouvel arrivant ? » directement sous le formulaire d'inscription.

---

## 2. URL ou emplacement pour tester la fonctionnalité

- **Chemin interne : `/arrivants`** — page publique, aucune connexion requise.
- Application en ligne : `https://VOTRE-URL-DE-DEPLOIEMENT/arrivants`
  *(remplacer par l'URL de l'application déployée par l'équipe)*.
- Départs directs : **`/register`** (créer un compte, avec ou sans e-mail) et **`/login`**
  (connexion par e-mail ou identifiant). Le lien « Arrivants » est aussi dans le menu de toutes
  les pages publiques.
- En local : `npm install`, `npm run db:migrate && npm run db:seed`, `npm run dev`, puis
  `http://localhost:3000/arrivants`.

---

## 3. Comment le jury peut-il vérifier que cela fonctionne ?

### Parcours A — Un habitant sans e-mail crée son compte (≈ 2 min)

1. **Sans être connecté**, ouvrir `/arrivants`. Le bandeau « Service d'accueil · Nouveaux
   arrivants » et les quatre étapes s'affichent : l'information simple est accessible sans compte.
2. Descendre à la carte « Vous n'avez pas d'e-mail ? » et cliquer sur
   **« Créer un compte sans e-mail »** (ou sur l'étape 1 « Créer un compte »).
3. Dans le formulaire : cliquer sur le bouton **« Je n'ai pas d'e-mail »**, puis saisir un nom,
   par exemple `Élodie Martin` (l'ordre n'a pas d'importance).
   → Un identifiant est **proposé automatiquement au fil de la saisie** : `elodie.martin`
   (modifiable ; si l'identifiant est déjà pris, en choisir un autre).
4. Saisir un mot de passe (8 caractères minimum) puis cliquer sur « Créer mon identité colon ».
   → Redirection vers la connexion avec le message « Identité créée. Vous pouvez vous connecter. »
5. Se connecter avec l'**identifiant** (pas un e-mail !) et le mot de passe.
   → L'espace citoyen `/citizen` s'ouvre : le compte a été créé **sans adresse e-mail**.

### Parcours B — Changer de langue sans perdre sa progression

1. Revenir sur `/arrivants` (connecté ou non).
2. Cocher la première étape « Créer votre compte » : la progression affiche « 1 sur 4 ».
3. Dans la carte « Choisissez votre langue », choisir **English**.
   → La page passe en anglais et la progression reste : *« Your progress: 1 of 4 »*, case cochée.
4. Choisir **Español** : même comportement (`Tu progreso: 1 de 4`).
5. Revenir en **Français** : la progression est toujours là.

### Parcours C — Changer de langue pendant une saisie

1. Ouvrir `/register` sans être connecté, saisir un nom et un e-mail dans les champs.
2. Utiliser le sélecteur de langue en haut à droite (FR / EN / ES).
   → Les libellés changent de langue **et les valeurs déjà saisies restent** dans les champs.

### Parcours D — Compte de démonstration sans e-mail (fourni)

1. Sur `/login`, se connecter avec `iris.nouvelle` / `password123` (le compte figure sur la carte
   « Comptes de démonstration », ligne « Sans e-mail : iris.nouvelle »).
   → Accès à l'espace `/citizen` avec un compte **sans e-mail**.

### Parcours E — L'information simple ne demande pas de compte

1. Se déconnecter (ou ouvrir une fenêtre de navigation privée).
2. Ouvrir `/arrivants`, `/services`, `/announcements`, `/contact`, `/guide`.
   → Toutes ces pages s'affichent sans compte ; les actions qui nécessitent un compte (faire une
   demande) renvoient vers l'inscription/connexion, sans impasse.

### Vérification automatisée (jury technique)

```bash
node --import tsx --test tests/arrivals.test.ts tests/breadcrumbs.test.ts
npx tsc --noEmit
```

Résultat attendu : **10 tests réussis** et aucune erreur de type. Ces tests vérifient :

- les clés de traduction **identiques en fr / en / es** ;
- des **phrases ≤ 15 mots sans vocabulaire technique** dans les trois langues ;
- la **progression conservée** quand on change de langue (lecture/écriture du stockage local) ;
- la normalisation et la suggestion d'identifiant (accents, majuscules, espaces) ;
- l'acceptation d'une **inscription sans e-mail** et le rejet des identifiants invalides.

### Où regarder dans le code

| Sujet | Fichier |
| --- | --- |
| Page d'accueil des arrivants | `app/(public)/arrivants/page.tsx` |
| Checklist et progression | `components/arrivals/ArrivalsChecklist.tsx`, `lib/arrivals.ts` |
| Identifiants colons (règles, suggestion) | `lib/identity.ts` |
| Inscription sans e-mail | `components/forms/RegisterForm.tsx`, `lib/services.ts`, `lib/validation.ts` |
| Connexion par e-mail ou identifiant | `components/forms/LoginForm.tsx`, `lib/auth.ts` |
| Traductions fr / en / es | `lib/i18n/dictionaries/{fr,en,es}.ts` |
| Migration base de données | `prisma/migrations/20261004150000_user_colon_identifier/` |
| Tests | `tests/arrivals.test.ts` |
