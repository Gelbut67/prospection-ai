# 🚀 Guide de Démarrage Rapide

## ⚡ Étape 1 : Créer votre projet Supabase (5 minutes)

### 1. Créer le compte
1. Allez sur **https://supabase.com**
2. Cliquez sur **Start your project** → **Sign in with GitHub**
3. Autorisez Supabase

### 2. Créer le projet
1. Cliquez sur **New project**
2. Remplissez :
   - **Name** : `prospection-ai` (ou autre nom)
   - **Database Password** : choisissez un mot de passe fort (notez-le !)
   - **Region** : `Europe (Frankfurt)` ou `Europe (Paris)`
3. Cliquez sur **Create new project**
4. ⏳ Attendez 2-3 minutes que le projet soit créé

### 3. Récupérer vos identifiants
1. Une fois le projet créé, cliquez sur **⚙️ Settings** (en bas à gauche)
2. Allez dans **API**
3. Vous verrez :
   - **Project URL** → Copiez-la (ex: `https://abcdefgh.supabase.co`)
   - **Project API keys** → Copiez la clé **`anon` `public`** (commence par `eyJ...`)

---

## 📝 Étape 2 : Créer la base de données

### 1. Ouvrir le SQL Editor
1. Dans Supabase, cliquez sur **🔧 SQL Editor** (menu de gauche)
2. Cliquez sur **+ New query**

### 2. Copier le schéma SQL
1. Ouvrez le fichier `supabase/migrations/20250101000000_initial_schema.sql` dans votre projet
2. **Copiez TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Collez-le** dans le SQL Editor de Supabase
4. Cliquez sur **▶️ Run** (en bas à droite)
5. ✅ Vous devriez voir "Success. No rows returned"

---

## 🔑 Étape 3 : Configurer votre projet local

### 1. Renommer le fichier template
Dans votre projet, vous avez maintenant un fichier `.env.local.template`.

**Renommez-le en `.env.local`** :
```powershell
Rename-Item .env.local.template .env.local
```

### 2. Remplir vos identifiants
Ouvrez `.env.local` et remplacez :
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEyMzQ1NjcsImV4cCI6MTk5NjgxMDU2N30.xxxxx
```

---

## 🎯 Étape 4 : Tester l'application

```powershell
npm run dev
```

→ Ouvrez **http://localhost:5173**  
→ Vous devriez voir la **page de connexion** !

### Créer votre premier compte
1. Cliquez sur **Créer un compte**
2. Entrez un email et mot de passe
3. ✅ Vous êtes connecté !

**Note :** Pour l'instant, la **Découverte IA** ne fonctionnera pas (besoin d'OpenAI). Mais vous pouvez :
- Créer des prospects manuellement
- Créer des campagnes
- Tester l'interface

---

## 🤖 Étape 5 : Activer la Découverte IA (optionnel)

### 1. Obtenir une clé OpenAI
1. Allez sur **https://platform.openai.com/api-keys**
2. Créez un compte (carte bancaire requise, mais ~0,01€/recherche)
3. Cliquez sur **+ Create new secret key**
4. Copiez la clé (commence par `sk-proj-...`)

### 2. Installer la CLI Supabase
```powershell
npm install -g supabase
```

### 3. Se connecter
```powershell
supabase login
```
→ Une page web s'ouvre → **Authorize** → Copiez le token → Collez dans le terminal

### 4. Lier votre projet
Trouvez votre **Reference ID** :
- Supabase Dashboard → Settings → General → **Reference ID** (ex: `abcdefgh`)

Puis :
```powershell
supabase link --project-ref abcdefgh
```

### 5. Déployer les Edge Functions
```powershell
supabase functions deploy discover-prospects
supabase functions deploy generate-email
supabase functions deploy send-email
```

### 6. Ajouter votre clé OpenAI
1. Dans Supabase Dashboard → **Edge Functions** (menu gauche)
2. Cliquez sur **⚙️ Manage secrets** (en haut à droite)
3. Ajoutez :
   - **Name** : `OPENAI_API_KEY`
   - **Value** : `sk-proj-...` (votre clé)
4. Cliquez sur **Add secret**

### 7. Tester la Découverte IA
1. Retournez sur http://localhost:5173
2. Allez dans **Découverte IA**
3. Remplissez les critères (secteur, département, etc.)
4. Cliquez sur **🔍 Lancer la recherche**
5. ✨ L'IA trouve des prospects !

---

## 📧 Étape 6 : Activer l'envoi d'emails (optionnel)

### 1. Créer un compte Resend
1. Allez sur **https://resend.com**
2. Créez un compte (gratuit jusqu'à 3000 emails/mois)
3. Allez dans **API Keys** → **Create API Key**
4. Copiez la clé (commence par `re_...`)

### 2. Ajouter les secrets Supabase
Dans **Edge Functions → Manage secrets**, ajoutez :
- **Name** : `RESEND_API_KEY` → **Value** : `re_...`
- **Name** : `FROM_EMAIL` → **Value** : `contact@votredomaine.fr`

### 3. Tester l'envoi
1. Créez une campagne
2. Associez des prospects
3. Cliquez sur **Lancer la campagne**
4. ✅ Les emails sont envoyés !

---

## 🚀 Étape 7 : Déployer sur Vercel (optionnel)

### 1. Pusher sur GitHub
```powershell
git remote add origin https://github.com/VOTRE-USERNAME/prospection-ai.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Vercel
1. Allez sur **https://vercel.com**
2. Cliquez sur **Import Project**
3. Sélectionnez votre repo GitHub
4. Dans **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Cliquez sur **Deploy**
6. ✅ Votre app est en ligne !

---

## ❓ Problèmes fréquents

### "Erreur lors du chargement des données"
→ Vérifiez que `.env.local` contient les bonnes valeurs Supabase

### "Non authentifié"
→ Créez un compte dans l'app (page de connexion)

### "La découverte IA ne fonctionne pas"
→ Vérifiez que :
1. Les Edge Functions sont déployées (`supabase functions list`)
2. La clé `OPENAI_API_KEY` est dans les secrets Supabase
3. Votre compte OpenAI a du crédit

### "Les emails ne partent pas"
→ Vérifiez que `RESEND_API_KEY` et `FROM_EMAIL` sont dans les secrets Supabase

---

## 📞 Besoin d'aide ?

Dites-moi où vous bloquez et je vous aide ! 😊
