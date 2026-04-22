# 📥 Installer Supabase CLI sur Windows

## 🎯 Méthode 1 : Téléchargement direct (RECOMMANDÉ)

### Étape 1 : Télécharger
1. Allez sur : **https://github.com/supabase/cli/releases/latest**
2. Cherchez le fichier : **`supabase_windows_amd64.zip`**
3. Téléchargez-le

### Étape 2 : Installer
1. Extrayez le fichier ZIP
2. Vous aurez un fichier `supabase.exe`
3. Déplacez `supabase.exe` dans : `C:\Program Files\Supabase\`
   (créez le dossier si nécessaire)

### Étape 3 : Ajouter au PATH
1. Recherchez "Variables d'environnement" dans Windows
2. Cliquez sur "Modifier les variables d'environnement système"
3. Cliquez sur "Variables d'environnement..."
4. Dans "Variables système", trouvez "Path" et cliquez sur "Modifier"
5. Cliquez sur "Nouveau"
6. Ajoutez : `C:\Program Files\Supabase`
7. Cliquez sur "OK" partout

### Étape 4 : Vérifier
Ouvrez un **nouveau terminal PowerShell** et tapez :
```powershell
supabase --version
```

✅ Si vous voyez un numéro de version, c'est installé !

---

## 🎯 Méthode 2 : Utiliser npx (PLUS SIMPLE, pas d'installation)

Au lieu d'installer la CLI, vous pouvez utiliser `npx` directement :

```powershell
npx supabase login
npx supabase link --project-ref VOTRE_REF
npx supabase functions deploy discover-prospects
npx supabase functions deploy generate-email
npx supabase functions deploy send-email
```

**Avantage** : Pas besoin d'installer, ça fonctionne directement !

---

## 🚀 Après l'installation

### 1. Se connecter à Supabase
```powershell
supabase login
```
→ Une page web s'ouvre → Autorisez → Copiez le token → Collez dans le terminal

### 2. Trouver votre Reference ID
1. Supabase Dashboard → **Settings** → **General**
2. Copiez le **Reference ID** (ex: `abcdefgh`)

### 3. Lier votre projet
```powershell
supabase link --project-ref VOTRE_REF
```

### 4. Déployer les Edge Functions
```powershell
supabase functions deploy discover-prospects
supabase functions deploy generate-email
supabase functions deploy send-email
```

### 5. Ajouter la clé OpenAI
1. Supabase Dashboard → **Edge Functions** → **Manage secrets**
2. Ajoutez :
   - **Name** : `OPENAI_API_KEY`
   - **Value** : Votre clé OpenAI (obtenez-la sur https://platform.openai.com/api-keys)

---

## ✅ Tester

Retournez sur votre app et testez la Découverte IA !
