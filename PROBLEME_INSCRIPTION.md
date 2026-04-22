# 🔧 Solution : La page disparaît après inscription

## 🎯 Problème
Après l'inscription, la page clignote et revient à la page de connexion.

## 🔍 Cause
Par défaut, Supabase **exige une confirmation par email** avant de connecter l'utilisateur.

## ✅ Solution : Désactiver la confirmation email (mode développement)

### Étape 1 : Aller dans les paramètres Supabase

1. Ouvrez votre projet Supabase
2. Cliquez sur **⚙️ Authentication** (menu de gauche)
3. Cliquez sur **Providers** (sous-menu)
4. Cliquez sur **Email**

### Étape 2 : Désactiver la confirmation

1. Trouvez la section **"Confirm email"**
2. **Décochez** l'option **"Enable email confirmations"**
3. Cliquez sur **Save** en bas

### Étape 3 : Tester à nouveau

1. Retournez sur http://localhost:5175
2. Créez un nouveau compte (avec un autre email)
3. ✅ Vous devriez être connecté immédiatement !

---

## 🔐 Alternative : Utiliser la confirmation email (production)

Si vous voulez garder la confirmation email activée (recommandé en production) :

### Modifier le code pour gérer la confirmation

Éditez `src/pages/Auth.jsx` ligne 22-23 :

```jsx
} else {
  const { data } = await signUp(email, password);
  
  // Vérifier si l'email nécessite une confirmation
  if (data?.user?.identities?.length === 0) {
    toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
  } else {
    toast.success('Compte créé et connecté !');
  }
}
```

---

## 📧 Configurer l'envoi d'emails (optionnel)

Si vous voulez activer les emails de confirmation :

1. Supabase → **Authentication** → **Email Templates**
2. Configurez votre domaine d'envoi
3. Personnalisez les templates d'emails

Mais pour le développement, **désactivez simplement la confirmation** ! 😊
