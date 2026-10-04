# F85 — Détection d'activité inhabituelle et alertes de sécurité

> **Besoin officiel (F85, Expert, 1680 XP)** — « Une activité inhabituelle a été détectée sur plusieurs parties de la plateforme. Certaines informations paraissent incohérentes. La protection doit être perceptible dans le fonctionnement réel de la plateforme sans rendre l'usage normal inutilement compliqué. » Issu du **Centre de cybersécurité**.

**Branche :** `84-security-f-85-detect-unusual-activity`

**Emplacements dans le code :** `lib/anomaly.ts`, `lib/sentinel.ts`, `lib/actions/security.ts`, `lib/serialize.ts`, `lib/security.ts`, `components/council/SecurityAlertBoard.tsx`, `components/council/SecurityAlertsPanel.tsx`, `app/council/security/page.tsx`, `app/operations/security/page.tsx`, `prisma/schema.prisma` (+ migration `20261004230000_security_alerts`), `lib/i18n/dictionaries/{fr,en,es}.ts`, `tests/anomaly.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Nous avons ajouté une **sentinelle** qui analyse en continu l'activité réelle de la plateforme et fait remonter des **alertes de sécurité graduées**, sans alourdir l'usage normal :

- **Détection automatique d'activité inhabituelle** (`lib/anomaly.ts`, `lib/sentinel.ts`) : **rafales** d'événements hostiles (échecs de connexion, connexions bloquées, accès refusés, envois automatisés bloqués) par **adresse IP** ou par **acteur** sur une fenêtre glissante ; et **pics horaires** détectés par écart à la moyenne des 48 h précédentes (**z-score**). C'est la partie « assistée par IA » du besoin.
- **Informations incohérentes signalées** : statut d'une **demande** ou d'un **signalement** qui contredit sa chronologie, **rendez-vous** actif sur un **service désactivé**, **annonce** publiée sans date de publication.
- **Alertes claires, réservées aux profils autorisés** : un tableau temps réel (polling 5 s) sur `/council/security` et `/operations/security`, visible par le **Haut Conseil** et la **station sécurité**. Chaque alerte porte un **type**, une **sévérité** (Vigilance / Critique) et un **statut** (Ouverte / Examinée / Résolue), avec les actions **Examiner** et **Résoudre**.
- **Protection perceptible dans le fonctionnement réel, sans complication** : la détection s'appuie sur les événements réellement produits par la plateforme ; la protection qui agit reste celle déjà en place (blocage anti-force brute, bouclier anti-robot). Aucun nouveau blocage n'est introduit : **un utilisateur légitime ne peut pas être verrouillé par un faux positif**.
- **Enregistrement pour analyse après incident** : chaque détection est persistée (`SecurityAlert`) **et** tracée (`SecurityEvent` `ANOMALY_DETECTED`) ; chaque revue est tracée (`ALERT_REVIEWED`). Une alerte dont la cause disparaît est **auto-résolue**.
- **Notifications ciblées** : les alertes **critiques** notifient le Haut Conseil et la station sécurité.

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Site : `https://deepsick.lareunion.webcup.hodi.cloud/`

- Console sécurité du Haut Conseil (alertes + journal) : `https://deepsick.lareunion.webcup.hodi.cloud/council/security`
- Poste sécurité (alertes + incidents) : `https://deepsick.lareunion.webcup.hodi.cloud/operations/security`

Comptes de démonstration (`password123`) : `conseil@terranova.fr` (Haut Conseil), `securite@terranova.fr` (Sécurité).

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec `securite@terranova.fr` / `password123` et ouvrir `/operations/security` (ou avec `conseil@terranova.fr` et `/council/security`).
2. Provoquer une **activité inhabituelle réelle** : enchaîner plusieurs échecs de connexion ou d'accès (par ex. des connexions avec un mauvais mot de passe depuis un même poste). En quelques secondes (rafraîchissement 5 s), une **alerte** apparaît avec sa **sévérité** et sa **source** (IP/acteur).
3. Utiliser les filtres **Ouvertes / Critiques / Résolues / Toutes**, puis **Examiner** ou **Résoudre** une alerte : le statut change et l'action est tracée.
4. Constater la détection des **incohérences** : le tableau peut signaler un **rendez-vous sur un service désactivé** ou un **statut de demande** qui ne correspond pas à sa chronologie ; corriger la donnée fait **auto-résoudre** l'alerte au scan suivant.
5. Vérifier la **traçabilité** : dans le journal de sécurité (`/council/security`), retrouver les entrées **« Anomalie détectée »** et **« Alerte de sécurité examinée »**.
6. Vérifier la **non-intrusivité** : un parcours citoyen normal (connexion, dépôt de demande, rendez-vous) reste **fluide et non bloqué** ; aucune fausse alerte ne verrouille un compte légitime.
7. (Optionnel) Régler les seuils par variables d'environnement (`SENTINEL_BURST_THRESHOLD`, `SENTINEL_ZSCORE_THRESHOLD`, `SENTINEL_WINDOW_MINUTES`, `SENTINEL_MIN_SAMPLES`) et relancer : la sensibilité s'adapte sans changement de code.
