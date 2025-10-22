// ===== Configuration GitHub =====
// INSTRUCTIONS:
// 1. Copiez ce fichier et renommez-le "config.js"
// 2. Remplacez les valeurs ci-dessous avec vos informations GitHub
// 3. NE PARTAGEZ JAMAIS votre token GitHub publiquement

window.GITHUB_CONFIG = {
    // Votre nom d'utilisateur GitHub
    owner: 'touatinicolas-prog',
    
    // Le nom de votre dépôt GitHub
    repo: 'index2',
    
    // Votre Personal Access Token GitHub
    // Pour créer un token:
    // 1. Allez sur GitHub.com
    // 2. Settings → Developer settings → Personal access tokens → Tokens (classic)
    // 3. Generate new token (classic)
    // 4. Cochez les permissions: "repo" (Full control of private repositories)
    // 5. Copiez le token généré et collez-le ci-dessous
    token: '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',
    
    // La branche à utiliser (généralement 'main' ou 'master')
    branch: 'main'
};

// IMPORTANT: Ajoutez "config.js" à votre .gitignore pour ne pas exposer votre token !
// Si vous n'avez pas de .gitignore, créez-en un avec cette ligne:
// config.js
