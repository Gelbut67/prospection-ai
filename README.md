# 🎯 Prospection AI - Étiquettes en Bobine

Application de prospection B2B automatisée avec IA, spécialisée dans la **recherche de nouveaux clients** pour une entreprise vendant des étiquettes en bobine (bouteilles, pots, flacons, emballages).

Stack : **React** + **Vite** + **Tailwind** + **Supabase** + **Vercel** + **OpenAI**

---

## ✨ Fonctionnalités

### 🤖 Découverte IA de Prospects
- L'IA trouve des entreprises réelles correspondant à vos critères
- Filtres : secteur, **département français**, taille, type de contenant, mots-clés
- Score de pertinence et raison du ciblage pour chaque prospect
- Génération d'email ultra-personnalisé par prospect

### 📋 Gestion des Prospects
- Base de données complète (CRUD, recherche, filtres, tags)
- Import en masse depuis la Découverte IA
- Statuts : nouveau, contacté, qualifié, converti, perdu

### 📧 Campagnes Email
- Templates avec variables dynamiques `{{first_name}}`, `{{company}}`, etc.
- Relances automatiques configurables
- Suivi : envoyé, ouvert, cliqué, répondu

### 📊 Analytics & Dashboard
- Statistiques en temps réel
- Graphiques de performance

### 🔐 Auth & Multi-utilisateurs
- Inscription / Connexion via Supabase Auth
- Row Level Security : chaque utilisateur ne voit que ses données

---

## 🚀 Déploiement (5 minutes)

### Étape 1 : Cloner et préparer le projet

```bash
git clone https://github.com/VOTRE-USERNAME/prospection-ai.git
cd prospection-ai
npm install
```

### Étape 2 : Créer un projet Supabase

1. Aller sur https://supabase.com → **New project**
2. Noter l'**URL** et la **anon key** (Settings → API)
3. Dans le **SQL Editor**, exécuter le contenu de `supabase/migrations/20250101000000_initial_schema.sql`

### Étape 3 : Configurer les Edge Functions

Installer la CLI Supabase :
```bash
npm install -g supabase
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
```

Déployer les functions :
```bash
supabase functions deploy discover-prospects
supabase functions deploy generate-email
supabase functions deploy send-email
```

Configurer les secrets dans **Supabase Dashboard → Edge Functions → Secrets** :
- `OPENAI_API_KEY` = votre clé OpenAI (pour la découverte IA)
- `RESEND_API_KEY` = votre clé Resend (pour l'envoi d'emails, optionnel)
- `FROM_EMAIL` = email expéditeur (ex: `contact@votredomaine.fr`)

### Étape 4 : Variables d'environnement locales

Créer `.env.local` :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

### Étape 5 : Tester en local

```bash
npm run dev
```

→ Ouvrir http://localhost:5173, créer un compte, tester la Découverte IA

### Étape 6 : Déployer sur Vercel

**Option A - Via GitHub (recommandé) :**
1. Pusher sur GitHub
2. Aller sur https://vercel.com → **Import Project** → sélectionner votre repo
3. Ajouter les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy !

**Option B - Via CLI :**
```bash
npm install -g vercel
vercel
```

---

## 📁 Structure du projet

```
├── src/
│   ├── lib/
│   │   └── supabase.js          # Client Supabase
│   ├── services/                # Appels à Supabase (CRUD)
│   │   ├── prospects.js
│   │   ├── campaigns.js
│   │   ├── emails.js
│   │   ├── discovery.js
│   │   └── analytics.js
│   ├── contexts/
│   │   └── AuthContext.jsx      # Gestion auth
│   ├── pages/
│   │   ├── Auth.jsx             # Login/Signup
│   │   ├── Dashboard.jsx
│   │   ├── Discovery.jsx        # 🎯 Module IA principal
│   │   ├── Prospects.jsx
│   │   ├── Campaigns.jsx
│   │   ├── CampaignDetail.jsx
│   │   ├── Emails.jsx
│   │   └── Analytics.jsx
│   └── components/
├── supabase/
│   ├── migrations/              # Schéma SQL
│   │   └── 20250101000000_initial_schema.sql
│   └── functions/               # Edge Functions (Deno)
│       ├── discover-prospects/  # Recherche IA
│       ├── generate-email/      # Email personnalisé IA
│       └── send-email/          # Envoi via Resend
├── vercel.json                  # Config Vercel
└── .env.example
```

---

## 🔑 Obtenir les clés API

### Supabase (gratuit)
https://supabase.com/dashboard → New project → Settings → API

### OpenAI (payant, ~$0.01/recherche)
https://platform.openai.com/api-keys

### Resend (gratuit jusqu'à 3000 emails/mois)
https://resend.com → API Keys

---

## 🗺️ Workflow typique

1. **Se connecter** → créer un compte
2. **Découverte IA** → définir critères (secteur, département, contenant) → Lancer
3. **Sélectionner les prospects pertinents** → Importer
4. **Créer une campagne** → rédiger l'email (avec variables)
5. **Associer des prospects** → Lancer la campagne
6. **Suivre** les ouvertures, clics, réponses dans Analytics

---

## 🛠️ Commandes utiles

```bash
npm run dev       # Serveur de dev local
npm run build     # Build production
npm run preview   # Preview du build

# Supabase
supabase start              # Supabase local (Docker)
supabase db reset           # Recréer la DB locale
supabase functions serve    # Tester les Edge Functions en local
```

---

## 📄 Licence

MIT
