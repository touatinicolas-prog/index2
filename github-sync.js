// ===== GitHub Sync Module with LocalStorage Config =====
const GitHubSync = {
    owner: '',
    repo: '',
    token: '',
    branch: 'main',
    dataFile: 'bible-index-data.json',
    
    /**
     * Initialize config from localStorage
     */
    init() {
        const savedConfig = localStorage.getItem('github_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.owner = config.owner || '';
                this.repo = config.repo || '';
                this.token = config.token || '';
                this.branch = config.branch || 'main';
                console.log('✅ Configuration chargée depuis localStorage');
                return true;
            } catch (error) {
                console.error('Erreur de chargement config:', error);
                return false;
            }
        }
        
        // Try to load from window.GITHUB_CONFIG if available (backward compatibility)
        if (window.GITHUB_CONFIG) {
            this.owner = window.GITHUB_CONFIG.owner || '';
            this.repo = window.GITHUB_CONFIG.repo || '';
            this.token = window.GITHUB_CONFIG.token || '';
            this.branch = window.GITHUB_CONFIG.branch || 'main';
            
            // Save to localStorage for next time
            this.saveConfig();
            console.log('✅ Configuration chargée depuis config.js et sauvegardée');
            return true;
        }
        
        console.warn('⚠️ Aucune configuration trouvée');
        return false;
    },
    
    /**
     * Save config to localStorage
     */
    saveConfig() {
        const config = {
            owner: this.owner,
            repo: this.repo,
            token: this.token,
            branch: this.branch
        };
        localStorage.setItem('github_config', JSON.stringify(config));
        console.log('💾 Configuration sauvegardée');
    },
    
    /**
     * Update config with new values
     */
    updateConfig(owner, repo, token, branch = 'main') {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.branch = branch;
        this.saveConfig();
    },
    
    /**
     * Clear saved config
     */
    clearConfig() {
        localStorage.removeItem('github_config');
        this.owner = '';
        this.repo = '';
        this.token = '';
        this.branch = 'main';
        console.log('🗑️ Configuration effacée');
    },
    
    /**
     * Fetch data from GitHub repository
     */
    async fetchData() {
        if (!this.validateConfig()) {
            console.error('❌ Configuration GitHub manquante');
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
            
            // Decode base64 to binary string
            const base64Content = fileData.content.replace(/\n/g, '');
            const binaryString = atob(base64Content);
            
            // Convert binary string to Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Decode UTF-8 bytes to string
            const utf8Decoder = new TextDecoder('utf-8');
            const content = utf8Decoder.decode(bytes);
            
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
            
            // Prepare the content - ensure proper UTF-8 encoding
            const content = JSON.stringify(data, null, 2);
            
            // Convert string to UTF-8 bytes using TextEncoder
            const utf8Encoder = new TextEncoder();
            const utf8Array = utf8Encoder.encode(content);
            
            // Convert Uint8Array to base64 string
            const base64String = this.arrayBufferToBase64(utf8Array);
            
            // Prepare the request body
            const body = {
                message: `Update bible index - ${new Date().toISOString()}`,
                content: base64String,
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
                    'Content-Type': 'application/json; charset=utf-8'
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
     * Convert Uint8Array to base64 string (proper UTF-8 safe method)
     */
    arrayBufferToBase64(uint8Array) {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
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
                return null;
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

// Initialize config on load
GitHubSync.init();
