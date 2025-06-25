/**
 * WordPress Connector for PHP-WASM Builder
/**
 * WordPress Connector for PHP-WASM Builder
 * A comprehensive WordPress integration system that connects to WordPress instances,
 * exposes plugin APIs, and provides a foundation for micro-module architecture.
 */
// console.log('[WordPressConnector] Script execution start.'); // Removed

const WordPressConnector = (function() {
    // Private variables
    // console.log('[WordPressConnector] IIFE start.'); // Removed
    let _initialized = false;
    let _sites = [];
    let _currentSite = null;
    let _wpAPIs = {};
    let _pluginRegistry = {};
    let _microModules = {};
    let _nodeTypes = {};
    let _flows = {};
    let _settings = {
        defaultRestBase: '/wp-json',
        defaultAPIVersion: 'wp/v2',
        connectionTimeout: 30000,
        cacheExpiration: 3600000, // 1 hour
        enableOfflineMode: true,
        autoReconnect: true,
        maxReconnectAttempts: 5,
        pollingInterval: 60000, // 1 minute
        maxConcurrentRequests: 10
    };
    
    // DOM Elements
    let _wpConnectorNavItem;
    let _wpConnectorPanel;
    let _siteManagerPanel;
    let _pluginExplorerPanel;
    let _contentBrowserPanel;
    let _flowEditorPanel;
    let _microModulePanel;
    let _settingsPanel;
    
    // API schema cache
    const _apiSchemaCache = new Map();
    
    // Request queue for rate limiting
    const _requestQueue = [];
    let _activeRequests = 0;
    
    // Event subscribers
    const _eventSubscribers = new Map();
    
    /**
     * Initialize the WordPress Connector
     */
    function init() {
        if (_initialized) return;
        
        window.debugLog('[WordPressConnector] Initializing WordPress Connector...');
        
        // Load saved data from storage
        _loadFromStorage();
        
        // Create the UI components
        _createUI();
        
        // Initialize the site index if none exists
        if (_sites.length === 0) {
            _initializeDefaultSite();
        }
        
        // Set the current site to the first one if not set
        if (!_currentSite && _sites.length > 0) {
            _currentSite = _sites[0].id;
        }
        
        // Register built-in node types
        _registerBuiltInNodeTypes();
        
        // Register event listeners
        _registerEventListeners();
        
        _initialized = true;
        window.debugLog('[WordPressConnector] WordPress Connector initialized successfully');
    }
    
    /**
     * Create the UI components for the WordPress Connector
     */
    function _createUI() {
        // Add the WordPress Connector menu item to the navigation
        _createNavigationMenu();
        
        // Create the main WordPress Connector panel
        _createConnectorPanel();
        
        // Create the site manager panel
        _createSiteManagerPanel();
        
        // Create the plugin explorer panel
        _createPluginExplorerPanel();
        
        // Create the content browser panel
        _createContentBrowserPanel();
        
        // Create the flow editor panel
        _createFlowEditorPanel();
        
        // Create the micro module panel
        _createMicroModulePanel();
        
        // Create the settings panel
        _createSettingsPanel();
    }
    
    /**
     * Create the navigation menu for the WordPress Connector
     */
    function _createNavigationMenu() {
        // Try to find the navigation container with fallbacks
        const navContainer = document.querySelector('.main-nav-container') || 
                            document.querySelector('.nav-container') ||
                            document.querySelector('nav') ||
                            document.querySelector('header');
        
        if (!navContainer) {
            window.debugLog('[WordPressConnector] Navigation container not found, creating one.');
            // Create a navigation container if none exists
            const newNavContainer = document.createElement('div');
            newNavContainer.className = 'wp-connector-nav-container';
            newNavContainer.style.position = 'fixed';
            newNavContainer.style.top = '10px';
            newNavContainer.style.left = '10px';
            newNavContainer.style.zIndex = '1000';
            document.body.appendChild(newNavContainer);
            
            // Use this new container
            _wpConnectorNavItem = document.createElement('div');
            _wpConnectorNavItem.className = 'nav-item';
            _wpConnectorNavItem.id = 'wp-connector-nav-item';
            _wpConnectorNavItem.innerHTML = `
                <i class="fab fa-wordpress"></i>
                <span>WordPress</span>
            `;
            
            newNavContainer.appendChild(_wpConnectorNavItem);
            return;
        }
        
        _wpConnectorNavItem = document.createElement('div');
        _wpConnectorNavItem.className = 'nav-item';
        _wpConnectorNavItem.id = 'wp-connector-nav-item';
        _wpConnectorNavItem.innerHTML = `
            <i class="fab fa-wordpress"></i>
            <span>WordPress</span>
        `;
        
        navContainer.appendChild(_wpConnectorNavItem);
    }
    
    /**
     * Create the main WordPress Connector panel
     */
    function _createConnectorPanel() {
        // Try to find an appropriate container, with fallbacks
        let mainContainer = document.querySelector('.main-container') || 
                           document.querySelector('.php-wasm-builder') || 
                           document.querySelector('.builder-container') || 
                           document.querySelector('.app-container') || 
                           document.body;
        
        // Log which container we're using
        window.debugLog('[WordPressConnector] Using container for WordPress Connector panel:', mainContainer.tagName || mainContainer.className);
        
        _wpConnectorPanel = document.createElement('div');
        _wpConnectorPanel.className = 'panel wp-connector-panel glass-panel hidden';
        _wpConnectorPanel.id = 'wp-connector-panel';
        _wpConnectorPanel.innerHTML = `
            <div class="panel-header">
                <h2>WordPress Connector</h2>
                <div class="panel-controls">
                    <button id="wp-settings-btn" class="glass-button small">
                        <i class="fas fa-cog"></i> Settings
                    </button>
                    <button id="wp-connector-close-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="panel-tabs">
                <button id="wp-sites-tab" class="tab-button active">Sites</button>
                <button id="wp-plugins-tab" class="tab-button">Plugins</button>
                <button id="wp-content-tab" class="tab-button">Content</button>
                <button id="wp-flows-tab" class="tab-button">Flows</button>
                <button id="wp-modules-tab" class="tab-button">Micro Modules</button>
            </div>
            <div class="panel-body">
                <div class="wp-connector-sidebar glass-panel">
                    <div class="site-selector">
                        <label>Current WordPress Site:</label>
                        <select id="wp-site-selector"></select>
                    </div>
                    <div id="wp-connector-sidebar-content" class="sidebar-content">
                        <!-- Sidebar content will be dynamically loaded here -->
                    </div>
                </div>
                <div class="wp-connector-content">
                    <!-- Content panels will be loaded here -->
                </div>
            </div>
        `;
        
        // Make the panel fixed position if we're using body as the container
        if (mainContainer === document.body) {
            _wpConnectorPanel.style.position = 'fixed';
            _wpConnectorPanel.style.top = '50%';
            _wpConnectorPanel.style.left = '50%';
            _wpConnectorPanel.style.transform = 'translate(-50%, -50%)';
            _wpConnectorPanel.style.width = '90%';
            _wpConnectorPanel.style.height = '90%';
            _wpConnectorPanel.style.maxWidth = '1200px';
            _wpConnectorPanel.style.maxHeight = '800px';
            _wpConnectorPanel.style.zIndex = '1001';
        }
        
        mainContainer.appendChild(_wpConnectorPanel);
    }
    
    /**
     * Create the site manager panel
     */
    function _createSiteManagerPanel() {
        _siteManagerPanel = document.createElement('div');
        _siteManagerPanel.className = 'wp-site-manager-panel';
        _siteManagerPanel.id = 'wp-site-manager-panel';
        _siteManagerPanel.innerHTML = `
            <div class="site-manager-header">
                <h3>Manage WordPress Sites</h3>
                <div class="site-manager-controls">
                    <button id="add-wp-site-btn" class="glass-button">
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
                            <th>API Version</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="wp-site-list-body">
                        <!-- Sites will be added here -->
                    </tbody>
                </table>
            </div>
            <div id="wp-site-edit-container" class="site-edit-container glass-panel hidden">
                <h4 id="wp-site-edit-title">Add New WordPress Site</h4>
                <div class="form-group">
                    <label for="wp-site-name">Site Name:</label>
                    <input type="text" id="wp-site-name" placeholder="Enter site name">
                </div>
                <div class="form-group">
                    <label for="wp-site-url">Site URL:</label>
                    <input type="text" id="wp-site-url" placeholder="https://yoursite.com">
                </div>
                <div class="form-group">
                    <label for="wp-rest-url">REST API Base (optional):</label>
                    <input type="text" id="wp-rest-url" placeholder="/wp-json">
                    <span class="form-help">Leave empty to use default: /wp-json</span>
                </div>
                <div class="form-group">
                    <label>Authentication:</label>
                    <div class="radio-group">
                        <input type="radio" id="auth-none" name="auth-type" value="none" checked>
                        <label for="auth-none">None</label>
                        
                        <input type="radio" id="auth-basic" name="auth-type" value="basic">
                        <label for="auth-basic">Basic Auth</label>
                        
                        <input type="radio" id="auth-jwt" name="auth-type" value="jwt">
                        <label for="auth-jwt">JWT</label>
                        
                        <input type="radio" id="auth-oauth" name="auth-type" value="oauth">
                        <label for="auth-oauth">OAuth 2.0</label>
                    </div>
                </div>
                <div id="auth-credentials-container" class="auth-credentials hidden">
                    <!-- Authentication fields will be added here dynamically -->
                </div>
                <div class="form-group">
                    <label for="wp-api-version">API Version:</label>
                    <select id="wp-api-version">
                        <option value="wp/v2">WP REST API v2 (WordPress 4.7+)</option>
                        <option value="wp/v1">WP REST API v1 (WordPress 4.4-4.6)</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div id="custom-api-version-container" class="form-group hidden">
                    <label for="wp-custom-api-version">Custom API Version:</label>
                    <input type="text" id="wp-custom-api-version" placeholder="Enter custom API version">
                </div>
                <div class="form-group">
                    <label>Advanced Options:</label>
                    <div class="checkbox-group">
                        <input type="checkbox" id="wp-verify-ssl" checked>
                        <label for="wp-verify-ssl">Verify SSL Certificate</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="wp-enable-caching" checked>
                        <label for="wp-enable-caching">Enable Response Caching</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="wp-auto-discover-api">
                        <label for="wp-auto-discover-api">Auto-discover API Endpoints</label>
                    </div>
                </div>
                <div class="form-actions">
                    <button id="test-wp-connection-btn" class="glass-button">Test Connection</button>
                    <button id="save-wp-site-btn" class="glass-button primary">Save Site</button>
                    <button id="cancel-wp-site-edit-btn" class="glass-button">Cancel</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Create the plugin explorer panel
     */
    function _createPluginExplorerPanel() {
        _pluginExplorerPanel = document.createElement('div');
        _pluginExplorerPanel.className = 'wp-plugin-explorer-panel hidden';
        _pluginExplorerPanel.id = 'wp-plugin-explorer-panel';
        _pluginExplorerPanel.innerHTML = `
            <div class="plugin-explorer-header">
                <h3>WordPress Plugin Explorer</h3>
                <div class="plugin-explorer-controls">
                    <div class="search-box">
                        <input type="text" id="plugin-search" placeholder="Search plugins...">
                        <button id="plugin-search-btn" class="glass-button small">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <button id="refresh-plugins-btn" class="glass-button">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="plugin-list-container">
                <div class="plugin-filters glass-panel">
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="plugin-status-filter">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>API Support:</label>
                        <select id="plugin-api-filter">
                            <option value="all">All</option>
                            <option value="has-api">Has API</option>
                            <option value="no-api">No API</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort by:</label>
                        <select id="plugin-sort-filter">
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="latest">Recently Updated</option>
                        </select>
                    </div>
                </div>
                <table class="glass-table">
                    <thead>
                        <tr>
                            <th>Plugin</th>
                            <th>Version</th>
                            <th>Status</th>
                            <th>API Endpoints</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="plugin-list-body">
                        <!-- Plugins will be added here -->
                    </tbody>
                </table>
            </div>
            <div id="plugin-detail-container" class="plugin-detail-container glass-panel hidden">
                <div class="plugin-detail-header">
                    <h4 id="plugin-detail-title">Plugin Details</h4>
                    <button id="close-plugin-detail-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="plugin-detail-content" class="plugin-detail-content">
                    <!-- Plugin details will be added here -->
                </div>
            </div>
        `;
    }
    
    /**
     * Create the content browser panel
     */
    function _createContentBrowserPanel() {
        _contentBrowserPanel = document.createElement('div');
        _contentBrowserPanel.className = 'wp-content-browser-panel hidden';
        _contentBrowserPanel.id = 'wp-content-browser-panel';
        _contentBrowserPanel.innerHTML = `
            <div class="content-browser-header">
                <h3>WordPress Content Browser</h3>
                <div class="content-browser-controls">
                    <div class="search-box">
                        <input type="text" id="content-search" placeholder="Search content...">
                        <button id="content-search-btn" class="glass-button small">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <button id="refresh-content-btn" class="glass-button">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="content-type-selector">
                <select id="content-type-selector">
                    <option value="posts">Posts</option>
                    <option value="pages">Pages</option>
                    <option value="media">Media</option>
                    <option value="custom">Custom Post Types</option>
                </select>
                <div id="custom-post-type-selector" class="custom-post-type-selector hidden">
                    <select id="custom-post-type-dropdown">
                        <!-- Custom post types will be added here -->
                    </select>
                </div>
            </div>
            <div class="content-browser-container">
                <div class="content-filters glass-panel">
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="content-status-filter">
                            <option value="all">All</option>
                            <option value="publish">Published</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort by:</label>
                        <select id="content-sort-filter">
                            <option value="date-desc">Date (Newest)</option>
                            <option value="date-asc">Date (Oldest)</option>
                            <option value="title-asc">Title (A-Z)</option>
                            <option value="title-desc">Title (Z-A)</option>
                        </select>
                    </div>
                    <div id="taxonomy-filters" class="filter-group taxonomy-filters">
                        <!-- Taxonomy filters will be added here -->
                    </div>
                </div>
                <div class="content-list-table">
                    <table class="glass-table">
                        <thead id="content-table-head">
                            <!-- Table headers will be dynamically added based on content type -->
                        </thead>
                        <tbody id="content-list-body">
                            <!-- Content items will be added here -->
                        </tbody>
                    </table>
                </div>
                <div class="content-pagination">
                    <button id="prev-page-btn" class="glass-button small">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <span id="page-indicator">Page 1 of 1</span>
                    <button id="next-page-btn" class="glass-button small">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div id="content-detail-container" class="content-detail-container glass-panel hidden">
                <div class="content-detail-header">
                    <h4 id="content-detail-title">Content Details</h4>
                    <div class="content-detail-controls">
                        <button id="import-content-btn" class="glass-button small">
                            <i class="fas fa-file-import"></i> Import
                        </button>
                        <button id="close-content-detail-btn" class="glass-button small">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="content-detail-body" class="content-detail-body">
                    <!-- Content details will be added here -->
                </div>
            </div>
        `;
    }
    
    /**
     * Create the flow editor panel
     */
    function _createFlowEditorPanel() {
        _flowEditorPanel = document.createElement('div');
        _flowEditorPanel.className = 'wp-flow-editor-panel hidden';
        _flowEditorPanel.id = 'wp-flow-editor-panel';
        _flowEditorPanel.innerHTML = `
            <div class="flow-editor-header">
                <h3>WordPress Flow Editor</h3>
                <div class="flow-editor-controls">
                    <div class="flow-selector">
                        <select id="flow-selector">
                            <option value="new">-- Create New Flow --</option>
                            <!-- Existing flows will be added here -->
                        </select>
                    </div>
                    <div class="flow-actions">
                        <button id="save-flow-btn" class="glass-button">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button id="run-flow-btn" class="glass-button">
                            <i class="fas fa-play"></i> Run
                        </button>
                        <button id="export-flow-btn" class="glass-button">
                            <i class="fas fa-file-export"></i> Export
                        </button>
                        <button id="import-flow-btn" class="glass-button">
                            <i class="fas fa-file-import"></i> Import
                        </button>
                    </div>
                </div>
            </div>
            <div class="flow-editor-container">
                <div class="flow-editor-sidebar glass-panel">
                    <div class="sidebar-header">
                        <h4>Node Types</h4>
                        <div class="sidebar-search">
                            <input type="text" id="node-search" placeholder="Search nodes...">
                        </div>
                    </div>
                    <div class="node-categories">
                        <div class="node-category">
                            <div class="category-header">
                                <h5>WordPress API</h5>
                                <button class="toggle-category">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="category-nodes">
                                <!-- WordPress API nodes will be added here -->
                            </div>
                        </div>
                        <div class="node-category">
                            <div class="category-header">
                                <h5>Data Processing</h5>
                                <button class="toggle-category">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="category-nodes">
                                <!-- Data processing nodes will be added here -->
                            </div>
                        </div>
                        <div class="node-category">
                            <div class="category-header">
                                <h5>Custom Nodes</h5>
                                <button class="toggle-category">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div class="category-nodes">
                                <!-- Custom nodes will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flow-editor-canvas" id="flow-editor-canvas">
                    <!-- Flow canvas will be rendered here -->
                    <div class="flow-canvas-placeholder">
                        <p>Drag and drop nodes from the sidebar to create a flow</p>
                    </div>
                </div>
                <div class="flow-editor-inspector glass-panel hidden" id="flow-editor-inspector">
                    <div class="inspector-header">
                        <h4 id="inspector-title">Node Inspector</h4>
                        <button id="close-inspector-btn" class="glass-button small">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="inspector-content" class="inspector-content">
                        <!-- Node properties will be added here -->
                    </div>
                </div>
            </div>
            <div class="flow-execution-panel glass-panel hidden" id="flow-execution-panel">
                <div class="execution-header">
                    <h4>Flow Execution</h4>
                    <button id="close-execution-panel-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="execution-controls">
                    <button id="step-execution-btn" class="glass-button">
                        <i class="fas fa-step-forward"></i> Step
                    </button>
                    <button id="pause-execution-btn" class="glass-button">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                    <button id="stop-execution-btn" class="glass-button">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                </div>
                <div id="execution-log" class="execution-log">
                    <!-- Execution log will be added here -->
                </div>
                <div id="execution-results" class="execution-results">
                    <!-- Execution results will be added here -->
                </div>
            </div>
        `;
    }
    
    /**
     * Create the micro module panel
     */
    function _createMicroModulePanel() {
        _microModulePanel = document.createElement('div');
        _microModulePanel.className = 'wp-micro-module-panel hidden';
        _microModulePanel.id = 'wp-micro-module-panel';
        _microModulePanel.innerHTML = `
            <div class="micro-module-header">
                <h3>WordPress Micro Modules</h3>
                <div class="micro-module-controls">
                    <button id="create-module-btn" class="glass-button">
                        <i class="fas fa-plus"></i> Create Module
                    </button>
                    <button id="import-module-btn" class="glass-button">
                        <i class="fas fa-file-import"></i> Import
                    </button>
                    <div class="search-box">
                        <input type="text" id="module-search" placeholder="Search modules...">
                        <button id="module-search-btn" class="glass-button small">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="micro-module-filters glass-panel">
                <div class="filter-group">
                    <label>Category:</label>
                    <select id="module-category-filter">
                        <option value="all">All Categories</option>
                        <option value="content">Content Management</option>
                        <option value="user">User Management</option>
                        <option value="media">Media Management</option>
                        <option value="seo">SEO</option>
                        <option value="ecommerce">E-Commerce</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Sort by:</label>
                    <select id="module-sort-filter">
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="created-desc">Newest First</option>
                        <option value="created-asc">Oldest First</option>
                    </select>
                </div>
            </div>
            <div class="micro-module-grid" id="micro-module-grid">
                <!-- Micro modules will be added here -->
                <div class="module-card placeholder">
                    <div class="module-card-content">
                        <p>No modules found.</p>
                    </div>
                </div>
            </div>
            <div id="module-detail-container" class="module-detail-container glass-panel hidden">
                <div class="module-detail-header">
                    <h4 id="module-detail-title">Module Details</h4>
                    <div class="module-detail-controls">
                        <button id="edit-module-btn" class="glass-button small">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button id="export-module-btn" class="glass-button small">
                            <i class="fas fa-file-export"></i> Export
                        </button>
                        <button id="close-module-detail-btn" class="glass-button small">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="module-detail-content" class="module-detail-content">
                    <!-- Module details will be added here -->
                </div>
            </div>
            <div id="module-editor-container" class="module-editor-container glass-panel hidden">
                <div class="module-editor-header">
                    <h4 id="module-editor-title">Create New Module</h4>
                    <button id="close-module-editor-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="module-editor-form">
                    <div class="form-group">
                        <label for="module-name">Module Name:</label>
                        <input type="text" id="module-name" placeholder="Enter module name">
                    </div>
                    <div class="form-group">
                        <label for="module-description">Description:</label>
                        <textarea id="module-description" placeholder="Enter module description"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="module-category">Category:</label>
                        <select id="module-category">
                            <option value="content">Content Management</option>
                            <option value="user">User Management</option>
                            <option value="media">Media Management</option>
                            <option value="seo">SEO</option>
                            <option value="ecommerce">E-Commerce</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="custom-category-group">
                        <label for="custom-category">Custom Category:</label>
                        <input type="text" id="custom-category" placeholder="Enter custom category">
                    </div>
                    <div class="form-group">
                        <label>Input Parameters:</label>
                        <div id="input-params-container" class="params-container">
                            <!-- Input parameters will be added here -->
                            <div class="param-row">
                                <input type="text" class="param-name" placeholder="Parameter name">
                                <select class="param-type">
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="object">Object</option>
                                    <option value="array">Array</option>
                                </select>
                                <input type="text" class="param-default" placeholder="Default value">
                                <div class="param-required">
                                    <input type="checkbox" id="param-required">
                                    <label for="param-required">Required</label>
                                </div>
                                <button class="remove-param-btn glass-button small">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <button id="add-input-param-btn" class="glass-button small">
                            <i class="fas fa-plus"></i> Add Parameter
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Output Parameters:</label>
                        <div id="output-params-container" class="params-container">
                            <!-- Output parameters will be added here -->
                            <div class="param-row">
                                <input type="text" class="param-name" placeholder="Parameter name">
                                <select class="param-type">
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="object">Object</option>
                                    <option value="array">Array</option>
                                </select>
                                <input type="text" class="param-description" placeholder="Description">
                                <button class="remove-param-btn glass-button small">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <button id="add-output-param-btn" class="glass-button small">
                            <i class="fas fa-plus"></i> Add Parameter
                        </button>
                    </div>
                    <div class="form-group">
                        <label for="module-flow">Associated Flow:</label>
                        <select id="module-flow">
                            <option value="">-- Select a Flow --</option>
                            <!-- Flows will be added here -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Advanced Options:</label>
                        <div class="checkbox-group">
                            <input type="checkbox" id="module-cacheable" checked>
                            <label for="module-cacheable">Cacheable</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="module-async">
                            <label for="module-async">Asynchronous Execution</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="module-standalone">
                            <label for="module-standalone">Standalone (No WordPress Dependency)</label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button id="save-module-btn" class="glass-button primary">Save Module</button>
                        <button id="cancel-module-edit-btn" class="glass-button">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create the settings panel
     */
    function _createSettingsPanel() {
        _settingsPanel = document.createElement('div');
        _settingsPanel.className = 'wp-settings-panel hidden';
        _settingsPanel.id = 'wp-settings-panel';
        _settingsPanel.innerHTML = `
            <div class="settings-header">
                <h3>WordPress Connector Settings</h3>
                <button id="close-settings-btn" class="glass-button small">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <h4>API Settings</h4>
                    <div class="form-group">
                        <label for="default-rest-base">Default REST API Base:</label>
                        <input type="text" id="default-rest-base" value="/wp-json">
                    </div>
                    <div class="form-group">
                        <label for="default-api-version">Default API Version:</label>
                        <select id="default-api-version">
                            <option value="wp/v2">WP REST API v2 (WordPress 4.7+)</option>
                            <option value="wp/v1">WP REST API v1 (WordPress 4.4-4.6)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="connection-timeout">Connection Timeout (ms):</label>
                        <input type="number" id="connection-timeout" value="30000">
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Caching Settings</h4>
                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-caching" checked>
                        <label for="enable-caching">Enable Response Caching</label>
                    </div>
                    <div class="form-group">
                        <label for="cache-expiration">Cache Expiration (ms):</label>
                        <input type="number" id="cache-expiration" value="3600000">
                    </div>
                    <button id="clear-cache-btn" class="glass-button">
                        <i class="fas fa-trash"></i> Clear Cache
                    </button>
                </div>
                <div class="settings-section">
                    <h4>Connection Settings</h4>
                    <div class="checkbox-group">
                        <input type="checkbox" id="enable-offline-mode" checked>
                        <label for="enable-offline-mode">Enable Offline Mode</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="auto-reconnect" checked>
                        <label for="auto-reconnect">Auto Reconnect</label>
                    </div>
                    <div class="form-group">
                        <label for="max-reconnect-attempts">Max Reconnect Attempts:</label>
                        <input type="number" id="max-reconnect-attempts" value="5">
                    </div>
                    <div class="form-group">
                        <label for="polling-interval">Polling Interval (ms):</label>
                        <input type="number" id="polling-interval" value="60000">
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Rate Limiting</h4>
                    <div class="form-group">
                        <label for="max-concurrent-requests">Max Concurrent Requests:</label>
                        <input type="number" id="max-concurrent-requests" value="10">
                    </div>
                </div>
                <div class="settings-section">
                    <h4>System</h4>
                    <button id="export-data-btn" class="glass-button">
                        <i class="fas fa-file-export"></i> Export Data
                    </button>
                    <button id="import-data-btn" class="glass-button">
                        <i class="fas fa-file-import"></i> Import Data
                    </button>
                    <button id="reset-btn" class="glass-button danger">
                        <i class="fas fa-exclamation-triangle"></i> Reset All Data
                    </button>
                </div>
            </div>
            <div class="settings-footer">
                <button id="save-settings-btn" class="glass-button primary">Save Settings</button>
                <button id="cancel-settings-btn" class="glass-button">Cancel</button>
            </div>
        `;
    }
    
    /**
     * Register event listeners for the WordPress Connector UI
     */
    function _registerEventListeners() {
        // Navigation menu click
        _wpConnectorNavItem.addEventListener('click', function() {
            toggleConnectorPanel();
        });
        
        // Close button click
        const closeBtn = document.getElementById('wp-connector-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toggleConnectorPanel(false);
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
                    case 'wp-sites-tab':
                        showSitesPanel();
                        break;
                    case 'wp-plugins-tab':
                        showPluginsPanel();
                        break;
                    case 'wp-content-tab':
                        showContentPanel();
                        break;
                    case 'wp-flows-tab':
                        showFlowsPanel();
                        break;
                    case 'wp-modules-tab':
                        showModulesPanel();
                        break;
                }
            });
        });
        
        // Site selector change
        const siteSelector = document.getElementById('wp-site-selector');
        if (siteSelector) {
            siteSelector.addEventListener('change', function() {
                switchSite(this.value);
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('wp-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                showSettingsPanel();
            });
        }
        
        // Close settings button
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', function() {
                hideSettingsPanel();
            });
        }
        
        // Save settings button
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', function() {
                saveSettings();
                hideSettingsPanel();
            });
        }
        
        // Cancel settings button
        const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', function() {
                hideSettingsPanel();
            });
        }
        
        // Add WordPress site button
        const addSiteBtn = document.getElementById('add-wp-site-btn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', function() {
                showSiteEditForm();
            });
        }
        
        // API version change
        const apiVersionSelect = document.getElementById('wp-api-version');
        if (apiVersionSelect) {
            apiVersionSelect.addEventListener('change', function() {
                const customApiContainer = document.getElementById('custom-api-version-container');
                if (this.value === 'custom') {
                    customApiContainer.classList.remove('hidden');
                } else {
                    customApiContainer.classList.add('hidden');
                }
            });
        }
        
        // Authentication type change
        const authRadios = document.querySelectorAll('input[name="auth-type"]');
        authRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                updateAuthForm(this.value);
            });
        });
        
        // Test connection button
        const testConnectionBtn = document.getElementById('test-wp-connection-btn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', function() {
                testSiteConnection();
            });
        }
        
        // Save site button
        const saveSiteBtn = document.getElementById('save-wp-site-btn');
        if (saveSiteBtn) {
            saveSiteBtn.addEventListener('click', function() {
                saveSite();
            });
        }
        
        // Cancel site edit button
        const cancelSiteEditBtn = document.getElementById('cancel-wp-site-edit-btn');
        if (cancelSiteEditBtn) {
            cancelSiteEditBtn.addEventListener('click', function() {
                hideSiteEditForm();
            });
        }
        
        // Module category change
        const moduleCategory = document.getElementById('module-category');
        if (moduleCategory) {
            moduleCategory.addEventListener('change', function() {
                const customCategoryGroup = document.getElementById('custom-category-group');
                if (this.value === 'custom') {
                    customCategoryGroup.classList.remove('hidden');
                } else {
                    customCategoryGroup.classList.add('hidden');
                }
            });
        }
        
        // Add input parameter button
        const addInputParamBtn = document.getElementById('add-input-param-btn');
        if (addInputParamBtn) {
            addInputParamBtn.addEventListener('click', function() {
                addInputParameter();
            });
        }
        
        // Add output parameter button
        const addOutputParamBtn = document.getElementById('add-output-param-btn');
        if (addOutputParamBtn) {
            addOutputParamBtn.addEventListener('click', function() {
                addOutputParameter();
            });
        }
        
        // Save module button
        const saveModuleBtn = document.getElementById('save-module-btn');
        if (saveModuleBtn) {
            saveModuleBtn.addEventListener('click', function() {
                saveModule();
            });
        }
        
        // Cancel module edit button
        const cancelModuleEditBtn = document.getElementById('cancel-module-edit-btn');
        if (cancelModuleEditBtn) {
            cancelModuleEditBtn.addEventListener('click', function() {
                hideModuleEditForm();
            });
        }
        
        // Create module button
        const createModuleBtn = document.getElementById('create-module-btn');
        if (createModuleBtn) {
            createModuleBtn.addEventListener('click', function() {
                showModuleEditForm();
            });
        }
        
        // Content type selector change
        const contentTypeSelector = document.getElementById('content-type-selector');
        if (contentTypeSelector) {
            contentTypeSelector.addEventListener('change', function() {
                const customPostTypeSelector = document.getElementById('custom-post-type-selector');
                if (this.value === 'custom') {
                    customPostTypeSelector.classList.remove('hidden');
                    loadCustomPostTypes();
                } else {
                    customPostTypeSelector.classList.add('hidden');
                    loadContentType(this.value);
                }
            });
        }
        
        // Custom post type dropdown change
        const customPostTypeDropdown = document.getElementById('custom-post-type-dropdown');
        if (customPostTypeDropdown) {
            customPostTypeDropdown.addEventListener('change', function() {
                loadContentType(this.value);
            });
        }
        
        // Flow selector change
        const flowSelector = document.getElementById('flow-selector');
        if (flowSelector) {
            flowSelector.addEventListener('change', function() {
                if (this.value === 'new') {
                    createNewFlow();
                } else {
                    loadFlow(this.value);
                }
            });
        }
        
        // Save flow button
        const saveFlowBtn = document.getElementById('save-flow-btn');
        if (saveFlowBtn) {
            saveFlowBtn.addEventListener('click', function() {
                saveCurrentFlow();
            });
        }
        
        // Run flow button
        const runFlowBtn = document.getElementById('run-flow-btn');
        if (runFlowBtn) {
            runFlowBtn.addEventListener('click', function() {
                runCurrentFlow();
            });
        }
        
        // Export flow button
        const exportFlowBtn = document.getElementById('export-flow-btn');
        if (exportFlowBtn) {
            exportFlowBtn.addEventListener('click', function() {
                exportCurrentFlow();
            });
        }
        
        // Import flow button
        const importFlowBtn = document.getElementById('import-flow-btn');
        if (importFlowBtn) {
            importFlowBtn.addEventListener('click', function() {
                importFlow();
            });
        }
        
        // Close execution panel button
        const closeExecutionPanelBtn = document.getElementById('close-execution-panel-btn');
        if (closeExecutionPanelBtn) {
            closeExecutionPanelBtn.addEventListener('click', function() {
                hideExecutionPanel();
            });
        }
        
        // Step execution button
        const stepExecutionBtn = document.getElementById('step-execution-btn');
        if (stepExecutionBtn) {
            stepExecutionBtn.addEventListener('click', function() {
                stepFlowExecution();
            });
        }
        
        // Pause execution button
        const pauseExecutionBtn = document.getElementById('pause-execution-btn');
        if (pauseExecutionBtn) {
            pauseExecutionBtn.addEventListener('click', function() {
                pauseFlowExecution();
            });
        }
        
        // Stop execution button
        const stopExecutionBtn = document.getElementById('stop-execution-btn');
        if (stopExecutionBtn) {
            stopExecutionBtn.addEventListener('click', function() {
                stopFlowExecution();
            });
        }
        
        // Plugin status filter change
        const pluginStatusFilter = document.getElementById('plugin-status-filter');
        if (pluginStatusFilter) {
            pluginStatusFilter.addEventListener('change', function() {
                filterPlugins();
            });
        }
        
        // Plugin API filter change
        const pluginApiFilter = document.getElementById('plugin-api-filter');
        if (pluginApiFilter) {
            pluginApiFilter.addEventListener('change', function() {
                filterPlugins();
            });
        }
        
        // Plugin sort filter change
        const pluginSortFilter = document.getElementById('plugin-sort-filter');
        if (pluginSortFilter) {
            pluginSortFilter.addEventListener('change', function() {
                filterPlugins();
            });
        }
        
        // Plugin search button
        const pluginSearchBtn = document.getElementById('plugin-search-btn');
        if (pluginSearchBtn) {
            pluginSearchBtn.addEventListener('click', function() {
                filterPlugins();
            });
        }
        
        // Plugin search input Enter key
        const pluginSearch = document.getElementById('plugin-search');
        if (pluginSearch) {
            pluginSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    filterPlugins();
                }
            });
        }
        
        // Refresh plugins button
        const refreshPluginsBtn = document.getElementById('refresh-plugins-btn');
        if (refreshPluginsBtn) {
            refreshPluginsBtn.addEventListener('click', function() {
                refreshPlugins();
            });
        }
        
        // Close plugin detail button
        const closePluginDetailBtn = document.getElementById('close-plugin-detail-btn');
        if (closePluginDetailBtn) {
            closePluginDetailBtn.addEventListener('click', function() {
                hidePluginDetail();
            });
        }
        
        // Content status filter change
        const contentStatusFilter = document.getElementById('content-status-filter');
        if (contentStatusFilter) {
            contentStatusFilter.addEventListener('change', function() {
                filterContent();
            });
        }
        
        // Content sort filter change
        const contentSortFilter = document.getElementById('content-sort-filter');
        if (contentSortFilter) {
            contentSortFilter.addEventListener('change', function() {
                filterContent();
            });
        }
        
        // Content search button
        const contentSearchBtn = document.getElementById('content-search-btn');
        if (contentSearchBtn) {
            contentSearchBtn.addEventListener('click', function() {
                filterContent();
            });
        }
        
        // Content search input Enter key
        const contentSearch = document.getElementById('content-search');
        if (contentSearch) {
            contentSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    filterContent();
                }
            });
        }
        
        // Refresh content button
        const refreshContentBtn = document.getElementById('refresh-content-btn');
        if (refreshContentBtn) {
            refreshContentBtn.addEventListener('click', function() {
                refreshContent();
            });
        }
        
        // Pagination buttons
        const prevPageBtn = document.getElementById('prev-page-btn');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                loadPreviousPage();
            });
        }
        
        const nextPageBtn = document.getElementById('next-page-btn');
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                loadNextPage();
            });
        }
        
        // Close content detail button
        const closeContentDetailBtn = document.getElementById('close-content-detail-btn');
        if (closeContentDetailBtn) {
            closeContentDetailBtn.addEventListener('click', function() {
                hideContentDetail();
            });
        }
        
        // Import content button
        const importContentBtn = document.getElementById('import-content-btn');
        if (importContentBtn) {
            importContentBtn.addEventListener('click', function() {
                importSelectedContent();
            });
        }
        
        // Module category filter change
        const moduleCategoryFilter = document.getElementById('module-category-filter');
        if (moduleCategoryFilter) {
            moduleCategoryFilter.addEventListener('change', function() {
                filterModules();
            });
        }
        
        // Module sort filter change
        const moduleSortFilter = document.getElementById('module-sort-filter');
        if (moduleSortFilter) {
            moduleSortFilter.addEventListener('change', function() {
                filterModules();
            });
        }
        
        // Module search button
        const moduleSearchBtn = document.getElementById('module-search-btn');
        if (moduleSearchBtn) {
            moduleSearchBtn.addEventListener('click', function() {
                filterModules();
            });
        }
        
        // Module search input Enter key
        const moduleSearch = document.getElementById('module-search');
        if (moduleSearch) {
            moduleSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    filterModules();
                }
            });
        }
        
        // Close module detail button
        const closeModuleDetailBtn = document.getElementById('close-module-detail-btn');
        if (closeModuleDetailBtn) {
            closeModuleDetailBtn.addEventListener('click', function() {
                hideModuleDetail();
            });
        }
        
        // Edit module button
        const editModuleBtn = document.getElementById('edit-module-btn');
        if (editModuleBtn) {
            editModuleBtn.addEventListener('click', function() {
                editCurrentModule();
            });
        }
        
        // Export module button
        const exportModuleBtn = document.getElementById('export-module-btn');
        if (exportModuleBtn) {
            exportModuleBtn.addEventListener('click', function() {
                exportCurrentModule();
            });
        }
        
        // Import module button
        const importModuleBtn = document.getElementById('import-module-btn');
        if (importModuleBtn) {
            importModuleBtn.addEventListener('click', function() {
                importModule();
            });
        }
        
        // Clear cache button
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', function() {
                clearAPICache();
            });
        }
        
        // Export data button
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', function() {
                exportAllData();
            });
        }
        
        // Import data button
        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', function() {
                importAllData();
            });
        }
        
        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset all WordPress Connector data? This action cannot be undone.')) {
                    resetAllData();
                }
            });
        }
    }
    
    /**
     * Toggle the WordPress Connector panel visibility
     * @param {boolean} show - Whether to show or hide the panel
     */
    function toggleConnectorPanel(show) {
        if (_wpConnectorPanel) {
            if (show === undefined) {
                _wpConnectorPanel.classList.toggle('hidden');
            } else if (show) {
                _wpConnectorPanel.classList.remove('hidden');
            } else {
                _wpConnectorPanel.classList.add('hidden');
            }
            
            // Refresh the UI when showing the panel
            if (!_wpConnectorPanel.classList.contains('hidden')) {
                refreshUI();
            }
        }
    }
    
    /**
     * Show the sites panel
     */
    function showSitesPanel() {
        const connectorContent = document.querySelector('.wp-connector-content');
        if (connectorContent) {
            // Clear current content
            connectorContent.innerHTML = '';
            // Add the site manager panel
            connectorContent.appendChild(_siteManagerPanel);
            
            // Clear sidebar content
            const sidebarContent = document.getElementById('wp-connector-sidebar-content');
            if (sidebarContent) {
                sidebarContent.innerHTML = '';
            }
            
            // Refresh the site list
            refreshSiteList();
        }
    }
    
    /**
     * Show the plugins panel
     */
    function showPluginsPanel() {
        // Check if we have a current site
        if (!_currentSite) {
            alert('Please select or add a WordPress site first.');
            showSitesPanel();
            return;
        }
        
        const connectorContent = document.querySelector('.wp-connector-content');
        if (connectorContent) {
            // Clear current content
            connectorContent.innerHTML = '';
            // Add the plugin explorer panel
            connectorContent.appendChild(_pluginExplorerPanel);
            _pluginExplorerPanel.classList.remove('hidden');
            
            // Update sidebar with plugin categories
            updatePluginSidebar();
            
            // Load plugins
            loadPlugins();
        }
    }
    
    /**
     * Show the content panel
     */
    function showContentPanel() {
        // Check if we have a current site
        if (!_currentSite) {
            alert('Please select or add a WordPress site first.');
            showSitesPanel();
            return;
        }
        
        const connectorContent = document.querySelector('.wp-connector-content');
        if (connectorContent) {
            // Clear current content
            connectorContent.innerHTML = '';
            // Add the content browser panel
            connectorContent.appendChild(_contentBrowserPanel);
            _contentBrowserPanel.classList.remove('hidden');
            
            // Update sidebar with content types
            updateContentSidebar();
            
            // Load posts by default
            loadContentType('posts');
        }
    }
    
    /**
     * Show the flows panel
     */
    function showFlowsPanel() {
        const connectorContent = document.querySelector('.wp-connector-content');
        if (connectorContent) {
            // Clear current content
            connectorContent.innerHTML = '';
            // Add the flow editor panel
            connectorContent.appendChild(_flowEditorPanel);
            _flowEditorPanel.classList.remove('hidden');
            
            // Update sidebar with flow categories
            updateFlowSidebar();
            
            // Load flows
            loadFlows();
            
            // Initialize the flow editor
            initFlowEditor();
        }
    }
    
    /**
     * Show the modules panel
     */
    function showModulesPanel() {
        const connectorContent = document.querySelector('.wp-connector-content');
        if (connectorContent) {
            // Clear current content
            connectorContent.innerHTML = '';
            // Add the micro module panel
            connectorContent.appendChild(_microModulePanel);
            _microModulePanel.classList.remove('hidden');
            
            // Update sidebar with module categories
            updateModuleSidebar();
            
            // Load modules
            loadModules();
        }
    }
    
    /**
     * Show the settings panel
     */
    function showSettingsPanel() {
        if (_settingsPanel) {
            // Fill the settings form with current values
            document.getElementById('default-rest-base').value = _settings.defaultRestBase;
            document.getElementById('default-api-version').value = _settings.defaultAPIVersion;
            document.getElementById('connection-timeout').value = _settings.connectionTimeout;
            document.getElementById('enable-caching').checked = _settings.enableCaching || true;
            document.getElementById('cache-expiration').value = _settings.cacheExpiration;
            document.getElementById('enable-offline-mode').checked = _settings.enableOfflineMode;
            document.getElementById('auto-reconnect').checked = _settings.autoReconnect;
            document.getElementById('max-reconnect-attempts').value = _settings.maxReconnectAttempts;
            document.getElementById('polling-interval').value = _settings.pollingInterval;
            document.getElementById('max-concurrent-requests').value = _settings.maxConcurrentRequests;
            
            // Show the settings panel
            _settingsPanel.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the settings panel
     */
    function hideSettingsPanel() {
        if (_settingsPanel) {
            _settingsPanel.classList.add('hidden');
        }
    }
    
    /**
     * Save settings
     */
    function saveSettings() {
        _settings.defaultRestBase = document.getElementById('default-rest-base').value;
        _settings.defaultAPIVersion = document.getElementById('default-api-version').value;
        _settings.connectionTimeout = parseInt(document.getElementById('connection-timeout').value);
        _settings.enableCaching = document.getElementById('enable-caching').checked;
        _settings.cacheExpiration = parseInt(document.getElementById('cache-expiration').value);
        _settings.enableOfflineMode = document.getElementById('enable-offline-mode').checked;
        _settings.autoReconnect = document.getElementById('auto-reconnect').checked;
        _settings.maxReconnectAttempts = parseInt(document.getElementById('max-reconnect-attempts').value);
        _settings.pollingInterval = parseInt(document.getElementById('polling-interval').value);
        _settings.maxConcurrentRequests = parseInt(document.getElementById('max-concurrent-requests').value);
        
        // Save settings to storage
        _saveSettings();
        
        // Show a success message
        alert('Settings saved successfully.');
    }
    
    /**
     * Refresh the UI components
     */
    function refreshUI() {
        // Update site selector
        refreshSiteSelector();
        
        // Show the sites panel by default
        showSitesPanel();
    }
    
    /**
     * Refresh the site selector dropdown
     */
    function refreshSiteSelector() {
        const siteSelector = document.getElementById('wp-site-selector');
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
     * Refresh the site list
     */
    function refreshSiteList() {
        const siteListBody = document.getElementById('wp-site-list-body');
        if (siteListBody) {
            // Clear current items
            siteListBody.innerHTML = '';
            
            // Add items to the table
            _sites.forEach(site => {
                const tr = document.createElement('tr');
                tr.dataset.siteId = site.id;
                
                tr.innerHTML = `
                    <td>${site.name}</td>
                    <td>${site.url}</td>
                    <td>${site.apiVersion || _settings.defaultAPIVersion}</td>
                    <td><span class="status-badge ${site.status || 'unknown'}">${site.status || 'Unknown'}</span></td>
                    <td class="actions-col">
                        <button class="glass-button small check-site-btn">
                            <i class="fas fa-sync-alt"></i> Check
                        </button>
                        <button class="glass-button small edit-site-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="glass-button small delete-site-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                // Add event listener for check button
                const checkBtn = tr.querySelector('.check-site-btn');
                if (checkBtn) {
                    checkBtn.addEventListener('click', function() {
                        checkSiteStatus(site.id);
                    });
                }
                
                // Add event listener for edit button
                const editBtn = tr.querySelector('.edit-site-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editSite(site.id);
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = tr.querySelector('.delete-site-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to delete the site "${site.name}"? This action cannot be undone.`)) {
                            deleteSite(site.id);
                        }
                    });
                }
                
                siteListBody.appendChild(tr);
            });
            
            // Show empty message if no sites
            if (_sites.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="5" class="empty-message">
                        No WordPress sites found. <a href="#" id="add-first-site">Add your first site</a>.
                    </td>
                `;
                
                const addLink = tr.querySelector('#add-first-site');
                if (addLink) {
                    addLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showSiteEditForm();
                    });
                }
                
                siteListBody.appendChild(tr);
            }
        }
    }
    
    /**
     * Initialize a default site if none exists
     */
    function _initializeDefaultSite() {
        const defaultSite = {
            id: _generateId(),
            name: 'Demo WordPress Site',
            url: 'https://demo.wpapi.dev',
            restBase: '/wp-json',
            apiVersion: 'wp/v2',
            auth: {
                type: 'none'
            },
            status: 'unknown',
            created: Date.now()
        };
        
        _sites.push(defaultSite);
        _currentSite = defaultSite.id;
        
        // Save to storage
        _saveSettings();
    }
    
    /**
     * Show the site edit form
     * @param {string} siteId - The ID of the site to edit (optional)
     */
    function showSiteEditForm(siteId) {
        const siteEditContainer = document.getElementById('wp-site-edit-container');
        if (siteEditContainer) {
            siteEditContainer.classList.remove('hidden');
            
            const siteEditTitle = document.getElementById('wp-site-edit-title');
            const siteNameInput = document.getElementById('wp-site-name');
            const siteUrlInput = document.getElementById('wp-site-url');
            const restUrlInput = document.getElementById('wp-rest-url');
            const apiVersionSelect = document.getElementById('wp-api-version');
            const verifySSLCheckbox = document.getElementById('wp-verify-ssl');
            const enableCachingCheckbox = document.getElementById('wp-enable-caching');
            const autoDiscoverCheckbox = document.getElementById('wp-auto-discover-api');
            
            if (siteId) {
                // Editing existing site
                const site = _sites.find(s => s.id === siteId);
                if (site) {
                    if (siteEditTitle) siteEditTitle.textContent = 'Edit WordPress Site';
                    if (siteNameInput) siteNameInput.value = site.name;
                    if (siteUrlInput) siteUrlInput.value = site.url;
                    if (restUrlInput) restUrlInput.value = site.restBase || '';
                    
                    if (apiVersionSelect) {
                        if (site.apiVersion === 'wp/v2' || site.apiVersion === 'wp/v1') {
                            apiVersionSelect.value = site.apiVersion;
                            document.getElementById('custom-api-version-container').classList.add('hidden');
                        } else {
                            apiVersionSelect.value = 'custom';
                            document.getElementById('custom-api-version-container').classList.remove('hidden');
                            document.getElementById('wp-custom-api-version').value = site.apiVersion;
                        }
                    }
                    
                    if (verifySSLCheckbox) verifySSLCheckbox.checked = site.verifySSL !== false;
                    if (enableCachingCheckbox) enableCachingCheckbox.checked = site.enableCaching !== false;
                    if (autoDiscoverCheckbox) autoDiscoverCheckbox.checked = site.autoDiscoverAPI || false;
                    
                    // Set authentication type
                    const authType = site.auth ? site.auth.type : 'none';
                    document.querySelector(`input[name="auth-type"][value="${authType}"]`).checked = true;
                    
                    // Update auth form
                    updateAuthForm(authType, site.auth);
                    
                    // Store the site ID for the save function
                    siteEditContainer.dataset.siteId = siteId;
                }
            } else {
                // Adding new site
                if (siteEditTitle) siteEditTitle.textContent = 'Add New WordPress Site';
                if (siteNameInput) siteNameInput.value = '';
                if (siteUrlInput) siteUrlInput.value = '';
                if (restUrlInput) restUrlInput.value = '';
                if (apiVersionSelect) apiVersionSelect.value = 'wp/v2';
                
                document.getElementById('custom-api-version-container').classList.add('hidden');
                
                if (verifySSLCheckbox) verifySSLCheckbox.checked = true;
                if (enableCachingCheckbox) enableCachingCheckbox.checked = true;
                if (autoDiscoverCheckbox) autoDiscoverCheckbox.checked = false;
                
                // Set default auth type
                document.querySelector('input[name="auth-type"][value="none"]').checked = true;
                
                // Update auth form
                updateAuthForm('none');
                
                // Clear the site ID
                delete siteEditContainer.dataset.siteId;
            }
        }
    }
    
    /**
     * Hide the site edit form
     */
    function hideSiteEditForm() {
        const siteEditContainer = document.getElementById('wp-site-edit-container');
        if (siteEditContainer) {
            siteEditContainer.classList.add('hidden');
        }
    }
    
    /**
     * Update the authentication form based on the selected type
     * @param {string} authType - The authentication type
     * @param {Object} authData - Current authentication data (optional)
     */
    function updateAuthForm(authType, authData = {}) {
        const authContainer = document.getElementById('auth-credentials-container');
        if (!authContainer) return;
        
        // Clear current fields
        authContainer.innerHTML = '';
        
        // Show container for all auth types except 'none'
        if (authType === 'none') {
            authContainer.classList.add('hidden');
            return;
        } else {
            authContainer.classList.remove('hidden');
        }
        
        // Create the appropriate form fields based on auth type
        let formHtml = '';
        
        switch (authType) {
            case 'basic':
                formHtml = `
                    <div class="form-group">
                        <label for="auth-username">Username:</label>
                        <input type="text" id="auth-username" value="${authData.username || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-password">Password:</label>
                        <input type="password" id="auth-password" value="${authData.password || ''}">
                    </div>
                `;
                break;
                
            case 'jwt':
                formHtml = `
                    <div class="form-group">
                        <label for="auth-token">JWT Token:</label>
                        <input type="text" id="auth-token" value="${authData.token || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-token-endpoint">Token Endpoint (optional):</label>
                        <input type="text" id="auth-token-endpoint" value="${authData.endpoint || ''}">
                        <span class="form-help">For automatic token generation</span>
                    </div>
                `;
                break;
                
            case 'oauth':
                formHtml = `
                    <div class="form-group">
                        <label for="auth-client-id">Client ID:</label>
                        <input type="text" id="auth-client-id" value="${authData.clientId || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-client-secret">Client Secret:</label>
                        <input type="password" id="auth-client-secret" value="${authData.clientSecret || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-redirect-uri">Redirect URI:</label>
                        <input type="text" id="auth-redirect-uri" value="${authData.redirectUri || window.location.origin}">
                    </div>
                    <div class="form-group">
                        <label for="auth-auth-endpoint">Authorization Endpoint:</label>
                        <input type="text" id="auth-auth-endpoint" value="${authData.authEndpoint || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-token-endpoint">Token Endpoint:</label>
                        <input type="text" id="auth-token-endpoint" value="${authData.tokenEndpoint || ''}">
                    </div>
                    <div class="form-group">
                        <label for="auth-scope">Scope:</label>
                        <input type="text" id="auth-scope" value="${authData.scope || 'read write'}">
                    </div>
                `;
                break;
        }
        
        authContainer.innerHTML = formHtml;
    }
    
    /**
     * Test the connection to a WordPress site
     */
    function testSiteConnection() {
        // Get form values
        const siteUrl = document.getElementById('wp-site-url').value.trim();
        const restBase = document.getElementById('wp-rest-url').value.trim() || _settings.defaultRestBase;
        const apiVersionSelect = document.getElementById('wp-api-version');
        let apiVersion;
        
        if (apiVersionSelect.value === 'custom') {
            apiVersion = document.getElementById('wp-custom-api-version').value.trim();
        } else {
            apiVersion = apiVersionSelect.value;
        }
        
        // Validate URL
        if (!siteUrl) {
            alert('Please enter a valid WordPress site URL.');
            return;
        }
        
        // Show testing message
        const saveSiteBtn = document.getElementById('save-wp-site-btn');
        const testConnectionBtn = document.getElementById('test-wp-connection-btn');
        
        if (saveSiteBtn) saveSiteBtn.disabled = true;
        if (testConnectionBtn) {
            testConnectionBtn.disabled = true;
            testConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        }
        
        // Build the API URL
        const apiUrl = buildApiUrl(siteUrl, restBase, apiVersion);
        
        // Get authentication details
        const authType = document.querySelector('input[name="auth-type"]:checked').value;
        let authHeaders = {};
        
        if (authType !== 'none') {
            authHeaders = getAuthHeaders(authType);
        }
        
        // Test the connection
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Connection successful
            alert('Connection successful! The WordPress REST API is available.');
            
            // Enable the save button
            if (saveSiteBtn) saveSiteBtn.disabled = false;
            
            // Reset the test button
            if (testConnectionBtn) {
                testConnectionBtn.disabled = false;
                testConnectionBtn.innerHTML = '<i class="fas fa-check"></i> Test Successful';
                setTimeout(() => {
                    testConnectionBtn.innerHTML = 'Test Connection';
                }, 3000);
            }
        })
        .catch(error => {
            // Connection failed
            alert(`Connection failed: ${error.message}`);
            
            // Reset the test button
            if (testConnectionBtn) {
                testConnectionBtn.disabled = false;
                testConnectionBtn.innerHTML = '<i class="fas fa-times"></i> Test Failed';
                setTimeout(() => {
                    testConnectionBtn.innerHTML = 'Test Connection';
                }, 3000);
            }
            
            // Enable the save button (allow saving even if test fails, might be temporary issue)
            if (saveSiteBtn) saveSiteBtn.disabled = false;
        });
    }
    
    /**
     * Save a WordPress site
     */
    function saveSite() {
        // Get form values
        const siteEditContainer = document.getElementById('wp-site-edit-container');
        const siteName = document.getElementById('wp-site-name').value.trim();
        const siteUrl = document.getElementById('wp-site-url').value.trim();
        const restBase = document.getElementById('wp-rest-url').value.trim() || _settings.defaultRestBase;
        const apiVersionSelect = document.getElementById('wp-api-version');
        let apiVersion;
        
        if (apiVersionSelect.value === 'custom') {
            apiVersion = document.getElementById('wp-custom-api-version').value.trim();
        } else {
            apiVersion = apiVersionSelect.value;
        }
        
        const verifySSL = document.getElementById('wp-verify-ssl').checked;
        const enableCaching = document.getElementById('wp-enable-caching').checked;
        const autoDiscoverAPI = document.getElementById('wp-auto-discover-api').checked;
        
        // Validate inputs
        if (!siteName) {
            alert('Please enter a site name.');
            return;
        }
        
        if (!siteUrl) {
            alert('Please enter a valid WordPress site URL.');
            return;
        }
        
        // Get authentication details
        const authType = document.querySelector('input[name="auth-type"]:checked').value;
        let auth = { type: authType };
        
        if (authType !== 'none') {
            auth = { ...auth, ...getAuthParams(authType) };
        }
        
        // Get the site ID (if editing)
        const siteId = siteEditContainer.dataset.siteId;
        
        // Prepare site data
        const siteData = {
            name: siteName,
            url: siteUrl,
            restBase: restBase,
            apiVersion: apiVersion,
            auth: auth,
            verifySSL: verifySSL,
            enableCaching: enableCaching,
            autoDiscoverAPI: autoDiscoverAPI,
            status: 'unknown',
            modified: Date.now()
        };
        
        if (siteId) {
            // Update existing site
            const siteIndex = _sites.findIndex(s => s.id === siteId);
            if (siteIndex !== -1) {
                // Preserve the created timestamp
                siteData.created = _sites[siteIndex].created;
                
                // Update site
                _sites[siteIndex] = {
                    ..._sites[siteIndex],
                    ...siteData,
                    id: siteId
                };
            }
        } else {
            // Create new site
            const newSite = {
                id: _generateId(),
                ...siteData,
                created: Date.now()
            };
            
            _sites.push(newSite);
            
            // Set as current site if it's the first one
            if (_sites.length === 1) {
                _currentSite = newSite.id;
            }
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
     * Edit a WordPress site
     * @param {string} siteId - The ID of the site to edit
     */
    function editSite(siteId) {
        showSiteEditForm(siteId);
    }
    
    /**
     * Delete a WordPress site
     * @param {string} siteId - The ID of the site to delete
     */
    function deleteSite(siteId) {
        // Find the site index
        const siteIndex = _sites.findIndex(s => s.id === siteId);
        if (siteIndex === -1) return;
        
        // Remove the site
        _sites.splice(siteIndex, 1);
        
        // If deleted site was the current site, switch to the first available site
        if (siteId === _currentSite) {
            _currentSite = _sites.length > 0 ? _sites[0].id : null;
        }
        
        // Save to storage
        _saveSettings();
        
        // Refresh the site list
        refreshSiteList();
        
        // Refresh the site selector
        refreshSiteSelector();
    }
    
    /**
     * Check the status of a WordPress site
     * @param {string} siteId - The ID of the site to check
     */
    function checkSiteStatus(siteId) {
        // Find the site
        const site = _sites.find(s => s.id === siteId);
        if (!site) return;
        
        // Get the table row
        const siteRow = document.querySelector(`tr[data-site-id="${siteId}"]`);
        if (!siteRow) return;
        
        // Update status badge
        const statusBadge = siteRow.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge checking';
            statusBadge.textContent = 'Checking...';
        }
        
        // Build the API URL
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, site.apiVersion || _settings.defaultAPIVersion);
        
        // Get authentication headers
        let authHeaders = {};
        if (site.auth && site.auth.type !== 'none') {
            authHeaders = getSiteAuthHeaders(site);
        }
        
        // Make the API request
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update site status
            site.status = 'online';
            site.lastChecked = Date.now();
            
            // Save to storage
            _saveSettings();
            
            // Update status badge
            if (statusBadge) {
                statusBadge.className = 'status-badge online';
                statusBadge.textContent = 'Online';
            }
            
            // If auto-discover is enabled, store API schema
            if (site.autoDiscoverAPI && data.namespaces) {
                storeApiSchema(siteId, data);
            }
        })
        .catch(error => {
            // Update site status
            site.status = 'offline';
            site.lastChecked = Date.now();
            site.lastError = error.message;
            
            // Save to storage
            _saveSettings();
            
            // Update status badge
            if (statusBadge) {
                statusBadge.className = 'status-badge offline';
                statusBadge.textContent = 'Offline';
            }
        });
    }
    
    /**
     * Store API schema for a site
     * @param {string} siteId - The site ID
     * @param {Object} data - API schema data
     */
    function storeApiSchema(siteId, data) {
        _apiSchemaCache.set(siteId, {
            timestamp: Date.now(),
            schema: data
        });
    }
    
    /**
     * Build an API URL for a WordPress site
     * @param {string} siteUrl - The site URL
     * @param {string} restBase - The REST API base path
     * @param {string} apiVersion - The API version
     * @returns {string} The complete API URL
     */
    function buildApiUrl(siteUrl, restBase, apiVersion) {
        // Ensure site URL doesn't end with a slash
        siteUrl = siteUrl.replace(/\/$/, '');
        
        // Ensure rest base starts with a slash
        if (!restBase.startsWith('/')) {
            restBase = '/' + restBase;
        }
        
        // For the root API, don't append version
        if (!apiVersion) {
            return `${siteUrl}${restBase}`;
        }
        
        // For non-empty API version, append it to the URL
        return `${siteUrl}${restBase}/${apiVersion}`;
    }
    
    /**
     * Get authentication headers based on the selected auth type
     * @param {string} authType - The authentication type
     * @returns {Object} Headers object
     */
    function getAuthHeaders(authType) {
        const headers = {};
        
        switch (authType) {
            case 'basic':
                const username = document.getElementById('auth-username').value;
                const password = document.getElementById('auth-password').value;
                
                if (username && password) {
                    const base64Credentials = btoa(`${username}:${password}`);
                    headers['Authorization'] = `Basic ${base64Credentials}`;
                }
                break;
                
            case 'jwt':
                const token = document.getElementById('auth-token').value;
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                break;
                
            case 'oauth':
                const oauthToken = document.getElementById('auth-token').value;
                
                if (oauthToken) {
                    headers['Authorization'] = `Bearer ${oauthToken}`;
                }
                break;
        }
        
        return headers;
    }
    
    /**
     * Get authentication parameters based on the selected auth type
     * @param {string} authType - The authentication type
     * @returns {Object} Auth parameters
     */
    function getAuthParams(authType) {
        const params = { type: authType };
        
        switch (authType) {
            case 'basic':
                params.username = document.getElementById('auth-username').value;
                params.password = document.getElementById('auth-password').value;
                break;
                
            case 'jwt':
                params.token = document.getElementById('auth-token').value;
                params.endpoint = document.getElementById('auth-token-endpoint').value;
                break;
                
            case 'oauth':
                params.clientId = document.getElementById('auth-client-id').value;
                params.clientSecret = document.getElementById('auth-client-secret').value;
                params.redirectUri = document.getElementById('auth-redirect-uri').value;
                params.authEndpoint = document.getElementById('auth-auth-endpoint').value;
                params.tokenEndpoint = document.getElementById('auth-token-endpoint').value;
                params.scope = document.getElementById('auth-scope').value;
                break;
        }
        
        return params;
    }
    
    /**
     * Get authentication headers for a specific site
     * @param {Object} site - The site object
     * @returns {Object} Headers object
     */
    function getSiteAuthHeaders(site) {
        if (!site.auth || site.auth.type === 'none') {
            return {};
        }
        
        const headers = {};
        
        switch (site.auth.type) {
            case 'basic':
                if (site.auth.username && site.auth.password) {
                    const base64Credentials = btoa(`${site.auth.username}:${site.auth.password}`);
                    headers['Authorization'] = `Basic ${base64Credentials}`;
                }
                break;
                
            case 'jwt':
                if (site.auth.token) {
                    headers['Authorization'] = `Bearer ${site.auth.token}`;
                }
                break;
                
            case 'oauth':
                if (site.auth.accessToken) {
                    headers['Authorization'] = `Bearer ${site.auth.accessToken}`;
                }
                break;
        }
        
        return headers;
    }
    
    /**
     * Switch to a different WordPress site
     * @param {string} siteId - The ID of the site to switch to
     */
    function switchSite(siteId) {
        if (siteId === _currentSite) return;
        
        _currentSite = siteId;
        
        // Save the current site to storage
        _saveSettings();
        
        // Refresh the UI based on current tab
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            activeTab.click();
        } else {
            showSitesPanel();
        }
    }
    
    
// Continue from loadPlugins function
    function loadPlugins() {
        // Get the current site
        const site = _sites.find(s => s.id === _currentSite);
        if (!site) return;
        
        // Show loading state
        const pluginListBody = document.getElementById('plugin-list-body');
        if (pluginListBody) {
            pluginListBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Loading plugins...
                    </td>
                </tr>
            `;
        }
        
        // Build the API URL for plugins
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, site.apiVersion || _settings.defaultAPIVersion) + '/plugins';
        
        // Get authentication headers
        const authHeaders = getSiteAuthHeaders(site);
        
        // Make the API request
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                // If plugins endpoint isn't available, check if we can get basic site info
                return checkForBasicSiteInfo(site)
                    .then(hasAccess => {
                        if (hasAccess) {
                            // Site is online but plugins API is not available
                            throw new Error('Plugins API is not available. You may need administrator access.');
                        } else {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    });
            }
            return response.json();
        })
        .then(data => {
            // Store the plugins in the registry
            _pluginRegistry[_currentSite] = data;
            
            // Display the plugins
            displayPlugins(data);
            
            // Update site status
            site.status = 'online';
            site.lastChecked = Date.now();
            
            // Save to storage
            _saveSettings();
            
            // Get plugin API endpoints
            discoverPluginAPIEndpoints(site);
        })
        .catch(error => {
            // Display error message
            if (pluginListBody) {
                pluginListBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="error-message">
                            <i class="fas fa-exclamation-circle"></i> ${error.message}
                        </td>
                    </tr>
                `;
            }
            
            // Update site status if it's an API error
            if (error.message.includes('API request failed')) {
                site.status = 'offline';
                site.lastChecked = Date.now();
                site.lastError = error.message;
                
                // Save to storage
                _saveSettings();
            }
        });
    }
    
    /**
     * Check if basic site info is accessible
     * @param {Object} site - The site object
     * @returns {Promise<boolean>} Whether the site is accessible
     */
    function checkForBasicSiteInfo(site) {
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, '');
        const authHeaders = getSiteAuthHeaders(site);
        
        return fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => response.ok)
        .catch(() => false);
    }
    
    /**
     * Display plugins in the UI
     * @param {Array} plugins - The plugins data
     */
    function displayPlugins(plugins) {
        const pluginListBody = document.getElementById('plugin-list-body');
        if (!pluginListBody) return;
        
        // Clear current items
        pluginListBody.innerHTML = '';
        
        // Check if plugins is an array
        if (!Array.isArray(plugins)) {
            // Handle object format (WP REST API may return object with plugin slugs as keys)
            if (typeof plugins === 'object') {
                plugins = Object.values(plugins);
            } else {
                pluginListBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="error-message">
                            <i class="fas fa-exclamation-circle"></i> Invalid plugins data format
                        </td>
                    </tr>
                `;
                return;
            }
        }
        
        // Apply filters
        plugins = filterPluginsList(plugins);
        
        // Display plugins
        if (plugins.length === 0) {
            pluginListBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">
                        No plugins match your filters.
                    </td>
                </tr>
            `;
            return;
        }
        
        plugins.forEach(plugin => {
            const tr = document.createElement('tr');
            
            // Determine if plugin has an API
            const hasApi = plugin.apiEndpoints && plugin.apiEndpoints.length > 0;
            
            tr.innerHTML = `
                <td class="plugin-name-cell">
                    <div class="plugin-name">
                        <strong>${plugin.name || plugin.plugin}</strong>
                    </div>
                    <div class="plugin-author">
                        By: ${plugin.author || 'Unknown'}
                    </div>
                </td>
                <td>${plugin.version || 'Unknown'}</td>
                <td><span class="status-badge ${plugin.status === 'active' ? 'active' : 'inactive'}">${plugin.status || 'inactive'}</span></td>
                <td>${hasApi ? `<span class="api-badge">${plugin.apiEndpoints?.length || 0} endpoints</span>` : '-'}</td>
                <td class="actions-col">
                    <button class="glass-button small plugin-details-btn">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    ${hasApi ? `
                    <button class="glass-button small plugin-api-btn">
                        <i class="fas fa-code"></i> API
                    </button>
                    ` : ''}
                </td>
            `;
            
            // Add event listener for details button
            const detailsBtn = tr.querySelector('.plugin-details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', function() {
                    showPluginDetails(plugin);
                });
            }
            
            // Add event listener for API button
            const apiBtn = tr.querySelector('.plugin-api-btn');
            if (apiBtn) {
                apiBtn.addEventListener('click', function() {
                    showPluginAPI(plugin);
                });
            }
            
            pluginListBody.appendChild(tr);
        });
    }
    
    /**
     * Filter the plugins list based on UI filters
     * @param {Array} plugins - The plugins data
     * @returns {Array} Filtered plugins
     */
    function filterPluginsList(plugins) {
        // Get filter values
        const statusFilter = document.getElementById('plugin-status-filter').value;
        const apiFilter = document.getElementById('plugin-api-filter').value;
        const sortFilter = document.getElementById('plugin-sort-filter').value;
        const searchTerm = document.getElementById('plugin-search').value.trim().toLowerCase();
        
        // Apply status filter
        if (statusFilter !== 'all') {
            plugins = plugins.filter(plugin => plugin.status === statusFilter);
        }
        
        // Apply API filter
        if (apiFilter !== 'all') {
            if (apiFilter === 'has-api') {
                plugins = plugins.filter(plugin => plugin.apiEndpoints && plugin.apiEndpoints.length > 0);
            } else {
                plugins = plugins.filter(plugin => !plugin.apiEndpoints || plugin.apiEndpoints.length === 0);
            }
        }
        
        // Apply search filter
        if (searchTerm) {
            plugins = plugins.filter(plugin => {
                const name = plugin.name || plugin.plugin || '';
                const author = plugin.author || '';
                const description = plugin.description || '';
                
                return name.toLowerCase().includes(searchTerm) || 
                       author.toLowerCase().includes(searchTerm) || 
                       description.toLowerCase().includes(searchTerm);
            });
        }
        
        // Apply sort
        switch (sortFilter) {
            case 'name-asc':
                plugins.sort((a, b) => {
                    const nameA = a.name || a.plugin || '';
                    const nameB = b.name || b.plugin || '';
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name-desc':
                plugins.sort((a, b) => {
                    const nameA = a.name || a.plugin || '';
                    const nameB = b.name || b.plugin || '';
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'latest':
                // Sort by version, assuming semantic versioning
                plugins.sort((a, b) => {
                    const versionA = a.version || '0.0.0';
                    const versionB = b.version || '0.0.0';
                    return compareVersions(versionB, versionA);
                });
                break;
        }
        
        return plugins;
    }
    
    /**
     * Compare two semantic version strings
     * @param {string} versionA - First version
     * @param {string} versionB - Second version
     * @returns {number} Comparison result: -1, 0, or 1
     */
    function compareVersions(versionA, versionB) {
        const partsA = versionA.split('.').map(Number);
        const partsB = versionB.split('.').map(Number);
        
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const partA = i < partsA.length ? partsA[i] : 0;
            const partB = i < partsB.length ? partsB[i] : 0;
            
            if (partA > partB) return 1;
            if (partA < partB) return -1;
        }
        
        return 0;
    }
    
    /**
     * Discover API endpoints exposed by plugins
     * @param {Object} site - The site object
     */
    function discoverPluginAPIEndpoints(site) {
        // Build the API URL for the root endpoint
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, '');
        
        // Get authentication headers
        const authHeaders = getSiteAuthHeaders(site);
        
        // Make the API request to get all available routes
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.routes) {
                throw new Error('No routes information available in API response');
            }
            
            // Store the API schema
            storeApiSchema(site.id, data);
            
            // Extract plugin routes based on namespaces
            const pluginRoutes = extractPluginRoutes(data);
            
            // Add API endpoints to plugins
            const plugins = _pluginRegistry[_currentSite];
            if (Array.isArray(plugins)) {
                plugins.forEach(plugin => {
                    // Get the plugin slug - it might be in different properties depending on API version
                    const pluginSlug = plugin.textdomain || plugin.slug || plugin.plugin;
                    if (!pluginSlug) return;
                    
                    // Find matching routes
                    plugin.apiEndpoints = findPluginEndpoints(pluginSlug, pluginRoutes);
                });
                
                // Update the UI with API information
                displayPlugins(plugins);
            }
        })
        .catch(error => {
            console.error('Failed to discover plugin API endpoints:', error);
        });
    }
    
    /**
     * Extract plugin-specific routes from the API schema
     * @param {Object} schema - The API schema data
     * @returns {Object} Plugin routes by namespace
     */
    function extractPluginRoutes(schema) {
        const pluginRoutes = {};
        const coreNamespaces = ['wp/v1', 'wp/v2'];
        
        // Extract namespaces
        const namespaces = schema.namespaces || [];
        
        // Process each namespace that isn't a core namespace
        namespaces.forEach(namespace => {
            if (!coreNamespaces.includes(namespace)) {
                pluginRoutes[namespace] = [];
                
                // Find routes for this namespace
                Object.keys(schema.routes).forEach(route => {
                    if (route.includes(`/${namespace}/`)) {
                        pluginRoutes[namespace].push({
                            route,
                            endpoint: route.replace(`/${namespace}`, ''),
                            methods: schema.routes[route].methods || [],
                            args: schema.routes[route].args || {}
                        });
                    }
                });
            }
        });
        
        return pluginRoutes;
    }
    
    /**
     * Find API endpoints for a specific plugin
     * @param {string} pluginSlug - The plugin slug
     * @param {Object} pluginRoutes - The plugin routes by namespace
     * @returns {Array} Plugin API endpoints
     */
    function findPluginEndpoints(pluginSlug, pluginRoutes) {
        const endpoints = [];
        const slugVariations = [
            pluginSlug,
            pluginSlug.replace('-', '_'),
            pluginSlug.replace('_', '-')
        ];
        
        // Check for exact namespace match
        if (pluginRoutes[pluginSlug]) {
            return pluginRoutes[pluginSlug];
        }
        
        // Check for namespace variations
        for (const namespace in pluginRoutes) {
            // Check if namespace contains plugin slug
            if (slugVariations.some(slug => namespace.includes(slug))) {
                endpoints.push(...pluginRoutes[namespace]);
                continue;
            }
            
            // Check each route for plugin slug
            pluginRoutes[namespace].forEach(endpoint => {
                if (slugVariations.some(slug => endpoint.route.includes(slug))) {
                    endpoints.push(endpoint);
                }
            });
        }
        
        return endpoints;
    }
    
    /**
     * Show plugin details
     * @param {Object} plugin - The plugin data
     */
    function showPluginDetails(plugin) {
        const detailContainer = document.getElementById('plugin-detail-container');
        const detailContent = document.getElementById('plugin-detail-content');
        
        if (!detailContainer || !detailContent) return;
        
        // Set the detail title
        const detailTitle = document.getElementById('plugin-detail-title');
        if (detailTitle) {
            detailTitle.textContent = `Plugin: ${plugin.name || plugin.plugin}`;
        }
        
        // Fill the detail content
        detailContent.innerHTML = `
            <div class="plugin-detail-grid">
                <div class="detail-label">Plugin:</div>
                <div class="detail-value">${plugin.name || plugin.plugin}</div>
                
                <div class="detail-label">Version:</div>
                <div class="detail-value">${plugin.version || 'Unknown'}</div>
                
                <div class="detail-label">Author:</div>
                <div class="detail-value">${plugin.author || 'Unknown'}</div>
                
                <div class="detail-label">Description:</div>
                <div class="detail-value">${plugin.description || 'No description available.'}</div>
                
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="status-badge ${plugin.status === 'active' ? 'active' : 'inactive'}">
                        ${plugin.status || 'inactive'}
                    </span>
                </div>
                
                ${plugin.plugin_uri ? `
                <div class="detail-label">Website:</div>
                <div class="detail-value"><a href="${plugin.plugin_uri}" target="_blank">${plugin.plugin_uri}</a></div>
                ` : ''}
                
                ${plugin.apiEndpoints && plugin.apiEndpoints.length > 0 ? `
                <div class="detail-label">API Endpoints:</div>
                <div class="detail-value">${plugin.apiEndpoints.length} endpoints available</div>
                ` : ''}
            </div>
            
            ${plugin.apiEndpoints && plugin.apiEndpoints.length > 0 ? `
            <div class="plugin-api-actions">
                <button id="view-api-endpoints-btn" class="glass-button">
                    <i class="fas fa-code"></i> View API Endpoints
                </button>
                <button id="create-api-flow-btn" class="glass-button">
                    <i class="fas fa-project-diagram"></i> Create Flow
                </button>
            </div>
            ` : ''}
        `;
        
        // Add event listeners
        const viewApiBtn = document.getElementById('view-api-endpoints-btn');
        if (viewApiBtn) {
            viewApiBtn.addEventListener('click', function() {
                showPluginAPI(plugin);
            });
        }
        
        const createFlowBtn = document.getElementById('create-api-flow-btn');
        if (createFlowBtn) {
            createFlowBtn.addEventListener('click', function() {
                createPluginAPIFlow(plugin);
            });
        }
        
        // Show the detail container
        detailContainer.classList.remove('hidden');
    }
    
    /**
     * Show plugin API endpoints
     * @param {Object} plugin - The plugin data
     */
    function showPluginAPI(plugin) {
        const detailContainer = document.getElementById('plugin-detail-container');
        const detailContent = document.getElementById('plugin-detail-content');
        
        if (!detailContainer || !detailContent) return;
        
        // Set the detail title
        const detailTitle = document.getElementById('plugin-detail-title');
        if (detailTitle) {
            detailTitle.textContent = `API: ${plugin.name || plugin.plugin}`;
        }
        
        // Check if plugin has API endpoints
        if (!plugin.apiEndpoints || plugin.apiEndpoints.length === 0) {
            detailContent.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No API endpoints found for this plugin.</p>
                </div>
            `;
        } else {
            // Group endpoints by namespace
            const endpointsByNamespace = {};
            plugin.apiEndpoints.forEach(endpoint => {
                const namespace = endpoint.route.split('/')[1];
                if (!endpointsByNamespace[namespace]) {
                    endpointsByNamespace[namespace] = [];
                }
                endpointsByNamespace[namespace].push(endpoint);
            });
            
            // Build HTML for endpoints
            let endpointsHtml = '';
            
            for (const namespace in endpointsByNamespace) {
                endpointsHtml += `
                    <div class="api-namespace">
                        <h4 class="namespace-title">${namespace}</h4>
                        <div class="endpoint-list">
                `;
                
                endpointsByNamespace[namespace].forEach(endpoint => {
                    const methods = endpoint.methods.join(', ');
                    
                    endpointsHtml += `
                        <div class="endpoint-item glass-panel">
                            <div class="endpoint-header">
                                <div class="endpoint-route">
                                    <span class="endpoint-methods">${methods}</span>
                                    <span class="endpoint-path">${endpoint.route}</span>
                                </div>
                                <div class="endpoint-actions">
                                    <button class="glass-button small endpoint-test-btn" data-route="${endpoint.route}" data-methods="${methods}">
                                        <i class="fas fa-play"></i> Test
                                    </button>
                                    <button class="glass-button small endpoint-add-flow-btn" data-route="${endpoint.route}" data-methods="${methods}">
                                        <i class="fas fa-plus"></i> Add to Flow
                                    </button>
                                </div>
                            </div>
                            ${endpoint.args && Object.keys(endpoint.args).length > 0 ? `
                            <div class="endpoint-params">
                                <h5>Parameters:</h5>
                                <table class="params-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(endpoint.args).map(([name, arg]) => `
                                        <tr>
                                            <td>${name}</td>
                                            <td>${arg.type || 'string'}</td>
                                            <td>${arg.required ? 'Yes' : 'No'}</td>
                                            <td>${arg.description || '-'}</td>
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ` : ''}
                        </div>
                    `;
                });
                
                endpointsHtml += `
                        </div>
                    </div>
                `;
            }
            
            // Fill the detail content
            detailContent.innerHTML = `
                <div class="plugin-api-header">
                    <h3>API Endpoints: ${plugin.name || plugin.plugin}</h3>
                    <div class="plugin-api-actions">
                        <button id="back-to-plugin-btn" class="glass-button small">
                            <i class="fas fa-arrow-left"></i> Back to Plugin
                        </button>
                        <button id="create-api-flow-btn" class="glass-button">
                            <i class="fas fa-project-diagram"></i> Create Flow
                        </button>
                    </div>
                </div>
                <div class="plugin-api-content">
                    ${endpointsHtml}
                </div>
            `;
            
            // Add event listeners
            const backBtn = document.getElementById('back-to-plugin-btn');
            if (backBtn) {
                backBtn.addEventListener('click', function() {
                    showPluginDetails(plugin);
                });
            }
            
            const createFlowBtn = document.getElementById('create-api-flow-btn');
            if (createFlowBtn) {
                createFlowBtn.addEventListener('click', function() {
                    createPluginAPIFlow(plugin);
                });
            }
            
            // Add event listeners for test buttons
            const testBtns = detailContent.querySelectorAll('.endpoint-test-btn');
            testBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const route = this.dataset.route;
                    const methods = this.dataset.methods.split(', ');
                    testApiEndpoint(route, methods[0]);
                });
            });
            
            // Add event listeners for add to flow buttons
            const addFlowBtns = detailContent.querySelectorAll('.endpoint-add-flow-btn');
            addFlowBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const route = this.dataset.route;
                    const methods = this.dataset.methods.split(', ');
                    addApiEndpointToFlow(route, methods[0], plugin);
                });
            });
        }
        
        // Show the detail container
        detailContainer.classList.remove('hidden');
    }
    
    /**
     * Hide plugin detail panel
     */
    function hidePluginDetail() {
        const detailContainer = document.getElementById('plugin-detail-container');
        if (detailContainer) {
            detailContainer.classList.add('hidden');
        }
    }
    
    /**
     * Test an API endpoint
     * @param {string} route - The API route
     * @param {string} method - The HTTP method
     */
    function testApiEndpoint(route, method) {
        // Get the current site
        const site = _sites.find(s => s.id === _currentSite);
        if (!site) return;
        
        // Build the API URL
        const baseUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, '');
        const apiUrl = baseUrl + route;
        
        // Get authentication headers
        const authHeaders = getSiteAuthHeaders(site);
        
        // Create a simple modal for the test
        const modal = document.createElement('div');
        modal.className = 'wp-test-modal';
        modal.innerHTML = `
            <div class="test-modal-content glass-panel">
                <div class="test-modal-header">
                    <h3>Test API Endpoint</h3>
                    <button class="close-modal-btn glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="test-modal-body">
                    <div class="endpoint-info">
                        <div class="method-badge ${method.toLowerCase()}">${method}</div>
                        <div class="endpoint-url">${apiUrl}</div>
                    </div>
                    
                    <div class="test-form">
                        <div class="form-group">
                            <label>Parameters:</label>
                            <div id="parameter-fields">
                                <!-- Parameter fields will be added here -->
                            </div>
                            <button id="add-param-btn" class="glass-button small">
                                <i class="fas fa-plus"></i> Add Parameter
                            </button>
                        </div>
                        
                        <div class="form-actions">
                            <button id="run-test-btn" class="glass-button primary">
                                <i class="fas fa-play"></i> Run Test
                            </button>
                        </div>
                    </div>
                    
                    <div id="test-results" class="test-results hidden">
                        <h4>Response:</h4>
                        <div class="response-status">
                            <span class="status-code"></span>
                            <span class="status-text"></span>
                        </div>
                        <div class="response-headers"></div>
                        <div class="response-body">
                            <pre><code></code></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Add event listener for close button
        const closeBtn = modal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Add event listener for add parameter button
        const addParamBtn = modal.querySelector('#add-param-btn');
        const parameterFields = modal.querySelector('#parameter-fields');
        
        if (addParamBtn && parameterFields) {
            addParamBtn.addEventListener('click', function() {
                const paramRow = document.createElement('div');
                paramRow.className = 'param-row';
                paramRow.innerHTML = `
                    <input type="text" class="param-name" placeholder="Parameter name">
                    <input type="text" class="param-value" placeholder="Value">
                    <button class="remove-param-btn glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Add event listener for remove button
                const removeBtn = paramRow.querySelector('.remove-param-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        parameterFields.removeChild(paramRow);
                    });
                }
                
                parameterFields.appendChild(paramRow);
            });
        }
        
        // Add event listener for run test button
        const runTestBtn = modal.querySelector('#run-test-btn');
        if (runTestBtn) {
            runTestBtn.addEventListener('click', function() {
                // Get parameters
                const params = {};
                const paramRows = parameterFields.querySelectorAll('.param-row');
                
                paramRows.forEach(row => {
                    const nameInput = row.querySelector('.param-name');
                    const valueInput = row.querySelector('.param-value');
                    
                    if (nameInput && valueInput && nameInput.value.trim()) {
                        params[nameInput.value.trim()] = valueInput.value;
                    }
                });
                
                // Update button state
                runTestBtn.disabled = true;
                runTestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
                
                // Prepare API URL with parameters for GET requests
                let finalUrl = apiUrl;
                
                if (method === 'GET' && Object.keys(params).length > 0) {
                    const queryParams = new URLSearchParams();
                    for (const [key, value] of Object.entries(params)) {
                        queryParams.append(key, value);
                    }
                    finalUrl += '?' + queryParams.toString();
                }
                
                // Prepare request options
                const requestOptions = {
                    method: method,
                    headers: {
                        'Accept': 'application/json',
                        ...authHeaders
                    }
                };
                
                // Add body for non-GET requests
                if (method !== 'GET' && Object.keys(params).length > 0) {
                    requestOptions.headers['Content-Type'] = 'application/json';
                    requestOptions.body = JSON.stringify(params);
                }
                
                // Make the API request
                fetch(finalUrl, requestOptions)
                    .then(response => {
                        // Read response headers
                        const headers = {};
                        response.headers.forEach((value, name) => {
                            headers[name] = value;
                        });
                        
                        // Convert response to json but preserve status and headers
                        return response.text().then(text => {
                            let json;
                            try {
                                json = JSON.parse(text);
                            } catch (e) {
                                json = text;
                            }
                            
                            return {
                                status: response.status,
                                statusText: response.statusText,
                                headers: headers,
                                body: json
                            };
                        });
                    })
                    .then(responseData => {
                        // Display results
                        const resultsSection = modal.querySelector('#test-results');
                        const statusCode = modal.querySelector('.status-code');
                        const statusText = modal.querySelector('.status-text');
                        const responseHeaders = modal.querySelector('.response-headers');
                        const responseBody = modal.querySelector('code');
                        
                        if (resultsSection && statusCode && statusText && responseHeaders && responseBody) {
                            // Set status code and text
                            statusCode.textContent = responseData.status;
                            statusText.textContent = responseData.statusText;
                            
                            // Set response status color
                            if (responseData.status >= 200 && responseData.status < 300) {
                                statusCode.className = 'status-code success';
                            } else if (responseData.status >= 400) {
                                statusCode.className = 'status-code error';
                            } else {
                                statusCode.className = 'status-code warning';
                            }
                            
                            // Set headers
                            responseHeaders.innerHTML = '<h5>Headers:</h5>';
                            const headersList = document.createElement('ul');
                            for (const [name, value] of Object.entries(responseData.headers)) {
                                const headerItem = document.createElement('li');
                                headerItem.innerHTML = `<strong>${name}:</strong> ${value}`;
                                headersList.appendChild(headerItem);
                            }
                            responseHeaders.appendChild(headersList);
                            
                            // Set body
                            responseBody.textContent = typeof responseData.body === 'object' 
                                ? JSON.stringify(responseData.body, null, 2) 
                                : responseData.body;
                            
                            // Show results section
                            resultsSection.classList.remove('hidden');
                        }
                    })
                    .catch(error => {
                        // Display error
                        const resultsSection = modal.querySelector('#test-results');
                        const statusCode = modal.querySelector('.status-code');
                        const statusText = modal.querySelector('.status-text');
                        const responseBody = modal.querySelector('code');
                        
                        if (resultsSection && statusCode && statusText && responseBody) {
                            statusCode.textContent = 'Error';
                            statusCode.className = 'status-code error';
                            statusText.textContent = 'Request Failed';
                            responseBody.textContent = error.message;
                            
                            // Show results section
                            resultsSection.classList.remove('hidden');
                        }
                    })
                    .finally(() => {
                        // Reset button state
                        runTestBtn.disabled = false;
                        runTestBtn.innerHTML = '<i class="fas fa-play"></i> Run Test';
                    });
            });
        }
    }
    
    /**
     * Add an API endpoint to a flow
     * @param {string} route - The API route
     * @param {string} method - The HTTP method
     * @param {Object} plugin - The plugin data
     */
    function addApiEndpointToFlow(route, method, plugin) {
        // Check if flow editor is already open
        const flowEditorPanel = document.getElementById('wp-flow-editor-panel');
        if (!flowEditorPanel || flowEditorPanel.classList.contains('hidden')) {
            // Show the flows panel
            const flowsTab = document.getElementById('wp-flows-tab');
            if (flowsTab) {
                flowsTab.click();
            }
        }
        
        // Create a new node for this endpoint
        const nodeData = {
            type: 'wp-api-endpoint',
            plugin: plugin.name || plugin.plugin,
            route: route,
            method: method
        };
        
        // Add the node to the flow
        addNodeToFlow(nodeData);
    }
    
    /**
     * Create a flow from a plugin's API
     * @param {Object} plugin - The plugin data
     */
    function createPluginAPIFlow(plugin) {
        // Show the flows panel
        const flowsTab = document.getElementById('wp-flows-tab');
        if (flowsTab) {
            flowsTab.click();
        }
        
        // Create a new flow
        createNewFlow(`${plugin.name || plugin.plugin} API Flow`);
        
        // Hide plugin detail panel
        hidePluginDetail();
    }
    
    /**
     * Load content for a specific content type
     * @param {string} contentType - The content type to load
     */
    function loadContentType(contentType) {
        // Get the current site
        const site = _sites.find(s => s.id === _currentSite);
        if (!site) return;
        
        // Update table headers based on content type
        updateContentTableHeaders(contentType);
        
        // Show loading state
        const contentListBody = document.getElementById('content-list-body');
        if (contentListBody) {
            contentListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Loading ${contentType}...
                    </td>
                </tr>
            `;
        }
        
        // Build the API URL
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, site.apiVersion || _settings.defaultAPIVersion) + `/${contentType}`;
        
        // Get authentication headers
        const authHeaders = getSiteAuthHeaders(site);
        
        // Make the API request
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                // Check if basic site info is available
                return checkForBasicSiteInfo(site)
                    .then(hasAccess => {
                        if (hasAccess) {
                            throw new Error(`${contentType} endpoint is not available. You may need additional permissions.`);
                        } else {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    });
            }
            return response.json();
        })
        .then(data => {
            // Display the content items
            displayContentItems(data, contentType);
            
            // Update site status
            site.status = 'online';
            site.lastChecked = Date.now();
            
            // Save to storage
            _saveSettings();
        })
        .catch(error => {
            // Display error message
            if (contentListBody) {
                contentListBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="error-message">
                            <i class="fas fa-exclamation-circle"></i> ${error.message}
                        </td>
                    </tr>
                `;
            }
            
            // Update site status if it's an API error
            if (error.message.includes('API request failed')) {
                site.status = 'offline';
                site.lastChecked = Date.now();
                site.lastError = error.message;
                
                // Save to storage
                _saveSettings();
            }
        });
    }
    
    /**
     * Update the content table headers based on content type
     * @param {string} contentType - The content type
     */
    function updateContentTableHeaders(contentType) {
        const tableHead = document.getElementById('content-table-head');
        if (!tableHead) return;
        
        let headers;
        
        switch (contentType) {
            case 'posts':
                headers = `
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Categories</th>
                        <th>Tags</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                `;
                break;
                
            case 'pages':
                headers = `
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Template</th>
                        <th>Parent</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                `;
                break;
                
            case 'media':
                headers = `
                    <tr>
                        <th>File</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                `;
                break;
                
            default:
                // Generic headers for custom post types
                headers = `
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>ID</th>
                        <th>Actions</th>
                    </tr>
                `;
        }
        
        tableHead.innerHTML = headers;
    }
    
    /**
     * Display content items in the UI
     * @param {Array} items - The content items
     * @param {string} contentType - The content type
     */
    function displayContentItems(items, contentType) {
        const contentListBody = document.getElementById('content-list-body');
        if (!contentListBody) return;
        
        // Clear current items
        contentListBody.innerHTML = '';
        
        // Ensure items is an array
        if (!Array.isArray(items)) {
            contentListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        <i class="fas fa-exclamation-circle"></i> Invalid data format
                    </td>
                </tr>
            `;
            return;
        }
        
        // Apply filters
        // TODO: Implement filtering
        
        // Display content items
        if (items.length === 0) {
            contentListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        No ${contentType} found.
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate rows based on content type
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.itemId = item.id;
            
            switch (contentType) {
                case 'posts':
                    tr.innerHTML = generatePostRow(item);
                    break;
                    
                case 'pages':
                    tr.innerHTML = generatePageRow(item);
                    break;
                    
                case 'media':
                    tr.innerHTML = generateMediaRow(item);
                    break;
                    
                default:
                    tr.innerHTML = generateGenericRow(item);
            }
            
            // Add event listener for view button
            const viewBtn = tr.querySelector('.view-content-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    viewContentItem(item, contentType);
                });
            }
            
            // Add event listener for import button
            const importBtn = tr.querySelector('.import-content-btn');
            if (importBtn) {
                importBtn.addEventListener('click', function() {
                    importContentItem(item, contentType);
                });
            }
            
            contentListBody.appendChild(tr);
        });
    }
    
    /**
     * Generate a table row for a post
     * @param {Object} post - The post data
     * @returns {string} HTML content
     */
    function generatePostRow(post) {
        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString();
        
        // Extract categories and tags
        const categories = post._embedded && post._embedded['wp:term'] 
            ? getCategoriesFromEmbedded(post._embedded['wp:term']) 
            : [];
            
        const tags = post._embedded && post._embedded['wp:term'] 
            ? getTagsFromEmbedded(post._embedded['wp:term']) 
            : [];
        
        // Format author
        const author = post._embedded && post._embedded.author 
            ? post._embedded.author[0].name 
            : post.author || 'Unknown';
        
        return `
            <td class="title-cell">
                <div class="content-title">
                    ${post.title.rendered || 'Untitled'}
                </div>
                <div class="content-status">
                    <span class="status-badge ${post.status}">${post.status}</span>
                </div>
            </td>
            <td>${author}</td>
            <td>${categories.join(', ') || '-'}</td>
            <td>${tags.join(', ') || '-'}</td>
            <td>${formattedDate}</td>
            <td class="actions-col">
                <button class="glass-button small view-content-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="glass-button small import-content-btn">
                    <i class="fas fa-file-import"></i> Import
                </button>
            </td>
        `;
    }
    
    /**
     * Generate a table row for a page
     * @param {Object} page - The page data
     * @returns {string} HTML content
     */
    function generatePageRow(page) {
        const date = new Date(page.date);
        const formattedDate = date.toLocaleDateString();
        
        // Format author
        const author = page._embedded && page._embedded.author 
            ? page._embedded.author[0].name 
            : page.author || 'Unknown';
        
        // Format parent
        const parent = page.parent ? `ID: ${page.parent}` : '-';
        
        return `
            <td class="title-cell">
                <div class="content-title">
                    ${page.title.rendered || 'Untitled'}
                </div>
                <div class="content-status">
                    <span class="status-badge ${page.status}">${page.status}</span>
                </div>
            </td>
            <td>${author}</td>
            <td>${page.template || 'Default'}</td>
            <td>${parent}</td>
            <td>${formattedDate}</td>
            <td class="actions-col">
                <button class="glass-button small view-content-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="glass-button small import-content-btn">
                    <i class="fas fa-file-import"></i> Import
                </button>
            </td>
        `;
    }
    
    /**
     * Generate a table row for a media item
     * @param {Object} media - The media data
     * @returns {string} HTML content
     */
    function generateMediaRow(media) {
        const date = new Date(media.date);
        const formattedDate = date.toLocaleDateString();
        
        // Get file info
        const fileName = media.source_url ? media.source_url.split('/').pop() : 'Unknown';
        const fileType = media.mime_type || 'Unknown';
        const fileSize = formatFileSize(media.media_details?.filesize || 0);
        
        // Get thumbnail if it's an image
        const isImage = fileType.startsWith('image/');
        const thumbnail = isImage && media.media_details?.sizes?.thumbnail?.source_url
            ? media.media_details.sizes.thumbnail.source_url
            : null;
        
        return `
            <td class="media-cell">
                ${thumbnail ? `<img src="${thumbnail}" alt="${fileName}" class="media-thumbnail">` : ''}
                <span class="media-filename">${fileName}</span>
            </td>
            <td>${media.title.rendered || 'Untitled'}</td>
            <td>${fileType}</td>
            <td>${fileSize}</td>
            <td>${formattedDate}</td>
            <td class="actions-col">
                <button class="glass-button small view-content-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="glass-button small import-content-btn">
                    <i class="fas fa-file-import"></i> Import
                </button>
            </td>
        `;
    }
    
    /**
     * Generate a generic table row for a content item
     * @param {Object} item - The content item data
     * @returns {string} HTML content
     */
    function generateGenericRow(item) {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString();
        
        return `
            <td class="title-cell">
                <div class="content-title">
                    ${item.title?.rendered || item.name || 'Untitled'}
                </div>
            </td>
            <td>${item.author || '-'}</td>
            <td><span class="status-badge ${item.status}">${item.status || 'Unknown'}</span></td>
            <td>${formattedDate}</td>
            <td>${item.id}</td>
            <td class="actions-col">
                <button class="glass-button small view-content-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="glass-button small import-content-btn">
                    <i class="fas fa-file-import"></i> Import
                </button>
            </td>
        `;
    }
    
    /**
     * Extract categories from embedded terms data
     * @param {Array} terms - Embedded terms data
     * @returns {Array} Category names
     */
    function getCategoriesFromEmbedded(terms) {
        if (!Array.isArray(terms) || terms.length === 0) return [];
        
        // Find the category taxonomy in terms
        const categoryTerms = terms.find(termGroup => 
            termGroup.length > 0 && termGroup[0].taxonomy === 'category'
        ) || [];
        
        return categoryTerms.map(term => term.name);
    }
    
    /**
     * Extract tags from embedded terms data
     * @param {Array} terms - Embedded terms data
     * @returns {Array} Tag names
     */
    function getTagsFromEmbedded(terms) {
        if (!Array.isArray(terms) || terms.length === 0) return [];
        
        // Find the tag taxonomy in terms
        const tagTerms = terms.find(termGroup => 
            termGroup.length > 0 && termGroup[0].taxonomy === 'post_tag'
        ) || [];
        
        return tagTerms.map(term => term.name);
    }
    
    /**
     * Format file size in human-readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * View a content item
     * @param {Object} item - The content item
     * @param {string} contentType - The content type
     */
    function viewContentItem(item, contentType) {
        const detailContainer = document.getElementById('content-detail-container');
        const detailBody = document.getElementById('content-detail-body');
        
        if (!detailContainer || !detailBody) return;
        
        // Set the detail title
        const detailTitle = document.getElementById('content-detail-title');
        if (detailTitle) {
            detailTitle.textContent = `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${item.title?.rendered || item.name || 'Untitled'}`;
        }
        
        // Generate content based on content type
        let contentHtml = '';
        
        switch (contentType) {
            case 'posts':
                contentHtml = generatePostDetail(item);
                break;
                
            case 'pages':
                contentHtml = generatePageDetail(item);
                break;
                
            case 'media':
                contentHtml = generateMediaDetail(item);
                break;
                
            default:
                contentHtml = generateGenericDetail(item);
        }
        
        // Set the detail content
        detailBody.innerHTML = contentHtml;
        
        // Show the detail container
        detailContainer.classList.remove('hidden');
    }
    
    /**
     * Generate detail view for a post
     * @param {Object} post - The post data
     * @returns {string} HTML content
     */
    function generatePostDetail(post) {
        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString();
        
        // Extract categories and tags
        const categories = post._embedded && post._embedded['wp:term'] 
            ? getCategoriesFromEmbedded(post._embedded['wp:term']) 
            : [];
            
        const tags = post._embedded && post._embedded['wp:term'] 
            ? getTagsFromEmbedded(post._embedded['wp:term']) 
            : [];
        
        // Format author
        const author = post._embedded && post._embedded.author 
            ? post._embedded.author[0].name 
            : post.author || 'Unknown';
        
        return `
            <div class="content-detail-grid">
                <div class="content-meta">
                    <div class="content-meta-item">
                        <div class="meta-label">Status:</div>
                        <div class="meta-value">
                            <span class="status-badge ${post.status}">${post.status}</span>
                        </div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Author:</div>
                        <div class="meta-value">${author}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Date:</div>
                        <div class="meta-value">${formattedDate}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Categories:</div>
                        <div class="meta-value">${categories.join(', ') || '-'}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Tags:</div>
                        <div class="meta-value">${tags.join(', ') || '-'}</div>
                    </div>
                    ${post.featured_media ? `
                    <div class="content-meta-item">
                        <div class="meta-label">Featured Image:</div>
                        <div class="meta-value">ID: ${post.featured_media}</div>
                    </div>
                    ` : ''}
                    <div class="content-meta-item">
                        <div class="meta-label">Link:</div>
                        <div class="meta-value"><a href="${post.link}" target="_blank">${post.link}</a></div>
                    </div>
                </div>
                <div class="content-preview">
                    <div class="content-title">
                        <h2>${post.title.rendered || 'Untitled'}</h2>
                    </div>
                    ${post.excerpt ? `
                    <div class="content-excerpt">
                        <h3>Excerpt</h3>
                        <div>${post.excerpt.rendered}</div>
                    </div>
                    ` : ''}
                    <div class="content-body">
                        <h3>Content</h3>
                        <div>${post.content.rendered}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate detail view for a page
     * @param {Object} page - The page data
     * @returns {string} HTML content
     */
    function generatePageDetail(page) {
        const date = new Date(page.date);
        const formattedDate = date.toLocaleDateString();
        
        // Format author
        const author = page._embedded && page._embedded.author 
            ? page._embedded.author[0].name 
            : page.author || 'Unknown';
        
        return `
            <div class="content-detail-grid">
                <div class="content-meta">
                    <div class="content-meta-item">
                        <div class="meta-label">Status:</div>
                        <div class="meta-value">
                            <span class="status-badge ${page.status}">${page.status}</span>
                        </div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Author:</div>
                        <div class="meta-value">${author}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Date:</div>
                        <div class="meta-value">${formattedDate}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Template:</div>
                        <div class="meta-value">${page.template || 'Default'}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">Parent:</div>
                        <div class="meta-value">${page.parent ? `ID: ${page.parent}` : 'None'}</div>
                    </div>
                    ${page.featured_media ? `
                    <div class="content-meta-item">
                        <div class="meta-label">Featured Image:</div>
                        <div class="meta-value">ID: ${page.featured_media}</div>
                    </div>
                    ` : ''}
                    <div class="content-meta-item">
                        <div class="meta-label">Link:</div>
                        <div class="meta-value"><a href="${page.link}" target="_blank">${page.link}</a></div>
                    </div>
                </div>
                <div class="content-preview">
                    <div class="content-title">
                        <h2>${page.title.rendered || 'Untitled'}</h2>
                    </div>
                    <div class="content-body">
                        <h3>Content</h3>
                        <div>${page.content.rendered}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate detail view for a media item
     * @param {Object} media - The media data
     * @returns {string} HTML content
     */
    function generateMediaDetail(media) {
        const date = new Date(media.date);
        const formattedDate = date.toLocaleDateString();
        
        // Get file info
        const fileName = media.source_url ? media.source_url.split('/').pop() : 'Unknown';
        const fileType = media.mime_type || 'Unknown';
        const fileSize = formatFileSize(media.media_details?.filesize || 0);
        
        // Get image dimensions if it's an image
        const isImage = fileType.startsWith('image/');
        const dimensions = isImage && media.media_details?.width && media.media_details?.height
            ? `${media.media_details.width} × ${media.media_details.height}`
            : 'Unknown';
        
        return `
            <div class="content-detail-grid">
                <div class="content-meta">
                    <div class="content-meta-item">
                        <div class="meta-label">File Name:</div>
                        <div class="meta-value">${fileName}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">File Type:</div>
                        <div class="meta-value">${fileType}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">File Size:</div>
                        <div class="meta-value">${fileSize}</div>
                    </div>
                    ${isImage ? `
                    <div class="content-meta-item">
                        <div class="meta-label">Dimensions:</div>
                        <div class="meta-value">${dimensions}</div>
                    </div>
                    ` : ''}
                    <div class="content-meta-item">
                        <div class="meta-label">Date:</div>
                        <div class="meta-value">${formattedDate}</div>
                    </div>
                    <div class="content-meta-item">
                        <div class="meta-label">URL:</div>
                        <div class="meta-value"><a href="${media.source_url}" target="_blank">${media.source_url}</a></div>
                    </div>
                </div>
                <div class="content-preview">
                    <div class="content-title">
                        <h2>${media.title.rendered || 'Untitled'}</h2>
                    </div>
                    <div class="media-preview">
                        ${isImage ? `
                        <img src="${media.source_url}" alt="${fileName}" class="media-image">
                        ` : `
                        <div class="file-icon">
                            <i class="fas fa-file"></i>
                            <span>${fileType}</span>
                        </div>
                        `}
                    </div>
                    ${media.description ? `
                    <div class="content-description">
                        <h3>Description</h3>
                        <div>${media.description.rendered}</div>
                    </div>
                    ` : ''}
                    ${media.caption ? `
                    <div class="content-caption">
                        <h3>Caption</h3>
                        <div>${media.caption.rendered}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate detail view for a generic content item
     * @param {Object} item - The content item
     * @returns {string} HTML content
     */
    function generateGenericDetail(item) {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString();
        
        // Generate content rows for all properties
        let contentRows = '';
        
        for (const [key, value] of Object.entries(item)) {
            // Skip rendered fields (they'll be shown in the preview)
            if (key.endsWith('_rendered')) continue;
            
            // Format the value based on type
            let formattedValue;
            
            if (typeof value === 'object' && value !== null) {
                // For objects and arrays
                formattedValue = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
            } else if (typeof value === 'boolean') {
                // For booleans
                formattedValue = value ? 'Yes' : 'No';
            } else {
                // For other types
                formattedValue = value !== null && value !== undefined ? value : '-';
            }
            
            contentRows += `
                <div class="content-meta-item">
                    <div class="meta-label">${key}:</div>
                    <div class="meta-value">${formattedValue}</div>
                </div>
            `;
        }
        
        return `
            <div class="content-detail-grid">
                <div class="content-meta">
                    ${contentRows}
                </div>
                <div class="content-preview">
                    <div class="content-title">
                        <h2>${item.title?.rendered || item.name || 'Untitled'}</h2>
                    </div>
                    ${item.content?.rendered ? `
                    <div class="content-body">
                        <h3>Content</h3>
                        <div>${item.content.rendered}</div>
                    </div>
                    ` : ''}
                    ${item.excerpt?.rendered ? `
                    <div class="content-excerpt">
                        <h3>Excerpt</h3>
                        <div>${item.excerpt.rendered}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Hide content detail panel
     */
    function hideContentDetail() {
        const detailContainer = document.getElementById('content-detail-container');
        if (detailContainer) {
            detailContainer.classList.add('hidden');
        }
    }
    
    /**
     * Import a content item
     * @param {Object} item - The content item
     * @param {string} contentType - The content type
     */
    function importContentItem(item, contentType) {
        alert(`Importing ${contentType} "${item.title?.rendered || item.name || 'Untitled'}" - This functionality will be implemented in a future update.`);
        
        // TODO: Implement content import functionality
    }
    
    /**
     * Import selected content item from the detail view
     */
    function importSelectedContent() {
        alert('Content import functionality will be implemented in a future update.');
        
        // TODO: Implement content import functionality
    }
    
    /**
     * Load custom post types
     */
    function loadCustomPostTypes() {
        // Get the current site
        const site = _sites.find(s => s.id === _currentSite);
        if (!site) return;
        
        // Show loading state in dropdown
        const customPostTypeDropdown = document.getElementById('custom-post-type-dropdown');
        if (customPostTypeDropdown) {
            customPostTypeDropdown.innerHTML = '<option value="">Loading post types...</option>';
        }
        
        // Build the API URL for post types
        const apiUrl = buildApiUrl(site.url, site.restBase || _settings.defaultRestBase, site.apiVersion || _settings.defaultAPIVersion) + '/types';
        
        // Get authentication headers
        const authHeaders = getSiteAuthHeaders(site);
        
        // Make the API request
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...authHeaders
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Extract custom post types (exclude built-in types)
            const builtInTypes = ['post', 'page', 'attachment', 'revision', 'nav_menu_item', 'wp_block'];
            const customTypes = [];
            
            for (const [slug, type] of Object.entries(data)) {
                if (!builtInTypes.includes(slug)) {
                    customTypes.push({
                        slug,
                        name: type.name,
                        rest_base: type.rest_base || slug
                    });
                }
            }
            
            // Update dropdown
            if (customPostTypeDropdown) {
                if (customTypes.length > 0) {
                    customPostTypeDropdown.innerHTML = '';
                    
                    customTypes.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type.rest_base;
                        option.textContent = type.name;
                        customPostTypeDropdown.appendChild(option);
                    });
                    
                    // Load the first custom post type
                    loadContentType(customTypes[0].rest_base);
                } else {
                    customPostTypeDropdown.innerHTML = '<option value="">No custom post types found</option>';
                    
                    // Show message in content list
                    const contentListBody = document.getElementById('content-list-body');
                    if (contentListBody) {
                        contentListBody.innerHTML = `
                            <tr>
                                <td colspan="6" class="empty-message">
                                    No custom post types found.
                                </td>
                            </tr>
                        `;
                    }
                }
            }
        })
        .catch(error => {
            // Show error in dropdown
            if (customPostTypeDropdown) {
                customPostTypeDropdown.innerHTML = '<option value="">Error loading post types</option>';
            }
            
            // Show error in content list
            const contentListBody = document.getElementById('content-list-body');
            if (contentListBody) {
                contentListBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="error-message">
                            <i class="fas fa-exclamation-circle"></i> ${error.message}
                        </td>
                    </tr>
                `;
            }
        });
    }
    
    /**
     * Update sidebar with plugin categories
     */
    function updatePluginSidebar() {
        const sidebarContent = document.getElementById('wp-connector-sidebar-content');
        if (!sidebarContent) return;
        
        sidebarContent.innerHTML = `
            <div class="sidebar-section">
                <h4>Plugin Categories</h4>
                <ul class="sidebar-list">
                    <li><a href="#" class="plugin-category-link" data-category="all">All Plugins</a></li>
                    <li><a href="#" class="plugin-category-link" data-category="active">Active Plugins</a></li>
                    <li><a href="#" class="plugin-category-link" data-category="inactive">Inactive Plugins</a></li>
                    <li><a href="#" class="plugin-category-link" data-category="api">Plugins with API</a></li>
                </ul>
            </div>
        `;
        
        // Add event listeners to category links
        const categoryLinks = sidebarContent.querySelectorAll('.plugin-category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Set active class
                categoryLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Filter plugins
                const category = this.dataset.category;
                filterPluginsByCategory(category);
            });
        });
        
        // Set the first link as active
        if (categoryLinks.length > 0) {
            categoryLinks[0].classList.add('active');
        }
    }
    
    /**
     * Filter plugins by category
     * @param {string} category - The plugin category
     */
    function filterPluginsByCategory(category) {
        // Set filter values
        const statusFilter = document.getElementById('plugin-status-filter');
        const apiFilter = document.getElementById('plugin-api-filter');
        
        switch (category) {
            case 'active':
                if (statusFilter) statusFilter.value = 'active';
                if (apiFilter) apiFilter.value = 'all';
                break;
                
            case 'inactive':
                if (statusFilter) statusFilter.value = 'inactive';
                if (apiFilter) apiFilter.value = 'all';
                break;
                
            case 'api':
                if (statusFilter) statusFilter.value = 'all';
                if (apiFilter) apiFilter.value = 'has-api';
                break;
                
            default:
                if (statusFilter) statusFilter.value = 'all';
                if (apiFilter) apiFilter.value = 'all';
        }
        
        // Apply filters
        filterPlugins();
    }
    
    /**
     * Filter plugins based on UI filters
     */
    function filterPlugins() {
        // Get filters
        const statusFilter = document.getElementById('plugin-status-filter').value;
        const apiFilter = document.getElementById('plugin-api-filter').value;
        const sortFilter = document.getElementById('plugin-sort-filter').value;
        const searchTerm = document.getElementById('plugin-search').value.trim();
        
        // Get plugins from registry
        const plugins = _pluginRegistry[_currentSite];
        if (!plugins) return;
        
        // Display filtered plugins
        displayPlugins(plugins);
    }
    
    /**
     * Update sidebar with content types
     */
    function updateContentSidebar() {
        const sidebarContent = document.getElementById('wp-connector-sidebar-content');
        if (!sidebarContent) return;
        
        sidebarContent.innerHTML = `
            <div class="sidebar-section">
                <h4>Content Types</h4>
                <ul class="sidebar-list">
                    <li><a href="#" class="content-type-link" data-type="posts">Posts</a></li>
                    <li><a href="#" class="content-type-link" data-type="pages">Pages</a></li>
                    <li><a href="#" class="content-type-link" data-type="media">Media</a></li>
                    <li><a href="#" class="content-type-link" data-type="custom">Custom Post Types</a></li>
                </ul>
            </div>
        `;
        
        // Add event listeners to type links
        const typeLinks = sidebarContent.querySelectorAll('.content-type-link');
        typeLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Set active class
                typeLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Update content type selector
                const contentTypeSelector = document.getElementById('content-type-selector');
                if (contentTypeSelector) {
                    contentTypeSelector.value = this.dataset.type;
                    
                    // Trigger change event
                    const event = new Event('change');
                    contentTypeSelector.dispatchEvent(event);
                }
            });
        });
        
        // Set the first link as active
        if (typeLinks.length > 0) {
            typeLinks[0].classList.add('active');
        }
    }
    
    /**
     * Filter content based on UI filters
     */
    function filterContent() {
        // Get the current content type
        const contentType = document.getElementById('content-type-selector').value;
        
        // Reload content with filters
        loadContentType(contentType);
    }
    
    /**
     * Refresh plugins
     */
    function refreshPlugins() {
        loadPlugins();
    }
    
    /**
     * Refresh content
     */
    function refreshContent() {
        // Get the current content type
        const contentTypeSelector = document.getElementById('content-type-selector');
        if (contentTypeSelector) {
            const contentType = contentTypeSelector.value;
            
            if (contentType === 'custom') {
                // Get selected custom post type
                const customPostTypeDropdown = document.getElementById('custom-post-type-dropdown');
                if (customPostTypeDropdown && customPostTypeDropdown.value) {
                    loadContentType(customPostTypeDropdown.value);
                } else {
                    loadCustomPostTypes();
                }
            } else {
                loadContentType(contentType);
            }
        }
    }
    
    /**
     * Update sidebar with flow categories
     */
    function updateFlowSidebar() {
        const sidebarContent = document.getElementById('wp-connector-sidebar-content');
        if (!sidebarContent) return;
        
        sidebarContent.innerHTML = `
            <div class="sidebar-section">
                <h4>Flow Categories</h4>
                <ul class="sidebar-list">
                    <li><a href="#" class="flow-category-link" data-category="all">All Flows</a></li>
                    <li><a href="#" class="flow-category-link" data-category="content">Content Management</a></li>
                    <li><a href="#" class="flow-category-link" data-category="user">User Management</a></li>
                    <li><a href="#" class="flow-category-link" data-category="media">Media Management</a></li>
                </ul>
            </div>
        `;
        
        // Add event listeners to category links
        const categoryLinks = sidebarContent.querySelectorAll('.flow-category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Set active class
                categoryLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Filter flows
                const category = this.dataset.category;
                filterFlowsByCategory(category);
            });
        });
        
        // Set the first link as active
        if (categoryLinks.length > 0) {
            categoryLinks[0].classList.add('active');
        }
    }
    
    /**
     * Filter flows by category
     * @param {string} category - The flow category
     */
    function filterFlowsByCategory(category) {
        // TODO: Implement flow filtering
    }
    
    /**
     * Load flows
     */
    function loadFlows() {
        // Get the flow selector
        const flowSelector = document.getElementById('flow-selector');
        if (!flowSelector) return;
        
        // Clear current options, preserving the first one (Create New Flow)
        while (flowSelector.options.length > 1) {
            flowSelector.remove(1);
        }
        
        // Add existing flows
        if (Object.keys(_flows).length > 0) {
            for (const [id, flow] of Object.entries(_flows)) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = flow.name;
                flowSelector.appendChild(option);
            }
        } else {
            // Create a default flow if none exist
            const defaultFlow = createNewFlow('My First Flow', true);
            
            // Add it to the selector
            const option = document.createElement('option');
            option.value = defaultFlow.id;
            option.textContent = defaultFlow.name;
            flowSelector.appendChild(option);
            flowSelector.value = defaultFlow.id;
        }
    }
    
    /**
     * Initialize the flow editor
     */
    function initFlowEditor() {
        // Initialize the flow canvas
        // This would typically involve a graph/node editor library like D3.js, GoJS, Cytoscape, etc.
        // For now, we'll just show a placeholder
        
        const canvas = document.getElementById('flow-editor-canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="flow-canvas-placeholder">
                    <p>The flow editor will be fully implemented in a future update.</p>
                    <p>It will support drag-and-drop node creation, connections between nodes, and real-time execution.</p>
                </div>
            `;
        }
    }
    
    /**
     * Create a new flow
     * @param {string} name - The flow name
     * @param {boolean} silent - Whether to suppress notifications
     * @returns {Object} The created flow
     */
    function createNewFlow(name = 'New Flow', silent = false) {
        // Generate a unique ID
        const id = _generateId();
        
        // Create the flow
        const flow = {
            id,
            name: name,
            description: '',
            category: 'general',
            nodes: [],
            connections: [],
            created: Date.now(),
            modified: Date.now()
        };
        
        // Add to flows
        _flows[id] = flow;
        
        // Save to storage
        _saveSettings();
        
        // Update flow selector
        const flowSelector = document.getElementById('flow-selector');
        if (flowSelector) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            flowSelector.appendChild(option);
            flowSelector.value = id;
        }
        
        // Clear canvas
        const canvas = document.getElementById('flow-editor-canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="flow-canvas-placeholder">
                    <p>Flow "${name}" created.</p>
                    <p>Drag and drop nodes from the sidebar to build your flow.</p>
                </div>
            `;
        }
        
        // Show notification
        if (!silent) {
            alert(`Flow "${name}" created successfully.`);
        }
        
        return flow;
    }
    
    /**
     * Load a flow into the editor
     * @param {string} flowId - The flow ID
     */
    function loadFlow(flowId) {
        const flow = _flows[flowId];
        if (!flow) return;
        
        // TODO: Load flow into editor
        
        // For now, just show a placeholder
        const canvas = document.getElementById('flow-editor-canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="flow-canvas-placeholder">
                    <p>Flow "${flow.name}" loaded.</p>
                    <p>The flow editor will be fully implemented in a future update.</p>
                </div>
            `;
        }
    }
    
    /**
     * Save the current flow
     */
    function saveCurrentFlow() {
        // Get the current flow ID
        const flowSelector = document.getElementById('flow-selector');
        if (!flowSelector || flowSelector.value === 'new') return;
        
        const flowId = flowSelector.value;
        const flow = _flows[flowId];
        if (!flow) return;
        
        // Update flow data
        flow.modified = Date.now();
        
        // Save to storage
        _saveSettings();
        
        // Show notification
        alert(`Flow "${flow.name}" saved successfully.`);
    }
    
    /**
     * Run the current flow
     */
    function runCurrentFlow() {
        // Get the current flow ID
        const flowSelector = document.getElementById('flow-selector');
        if (!flowSelector || flowSelector.value === 'new') return;
        
        const flowId = flowSelector.value;
        const flow = _flows[flowId];
        if (!flow) return;
        
        // Show execution panel
        const executionPanel = document.getElementById('flow-execution-panel');
        if (executionPanel) {
            executionPanel.classList.remove('hidden');
        }
        
        // Set up execution log
        const executionLog = document.getElementById('execution-log');
        if (executionLog) {
            executionLog.innerHTML = '<div class="log-entry info">Starting flow execution...</div>';
        }
        
        // TODO: Implement actual flow execution
        
        // For now, just show a simulated execution
        simulateFlowExecution(flow);
    }
    
    /**
     * Simulate flow execution for demo purposes
     * @param {Object} flow - The flow to simulate
     */
    function simulateFlowExecution(flow) {
        const executionLog = document.getElementById('execution-log');
        const executionResults = document.getElementById('execution-results');
        
        if (!executionLog || !executionResults) return;
        
        // Clear previous results
        executionResults.innerHTML = '';
        
        // Simulate execution steps
        let stepIndex = 0;
        const steps = [
            'Initializing flow...',
            'Connecting to WordPress API...',
            'Fetching data...',
            'Processing data...',
            'Generating results...',
            'Flow execution completed.'
        ];
        
        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                // Add log entry
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry info';
                logEntry.innerHTML = steps[stepIndex];
                executionLog.appendChild(logEntry);
                
                // Scroll to bottom
                executionLog.scrollTop = executionLog.scrollHeight;
                
                // Increment step index
                stepIndex++;
            } else {
                // Execution complete
                clearInterval(interval);
                
                // Show success message
                const successEntry = document.createElement('div');
                successEntry.className = 'log-entry success';
                successEntry.innerHTML = '<i class="fas fa-check-circle"></i> Execution completed successfully.';
                executionLog.appendChild(successEntry);
                
                // Show mock results
                executionResults.innerHTML = `
                    <h4>Results:</h4>
                    <div class="result-item">
                        <div class="result-label">Execution Time:</div>
                        <div class="result-value">1.24 seconds</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Nodes Executed:</div>
                        <div class="result-value">5</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Data Items Processed:</div>
                        <div class="result-value">12</div>
                    </div>
                    <div class="result-data">
                        <h5>Output Data:</h5>
                        <pre><code>{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Sample Post",
      "processed": true
    },
    {
      "id": 2,
      "title": "Another Post",
      "processed": true
    }
  ]
}</code></pre>
                    </div>
                `;
            }
        }, 1000);
    }
    
    /**
     * Hide the flow execution panel
     */
    function hideExecutionPanel() {
        const executionPanel = document.getElementById('flow-execution-panel');
        if (executionPanel) {
            executionPanel.classList.add('hidden');
        }
    }
    
    /**
     * Step through flow execution
     */
    function stepFlowExecution() {
        // TODO: Implement step-by-step flow execution
        alert('Step-by-step execution will be implemented in a future update.');
    }
    
    /**
     * Pause flow execution
     */
    function pauseFlowExecution() {
        // TODO: Implement pause/resume flow execution
        alert('Pause/resume execution will be implemented in a future update.');
    }
    
    /**
     * Stop flow execution
     */
    function stopFlowExecution() {
        // TODO: Implement stop flow execution
        
        // Add log entry
        const executionLog = document.getElementById('execution-log');
        if (executionLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry warning';
            logEntry.innerHTML = '<i class="fas fa-exclamation-circle"></i> Execution stopped by user.';
            executionLog.appendChild(logEntry);
            
            // Scroll to bottom
            executionLog.scrollTop = executionLog.scrollHeight;
        }
    }
    
    /**
     * Export the current flow
     */
    function exportCurrentFlow() {
        // Get the current flow ID
        const flowSelector = document.getElementById('flow-selector');
        if (!flowSelector || flowSelector.value === 'new') return;
        
        const flowId = flowSelector.value;
        const flow = _flows[flowId];
        if (!flow) return;
        
        // Create export data
        const exportData = JSON.stringify(flow, null, 2);
        
        // Create a download link
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${flow.name.replace(/\s+/g, '_')}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import a flow from a file
     */
    function importFlow() {
        // Create a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        // Handle file selection
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const flow = JSON.parse(event.target.result);
                    
                    // Validate flow data
                    if (!flow.id || !flow.name) {
                        throw new Error('Invalid flow data');
                    }
                    
                    // Generate a new ID to prevent overwriting existing flows
                    flow.id = _generateId();
                    flow.imported = true;
                    flow.importedAt = Date.now();
                    
                    // Add to flows
                    _flows[flow.id] = flow;
                    
                    // Save to storage
                    _saveSettings();
                    
                    // Reload flows
                    loadFlows();
                    
                    // Load the imported flow
                    const flowSelector = document.getElementById('flow-selector');
                    if (flowSelector) {
                        flowSelector.value = flow.id;
                        
                        // Load the flow
                        loadFlow(flow.id);
                    }
                    
                    // Show notification
                    alert(`Flow "${flow.name}" imported successfully.`);
                } catch (error) {
                    alert(`Failed to import flow: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        // Trigger file selection
        input.click();
    }
    
    /**
     * Add a node to the current flow
     * @param {Object} nodeData - The node data
     */
    function addNodeToFlow(nodeData) {
        // Get the current flow ID
        const flowSelector = document.getElementById('flow-selector');
        if (!flowSelector) return;
        
        // If no flow is selected, create a new one
        if (flowSelector.value === 'new') {
            const flow = createNewFlow('API Flow', true);
            flowSelector.value = flow.id;
        }
        
        const flowId = flowSelector.value;
        const flow = _flows[flowId];
        if (!flow) return;
        
        // Create a new node
        const node = {
            id: _generateId(),
            type: nodeData.type,
            position: { x: 100, y: 100 },
            data: { ...nodeData }
        };
        
        // Add to flow
        flow.nodes.push(node);
        
        // Update flow
        flow.modified = Date.now();
        
        // Save to storage
        _saveSettings();
        
        // Update flow editor
        // TODO: Add node to visual editor
        
        // For now, just show a notification
        alert(`Node "${nodeData.type}" added to flow.`);
    }
    
    /**
     * Update sidebar with module categories
     */
    function updateModuleSidebar() {
        const sidebarContent = document.getElementById('wp-connector-sidebar-content');
        if (!sidebarContent) return;
        
        sidebarContent.innerHTML = `
            <div class="sidebar-section">
                <h4>Module Categories</h4>
                <ul class="sidebar-list">
                    <li><a href="#" class="module-category-link" data-category="all">All Modules</a></li>
                    <li><a href="#" class="module-category-link" data-category="content">Content Management</a></li>
                    <li><a href="#" class="module-category-link" data-category="user">User Management</a></li>
                    <li><a href="#" class="module-category-link" data-category="media">Media Management</a></li>
                    <li><a href="#" class="module-category-link" data-category="seo">SEO</a></li>
                    <li><a href="#" class="module-category-link" data-category="ecommerce">E-Commerce</a></li>
                </ul>
            </div>
        `;
        
        // Add event listeners to category links
        const categoryLinks = sidebarContent.querySelectorAll('.module-category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Set active class
                categoryLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Filter modules
                const category = this.dataset.category;
                filterModulesByCategory(category);
            });
        });
        
        // Set the first link as active
        if (categoryLinks.length > 0) {
            categoryLinks[0].classList.add('active');
        }
    }
    
    /**
     * Filter modules by category
     * @param {string} category - The module category
     */
    function filterModulesByCategory(category) {
        // Get the category filter
        const categoryFilter = document.getElementById('module-category-filter');
        if (categoryFilter) {
            categoryFilter.value = category === 'all' ? 'all' : category;
        }
        
        // Apply filters
        filterModules();
    }
    
    /**
     * Filter modules based on UI filters
     */
    function filterModules() {
        // TODO: Implement module filtering
        loadModules();
    }
    
      function loadModules() {
        const moduleGrid = document.getElementById('micro-module-grid');
        if (!moduleGrid) return;
        
        // Clear current modules
        moduleGrid.innerHTML = '';
        
        // Check if we have any modules
        if (Object.keys(_microModules).length === 0) {
            moduleGrid.innerHTML = `
                <div class="module-card placeholder">
                    <div class="module-card-content">
                        <p>No modules found. Create your first module to get started.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get filter values
        const categoryFilter = document.getElementById('module-category-filter').value;
        const sortFilter = document.getElementById('module-sort-filter').value;
        const searchTerm = document.getElementById('module-search').value.trim().toLowerCase();
        
        // Filter and sort modules
        let modules = Object.values(_microModules);
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            modules = modules.filter(module => module.category === categoryFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            modules = modules.filter(module => {
                return module.name.toLowerCase().includes(searchTerm) || 
                       module.description.toLowerCase().includes(searchTerm);
            });
        }
        
        // Apply sort
        switch (sortFilter) {
            case 'name-asc':
                modules.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                modules.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'created-desc':
                modules.sort((a, b) => b.created - a.created);
                break;
            case 'created-asc':
                modules.sort((a, b) => a.created - b.created);
                break;
        }
        
        // Display modules
        if (modules.length === 0) {
            moduleGrid.innerHTML = `
                <div class="module-card placeholder">
                    <div class="module-card-content">
                        <p>No modules match your filters.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create module cards
        modules.forEach(module => {
            const card = document.createElement('div');
            card.className = 'module-card glass-panel';
            card.dataset.moduleId = module.id;
            
            // Format created date
            const createdDate = new Date(module.created);
            const formattedDate = createdDate.toLocaleDateString();
            
            card.innerHTML = `
                <div class="module-card-header">
                    <h3 class="module-name">${module.name}</h3>
                    <div class="module-category-badge">${module.category}</div>
                </div>
                <div class="module-card-body">
                    <p class="module-description">${module.description}</p>
                </div>
                <div class="module-card-footer">
                    <div class="module-meta">
                        <span class="module-date">Created: ${formattedDate}</span>
                    </div>
                    <div class="module-actions">
                        <button class="glass-button small view-module-btn">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="glass-button small use-module-btn">
                            <i class="fas fa-play"></i> Use
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listener for view button
            const viewBtn = card.querySelector('.view-module-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    viewModule(module.id);
                });
            }
            
            // Add event listener for use button
            const useBtn = card.querySelector('.use-module-btn');
            if (useBtn) {
                useBtn.addEventListener('click', function() {
                    useModule(module.id);
                });
            }
            
            moduleGrid.appendChild(card);
        });
    }
    
    /**
     * View a module's details
     * @param {string} moduleId - The module ID
     */
    function viewModule(moduleId) {
        const module = _microModules[moduleId];
        if (!module) return;
        
        const detailContainer = document.getElementById('module-detail-container');
        const detailContent = document.getElementById('module-detail-content');
        
        if (!detailContainer || !detailContent) return;
        
        // Set the detail title
        const detailTitle = document.getElementById('module-detail-title');
        if (detailTitle) {
            detailTitle.textContent = module.name;
        }
        
        // Format created and modified dates
        const createdDate = new Date(module.created).toLocaleDateString();
        const modifiedDate = module.modified ? new Date(module.modified).toLocaleDateString() : createdDate;
        
        // Fill the detail content
        detailContent.innerHTML = `
            <div class="module-detail-header">
                <div class="module-detail-name">
                    <h3>${module.name}</h3>
                    <div class="module-category-badge">${module.category}</div>
                </div>
                <div class="module-detail-dates">
                    <div>Created: ${createdDate}</div>
                    <div>Last Modified: ${modifiedDate}</div>
                </div>
            </div>
            <div class="module-detail-description">
                <h4>Description</h4>
                <p>${module.description}</p>
            </div>
            <div class="module-detail-flow">
                <h4>Associated Flow</h4>
                <p>${module.flowId ? `Flow: ${_flows[module.flowId]?.name || 'Unknown'}` : 'No flow associated'}</p>
            </div>
            <div class="module-detail-params">
                <h4>Input Parameters</h4>
                ${module.inputs.length > 0 ? `
                <table class="params-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Default Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${module.inputs.map(input => `
                        <tr>
                            <td>${input.name}</td>
                            <td>${input.type}</td>
                            <td>${input.required ? 'Yes' : 'No'}</td>
                            <td>${input.defaultValue !== undefined && input.defaultValue !== null ? input.defaultValue : '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p>No input parameters defined.</p>'}
            </div>
            <div class="module-detail-params">
                <h4>Output Parameters</h4>
                ${module.outputs.length > 0 ? `
                <table class="params-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${module.outputs.map(output => `
                        <tr>
                            <td>${output.name}</td>
                            <td>${output.type}</td>
                            <td>${output.description || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p>No output parameters defined.</p>'}
            </div>
            <div class="module-detail-options">
                <h4>Module Options</h4>
                <div class="options-grid">
                    <div class="option-item">
                        <div class="option-label">Cacheable:</div>
                        <div class="option-value">${module.cacheable ? 'Yes' : 'No'}</div>
                    </div>
                    <div class="option-item">
                        <div class="option-label">Asynchronous:</div>
                        <div class="option-value">${module.async ? 'Yes' : 'No'}</div>
                    </div>
                    <div class="option-item">
                        <div class="option-label">Standalone:</div>
                        <div class="option-value">${module.standalone ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Show the detail container
        detailContainer.classList.remove('hidden');
    }
    
    /**
     * Hide module detail panel
     */
    function hideModuleDetail() {
        const detailContainer = document.getElementById('module-detail-container');
        if (detailContainer) {
            detailContainer.classList.add('hidden');
        }
    }
    
    /**
     * Use a micro module
     * @param {string} moduleId - The module ID
     */
    function useModule(moduleId) {
        const module = _microModules[moduleId];
        if (!module) return;
        
        // Create a form to collect input parameters
        const modal = document.createElement('div');
        modal.className = 'wp-module-modal';
        modal.innerHTML = `
            <div class="module-modal-content glass-panel">
                <div class="module-modal-header">
                    <h3>Use Module: ${module.name}</h3>
                    <button class="close-modal-btn glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="module-modal-body">
                    <div class="module-description">
                        <p>${module.description}</p>
                    </div>
                    
                    ${module.inputs.length > 0 ? `
                    <form id="module-inputs-form" class="module-inputs-form">
                        <h4>Input Parameters</h4>
                        ${module.inputs.map(input => `
                        <div class="form-group">
                            <label for="input-${input.name}">${input.name}${input.required ? ' *' : ''}:</label>
                            ${renderInputField(input)}
                            ${input.description ? `<div class="input-description">${input.description}</div>` : ''}
                        </div>
                        `).join('')}
                    </form>
                    ` : '<p>This module does not require any input parameters.</p>'}
                    
                    <div class="form-actions">
                        <button id="execute-module-btn" class="glass-button primary">
                            <i class="fas fa-play"></i> Execute
                        </button>
                        <button id="cancel-module-btn" class="glass-button">
                            Cancel
                        </button>
                    </div>
                </div>
                <div id="module-execution-results" class="module-execution-results hidden">
                    <h4>Execution Results</h4>
                    <div id="execution-status" class="execution-status">
                        <div class="status-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="status-message">Executing module...</div>
                    </div>
                    <div id="execution-output" class="execution-output hidden">
                        <!-- Results will be added here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Add event listener for close button
        const closeBtn = modal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Add event listener for cancel button
        const cancelBtn = modal.querySelector('#cancel-module-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Add event listener for execute button
        const executeBtn = modal.querySelector('#execute-module-btn');
        if (executeBtn) {
            executeBtn.addEventListener('click', function() {
                // Validate inputs
                const inputsValid = validateModuleInputs(module.inputs);
                if (!inputsValid) {
                    alert('Please fill in all required fields with valid values.');
                    return;
                }
                
                // Collect input values
                const inputValues = collectModuleInputs(module.inputs);
                
                // Show execution section
                const resultsSection = modal.querySelector('#module-execution-results');
                if (resultsSection) {
                    resultsSection.classList.remove('hidden');
                }
                
                // Execute the module
                executeModule(module, inputValues);
            });
        }
    }
    
    /**
     * Render an input field based on the input type
     * @param {Object} input - The input parameter definition
     * @returns {string} HTML for the input field
     */
    function renderInputField(input) {
        const id = `input-${input.name}`;
        const required = input.required ? 'required' : '';
        
        switch (input.type) {
            case 'string':
                return `<input type="text" id="${id}" name="${input.name}" placeholder="Enter text" value="${input.defaultValue || ''}" ${required}>`;
                
            case 'number':
                return `<input type="number" id="${id}" name="${input.name}" placeholder="Enter number" value="${input.defaultValue !== undefined ? input.defaultValue : ''}" ${required}>`;
                
            case 'boolean':
                return `
                    <div class="checkbox-group">
                        <input type="checkbox" id="${id}" name="${input.name}" ${input.defaultValue ? 'checked' : ''}>
                        <label for="${id}">Enabled</label>
                    </div>
                `;
                
            case 'object':
                return `<textarea id="${id}" name="${input.name}" placeholder="Enter JSON object" rows="4" ${required}>${input.defaultValue !== undefined ? JSON.stringify(input.defaultValue, null, 2) : ''}</textarea>`;
                
            case 'array':
                return `<textarea id="${id}" name="${input.name}" placeholder="Enter JSON array" rows="4" ${required}>${input.defaultValue !== undefined ? JSON.stringify(input.defaultValue, null, 2) : ''}</textarea>`;
                
            default:
                return `<input type="text" id="${id}" name="${input.name}" placeholder="Enter value" value="${input.defaultValue || ''}" ${required}>`;
        }
    }
    
    /**
     * Validate module input values
     * @param {Array} inputs - Input parameter definitions
     * @returns {boolean} Whether all inputs are valid
     */
    function validateModuleInputs(inputs) {
        let valid = true;
        
        inputs.forEach(input => {
            const element = document.getElementById(`input-${input.name}`);
            if (!element) return;
            
            // Skip if not required and empty
            if (!input.required && 
                (element.value === '' || 
                (input.type === 'boolean' && !element.checked))) {
                return;
            }
            
            // Validate based on type
            switch (input.type) {
                case 'string':
                    // String is always valid if not empty
                    if (input.required && element.value.trim() === '') {
                        valid = false;
                        element.classList.add('invalid');
                    }
                    break;
                    
                case 'number':
                    // Check if it's a valid number
                    if (isNaN(parseFloat(element.value)) || !isFinite(element.value)) {
                        valid = false;
                        element.classList.add('invalid');
                    }
                    break;
                    
                case 'boolean':
                    // Boolean is always valid
                    break;
                    
                case 'object':
                case 'array':
                    // Check if it's valid JSON
                    try {
                        if (element.value.trim() !== '') {
                            JSON.parse(element.value);
                        }
                    } catch (e) {
                        valid = false;
                        element.classList.add('invalid');
                    }
                    break;
            }
        });
        
        return valid;
    }
    
    /**
     * Collect module input values
     * @param {Array} inputs - Input parameter definitions
     * @returns {Object} Input values
     */
    function collectModuleInputs(inputs) {
        const values = {};
        
        inputs.forEach(input => {
            const element = document.getElementById(`input-${input.name}`);
            if (!element) return;
            
            // Get value based on type
            switch (input.type) {
                case 'string':
                    values[input.name] = element.value;
                    break;
                    
                case 'number':
                    values[input.name] = element.value !== '' ? parseFloat(element.value) : undefined;
                    break;
                    
                case 'boolean':
                    values[input.name] = element.checked;
                    break;
                    
                case 'object':
                case 'array':
                    values[input.name] = element.value !== '' ? JSON.parse(element.value) : undefined;
                    break;
                    
                default:
                    values[input.name] = element.value;
            }
        });
        
        return values;
    }
    
    /**
     * Execute a micro module
     * @param {Object} module - The module to execute
     * @param {Object} inputs - Input values
     */
    function executeModule(module, inputs) {
        // Get the execution output container
        const statusContainer = document.getElementById('execution-status');
        const outputContainer = document.getElementById('execution-output');
        
        if (!statusContainer || !outputContainer) return;
        
        // If the module has an associated flow
        if (module.flowId && _flows[module.flowId]) {
            // Execute the flow with the inputs
            executeModuleFlow(module, inputs, statusContainer, outputContainer);
        } else {
            // For demo purposes, simulate execution
            simulateModuleExecution(module, inputs, statusContainer, outputContainer);
        }
    }
    
    /**
     * Execute a module's associated flow
     * @param {Object} module - The module to execute
     * @param {Object} inputs - Input values
     * @param {HTMLElement} statusContainer - Status container element
     * @param {HTMLElement} outputContainer - Output container element
     */
    function executeModuleFlow(module, inputs, statusContainer, outputContainer) {
        // Placeholder for actual flow execution
        // In a real implementation, this would connect to the flow execution engine
        
        // For now, simulate execution
        simulateModuleExecution(module, inputs, statusContainer, outputContainer);
    }
    
    /**
     * Simulate module execution for demo purposes
     * @param {Object} module - The module to execute
     * @param {Object} inputs - Input values
     * @param {HTMLElement} statusContainer - Status container element
     * @param {HTMLElement} outputContainer - Output container element
     */
    function simulateModuleExecution(module, inputs, statusContainer, outputContainer) {
        // Update status
        statusContainer.innerHTML = `
            <div class="status-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="status-message">Executing module...</div>
        `;
        
        // Simulate processing time
        setTimeout(() => {
            // Generate mock results based on module type and inputs
            let results;
            
            switch (module.category) {
                case 'content':
                    results = simulateContentModuleResults(module, inputs);
                    break;
                    
                case 'user':
                    results = simulateUserModuleResults(module, inputs);
                    break;
                    
                case 'media':
                    results = simulateMediaModuleResults(module, inputs);
                    break;
                    
                default:
                    results = simulateGenericModuleResults(module, inputs);
            }
            
            // Show success status
            statusContainer.innerHTML = `
                <div class="status-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="status-message">Module executed successfully!</div>
            `;
            
            // Show output
            outputContainer.innerHTML = '';
            outputContainer.classList.remove('hidden');
            
            // Add execution summary
            const summary = document.createElement('div');
            summary.className = 'execution-summary';
            summary.innerHTML = `
                <div class="summary-item">
                    <div class="summary-label">Execution Time:</div>
                    <div class="summary-value">${results.executionTime} ms</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Status:</div>
                    <div class="summary-value">${results.status}</div>
                </div>
            `;
            
            outputContainer.appendChild(summary);
            
            // Add outputs section
            const outputsSection = document.createElement('div');
            outputsSection.className = 'outputs-section';
            outputsSection.innerHTML = `
                <h5>Output Results:</h5>
                <div class="output-data">
                    <pre><code>${JSON.stringify(results.data, null, 2)}</code></pre>
                </div>
            `;
            
            outputContainer.appendChild(outputsSection);
            
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'glass-button copy-output-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Results';
            
            copyBtn.addEventListener('click', function() {
                const outputText = JSON.stringify(results.data, null, 2);
                navigator.clipboard.writeText(outputText)
                    .then(() => {
                        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i> Copy Results';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        this.innerHTML = '<i class="fas fa-times"></i> Copy Failed';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i> Copy Results';
                        }, 2000);
                    });
            });
            
            outputContainer.appendChild(copyBtn);
            
        }, 1500); // Simulate 1.5 second processing time
    }
    
    /**
     * Simulate results for content management modules
     * @param {Object} module - The module
     * @param {Object} inputs - Input values
     * @returns {Object} Simulated results
     */
    function simulateContentModuleResults(module, inputs) {
        // Generate mock content data
        const mockPosts = [
            {
                id: 1,
                title: 'Sample Post 1',
                status: 'publish',
                date: new Date().toISOString(),
                modified: true
            },
            {
                id: 2,
                title: 'Sample Post 2',
                status: 'publish',
                date: new Date().toISOString(),
                modified: true
            }
        ];
        
        return {
            status: 'success',
            executionTime: Math.floor(Math.random() * 500) + 500, // 500-1000ms
            data: {
                posts: mockPosts,
                count: mockPosts.length,
                input: inputs
            }
        };
    }
    
    /**
     * Simulate results for user management modules
     * @param {Object} module - The module
     * @param {Object} inputs - Input values
     * @returns {Object} Simulated results
     */
    function simulateUserModuleResults(module, inputs) {
        // Generate mock user data
        const mockUsers = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                roles: ['administrator']
            },
            {
                id: 2,
                username: 'editor',
                email: 'editor@example.com',
                roles: ['editor']
            }
        ];
        
        return {
            status: 'success',
            executionTime: Math.floor(Math.random() * 500) + 500, // 500-1000ms
            data: {
                users: mockUsers,
                count: mockUsers.length,
                input: inputs
            }
        };
    }
    
    /**
     * Simulate results for media management modules
     * @param {Object} module - The module
     * @param {Object} inputs - Input values
     * @returns {Object} Simulated results
     */
    function simulateMediaModuleResults(module, inputs) {
        // Generate mock media data
        const mockMedia = [
            {
                id: 1,
                title: 'Sample Image',
                type: 'image/jpeg',
                url: 'https://example.com/sample.jpg',
                filesize: 1024 * 1024 // 1MB
            },
            {
                id: 2,
                title: 'Sample Document',
                type: 'application/pdf',
                url: 'https://example.com/sample.pdf',
                filesize: 2 * 1024 * 1024 // 2MB
            }
        ];
        
        return {
            status: 'success',
            executionTime: Math.floor(Math.random() * 500) + 500, // 500-1000ms
            data: {
                media: mockMedia,
                count: mockMedia.length,
                input: inputs
            }
        };
    }
    
    /**
     * Simulate results for generic modules
     * @param {Object} module - The module
     * @param {Object} inputs - Input values
     * @returns {Object} Simulated results
     */
    function simulateGenericModuleResults(module, inputs) {
        return {
            status: 'success',
            executionTime: Math.floor(Math.random() * 500) + 500, // 500-1000ms
            data: {
                result: 'Operation completed successfully',
                timestamp: new Date().toISOString(),
                input: inputs
            }
        };
    }
    
    /**
     * Show the module edit form
     * @param {string} moduleId - The ID of the module to edit (optional)
     */
    function showModuleEditForm(moduleId) {
        const editorContainer = document.getElementById('module-editor-container');
        if (editorContainer) {
            editorContainer.classList.remove('hidden');
            
            const editorTitle = document.getElementById('module-editor-title');
            const moduleName = document.getElementById('module-name');
            const moduleDescription = document.getElementById('module-description');
            const moduleCategory = document.getElementById('module-category');
            const moduleCacheable = document.getElementById('module-cacheable');
            const moduleAsync = document.getElementById('module-async');
            const moduleStandalone = document.getElementById('module-standalone');
            
            // Clear input parameter container
            const inputParamsContainer = document.getElementById('input-params-container');
            if (inputParamsContainer) {
                inputParamsContainer.innerHTML = '';
            }
            
            // Clear output parameter container
            const outputParamsContainer = document.getElementById('output-params-container');
            if (outputParamsContainer) {
                outputParamsContainer.innerHTML = '';
            }
            
            if (moduleId) {
                // Editing existing module
                const module = _microModules[moduleId];
                if (module) {
                    if (editorTitle) editorTitle.textContent = 'Edit Module';
                    if (moduleName) moduleName.value = module.name;
                    if (moduleDescription) moduleDescription.value = module.description;
                    
                    if (moduleCategory) {
                        if (['content', 'user', 'media', 'seo', 'ecommerce', 'custom'].includes(module.category)) {
                            moduleCategory.value = module.category;
                        } else {
                            moduleCategory.value = 'custom';
                            // Set custom category
                            document.getElementById('custom-category-group').classList.remove('hidden');
                            document.getElementById('custom-category').value = module.category;
                        }
                    }
                    
                    if (moduleCacheable) moduleCacheable.checked = module.cacheable !== false;
                    if (moduleAsync) moduleAsync.checked = !!module.async;
                    if (moduleStandalone) moduleStandalone.checked = !!module.standalone;
                    
                    // Set flow
                    const moduleFlow = document.getElementById('module-flow');
                    if (moduleFlow && module.flowId) {
                        moduleFlow.value = module.flowId;
                    }
                    
                    // Add input parameters
                    if (inputParamsContainer && module.inputs) {
                        module.inputs.forEach(input => {
                            addInputParameterRow(input);
                        });
                    }
                    
                    // Add output parameters
                    if (outputParamsContainer && module.outputs) {
                        module.outputs.forEach(output => {
                            addOutputParameterRow(output);
                        });
                    }
                    
                    // Store the module ID for the save function
                    editorContainer.dataset.moduleId = moduleId;
                }
            } else {
                // Creating new module
                if (editorTitle) editorTitle.textContent = 'Create New Module';
                if (moduleName) moduleName.value = '';
                if (moduleDescription) moduleDescription.value = '';
                if (moduleCategory) moduleCategory.value = 'content';
                if (moduleCacheable) moduleCacheable.checked = true;
                if (moduleAsync) moduleAsync.checked = false;
                if (moduleStandalone) moduleStandalone.checked = false;
                
                // Hide custom category
                document.getElementById('custom-category-group').classList.add('hidden');
                
                // Reset flow
                const moduleFlow = document.getElementById('module-flow');
                if (moduleFlow) {
                    moduleFlow.value = '';
                }
                
                // Add one empty input parameter row
                addInputParameterRow();
                
                // Add one empty output parameter row
                addOutputParameterRow();
                
                // Clear the module ID
                delete editorContainer.dataset.moduleId;
            }
            
            // Update flow select options
            updateFlowSelectOptions();
        }
    }
    
    /**
     * Hide the module edit form
     */
    function hideModuleEditForm() {
        const editorContainer = document.getElementById('module-editor-container');
        if (editorContainer) {
            editorContainer.classList.add('hidden');
        }
    }
    
    /**
     * Add a new input parameter row
     * @param {Object} param - Parameter data (optional)
     */
    function addInputParameterRow(param) {
        const container = document.getElementById('input-params-container');
        if (!container) return;
        
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';
        
        paramRow.innerHTML = `
            <input type="text" class="param-name" placeholder="Parameter name" value="${param?.name || ''}">
            <select class="param-type">
                <option value="string" ${param?.type === 'string' ? 'selected' : ''}>String</option>
                <option value="number" ${param?.type === 'number' ? 'selected' : ''}>Number</option>
                <option value="boolean" ${param?.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                <option value="object" ${param?.type === 'object' ? 'selected' : ''}>Object</option>
                <option value="array" ${param?.type === 'array' ? 'selected' : ''}>Array</option>
            </select>
            <input type="text" class="param-default" placeholder="Default value" value="${param?.defaultValue !== undefined ? param.defaultValue : ''}">
            <div class="param-required">
                <input type="checkbox" class="required-checkbox" ${param?.required ? 'checked' : ''}>
                <label>Required</label>
            </div>
            <button class="remove-param-btn glass-button small">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener for remove button
        const removeBtn = paramRow.querySelector('.remove-param-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                container.removeChild(paramRow);
            });
        }
        
        container.appendChild(paramRow);
    }
    
    /**
     * Add a new output parameter row
     * @param {Object} param - Parameter data (optional)
     */
    function addOutputParameterRow(param) {
        const container = document.getElementById('output-params-container');
        if (!container) return;
        
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';
        
        paramRow.innerHTML = `
            <input type="text" class="param-name" placeholder="Parameter name" value="${param?.name || ''}">
            <select class="param-type">
                <option value="string" ${param?.type === 'string' ? 'selected' : ''}>String</option>
                <option value="number" ${param?.type === 'number' ? 'selected' : ''}>Number</option>
                <option value="boolean" ${param?.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                <option value="object" ${param?.type === 'object' ? 'selected' : ''}>Object</option>
                <option value="array" ${param?.type === 'array' ? 'selected' : ''}>Array</option>
            </select>
            <input type="text" class="param-description" placeholder="Description" value="${param?.description || ''}">
            <button class="remove-param-btn glass-button small">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener for remove button
        const removeBtn = paramRow.querySelector('.remove-param-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                container.removeChild(paramRow);
            });
        }
        
        container.appendChild(paramRow);
    }
    
    /**
     * Update flow select options
     */
    function updateFlowSelectOptions() {
        const flowSelect = document.getElementById('module-flow');
        if (!flowSelect) return;
        
        // Clear current options, preserving the first empty option
        while (flowSelect.options.length > 1) {
            flowSelect.remove(1);
        }
        
        // Add flow options
        for (const [id, flow] of Object.entries(_flows)) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = flow.name;
            flowSelect.appendChild(option);
        }
    }
    
    /**
     * Save a micro module
     */
    function saveModule() {
        // Get form values
        const editorContainer = document.getElementById('module-editor-container');
        const moduleName = document.getElementById('module-name').value.trim();
        const moduleDescription = document.getElementById('module-description').value.trim();
        const moduleCategory = document.getElementById('module-category').value;
        const moduleFlow = document.getElementById('module-flow').value;
        const moduleCacheable = document.getElementById('module-cacheable').checked;
        const moduleAsync = document.getElementById('module-async').checked;
        const moduleStandalone = document.getElementById('module-standalone').checked;
        
        // Get category value (handle custom category)
        let category = moduleCategory;
        if (category === 'custom') {
            category = document.getElementById('custom-category').value.trim();
            if (!category) {
                alert('Please enter a custom category.');
                return;
            }
        }
        
        // Validate inputs
        if (!moduleName) {
            alert('Please enter a module name.');
            return;
        }
        
        if (!moduleDescription) {
            alert('Please enter a module description.');
            return;
        }
        
        // Collect input parameters
        const inputs = [];
        const inputRows = document.querySelectorAll('#input-params-container .param-row');
        
        inputRows.forEach(row => {
            const nameInput = row.querySelector('.param-name');
            const typeSelect = row.querySelector('.param-type');
            const defaultInput = row.querySelector('.param-default');
            const requiredCheckbox = row.querySelector('.required-checkbox');
            
            if (nameInput && nameInput.value.trim()) {
                inputs.push({
                    name: nameInput.value.trim(),
                    type: typeSelect ? typeSelect.value : 'string',
                    defaultValue: defaultInput && defaultInput.value ? convertDefaultValue(defaultInput.value, typeSelect.value) : undefined,
                    required: requiredCheckbox ? requiredCheckbox.checked : false
                });
            }
        });
        
        // Collect output parameters
        const outputs = [];
        const outputRows = document.querySelectorAll('#output-params-container .param-row');
        
        outputRows.forEach(row => {
            const nameInput = row.querySelector('.param-name');
            const typeSelect = row.querySelector('.param-type');
            const descriptionInput = row.querySelector('.param-description');
            
            if (nameInput && nameInput.value.trim()) {
                outputs.push({
                    name: nameInput.value.trim(),
                    type: typeSelect ? typeSelect.value : 'string',
                    description: descriptionInput ? descriptionInput.value : ''
                });
            }
        });
        
        // Get the module ID (if editing)
        const moduleId = editorContainer.dataset.moduleId;
        
        // Prepare module data
        const moduleData = {
            name: moduleName,
            description: moduleDescription,
            category: category,
            flowId: moduleFlow || null,
            inputs: inputs,
            outputs: outputs,
            cacheable: moduleCacheable,
            async: moduleAsync,
            standalone: moduleStandalone,
            modified: Date.now()
        };
        
        if (moduleId) {
            // Update existing module
            const module = _microModules[moduleId];
            if (module) {
                // Preserve the created timestamp
                moduleData.created = module.created;
                
                // Update module
                _microModules[moduleId] = {
                    ...module,
                    ...moduleData,
                    id: moduleId
                };
            }
        } else {
            // Create new module
            const newModuleId = _generateId();
            
            _microModules[newModuleId] = {
                id: newModuleId,
                ...moduleData,
                created: Date.now()
            };
        }
        
        // Save to storage
        _saveSettings();
        
        // Hide the form
        hideModuleEditForm();
        
        // Refresh the modules list
        loadModules();
        
        // Show success message
        alert(`Module ${moduleId ? 'updated' : 'created'} successfully.`);
    }
    
    /**
     * Convert a default value string to the appropriate type
     * @param {string} value - The value to convert
     * @param {string} type - The parameter type
     * @returns {*} The converted value
     */
    function convertDefaultValue(value, type) {
        switch (type) {
            case 'number':
                return parseFloat(value);
                
            case 'boolean':
                return value.toLowerCase() === 'true';
                
            case 'object':
            case 'array':
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
                
            default:
                return value;
        }
    }
    
    /**
     * Edit the current module
     */
    function editCurrentModule() {
        // Get the current module ID from the detail container
        const detailContainer = document.getElementById('module-detail-container');
        if (!detailContainer) return;
        
        // Hide the detail container
        hideModuleDetail();
        
        // Show the editor with the current module
        const moduleId = detailContainer.querySelector('.module-detail-name')?.textContent;
        
        // Find the module with this name
        let foundModuleId = null;
        for (const [id, module] of Object.entries(_microModules)) {
            if (module.name === moduleId) {
                foundModuleId = id;
                break;
            }
        }
        
        if (foundModuleId) {
            showModuleEditForm(foundModuleId);
        } else {
            alert('Could not find the module to edit.');
        }
    }
    
    /**
     * Export the current module
     */
    function exportCurrentModule() {
        // Get the current module ID from the detail container
        const detailContainer = document.getElementById('module-detail-container');
        if (!detailContainer) return;
        
        // Get the module name
        const moduleName = detailContainer.querySelector('.module-detail-name h3')?.textContent;
        if (!moduleName) return;
        
        // Find the module with this name
        let moduleToExport = null;
        for (const module of Object.values(_microModules)) {
            if (module.name === moduleName) {
                moduleToExport = module;
                break;
            }
        }
        
        if (!moduleToExport) {
            alert('Could not find the module to export.');
            return;
        }
        
        // Create export data
        const exportData = JSON.stringify(moduleToExport, null, 2);
        
        // Create a download link
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${moduleToExport.name.replace(/\s+/g, '_')}_module.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import a module from a file
     */
    function importModule() {
        // Create a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        // Handle file selection
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const module = JSON.parse(event.target.result);
                    
                    // Validate module data
                    if (!module.name || !module.description || !module.category) {
                        throw new Error('Invalid module data');
                    }
                    
                    // Generate a new ID to prevent overwriting existing modules
                    module.id = _generateId();
                    module.imported = true;
                    module.importedAt = Date.now();
                    
                    // Add to modules
                    _microModules[module.id] = module;
                    
                    // Save to storage
                    _saveSettings();
                    
                    // Reload modules
                    loadModules();
                    
                    // Show notification
                    alert(`Module "${module.name}" imported successfully.`);
                } catch (error) {
                    alert(`Failed to import module: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        // Trigger file selection
        input.click();
    }
    
    /**
     * Register built-in node types for flows
     */
    function _registerBuiltInNodeTypes() {
        // WordPress API nodes
        _nodeTypes['wp-api-get'] = {
            type: 'wp-api-get',
            category: 'wordpress-api',
            name: 'WP API Get',
            description: 'Get data from WordPress REST API',
            inputs: [
                { name: 'endpoint', type: 'string', required: true },
                { name: 'params', type: 'object', required: false }
            ],
            outputs: [
                { name: 'data', type: 'object' },
                { name: 'error', type: 'object' }
            ]
        };
        
        _nodeTypes['wp-api-post'] = {
            type: 'wp-api-post',
            category: 'wordpress-api',
            name: 'WP API Post',
            description: 'Send data to WordPress REST API',
            inputs: [
                { name: 'endpoint', type: 'string', required: true },
                { name: 'data', type: 'object', required: true }
            ],
            outputs: [
                { name: 'response', type: 'object' },
                { name: 'error', type: 'object' }
            ]
        };
        
        // Data processing nodes
        _nodeTypes['transform-data'] = {
            type: 'transform-data',
            category: 'data-processing',
            name: 'Transform Data',
            description: 'Transform data using JavaScript',
            inputs: [
                { name: 'data', type: 'object', required: true },
                { name: 'transformation', type: 'string', required: true }
            ],
            outputs: [
                { name: 'result', type: 'object' },
                { name: 'error', type: 'object' }
            ]
        };
        
        _nodeTypes['filter-data'] = {
            type: 'filter-data',
            category: 'data-processing',
            name: 'Filter Data',
            description: 'Filter data using conditions',
            inputs: [
                { name: 'data', type: 'array', required: true },
                { name: 'condition', type: 'string', required: true }
            ],
            outputs: [
                { name: 'result', type: 'array' },
                { name: 'error', type: 'object' }
            ]
        };
        
        // Utility nodes
        _nodeTypes['conditional'] = {
            type: 'conditional',
            category: 'utility',
            name: 'Conditional',
            description: 'Branch based on a condition',
            inputs: [
                { name: 'condition', type: 'boolean', required: true }
            ],
            outputs: [
                { name: 'true', type: 'any' },
                { name: 'false', type: 'any' }
            ]
        };
        
        _nodeTypes['delay'] = {
            type: 'delay',
            category: 'utility',
            name: 'Delay',
            description: 'Delay execution for a specified time',
            inputs: [
                { name: 'data', type: 'any', required: true },
                { name: 'delay', type: 'number', required: true, defaultValue: 1000 }
            ],
            outputs: [
                { name: 'data', type: 'any' }
            ]
        };
    }
    
    /**
     * Clear the API cache
     */
    function clearAPICache() {
        _apiSchemaCache.clear();
        alert('API cache cleared successfully.');
    }
    
    /**
     * Export all data
     */
    function exportAllData() {
        // Prepare export data
        const exportData = {
            version: 1,
            timestamp: Date.now(),
            settings: _settings,
            sites: _sites,
            currentSite: _currentSite,
            flows: _flows,
            microModules: _microModules,
            pluginRegistry: _pluginRegistry
        };
        
        // Convert to JSON
        const exportJson = JSON.stringify(exportData, null, 2);
        
        // Create a download link
        const blob = new Blob([exportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `wordpress_connector_data_${new Date().toISOString().slice(0, 10)}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import all data
     */
    function importAllData() {
        // Create a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        // Handle file selection
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate data
                    if (!data.version || !data.timestamp || !data.settings || !data.sites) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Confirm import
                    if (confirm('This will replace all your current WordPress Connector data. Do you want to continue?')) {
                        // Import data
                        _settings = data.settings;
                        _sites = data.sites;
                        _currentSite = data.currentSite;
                        _flows = data.flows || {};
                        _microModules = data.microModules || {};
                        _pluginRegistry = data.pluginRegistry || {};
                        
                        // Save to storage
                        _saveSettings();
                        
                        // Refresh UI
                        refreshUI();
                        
                        // Show notification
                        alert('Data imported successfully.');
                    }
                } catch (error) {
                    alert(`Failed to import data: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        // Trigger file selection
        input.click();
    }
    
    /**
     * Reset all data
     */
    function resetAllData() {
        // Clear all data
        _settings = {
            defaultRestBase: '/wp-json',
            defaultAPIVersion: 'wp/v2',
            connectionTimeout: 30000,
            cacheExpiration: 3600000,
            enableOfflineMode: true,
            autoReconnect: true,
            maxReconnectAttempts: 5,
            pollingInterval: 60000,
            maxConcurrentRequests: 10
        };
        
        _sites = [];
        _currentSite = null;
        _flows = {};
        _microModules = {};
        _pluginRegistry = {};
        _apiSchemaCache.clear();
        
        // Initialize a default site
        _initializeDefaultSite();
        
        // Save to storage
        _saveSettings();
        
        // Refresh UI
        refreshUI();
        
        // Show notification
        alert('All data has been reset successfully.');
    }
    
    /**
     * Load settings from localStorage
     */
    function _loadFromStorage() {
        try {
            const storedData = localStorage.getItem('wp_connector_data');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                
                if (parsedData.settings) _settings = { ..._settings, ...parsedData.settings };
                if (parsedData.sites) _sites = parsedData.sites;
                if (parsedData.currentSite) _currentSite = parsedData.currentSite;
                if (parsedData.flows) _flows = parsedData.flows;
                if (parsedData.microModules) _microModules = parsedData.microModules;
            }
        } catch (error) {
            console.error('Failed to load settings from storage:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    function _saveSettings() {
        try {
            // Sanitize sites data before saving to avoid storing sensitive credentials
            const sitesToStore = _sites.map(site => {
                const siteCopy = { ...site };
                if (siteCopy.auth) {
                    siteCopy.auth = { ...siteCopy.auth }; // Clone auth object
                    // Remove sensitive fields before saving
                    delete siteCopy.auth.password;
                    delete siteCopy.auth.token; // Assuming JWT tokens are sensitive
                    delete siteCopy.auth.clientSecret; // For OAuth
                    // For JWT/OAuth, accessToken might be stored if it's considered session-like
                    // but long-lived tokens or refresh tokens should be handled with more care.
                    // For this iteration, we'll assume accessToken is okay for sessionStorage behavior,
                    // but not for localStorage. Since this saves to localStorage, we'll clear it.
                    delete siteCopy.auth.accessToken;
                    delete siteCopy.auth.refreshToken;
                }
                return siteCopy;
            });

            const dataToStore = {
                settings: _settings,
                sites: sitesToStore, // Save the sanitized sites
                currentSite: _currentSite,
                flows: _flows,
                microModules: _microModules
                // pluginRegistry is not saved to keep localStorage smaller; it's fetched on demand.
                // apiSchemaCache is not saved.
            };
            
            localStorage.setItem('wp_connector_data', JSON.stringify(dataToStore));
            window.debugLog('[WordPressConnector] Settings saved to localStorage.');
        } catch (error) {
            console.error('Failed to save settings to storage:', error); // Keep critical error
        }
    }
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    function _generateId() {
        return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    }
    
    // Public API
    return {
        init,
        toggleConnectorPanel,
        
        // Site management
        getSites: () => [..._sites],
        getCurrentSite: () => _currentSite ? _sites.find(s => s.id === _currentSite) : null,
        addSite: (siteData) => {
            // Placeholder for a public method to add a site
            // This would validate and process the site data before adding
            const newSite = {
                id: _generateId(),
                ...siteData,
                created: Date.now()
            };
            
            _sites.push(newSite);
            
            // Set as current site if it's the first one
            if (_sites.length === 1) {
                _currentSite = newSite.id;
            }
            
            _saveSettings();
            refreshUI();
            
            return newSite;
        },
        
        // Plugin API
        getPlugins: (siteId = null) => {
            const site = siteId || _currentSite;
            return _pluginRegistry[site] || [];
        },
        
        // Content API
        fetchContent: async (contentType, params = {}, siteId = null) => {
            const site = _sites.find(s => s.id === (siteId || _currentSite));
            if (!site) return null;
            
            const apiUrl = buildApiUrl(
                site.url, 
                site.restBase || _settings.defaultRestBase, 
                site.apiVersion || _settings.defaultAPIVersion
            ) + `/${contentType}`;
            
            // Build query string for params
            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                queryParams.append(key, value);
            }
            
            const requestUrl = `${apiUrl}?${queryParams.toString()}`;
            
            // Get authentication headers
            const authHeaders = getSiteAuthHeaders(site);
            
            try {
                const response = await fetch(requestUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        ...authHeaders
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`Failed to fetch ${contentType}:`, error);
                return null;
            }
        },
        
        // Flow API
        getFlows: () => Object.values(_flows),
        createFlow: (name, description = '') => {
            return createNewFlow(name);
        },
        
        // Module API
        getModules: () => Object.values(_microModules),
        createModule: (moduleData) => {
            const moduleId = _generateId();
            
            _microModules[moduleId] = {
                id: moduleId,
                ...moduleData,
                created: Date.now()
            };
            
            _saveSettings();
            
            return _microModules[moduleId];
        },
        executeModule: async (moduleId, inputs = {}) => {
            const module = _microModules[moduleId];
            if (!module) return null;
            
            // This would be implemented with actual module execution logic
            // For now, return simulated results
            
            // Determine which type of simulator to use
            let simulator;
            switch (module.category) {
                case 'content':
                    simulator = simulateContentModuleResults;
                    break;
                case 'user':
                    simulator = simulateUserModuleResults;
                    break;
                case 'media':
                    simulator = simulateMediaModuleResults;
                    break;
                default:
                    simulator = simulateGenericModuleResults;
            }
            
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return simulated results
            return simulator(module, inputs);
        },
        
        // WordPress API integration
        callApi: async (endpoint, method = 'GET', data = null, siteId = null) => {
            const site = _sites.find(s => s.id === (siteId || _currentSite));
            if (!site) return null;
            
            const apiUrl = buildApiUrl(
                site.url, 
                site.restBase || _settings.defaultRestBase, 
                site.apiVersion || _settings.defaultAPIVersion
            ) + endpoint;
            
            // Get authentication headers
            const authHeaders = getSiteAuthHeaders(site);
            
            // Setup request options
            const options = {
                method,
                headers: {
                    'Accept': 'application/json',
                    ...authHeaders
                }
            };
            
            // Add body for non-GET requests
            if (method !== 'GET' && data) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
            
            try {
                const response = await fetch(apiUrl, options);
                
                // Read response status and headers
                const responseHeaders = {};
                response.headers.forEach((value, name) => {
                    responseHeaders[name] = value;
                });
                
                // Parse response body
                let responseBody;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    responseBody = await response.json();
                } else {
                    responseBody = await response.text();
                }
                
                return {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                    body: responseBody,
                    ok: response.ok
                };
            } catch (error) {
                console.error(`API call failed (${method} ${endpoint}):`, error);
                
                return {
                    status: 0,
                    statusText: error.message,
                    headers: {},
                    body: null,
                    ok: false,
                    error: error.message
                };
            }
        },
        
        // Event system
        on: (eventType, callback) => {
            return subscribeToEvent(eventType, callback);
        },
        
        // Settings access
        getSettings: () => ({..._settings}),
        updateSettings: (newSettings) => {
            _settings = {..._settings, ...newSettings};
            _saveSettings();
        }
    };
})();

// Initialize WordPress Connector when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Add necessary styles
    const styles = document.createElement('style');
    styles.textContent = `
        /* WordPress Connector Styles */
        .glass-panel {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .glass-button {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 8px 16px;
            color: #333;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .glass-button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .glass-button.primary {
            background: rgba(79, 70, 229, 0.2);
            color: #4f46e5;
        }
        
        .glass-button.primary:hover {
            background: rgba(79, 70, 229, 0.3);
        }
        
        .glass-button.danger {
            background: rgba(220, 38, 38, 0.2);
            color: #dc2626;
        }
        
        .glass-button.danger:hover {
            background: rgba(220, 38, 38, 0.3);
        }
        
        .glass-button.small {
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .glass-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }
        
        .glass-table th,
        .glass-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-table th {
            font-weight: 600;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .wp-connector-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 90%;
            max-width: 1200px;
            max-height: 800px;
            display: flex;
            flex-direction: column;
            z-index: 1000;
        }
        
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .panel-header h2 {
            margin: 0;
            font-size: 20px;
        }
        
        .panel-controls {
            display: flex;
            gap: 8px;
        }
        
        .panel-tabs {
            display: flex;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .tab-button {
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-weight: 500;
            color: #555;
        }
        
        .tab-button.active {
            border-bottom-color: #4f46e5;
            color: #4f46e5;
        }
        
        .panel-body {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .wp-connector-sidebar {
            width: 250px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 16px;
        }
        
        .site-selector {
            margin-bottom: 16px;
        }
        
        .site-selector label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .site-selector select {
            width: 100%;
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-section {
            margin-bottom: 24px;
        }
        
        .sidebar-section h4 {
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .sidebar-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sidebar-list li {
            margin-bottom: 4px;
        }
        
        .sidebar-list a {
            display: block;
            padding: 8px 12px;
            border-radius: 5px;
            color: #333;
            text-decoration: none;
            transition: background-color 0.3s ease;
        }
        
        .sidebar-list a:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-list a.active {
            background-color: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
        }
        
        .wp-connector-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        
        .hidden {
            display: none !important;
        }
        
        /* Site Manager Styles */
        .site-manager-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .site-list-container {
            margin-bottom: 16px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-badge.active {
            background-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .status-badge.inactive {
            background-color: rgba(156, 163, 175, 0.2);
            color: #6b7280;
        }
        
        .status-badge.online {
            background-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .status-badge.offline {
            background-color: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        
        .status-badge.unknown {
            background-color: rgba(156, 163, 175, 0.2);
            color: #6b7280;
        }
        
        .status-badge.checking {
            background-color: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        
        .site-edit-container {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="password"],
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: rgba(255, 255, 255, 0.9);
        }
        
        .form-help {
            display: block;
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .radio-group,
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .form-actions {
            display: flex;
            gap: 8px;
            margin-top: 24px;
        }
        
        .actions-col {
            white-space: nowrap;
        }
        
        /* Plugin Explorer Styles */
        .plugin-explorer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .plugin-explorer-controls {
            display: flex;
            gap: 8px;
        }
        
        .search-box {
            display: flex;
            align-items: center;
        }
        
        .search-box input {
            padding: 8px;
            border-radius: 5px 0 0 5px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-right: none;
            background: rgba(255, 255, 255, 0.9);
        }
        
        .search-box button {
            border-radius: 0 5px 5px 0;
        }
        
        .plugin-filters {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
            padding: 12px;
        }
        
        .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .filter-group label {
            font-weight: 500;
            white-space: nowrap;
        }
        
        .filter-group select {
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: rgba(255, 255, 255, 0.9);
        }
        
        .api-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            background-color: rgba(79, 70, 229, 0.2);
            color: #4f46e5;
        }
        
        .plugin-detail-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
            padding: 20px;
        }
        
        .plugin-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .plugin-detail-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px 16px;
            margin-bottom: 20px;
        }
        
        .detail-label {
            font-weight: 600;
        }
        
        .plugin-api-actions {
            margin-top: 20px;
            display: flex;
            gap: 8px;
        }
        
        /* Content Browser Styles */
        .content-browser-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .content-type-selector {
            margin-bottom: 16px;
        }
        
        .content-browser-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .content-filters {
            display: flex;
            gap: 16px;
            padding: 12px;
        }
        
        .taxonomy-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .content-pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
        }
        
        .title-cell {
            min-width: 200px;
        }
        
        .media-cell {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .media-thumbnail {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .content-detail-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
            padding: 20px;
        }
        
        .content-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .content-detail-grid {
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 20px;
        }
        
        .content-meta {
            padding: 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        
        .content-meta-item {
            margin-bottom: 12px;
        }
        
        .meta-label {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .content-preview {
            padding: 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        
        .media-preview {
            margin: 20px 0;
            text-align: center;
        }
        
        .media-image {
            max-width: 100%;
            max-height: 400px;
            border-radius: 8px;
        }
        
        /* Flow Editor Styles */
        .flow-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .flow-editor-controls {
            display: flex;
            gap: 8px;
        }
        
        .flow-editor-container {
            display: flex;
            height: calc(100vh - 200px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .flow-editor-sidebar {
            width: 250px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
        }
        
        .sidebar-header {
            padding: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-search {
            margin-top: 8px;
        }
        
        .sidebar-search input {
            width: 100%;
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: rgba(255, 255, 255, 0.9);
        }
        
        .node-categories {
            padding: 12px;
        }
        
        .node-category {
            margin-bottom: 16px;
        }
        
        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            cursor: pointer;
        }
        
        .category-header h5 {
            margin: 0;
            font-size: 14px;
        }
        
        .toggle-category {
            background: transparent;
            border: none;
            cursor: pointer;
            color: #555;
        }
        
        .flow-editor-canvas {
            flex: 1;
            background: rgba(245, 245, 245, 0.1);
            position: relative;
            overflow: auto;
        }
        
        .flow-canvas-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 20px;
            text-align: center;
            color: #6b7280;
        }
        
        .flow-editor-inspector {
            width: 300px;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            padding: 16px;
            overflow-y: auto;
        }
        
        .inspector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .flow-execution-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 500px;
            max-height: 400px;
            z-index: 1002;
            padding: 16px;
            display: flex;
            flex-direction: column;
        }
        
        .execution-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .execution-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .execution-log {
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 16px;
            height: 200px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin-bottom: 4px;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .log-entry.info {
            color: #60a5fa;
        }
        
        .log-entry.success {
            color: #34d399;
        }
        
        .log-entry.warning {
            color: #fbbf24;
        }
        
        .log-entry.error {
            color: #f87171;
        }
        
        /* Micro Module Styles */
        .micro-module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .micro-module-filters {
            display: flex;
            gap: 16px;
            padding: 12px;
            margin-bottom: 16px;
        }
        
        .micro-module-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }
        
        .module-card {
            display: flex;
            flex-direction: column;
            height: 200px;
        }
        
        .module-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .module-name {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .module-category-badge {
            padding: 2px 8px;
            border-radius: 16px;
            font-size: 10px;
            background-color: rgba(79, 70, 229, 0.2);
            color: #4f46e5;
        }
        
        .module-card-body {
            flex: 1;
            padding: 12px;
            overflow: hidden;
        }
        
        .module-description {
            font-size: 14px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
        }
        
        .module-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .module-date {
            font-size: 12px;
            color: #6b7280;
        }
        
        .module-actions {
            display: flex;
            gap: 8px;
        }
        
        .module-card.placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            text-align: center;
            color: #6b7280;
        }
        
        .module-detail-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
            padding: 20px;
        }
        
        .module-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .module-detail-name {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .module-detail-content {
            padding: 16px;
        }
        
        .params-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 16px 0;
        }
        
        .params-table th,
        .params-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .params-table th {
            font-weight: 600;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .options-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 16px;
        }
        
        .option-item {
            display: flex;
            flex-direction: column;
        }
        
        .option-label {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .module-editor-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
            padding: 20px;
        }
        
        .module-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .param-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .params-container {
            margin-bottom: 16px;
        }
        
        .param-row .param-name {
            flex: 2;
        }
        
        .param-row .param-type {
            flex: 1;
        }
        
        .param-row .param-default,
        .param-row .param-description {
            flex: 2;
        }
        
        .param-row .param-required {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
        }
        
        /* Module Use Modal */
        .wp-module-modal,
        .wp-test-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1002;
        }
        
        .module-modal-content,
        .test-modal-content {
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 20px;
        }
        
        .module-modal-header,
        .test-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .module-inputs-form {
            margin-bottom: 20px;
        }
        
        .input-description {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .module-execution-results {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .execution-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .status-spinner {
            color: #60a5fa;
        }
        
        .status-icon.success {
            color: #34d399;
        }
        
        .status-icon.error {
            color: #f87171;
        }
        
        .execution-output {
            margin-top: 16px;
        }
        
        .execution-summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .summary-item {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 8px;
        }
        
        .summary-label {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .output-data {
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 16px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .copy-output-btn {
            margin-top: 8px;
        }
        
        /* API Endpoint Testing */
        .endpoint-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 5px;
        }
        
        .method-badge {
            padding: 4px 8px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 600;
            font-family: monospace;
        }
        
        .method-badge.get {
            background-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .method-badge.post {
            background-color: rgba(79, 70, 229, 0.2);
            color: #4f46e5;
        }
        
        .method-badge.put {
            background-color: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        
        .method-badge.delete {
            background-color: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        
        .endpoint-url {
            font-family: monospace;
            flex: 1;
            overflow-x: auto;
            white-space: nowrap;
        }
        
        .response-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .status-code {
            padding: 4px 8px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 600;
            font-family: monospace;
        }
        
        .status-code.success {
            background-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .status-code.warning {
            background-color: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        
        .status-code.error {
            background-color: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        
        /* API Endpoints Styling */
        .api-namespace {
            margin-bottom: 24px;
        }
        
        .namespace-title {
            margin-top: 0;
            margin-bottom: 12px;
            font-size: 18px;
            color: #4f46e5;
        }
        
        .endpoint-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .endpoint-item {
            padding: 12px;
        }
        
        .endpoint-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .endpoint-route {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .endpoint-methods {
            font-family: monospace;
            font-size: 12px;
            font-weight: 600;
            color: #4f46e5;
        }
        
        .endpoint-path {
            font-family: monospace;
        }
        
        .endpoint-actions {
            display: flex;
            gap: 8px;
        }
        
        .endpoint-params {
            margin-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 12px;
        }
        
        .plugin-api-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        /* Other utility styles */
        .loading-message {
            text-align: center;
            padding: 20px;
            color: #6b7280;
        }
        
        .error-message {
            text-align: center;
            padding: 20px;
            color: #ef4444;
        }
        
        .empty-message {
            text-align: center;
            padding: 20px;
            color: #6b7280;
        }
        
        /* Make inputs invalid if they fail validation */
        input.invalid,
        textarea.invalid {
            border-color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        /* Media queries for responsive design */
        @media (max-width: 768px) {
            .wp-connector-panel {
                width: 95%;
                height: 95%;
                max-width: none;
                max-height: none;
            }
            
            .panel-body {
                flex-direction: column;
            }
            
            .wp-connector-sidebar {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .content-detail-grid {
                grid-template-columns: 1fr;
            }
            
            .flow-editor-container {
                flex-direction: column;
                height: auto;
            }
            
            .flow-editor-sidebar {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .flow-editor-inspector {
                width: 100%;
                border-left: none;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .micro-module-grid {
                grid-template-columns: 1fr;
            }
            
            .options-grid {
                grid-template-columns: 1fr;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                font-size: 16px; /* Prevent zoom on mobile */
            }
            
            .param-row {
                flex-direction: column;
                gap: 4px;
            }
            
            .param-row > * {
                width: 100%;
            }
        }
    `;
    
    // Append the remaining styles
    styles.textContent += remainingStyles;
    
    // Add the styles to the document
    document.head.appendChild(styles);
    
    // Initialize the WordPress Connector
    window.debugLog('[WordPressConnector] Calling WordPressConnector.init() from DOMContentLoaded listener.');
    WordPressConnector.init();
    
    // Expose the WordPress Connector to the global scope for developers
    window.WordPressConnector = WordPressConnector;
    window.debugLog('[WordPressConnector] Assigned to window.WordPressConnector.');
});
// window.debugLog('[WordPressConnector] IIFE end.'); // Removed
// window.debugLog('[WordPressConnector] Script execution end.'); // Removed

/**
 * Module Export for Integration with PHP-WASM Builder
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        name: 'WordPress Connector',
        version: '1.0.0',
        description: 'A comprehensive WordPress integration system that connects to WordPress instances, exposes plugin APIs, and provides a foundation for micro-module architecture.',
        
        // Module methods
        initialize: function() {
            // This will be called by the PHP-WASM Builder when loading the module
            if (typeof window !== 'undefined') {
                // Make sure the DOM is ready
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    WordPressConnector.init();
                } else {
                    document.addEventListener('DOMContentLoaded', WordPressConnector.init);
                }
                
                // Expose the API
                return WordPressConnector;
            }
            return null;
        },
        
        // Module configuration schema
        configSchema: {
            defaultRestBase: {
                type: 'string',
                default: '/wp-json',
                label: 'Default REST API Base',
                description: 'The default REST API base path for WordPress sites'
            },
            defaultAPIVersion: {
                type: 'string',
                default: 'wp/v2',
                label: 'Default API Version',
                description: 'The default API version for WordPress REST API'
            },
            connectionTimeout: {
                type: 'number',
                default: 30000,
                label: 'Connection Timeout (ms)',
                description: 'Timeout for API connections in milliseconds'
            },
            cacheExpiration: {
                type: 'number',
                default: 3600000,
                label: 'Cache Expiration (ms)',
                description: 'Time before cached API responses expire'
            },
            enableOfflineMode: {
                type: 'boolean',
                default: true,
                label: 'Enable Offline Mode',
                description: 'Allow working with cached data when offline'
            },
            autoReconnect: {
                type: 'boolean',
                default: true,
                label: 'Auto Reconnect',
                description: 'Automatically try to reconnect to sites when connection is lost'
            }
        },
        
        // Module dependencies
        dependencies: [],
        
        // Module activation hooks
        onActivate: function() {
            console.log('WordPress Connector module activated');
            
            // Add module to navigation
            if (typeof window !== 'undefined' && window.PHPWasmBuilder && window.PHPWasmBuilder.Navigation) {
                window.PHPWasmBuilder.Navigation.addMenuItem({
                    id: 'wp-connector',
                    label: 'WordPress',
                    icon: 'fab fa-wordpress',
                    onClick: function() {
                        WordPressConnector.toggleConnectorPanel();
                    }
                });
            }
            
            return true;
        },
        
        // Module deactivation hooks
        onDeactivate: function() {
            console.log('WordPress Connector module deactivated');
            
            // Remove module from navigation
            if (typeof window !== 'undefined' && window.PHPWasmBuilder && window.PHPWasmBuilder.Navigation) {
                window.PHPWasmBuilder.Navigation.removeMenuItem('wp-connector');
            }
            
            return true;
        }
    };
}

/**
 * Integration with BrainJS for Intelligent Micro-Module Creation
 * 
 * This extension adds AI capabilities to the WordPress Connector module,
 * allowing it to intelligently create micro-modules based on user queries
 * by analyzing WordPress APIs and plugin endpoints.
 */
class WordPressAIExtension {
    constructor(wpConnector) {
        this.wpConnector = wpConnector;
        this.brain = null;
        this.initialized = false;
        this.moduleTemplates = {};
        this.pluginSchemas = {};
        this.apiPatterns = {};
    }
    
    /**
     * Initialize the AI extension
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.initialized) return true;
        
        console.log('Initializing WordPress AI Extension...');
        
        try {
            // Load BrainJS (if not already loaded)
            await this.loadBrainJS();
            
            // Load module templates
            await this.loadModuleTemplates();
            
            // Initialize neural network
            await this.initializeNeuralNetwork();
            
            this.initialized = true;
            console.log('WordPress AI Extension initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize WordPress AI Extension:', error);
            return false;
        }
    }
    
    /**
     * Load BrainJS library
     * @returns {Promise<void>}
     */
    async loadBrainJS() {
        if (window.brain) {
            this.brain = window.brain;
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/brain.js/2.0.0-beta.2/brain-browser.min.js';
            script.onload = () => {
                this.brain = window.brain;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load BrainJS'));
            };
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load module templates
     * @returns {Promise<void>}
     */
    async loadModuleTemplates() {
        // These would typically be loaded from a server or embedded in the application
        // For demo purposes, we'll define some basic templates here
        
        this.moduleTemplates = {
            'content-fetch': {
                name: 'Content Fetcher',
                description: 'Fetches content from WordPress based on criteria',
                category: 'content',
                inputs: [
                    { name: 'contentType', type: 'string', required: true, defaultValue: 'posts' },
                    { name: 'limit', type: 'number', required: false, defaultValue: 10 },
                    { name: 'filters', type: 'object', required: false }
                ],
                outputs: [
                    { name: 'items', type: 'array', description: 'Content items' },
                    { name: 'total', type: 'number', description: 'Total number of items' }
                ],
                flowTemplate: [
                    { id: 'start', type: 'start', position: { x: 100, y: 100 } },
                    { id: 'wp-api-get', type: 'wp-api-get', position: { x: 100, y: 200 } },
                    { id: 'transform-data', type: 'transform-data', position: { x: 100, y: 300 } },
                    { id: 'end', type: 'end', position: { x: 100, y: 400 } }
                ],
                connections: [
                    { source: 'start', target: 'wp-api-get' },
                    { source: 'wp-api-get', target: 'transform-data' },
                    { source: 'transform-data', target: 'end' }
                ]
            },
            'content-create': {
                name: 'Content Creator',
                description: 'Creates new content in WordPress',
                category: 'content',
                inputs: [
                    { name: 'contentType', type: 'string', required: true, defaultValue: 'posts' },
                    { name: 'content', type: 'object', required: true }
                ],
                outputs: [
                    { name: 'createdItem', type: 'object', description: 'Created content item' },
                    { name: 'success', type: 'boolean', description: 'Whether creation was successful' }
                ],
                flowTemplate: [
                    { id: 'start', type: 'start', position: { x: 100, y: 100 } },
                    { id: 'wp-api-post', type: 'wp-api-post', position: { x: 100, y: 200 } },
                    { id: 'end', type: 'end', position: { x: 100, y: 300 } }
                ],
                connections: [
                    { source: 'start', target: 'wp-api-post' },
                    { source: 'wp-api-post', target: 'end' }
                ]
            },
            'user-auth': {
                name: 'User Authentication',
                description: 'Handles user authentication with WordPress',
                category: 'user',
                inputs: [
                    { name: 'username', type: 'string', required: true },
                    { name: 'password', type: 'string', required: true }
                ],
                outputs: [
                    { name: 'token', type: 'string', description: 'Authentication token' },
                    { name: 'user', type: 'object', description: 'User information' }
                ],
                flowTemplate: [
                    { id: 'start', type: 'start', position: { x: 100, y: 100 } },
                    { id: 'wp-api-post', type: 'wp-api-post', position: { x: 100, y: 200 } },
                    { id: 'transform-data', type: 'transform-data', position: { x: 100, y: 300 } },
                    { id: 'end', type: 'end', position: { x: 100, y: 400 } }
                ],
                connections: [
                    { source: 'start', target: 'wp-api-post' },
                    { source: 'wp-api-post', target: 'transform-data' },
                    { source: 'transform-data', target: 'end' }
                ]
            }
        };
    }
    
    /**
     * Initialize the neural network
     * @returns {Promise<void>}
     */
    async initializeNeuralNetwork() {
        // Create a simple neural network
        this.net = new this.brain.NeuralNetwork({
            hiddenLayers: [20, 20],
            activation: 'sigmoid'
        });
        
        // Train with basic patterns for demo purposes
        // In a real implementation, this would be trained with a much larger dataset
        const trainingData = [
            { input: { query: 'get posts' }, output: { contentFetch: 1 } },
            { input: { query: 'fetch articles' }, output: { contentFetch: 1 } },
            { input: { query: 'retrieve pages' }, output: { contentFetch: 1 } },
            { input: { query: 'list media' }, output: { contentFetch: 1 } },
            { input: { query: 'download images' }, output: { contentFetch: 1 } },
            
            { input: { query: 'create post' }, output: { contentCreate: 1 } },
            { input: { query: 'add new page' }, output: { contentCreate: 1 } },
            { input: { query: 'submit article' }, output: { contentCreate: 1 } },
            { input: { query: 'write blog post' }, output: { contentCreate: 1 } },
            { input: { query: 'publish content' }, output: { contentCreate: 1 } },
            
            { input: { query: 'user login' }, output: { userAuth: 1 } },
            { input: { query: 'authenticate user' }, output: { userAuth: 1 } },
            { input: { query: 'sign in' }, output: { userAuth: 1 } },
            { input: { query: 'login credentials' }, output: { userAuth: 1 } },
            { input: { query: 'validate user' }, output: { userAuth: 1 } }
        ];
        
        // Convert text queries to word frequency vectors
        const processedTrainingData = trainingData.map(item => {
            return {
                input: this.vectorizeText(item.input.query),
                output: item.output
            };
        });
        
        // Train the network
        await this.net.trainAsync(processedTrainingData, {
            iterations: 2000,
            errorThresh: 0.005,
            log: true,
            logPeriod: 500
        });
        
        console.log('Neural network trained successfully');
    }
    
    /**
     * Convert text to a word frequency vector
     * @param {string} text - Input text
     * @returns {Object} Word frequency vector
     */
    vectorizeText(text) {
        // Simple word frequency vectorization
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);
        const vector = {};
        
        words.forEach(word => {
            vector[word] = (vector[word] || 0) + 1;
        });
        
        return vector;
    }
    
    /**
     * Generate a module based on a user query
     * @param {string} query - User query
     * @returns {Promise<Object>} Generated module
     */
    async generateModule(query) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Vectorize the query
        const queryVector = this.vectorizeText(query);
        
        // Get neural network prediction
        const prediction = this.net.run(queryVector);
        
        // Find best matching template
        let bestTemplateId = null;
        let highestScore = 0;
        
        for (const [templateId, score] of Object.entries(prediction)) {
            if (score > highestScore) {
                highestScore = score;
                bestTemplateId = templateId;
            }
        }
        
        // If confidence is too low, use a default template
        if (highestScore < 0.5) {
            bestTemplateId = 'content-fetch';
        }
        
        // Map template IDs to actual templates
        const templateMap = {
            'contentFetch': 'content-fetch',
            'contentCreate': 'content-create',
            'userAuth': 'user-auth'
        };
        
        const templateId = templateMap[bestTemplateId] || 'content-fetch';
        const template = this.moduleTemplates[templateId];
        
        // Generate module based on template
        const module = await this.customizeModuleFromTemplate(template, query);
        
        return module;
    }
    
    /**
     * Customize a module from a template based on the query
     * @param {Object} template - Module template
     * @param {string} query - User query
     * @returns {Promise<Object>} Customized module
     */
    async customizeModuleFromTemplate(template, query) {
        // Extract parameters from query
        const params = this.extractParametersFromQuery(query);
        
        // Create a new module ID
        const moduleId = 'module_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        
        // Generate module name
        const moduleName = this.generateModuleName(query, template);
        
        // Generate module description
        const moduleDescription = this.generateModuleDescription(query, template);
        
        // Create a flow for this module
        const flowId = await this.createFlowFromTemplate(template, params, moduleId);
        
        // Create the module
        const module = {
            id: moduleId,
            name: moduleName,
            description: moduleDescription,
            category: template.category,
            flowId: flowId,
            inputs: template.inputs.map(input => {
                // Try to match parameters from query
                const matchedParam = params[input.name];
                if (matchedParam !== undefined) {
                    return {
                        ...input,
                        defaultValue: matchedParam
                    };
                }
                return input;
            }),
            outputs: template.outputs,
            cacheable: true,
            async: false,
            standalone: false,
            created: Date.now(),
            query: query
        };
        
        return module;
    }
    
    /**
     * Extract parameters from a user query
     * @param {string} query - User query
     * @returns {Object} Extracted parameters
     */
    extractParametersFromQuery(query) {
        const params = {};
        
        // Extract content type
        const contentTypeMatch = query.match(/\b(posts?|pages?|media|comments?|users?|categories|tags)\b/i);
        if (contentTypeMatch) {
            let contentType = contentTypeMatch[0].toLowerCase();
            // Normalize singular forms
            if (contentType === 'post') contentType = 'posts';
            if (contentType === 'page') contentType = 'pages';
            if (contentType === 'comment') contentType = 'comments';
            if (contentType === 'user') contentType = 'users';
            if (contentType === 'category') contentType = 'categories';
            if (contentType === 'tag') contentType = 'tags';
            
            params.contentType = contentType;
        }
        
        // Extract limit
        const limitMatch = query.match(/\b(\d+)\s+(posts?|pages?|items?|results?)\b/i);
        if (limitMatch) {
            params.limit = parseInt(limitMatch[1]);
        }
        
        // Extract filters like categories, tags, authors
        const categoryMatch = query.match(/\bcategory\s*[:=]?\s*["']?([^"',]+)["']?/i);
        if (categoryMatch) {
            params.filters = params.filters || {};
            params.filters.category = categoryMatch[1].trim();
        }
        
        const tagMatch = query.match(/\btag\s*[:=]?\s*["']?([^"',]+)["']?/i);
        if (tagMatch) {
            params.filters = params.filters || {};
            params.filters.tag = tagMatch[1].trim();
        }
        
        const authorMatch = query.match(/\bauthor\s*[:=]?\s*["']?([^"',]+)["']?/i);
        if (authorMatch) {
            params.filters = params.filters || {};
            params.filters.author = authorMatch[1].trim();
        }
        
        return params;
    }
    
    /**
     * Generate a module name based on the query and template
     * @param {string} query - User query
     * @param {Object} template - Module template
     * @returns {string} Generated module name
     */
    generateModuleName(query, template) {
        // Extract main action from query
        const actions = {
            get: ['get', 'fetch', 'retrieve', 'list', 'find', 'search', 'download'],
            create: ['create', 'add', 'post', 'insert', 'submit', 'publish', 'upload'],
            update: ['update', 'edit', 'modify', 'change'],
            delete: ['delete', 'remove', 'archive', 'trash']
        };
        
        let mainAction = 'Get';
        for (const [action, keywords] of Object.entries(actions)) {
            if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
                mainAction = action.charAt(0).toUpperCase() + action.slice(1);
                break;
            }
        }
        
        // Extract content type from query or template
        let contentType = 'Content';
        const contentTypeMatch = query.match(/\b(posts?|pages?|media|comments?|users?|categories|tags)\b/i);
        if (contentTypeMatch) {
            contentType = contentTypeMatch[0].charAt(0).toUpperCase() + contentTypeMatch[0].slice(1);
        } else if (template.inputs.some(input => input.name === 'contentType' && input.defaultValue)) {
            contentType = template.inputs.find(input => input.name === 'contentType').defaultValue;
            contentType = contentType.charAt(0).toUpperCase() + contentType.slice(1);
        }
        
        // Combine action and content type
        return `${mainAction} ${contentType}`;
    }
    
    /**
     * Generate a module description based on the query and template
     * @param {string} query - User query
     * @param {Object} template - Module template
     * @returns {string} Generated module description
     */
    generateModuleDescription(query, template) {
        // Start with the template description
        let description = template.description;
        
        // Add details based on the query
        const params = this.extractParametersFromQuery(query);
        
        if (params.contentType) {
            description += ` of type "${params.contentType}"`;
        }
        
        if (params.limit) {
            description += ` limited to ${params.limit} items`;
        }
        
        if (params.filters) {
            const filterDescriptions = [];
            
            if (params.filters.category) {
                filterDescriptions.push(`category "${params.filters.category}"`);
            }
            
            if (params.filters.tag) {
                filterDescriptions.push(`tag "${params.filters.tag}"`);
            }
            
            if (params.filters.author) {
                filterDescriptions.push(`author "${params.filters.author}"`);
            }
            
            if (filterDescriptions.length > 0) {
                description += ` filtered by ${filterDescriptions.join(' and ')}`;
            }
        }
        
        // Add a note about being generated
        description += '. Generated based on user query: "' + query + '"';
        
        return description;
    }
    
    /**
     * Create a flow from a template
     * @param {Object} template - Module template
     * @param {Object} params - Extracted parameters
     * @param {string} moduleId - Module ID
     * @returns {Promise<string>} Flow ID
     */
    async createFlowFromTemplate(template, params, moduleId) {
        // Generate a flow ID
        const flowId = 'flow_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        
        // Create a flow based on the template
        const flow = {
            id: flowId,
            name: `Flow for ${template.name}`,
            description: `Automatically generated flow for module ${moduleId}`,
            category: template.category,
            nodes: JSON.parse(JSON.stringify(template.flowTemplate)),
            connections: JSON.parse(JSON.stringify(template.connections)),
            created: Date.now(),
            modified: Date.now()
        };
        
        // Customize flow nodes based on parameters
        flow.nodes.forEach(node => {
            if (node.type === 'wp-api-get' && params.contentType) {
                node.data = node.data || {};
                node.data.endpoint = `/${params.contentType}`;
                
                // Add query parameters if available
                const queryParams = {};
                
                if (params.limit) {
                    queryParams.per_page = params.limit;
                }
                
                if (params.filters) {
                    if (params.filters.category) {
                        queryParams.category = params.filters.category;
                    }
                    
                    if (params.filters.tag) {
                        queryParams.tag = params.filters.tag;
                    }
                    
                    if (params.filters.author) {
                        queryParams.author = params.filters.author;
                    }
                }
                
                if (Object.keys(queryParams).length > 0) {
                    node.data.params = queryParams;
                }
            } else if (node.type === 'wp-api-post' && params.contentType) {
                node.data = node.data || {};
                node.data.endpoint = `/${params.contentType}`;
            }
        });
        
        // Register the flow with the WordPress Connector
        if (this.wpConnector && this.wpConnector._flows) {
            this.wpConnector._flows[flowId] = flow;
            
            // Save to storage
            if (typeof this.wpConnector._saveSettings === 'function') {
                this.wpConnector._saveSettings();
            }
        }
        
        return flowId;
    }
}

// Initialize the AI extension when WordPressConnector is available
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.WordPressConnector) {
            window.WordPressAI = new WordPressAIExtension(window.WordPressConnector);
            
            // Expose AI module generation through WordPressConnector
            window.WordPressConnector.generateModuleFromQuery = async function(query) {
                const wpAI = window.WordPressAI;
                if (!wpAI) return null;
                
                const module = await wpAI.generateModule(query);
                
                // Add module to connector
                if (module && this._microModules) {
                    this._microModules[module.id] = module;
                    
                    // Save to storage
                    if (typeof this._saveSettings === 'function') {
                        this._saveSettings();
                    }
                }
                
                return module;
            };
        }
    }, 1000); // Give time for WordPressConnector to initialize
});

            
            
            
            
                