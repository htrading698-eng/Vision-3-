# Vision Skool — Déploiement Vercel depuis mobile

## ÉTAPE 1 : Compte Vercel (3 min)

1. Va sur **vercel.com** dans Safari/Chrome
2. Clique **Sign Up**
3. Choisis **Continue with GitHub** (crée un GitHub si tu n'en as pas — gratuit)
4. Autorise Vercel à accéder à ton GitHub

## ÉTAPE 2 : Upload du projet (5 min)

### Option A — Via GitHub (recommandé, mises à jour faciles)

1. Va sur **github.com** dans Safari
2. Clique le **+** en haut → **New repository**
3. Nom : `vision-skool` → **Create repository**
4. Sur la page du repo → **uploading an existing file**
5. Glisse-dépose ou sélectionne TOUS les fichiers du ZIP décompressé
6. Commit changes
7. Retour sur Vercel → **Add New Project** → sélectionne `vision-skool` → **Deploy**
8. Attends 2-3 minutes
9. Vercel te donne une URL `vision-skool-xxx.vercel.app`

### Option B — Upload direct du ZIP

1. Sur Vercel : **Add New Project**
2. Clique **Browse all templates** en bas
3. Cherche **Vite** → sélectionne
4. Tu auras un projet template à modifier ensuite via GitHub

## ÉTAPE 3 : Mises à jour futures

Quand je te donne un nouveau ecole-business.jsx :
1. Va sur ton repo GitHub
2. Ouvre `src/App.jsx`
3. Clique le crayon (édit)
4. Sélectionne tout → colle le nouveau contenu
5. Commit
6. Vercel redéploie automatiquement en 2-3 min

## STRUCTURE DU PROJET

```
vision-skool/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── src/
    ├── main.jsx
    └── App.jsx  ← Le gros fichier avec ton site
```

## SI ÇA NE MARCHE PAS

- **Erreur build** : vérifie que App.jsx est bien le bon fichier (1,7 MB)
- **Page blanche** : ouvre la console Vercel pour voir l'erreur
- **Trop long** : le premier build prend 3-5 min (normal pour un fichier de 1,7 MB)

Bon déploiement !
