# Catography

Petit projet pour cartographier les chats croises dans Toulouse.

## Etat actuel

- `Next.js 16` avec App Router
- home avec carte interactive `MapLibre`
- route `/submit` pour la future soumission anonyme
- route `/admin` pour la future moderation
- donnees mockees pour avancer sans backend

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

Necessaire quand on voudra stocker les signalements et proteger la page admin.

Variables prevues :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Cloudinary

Necessaire quand on voudra accepter de vraies photos avec optimisation.

Variables prevues :

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Notes

- Le projet utilise `webpack` pour `dev` et `build` afin d'eviter un crash `Turbopack` observe dans cet environnement.
- La carte pointe pour l'instant sur des donnees statiques et un style de demo `MapLibre`.
