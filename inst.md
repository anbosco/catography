Coucou petit projet random:
Faire un site web qui cartographie les chats qu'on croise dans la rue à toulouse: 
Faut une carte de Toulouse, possiblement une carte interactive: on peut "cliquer" ou quoi sur un quartier (mais pas nécéssaire en vrai, c'est juste mieux -- genre on peut voir un quartier en particulier pour voir ses chats hihi) ; ajouter des chats à la carte (avec des infos facultatives sur le chat genre couleur et comportement (fuyant? social?) et une photo du chat (ils ont aps le droit au RGPD soyons honnêtes); en sachant qu'on devrait laisser un utilisateur anonyme upload une photo/infos (mieux que se login sur ce genre de service) -> faut peut-être compress les photos pour pas qu'un upload prenne trop de place surtout si on utilise un service gratuit style vercel ou quoi pour heberger le site.
Aussi besoin d'une page d'admin accessible par mot de passe et nom d'utilisateur pour pouvoir gérer le truc, i.e. supprimer les mauvais listings etc.

Tu penses c'est faisable facilement? j'ai jamais fait de sites react etc mais avec chatgpt codex ça se "vibe" code non ? Surtout le design du site sera extremement simple, juste un truc moderne avec une carte interactive; des listing sur la carte en sachant qu'un listing sur la carte doit laisser s'ouvrir une carte avec la photo et les infos sur le chat (et plus tard on mettra peut-être un "voir plus" qui ouvre une page pour un chat en particulier? jsp

Run en local pour le dev/test et upload sur Vercel après? autre plateforme?

--- REPONSE/ANSWER

Oui. Franchement, **oui, c’est très faisable**, et c’est même un bon projet “premier vrai site utile” à coder avec IA.

Le bon cadrage, c’est de **ne pas partir sur un truc trop ambitieux dès le début**.
Ton MVP peut être très simple :

* une **carte interactive de Toulouse**
* des **points/chatons** dessus
* clic sur un point → petite fiche avec **photo + couleur + comportement + date + commentaire**
* un **formulaire d’ajout anonyme**
* une **page admin protégée** pour valider/supprimer les entrées

Ça, oui, c’est complètement réaliste.

### Ce qui est facile

La carte interactive, les markers, la popup au clic, le filtre par quartier, la fiche de chat: ce n’est pas le problème. Avec une stack web moderne, c’est standard. MapLibre GL JS sait afficher des marqueurs et des données GeoJSON sur une carte interactive. Next.js fournit tout le socle pour faire le site et les actions serveur. ([Next.js][1])

### Ce qui est moins trivial

Le vrai sujet, c’est :

* **upload anonyme**
* **stockage des photos**
* **anti-spam / anti-abus**
* **modération admin**
* **coût / quotas**

C’est là que les projets “simples” deviennent chiants si c’est mal pensé.

## La stack que je te conseillerais

Je te conseille un truc banal et robuste :

**Frontend + backend**

* **Next.js** pour le site complet, parce que tu peux faire front + routes serveur + auth admin dans le même projet. Next.js a une doc officielle claire sur l’authentification et la protection des routes. ([Next.js][2])

**Base de données**

* **Supabase Postgres** pour stocker les chats, les coordonnées, les métadonnées, le statut de modération, etc.
* éventuellement **Supabase Auth** juste pour l’admin
* Supabase met en avant Auth, Storage et les politiques de sécurité type Row Level Security. ([Supabase][3])

**Carte**

* **MapLibre** pour afficher Toulouse et les points des chats. C’est propre, moderne, open source. ([Next.js][2])

**Images**

* idéalement **Cloudinary** pour les photos, parce qu’ils gèrent l’upload, l’optimisation, le redimensionnement, le format auto et la compression bien mieux que toi. Leur doc indique l’upload programmatique et les transformations/optimisations d’image. ([Cloudinary][4])

## L’architecture la plus propre

Je ferais ça :

1. **Le visiteur remplit un formulaire**

   * photo
   * position sur la carte
   * quartier facultatif
   * couleur facultative
   * comportement facultatif
   * commentaire facultatif

2. **Le backend reçoit l’upload**

   * vérifie taille/type
   * compresse/redimensionne
   * stocke l’image
   * crée une entrée en base avec `status = pending`

3. **La carte publique n’affiche que les chats approuvés**

4. **L’admin se connecte**

   * voit la liste des entrées pending
   * approuve / refuse / supprime

C’est la version propre.
**Ne fais pas de publication instantanée anonyme** au début. Sinon tu vas te prendre du spam, du porno, des trolls, des gens qui uploadent n’importe quoi.

## Auth admin

L’admin par “nom d’utilisateur + mot de passe”, oui, aucun problème.
Soit :

* un login simple avec **Supabase Auth**
* soit un accès protégé par session/cookie côté Next.js

Pour un petit projet, **un seul compte admin**, c’est largement suffisant. Next.js documente justement les patterns d’authentification et de protection d’accès. ([Next.js][2])

## Upload anonyme

Oui, c’est possible, mais il faut être un minimum sérieux :

* limiter la taille des images
* accepter seulement jpeg/webp/png
* redimensionner
* mettre un captcha ou au moins une protection anti-spam plus tard
* stocker en “pending”

Cloudinary est précisément utile ici parce qu’ils savent optimiser et servir les images via CDN avec transformations à la volée. ([Cloudinary][5])

## Quartiers de Toulouse

Tu n’as même pas besoin de faire un système compliqué au début.

Version simple :

* on met juste les chats sur la carte
* on ajoute un **filtre par zone approximative** plus tard
* ou un champ “quartier” choisi dans une liste

Version un peu plus propre ensuite :

* tu ajoutes des polygones de quartiers
* clic sur quartier → filtre des chats dans cette zone

Mais honnêtement, pour V1, **je laisserais tomber le clic sur quartier**.
Ça sent le truc “sympa” qui te fait perdre du temps trop tôt.

## RGPD et photos

Ta blague sur “les chats n’ont pas le droit au RGPD” est drôle, mais fais gaffe à un truc très concret :
le problème, ce n’est pas le chat, c’est **les humains, plaques, adresses, façades privées trop identifiables** dans les photos.

Donc règle simple :

* n’accepter que des photos centrées sur le chat
* prévoir suppression facile
* éventuellement petit texte du genre “n’uploadez pas de personnes identifiables”

## Est-ce que c’est faisable en mode vibe coding ?

Oui. Clairement oui.

Mais il faut être lucide : **vibe coder un CRUD + upload + carte + admin**, ça marche si tu gardes le scope serré.
Si tu commences direct avec :

* comptes utilisateurs
* favoris
* commentaires
* pages individuelles
* géolocalisation live
* quartiers cliquables ultra propres
* modération fine
* compression maison
* analytics
* etc.

… tu vas te noyer.

## Mon avis pratique

Le meilleur plan :

### V1

* carte Toulouse
* affichage des chats approuvés
* popup avec photo + infos
* formulaire anonyme
* stockage des entrées en pending
* page admin simple pour approuver/supprimer

### V2

* filtres couleur/comportement/quartier
* page détail d’un chat
* meilleure modération
* clustering sur la carte si beaucoup de points

### V3

* statistiques débiles mais marrantes
  genre “quartier le plus chat-friendly”, “chat le plus social”, “densité féline”

## Niveau difficulté

Je dirais :

* **design** : facile
* **carte** : facile à moyen
* **CRUD des chats** : facile
* **upload image** : moyen
* **auth admin** : moyen
* **modération correcte** : moyen
* **déploiement propre** : moyen

Donc non, ce n’est pas “un mini site en 2 heures” si tu pars de zéro.
Mais ce n’est **pas du tout hors de portée**.

Pour un débutant motivé avec ChatGPT/Codex :

* MVP crédible : **oui**
* truc poli et propre : **oui aussi**
* truc blindé production à grande échelle : non, pas sans apprendre un minimum

## Recommandation brute

Je ferais **Next.js + Supabase + Cloudinary + MapLibre**.
C’est probablement le compromis le moins con pour ce projet aujourd’hui : un framework full-stack moderne, une base SQL simple avec auth/sécurité intégrées, un service d’images qui évite de bricoler la compression toi-même, et une carte interactive open source. ([Next.js][1])

Donc oui : **faisable**, **bon projet**, **très “vibe-code-able”**, à condition de rester sobre.

Je peux te pondre juste après un **plan ultra concret de V1** avec l’architecture, les tables SQL et les pages à créer, sans partir dans du blabla.

[1]: https://nextjs.org/blog/next-16?utm_source=chatgpt.com "Next.js 16"
[2]: https://nextjs.org/docs/app/guides/authentication?utm_source=chatgpt.com "Guides: Authentication"
[3]: https://supabase.com/docs?utm_source=chatgpt.com "Supabase Docs"
[4]: https://cloudinary.com/documentation/upload_images?utm_source=chatgpt.com "Programmatically Uploading Images, Videos, and Other Files"
[5]: https://cloudinary.com/documentation/image_transformations?utm_source=chatgpt.com "Image Transformations for Developers | Documentation"
