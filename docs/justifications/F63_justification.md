# F63 — Désactiver un service défectueux

> **Besoin officiel (F63, Difficile, 1080 XP)** — Les administrateurs doivent pouvoir **désactiver rapidement un service défectueux**. Un habitant doit pouvoir **identifier ce qui est disponible, ce qui ne l’est pas, et la prochaine action possible**. Issu du **Centre technique**.

**Branche :** `68-privacy-f-55-let-citizens-export-their-personal-data`

**Emplacements dans le code :** `lib/services.ts`, `lib/data.ts`, `lib/actions/admin.ts`, `lib/actions/appointments.ts`, `app/council/services/page.tsx`, `app/(public)/services/page.tsx`, `app/(public)/services/[slug]/page.tsx`, `components/public/ServiceList.tsx`, `components/public/ServicesView.tsx`, `components/colony/ColonyMap.tsx`, `lib/map-layout.ts`, `lib/i18n/dictionaries/{fr,en,es}.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

Nous nous appuyons sur le champ d’**état `published`** déjà porté par les services, en le rendant pilotable et **visible** :

- **Désactivation en une action** : sur la console du Haut Conseil (`/council/services`), chaque service dispose d’un bouton unique **« Désactiver » / « Réactiver »** (`toggleServicePublishedAction`), à côté d’un **badge « Désactivé »** quand le service est indisponible. Le basculement ne supprime rien : `setServicePublished` ne change que le champ d’état.
- **Effet immédiat côté habitant** : le catalogue public (`/services`) présente désormais **tous** les services ; ceux désactivés apparaissent **grisés, en pointillés et badgés « Indisponible »**, distinctement des services prioritaires. La carte conserve le repère mais avec un **marqueur d’alerte rouge**.
- **Un message qui explique et propose la suite** : la fiche d’un service indisponible **ne renvoie plus une page 404** ; elle s’affiche normalement avec une **alerte** (« Service temporairement indisponible »), l’explication (« une intervention est en cours… ») et une **prochaine action** : le bouton **« Contacter l’administration »** mène au formulaire de contact. Les boutons **« Créer une demande liée »** et **« Prendre rendez-vous »** sont **retirés** tant que le service est désactivé.
- **Impossible de démarrer une démarche sur un service coupé** : en plus de l’interface, la prise de rendez-vous est **bloquée côté serveur** (contrôle du rôle + du service dans `createAppointmentAction`, et garde-fou autoritatif dans `createAppointment`) ; un lien obsolète `?service=<id>` vers un service désactivé ne peut donc pas aboutir.
- **Aucune perte de données** : changer l’état **ne supprime ni ne modifie** les démarches existantes. Les rendez-vous déjà pris sur un service restent visibles dans l’espace citoyen ; seule la **possibilité d’en créer de nouveaux** disparaît.
- **Accès réservé** : seul le rôle **`COUNCIL`** peut changer l’état (vérifié par `requirePageRole`), et chaque bascule est **journalisée** (`SecurityEvent` `CONTENT_CHANGED`, détail « service désactivé » / « service réactivé »).

### URL ou emplacement pour tester la fonctionnalité

_Indiquez au jury où tester cette fonctionnalité. Une URL complète ou un chemin interne est accepté._

Site : `https://deepsick.lareunion.webcup.hodi.cloud/`

- Administration des services (Haut Conseil) : `https://deepsick.lareunion.webcup.hodi.cloud/council/services`
- Catalogue public (côté habitant) : `https://deepsick.lareunion.webcup.hodi.cloud/services`
- Fiche d’un service : `https://deepsick.lareunion.webcup.hodi.cloud/services/<slug>`

Comptes de démonstration (`password123`) :

- Haut Conseil : `conseil@terranova.fr`
- Citoyen : `citoyen@terranova.fr`

### Comment le jury peut-il vérifier que cela fonctionne ?

_Décrivez les étapes nécessaires pour reproduire ou vérifier la fonctionnalité._

1. Se connecter avec `conseil@terranova.fr` / `password123` et ouvrir `/council/services`.
2. Sur un service, cliquer sur **« Désactiver »** : le **badge « Désactivé »** apparaît immédiatement et le bouton devient **« Réactiver »**.
3. Se connecter ensuite avec `citoyen@terranova.fr` / `password123`, ouvrir `/services` : le service concerné est **badgé « Indisponible »** et grisé (et, sur la carte, marqué d’un point d’alerte).
4. Ouvrir sa **fiche** : elle s’affiche (plus de 404) avec l’**alerte explicative** et le bouton **« Contacter l’administration »** ; les boutons de démarche (**créer une demande**, **prendre rendez-vous**) ont disparu.
5. Tenter l’URL directe `/citizen/appointments/nouveau?service=<id-du-service-désactivé>` : impossible de réserver, un message indique que le service est indisponible.
6. De retour en **Haut Conseil**, cliquer sur **« Réactiver »** : le service redevient normalement disponible côté habitant.
7. Vérifier la **conservation des données** : un rendez-vous pris **avant** la désactivation reste présent dans l’espace citoyen (`/citizen/appointments`) après la désactivation.
8. Vérifier l’**autorisation** : un compte non-`COUNCIL` n’accède pas à `/council/services` et ne peut pas déclencher le changement d’état.
