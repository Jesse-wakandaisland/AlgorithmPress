/**
 * Publishing System for PHP-WASM Builder
 * A comprehensive content management system with post, page, custom post types,
 * and multisite capabilities that integrates with the PHP-WASM Builder.
 */

const PublishingSystem = (function() {
    // Private variables
    let _initialized = false;
    let _sites = [];
    let _currentSite = null;
    let _contentTypes = {};
    let _taxonomies = {};
    let _settings = {
        siteName: 'My PHP-WASM Site',
        description: 'A browser-based PHP application',
        permalinkStructure: '/%postname%/',
        defaultContentStatus: 'draft'
    };
    
    // DOM Elements
    let _publishingNavItem;
    let _publishingPanel;
    let _contentListPanel;
    let _contentEditorPanel;
    let _siteManagerPanel;
    
    // Content Type definitions
    const _defaultContentTypes = {
        post: {
            name: 'post',
            label: 'Posts',
            labelSingular: 'Post',
            public: true,
            hasArchive: true,
            rewriteSlug: 'posts',
            supports: ['title', 'editor', 'excerpt', 'thumbnail', 'comments', 'revisions'],
            defaultTaxonomies: ['category', 'tag']
        },
        page: {
            name: 'page',
            label: 'Pages',
            labelSingular: 'Page',
            public: true,
            hierarchical: true,
            hasArchive: false,
            rewriteSlug: '',
            supports: ['title', 'editor', 'thumbnail', 'comments', 'revisions', 'page-attributes'],
            defaultTaxonomies: []
        }
    };
    
    // Taxonomy definitions
    const _defaultTaxonomies = {
        category: {
            name: 'category',
            label: 'Categories',
            labelSingular: 'Category',
            hierarchical: true,
            public: true,
            rewriteSlug: 'category'
        },
        tag: {
            name: 'tag',
            label: 'Tags',
            labelSingular: 'Tag',
            hierarchical: false,
            public: true,
            rewriteSlug: 'tag'
        }
    };
    
    /**
     * Initialize the publishing system
     */
    function init() {
        if (_initialized) return;
        
        console.log('Initializing Publishing System...');
        
        // Load saved data from storage
        _loadFromStorage();
        
        // Create the UI components
        _createUI();
        
        // Register default content types
        for (const type in _defaultContentTypes) {
            registerContentType(_defaultContentTypes[type]);
        }
        
        // Register default taxonomies
        for (const tax in _defaultTaxonomies) {
            registerTaxonomy(_defaultTaxonomies[tax]);
        }
        
        // Initialize the current site if none exists
        if (_sites.length === 0) {
            _initializeDefaultSite();
        }
        
        // Set the current site to the first one if not set
        if (!_currentSite && _sites.length > 0) {
            _currentSite = _sites[0].id;
        }
        
        // Register event listeners
        _registerEventListeners();
        
        _initialized = true;
        console.log('Publishing System initialized successfully');
    }
    
    /**
     * Create the UI components for the publishing system
     */
    function _createUI() {
        // Add the publishing menu item to the navigation
        _createNavigationMenu();
        
        // Create the main publishing panel
        _createPublishingPanel();
        
        // Create the content list panel
        _createContentListPanel();
        
        // Create the content editor panel
        _createContentEditorPanel();
        
        // Create the site manager panel
        _createSiteManagerPanel();
    }
    
    /**
     * Create the navigation menu for the publishing system
     */
    function _createNavigationMenu() {
        // Try to find the navigation container with fallbacks
        const navContainer = document.querySelector('.main-nav-container') || 
                            document.querySelector('.nav-container') ||
                            document.querySelector('nav') ||
                            document.querySelector('header');
        
        if (!navContainer) {
            console.log('Navigation container not found, creating one');
            // Create a navigation container if none exists
            const newNavContainer = document.createElement('div');
            newNavContainer.className = 'publishing-nav-container';
            newNavContainer.style.position = 'fixed';
            newNavContainer.style.top = '10px';
            newNavContainer.style.left = '10px';
            newNavContainer.style.zIndex = '1000';
            document.body.appendChild(newNavContainer);
            
            // Use this new container
            _publishingNavItem = document.createElement('div');
            _publishingNavItem.className = 'nav-item';
            _publishingNavItem.id = 'publishing-nav-item';
            _publishingNavItem.innerHTML = `
                <i class="fas fa-newspaper"></i>
                <span>Publishing</span>
            `;
            
            newNavContainer.appendChild(_publishingNavItem);
            return;
        }
        
        _publishingNavItem = document.createElement('div');
        _publishingNavItem.className = 'nav-item';
        _publishingNavItem.id = 'publishing-nav-item';
        _publishingNavItem.innerHTML = `
            <i class="fas fa-newspaper"></i>
            <span>Publishing</span>
        `;
        
        navContainer.appendChild(_publishingNavItem);
    }
    
    /**
     * Create the main publishing panel
     */
    function _createPublishingPanel() {
        // Try to find an appropriate container, with fallbacks
        let mainContainer = document.querySelector('.main-container') || 
                           document.querySelector('.php-wasm-builder') || 
                           document.querySelector('.builder-container') || 
                           document.querySelector('.app-container') || 
                           document.body;
        
        // Log which container we're using
        console.log('Using container for publishing panel:', mainContainer.tagName || mainContainer.className);
        
        _publishingPanel = document.createElement('div');
        _publishingPanel.className = 'panel publishing-panel glass-panel hidden';
        _publishingPanel.id = 'publishing-panel';
        _publishingPanel.innerHTML = `
            <div class="panel-header">
                <h2>Publishing System</h2>
                <div class="panel-controls">
                    <button id="publishing-settings-btn" class="glass-button small">
                        <i class="fas fa-cog"></i> Settings
                    </button>
                    <button id="publishing-close-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="panel-tabs">
                <button id="content-tab" class="tab-button active">Content</button>
                <button id="sites-tab" class="tab-button">Sites</button>
                <button id="content-types-tab" class="tab-button">Content Types</button>
                <button id="taxonomies-tab" class="tab-button">Taxonomies</button>
            </div>
            <div class="panel-body">
                <div class="publishing-sidebar glass-panel">
                    <div class="site-selector">
                        <label>Current Site:</label>
                        <select id="site-selector"></select>
                    </div>
                    <div class="content-type-nav">
                        <h3>Content</h3>
                        <ul id="content-type-list">
                            <!-- Content type links will be added here -->
                        </ul>
                    </div>
                </div>
                <div class="publishing-content">
                    <!-- Content panels will be loaded here -->
                </div>
            </div>
        `;
        
        // Make the panel fixed position if we're using body as the container
        if (mainContainer === document.body) {
            _publishingPanel.style.position = 'fixed';
            _publishingPanel.style.top = '50%';
            _publishingPanel.style.left = '50%';
            _publishingPanel.style.transform = 'translate(-50%, -50%)';
            _publishingPanel.style.width = '90%';
            _publishingPanel.style.height = '90%';
            _publishingPanel.style.maxWidth = '1200px';
            _publishingPanel.style.maxHeight = '800px';
            _publishingPanel.style.zIndex = '1001';
        }
        
        mainContainer.appendChild(_publishingPanel);
    }
    
    /**
     * Create the content list panel
     */
    function _createContentListPanel() {
        _contentListPanel = document.createElement('div');
        _contentListPanel.className = 'content-list-panel';
        _contentListPanel.id = 'content-list-panel';
        _contentListPanel.innerHTML = `
            <div class="content-list-header">
                <h3 id="content-list-title">Posts</h3>
                <div class="content-list-controls">
                    <button id="new-content-btn" class="glass-button">
                        <i class="fas fa-plus"></i> Add New
                    </button>
                    <div class="search-box">
                        <input type="text" id="content-search" placeholder="Search...">
                        <button id="content-search-btn" class="glass-button small">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="content-list-filters glass-panel">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="status-filter">
                        <option value="all">All</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="trash">Trash</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Sort by:</label>
                    <select id="sort-filter">
                        <option value="date-desc">Date (Newest)</option>
                        <option value="date-asc">Date (Oldest)</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                    </select>
                </div>
                <div class="filter-group taxonomy-filters">
                    <!-- Taxonomy filters will be added here dynamically -->
                </div>
            </div>
            <div class="content-list-table">
                <table class="glass-table">
                    <thead>
                        <tr>
                            <th class="checkbox-col"><input type="checkbox" id="select-all-content"></th>
                            <th class="title-col">Title</th>
                            <th class="author-col">Author</th>
                            <th class="taxonomy-col category-col">Categories</th>
                            <th class="taxonomy-col tag-col">Tags</th>
                            <th class="date-col">Date</th>
                            <th class="status-col">Status</th>
                        </tr>
                    </thead>
                    <tbody id="content-list-body">
                        <!-- Content items will be added here -->
                    </tbody>
                </table>
            </div>
            <div class="content-list-pagination">
                <button id="prev-page-btn" class="glass-button small">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span id="page-indicator">Page 1 of 1</span>
                <button id="next-page-btn" class="glass-button small">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Create the content editor panel
     */
    function _createContentEditorPanel() {
        _contentEditorPanel = document.createElement('div');
        _contentEditorPanel.className = 'content-editor-panel hidden';
        _contentEditorPanel.id = 'content-editor-panel';
        _contentEditorPanel.innerHTML = `
            <div class="content-editor-header">
                <h3 id="editor-title">Edit Post</h3>
                <div class="editor-controls">
                    <button id="save-draft-btn" class="glass-button">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                    <button id="preview-content-btn" class="glass-button">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button id="publish-content-btn" class="glass-button primary">
                        <i class="fas fa-paper-plane"></i> Publish
                    </button>
                    <button id="editor-close-btn" class="glass-button">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            <div class="content-editor-body">
                <div class="editor-main">
                    <div class="title-section glass-panel">
                        <input type="text" id="content-title" placeholder="Enter title here">
                        <div class="permalink-section">
                            <span>Permalink: </span>
                            <span id="permalink-base">/posts/</span>
                            <span id="permalink-editable" contenteditable="true">post-slug</span>
                            <button id="permalink-ok" class="glass-button small">OK</button>
                        </div>
                    </div>
                    <div class="content-section glass-panel">
                        <div id="editor-tabs" class="editor-tabs">
                            <button id="visual-editor-tab" class="editor-tab active">Visual</button>
                            <button id="text-editor-tab" class="editor-tab">Text</button>
                            <button id="preview-tab" class="editor-tab">Preview</button>
                        </div>
                        <div id="visual-editor" class="editor-content active">
                            <!-- Rich text editor will be initialized here -->
                            <div id="rich-text-editor" class="rich-text-editor"></div>
                        </div>
                        <div id="text-editor" class="editor-content">
                            <textarea id="content-text"></textarea>
                        </div>
                        <div id="preview-content" class="editor-content">
                            <!-- Preview content will be shown here -->
                        </div>
                    </div>
                    <div class="excerpt-section glass-panel">
                        <h4>Excerpt</h4>
                        <textarea id="content-excerpt" placeholder="Write an excerpt (optional)"></textarea>
                    </div>
                </div>
                <div class="editor-sidebar">
                    <div class="publish-box glass-panel">
                        <h4>Publish</h4>
                        <div class="publish-option">
                            <label>Status:</label>
                            <select id="content-status">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="pending">Pending Review</option>
                            </select>
                        </div>
                        <div class="publish-option">
                            <label>Visibility:</label>
                            <select id="content-visibility">
                                <option value="public">Public</option>
                                <option value="password">Password Protected</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <div id="password-field" class="publish-option hidden">
                            <label>Password:</label>
                            <input type="password" id="content-password">
                        </div>
                        <div class="publish-option">
                            <label>Published on:</label>
                            <input type="datetime-local" id="content-date">
                        </div>
                    </div>
                    <div class="taxonomy-box category-box glass-panel">
                        <h4>Categories</h4>
                        <div class="category-list">
                            <!-- Categories will be added here dynamically -->
                        </div>
                        <div class="add-category-section">
                            <input type="text" id="new-category" placeholder="New Category">
                            <button id="add-category-btn" class="glass-button small">Add</button>
                        </div>
                    </div>
                    <div class="taxonomy-box tag-box glass-panel">
                        <h4>Tags</h4>
                        <div class="tag-list">
                            <!-- Tags will be added here -->
                        </div>
                        <div class="add-tag-section">
                            <input type="text" id="new-tag" placeholder="Add tags (comma separated)">
                            <button id="add-tag-btn" class="glass-button small">Add</button>
                        </div>
                    </div>
                    <div class="featured-image-box glass-panel">
                        <h4>Featured Image</h4>
                        <div id="featured-image-container">
                            <img id="featured-image-preview" class="hidden">
                            <button id="set-featured-image" class="glass-button">Set Featured Image</button>
                            <button id="remove-featured-image" class="glass-button hidden">Remove Image</button>
                        </div>
                    </div>
                    <div class="custom-fields-box glass-panel">
                        <h4>Custom Fields</h4>
                        <div id="custom-fields-list">
                            <!-- Custom fields will be added here -->
                        </div>
                        <div class="add-custom-field">
                            <input type="text" id="custom-field-name" placeholder="Name">
                            <input type="text" id="custom-field-value" placeholder="Value">
                            <button id="add-custom-field-btn" class="glass-button small">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create the site manager panel
     */
    function _createSiteManagerPanel() {
        _siteManagerPanel = document.createElement('div');
        _siteManagerPanel.className = 'site-manager-panel hidden';
        _siteManagerPanel.id = 'site-manager-panel';
        _siteManagerPanel.innerHTML = `
            <div class="site-manager-header">
                <h3>Manage Sites</h3>
                <div class="site-manager-controls">
                    <button id="add-site-btn" class="glass-button">
                        <i class="fas fa-plus"></i> Add New Site
                    </button>
                </div>
            </div>
            <div class="site-list-container">
                <table class="glass-table">
                    <thead>
                        <tr>
                            <th>Site Name</th>
                            <th>URL</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="site-list-body">
                        <!-- Sites will be added here -->
                    </tbody>
                </table>
            </div>
            <div id="site-edit-container" class="site-edit-container glass-panel hidden">
                <h4 id="site-edit-title">Add New Site</h4>
                <div class="form-group">
                    <label for="site-name">Site Name:</label>
                    <input type="text" id="site-name" placeholder="Enter site name">
                </div>
                <div class="form-group">
                    <label for="site-url">Site URL:</label>
                    <input type="text" id="site-url" placeholder="Enter site URL">
                </div>
                <div class="form-group">
                    <label for="site-description">Description:</label>
                    <textarea id="site-description" placeholder="Enter site description"></textarea>
                </div>
                <div class="form-group">
                    <label for="site-admin-email">Admin Email:</label>
                    <input type="email" id="site-admin-email" placeholder="Enter admin email">
                </div>
                <div class="form-actions">
                    <button id="save-site-btn" class="glass-button primary">Save Site</button>
                    <button id="cancel-site-edit-btn" class="glass-button">Cancel</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Register event listeners for the publishing system UI
     */
    function _registerEventListeners() {
        // Navigation menu click
        _publishingNavItem.addEventListener('click', function() {
            togglePublishingPanel();
        });
        
        // Close button click
        const closeBtn = document.getElementById('publishing-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                togglePublishingPanel(false);
            });
        }
        
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding panel
                const tabId = this.id;
                switch(tabId) {
                    case 'content-tab':
                        showContentPanel();
                        break;
                    case 'sites-tab':
                        showSitesPanel();
                        break;
                    case 'content-types-tab':
                        showContentTypesPanel();
                        break;
                    case 'taxonomies-tab':
                        showTaxonomiesPanel();
                        break;
                }
            });
        });
        
        // New content button
        const newContentBtn = document.getElementById('new-content-btn');
        if (newContentBtn) {
            newContentBtn.addEventListener('click', function() {
                createNewContent(getCurrentContentType());
            });
        }
        
        // Content editor close button
        const editorCloseBtn = document.getElementById('editor-close-btn');
        if (editorCloseBtn) {
            editorCloseBtn.addEventListener('click', function() {
                closeContentEditor();
            });
        }
        
        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', function() {
                saveContent('draft');
            });
        }
        
        // Publish button
        const publishBtn = document.getElementById('publish-content-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', function() {
                saveContent('published');
            });
        }
        
        // Preview button
        const previewBtn = document.getElementById('preview-content-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', function() {
                previewContent();
            });
        }
        
        // Site selector change
        const siteSelector = document.getElementById('site-selector');
        if (siteSelector) {
            siteSelector.addEventListener('change', function() {
                switchSite(this.value);
            });
        }
        
        // Content visibility change
        const contentVisibility = document.getElementById('content-visibility');
        if (contentVisibility) {
            contentVisibility.addEventListener('change', function() {
                const passwordField = document.getElementById('password-field');
                if (this.value === 'password') {
                    passwordField.classList.remove('hidden');
                } else {
                    passwordField.classList.add('hidden');
                }
            });
        }
        
        // Add site button
        const addSiteBtn = document.getElementById('add-site-btn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', function() {
                showSiteEditForm();
            });
        }
        
        // Save site button
        const saveSiteBtn = document.getElementById('save-site-btn');
        if (saveSiteBtn) {
            saveSiteBtn.addEventListener('click', function() {
                saveSite();
            });
        }
        
        // Cancel site edit button
        const cancelSiteEditBtn = document.getElementById('cancel-site-edit-btn');
        if (cancelSiteEditBtn) {
            cancelSiteEditBtn.addEventListener('click', function() {
                hideSiteEditForm();
            });
        }
    }
    
    /**
     * Toggle the publishing panel visibility
     * @param {boolean} show - Whether to show or hide the panel
     */
    function togglePublishingPanel(show) {
        if (_publishingPanel) {
            if (show === undefined) {
                _publishingPanel.classList.toggle('hidden');
            } else if (show) {
                _publishingPanel.classList.remove('hidden');
            } else {
                _publishingPanel.classList.add('hidden');
            }
            
            // Refresh the UI when showing the panel
            if (!_publishingPanel.classList.contains('hidden')) {
                refreshUI();
            }
        }
    }
    
    /**
     * Show the content panel
     */
    function showContentPanel() {
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            // Add the content list panel
            publishingContent.appendChild(_contentListPanel);
            
            // Show the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.remove('hidden');
            }
            
            // Refresh the content list
            refreshContentList(getCurrentContentType());
        }
    }
    
    /**
     * Show the sites panel
     */
    function showSitesPanel() {
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            // Add the site manager panel
            publishingContent.appendChild(_siteManagerPanel);
            
            // Hide the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            
            // Refresh the site list
            refreshSiteList();
        }
    }
    
    /**
     * Show the content types panel
     */
    function showContentTypesPanel() {
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            
            // Create content types panel
            const contentTypesPanel = document.createElement('div');
            contentTypesPanel.className = 'content-types-panel';
            contentTypesPanel.innerHTML = `
                <div class="content-types-header">
                    <h3>Content Types</h3>
                    <div class="content-types-controls">
                        <button id="add-content-type-btn" class="glass-button">
                            <i class="fas fa-plus"></i> Add New Content Type
                        </button>
                    </div>
                </div>
                <div class="content-types-list">
                    <table class="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Label</th>
                                <th>Public</th>
                                <th>Hierarchical</th>
                                <th>Has Archive</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="content-types-list-body">
                            <!-- Content types will be added here -->
                        </tbody>
                    </table>
                </div>
                <div id="content-type-edit-container" class="content-type-edit-container glass-panel hidden">
                    <h4 id="content-type-edit-title">Add New Content Type</h4>
                    <!-- Content type edit form -->
                </div>
            `;
            
            publishingContent.appendChild(contentTypesPanel);
            
            // Hide the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            
            // Refresh the content types list
            refreshContentTypesList();
        }
    }
    
    /**
     * Show the taxonomies panel
     */
    function showTaxonomiesPanel() {
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            
            // Create taxonomies panel
            const taxonomiesPanel = document.createElement('div');
            taxonomiesPanel.className = 'taxonomies-panel';
            taxonomiesPanel.innerHTML = `
                <div class="taxonomies-header">
                    <h3>Taxonomies</h3>
                    <div class="taxonomies-controls">
                        <button id="add-taxonomy-btn" class="glass-button">
                            <i class="fas fa-plus"></i> Add New Taxonomy
                        </button>
                    </div>
                </div>
                <div class="taxonomies-list">
                    <table class="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Label</th>
                                <th>Hierarchical</th>
                                <th>Public</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="taxonomies-list-body">
                            <!-- Taxonomies will be added here -->
                        </tbody>
                    </table>
                </div>
                <div id="taxonomy-edit-container" class="taxonomy-edit-container glass-panel hidden">
                    <h4 id="taxonomy-edit-title">Add New Taxonomy</h4>
                    <!-- Taxonomy edit form -->
                </div>
            `;
            
            publishingContent.appendChild(taxonomiesPanel);
            
            // Hide the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            
            // Refresh the taxonomies list
            refreshTaxonomiesList();
        }
    }
    
    /**
     * Refresh the UI components
     */
    function refreshUI() {
        // Update site selector
        refreshSiteSelector();
        
        // Update content type list
        refreshContentTypeNav();
        
        // Show the content panel by default
        showContentPanel();
    }
    
    /**
     * Refresh the site selector dropdown
     */
    function refreshSiteSelector() {
        const siteSelector = document.getElementById('site-selector');
        if (siteSelector) {
            // Clear current options
            siteSelector.innerHTML = '';
            
            // Add options for each site
            _sites.forEach(site => {
                const option = document.createElement('option');
                option.value = site.id;
                option.textContent = site.name;
                if (site.id === _currentSite) {
                    option.selected = true;
                }
                siteSelector.appendChild(option);
            });
        }
    }
    
    /**
     * Refresh the content type navigation
     */
    function refreshContentTypeNav() {
        const contentTypeList = document.getElementById('content-type-list');
        if (contentTypeList) {
            // Clear current items
            contentTypeList.innerHTML = '';
            
            // Add items for each content type
            for (const type in _contentTypes) {
                const contentType = _contentTypes[type];
                if (contentType.public) {
                    const li = document.createElement('li');
                    li.className = 'content-type-item';
                    li.dataset.contentType = contentType.name;
                    li.innerHTML = `
                        <i class="fas fa-file-alt"></i>
                        <span>${contentType.label}</span>
                    `;
                    
                    li.addEventListener('click', function() {
                        // Remove active class from all items
                        const items = contentTypeList.querySelectorAll('.content-type-item');
                        items.forEach(item => item.classList.remove('active'));
                        
                        // Add active class to clicked item
                        this.classList.add('active');
                        
                        // Show content list for this content type
                        refreshContentList(this.dataset.contentType);
                    });
                    
                    contentTypeList.appendChild(li);
                }
            }
            
            // Set the first item as active by default
            const firstItem = contentTypeList.querySelector('.content-type-item');
            if (firstItem) {
                firstItem.classList.add('active');
            }
        }
    }
    
    /**
     * Refresh the content list for a specific content type
     * @param {string} contentType - The content type to show
     */
    function refreshContentList(contentType) {
        // Update the content list title
        const contentListTitle = document.getElementById('content-list-title');
        if (contentListTitle && _contentTypes[contentType]) {
            contentListTitle.textContent = _contentTypes[contentType].label;
        }
        
        // Get the content items for this type
        const contentItems = getContentItems(contentType);
        
        // Update the content list table
        const contentListBody = document.getElementById('content-list-body');
        if (contentListBody) {
            // Clear current items
            contentListBody.innerHTML = '';
            
            // Add items to the table
            contentItems.forEach(item => {
                const tr = document.createElement('tr');
                tr.dataset.itemId = item.id;
                
                // Format date
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                // Get category names
                let categories = '';
                if (item.categories && item.categories.length) {
                    categories = item.categories.map(catId => {
                        const term = getTermById(catId, 'category');
                        return term ? term.name : '';
                    }).join(', ');
                }
                
                // Get tag names
                let tags = '';
                if (item.tags && item.tags.length) {
                    tags = item.tags.map(tagId => {
                        const term = getTermById(tagId, 'tag');
                        return term ? term.name : '';
                    }).join(', ');
                }
                
                tr.innerHTML = `
                    <td><input type="checkbox" class="content-checkbox"></td>
                    <td class="title-col">
                        <a class="content-title-link" href="#">${item.title}</a>
                        <div class="row-actions">
                            <span class="edit"><a href="#">Edit</a> | </span>
                            <span class="view"><a href="#">View</a> | </span>
                            <span class="trash"><a href="#">Trash</a></span>
                        </div>
                    </td>
                    <td>${item.author || 'Admin'}</td>
                    <td>${categories}</td>
                    <td>${tags}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status-badge ${item.status}">${item.status}</span></td>
                `;
                
                // Add event listener for editing
                const editLink = tr.querySelector('.edit a');
                if (editLink) {
                    editLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        editContent(item.id, contentType);
                    });
                }
                
                // Add event listener for viewing
                const viewLink = tr.querySelector('.view a');
                if (viewLink) {
                    viewLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        viewContent(item.id, contentType);
                    });
                }
                
                // Add event listener for trashing
                const trashLink = tr.querySelector('.trash a');
                if (trashLink) {
                    trashLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        trashContent(item.id, contentType);
                    });
                }
                
                // Add event listener for title link
                const titleLink = tr.querySelector('.content-title-link');
                if (titleLink) {
                    titleLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        editContent(item.id, contentType);
                    });
                }
                
                contentListBody.appendChild(tr);
            });
            
            // Show empty message if no items
            if (contentItems.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="7" class="empty-message">
                        No ${_contentTypes[contentType].label.toLowerCase()} found. 
                        <a href="#" id="create-first-content">Create your first ${_contentTypes[contentType].labelSingular.toLowerCase()}</a>.
                    </td>
                `;
                
                const createLink = tr.querySelector('#create-first-content');
                if (createLink) {
                    createLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        createNewContent(contentType);
                    });
                }
                
                contentListBody.appendChild(tr);
            }
        }
    }
    
    /**
     * Refresh the site list
     */
    function refreshSiteList() {
        const siteListBody = document.getElementById('site-list-body');
        if (siteListBody) {
            // Clear current items
            siteListBody.innerHTML = '';
            
            // Add items to the table
            _sites.forEach(site => {
                const tr = document.createElement('tr');
                tr.dataset.siteId = site.id;
                
                // Format date
                const date = new Date(site.created);
                const formattedDate = date.toLocaleDateString();
                
                tr.innerHTML = `
                    <td>${site.name}</td>
                    <td>${site.url}</td>
                    <td>${formattedDate}</td>
                    <td class="actions-col">
                        <button class="glass-button small edit-site-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="glass-button small delete-site-btn ${_sites.length === 1 ? 'disabled' : ''}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                // Add event listener for edit button
                const editBtn = tr.querySelector('.edit-site-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editSite(site.id);
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = tr.querySelector('.delete-site-btn');
                if (deleteBtn && _sites.length > 1) {
                    deleteBtn.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to delete the site "${site.name}"? This action cannot be undone.`)) {
                            deleteSite(site.id);
                        }
                    });
                }
                
                siteListBody.appendChild(tr);
            });
        }
    }
    
    /**
     * Refresh the content types list
     */
    function refreshContentTypesList() {
        const contentTypesListBody = document.getElementById('content-types-list-body');
        if (contentTypesListBody) {
            // Clear current items
            contentTypesListBody.innerHTML = '';
            
            // Add items to the table
            for (const type in _contentTypes) {
                const contentType = _contentTypes[type];
                const tr = document.createElement('tr');
                tr.dataset.contentType = contentType.name;
                
                tr.innerHTML = `
                    <td>${contentType.name}</td>
                    <td>${contentType.label}</td>
                    <td>${contentType.public ? 'Yes' : 'No'}</td>
                    <td>${contentType.hierarchical ? 'Yes' : 'No'}</td>
                    <td>${contentType.hasArchive ? 'Yes' : 'No'}</td>
                    <td class="actions-col">
                        <button class="glass-button small edit-content-type-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="glass-button small delete-content-type-btn ${contentType.name === 'post' || contentType.name === 'page' ? 'disabled' : ''}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                // Add event listener for edit button
                const editBtn = tr.querySelector('.edit-content-type-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editContentType(contentType.name);
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = tr.querySelector('.delete-content-type-btn');
                if (deleteBtn && contentType.name !== 'post' && contentType.name !== 'page') {
                    deleteBtn.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to delete the content type "${contentType.label}"? This action cannot be undone and will delete all content of this type.`)) {
                            deleteContentType(contentType.name);
                        }
                    });
                }
                
                contentTypesListBody.appendChild(tr);
            }
        }
    }
    
    /**
     * Refresh the taxonomies list
     */
    function refreshTaxonomiesList() {
        const taxonomiesListBody = document.getElementById('taxonomies-list-body');
        if (taxonomiesListBody) {
            // Clear current items
            taxonomiesListBody.innerHTML = '';
            
            // Add items to the table
            for (const tax in _taxonomies) {
                const taxonomy = _taxonomies[tax];
                const tr = document.createElement('tr');
                tr.dataset.taxonomy = taxonomy.name;
                
                tr.innerHTML = `
                    <td>${taxonomy.name}</td>
                    <td>${taxonomy.label}</td>
                    <td>${taxonomy.hierarchical ? 'Yes' : 'No'}</td>
                    <td>${taxonomy.public ? 'Yes' : 'No'}</td>
                    <td class="actions-col">
                        <button class="glass-button small edit-taxonomy-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="glass-button small delete-taxonomy-btn ${taxonomy.name === 'category' || taxonomy.name === 'tag' ? 'disabled' : ''}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                // Add event listener for edit button
                const editBtn = tr.querySelector('.edit-taxonomy-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editTaxonomy(taxonomy.name);
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = tr.querySelector('.delete-taxonomy-btn');
                if (deleteBtn && taxonomy.name !== 'category' && taxonomy.name !== 'tag') {
                    deleteBtn.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to delete the taxonomy "${taxonomy.label}"? This action cannot be undone and will delete all terms of this taxonomy.`)) {
                            deleteTaxonomy(taxonomy.name);
                        }
                    });
                }
                
                taxonomiesListBody.appendChild(tr);
            }
        }
    }
    
    /**
     * Get the current content type from the navigation
     * @returns {string} The current content type
     */
    function getCurrentContentType() {
        const activeItem = document.querySelector('.content-type-item.active');
        if (activeItem) {
            return activeItem.dataset.contentType;
        }
        return 'post'; // Default to post
    }
    
    /**
     * Initialize the rich text editor
     */
    function initRichTextEditor() {
        // This would typically use a library like CKEditor, TinyMCE, or Quill
        // For simplicity, we'll just implement basic functionality
        const richTextEditor = document.getElementById('rich-text-editor');
        if (richTextEditor) {
            richTextEditor.contentEditable = true;
            richTextEditor.className = 'rich-text-editor';
            
            // Create a simple toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'editor-toolbar';
            toolbar.innerHTML = `
                <button data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
                <button data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
                <button data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
                <button data-command="strikeThrough" title="Strike-through"><i class="fas fa-strikethrough"></i></button>
                <div class="separator"></div>
                <button data-command="justifyLeft" title="Align Left"><i class="fas fa-align-left"></i></button>
                <button data-command="justifyCenter" title="Align Center"><i class="fas fa-align-center"></i></button>
                <button data-command="justifyRight" title="Align Right"><i class="fas fa-align-right"></i></button>
                <button data-command="justifyFull" title="Justify"><i class="fas fa-align-justify"></i></button>
                <div class="separator"></div>
                <button data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
                <button data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
                <div class="separator"></div>
                <button data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
                <button data-command="unlink" title="Remove Link"><i class="fas fa-unlink"></i></button>
                <button data-command="insertImage" title="Insert Image"><i class="fas fa-image"></i></button>
                <div class="separator"></div>
                <button data-command="undo" title="Undo"><i class="fas fa-undo"></i></button>
                <button data-command="redo" title="Redo"><i class="fas fa-redo"></i></button>
            `;
            
            richTextEditor.parentNode.insertBefore(toolbar, richTextEditor);
            
            // Add event listeners for toolbar buttons
            const buttons = toolbar.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    const command = this.dataset.command;
                    
                    if (command === 'createLink') {
                        const url = prompt('Enter the link URL:');
                        if (url) {
                            document.execCommand(command, false, url);
                        }
                    } else if (command === 'insertImage') {
                        const url = prompt('Enter the image URL:');
                        if (url) {
                            document.execCommand(command, false, url);
                        }
                    } else {
                        document.execCommand(command, false, null);
                    }
                    
                    richTextEditor.focus();
                });
            });
            
            // Sync with text editor
            richTextEditor.addEventListener('input', function() {
                const textEditor = document.getElementById('content-text');
                if (textEditor) {
                    textEditor.value = this.innerHTML;
                }
            });
        }
    }
    
    /**
     * Create a new content item
     * @param {string} contentType - The type of content to create
     */
    function createNewContent(contentType) {
        // Show the content editor panel
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            // Add the content editor panel
            publishingContent.appendChild(_contentEditorPanel);
            _contentEditorPanel.classList.remove('hidden');
            
            // Hide the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            
            // Update the editor title
            const editorTitle = document.getElementById('editor-title');
            if (editorTitle && _contentTypes[contentType]) {
                editorTitle.textContent = `Add New ${_contentTypes[contentType].labelSingular}`;
            }
            
            // Clear the form
            clearContentForm();
            
            // Set the current content type
            const form = _contentEditorPanel.querySelector('form');
            if (form) {
                form.dataset.contentType = contentType;
            }
            
            // Initialize the rich text editor
            initRichTextEditor();
            
            // Set the current date
            const dateInput = document.getElementById('content-date');
            if (dateInput) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            
            // Update permalink base
            const permalinkBase = document.getElementById('permalink-base');
            if (permalinkBase && _contentTypes[contentType]) {
                if (_contentTypes[contentType].rewriteSlug) {
                    permalinkBase.textContent = `/${_contentTypes[contentType].rewriteSlug}/`;
                } else {
                    permalinkBase.textContent = '/';
                }
            }
        }
    }
    
    /**
     * Edit an existing content item
     * @param {string} id - The ID of the content item
     * @param {string} contentType - The type of content
     */
    function editContent(id, contentType) {
        // Get the content item
        const siteId = _currentSite;
        const storageKey = `${siteId}_${contentType}_${id}`;
        const contentItem = _getFromStorage(storageKey);
        
        if (!contentItem) {
            console.error(`Content item not found: ${storageKey}`);
            return;
        }
        
        // Show the content editor panel
        const publishingContent = document.querySelector('.publishing-content');
        if (publishingContent) {
            // Clear current content
            publishingContent.innerHTML = '';
            // Add the content editor panel
            publishingContent.appendChild(_contentEditorPanel);
            _contentEditorPanel.classList.remove('hidden');
            
            // Hide the content sidebar
            const sidebar = document.querySelector('.publishing-sidebar');
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            
            // Update the editor title
            const editorTitle = document.getElementById('editor-title');
            if (editorTitle && _contentTypes[contentType]) {
                editorTitle.textContent = `Edit ${_contentTypes[contentType].labelSingular}`;
            }
            
            // Clear the form first
            clearContentForm();
            
            // Set the form data
            const titleInput = document.getElementById('content-title');
            if (titleInput) {
                titleInput.value = contentItem.title;
            }
            
            const richTextEditor = document.getElementById('rich-text-editor');
            if (richTextEditor) {
                richTextEditor.innerHTML = contentItem.content;
            }
            
            const textEditor = document.getElementById('content-text');
            if (textEditor) {
                textEditor.value = contentItem.content;
            }
            
            const excerptEditor = document.getElementById('content-excerpt');
            if (excerptEditor) {
                excerptEditor.value = contentItem.excerpt || '';
            }
            
            const statusSelect = document.getElementById('content-status');
            if (statusSelect) {
                statusSelect.value = contentItem.status;
            }
            
            const visibilitySelect = document.getElementById('content-visibility');
            if (visibilitySelect) {
                visibilitySelect.value = contentItem.visibility || 'public';
            }
            
            const passwordField = document.getElementById('password-field');
            const passwordInput = document.getElementById('content-password');
            if (passwordField && passwordInput) {
                if (contentItem.visibility === 'password') {
                    passwordField.classList.remove('hidden');
                    passwordInput.value = contentItem.password || '';
                } else {
                    passwordField.classList.add('hidden');
                }
            }
            
            const dateInput = document.getElementById('content-date');
            if (dateInput) {
                const date = new Date(contentItem.date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                
                dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            
            // Update permalink
            const permalinkBase = document.getElementById('permalink-base');
            const permalinkEditable = document.getElementById('permalink-editable');
            if (permalinkBase && permalinkEditable && _contentTypes[contentType]) {
                if (_contentTypes[contentType].rewriteSlug) {
                    permalinkBase.textContent = `/${_contentTypes[contentType].rewriteSlug}/`;
                } else {
                    permalinkBase.textContent = '/';
                }
                permalinkEditable.textContent = contentItem.slug || '';
            }
            
            // Set categories
            if (contentItem.categories && contentItem.categories.length) {
                const categoryList = document.querySelector('.category-list');
                if (categoryList) {
                    // TODO: Update category checkboxes
                }
            }
            
            // Set tags
            if (contentItem.tags && contentItem.tags.length) {
                const tagList = document.querySelector('.tag-list');
                if (tagList) {
                    // TODO: Update tag displays
                }
            }
            
            // Set featured image
            if (contentItem.featuredImage) {
                const featuredImagePreview = document.getElementById('featured-image-preview');
                const setFeaturedImageBtn = document.getElementById('set-featured-image');
                const removeFeaturedImageBtn = document.getElementById('remove-featured-image');
                
                if (featuredImagePreview && setFeaturedImageBtn && removeFeaturedImageBtn) {
                    featuredImagePreview.src = contentItem.featuredImage;
                    featuredImagePreview.classList.remove('hidden');
                    setFeaturedImageBtn.classList.add('hidden');
                    removeFeaturedImageBtn.classList.remove('hidden');
                }
            }
            
            // Set custom fields
            if (contentItem.customFields && Object.keys(contentItem.customFields).length) {
                const customFieldsList = document.getElementById('custom-fields-list');
                if (customFieldsList) {
                    // TODO: Update custom fields
                }
            }
            
            // Set the content ID on the form
            const form = _contentEditorPanel.querySelector('form') || _contentEditorPanel;
            if (form) {
                form.dataset.contentId = id;
                form.dataset.contentType = contentType;
            }
            
            // Initialize the rich text editor
            initRichTextEditor();
        }
    }
    
    /**
     * View a content item
     * @param {string} id - The ID of the content item
     * @param {string} contentType - The type of content
     */
    function viewContent(id, contentType) {
        // Get the content item
        const siteId = _currentSite;
        const storageKey = `${siteId}_${contentType}_${id}`;
        const contentItem = _getFromStorage(storageKey);
        
        if (!contentItem) {
            console.error(`Content item not found: ${storageKey}`);
            return;
        }
        
        // Open in a new window or show in a preview panel
        // For simplicity, we'll just alert the content for now
        alert(`Viewing ${contentItem.title}`);
        
        // TODO: Implement a proper preview/view functionality
    }
    
    /**
     * Trash a content item
     * @param {string} id - The ID of the content item
     * @param {string} contentType - The type of content
     */
    function trashContent(id, contentType) {
        // Get the content item
        const siteId = _currentSite;
        const storageKey = `${siteId}_${contentType}_${id}`;
        const contentItem = _getFromStorage(storageKey);
        
        if (!contentItem) {
            console.error(`Content item not found: ${storageKey}`);
            return;
        }
        
        // Update the status to trash
        contentItem.status = 'trash';
        
        // Save the updated item
        _saveToStorage(storageKey, contentItem);
        
        // Refresh the content list
        refreshContentList(contentType);
    }
    
    /**
     * Save a content item
     * @param {string} status - The status to save (draft, published)
     */
    function saveContent(status) {
        // Get the form data
        const form = _contentEditorPanel.querySelector('form') || _contentEditorPanel;
        if (!form) return;
        
        const contentType = form.dataset.contentType || 'post';
        const contentId = form.dataset.contentId || _generateId();
        
        const titleInput = document.getElementById('content-title');
        const richTextEditor = document.getElementById('rich-text-editor');
        const excerptEditor = document.getElementById('content-excerpt');
        const statusSelect = document.getElementById('content-status');
        const visibilitySelect = document.getElementById('content-visibility');
        const passwordInput = document.getElementById('content-password');
        const dateInput = document.getElementById('content-date');
        const permalinkEditable = document.getElementById('permalink-editable');
        
        if (!titleInput || !richTextEditor) {
            console.error('Required form fields not found');
            return;
        }
        
        // Create the content item
        const contentItem = {
            id: contentId,
            title: titleInput.value,
            content: richTextEditor.innerHTML,
            excerpt: excerptEditor ? excerptEditor.value : '',
            date: dateInput ? new Date(dateInput.value).toISOString() : new Date().toISOString(),
            modified: new Date().toISOString(),
            status: status || (statusSelect ? statusSelect.value : 'draft'),
            visibility: visibilitySelect ? visibilitySelect.value : 'public',
            author: 'Admin', // TODO: Implement user system
            slug: permalinkEditable ? permalinkEditable.textContent : _slugify(titleInput.value),
            contentType: contentType,
            categories: [], // TODO: Get selected categories
            tags: [], // TODO: Get selected tags
            customFields: {}, // TODO: Get custom fields
        };
        
        // Add password if visibility is password protected
        if (contentItem.visibility === 'password' && passwordInput) {
            contentItem.password = passwordInput.value;
        }
        
        // Save the content item
        const siteId = _currentSite;
        const storageKey = `${siteId}_${contentType}_${contentId}`;
        _saveToStorage(storageKey, contentItem);
        
        // Show success message
        alert(`${_contentTypes[contentType].labelSingular} saved successfully.`);
        
        // Go back to content list
        closeContentEditor();
        showContentPanel();
    }
    
    /**
     * Preview the current content being edited
     */
    function previewContent() {
        // Get the content
        const titleInput = document.getElementById('content-title');
        const richTextEditor = document.getElementById('rich-text-editor');
        
        if (!titleInput || !richTextEditor) {
            console.error('Required form fields not found');
            return;
        }
        
        // Switch to preview tab
        const previewTab = document.getElementById('preview-tab');
        const previewContent = document.getElementById('preview-content');
        
        if (previewTab && previewContent) {
            // Activate the preview tab
            const tabButtons = document.querySelectorAll('.editor-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            previewTab.classList.add('active');
            
            // Show the preview content
            const editorContents = document.querySelectorAll('.editor-content');
            editorContents.forEach(content => content.classList.remove('active'));
            previewContent.classList.add('active');
            
            // Set the preview content
            previewContent.innerHTML = `
                <h1>${titleInput.value || 'Untitled'}</h1>
                <div class="content-preview">
                    ${richTextEditor.innerHTML}
                </div>
            `;
        }
    }
    
    /**
     * Close the content editor and return to content list
     */
    function closeContentEditor() {
        showContentPanel();
    }
    
    /**
     * Clear the content form
     */
    function clearContentForm() {
        const titleInput = document.getElementById('content-title');
        if (titleInput) {
            titleInput.value = '';
        }
        
        const richTextEditor = document.getElementById('rich-text-editor');
        if (richTextEditor) {
            richTextEditor.innerHTML = '';
        }
        
        const textEditor = document.getElementById('content-text');
        if (textEditor) {
            textEditor.value = '';
        }
        
        const excerptEditor = document.getElementById('content-excerpt');
        if (excerptEditor) {
            excerptEditor.value = '';
        }
        
        const permalinkEditable = document.getElementById('permalink-editable');
        if (permalinkEditable) {
            permalinkEditable.textContent = '';
        }
        
        // Reset featured image
        const featuredImagePreview = document.getElementById('featured-image-preview');
        const setFeaturedImageBtn = document.getElementById('set-featured-image');
        const removeFeaturedImageBtn = document.getElementById('remove-featured-image');
        
        if (featuredImagePreview && setFeaturedImageBtn && removeFeaturedImageBtn) {
            featuredImagePreview.src = '';
            featuredImagePreview.classList.add('hidden');
            setFeaturedImageBtn.classList.remove('hidden');
            removeFeaturedImageBtn.classList.add('hidden');
        }
        
        // Reset categories and tags
        // TODO: Implement clearing categories and tags
        
        // Reset custom fields
        // TODO: Implement clearing custom fields
    }
    
    /**
     * Show the site edit form
     * @param {string} siteId - The ID of the site to edit (optional)
     */
    function showSiteEditForm(siteId) {
        const siteEditContainer = document.getElementById('site-edit-container');
        if (siteEditContainer) {
            siteEditContainer.classList.remove('hidden');
            
            const siteEditTitle = document.getElementById('site-edit-title');
            const siteNameInput = document.getElementById('site-name');
            const siteUrlInput = document.getElementById('site-url');
            const siteDescriptionInput = document.getElementById('site-description');
            const siteAdminEmailInput = document.getElementById('site-admin-email');
            
            if (siteId) {
                // Editing existing site
                const site = _sites.find(s => s.id === siteId);
                if (site) {
                    if (siteEditTitle) siteEditTitle.textContent = 'Edit Site';
                    if (siteNameInput) siteNameInput.value = site.name;
                    if (siteUrlInput) siteUrlInput.value = site.url;
                    if (siteDescriptionInput) siteDescriptionInput.value = site.description;
                    if (siteAdminEmailInput) siteAdminEmailInput.value = site.adminEmail;
                    
                    // Store the site ID for the save function
                    siteEditContainer.dataset.siteId = siteId;
                }
            } else {
                // Adding new site
                if (siteEditTitle) siteEditTitle.textContent = 'Add New Site';
                if (siteNameInput) siteNameInput.value = '';
                if (siteUrlInput) siteUrlInput.value = '';
                if (siteDescriptionInput) siteDescriptionInput.value = '';
                if (siteAdminEmailInput) siteAdminEmailInput.value = '';
                
                // Clear the site ID
                delete siteEditContainer.dataset.siteId;
            }
        }
    }
    
    /**
     * Hide the site edit form
     */
    function hideSiteEditForm() {
        const siteEditContainer = document.getElementById('site-edit-container');
        if (siteEditContainer) {
            siteEditContainer.classList.add('hidden');
        }
    }
    
    /**
     * Edit a site
     * @param {string} siteId - The ID of the site to edit
     */
    function editSite(siteId) {
        showSiteEditForm(siteId);
    }
    
    /**
     * Save a site
     */
    function saveSite() {
        const siteEditContainer = document.getElementById('site-edit-container');
        const siteNameInput = document.getElementById('site-name');
        const siteUrlInput = document.getElementById('site-url');
        const siteDescriptionInput = document.getElementById('site-description');
        const siteAdminEmailInput = document.getElementById('site-admin-email');
        
        if (!siteNameInput || !siteUrlInput) {
            console.error('Required form fields not found');
            return;
        }
        
        // Validate inputs
        if (!siteNameInput.value) {
            alert('Site name is required');
            return;
        }
        
        // Get the site ID (if editing)
        const siteId = siteEditContainer.dataset.siteId;
        
        if (siteId) {
            // Update existing site
            const siteIndex = _sites.findIndex(s => s.id === siteId);
            if (siteIndex !== -1) {
                _sites[siteIndex].name = siteNameInput.value;
                _sites[siteIndex].url = siteUrlInput.value;
                _sites[siteIndex].description = siteDescriptionInput.value;
                _sites[siteIndex].adminEmail = siteAdminEmailInput.value;
                _sites[siteIndex].modified = new Date().toISOString();
            }
        } else {
            // Create new site
            const newSite = {
                id: _generateId(),
                name: siteNameInput.value,
                url: siteUrlInput.value,
                description: siteDescriptionInput.value,
                adminEmail: siteAdminEmailInput.value,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
            
            _sites.push(newSite);
        }
        
        // Save to storage
        _saveSettings();
        
        // Hide the form
        hideSiteEditForm();
        
        // Refresh the site list
        refreshSiteList();
        
        // Refresh the site selector
        refreshSiteSelector();
    }
    
    /**
     * Delete a site
     * @param {string} siteId - The ID of the site to delete
     */
    function deleteSite(siteId) {
        // Check if it's the last site
        if (_sites.length <= 1) {
            alert('Cannot delete the last site');
            return;
        }
        
        // Remove the site
        const siteIndex = _sites.findIndex(s => s.id === siteId);
        if (siteIndex !== -1) {
            _sites.splice(siteIndex, 1);
        }
        
        // If deleted site was the current site, switch to the first available site
        if (siteId === _currentSite) {
            _currentSite = _sites[0].id;
        }
        
        // Save to storage
        _saveSettings();
        
        // Refresh the site list
        refreshSiteList();
        
        // Refresh the site selector
        refreshSiteSelector();
    }
    
    /**
     * Switch to a different site
     * @param {string} siteId - The ID of the site to switch to
     */
    function switchSite(siteId) {
        _currentSite = siteId;
        
        // Save the current site to storage
        _saveSettings();
        
        // Refresh the content list
        showContentPanel();
    }
    
    /**
     * Register a new content type
     * @param {object} contentType - The content type object
     */
    function registerContentType(contentType) {
        if (!contentType.name) {
            console.error('Content type must have a name');
            return;
        }
        
        // Set default values
        contentType.public = contentType.public !== undefined ? contentType.public : true;
        contentType.hierarchical = contentType.hierarchical !== undefined ? contentType.hierarchical : false;
        contentType.hasArchive = contentType.hasArchive !== undefined ? contentType.hasArchive : true;
        contentType.supports = contentType.supports || ['title', 'editor'];
        contentType.defaultTaxonomies = contentType.defaultTaxonomies || [];
        
        // Add to content types
        _contentTypes[contentType.name] = contentType;
        
        // Save to storage
        _saveSettings();
        
        // Refresh the content type navigation
        refreshContentTypeNav();
    }
    
    /**
     * Register a new taxonomy
     * @param {object} taxonomy - The taxonomy object
     */
    function registerTaxonomy(taxonomy) {
        if (!taxonomy.name) {
            console.error('Taxonomy must have a name');
            return;
        }
        
        // Set default values
        taxonomy.public = taxonomy.public !== undefined ? taxonomy.public : true;
        taxonomy.hierarchical = taxonomy.hierarchical !== undefined ? taxonomy.hierarchical : false;
        
        // Add to taxonomies
        _taxonomies[taxonomy.name] = taxonomy;
        
        // Save to storage
        _saveSettings();
    }
    
    /**
     * Edit a content type
     * @param {string} contentTypeName - The name of the content type to edit
     */
    function editContentType(contentTypeName) {
        // TODO: Implement content type editing
        alert(`Edit content type: ${contentTypeName}`);
    }
    
    /**
     * Delete a content type
     * @param {string} contentTypeName - The name of the content type to delete
     */
    function deleteContentType(contentTypeName) {
        // Cannot delete post or page
        if (contentTypeName === 'post' || contentTypeName === 'page') {
            alert('Cannot delete built-in content types');
            return;
        }
        
        // Delete the content type
        delete _contentTypes[contentTypeName];
        
        // Save to storage
        _saveSettings();
        
        // Refresh the content types list
        refreshContentTypesList();
        
        // Refresh the content type navigation
        refreshContentTypeNav();
    }
    
    /**
     * Edit a taxonomy
     * @param {string} taxonomyName - The name of the taxonomy to edit
     */
    function editTaxonomy(taxonomyName) {
        // TODO: Implement taxonomy editing
        alert(`Edit taxonomy: ${taxonomyName}`);
    }
    
    /**
     * Delete a taxonomy
     * @param {string} taxonomyName - The name of the taxonomy to delete
     */
    function deleteTaxonomy(taxonomyName) {
        // Cannot delete category or tag
        if (taxonomyName === 'category' || taxonomyName === 'tag') {
            alert('Cannot delete built-in taxonomies');
            return;
        }
        
        // Delete the taxonomy
        delete _taxonomies[taxonomyName];
        
        // Save to storage
        _saveSettings();
        
        // Refresh the taxonomies list
        refreshTaxonomiesList();
    }
    
    /**
     * Get content items for a specific content type
     * @param {string} contentType - The content type
     * @param {object} filters - Optional filters to apply
     * @returns {Array} Array of content items
     */
    function getContentItems(contentType, filters = {}) {
        const siteId = _currentSite;
        const items = [];
        
        // Get all items from storage
        const storageKeys = Object.keys(localStorage);
        for (const key of storageKeys) {
            if (key.startsWith(`${siteId}_${contentType}_`)) {
                const item = _getFromStorage(key);
                if (item) {
                    // Apply filters
                    let include = true;
                    
                    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
                        include = false;
                    }
                    
                    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
                        include = false;
                    }
                    
                    if (include) {
                        items.push(item);
                    }
                }
            }
        }
        
        // Sort items
        if (filters.sort) {
            switch (filters.sort) {
                case 'date-desc':
                    items.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'date-asc':
                    items.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case 'title-asc':
                    items.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'title-desc':
                    items.sort((a, b) => b.title.localeCompare(a.title));
                    break;
                default:
                    items.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } else {
            // Default sort by date (newest first)
            items.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        return items;
    }
    
    /**
     * Get a term by ID
     * @param {string} id - The term ID
     * @param {string} taxonomy - The taxonomy
     * @returns {object|null} The term object or null if not found
     */
    function getTermById(id, taxonomy) {
        const siteId = _currentSite;
        const storageKey = `${siteId}_term_${taxonomy}_${id}`;
        return _getFromStorage(storageKey);
    }
    
    /**
     * Initialize a default site if none exists
     */
    function _initializeDefaultSite() {
        const defaultSite = {
            id: _generateId(),
            name: 'My First Site',
            url: window.location.origin,
            description: 'A browser-based PHP application',
            adminEmail: 'admin@example.com',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        _sites.push(defaultSite);
        _currentSite = defaultSite.id;
        
        // Save to storage
        _saveSettings();
    }
    
    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    function _generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Convert a string to a URL-friendly slug
     * @param {string} text - The text to convert
     * @returns {string} The slugified text
     */
    function _slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }
    
    /**
     * Load settings from storage
     */
    function _loadFromStorage() {
        // Load settings
        const settingsStr = localStorage.getItem('publishing_system_settings');
        if (settingsStr) {
            try {
                const savedSettings = JSON.parse(settingsStr);
                _settings = savedSettings.settings || _settings;
                _sites = savedSettings.sites || [];
                _currentSite = savedSettings.currentSite || null;
                _contentTypes = savedSettings.contentTypes || _defaultContentTypes;
                _taxonomies = savedSettings.taxonomies || _defaultTaxonomies;
            } catch (e) {
                console.error('Error loading settings from storage:', e);
            }
        }
    }
    
    /**
     * Save settings to storage
     */
    function _saveSettings() {
        const settingsObj = {
            settings: _settings,
            sites: _sites,
            currentSite: _currentSite,
            contentTypes: _contentTypes,
            taxonomies: _taxonomies
        };
        
        localStorage.setItem('publishing_system_settings', JSON.stringify(settingsObj));
    }
    
    /**
     * Get an item from storage
     * @param {string} key - The storage key
     * @returns {object|null} The stored item or null if not found
     */
    function _getFromStorage(key) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.error(`Error parsing storage item: ${key}`, e);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Save an item to storage
     * @param {string} key - The storage key
     * @param {object} value - The value to store
     */
    function _saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving to storage: ${key}`, e);
        }
    }
    
    // Public API
    return {
        init: init,
        togglePublishingPanel: togglePublishingPanel,
        registerContentType: registerContentType,
        registerTaxonomy: registerTaxonomy,
        getContentItems: getContentItems,
        createNewContent: createNewContent,
        editContent: editContent,
        saveContent: saveContent,
        switchSite: switchSite
    };
})();

// Initialize the publishing system when the DOM is ready
function initializePublishingSystem() {
    // Add essential styles
    addPublishingSystemStyles();
    
    // Wait a bit to ensure the DOM is fully loaded and processed
    setTimeout(() => {
        try {
            PublishingSystem.init();
            console.log('Publishing System initialized successfully');
        } catch (error) {
            console.error('Error initializing Publishing System:', error);
        }
    }, 500);
}

// Add essential styles for the publishing system
function addPublishingSystemStyles() {
    if (document.getElementById('publishing-system-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'publishing-system-styles';
    styleElement.textContent = `
        /* Essential panel styles */
        .publishing-panel {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .publishing-panel.hidden {
            display: none;
        }
        
        /* Navigation item styles */
        #publishing-nav-item {
            cursor: pointer;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        #publishing-nav-item:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        #publishing-nav-item i {
            color: rgba(255, 255, 255, 0.9);
        }
        
        #publishing-nav-item span {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Try to initialize right away if the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializePublishingSystem();
} else {
    // Otherwise wait for the DOM to be ready
    document.addEventListener('DOMContentLoaded', initializePublishingSystem);
}

// Add to global window for access from the PHP-WASM Builder
window.PublishingSystem = PublishingSystem;
