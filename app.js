// ===== Application State =====
const AppState = {
    mode: 'read', // 'read' or 'edit'
    theme: 'dark', // 'light' or 'dark'
    currentView: 'welcome', // 'welcome', 'list', 'detail'
    currentCategory: null,
    currentSubcategory1: null,
    currentSubcategory2: null,
    currentVerse: null,
    isLoading: false, // Prevent auto-save during initial load
    hasUnsavedChanges: false, // Track if there are unsaved changes
    autoSyncEnabled: false, // Auto-sync disabled by default
    autoSyncInterval: 5, // minutes (5 or 10)
    autoSyncTimer: null, // Timer ID
    lastModified: null, // Timestamp of last local modification
    data: {
        categories: [],
        lastModified: null // Timestamp in the data itself
    }
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📖 Initialisation de l\'Index Biblique...');
    
    // Initialize read mode on startup
    initializeReadMode();
    
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
        ;
        showStatus('🗑️ Configuration effacée', 'success');
        
        // Show settings modal again
        setTimeout(() => {
            showSettingsModal();
        }, 1000);
    }
}

// ===== Event Listeners Setup =====
// Variables to track touch movement for preventing accidental clicks during scroll
let touchStartY = 0;
let touchMoved = false;

// Add global touch tracking to prevent accidental clicks during scroll
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
        touchMoved = true;
    }
}, { passive: true });

function setupEventListeners() {
    // Mode toggle - unified handler for desktop and mobile
    const modeToggleBtn = document.getElementById('modeToggle');
    modeToggleBtn.addEventListener('click', (e) => {
        if (!touchMoved) toggleMode();
    });
    
    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    themeToggleBtn.addEventListener('click', (e) => {
        if (!touchMoved) toggleTheme();
    });
    
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', (e) => {
        if (!touchMoved) saveData();
    });
    
    // Sync button
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.addEventListener('click', (e) => {
        if (!touchMoved) syncData();
    });
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', (e) => {
        if (!touchMoved) showSettingsModal();
    });
    
    // Get started button
    const getStartedBtn = document.getElementById('getStartedBtn');
    getStartedBtn.addEventListener('click', (e) => {
        if (!touchMoved) openModal('category');
    });
    
    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    addCategoryBtn.addEventListener('click', (e) => {
        if (!touchMoved) openModal('category');
    });
    
    // Add verse button
    const addVerseBtn = document.getElementById('addVerseBtn');
    addVerseBtn.addEventListener('click', (e) => {
        if (!touchMoved) openModal('verse');
    });
    
    // Back to list button
    const backToListBtn = document.getElementById('backToListBtn');
    backToListBtn.addEventListener('click', (e) => {
        if (!touchMoved) {
            AppState.currentVerse = null;
            AppState.currentView = 'list';
            renderCurrentView();
        }
    });
    
    // Delete verse button
    const deleteVerseBtn = document.getElementById('deleteVerseBtn');
    deleteVerseBtn.addEventListener('click', (e) => {
        if (!touchMoved) deleteCurrentVerse();
    });
    
    // Edit verse button
    const editVerseBtn = document.getElementById('editVerseBtn');
    editVerseBtn.addEventListener('click', (e) => {
        if (!touchMoved) editCurrentVerse();
    });
    
    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalClose').addEventListener('touchend', (e) => {
        e.preventDefault();
        closeModal();
    }, { passive: false });
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

// ===== Mode Initialization =====
function initializeReadMode() {
    // Hide all edit-mode elements on startup
    const editElements = document.querySelectorAll('.hidden-read-mode');
    editElements.forEach(el => {
        el.style.display = 'none';
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
    
    // Re-render categories to show/hide edit buttons
    renderCategoryNav();
    
    // Re-render current view if needed
    if (AppState.currentView === 'list') {
        renderVerseList();
    } else if (AppState.currentView === 'detail') {
        renderVerseDetail(); // Refresh detail view to update JW Library link
    }
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
        AppState.isLoading = true; // Prevent auto-save during load
        showStatus('⏳ Chargement des données...', 'info');
        const data = await GitHubSync.fetchData();
        
        if (data) {
            AppState.data = data;
            // Store the GitHub timestamp
            if (data.lastModified) {
                AppState.lastModified = data.lastModified;
            }
            renderCategoryNav();
            showStatus('✅ Données chargées', 'success');
        } else {
            // Initialize with empty structure
            const now = new Date().toISOString();
            AppState.data = { 
                categories: [],
                lastModified: now
            };
            AppState.lastModified = now;
            showStatus('📝 Nouveau fichier de données créé', 'success');
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        showStatus('❌ Erreur de chargement', 'error');
        const now = new Date().toISOString();
        AppState.data = { 
            categories: [],
            lastModified: now
        };
        AppState.lastModified = now;
    } finally {
        AppState.isLoading = false; // Re-enable auto-save
    }
}

// Save local data to GitHub (always overwrites)
async function saveData() {
    // Skip if we're still loading data
    if (AppState.isLoading) {
        console.log('⏭️ Sauvegarde ignorée (chargement en cours)');
        return;
    }
    
    try {
        console.log('💾 Sauvegarde des données...', AppState.data);
        showStatus('⏳ Sauvegarde...', 'info');
        
        // Update timestamp before saving
        const now = new Date().toISOString();
        AppState.data.lastModified = now;
        AppState.lastModified = now;
        
        await GitHubSync.saveData(AppState.data);
        AppState.hasUnsavedChanges = false;
        updateSaveButtonState();
        showStatus('✅ Sauvegardé sur GitHub', 'success');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error);
        showStatus('❌ Échec de la sauvegarde', 'error');
    }
}

// Sync from GitHub with conflict detection
async function syncData() {
    // Skip if we're still loading data
    if (AppState.isLoading) {
        console.log('⏭️ Synchronisation ignorée (chargement en cours)');
        return;
    }
    
    try {
        console.log('🔄 Synchronisation depuis GitHub...');
        showStatus('⏳ Synchronisation...', 'info');
        
        const remoteData = await GitHubSync.fetchData();
        
        if (!remoteData) {
            showStatus('ℹ️ Aucune donnée sur GitHub', 'info');
            return;
        }
        
        // Check for conflicts
        const localTimestamp = AppState.data.lastModified ? new Date(AppState.data.lastModified) : new Date(0);
        const remoteTimestamp = remoteData.lastModified ? new Date(remoteData.lastModified) : new Date(0);
        
        // If we have unsaved changes and remote is newer, show conflict modal
        if (AppState.hasUnsavedChanges && remoteTimestamp > localTimestamp) {
            showConflictModal(remoteData, localTimestamp, remoteTimestamp);
        } else if (remoteTimestamp > localTimestamp) {
            // Remote is newer and we have no local changes - safe to update
            AppState.data = remoteData;
            AppState.lastModified = remoteData.lastModified;
            AppState.hasUnsavedChanges = false;
            updateSaveButtonState();
            renderCategoryNav();
            if (AppState.currentView === 'list') {
                renderVerseList();
            }
            showStatus('✅ Synchronisé depuis GitHub', 'success');
        } else if (localTimestamp > remoteTimestamp) {
            // Local is newer
            showStatus('ℹ️ Vos données locales sont plus récentes', 'info');
        } else {
            // Same timestamp
            showStatus('✅ Déjà à jour', 'success');
        }
    } catch (error) {
        console.error('❌ Erreur de synchronisation:', error);
        showStatus('❌ Échec de la synchronisation', 'error');
    }
}

// Mark that there are unsaved changes (instead of auto-syncing)
function markAsUnsaved() {
    if (!AppState.isLoading) {
        AppState.hasUnsavedChanges = true;
        // Update local timestamp
        AppState.data.lastModified = new Date().toISOString();
        updateSaveButtonState();
    }
}

// Update save button visual state
function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveBtn');
    if (AppState.hasUnsavedChanges) {
        saveBtn.style.opacity = '1';
        saveBtn.style.animation = 'pulse 2s infinite';
        saveBtn.title = 'Modifications non sauvegardées - Cliquez pour sauvegarder';
    } else {
        saveBtn.style.opacity = '0.7';
        saveBtn.style.animation = 'none';
        saveBtn.title = 'Sauvegarder sur GitHub';
    }
}

// Show conflict resolution modal
function showConflictModal(remoteData, localTimestamp, remoteTimestamp) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    // Store remote data temporarily for conflict resolution
    window._conflictRemoteData = remoteData;
    
    const localDate = localTimestamp.toLocaleString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const remoteDate = remoteTimestamp.toLocaleString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    modalTitle.innerHTML = '⚠️ Conflit de synchronisation';
    modalBody.innerHTML = `
        <div style="margin-bottom: 24px;">
            <p style="margin-bottom: 16px; line-height: 1.6;">
                Des modifications ont été détectées à la fois sur cet appareil et sur GitHub. 
                Vous devez choisir quelle version conserver :
            </p>
            
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">📱</span>
                    <strong>Version locale (cet appareil)</strong>
                </div>
                <p style="color: var(--text-secondary); font-size: 14px;">
                    Dernière modification : ${localDate}
                </p>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                    ${AppState.data.categories.length} catégorie(s)
                </p>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">☁️</span>
                    <strong>Version GitHub (autre appareil)</strong>
                </div>
                <p style="color: var(--text-secondary); font-size: 14px;">
                    Dernière modification : ${remoteDate}
                </p>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                    ${remoteData.categories.length} catégorie(s)
                </p>
            </div>
        </div>
        
        <div class="modal-footer" style="flex-direction: column; gap: 12px;">
            <button onclick="resolveConflict('local')" class="primary-btn" style="width: 100%;">
                📱 Garder ma version locale
            </button>
            <button onclick="resolveConflict('remote')" class="secondary-btn" style="width: 100%;">
                ☁️ Utiliser la version GitHub
            </button>
            <button onclick="closeModal()" class="secondary-btn" style="width: 100%;">
                Annuler
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Resolve sync conflict
window.resolveConflict = async function(choice) {
    if (choice === 'local') {
        // Keep local version and overwrite GitHub
        closeModal();
        await saveData();
    } else if (choice === 'remote') {
        // Use GitHub version
        const remoteData = window._conflictRemoteData;
        AppState.data = remoteData;
        AppState.lastModified = remoteData.lastModified;
        AppState.hasUnsavedChanges = false;
        updateSaveButtonState();
        renderCategoryNav();
        if (AppState.currentView === 'list') {
            renderVerseList();
        }
        closeModal();
        showStatus('✅ Version GitHub appliquée', 'success');
        // Clean up
        delete window._conflictRemoteData;
    }
};

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
    
    // Enable drag & drop in edit mode - ONLY for main categories at root level
    if (AppState.mode === 'edit') {
        new Sortable(nav, {
            animation: 150,
            handle: '.drag-handle',
            draggable: '.category-item',
            onEnd: async (evt) => {
                await reorderCategories(evt.oldIndex, evt.newIndex);
            }
        });
        
        // Enable drag & drop for subcategories within each category
        document.querySelectorAll('.subcategory-list').forEach((subList, index) => {
            new Sortable(subList, {
                animation: 150,
                handle: '.drag-handle',
                draggable: '.category-item',
                group: {
                    name: 'subcategories',
                    pull: false,
                    put: false
                },
                onEnd: async (evt) => {
                    // Find which category this belongs to and reorder
                    await reorderSubcategories(subList, evt.oldIndex, evt.newIndex);
                }
            });
        });
    }
}

async function reorderSubcategories(subList, oldIndex, newIndex) {
    // Find the parent category by traversing up
    const categoryItem = subList.closest('.category-item');
    const categoryId = categoryItem.dataset.id;
    
    // Find the category in data
    let parentCategory = AppState.data.categories.find(cat => cat.id === categoryId);
    
    if (parentCategory && parentCategory.subcategories_level1) {
        const [moved] = parentCategory.subcategories_level1.splice(oldIndex, 1);
        parentCategory.subcategories_level1.splice(newIndex, 0, moved);
        
        // Update order property
        parentCategory.subcategories_level1.forEach((sub, idx) => {
            sub.order = idx;
        });
        
        markAsUnsaved();
    }
}

function createCategoryElement(category, level = 0) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.dataset.id = category.id;
    
    const link = document.createElement('a');
    link.className = 'category-link';
    link.style.marginLeft = `${level * 20}px`;
    
    // Check for children at any level
    const hasChildren = (level === 0 && category.subcategories_level1 && category.subcategories_level1.length > 0) ||
                       (level === 1 && category.subcategories_level2 && category.subcategories_level2.length > 0);
    
    // Create name span
    const nameSpan = document.createElement('span');
    nameSpan.textContent = category.name;
    nameSpan.style.flex = '1';
    nameSpan.style.cursor = 'pointer';
    
    // Create button container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '8px';
    buttonsDiv.style.alignItems = 'center';
    
    // Add drag handle in edit mode
    if (AppState.mode === 'edit') {
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '⋮⋮';
        link.insertBefore(dragHandle, link.firstChild);
    }
    
    link.appendChild(nameSpan);
    // Click on whole bar to expand/navigate
const handleBarClick = (e) => {
    // Prevent action if user was scrolling
    if (touchMoved) return;
    
    // If has children, toggle expansion
    if (hasChildren) {
        const subContainer = div.querySelector('.subcategory-list');
        const expandBtn = buttonsDiv.querySelector('.category-expand');
        if (subContainer) {
            subContainer.classList.toggle('hidden');
            if (expandBtn) expandBtn.classList.toggle('expanded');
        }
    }
    // Always navigate to category
    navigateToCategory(category, level);
};

link.onclick = handleBarClick;
    
    // Add edit button in edit mode
    if (AppState.mode === 'edit') {
        const editBtn = document.createElement('button');
        editBtn.className = 'category-edit-btn';
        editBtn.title = 'Modifier';
        editBtn.type = 'button';
        editBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        `;
        
        // Use addEventListener instead of onclick for better iOS support
        editBtn.addEventListener('click', (e) => {
            if (touchMoved) return; // Prevent action if scrolling
            e.stopPropagation();
            e.preventDefault();
            editCategory(category.id, level);
        }, { passive: false });
        
        // Add touch support for iOS
        editBtn.addEventListener('touchend', (e) => {
            if (touchMoved) return; // Prevent action if scrolling
            e.stopPropagation();
            e.preventDefault();
            editCategory(category.id, level);
        }, { passive: false });
        
        buttonsDiv.appendChild(editBtn);
    }
    
    // Add expand button if has children
    if (hasChildren) {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'category-expand';
        expandBtn.type = 'button';
        expandBtn.textContent = '›';
        
        const handleExpand = (e) => {
            if (touchMoved) return; // Prevent action if scrolling
            e.stopPropagation();
            e.preventDefault();
            const subContainer = div.querySelector('.subcategory-list');
            if (subContainer) {
                subContainer.classList.toggle('hidden');
                expandBtn.classList.toggle('expanded');
            }
        };
        
        expandBtn.addEventListener('click', handleExpand, { passive: false });
        expandBtn.addEventListener('touchend', handleExpand, { passive: false });
        
        buttonsDiv.appendChild(expandBtn);
    }
    
    link.appendChild(buttonsDiv);
    div.appendChild(link);
    
    // Add subcategories
    if (hasChildren) {
        const subContainer = document.createElement('div');
        subContainer.className = 'subcategory-list hidden';
        
        // Add level 1 subcategories OR level 2 subcategories depending on current level
        if (level === 0 && category.subcategories_level1) {
            category.subcategories_level1.forEach(sub => {
                const subEl = createCategoryElement(sub, level + 1);
                subContainer.appendChild(subEl);
            });
        } else if (level === 1 && category.subcategories_level2) {
            category.subcategories_level2.forEach(sub => {
                const subEl = createCategoryElement(sub, level + 1);
                subContainer.appendChild(subEl);
            });
        }
        
        div.appendChild(subContainer);
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
            onEnd: async (evt) => {
                await reorderVerses(verses, evt.oldIndex, evt.newIndex);
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
    
    let verseTextHTML = '';
    if (verse.text && verse.text.trim()) {
        verseTextHTML = `<div class="verse-text">${verse.text}</div>`;
    }
    
    card.innerHTML = `
        <div class="verse-card-header">
            <div class="verse-reference">${verse.reference}</div>
            <div class="verse-date">${date}</div>
        </div>
        ${verseTextHTML}
        <div class="verse-notes-preview">${notesPreview}</div>
        ${imagesHTML}
    `;
    
    card.addEventListener('click', () => {
        if (touchMoved) return; // Prevent action if scrolling
        AppState.currentVerse = verse;
        AppState.currentView = 'detail';
        renderCurrentView();
    });
    
    return card;
}

// ===== JW Library Integration =====
// Mapping des noms de livres bibliques vers leurs numéros JW Library
const BIBLE_BOOKS = {
    // Ancien Testament
    'genèse': 1, 'gen': 1, 'ge': 1,
    'exode': 2, 'ex': 2,
    'lévitique': 3, 'lév': 3, 'lé': 3, 'lev': 3, 'le': 3,
    'nombres': 4, 'nom': 4, 'nb': 4,
    'deutéronome': 5, 'deut': 5, 'deu': 5, 'de': 5, 'dt': 5,
    'josué': 6, 'jos': 6, 'jo': 6,
    'juges': 7, 'jug': 7, 'jg': 7,
    'ruth': 8, 'ru': 8, 'rt': 8,
    '1 samuel': 9, '1sam': 9, '1sa': 9, '1 sam': 9, '1 sa': 9,
    '2 samuel': 10, '2sam': 10, '2sa': 10, '2 sam': 10, '2 sa': 10,
    '1 rois': 11, '1ro': 11, '1 ro': 11,
    '2 rois': 12, '2ro': 12, '2 ro': 12,
    '1 chroniques': 13, '1ch': 13, '1 ch': 13, '1chr': 13, '1 chr': 13,
    '2 chroniques': 14, '2ch': 14, '2 ch': 14, '2chr': 14, '2 chr': 14,
    'esdras': 15, 'esd': 15,
    'néhémie': 16, 'néh': 16, 'neh': 16, 'né': 16, 'ne': 16,
    'esther': 17, 'est': 17, 'es': 17,
    'job': 18, 'jb': 18,
    'psaumes': 19, 'ps': 19, 'psaume': 19,
    'proverbes': 20, 'prov': 20, 'pr': 20, 'pro': 20,
    'ecclésiaste': 21, 'eccl': 21, 'ecc': 21, 'ec': 21,
    'cantique des cantiques': 22, 'cant': 22, 'ca': 22, 'ct': 22,
    'isaïe': 23, 'isa': 23, 'is': 23, 'esaïe': 23, 'esaie': 23,
    'jérémie': 24, 'jér': 24, 'jer': 24, 'jé': 24, 'je': 24,
    'lamentations': 25, 'lam': 25, 'la': 25,
    'ézéchiel': 26, 'ézé': 26, 'eze': 26, 'éz': 26, 'ez': 26,
    'daniel': 27, 'dan': 27, 'da': 27,
    'osée': 28, 'os': 28, 'ose': 28,
    'joël': 29, 'joel': 29, 'jl': 29,
    'amos': 30, 'am': 30,
    'abdias': 31, 'abd': 31, 'ab': 31,
    'jonas': 32, 'jon': 32,
    'michée': 33, 'mich': 33, 'mi': 33, 'mic': 33,
    'nahoum': 34, 'nah': 34, 'na': 34,
    'habaquq': 35, 'hab': 35, 'ha': 35,
    'sophonie': 36, 'soph': 36, 'so': 36,
    'aggée': 37, 'agg': 37, 'ag': 37,
    'zacharie': 38, 'zach': 38, 'za': 38,
    'malachie': 39, 'mal': 39, 'ml': 39,
    // Nouveau Testament
    'matthieu': 40, 'matt': 40, 'mat': 40, 'mt': 40, 'ma': 40,
    'marc': 41, 'mar': 41, 'mc': 41, 'mr': 41,
    'luc': 42, 'lu': 42, 'lc': 42,
    'jean': 43, 'jn': 43,
    'actes': 44, 'act': 44, 'ac': 44,
    'romains': 45, 'rom': 45, 'ro': 45, 'rm': 45,
    '1 corinthiens': 46, '1cor': 46, '1co': 46, '1 cor': 46, '1 co': 46,
    '2 corinthiens': 47, '2cor': 47, '2co': 47, '2 cor': 47, '2 co': 47,
    'galates': 48, 'gal': 48, 'ga': 48,
    'éphésiens': 49, 'éph': 49, 'eph': 49, 'ép': 49, 'ep': 49,
    'philippiens': 50, 'phil': 50, 'ph': 50, 'php': 50,
    'colossiens': 51, 'col': 51, 'co': 51,
    '1 thessaloniciens': 52, '1thess': 52, '1th': 52, '1 thess': 52, '1 th': 52,
    '2 thessaloniciens': 53, '2thess': 53, '2th': 53, '2 thess': 53, '2 th': 53,
    '1 timothée': 54, '1tim': 54, '1ti': 54, '1 tim': 54, '1 ti': 54,
    '2 timothée': 55, '2tim': 55, '2ti': 55, '2 tim': 55, '2 ti': 55,
    'tite': 56, 'tit': 56, 'tt': 56,
    'philémon': 57, 'philém': 57, 'phm': 57, 'phl': 57,
    'hébreux': 58, 'héb': 58, 'heb': 58, 'hé': 58, 'he': 58,
    'jacques': 59, 'jacq': 59, 'jac': 59, 'jq': 59,
    '1 pierre': 60, '1pierre': 60, '1pi': 60, '1 pi': 60, '1 pier': 60, '1pier': 60,
    '2 pierre': 61, '2pierre': 61, '2pi': 61, '2 pi': 61, '2 pier': 61, '2pier': 61,
    '1 jean': 62, '1jean': 62, '1jn': 62, '1 jn': 62,
    '2 jean': 63, '2jean': 63, '2jn': 63, '2 jn': 63,
    '3 jean': 64, '3jean': 64, '3jn': 64, '3 jn': 63,
    'jude': 65, 'jud': 65, 'jd': 65,
    'révélation': 66, 'rév': 66, 'rev': 66, 'ré': 66, 're': 66, 'apocalypse': 66, 'apoc': 66, 'ap': 66
};

function parseScriptureReference(reference) {
    if (!reference) return null;
    
    // Nettoyer la référence
    reference = reference.trim().toLowerCase();
    
    // Pattern pour capturer: Livre Chapitre:Verset ou Livre Chapitre:Verset-Verset
    const pattern = /^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;
    const match = reference.match(pattern);
    
    if (!match) return null;
    
    const bookName = match[1].trim();
    const chapter = parseInt(match[2]);
    const verse = match[3] ? parseInt(match[3]) : null;
    const endVerse = match[4] ? parseInt(match[4]) : null;
    
    // Trouver le numéro du livre
    const bookNum = BIBLE_BOOKS[bookName];
    
    if (!bookNum) return null;
    
    return {
        bookNum: bookNum,
        chapter: chapter,
        verse: verse,
        endVerse: endVerse
    };
}

function generateJWLibraryURL(reference) {
    const parsed = parseScriptureReference(reference);
    
    if (!parsed) return null;
    
    let url = `jwlibrary://bible?booknum=${parsed.bookNum}&chapter=${parsed.chapter}`;
    
    if (parsed.verse) {
        url += `&verse=${parsed.verse}`;
    }
    
    return url;
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
    
    let verseTextHTML = '';
    if (verse.text && verse.text.trim()) {
        verseTextHTML = `<div class="verse-detail-text">${verse.text}</div>`;
    }
    
    // Generate JW Library link in read mode
    let referenceHTML = '';
    if (AppState.mode === 'read') {
        const jwLibraryURL = generateJWLibraryURL(verse.reference);
        if (jwLibraryURL) {
            referenceHTML = `<a href="${jwLibraryURL}" class="verse-detail-reference jw-library-link">${verse.reference} 📖</a>`;
        } else {
            referenceHTML = `<div class="verse-detail-reference">${verse.reference}</div>`;
        }
    } else {
        referenceHTML = `<div class="verse-detail-reference">${verse.reference}</div>`;
    }
    
    detailContainer.innerHTML = `
        ${referenceHTML}
        <div class="verse-detail-meta">
            <span>📅 Créé: ${created}</span>
            <span>✏️ Modifié: ${modified}</span>
        </div>
        ${verseTextHTML}
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
    const isEditing = verse !== null;
    return `
        <form id="verseForm" data-editing="${isEditing}">
            <div class="form-group">
                <label for="verseReference">Référence biblique *</label>
                <input type="text" id="verseReference" class="form-input" required 
                       value="${verse ? verse.reference : ''}" placeholder="Ex: Jean 3:16">
            </div>
            <div class="form-group">
                <label for="verseText">Texte du verset</label>
                <textarea id="verseText" class="form-textarea" 
                          placeholder="Copiez le texte du verset ici...">${verse ? verse.text : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="verseNotes">Notes personnelles</label>
                <textarea id="verseNotes" class="form-textarea" 
                          placeholder="Vos réflexions, applications personnelles...">${verse ? verse.notes : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Images (JPEG/PDF)</label>
                ${verse && verse.images && verse.images.length > 0 ? `
                    <div style="margin-bottom: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">📷 Images existantes (${verse.images.length})</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">Les images existantes seront conservées. Vous pouvez en ajouter de nouvelles ci-dessous.</p>
                    </div>
                ` : ''}
                <div class="image-upload-area" id="imageUploadArea">
                    <p>📎 Cliquez ou glissez-déposez des images ici</p>
                    <p style="font-size: 12px; color: var(--text-secondary);">Les images seront automatiquement compressées</p>
                </div>
                <input type="file" id="imageInput" accept="image/jpeg,image/jpg,application/pdf" multiple style="display:none;">
                <div id="imagePreviewGrid" class="image-preview-grid"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
                <button type="submit" class="primary-btn">${isEditing ? 'Mettre à jour' : 'Enregistrer'}</button>
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
async function reorderCategories(oldIndex, newIndex) {
    const categories = AppState.data.categories;
    const [moved] = categories.splice(oldIndex, 1);
    categories.splice(newIndex, 0, moved);
    
    // Update order property
    categories.forEach((cat, idx) => {
        cat.order = idx;
    });
    
    markAsUnsaved();
}

async function reorderVerses(verses, oldIndex, newIndex) {
    const [moved] = verses.splice(oldIndex, 1);
    verses.splice(newIndex, 0, moved);
    
    // Update order property
    verses.forEach((verse, idx) => {
        verse.order = idx;
    });
    
    markAsUnsaved();
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
        markAsUnsaved();
        showStatus('✅ Verset supprimé', 'success');
    }
}

function editCurrentVerse() {
    if (!AppState.currentVerse) return;
    
    // Ouvrir le modal avec les données du verset actuel
    openModal('verse', AppState.currentVerse);
}

// ===== Utility Functions =====
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function showStatus(message, type) {
    const container = document.getElementById('toastContainer');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = '✅';
    if (type === 'error') icon = '❌';
    else if (type === 'info') icon = 'ℹ️';
    else if (type === 'success') icon = '✅';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300); // Wait for animation to complete
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
    
    // Expand parent if level 2 to show new subcategory
    if (level === 2) {
        const parentSelect = document.getElementById('parentCategory');
        const parentId = parentSelect ? parentSelect.value : null;
        
        setTimeout(() => {
            const parentElement = document.querySelector(`[data-id="${parentId}"]`);
            if (parentElement) {
                const subContainer = parentElement.querySelector('.subcategory-list');
                const expandBtn = parentElement.querySelector('.category-expand');
                if (subContainer) subContainer.classList.remove('hidden');
                if (expandBtn) expandBtn.classList.add('expanded');
            }
        }, 150);
    }
    
    // Switch to welcome screen if this is first category
    if (AppState.data.categories.length === 1 && level === 0) {
        AppState.currentView = 'welcome';
        renderCurrentView();
    }
    
    markAsUnsaved();
    showStatus('✅ Catégorie créée', 'success');
}

async function handleVerseSubmit() {
    const reference = document.getElementById('verseReference').value.trim();
    const text = document.getElementById('verseText').value.trim();
    const notes = document.getElementById('verseNotes').value.trim();
    
    if (!reference) {
        showStatus('❌ Référence requise', 'error');
        return;
    }
    
    // Check if we're editing an existing verse
    const isEditing = AppState.currentVerse && document.getElementById('verseForm').dataset.editing === 'true';
    
    // Upload images to GitHub if any NEW images
    const imageUrls = [];
    
    // Keep existing images if editing
    if (isEditing && AppState.currentVerse.images) {
        imageUrls.push(...AppState.currentVerse.images);
    }
    
    // Add new uploaded images
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
    
    if (isEditing) {
        // Update existing verse
        AppState.currentVerse.reference = reference;
        AppState.currentVerse.text = text;
        AppState.currentVerse.notes = notes;
        AppState.currentVerse.images = imageUrls;
        AppState.currentVerse.modified = new Date().toISOString();
        
        closeModal();
        uploadedImages = []; // Reset uploaded images
        
        // Refresh detail view
        if (AppState.currentView === 'detail') {
            renderVerseDetail();
        } else {
            renderVerseList();
        }
        
        markAsUnsaved();
        showStatus('✅ Verset modifié', 'success');
    } else {
        // Create new verse
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
        
        markAsUnsaved();
        showStatus('✅ Verset ajouté', 'success');
    }
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
window.editCategory = editCategory;

// ===== Edit Category Function =====
function editCategory(categoryId, level) {
    // Find the category
    let category = null;
    
    if (level === 0) {
        category = AppState.data.categories.find(cat => cat.id === categoryId);
    } else if (level === 1) {
        for (const cat of AppState.data.categories) {
            if (cat.subcategories_level1) {
                const found = cat.subcategories_level1.find(sub => sub.id === categoryId);
                if (found) {
                    category = found;
                    break;
                }
            }
        }
    } else if (level === 2) {
        for (const cat of AppState.data.categories) {
            if (cat.subcategories_level1) {
                for (const sub of cat.subcategories_level1) {
                    if (sub.subcategories_level2) {
                        const found = sub.subcategories_level2.find(sub2 => sub2.id === categoryId);
                        if (found) {
                            category = found;
                            break;
                        }
                    }
                }
                if (category) break;
            }
        }
    }
    
    if (!category) {
        showStatus('❌ Catégorie introuvable', 'error');
        return;
    }
    
    // Show modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'Modifier la catégorie';
    modalBody.innerHTML = `
        <form id="editCategoryForm">
            <div class="form-group">
                <label for="editCategoryName">Nom de la catégorie *</label>
                <input type="text" id="editCategoryName" class="form-input" required 
                       value="${category.name}" placeholder="Ex: Foi, Espérance">
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" style="background: var(--danger-color);" onclick="deleteCategory('${categoryId}', ${level})">Supprimer</button>
                <button type="button" class="secondary-btn" onclick="closeModal()">Annuler</button>
                <button type="submit" class="primary-btn">Sauvegarder</button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    
    // Handle form submission
    document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('editCategoryName').value.trim();
        
        if (!newName) {
            showStatus('❌ Nom requis', 'error');
            return;
        }
        
        category.name = newName;
        closeModal();
        renderCategoryNav();
        markAsUnsaved();
        showStatus('✅ Catégorie modifiée', 'success');
    });
}

function deleteCategory(categoryId, level) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie et tout son contenu ?')) {
        return;
    }
    
    if (level === 0) {
        const index = AppState.data.categories.findIndex(cat => cat.id === categoryId);
        if (index > -1) {
            AppState.data.categories.splice(index, 1);
        }
    } else if (level === 1) {
        for (const cat of AppState.data.categories) {
            if (cat.subcategories_level1) {
                const index = cat.subcategories_level1.findIndex(sub => sub.id === categoryId);
                if (index > -1) {
                    cat.subcategories_level1.splice(index, 1);
                    break;
                }
            }
        }
    } else if (level === 2) {
        for (const cat of AppState.data.categories) {
            if (cat.subcategories_level1) {
                for (const sub of cat.subcategories_level1) {
                    if (sub.subcategories_level2) {
                        const index = sub.subcategories_level2.findIndex(sub2 => sub2.id === categoryId);
                        if (index > -1) {
                            sub.subcategories_level2.splice(index, 1);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    closeModal();
    renderCategoryNav();
    markAsUnsaved();
    showStatus('✅ Catégorie supprimée', 'success');
}
