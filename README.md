# Joyeux Appétit Gaming

Appli mobile-first pour les soirées jeux entre potes : chacun choisit son profil sans inscription,
vote pour les jeux du soir, compose les équipes, saisit les scores, et tout est historisé.

## Pile

- Nuxt 4 + TypeScript, mode SPA, routes serveur Nitro comme backend
- PostgreSQL via Drizzle ORM : Neon en production, PGlite (Postgres embarqué) en local sans rien installer
- Jaquettes récupérées via l'API RAWG, côté serveur
- Déploiement Vercel

## Démarrer en local

```bash
npm install
cp .env.example .env
npm run dev
```

Sans `DATABASE_URL`, l'appli crée une base PGlite dans `.data/pglite` et applique les migrations
au premier appel. Pour les jaquettes, ajoute une clé gratuite RAWG dans `.env` :

```
NUXT_RAWG_API_KEY=ta_cle
```

Sans clé, tout fonctionne mais les jeux sont ajoutés sans jaquette.

## Base de données

Le schéma est dans `server/db/schema.ts`. Après une modification :

```bash
npm run db:generate
```

génère une migration SQL dans `server/db/migrations`. En local, PGlite l'applique au prochain
`npm run dev`. En production, `npm run db:migrate` l'applique sur Neon (le script `vercel-build`
le fait automatiquement avant chaque build Vercel).

Modèle : `players`, `game_nights`, `games` (catalogue global, tous en lice chaque soir), `votes`
(soirée + jeu + joueur), `played_games` (jeux cochés comme joués lors d'une soirée), `teams`
(par soirée), `team_members`, `matches`, `results` (un résultat vise soit un joueur, soit une équipe).

## Déployer sur Vercel

1. Créer un projet Neon et récupérer la chaîne de connexion, ou ajouter l'intégration Neon
   depuis le marketplace Vercel qui la fournit en variable d'environnement.
2. Dans Vercel, définir `DATABASE_URL` et `NUXT_RAWG_API_KEY`.
3. Importer le repo. Vercel utilise le script `vercel-build`, qui migre puis construit.

## Structure

```
app/            pages, composants, composables, styles (Nuxt 4)
server/api/     routes REST (joueurs, soirées, jeux, votes, équipes, parties)
server/db/      schéma Drizzle, connexion, migrations
server/utils/   accès base, RAWG, sérialisation des soirées
shared/types.ts DTO partagés front/back
```

## Flux d'une soirée

1. Accueil : choisir son profil ou en créer un, mémorisé sur l'appareil.
2. Ce soir : tout le catalogue est en lice, chacun vote pour un ou plusieurs jeux, tout se met à
   jour en direct. Tri par votes (défaut, à égalité les plus joués d'abord), par jeux les plus
   joués, ou alphabétique dans les deux sens.
3. Équipes : composer ou tirer au hasard, valider.
4. Résultat : choisir le jeu, solo ou par équipe, saisir les scores ou classer à la main.
   En fin de soirée, cocher les jeux réellement joués : c'est ce qui alimente « joué x fois ».
5. Historique et Profil : soirées passées, parties, victoires, meilleurs jeux, meilleur duo.
6. Jeux : le catalogue partagé. On y ajoute des jeux (recherche RAWG ou saisie libre), on corrige
   un titre, et on colle un lien http vers une jaquette quand aucune n'a été trouvée. Un jeu jamais
   joué peut être supprimé ; les autres restent car ils font partie de l'historique.
7. Clore la soirée : les votes sont figés et une nouvelle soirée démarre à la visite suivante.

## Date des soirées

Par défaut, une soirée tombe le mercredi : la prochaine soirée est créée sur le premier mercredi
à venir, ou le mercredi suivant si une soirée existe déjà à cette date. La date se change à tout
moment depuis l'écran Ce soir (lien « Changer » sous le titre) ou depuis le détail d'une soirée
dans l'historique. Le jour par défaut est la constante `DEFAULT_WEEKDAY` dans `server/utils/night.ts`.
