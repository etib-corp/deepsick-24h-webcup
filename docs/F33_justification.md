# F33 — Suppression de compte par l'habitant

> **Besoin officiel (F33, Facile, 290 XP)** — Les citoyens doivent pouvoir supprimer leur compte s'ils le souhaitent. Le parcours doit rester compréhensible pour l'utilisateur tout en évitant qu'une personne non autorisée puisse accéder à son espace.

**Branche :** `features/delete-account`
**Commit :** `503ef74` — « feat: citizen can now delete their account » (fusionné via la PR #90)

**Emplacements dans le code :** `app/citizen/account/page.tsx` (zone de danger), `components/forms/DeleteAccountForm.tsx`, `lib/actions/account.ts` (`deleteAccountAction`), `lib/services.ts` (`deleteAccount`), `app/(auth)/login` (message `?deleted=1`)

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

La suppression de compte est un **parcours explicite et sécurisé** dans l'espace personnel :

- **Compréhensible** — l'onglet « Mon compte » (`/citizen/account`) contient une **zone de danger** clairement identifiée : explication, conséquence (suppression définitive) et **phrase de confirmation à recopier** avant validation. Un seul bouton, un seul chemin.
- **Réservé au propriétaire du compte** — l'action serveur n'accepte **jamais** d'identifiant venu du formulaire : elle utilise **`session.user.id`**. Un visiteur non connecté est refusé (`unauthorized`), et un compte non-citoyen (agent, Conseil) ne peut pas se supprimer par ce chemin (`forbidden`).
- **Effet complet et propre** — la suppression efface le compte et ses données liées (signalements, demandes, commandes : `onDelete: Cascade` ; contenus publics : `SetNull`), puis redirige vers `/login?deleted=1` avec un message de confirmation (« Votre compte a bien été supprimé »).
- **Pas d'accès résiduel** — la session est déconnectée en même temps que la redirection ; l'ancien identifiant ne peut plus se reconnecter.

### URL ou emplacement pour tester la fonctionnalité

Instance de démo : `https://deepsick.lareunion.webcup.hodi.cloud/` (ou en local : `http://localhost:3000`)

- **Chemin interne** : `/citizen/account` (connecté en habitant — `citoyen@terranova.fr` / `password123`), section « Zone de danger » → « Supprimer mon compte ».
- Conseil de test : utiliser un **compte créé pour l'occasion** (`/register`) afin de ne pas supprimer les comptes de démonstration.

### Comment le jury peut-il vérifier que cela fonctionne ?

1. **Créer un compte jetable** — se déconnecter, ouvrir `/register`, créer un habitant (avec ou sans e-mail) puis se connecter avec.
2. **Trouver le parcours** — ouvrir `/citizen/account` : la zone de danger affiche l'avertissement et le champ de confirmation.
3. **Vérifier le garde-fou** — saisir une phrase erronée ou laisser vide : la suppression est refusée avec un message explicite, rien n'est supprimé.
4. **Supprimer** — recopier exactement la phrase demandée puis valider : redirection vers `/login?deleted=1` avec le message de confirmation ; la connexion avec l'ancien identifiant échoue.
5. **Vérifier l'impossibilité pour un tiers** — connecté en agent ou en Conseil, la page `/citizen/account` n'est pas accessible (rôle exigé `CITIZEN`) ; aucun formulaire ne permet de cibler un autre compte.

Vérifications automatiques : `npx tsc --noEmit` (0 erreur), `npx next build`.
