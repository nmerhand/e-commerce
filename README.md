# Épure — boutique en ligne

Application e-commerce responsive en français : catalogue, comptes clients, panier persistant, paiement simulé et administration des produits/commandes.

## Fonctionnalités

- Catalogue filtrable par recherche et catégorie, pages de détail et stock visible.
- Inscription/connexion et historique des commandes.
- Panier persistant rattaché au compte ; vérification du stock et des prix côté serveur.
- Passage de commande avec adresse de livraison et paiement simulé (aucune donnée bancaire).
- Administration protégée par rôle pour créer, modifier et désactiver des produits, consulter et expédier les commandes.
- API REST documentée dans [`docs/openapi.yaml`](docs/openapi.yaml).

## Stack et prérequis

- Node.js 22 LTS ou plus récent, npm 10 ou plus récent.
- Docker Desktop avec Docker Compose (ou PostgreSQL 17 installé localement).
- TypeScript, React 19, Vite, Express 5, PostgreSQL 17, Prisma 7.

## Démarrage avec Docker Compose (recommandé)

1. Copier la configuration et définir un secret de session aléatoire (au moins 32 octets) dans `.env` :

   ```powershell
   Copy-Item .env.example .env
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Copier la valeur générée dans `SESSION_SECRET`. Pour créer un compte administrateur, renseigner aussi `ADMIN_EMAIL` et `ADMIN_PASSWORD` (12 caractères minimum). Ne jamais partager ni committer `.env`.

2. Construire et démarrer les services :

   ```powershell
   docker compose up --build -d
   ```

   L’API applique les migrations et charge le seed idempotent au démarrage. Celui-ci crée les produits de démonstration sans écraser les modifications ultérieures et, si configuré, crée/promeut le compte administrateur.

3. Ouvrir l’application sur <http://localhost:5173>. L’API est disponible sur <http://localhost:3000> ; son endpoint de santé est `/api/health`.

Les données PostgreSQL sont conservées dans le volume `ecommerce-data`. Arrêter les services avec `docker compose down`; `docker compose down -v` supprime également les données.

## Développement sans conteneur applicatif

Démarrer PostgreSQL 17 (Docker uniquement pour la base est possible), copier `.env.example` vers `.env`, puis régler `DATABASE_URL` avec une URL PostgreSQL accessible depuis l’hôte :

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
```

Dans deux terminaux :

```powershell
npm run dev --workspace @ecommerce/api
npm run dev --workspace @ecommerce/web
```

Vite relaie `/api` vers `http://localhost:3000`. Pour une autre cible, définir `API_PROXY_TARGET`.

## Tests et qualité

```powershell
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Les tests API utilisent des dépôts factices et Supertest ; ils n’exigent pas de serveur PostgreSQL. La CI GitHub Actions exécute génération Prisma, lint, format, vérification TypeScript, tests et builds à chaque push et pull request.

## Structure du projet

```text
apps/
  api/src/
    middleware/       # CSRF et contrôles transversaux
    modules/          # auth, catalogue, panier, commandes, administration
    app.ts             # composition Express et erreurs HTTP
    main.ts            # dépendances Prisma et démarrage du serveur
  web/src/
    features/          # composants et clients API par domaine fonctionnel
    lib/               # requêtes HTTP partagées
    App.tsx            # routes et navigation
prisma/
  migrations/          # migrations SQL versionnées
  schema.prisma
  seed.ts
docs/
  architecture.md
  database.md
  openapi.yaml
```

Chaque module API sépare routes/validation, logique métier et accès aux données. Les services métier sont testables sans base réelle.

## Sécurité et limites connues

- Mots de passe hachés en Argon2id ; JWT de session dans un cookie HttpOnly, SameSite et durée limitée.
- Contrôle CSRF double-submit pour les requêtes modifiantes, contrôle d’origine, validation Zod, limitation des tentatives d’authentification, Helmet et contrôle de rôle administrateur.
- Les montants sont calculés côté serveur avec Decimal et les stocks décrémentés dans une transaction de commande.
- Le paiement est volontairement simulé et ne contacte aucun prestataire.
- Les images de produits sont référencées par URL HTTP(S) ; elles ne sont pas téléversées ni stockées par l’application.
- Le compose fourni sert au développement local. Avant une mise en production, configurer TLS, secrets et CORS adaptés, sauvegardes, supervision, gestion des images et un serveur de fichiers statiques optimisé.

## Git

Le workflow prévu utilise `main` (stable), `develop` (intégration) et une branche `feature/...` par fonctionnalité. Les commits suivent Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
