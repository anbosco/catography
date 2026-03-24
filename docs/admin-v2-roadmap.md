# Admin V2 Roadmap

Cette note cadre une V2 du panel admin de `catography`.

Le site public est deja assez complet. La prochaine vraie zone de travail utile est la moderation:

- moderation moins destructive
- edition complete d'un listing
- meilleure tracabilite admin
- base propre pour de futurs signalements et suggestions utilisateurs

## Etat actuel

Aujourd'hui:

- un admin peut approuver un listing
- un admin peut supprimer un listing
- la suppression est definitive
- `approved_by` et `approved_at` existent deja
- l'auth admin repose sur `Supabase Auth` + `public.admin_accounts`

Ce n'est pas mauvais, mais c'est un peu trop brutal pour une vraie utilisation.

## Probleme principal

Le point le plus fragile n'est pas la securite technique pure, mais la securite operationnelle:

- un admin peut supprimer par erreur un chat et sa photo
- il n'existe pas encore de notion propre de rejet ou de suppression reversible
- on ne garde pas encore un historique de moderation assez riche
- un admin ne peut pas corriger un listing sans le detruire puis le refaire

## Recommandation pragmatique

Ne pas partir tout de suite sur une grosse machine de guerre.

Faire une V2 admin en deux couches:

1. une couche simple et utile maintenant
2. une couche d'audit plus riche plus tard si le besoin apparait

## V2 recommandee

### 1. Statuts plus explicites

Faire evoluer le modele de `cat_sightings` pour supporter:

- `pending`
- `approved`
- `rejected`
- `deleted`

Cela permet:

- de rejeter sans supprimer
- de retirer un chat de l'affichage public sans perte immediate
- de garder une possibilite de restauration

### Matrice de transitions recommandee

Pour eviter une logique implicite qui change au fil du temps, il faut poser des transitions explicites entre statuts.

Statuts cibles:

- `pending`
- `approved`
- `rejected`
- `deleted`

Transitions recommandees:

- `pending -> approved`
- `pending -> rejected`
- `pending -> deleted`
- `approved -> deleted`
- `approved -> rejected` seulement si on assume qu'un admin peut de-publier vers un rejet explicite
- `rejected -> approved`
- `rejected -> deleted`
- `deleted -> approved`

Transitions a eviter par defaut:

- `deleted -> pending`
- `approved -> pending`
- `deleted -> rejected`

La regle simple peut etre:

- `pending` = en attente de moderation
- `approved` = visible publiquement
- `rejected` = refuse explicitement
- `deleted` = retire du site mais recuperable

### Sens produit de chaque transition

- `Approve`:
  - `pending -> approved`
  - `rejected -> approved`
- `Reject`:
  - `pending -> rejected`
  - eventuellement `approved -> rejected` si on veut marquer un retrait comme un rejet explicite
- `Remove`:
  - `pending -> deleted`
  - `approved -> deleted`
  - `rejected -> deleted`
- `Restore`:
  - `deleted -> approved` dans la version simple
- `Delete permanently`:
  - supprime la ligne, la photo et les references associees
  - ce n'est plus une transition d'etat, c'est une destruction finale

### Regle recommandee pour V2

Pour rester simple et robuste:

- ne pas reintroduire `pending` une fois qu'une moderation a deja eu lieu
- faire de `deleted` un etat de retrait reversible
- faire de `rejected` un etat editorial explicite
- faire revenir `deleted` vers `approved` dans la V2 simple

Si un besoin plus fin apparait plus tard, on pourra ajouter:

- `previous_status`

ou consigner cela proprement dans:

- `moderation_events`

### 2. Soft delete par defaut

Remplacer le `delete` admin actuel par un soft delete.

Concretement:

- bouton principal: `Remove`
- effet: passe le listing en `deleted`
- le listing disparait du site public
- la photo peut rester tant que l'entree est recuperable

Ajouter ensuite un second bouton plus dangereux:

- `Delete permanently`
- reserve au nettoyage final
- supprime la ligne, la photo et les references associees

### 3. Edition complete d'un listing

Permettre aux admins de modifier:

- nom
- quartier
- couleur
- comportements
- note
- coordonnees
- date
- photo
- statut

L'edition doit permettre:

- correction d'une faute
- correction d'une mauvaise localisation
- remplacement d'une photo mediocre
- normalisation d'un listing soumis approximativement

### 4. Tracabilite minimale

Ajouter au minimum sur `cat_sightings`:

- `approved_by`
- `approved_at`
- `rejected_by`
- `rejected_at`
- `deleted_by`
- `deleted_at`
- `updated_by`
- `updated_at`

Cela suffit deja pour un petit projet.

Concretement, cela doit permettre de savoir facilement:

- quel admin a approuve un listing
- quel admin l'a retire
- quel admin l'a modifie pour la derniere fois
- quand a eu lieu la derniere modification

Autrement dit, meme sans `moderation_events`, la fiche admin doit deja pouvoir afficher:

- `Approved by ... at ...`
- `Removed by ... at ...`
- `Last edited by ... at ...`

Cas particulier a cadrer:

- si une soumission passe par `open_auto_approve`, il faut pouvoir afficher un equivalent de:
  - `Approved by auto`
  - ou `Approved by system`

Le plus simple est probablement d'assumer une valeur technique stable du genre:

- `approved_by = auto`

ou un identifiant equivalent cote systeme.

L'important est d'eviter un trou d'audit entre:

- approbation manuelle
- approbation automatique

### 5. Journal de moderation plus tard

Option plus propre a terme: table `moderation_events`.

Champs suggérés:

- `id`
- `sighting_id`
- `admin_id`
- `action`
- `created_at`
- `reason` nullable
- `payload` nullable JSON

Actions possibles:

- `approved`
- `rejected`
- `edited`
- `removed`
- `restored`
- `deleted_permanently`
- `photo_replaced`

Cette table n'est pas obligatoire pour la prochaine iteration, mais elle devient interessante des que:

- plusieurs admins moderent souvent
- on veut expliquer une decision
- on veut garder l'historique des changements

## Pourquoi ne pas tout faire tout de suite

Cette V2 touche plusieurs couches a la fois:

- migrations SQL
- types TypeScript
- store `sightings-store`
- API routes admin
- panel admin
- gestion des photos et du storage
- liste des chats publics et filtres

Ce n'est pas irrealisable, mais ce n'est pas une micro-passe.

## Scope recommande pour la prochaine implementation

Le meilleur rapport valeur / effort me semble etre:

1. ajouter `rejected` et `deleted`
2. transformer la suppression admin actuelle en soft delete
3. ajouter `Delete permanently` comme action separee
4. ajouter les champs `rejected_*`, `deleted_*`, `updated_*`
5. permettre l'edition complete d'un listing
6. logger au moins le dernier admin ayant modifie l'entree

Et laisser `moderation_events` pour une phase suivante.

## UI admin suggeree

### Colonnes ou sections

- `Pending`
- `Approved`
- `Rejected`
- `Removed`

Le panel admin doit clairement separer:

- les demandes a approuver en premier
- les listings deja moderes ensuite

Une structure pratique serait:

1. `A approuver`
2. `Approuves`
3. `Rejetes`
4. `Supprimes`

Cela rend la zone de travail immediate evidente.

### Actions sur une fiche

- `Approve`
- `Reject`
- `Edit`
- `Remove`
- `Restore`
- `Delete permanently`

### Filtres et navigation dans le panel admin

Pour que le panel reste viable meme avec beaucoup de listings:

- la liste `A approuver` doit pouvoir etre repliee / deployee
- la liste `Approuves` doit pouvoir etre repliee / deployee
- la liste `Rejetes` doit pouvoir etre repliee / deployee
- la liste `Supprimes` doit pouvoir etre repliee / deployee

Autrement dit:

- clic sur l'entete de section
- la section s'ouvre ou se ferme
- le nombre d'elements doit rester visible meme quand la section est repliee

Exemple:

- `A approuver (12)`
- `Approuves (86)`
- `Supprimes (9)`

### Filtres utiles sur les listings moderes

Dans la zone des listings deja moderes, il faut pouvoir filtrer facilement par statut:

- `Approved`
- `Deleted`
- plus tard eventuellement `Rejected`

Le besoin concret est simple:

- voir rapidement ce qui est public
- voir rapidement ce qui a ete retire
- pouvoir restaurer un listing soft-delete sans fouiller tout le panel

### Restauration

Quand un listing est dans l'etat `deleted`, le panel doit proposer:

- `Restore`
- `Delete permanently`

Le bouton `Restore` remet le listing dans son etat visible approprie.

Le plus simple est probablement:

- si le listing etait supprime depuis un etat publie, il revient en `approved`
- sinon on peut choisir plus tard un systeme plus fin avec `previous_status`

### Edition

L'edition peut commencer de facon simple:

- ouverture dans un drawer ou une modal
- formulaire proche de la page `/submit`
- pre-rempli avec les donnees actuelles

L'objectif produit est clair:

- un admin ne doit pas avoir a supprimer puis recréer un listing pour corriger une erreur
- un listing public doit pouvoir etre nettoye, normalise ou enrichi sans etre detruit

## Settings de fonctionnement du site

Une autre extension utile du panel admin est d'ajouter une petite zone `Settings` pour piloter le comportement global du site.

L'idee n'est pas de construire un back-office geant, mais de poser une base propre pour quelques reglages produit simples.

### Premier setting recommande

Un premier setting tres utile serait le mode d'ouverture des soumissions.

Par exemple, une seule valeur `submission_mode` avec trois etats:

- `open_auto_approve`
- `open_with_moderation`
- `closed`

Ce que cela signifie:

- `open_auto_approve`
  les nouvelles soumissions sont acceptees automatiquement
- `open_with_moderation`
  les nouvelles soumissions arrivent en `pending` puis passent par l'admin
- `closed`
  la creation de nouveaux chats est fermee cote public

### Pourquoi c'est utile

Cela permet a l'admin de changer rapidement le mode de fonctionnement du site:

- ouvrir completement les ajouts pendant un evenement ou une phase de test
- revenir au mode normal avec validation
- fermer entierement les soumissions si besoin

### Impact produit

Ce setting doit piloter:

- la route `/submit`
- le FAB mobile
- plus generalement toutes les entrees publiques vers la creation d'un chat

En mode `closed`, il faut:

- masquer ou desactiver les CTA d'ajout
- ou afficher clairement que les soumissions sont temporairement fermees

En mode `open_auto_approve`, il faut:

- creer directement les nouvelles entrees en `approved`
- conserver une tracabilite indiquant que la publication etait automatique

Recommendation concrete:

- stocker une valeur stable du type `auto` ou `system` dans le champ d'approbation
- afficher ensuite cote admin: `Approved by auto`

### Implementation conseillee

Le plus propre serait de ne pas stocker cela en dur dans le code.

Il vaut mieux poser une petite table ou un mecanisme de settings extensible, par exemple:

- `site_settings`

Avec une structure simple du genre:

- `key`
- `value`
- `updated_by`
- `updated_at`

Ou une variante equivalente.

L'important est surtout de permettre d'ajouter d'autres settings plus tard sans refaire toute la plomberie.

### Exemples de futurs settings possibles

- ouverture / fermeture des soumissions
- mode de moderation
- affichage ou non de certains modules publics
- messages d'information globaux

### Recommandation pragmatique

Oui, cette idee merite d'etre dans la roadmap.

Mais il faut la penser comme:

- un premier `site setting` extensible

et non comme:

- un if special en plus dans la route de creation

## Suggestions utilisateurs depuis le site public

Une extension logique de cette V2 est de permettre a un utilisateur de suggerer une correction sur un chat deja visible.

Le point d'entree le plus naturel serait:

- depuis la fiche d'un chat
- ou depuis la carte / popup de ce chat

Le libelle peut rester simple:

- `Suggérer une correction`
- `Corriger ce chat`

En UI, le plus naturel est probablement:

- une icone crayon
- avec le sens classique `Edit`
- mais branchee vers une suggestion utilisateur, pas une edition directe

Autrement dit:

- cote admin: vraie edition
- cote public: suggestion d'edition

## Types de suggestions utiles

Les suggestions utilisateur peuvent couvrir:

- meilleure localisation
- meilleur quartier
- correction du nom
- correction de la couleur
- correction des comportements
- correction du commentaire
- proposition d'une meilleure photo

## Modele simple possible

Plus tard, une table dediee pourrait contenir par exemple:

- `id`
- `sighting_id`
- `type`
- `payload`
- `note` nullable
- `created_at`
- `status`

Avec des statuts du genre:

- `pending`
- `accepted`
- `rejected`

## Integration dans le panel admin

Ces suggestions ne doivent pas etre perdues au milieu des listings.

Le plus lisible serait d'avoir des sections distinctes et repliables:

1. `Soumissions a approuver`
2. `Suggestions de correction`
3. `Signalements`
4. `Listings approuves`
5. `Listings rejetes`
6. `Listings supprimes`

Chaque section doit pouvoir etre:

- repliee / deployee
- comptee
- consultee independamment

Exemples:

- `Soumissions a approuver (12)`
- `Suggestions de correction (5)`
- `Signalements (3)`
- `Approuves (86)`

## Traitement d'une suggestion

Une suggestion de correction devrait pouvoir etre:

- ouverte
- comparee a l'etat actuel du listing
- acceptee
- rejetee

Si elle est acceptee:

- le listing principal est mis a jour
- `updated_by` et `updated_at` sont renseignes
- plus tard, un `moderation_event` peut conserver le detail de la decision

## Signalements utilisateurs

En parallele des suggestions de correction, il est utile de permettre a un utilisateur de signaler un listing.

Le point d'entree le plus naturel serait:

- depuis la fiche d'un chat
- depuis la carte / popup

Le libelle peut rester simple:

- `Signaler`

En UI, le plus naturel est probablement:

- une icone warning / report classique

## Cas de signalement utiles

Les signalements peuvent couvrir par exemple:

- photo incorrecte
- mauvaise localisation
- doublon
- contenu trompeur
- chat qui n'est plus pertinent / plus visible
- contenu problematique

## Modele simple possible pour les signalements

Une table dediee pourrait contenir par exemple:

- `id`
- `sighting_id`
- `reason`
- `note` nullable
- `created_at`
- `status`

Avec des statuts du genre:

- `pending`
- `resolved`
- `dismissed`

## Integration des signalements dans l'admin

Les signalements doivent apparaitre dans leur propre section collapsable.

Le but est de ne pas les melanger avec:

- les nouvelles soumissions
- les suggestions de correction
- les listings deja moderes

Une fiche de signalement devrait permettre:

- d'ouvrir le listing concerne
- de voir la raison du report
- de traiter le signalement
- de retirer le listing si necessaire
- de rejeter le signalement si non pertinent

## Ordre de priorite recommande

Cette partie "suggestions utilisateur" ne doit probablement pas bloquer la V2 admin de base.

Le bon ordre reste:

1. edition admin complete
2. soft delete / restore / hard delete
3. tracabilite minimale
4. ensuite suggestions de correction depuis la carte ou la fiche
5. ensuite signalements utilisateur si le besoin devient concret

## Impact photo / storage

Regle recommandee:

- `Approve`, `Reject`, `Edit`, `Remove`, `Restore`: ne suppriment pas automatiquement la photo
- `Delete permanently`: supprime la photo du bucket et la reference DB

Ainsi on garde une vraie possibilite de recuperation.

## Conclusion

Oui, cette direction est bonne.

Le bon compromis n'est probablement pas:

- rester avec un `DELETE` brutal

ni:

- construire des maintenant un systeme de moderation ultra-complet

Le bon prochain pas est une V2 admin avec:

- soft delete
- edition complete
- rejet explicite
- tracabilite admin minimale

Puis, si le besoin grandit:

- journal `moderation_events`
- suggestions et signalements utilisateurs
