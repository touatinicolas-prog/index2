// ===== Application State =====
const AppState = {
    mode: 'read', // 'read' or 'edit'
    theme: 'dark', // 'light' or 'dark'
    currentView: 'welcome', // 'welcome', 'list', 'detail'
    currentCategory: null,
    currentSubcategory1: null,
    currentSubcategory2: null,
    currentVerse: null,
    data: {
        categories: []
    }
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📖 Initialisation de l\'Index Biblique...');
    
    // Check if GitHub config exists
    if (!GitHubSync.validateConfig()) {
        console.warn('⚠️ Configuration GitHub manquante');
        showSettingsModal();
        return;
    }
    
    // Load data from GitHub
    await loadDataFromGitHub();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial view
    renderCurrentView();
    
    console.log('✅ Application prête !');
});

// ===== Settings Modal =====
function showSettingsModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const currentConfig = {
        owner: GitHubSync.owner || '',
        repo: GitHubSync.repo || '',
        token: GitHubSync.token || '',
        branch: GitHubSync.branch || 'main'
    };
    
    modalTitle.textContent = '⚙️ Configuration GitHub';
    modalBody.innerHTML = `
        <form id="settingsForm">
            <div class="form-group">
                <label for="githubOwner">Nom d'utilisateur GitHub *</label>
                <input type="text" id="githubOwner" class="form-input" required 
                       value="${currentConfig.owner}" placeholder="votre-username">
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    Votre nom d'utilisateur GitHub (ex: touatinicolas-prog)
                </p>
            </div>
            <div class="form-group">
                <label for="githubRepo">Nom du dépôt *</label>
                <input type="text" id="githubRepo" class="form-input" required 
                       value="${currentConfig.repo}" placeholder="index2">
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    Le nom de votre dépôt GitHub
                </p>
            </div>
            <div class="form-group">
                <label for="githubToken">Token GitHub *</label>
                <input type="password" id="githubToken" class="form-input" required 
                       value="${currentConfig.token}" placeholder="ghp_...">
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    Votre Personal Access Token (permissions: repo)
                </p>
                <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--accent-color); font-size: 12px;">
                    Créer un token →
                </a>
            </div>
            <div class="form-group">
                <label for="githubBranch">Branche</label>
                <input type="text" id="githubBranch" class="form-input" 
                       value="${currentConfig.branch}" placeholder="main">
            </div>
            <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin: 16px 0;">
                <p style="font-size: 13px; color: var(--text-secondary);">
                    🔒 <strong>Sécurité :</strong> Vos informations sont stockées localement dans votre navigateur. 
                    Elles ne sont jamais envoyées ailleurs que sur votre dépôt GitHub.
                </p>
            </div>
            <div class="modal-footer">
                ${currentConfig.owner ? '<button type="button" class="secondary-btn" onclick="clearGitHubConfig()">Effacer</button>' : ''}
                <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
                <button type="submit" class="primary-btn">Sauvegarder</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    
    // Handle form submission
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGitHubConfig();
    });
}

async function saveGitHubConfig() {
    const owner = document.getElementById('githubOwner').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    const branch = document.getElementById('githubBranch').value.trim() || 'main';
    
    if (!owner || !repo || !token) {
        showStatus('❌ Tous les champs sont requis', 'error');
        return;
    }
    
    showStatus('⏳ Test de connexion...', 'info');
    
    // Update config
    GitHubSync.updateConfig(owner, repo, token, branch);
    
    // Test connection
    const connected = await GitHubSync.testConnection();
    
    if (connected) {
        closeModal();
        showStatus('✅ Configuration sauvegardée', 'success');
        
        // Reload data
        await loadDataFromGitHub();
        renderCurrentView();
    } else {
        showStatus('❌ Échec de connexion - Vérifiez vos informations', 'error');
    }
}

function clearGitHubConfig() {
    if (confirm('Êtes-vous sûr de vouloir effacer la configuration ?')) {
        GitHubSync.clearConfig();
        closeModal();
        showStatus('🗑️ Configuration effacée', 'success');
        
        // Show settings modal again
        setTimeout(() => {
            showSettingsModal();
        }, 1000);
    }
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
    // Mode toggle
    document.getElementById('modeToggle').addEventListener('click', toggleMode);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Sync button
    document.getElementById('syncBtn').addEventListener('click', syncData);
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', showSettingsModal);
    
    // Get started button
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        openModal('category');
    });
    
    // Add category button
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        openModal('category');
    });
    
    // Add verse button
    document.getElementById('addVerseBtn').addEventListener('click', () => {
        openModal('verse');
    });
    
    // Back to list button
    document.getElementById('backToListBtn').addEventListener('click', () => {
        AppState.currentVerse = null;
        AppState.currentView = 'list';
        renderCurrentView();
    });
    
    // Delete verse button
    document.getElementById('deleteVerseBtn').addEventListener('click', deleteCurrentVerse);
    
    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

// ===== Mode Toggle =====
function toggleMode() {
    AppState.mode = AppState.mode === 'read' ? 'edit' : 'read';
    
    // Toggle visibility of edit-mode elements
    const editElements = document.querySelectorAll('.hidden-read-mode');
    editElements.forEach(el => {
        el.style.display = AppState.mode === 'read' ? 'none' : '';
    });
    
    // Update icon
    const editIcon = document.getElementById('editIcon');
    if (AppState.mode === 'edit') {
        editIcon.innerHTML = `
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        `;
    } else {
        editIcon.innerHTML = `
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        `;
    }
    
    showStatus(AppState.mode === 'read' ? '📖 Mode Lecture' : '✏️ Mode Édition', 'success');
}

// ===== Theme Toggle =====
function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('dark-mode');
    showStatus(AppState.theme === 'dark' ? '🌙 Mode Sombre' : '☀️ Mode Clair', 'success');
}

// ===== Data Management =====
async function loadDataFromGitHub() {
    try {
        showStatus('⏳ Chargement des données...', 'info');
        const data = await GitHubSync.fetchData();
        
        if (data) {
            AppState.data = data;
            renderCategoryNav();
            showStatus('✅ Données chargées', 'success');
        } else {
            // Initialize with empty structure
            AppState.data = { categories: [] };
            showStatus('📝 Nouveau fichier de données créé', 'success');
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        showStatus('❌ Erreur de chargement', 'error');
        AppState.data = { categories: [] };
    }
}

async function syncData() {
    try {
        showStatus('⏳ Synchronisation...', 'info');
        await GitHubSync.saveData(AppState.data);
        showStatus('✅ Synchronisé avec GitHub', 'success');
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        showStatus('❌ Échec de la synchronisation', 'error');
    }
}

// ===== Rendering Functions =====
function renderCurrentView() {
    // Hide all views
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('verseListView').classList.add('hidden');
    document.getElementById('verseDetailView').classList.add('hidden');
    
    // Show current view
    if (AppState.currentView === 'welcome') {
        document.getElementById('welcomeScreen').classList.remove('hidden');
    } else if (AppState.currentView === 'list') {
        document.getElementById('verseListView').classList.remove('hidden');
        renderVerseList();
    } else if (AppState.currentView === 'detail') {
        document.getElementById('verseDetailView').classList.remove('hidden');
        renderVerseDetail();
    }
}

function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = '';
    
    if (AppState.data.categories.length === 0) {
        nav.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Aucune catégorie</p>';
        return;
    }
    
    // Sort categories by order
    const sortedCategories = [...AppState.data.categories].sort((a, b) => a.order - b.order);
    
    sortedCategories.forEach(category => {
        const categoryEl = createCategoryElement(category);
        nav.appendChild(categoryEl);
    });
    
    // Enable drag & drop in edit mode
    if (AppState.mode === 'edit') {
        new Sortable(nav, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: (evt) => {
                reorderCategories(evt.oldIndex, evt.newIndex);
            }
        });
    }
}

function createCategoryElement(category, level = 0) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.dataset.id = category.id;
    
    const link = document.createElement('a');
    link.className = 'category-link';
    link.style.marginLeft = `${level * 20}px`;
    
    const hasChildren = category.subcategories_level1 && category.subcategories_level1.length > 0;
    
    link.innerHTML = `
        ${AppState.mode === 'edit' ? '<span class="drag-handle">⋮⋮</span>' : ''}
        <span>${category.name}</span>
        ${hasChildren ? '<button class="category-expand">›</button>' : ''}
    `;
    
    link.addEventListener('click', (e) => {
        if (!e.target.classList.contains('category-expand')) {
            navigateToCategory(category, level);
        }
    });
    
    div.appendChild(link);
    
    // Add subcategories
    if (hasChildren) {
        const subContainer = document.createElement('div');
        subContainer.className = 'subcategory-list hidden';
        
        category.subcategories_level1.forEach(sub => {
            const subEl = createCategoryElement(sub, level + 1);
            subContainer.appendChild(subEl);
        });
        
        div.appendChild(subContainer);
        
        // Expand/collapse logic
        const expandBtn = link.querySelector('.category-expand');
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                subContainer.classList.toggle('hidden');
                expandBtn.classList.toggle('expanded');
            });
        }
    }
    
    return div;
}

function navigateToCategory(category, level) {
    if (level === 0) {
        AppState.currentCategory = category;
        AppState.currentSubcategory1 = null;
        AppState.currentSubcategory2 = null;
    } else if (level === 1) {
        AppState.currentSubcategory1 = category;
        AppState.currentSubcategory2 = null;
    } else if (level === 2) {
        AppState.currentSubcategory2 = category;
    }
    
    AppState.currentView = 'list';
    renderCurrentView();
}

function renderVerseList() {
    const breadcrumb = document.getElementById('breadcrumb');
    const verseList = document.getElementById('verseList');
    
    // Update breadcrumb
    let breadcrumbHTML = '';
    if (AppState.currentCategory) {
        breadcrumbHTML = AppState.currentCategory.name;
        if (AppState.currentSubcategory1) {
            breadcrumbHTML += ` › ${AppState.currentSubcategory1.name}`;
            if (AppState.currentSubcategory2) {
                breadcrumbHTML += ` › ${AppState.currentSubcategory2.name}`;
            }
        }
    }
    breadcrumb.textContent = breadcrumbHTML;
    
    // Get verses from current location
    let verses = [];
    if (AppState.currentSubcategory2) {
        verses = AppState.currentSubcategory2.verses || [];
    } else if (AppState.currentSubcategory1) {
        verses = AppState.currentSubcategory1.verses || [];
    } else if (AppState.currentCategory) {
        verses = AppState.currentCategory.verses || [];
    }
    
    // Render verses
    verseList.innerHTML = '';
    
    if (verses.length === 0) {
        verseList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Aucun verset dans cette catégorie</p>';
        return;
    }
    
    const sortedVerses = [...verses].sort((a, b) => a.order - b.order);
    
    sortedVerses.forEach(verse => {
        const card = createVerseCard(verse);
        verseList.appendChild(card);
    });
    
    // Enable drag & drop in edit mode
    if (AppState.mode === 'edit') {
        new Sortable(verseList, {
            animation: 150,
            onEnd: (evt) => {
                reorderVerses(verses, evt.oldIndex, evt.newIndex);
            }
        });
    }
}

function createVerseCard(verse) {
    const card = document.createElement('div');
    card.className = 'verse-card';
    
    const date = new Date(verse.created).toLocaleDateString('fr-FR');
    const notesPreview = verse.notes ? verse.notes.substring(0, 100) + (verse.notes.length > 100 ? '...' : '') : 'Aucune note';
    
    let imagesHTML = '';
    if (verse.images && verse.images.length > 0) {
        imagesHTML = `
            <div class="verse-images-preview">
                ${verse.images.slice(0, 3).map(img => `
                    <img src="${img}" alt="Image" class="verse-image-thumb">
                `).join('')}
                ${verse.images.length > 3 ? `<span style="color: var(--text-secondary)">+${verse.images.length - 3}</span>` : ''}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="verse-card-header">
            <div class="verse-reference">${verse.reference}</div>
            <div class="verse-date">${date}</div>
        </div>
        <div class="verse-text">${verse.text}</div>
        <div class="verse-notes-preview">${notesPreview}</div>
        ${imagesHTML}
    `;
    
    card.addEventListener('click', () => {
        AppState.currentVerse = verse;
        AppState.currentView = 'detail';
        renderCurrentView();
    });
    
    return card;
}

function renderVerseDetail() {
    const detailContainer = document.getElementById('verseDetail');
    const verse = AppState.currentVerse;
    
    if (!verse) return;
    
    const created = new Date(verse.created).toLocaleDateString('fr-FR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    const modified = new Date(verse.modified).toLocaleDateString('fr-FR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    let imagesHTML = '';
    if (verse.images && verse.images.length > 0) {
        imagesHTML = `
            <h3>📷 Images</h3>
            <div class="verse-detail-images">
                ${verse.images.map(img => `
                    <img src="${img}" alt="Image" class="verse-detail-image" onclick="window.open('${img}', '_blank')">
                `).join('')}
            </div>
        `;
    }
    
    detailContainer.innerHTML = `
        <div class="verse-detail-reference">${verse.reference}</div>
        <div class="verse-detail-meta">
            <span>📅 Créé: ${created}</span>
            <span>✏️ Modifié: ${modified}</span>
        </div>
        <div class="verse-detail-text">${verse.text}</div>
        <div class="verse-detail-notes-section">
            <h3>📝 Notes Personnelles</h3>
            <div class="verse-detail-notes">${verse.notes || 'Aucune note'}</div>
        </div>
        ${imagesHTML}
    `;
}

// ===== Modal Functions =====
function openModal(type, item = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (type === 'category') {
        modalTitle.textContent = item ? 'Modifier la catégorie' : 'Nouvelle Catégorie';
        modalBody.innerHTML = createCategoryForm(item);
    } else if (type === 'verse') {
        modalTitle.textContent = item ? 'Modifier le verset' : 'Nouveau Verset';
        modalBody.innerHTML = createVerseForm(item);
        setupImageUpload();
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function createCategoryForm(category = null) {
    return `
        <form id="categoryForm">
            <div class="form-group">
                <label for="categoryName">Nom de la catégorie *</label>
                <input type="text" id="categoryName" class="form-input" required 
                       value="${category ? category.name : ''}" placeholder="Ex: Foi, Espérance">
            </div>
            <div class="form-group">
                <label for="categoryLevel">Niveau *</label>
                <select id="categoryLevel" class="form-select">
                    <option value="0">Catégorie principale</option>
                    <option value="1">Sous-catégorie niveau 1</option>
                    <option value="2">Sous-catégorie niveau 2</option>
                </select>
            </div>
            <div class="form-group hidden" id="parentCategoryGroup">
                <label for="parentCategory">Catégorie parente *</label>
                <select id="parentCategory" class="form-select"></select>
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
                <button type="submit" class="primary-btn">Enregistrer</button>
            </div>
        </form>
    `;
}

function createVerseForm(verse = null) {
    return `
        <form id="verseForm">
            <div class="form-group">
                <label for="verseReference">Référence biblique *</label>
                <input type="text" id="verseReference" class="form-input" required 
                       value="${verse ? verse.reference : ''}" placeholder="Ex: Jean 3:16">
            </div>
            <div class="form-group">
                <label for="verseText">Texte du verset *</label>
                <textarea id="verseText" class="form-textarea" required 
                          placeholder="Copiez le texte du verset ici...">${verse ? verse.text : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="verseNotes">Notes personnelles</label>
                <textarea id="verseNotes" class="form-textarea" 
                          placeholder="Vos réflexions, applications personnelles...">${verse ? verse.notes : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Images (JPEG/PDF)</label>
                <div class="image-upload-area" id="imageUploadArea">
                    <p>📎 Cliquez ou glissez-déposez des images ici</p>
                    <p style="font-size: 12px; color: var(--text-secondary);">Les images seront automatiquement compressées</p>
                </div>
                <input type="file" id="imageInput" accept="image/jpeg,image/jpg,application/pdf" multiple style="display:none;">
                <div id="imagePreviewGrid" class="image-preview-grid"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
                <button type="submit" class="primary-btn">Enregistrer</button>
            </div>
        </form>
    `;
}

// ===== Image Upload Setup =====
let uploadedImages = [];

function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewGrid = document.getElementById('imagePreviewGrid');
    
    uploadArea.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', async (e) => {
        await handleImageFiles(e.target.files);
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        await handleImageFiles(e.dataTransfer.files);
    });
}

async function handleImageFiles(files) {
    const previewGrid = document.getElementById('imagePreviewGrid');
    
    for (const file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            try {
                showStatus('⏳ Compression de l\'image...', 'info');
                
                let compressedFile = file;
                if (file.type.startsWith('image/')) {
                    // Compress image
                    compressedFile = await imageCompression(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true
                    });
                }
                
                // Convert to base64
                const base64 = await fileToBase64(compressedFile);
                uploadedImages.push(base64);
                
                // Show preview
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${base64}" class="image-preview" alt="Preview">
                    <button class="image-remove-btn" onclick="removeImage(${uploadedImages.length - 1})">×</button>
                `;
                previewGrid.appendChild(previewItem);
                
                showStatus('✅ Image ajoutée', 'success');
            } catch (error) {
                console.error('Erreur compression:', error);
                showStatus('❌ Erreur lors de l\'ajout de l\'image', 'error');
            }
        }
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    const previewGrid = document.getElementById('imagePreviewGrid');
    previewGrid.children[index].remove();
}

// ===== CRUD Operations =====
function reorderCategories(oldIndex, newIndex) {
    const categories = AppState.data.categories;
    const [moved] = categories.splice(oldIndex, 1);
    categories.splice(newIndex, 0, moved);
    
    // Update order property
    categories.forEach((cat, idx) => {
        cat.order = idx;
    });
    
    syncData();
}

function reorderVerses(verses, oldIndex, newIndex) {
    const [moved] = verses.splice(oldIndex, 1);
    verses.splice(newIndex, 0, moved);
    
    // Update order property
    verses.forEach((verse, idx) => {
        verse.order = idx;
    });
    
    syncData();
}

function deleteCurrentVerse() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce verset ?')) return;
    
    let verses = [];
    if (AppState.currentSubcategory2) {
        verses = AppState.currentSubcategory2.verses;
    } else if (AppState.currentSubcategory1) {
        verses = AppState.currentSubcategory1.verses;
    } else if (AppState.currentCategory) {
        verses = AppState.currentCategory.verses;
    }
    
    const index = verses.findIndex(v => v.id === AppState.currentVerse.id);
    if (index > -1) {
        verses.splice(index, 1);
        AppState.currentView = 'list';
        renderCurrentView();
        syncData();
        showStatus('✅ Verset supprimé', 'success');
    }
}

// ===== Utility Functions =====
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function showStatus(message, type) {
    const status = document.getElementById('syncStatus');
    status.textContent = message;
    status.className = `sync-status ${type}`;
    status.classList.remove('hidden');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

// ===== Form Handlers =====
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'categoryForm') {
        e.preventDefault();
        await handleCategorySubmit();
    } else if (e.target.id === 'verseForm') {
        e.preventDefault();
        await handleVerseSubmit();
    }
});

async function handleCategorySubmit() {
    const name = document.getElementById('categoryName').value.trim();
    const level = parseInt(document.getElementById('categoryLevel').value);
    
    if (!name) {
        showStatus('❌ Nom requis', 'error');
        return;
    }
    
    const newCategory = {
        id: generateId(),
        name: name,
        order: 0,
        verses: []
    };
    
    if (level === 0) {
        // Main category
        newCategory.subcategories_level1 = [];
        AppState.data.categories.push(newCategory);
        newCategory.order = AppState.data.categories.length - 1;
    } else if (level === 1) {
        // Subcategory level 1 - get parent from form
        const parentSelect = document.getElementById('parentCategory');
        const parentId = parentSelect ? parentSelect.value : null;
        
        // Find the parent category
        const parentCategory = AppState.data.categories.find(cat => cat.id === parentId);
        
        if (!parentCategory) {
            showStatus('❌ Sélectionnez une catégorie parente', 'error');
            return;
        }
        
        newCategory.subcategories_level2 = [];
        if (!parentCategory.subcategories_level1) {
            parentCategory.subcategories_level1 = [];
        }
        parentCategory.subcategories_level1.push(newCategory);
        newCategory.order = parentCategory.subcategories_level1.length - 1;
    } else if (level === 2) {
        // Subcategory level 2 - get parent from form
        const parentSelect = document.getElementById('parentCategory');
        const parentId = parentSelect ? parentSelect.value : null;
        
        // Find the parent subcategory (need to search through all categories)
        let parentSubcategory = null;
        for (const cat of AppState.data.categories) {
            if (cat.subcategories_level1) {
                const found = cat.subcategories_level1.find(sub => sub.id === parentId);
                if (found) {
                    parentSubcategory = found;
                    break;
                }
            }
        }
        
        if (!parentSubcategory) {
            showStatus('❌ Sélectionnez une sous-catégorie parente', 'error');
            return;
        }
        
        if (!parentSubcategory.subcategories_level2) {
            parentSubcategory.subcategories_level2 = [];
        }
        parentSubcategory.subcategories_level2.push(newCategory);
        newCategory.order = parentSubcategory.subcategories_level2.length - 1;
    }
    
    closeModal();
    renderCategoryNav();
    
    // Switch to welcome screen if this is first category
    if (AppState.data.categories.length === 1 && level === 0) {
        AppState.currentView = 'welcome';
        renderCurrentView();
    }
    
    await syncData();
    showStatus('✅ Catégorie créée', 'success');
}

async function handleVerseSubmit() {
    const reference = document.getElementById('verseReference').value.trim();
    const text = document.getElementById('verseText').value.trim();
    const notes = document.getElementById('verseNotes').value.trim();
    
    if (!reference || !text) {
        showStatus('❌ Référence et texte requis', 'error');
        return;
    }
    
    // Upload images to GitHub if any
    const imageUrls = [];
    if (uploadedImages.length > 0) {
        showStatus('⏳ Upload des images...', 'info');
        for (let i = 0; i < uploadedImages.length; i++) {
            const base64Image = uploadedImages[i];
            const imageName = `${generateId()}.jpg`;
            try {
                const url = await GitHubSync.uploadImage(base64Image, imageName);
                imageUrls.push(url);
            } catch (error) {
                console.error('Erreur upload image:', error);
                showStatus('⚠️ Erreur upload image', 'error');
            }
        }
    }
    
    const newVerse = {
        id: generateId(),
        reference: reference,
        text: text,
        notes: notes,
        images: imageUrls,
        order: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
    };
    
    // Add to appropriate location
    let verses = [];
    if (AppState.currentSubcategory2) {
        if (!AppState.currentSubcategory2.verses) {
            AppState.currentSubcategory2.verses = [];
        }
        verses = AppState.currentSubcategory2.verses;
    } else if (AppState.currentSubcategory1) {
        if (!AppState.currentSubcategory1.verses) {
            AppState.currentSubcategory1.verses = [];
        }
        verses = AppState.currentSubcategory1.verses;
    } else if (AppState.currentCategory) {
        if (!AppState.currentCategory.verses) {
            AppState.currentCategory.verses = [];
        }
        verses = AppState.currentCategory.verses;
    } else {
        showStatus('❌ Sélectionnez une catégorie', 'error');
        return;
    }
    
    verses.push(newVerse);
    newVerse.order = verses.length - 1;
    
    closeModal();
    uploadedImages = []; // Reset uploaded images
    
    // Refresh view
    if (AppState.currentView === 'list') {
        renderVerseList();
    }
    
    await syncData();
    showStatus('✅ Verset ajouté', 'success');
}

// Update category level selector to show parent options
document.addEventListener('change', (e) => {
    if (e.target.id === 'categoryLevel') {
        const level = parseInt(e.target.value);
        const parentGroup = document.getElementById('parentCategoryGroup');
        const parentSelect = document.getElementById('parentCategory');
        
        if (level > 0) {
            parentGroup.classList.remove('hidden');
            
            // Populate parent options
            parentSelect.innerHTML = '';
            
            if (level === 1) {
                // Show main categories
                AppState.data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    parentSelect.appendChild(option);
                });
            } else if (level === 2) {
                // Show subcategories level 1
                AppState.data.categories.forEach(cat => {
                    if (cat.subcategories_level1) {
                        cat.subcategories_level1.forEach(sub => {
                            const option = document.createElement('option');
                            option.value = sub.id;
                            option.textContent = `${cat.name} › ${sub.name}`;
                            parentSelect.appendChild(option);
                        });
                    }
                });
            }
        } else {
            parentGroup.classList.add('hidden');
        }
    }
});

// Make functions globally accessible
window.closeModal = closeModal;
window.removeImage = removeImage;
window.clearGitHubConfig = clearGitHubConfig;
