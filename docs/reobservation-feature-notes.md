# Reobservation Feature Notes

Cette note cadre une future feature autour du fait de revoir un chat deja present dans `catography`.

## Intuition

L'idee de base est tentante:

- ajouter un bouton `Vu`
- avec un petit icone oeil
- pour dire "j'ai croise ce chat aussi"

Mais sous cette forme, la feature est trop ambiguë.

## Probleme d'un simple bouton `Vu`

Le meme bouton peut vouloir dire plusieurs choses:

- `j'ai deja vu ce chat dans ma vie`
- `je l'ai vu aujourd'hui`
- `je confirme que cette fiche correspond bien a un vrai chat`
- `j'ai revu ce chat a un autre moment`

Ces interpretations ne produisent pas le meme produit.

Si on ajoute juste un oeil a cote de la croquette:

- on duplique en partie la logique du like
- on ajoute du bruit dans l'interface
- on ne cree pas une donnee tres exploitable

## Direction recommandee

La bonne direction n'est probablement pas un bouton `Vu` simple.

La bonne direction est plutot:

- `Revu`
- `Observe de nouveau`
- `Je l'ai recroise`

Autrement dit:

- on n'ajoute pas seulement une reaction
- on ajoute une vraie re-observation

## Pourquoi c'est plus interessant

Une vraie re-observation permet de construire des informations utiles:

- `Vu pour la premiere fois`
- `Vu pour la derniere fois`
- `Nombre d'observations`
- plus tard, eventuellement une petite chronologie

Cela raconte quelque chose de plus vivant:

- quels chats sont souvent revus
- quels chats semblent encore presents dans un quartier
- quels listings sont anciens mais toujours pertinents

## Modele de donnees cible

Le modele le plus propre serait:

### 1. Une fiche principale de chat / listing

Elle represente l'entite visible dans le produit:

- nom
- photo principale
- quartier principal
- couleur
- comportements
- position de reference

### 2. Des observations liees

Chaque observation represente un moment ou quelqu'un a croise le chat.

Champs possibles:

- `id`
- `cat_id` ou `sighting_id`
- `seen_at`
- `latitude`
- `longitude`
- `note` nullable
- `photo` nullable
- `created_by` nullable
- `status` si moderation necessaire

## Donnees derivees utiles

A partir de ces observations, on peut calculer:

- `first_seen_at`
- `last_seen_at`
- `observations_count`

Et les afficher dans la fiche:

- `Vu pour la premiere fois: ...`
- `Vu pour la derniere fois: ...`
- `Observe 6 fois`

## Point difficile

Le vrai sujet n'est pas l'UI.

Le vrai sujet est l'identite du chat:

- comment savoir que l'utilisateur a vraiment revu le meme chat
- et pas juste un chat qui lui ressemble

Il faut donc accepter une part d'approximation, ou ajouter de la moderation.

## Options produit

### Option 1. Re-observation libre

L'utilisateur peut dire:

- `J'ai revu ce chat`

Puis ajouter:

- date
- commentaire
- eventuellement photo

Avantages:

- simple
- engageant

Inconvenients:

- risque de confusion entre chats ressemblants

### Option 2. Re-observation soumise a moderation

Une re-observation cree une entree a valider par admin.

Avantages:

- plus propre
- plus fiable

Inconvenients:

- plus lourd
- plus de travail admin

### Option 3. Re-observation tres legere

Simple bouton:

- `Revu aujourd'hui`

Sans nouvelle fiche detaillee.

Avantages:

- tres simple

Inconvenients:

- peu de contexte
- moins utile a long terme

## Recommandation pragmatique

Si cette direction est exploree plus tard:

1. ne pas commencer par un simple bouton oeil `Vu`
2. cadrer la feature comme une `re-observation`
3. stocker au minimum une date de re-observation
4. afficher `premiere vue`, `derniere vue`, `nombre d'observations`
5. garder la moderation comme option possible si la confusion devient trop forte

## Scope minimal possible

Une premiere version raisonnable pourrait etre:

- action `J'ai revu ce chat`
- creation d'une observation simple avec date actuelle
- incrementation de `observations_count`
- mise a jour de `last_seen_at`
- affichage public:
  - `Vu pour la premiere fois`
  - `Vu pour la derniere fois`
  - `Observe X fois`

Sans:

- geolocalisation obligatoire
- photo obligatoire
- timeline complete

## Conclusion

L'idee est interessante si elle devient une vraie feature de suivi dans le temps.

En revanche, un simple bouton `Vu` avec un icone oeil risque d'etre trop flou et trop proche d'un second like.
