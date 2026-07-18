# Cercle — Tontine digitale (version pro)

App de gestion de tontines : cotisations, ordre de passage, cagnotte verrouillée, distribution contrôlée par l'administrateur. Installable comme app (PWA).

## ⚠️ À savoir avant de démarrer — ce que l'app fait et ne fait pas

Cette app tient un **grand livre (ledger)** qui trace chaque dépôt confirmé et chaque distribution, avec une cagnotte visible par tous et verrouillée pour tout le monde sauf l'admin. C'est une couche de **suivi et de contrôle d'accès**, pas un compte bancaire.

L'app ne déplace pas de vrai argent toute seule : les cotisations arrivent par Airtel Money/Orange Money **en dehors de l'app**, l'admin vérifie la réception puis clique "Marquer payé" (ça enregistre le dépôt dans le grand livre). Pour la distribution, même chose en sens inverse : l'admin envoie l'argent via mobile money, puis clique "Distribuer" dans l'app pour clôturer le tour proprement.

Si un jour tu veux que l'app **manipule vraiment l'argent** (déposer/retirer automatiquement via API mobile money), il faudra un contrat avec Airtel/Orange (API marchande) et vérifier les obligations légales locales (déclaration d'activité, KYC, etc.) — je ne suis pas juriste, donc à valider avec un professionnel si tu vas dans cette direction.

## Ce qui est verrouillé au niveau serveur (pas juste caché dans l'interface)

- Seul l'organisateur d'une tontine peut : démarrer un tour, marquer une cotisation payée, distribuer la cagnotte.
- Ces vérifications se font **côté API** (middleware `requireOrganizer*`), donc même en modifiant le code du navigateur, un membre ne peut pas déclencher ces actions.
- Chaque utilisateur reçoit un token JWT à l'inscription ; toutes les routes protégées exigent ce token.
- Toute action sur l'argent (dépôt confirmé, distribution) crée une ligne dans la table `transactions`, jamais une simple modification de solde — traçabilité complète.

## Mise en place

### 1. Supabase
1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute tout `schema.sql` (6 tables : users, tontines, tontine_members, rounds, contributions, transactions).
3. Récupère dans **Project Settings → API** : `Project URL` et la clé `service_role` (pas `anon`).

### 2. Variables d'environnement
Copie `server/.env.example` vers `server/.env` (en local) ou ajoute-les en Secrets sur ta plateforme d'hébergement :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET` — génère une longue chaîne aléatoire unique (ex: `openssl rand -hex 32`)

### 3. Lancer
```
cd server
npm install
node index.js
```
Le frontend (`client/`) est servi directement par Express — un seul serveur pour tout.

### 4. Installer comme app (PWA)
Une fois le site ouvert dans Chrome/Edge sur mobile ou desktop, un bandeau "Installer" apparaît automatiquement (ou via le menu du navigateur → "Installer l'application"). L'app fonctionne ensuite hors-ligne pour la consultation ; les actions (paiement, distribution) nécessitent une connexion.

## Structure du projet

```
tontine/
├── schema.sql                       # Tables Supabase (inclut transactions/ledger)
├── .replit
├── server/
│   ├── index.js                     # Bootstrap Express (aucune logique métier)
│   ├── config/env.js                # Variables d'environnement centralisées
│   ├── db/supabaseClient.js
│   ├── middleware/
│   │   ├── auth.js                  # Signature/vérification JWT
│   │   ├── permissions.js           # requireOrganizer* — le vrai verrou admin
│   │   ├── validate.js              # Validation des entrées (express-validator)
│   │   └── errorHandler.js          # Gestion d'erreurs centralisée
│   ├── routes/                      # Définition des endpoints + règles de validation
│   ├── controllers/                 # Fins — appellent les services, formatent la réponse
│   ├── services/                    # Toute la logique métier (cagnotte, distribution...)
│   └── utils/                       # logger, AppError, génération de code
└── client/
    ├── index.html                  # Frontend (une page, HTML/CSS/JS)
    ├── manifest.json                # PWA
    ├── service-worker.js            # Cache hors-ligne
    └── icons/                       # Icônes de l'app installée
```

## Comment ça marche (flux complet)

1. **Inscription** : nom + téléphone → reçoit un token JWT stocké sur l'appareil.
2. **Créer une tontine** : devient automatiquement admin (organisateur), génère un code d'invitation.
3. **Rejoindre** : les membres entrent le code, sont ajoutés dans l'ordre d'arrivée.
4. **Démarrer un tour** (admin) : le prochain membre dans l'ordre devient bénéficiaire ; une cotisation "à payer" est créée pour chaque membre.
5. **Cotiser** : chaque membre paie hors-app (mobile money) ; l'admin vérifie et clique "Marquer payé" → dépôt enregistré dans le grand livre → la cagnotte augmente, **visible par tous**.
6. **Distribuer** (admin seulement) : l'admin envoie l'argent au bénéficiaire hors-app, puis clique "Distribuer" → transaction de distribution enregistrée, tour clôturé, cagnotte remise à zéro pour ce cycle.

## Prochaines étapes possibles
- Authentification par SMS (OTP) au lieu du simple formulaire nom/téléphone.
- Rappels automatiques avant chaque échéance (SMS/notification push).
- Export PDF de l'historique complet des transactions.
- Intégration réelle avec l'API marchande Airtel/Orange Money pour automatiser dépôts et distributions (nécessite contrat + conformité légale).
