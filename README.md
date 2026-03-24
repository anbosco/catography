# Catography

Petit projet pour cartographier les chats croises dans Toulouse.

## Etat actuel

- `Next.js 16` avec App Router
- home avec carte interactive `MapLibre`
- route `/submit` pour la soumission anonyme par clic sur la carte
- route `/admin` pour la moderation des listings pending et approved
- API locale de signalements avec persistance dans `data/sightings.json`

## Lancer le projet

```bash
npm install
npm run dev
```

Le projet tourne ensuite sur `http://127.0.0.1:3000`.

## Scripts utiles

```bash
npm run dev
npm run lint
npm run build
```

## Services a brancher ensuite

### Supabase

Choix retenu pour la V1 : base, storage et auth admin dans le meme backend.

Variables prevues :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=cat-photos
```

## Notes

- Le projet utilise `webpack` pour `dev` et `build` afin d'eviter un crash `Turbopack` observe dans cet environnement.
- Le stockage fichier local reste temporaire. L'objectif est de le remplacer par Supabase.
- La suite probable du projet cote moderation est decrite dans [`docs/admin-v2-roadmap.md`](docs/admin-v2-roadmap.md).
