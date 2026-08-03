# Herve_eShop

Application e-commerce React + Express connectee a Supabase.

Le projet expose :
- un frontend Vite/React pour la boutique publique
- un serveur Express pour les routes metier et l'administration
- une integration Supabase pour l'authentification, les donnees et le stockage media

## Etat actuel

Le code est maintenant aligne sur le projet Supabase actuellement utilise via une couche de compatibilite serveur dans `server/compatRoutes.ts`.

Cette couche permet de faire fonctionner l'application avec le schema Supabase reel disponible aujourd'hui, notamment :
- `laptops`
- `orders`
- `blog_posts`
- `notifications`
- `admin_users`

Certaines parties de l'interface admin ne disposent pas encore de tables dediees dans la base actuelle. Elles fonctionnent donc en mode compatibilite, avec des structures stables cote serveur pour eviter les crashs :
- categories
- CMS site/contact/social
- banners
- guides
- audit logs

Important :
- ces modules chargent correctement dans l'interface
- mais leurs donnees ne sont pas toutes persistees dans Supabase tant que le schema cible n'est pas cree

## Prerequis

- Node.js 20+
- npm
- un projet Supabase actif

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner :

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_API_BASE_URL="https://your-render-backend.onrender.com"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ALLOWED_ORIGINS="https://your-vercel-frontend.vercel.app"
```

Description :
- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : cle publique utilisee par le frontend
- `VITE_API_BASE_URL` : URL publique du backend Render, utilisee par le frontend deploye sur Vercel
- `SUPABASE_SERVICE_ROLE_KEY` : cle serveur utilisee pour les operations admin et la compatibilite
- `ALLOWED_ORIGINS` : liste des domaines frontend autorises a appeler le backend, separes par des virgules

## Installation

```bash
npm install
```

## Lancement en local

Mode developpement :

```bash
npm run dev
```

Ce script lance :
- le serveur Express avec `tsx --watch`
- le frontend Vite

Mode production local :

```bash
npm run build
npm run start
```

## Scripts utiles

- `npm run dev` : lance frontend + serveur en developpement
- `npm run lint` : verifie TypeScript sans emission
- `npm run build` : build frontend + bundle serveur
- `npm run start` : lance le serveur compile
- `npm run setup-storage` : script d'initialisation du stockage Supabase

## Architecture rapide

- `src/` : frontend React
- `server.ts` : point d'entree Express
- `server/compatRoutes.ts` : adaptation entre le frontend et le schema Supabase courant
- `src/lib/api.ts` : client HTTP utilise par le frontend
- `src/lib/supabase.ts` : client Supabase frontend
- `types/supabase.ts` : types utilises par le projet
- `render.yaml` : configuration de deploiement Render

## Compatibilite Supabase

Le frontend historique attendait un schema plus riche que la base actuellement disponible. Pour eviter de bloquer la publication, le serveur convertit les donnees reelles vers les formats attendus par l'UI.

Exemples de mappings :
- `laptops` -> produits admin/public
- `orders` -> devis/commandes frontend
- `blog_posts` -> articles admin/public
- `admin_users` + `auth.users` -> authentification admin

## Deploiement

Le projet peut etre deploye sur Render avec le fichier `render.yaml`.

Configuration attendue :
- build command : `npm ci && npm run build`
- start command : `npm run start`

Variables a definir dans l'environnement de deploiement :
- `NODE_ENV=production`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ALLOWED_ORIGINS`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploiement Render + Vercel

Architecture recommandee :
- frontend React sur Vercel
- backend Express sur Render
- base de donnees, auth et storage sur Supabase

Ordre recommande :
1. deployer le backend sur Render
2. recuperer l'URL publique Render
3. configurer le frontend Vercel avec cette URL
4. renseigner ensuite le domaine Vercel autorise dans Render

### 1. Backend sur Render

Le backend est porte par `server.ts`.

Variables Render a definir :
- `NODE_ENV=production`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS=https://ton-frontend.vercel.app`

Tu peux aussi autoriser plusieurs domaines :

```env
ALLOWED_ORIGINS=https://ton-frontend.vercel.app,https://ton-projet-git-main.vercel.app
```

### 2. Frontend sur Vercel

Le frontend utilise `src/lib/api.ts`, qui supporte maintenant une URL d'API configurable via `VITE_API_BASE_URL`.

Variables Vercel a definir :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL=https://ton-backend.onrender.com`

Le fichier `vercel.json` force aussi les routes SPA a retomber sur `index.html`, ce qui permet d'ouvrir directement des URLs comme `/admin`.

### 3. Parametres Vercel conseilles

- framework preset : `Vite`
- build command : `npm run build`
- output directory : `dist`

### 4. Verification croisee

Une fois les deux deployes :
- ouvrir le frontend Vercel
- verifier que le catalogue charge
- verifier qu'une connexion admin appelle bien le backend Render
- verifier que les erreurs CORS n'apparaissent pas dans la console navigateur

## Verification avant publication

Verifier localement :

```bash
npm run lint
npm run build
npm run start
```

## Limitations connues

- Les modules `CMS`, `categories`, `banners`, `guides` et `audit logs` ne sont pas encore adosses a un schema Supabase complet.
- Le bundle frontend est volumineux et Vite emet encore un avertissement de taille de chunk.
- Le fichier `sql.txt` ne doit pas etre applique tel quel sur une base de production existante sans revue, car il peut contenir des operations destructives.

## Prochaine etape recommandee

Pour sortir totalement du mode compatibilite, il faut :
- soit creer les vraies tables Supabase manquantes
- soit simplifier l'interface admin aux seules fonctionnalites supportees par la base actuelle
