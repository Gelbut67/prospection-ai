# 🚀 Déploiement sur Vercel - Guide Complet

## 📋 Prérequis
✅ Code committé sur Git (fait !)
✅ Projet Supabase créé et configuré (fait !)

---

## 🎯 Étape 1 : Créer le repository GitHub

### Option A : Via GitHub Desktop (plus simple)
1. Téléchargez **GitHub Desktop** : https://desktop.github.com
2. Ouvrez GitHub Desktop
3. **File** → **Add Local Repository** → Sélectionnez `C:/Users/GaripYasar/CascadeProjects/windsurf-project-2`
4. Cliquez sur **Publish repository**
5. Nom : `prospection-ai`
6. Décochez **Keep this code private** (ou laissez coché si vous voulez un repo privé)
7. Cliquez sur **Publish repository**

### Option B : Via ligne de commande
```powershell
# 1. Créez un nouveau repo sur https://github.com/new
# Nom : prospection-ai
# Ne cochez RIEN (pas de README, pas de .gitignore)

# 2. Puis dans le terminal :
git remote add origin https://github.com/VOTRE-USERNAME/prospection-ai.git
git branch -M main
git push -u origin main
```

---

## 🚀 Étape 2 : Déployer sur Vercel

### 1. Créer un compte Vercel
1. Allez sur **https://vercel.com**
2. Cliquez sur **Sign Up**
3. Choisissez **Continue with GitHub**
4. Autorisez Vercel à accéder à vos repos

### 2. Importer le projet
1. Sur Vercel, cliquez sur **Add New...** → **Project**
2. Trouvez `prospection-ai` dans la liste
3. Cliquez sur **Import**

### 3. Configurer le projet
1. **Framework Preset** : Vite (devrait être détecté automatiquement)
2. **Root Directory** : `.` (laisser par défaut)
3. **Build Command** : `npm run build` (déjà configuré)
4. **Output Directory** : `dist` (déjà configuré)

### 4. Ajouter les variables d'environnement
Cliquez sur **Environment Variables** et ajoutez :

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://VOTRE-PROJET.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (votre clé anon) |

**Où trouver ces valeurs ?**
- Supabase Dashboard → **Settings** → **API**

### 5. Déployer
1. Cliquez sur **Deploy**
2. ⏳ Attendez 1-2 minutes
3. ✅ Votre site est en ligne !

---

## 🌐 Étape 3 : Configurer le domaine Vercel dans Supabase

**Important** : Supabase doit autoriser votre domaine Vercel pour l'authentification.

1. Copiez l'URL de votre site Vercel (ex: `https://prospection-ai.vercel.app`)
2. Allez dans **Supabase Dashboard** → **Authentication** → **URL Configuration**
3. Dans **Site URL**, mettez : `https://prospection-ai.vercel.app`
4. Dans **Redirect URLs**, ajoutez :
   - `https://prospection-ai.vercel.app/**`
   - `http://localhost:5173/**` (pour le dev local)
5. Cliquez sur **Save**

---

## ✅ Étape 4 : Tester votre site en ligne

1. Ouvrez l'URL Vercel (ex: `https://prospection-ai.vercel.app`)
2. Créez un compte
3. Testez la création de prospects
4. ✨ Votre app est en ligne !

---

## 🔄 Déploiement automatique

Maintenant, **chaque fois que vous pushez sur GitHub**, Vercel redéploiera automatiquement !

```powershell
# Après avoir fait des modifications :
git add .
git commit -m "Description des changements"
git push
```

→ Vercel détecte le push et redéploie automatiquement en 1-2 minutes !

---

## 🎨 Personnaliser le domaine (optionnel)

### Domaine Vercel gratuit
Par défaut : `https://prospection-ai.vercel.app`

Vous pouvez le changer :
1. Vercel Dashboard → Votre projet → **Settings** → **Domains**
2. Ajoutez un nouveau domaine Vercel (ex: `mon-app.vercel.app`)

### Domaine personnalisé (payant)
Si vous avez un domaine (ex: `prospection.votresite.fr`) :
1. Vercel → **Domains** → Ajoutez votre domaine
2. Configurez les DNS selon les instructions Vercel
3. Mettez à jour la **Site URL** dans Supabase

---

## 🐛 Problèmes fréquents

### "Build failed"
→ Vérifiez que les variables d'environnement sont bien configurées dans Vercel

### "Authentication error" sur le site en ligne
→ Vérifiez que l'URL Vercel est bien dans les **Redirect URLs** de Supabase

### "Cannot read properties of undefined"
→ Videz le cache du navigateur (Ctrl+Shift+R)

---

## 📊 Résumé

✅ Code sur GitHub  
✅ Déployé sur Vercel  
✅ Variables d'environnement configurées  
✅ Domaine autorisé dans Supabase  
✅ Déploiement automatique activé  

**Votre application est maintenant accessible partout dans le monde !** 🌍
