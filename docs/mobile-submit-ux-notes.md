# Mobile Submit UX Notes

Cette note cadre une future iteration de la page `/submit` pour mobile.

## Constat

Le site mobile fonctionne deja:

- on peut ouvrir le site sur le terrain
- on peut ajouter une photo
- on peut soumettre un chat
- le formulaire est utilisable

Donc le vrai probleme n'est pas de faire une app native tout de suite.

Le vrai sujet est l'ordre de l'UX mobile.

## Idee directrice

Sur mobile, le flux doit suivre l'usage reel:

1. capturer le moment
2. localiser rapidement le chat
3. remplir les details ensuite

Autrement dit:

- photo d'abord
- carte et geolocalisation ensuite
- texte apres

Ce n'est pas forcement le meme ordre que sur desktop.

## Pourquoi

Quand quelqu'un croise un chat dans la rue:

- il veut d'abord prendre la photo
- puis poser le point sur la carte
- puis, seulement apres, completer les infos textuelles

Le formulaire texte n'est pas la priorite immediate sur mobile.

## Recommandation produit

Sur mobile, la page `/submit` doit devenir `capture-first` et `location-first`.

### Ordre recommande des blocs

1. bloc photo
2. bloc carte / localisation
3. bloc details textuels

## Bloc photo

Le haut de la page mobile devrait mettre en avant:

- `Prendre une photo`
- `Choisir depuis la galerie`

Remarques:

- sur mobile, l'input fichier peut deja ouvrir le choix `camera` / `galerie`
- mais il faut rendre cette possibilite evidente dans l'UI
- le wording doit clairement encourager la capture immediate

## FAB mobile sur la home

Une bonne extension de cette logique est d'ajouter sur la home mobile un bouton flottant principal:

- `+ Ajouter un chat`

Le but est simple:

- permettre un acces immediat a l'action principale du site
- eviter de dependre de la navbar mobile
- rendre l'usage plus spontané sur le terrain

Ce bouton doit etre pense comme un vrai point d'entree mobile, pas juste comme une deco.

## Deux options pour le bouton flottant

### Option 1

Le bouton flottant redirige simplement vers `/submit`.

Avantages:

- simple a implementer
- faible risque technique

Inconvenient:

- ajoute une etape avant la prise ou le choix de photo

### Option 2

Le bouton flottant ouvre directement un petit menu d'actions:

- `Prendre une photo`
- `Choisir une photo`

Puis:

- l'utilisateur choisit son action
- la photo est capturee ou selectionnee
- redirection vers `/submit`
- la page `/submit` mobile s'ouvre avec la photo deja prechargee

Ensuite il ne reste qu'a:

- verifier ou ajuster la localisation
- completer les informations

## Recommandation

L'option 2 est la meilleure.

Pourquoi:

- elle colle mieux a l'intention utilisateur
- elle reduit la friction
- elle rend l'experience plus mobile-first
- elle transforme la home mobile en vrai point d'entree terrain

En clair, le bouton `+` ne doit pas seulement naviguer.

Il doit idealement lancer le flow:

1. photo
2. localisation
3. details

## Implication importante

Dans cette vision, la page `/submit` devient le flow d'ajout mobile optimise.

Le bouton flottant mobile sert donc a:

- lancer ce flow
- y arriver avec une photo deja presente si possible

## Point d'implementation a garder en tete

La photo ne doit evidemment pas passer dans l'URL.

Les options techniques possibles plus tard:

- state client temporaire
- store local leger
- ou ouverture du picker depuis `/submit` avec un mode mobile dedie

Le choix technique peut venir plus tard.

Le point important pour l'instant est la cible UX:

- FAB mobile
- menu `Prendre une photo / Choisir une photo`
- redirection vers `/submit` avec photo pre-remplie si possible

## Bloc carte / localisation

Juste apres la photo:

- afficher la carte
- afficher un bouton `Utiliser ma position`
- permettre de corriger manuellement le point

### Comportement attendu

Quand l'utilisateur clique sur `Utiliser ma position`:

- demande de permission navigateur
- recuperation de la position GPS
- centrage de la carte
- placement automatique du point

Puis:

- l'utilisateur peut ajuster le pin manuellement si necessaire

## Bloc details textuels

Les champs texte et metadata viennent ensuite:

- nom du chat
- couleur
- comportements
- commentaire

L'idee est de les mettre apres la photo et la localisation, pas avant.

## Difference desktop / mobile

Ce comportement doit etre surtout specifique au mobile.

Le layout desktop actuel de `/submit` est considere comme bon et ne doit pas etre bouleverse sans raison.

En pratique:

- la version desktop actuelle est deja lisible et efficace
- on peut eventuellement remonter le bloc photo un peu plus haut si cela simplifie l'implementation commune
- on peut ajouter un bouton `Utiliser ma position` sur desktop, idealement pres de la carte
- mais on ne cherche pas a refaire l'ordre general du desktop si cela degrade l'experience actuelle

En revanche, sur mobile:

- la spontaneite est prioritaire
- la capture est prioritaire
- la localisation rapide est prioritaire

## UX cible mobile

Version ideale:

### En haut

- gros bouton `Prendre une photo`
- bouton secondaire `Choisir depuis la galerie`
- et, depuis la home mobile, un FAB `+ Ajouter un chat` qui mene a ces actions

### Ensuite

- carte visible rapidement
- bouton `Utiliser ma position`
- placement ou correction du point

### Ensuite

- formulaire complet

## Pourquoi ce n'est pas une app mobile

Cette iteration n'exige pas encore d'app native.

Le site mobile peut deja couvrir une grosse partie de la valeur:

- acces camera
- upload photo
- geolocalisation
- usage sur le terrain

Donc avant de penser app:

- ameliorer d'abord l'UX mobile du site

## Contraintes de conception

Pour la future implementation:

- mobile: repenser l'ordre des blocs
- desktop: conserver au maximum le layout actuel
- si un composant commun est partage entre mobile et desktop, la version desktop ne doit pas perdre en lisibilite

## Scope recommande pour une future implementation

### Phase 1

- reordonner `/submit` sur mobile
- mettre le bloc photo en premier
- mettre la carte juste apres
- deplacer les champs texte plus bas
- garder le desktop proche de sa structure actuelle

### Phase 2

- ajouter un vrai bouton `Utiliser ma position`
- centrer la carte sur le GPS
- placer automatiquement le point
- rendre ce bouton disponible aussi sur desktop si l'integration est propre

### Phase 3

- peaufiner le wording mobile
- rendre la page plus rapide a utiliser en situation reelle

## Conclusion

La bonne direction mobile est:

- photo d'abord
- carte ensuite
- geolocalisation si possible
- texte apres

Pour `catography`, c'est probablement un bien meilleur investissement produit a court terme qu'une app native.
