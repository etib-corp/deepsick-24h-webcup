# D10 — Trouver le bon service même avec une demande mal formulée

> **Besoin officiel (D10, Difficile, 1290 XP)** — Les habitants ont de plus en plus de mal à retrouver les bons services. Il faut leur permettre de trouver ce qu'ils cherchent même s'ils formulent mal leur demande. L'aide proposée doit conduire vers une réponse ou un service pertinent même lorsque la demande de l'habitant est formulée de manière imparfaite.

**Emplacements dans le code :** `lib/fuzzy-search.ts` (tolérance aux fautes), `lib/orientation.ts` (vocabulaire de concepts exporté `ORIENTATION_KEYWORDS`), `components/public/ServiceFinder.tsx` (interface `/services`), `tests/fuzzy-search.test.ts`

---

### Qu’avez-vous mis en place pour répondre à cette demande ?

L'orientation de services (F92) est enrichie d'une **couche de recherche tolérante** :

- **Formulations imparfaites comprises** — accents manquants, majuscules, **fautes de frappe** (distance d'édition bornée : 1 faute pour un mot moyen, 2 pour un mot long), **mots tronqués** (correspondance par préfixe) et pluriels sont normalisés puis comparés aux mots du catalogue (nom, catégorie, description).
- **Vocabulaire de concepts** — les expressions reconnues (F92) sont désormais matchées **aussi en version floue** : « eclaiage » reconnaît le concept « eclairage » du service Infrastructure même si le mot n'apparaît nulle part dans le texte du catalogue.
- **Toujours conduire quelque part** — les scores flous et les scores de concepts sont **fusionnés** ; chaque résultat affiche « Mots reconnus : … » (explicable). Zéro résultat = le texte propose la liste complète et le formulaire de contact.
- **Démonstrable en un clic** — un exemple volontairement mal orthographié (« L'eclaiage du dome ne marche plus ») est proposé sous le champ ; la recherche entière est déterministe et testée unitairement (8 tests).

### URL ou emplacement pour tester la fonctionnalité

**`/services`** → bloc « Vous ne savez pas quel service choisir ? ».

### Comment le jury peut-il vérifier que cela fonctionne ?

1. Ouvrir `/services`, cliquer l'exemple **« L'eclaiage du dome ne marche plus »** : **Infrastructure** remonte, avec « Mots reconnus : eclairage ».
2. Saisir librement une phrase fautive, ex. « je veux un papie pour mon logmen » : le Bureau des démarches est proposé.
3. Saisir « navet » (mot tronqué) : le service transport remonte par préfixe.
4. Saisir du texte sans rapport : la page invite à parcourir la liste ou à contacter l'administration.

Vérifications automatiques : `npx tsc --noEmit`, `npx next build`, tests `tests/fuzzy-search.test.ts` (8 OK : accents, fautes, préfixes, fusion concepts + texte, ordre des résultats).
