// ===== GitHub Sync Module =====
const GitHubSync = {
    owner: window.GITHUB_CONFIG?.owner || '',
    repo: window.GITHUB_CONFIG?.repo || '',
    token: window.GITHUB_CONFIG?.token || '',
    branch: window.GITHUB_CONFIG?.branch || 'main',
    dataFile: 'bible-index-data.json',
    
    /**
     * Fetch data from GitHub repository
     */
    async fetchData() {
        if (!this.validateConfig()) {
            console.error('❌ Configuration GitHub manquante. Vérifiez votre fichier config.js');
            return null;
        }
        
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}?ref=${this.branch}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                console.log('📝 Fichier de données non trouvé, création d\'un nouveau fichier...');
                return { categories: [] };
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const fileData = await response.json();
            const content = atob(fileData.content);
            const data = JSON.parse(content);
            
            console.log('✅ Données chargées depuis GitHub');
            return data;
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement depuis GitHub:', error);
            throw error;
        }
    },
    
    /**
     * Save data to GitHub repository
     */
    async saveData(data) {
        if (!this.validateConfig()) {
            throw new Error('Configuration GitHub manquante');
        }
        
        try {
            // First, get the current file SHA if it exists
            const currentFile = await this.getCurrentFileSHA();
            
            // Prepare the content
            const content = JSON.stringify(data, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Prepare the request body
            const body = {
                message: `Update bible index - ${new Date().toISOString()}`,
                content: encodedContent,
                branch: this.branch
            };
            
            // Add SHA if file exists
            if (currentFile) {
                body.sha = currentFile.sha;
            }
            
            // Make the request
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
            }
            
            const result = await response.json();
            console.log('✅ Données sauvegardées sur GitHub');
            return result;
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde sur GitHub:', error);
            throw error;
        }
    },
    
    /**
     * Get current file SHA (needed for updates)
     */
    async getCurrentFileSHA() {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}?ref=${this.branch}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                return null; // File doesn't exist yet
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            return { sha: data.sha };
            
        } catch (error) {
            console.error('Erreur lors de la récupération du SHA:', error);
            return null;
        }
    },
    
    /**
     * Upload image to GitHub
     */
    async uploadImage(base64Image, imageName) {
        if (!this.validateConfig()) {
            throw new Error('Configuration GitHub manquante');
        }
        
        try {
            // Remove data:image/... prefix if present
            const base64Content = base64Image.includes(',') 
                ? base64Image.split(',')[1] 
                : base64Image;
            
            const path = `images/${imageName}`;
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
            
            const body = {
                message: `Add image ${imageName}`,
                content: base64Content,
                branch: this.branch
            };
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
            }
            
            const result = await response.json();
            console.log(`✅ Image ${imageName} uploadée sur GitHub`);
            
            // Return the download URL
            return result.content.download_url;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'upload de l\'image:', error);
            throw error;
        }
    },
    
    /**
     * Validate GitHub configuration
     */
    validateConfig() {
        if (!this.owner || !this.repo || !this.token) {
            console.error('Configuration GitHub incomplète:', {
                owner: !!this.owner,
                repo: !!this.repo,
                token: !!this.token
            });
            return false;
        }
        return true;
    },
    
    /**
     * Test GitHub connection
     */
    async testConnection() {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Connexion GitHub réussie:', data.full_name);
            return true;
            
        } catch (error) {
            console.error('❌ Échec de connexion GitHub:', error);
            return false;
        }
    }
};

// Test connection on load
if (window.GITHUB_CONFIG) {
    GitHubSync.testConnection().then(success => {
        if (success) {
            console.log('🔗 Connecté au dépôt:', `${GitHubSync.owner}/${GitHubSync.repo}`);
        } else {
            console.error('⚠️ Impossible de se connecter à GitHub. Vérifiez votre configuration.');
        }
    });
} else {
    console.warn('⚠️ Fichier config.js non trouvé. Créez-le à partir de config-example.js');
}
