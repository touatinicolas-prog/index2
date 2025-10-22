# 📖 Index Biblique - Application Web

Une application web moderne pour créer et gérer votre index biblique personnel avec notes et images, synchronisée via GitHub.

## ✨ Fonctionnalités

- 📚 **Organisation hiérarchique** : Catégories → Sous-catégories niveau 1 → Sous-catégories niveau 2
- 📝 **Notes personnelles** : Ajoutez vos réflexions et applications pour chaque verset
- 🖼️ **Gestion d'images** : Importez et associez des images (JPEG/PDF) à vos versets
- 🔄 **Synchronisation GitHub** : Toutes vos données sont sauvegardées sur votre dépôt GitHub
- 🌙 **Mode sombre** : Interface inspirée de JW Library avec thème sombre élégant
- ✏️ **Modes lecture/édition** : Basculez facilement entre consultation et modification
- 📱 **Responsive** : Fonctionne parfaitement sur iPad et iPhone
- 🎯 **Drag & Drop** : Réorganisez vos éléments par glisser-déposer

## 🚀 Installation

### 1. Créer un dépôt GitHub

1. Créez un nouveau dépôt sur GitHub (public ou privé)
2. Notez le nom du dépôt et votre nom d'utilisateur

### 2. Créer un Personal Access Token

1. Allez sur GitHub.com → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. **Generate new token (classic)**
4. Cochez la permission : `repo` (Full control of private repositories)
5. Générez et copiez le token (vous ne pourrez plus le voir après !)

### 3. Configurer l'application

1. Téléchargez tous les fichiers de ce projet
2. Copiez `config-example.js` et renommez-le `config.js`
3. Modifiez `config.js` avec vos informations :

```javascript
window.GITHUB_CONFIG = {
    owner: 'votre-username-github',
    repo: 'votre-repo',
    token: 'ghp_VotreTokenIci',
    branch: 'main'
};
```

### 4. Déployer sur GitHub

1. Uploadez tous les fichiers HTML, CSS et JS sur votre dépôt
2. Activez GitHub Pages dans les paramètres du dépôt
3. Votre application sera accessible à : `https://votre-username.github.io/votre-repo/`

## 📁 Structure des fichiers

```
index-biblique/
├── index.html           # Structure HTML principale
├── styles.css           # Design et styles
├── app.js              # Logique de l'application
├── github-sync.js      # Module de synchronisation GitHub
├── config-example.js   # Template de configuration
├── config.js           # Votre configuration (à créer)
└── README.md           # Ce fichier
```

## 🎨 Utilisation

### Mode Lecture vs Mode Édition

- **Mode Lecture** 📖 : Consultez vos versets et notes
- **Mode Édition** ✏️ : Ajoutez, modifiez, réorganisez vos données
- Cliquez sur l'icône stylo dans l'en-tête pour basculer

### Créer une catégorie

1. Passez en mode édition
2. Cliquez sur le bouton "+" dans la barre latérale
3. Remplissez le nom et choisissez le niveau
4. Enregistrez

### Ajouter un verset

1. Sélectionnez une catégorie
2. Cliquez sur "Nouveau Verset"
3. Remplissez :
   - Référence (ex: Jean 3:16)
   - Texte du verset (copié depuis JW Library)
   - Vos notes personnelles
   - Images (optionnel)
4. Enregistrez

### Réorganiser les éléments

En mode édition, glissez-déposez les catégories ou versets pour les réorganiser.

### Synchronisation

Cliquez sur l'icône de synchronisation (↻) pour sauvegarder vos modifications sur GitHub.

## 🔒 Sécurité

⚠️ **IMPORTANT** :
- Ne partagez JAMAIS votre token GitHub
- Ajoutez `config.js` à votre `.gitignore`
- Ne commitez pas `config.js` dans votre dépôt

## 📱 Utilisation sur iPad/iPhone

### Option 1 : Safari
1. Ouvrez l'URL de votre application
2. Appuyez sur le bouton partage
3. "Sur l'écran d'accueil"
4. L'app se lancera en plein écran

### Option 2 : GitHub Pages
Votre application est accessible partout via l'URL GitHub Pages.

## 🛠️ Structure des données

Les données sont stockées dans `bible-index-data.json` :

```json
{
  "categories": [
    {
      "id": "cat-1",
      "name": "Foi",
      "order": 0,
      "subcategories_level1": [
        {
          "id": "sub1-1",
          "name": "Prière",
          "order": 0,
          "verses": [
            {
              "id": "verse-1",
              "reference": "Matthieu 6:9",
              "text": "Voici donc comment vous devez prier...",
              "notes": "Ma réflexion...",
              "images": ["https://..."],
              "order": 0,
              "created": "2025-10-22T10:30:00Z",
              "modified": "2025-10-22T10:30:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

## 🎯 Fonctionnalités avancées

### Compression automatique des images
Les images sont automatiquement compressées avant l'upload pour économiser l'espace GitHub.

### Sauvegarde automatique
Vos modifications sont sauvegardées sur GitHub à chaque synchronisation.

### Mode hors ligne
L'application fonctionne hors ligne après le premier chargement (les données restent en cache).

## ❓ Dépannage

### L'application ne se connecte pas à GitHub
- Vérifiez que votre token est correct et actif
- Vérifiez les noms du dépôt et de l'utilisateur
- Assurez-vous que le token a les permissions `repo`

### Les images ne s'affichent pas
- Vérifiez que les images sont bien au format JPEG ou PDF
- Les images sont stockées dans le dossier `images/` du dépôt

### Erreur de synchronisation
- Vérifiez votre connexion internet
- Assurez-vous que le dépôt existe et est accessible
- Consultez la console du navigateur (F12) pour plus de détails

## 📚 Bibliothèques utilisées

- [SortableJS](https://sortablejs.github.io/Sortable/) - Drag & drop
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) - Compression d'images

## 📝 Licence

Ce projet est libre d'utilisation pour votre usage personnel.

## 🤝 Contribution

N'hésitez pas à améliorer ce projet selon vos besoins !

---

**Créé avec ❤️ pour faciliter l'étude biblique personnelle**
