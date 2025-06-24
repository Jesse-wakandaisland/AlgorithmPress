/**
 * WordPress Connector Context Menu
 * 
 * This module adds a right-click context menu to access WordPress Connector functionality.
 * It can be easily extended with additional submenu items.
 */

const WordPressContextMenu = (function() {
    // Private variables
    let _initialized = false;
    let _menuElement = null;
    let _submenuItems = {};
    let _currentTarget = null;
    let _menuConfig = {
        mainSelector: 'body', // Where to listen for right clicks - can be customized
        menuWidth: 220,
        submenuWidth: 200,
        animationDuration: 150,
        menuItems: [
            {
                id: 'open-wp-connector',
                label: 'Open WordPress Connector',
                icon: 'fab fa-wordpress',
                action: () => WordPressConnector.toggleConnectorPanel(true)
            },
            {
                id: 'wp-sites',
                label: 'WordPress Sites',
                icon: 'fas fa-server',
                submenu: [
                    {
                        id: 'add-wp-site',
                        label: 'Add New Site',
                        icon: 'fas fa-plus',
                        action: () => showAddSiteDialog()
                    },
                    {
                        id: 'manage-wp-sites',
                        label: 'Manage Sites',
                        icon: 'fas fa-cog',
                        action: () => openSitesManager()
                    }
                ]
            },
            {
                id: 'wp-content',
                label: 'Content Management',
                icon: 'fas fa-file-alt',
                submenu: [
                    {
                        id: 'browse-posts',
                        label: 'Browse Posts',
                        icon: 'fas fa-newspaper',
                        action: () => browseContent('posts')
                    },
                    {
                        id: 'browse-pages',
                        label: 'Browse Pages',
                        icon: 'fas fa-file',
                        action: () => browseContent('pages')
                    },
                    {
                        id: 'browse-media',
                        label: 'Browse Media',
                        icon: 'fas fa-image',
                        action: () => browseContent('media')
                    },
                    {
                        id: 'browse-custom',
                        label: 'Custom Post Types',
                        icon: 'fas fa-box',
                        action: () => browseContent('custom')
                    }
                ]
            },
            {
                id: 'wp-plugins',
                label: 'Plugins & APIs',
                icon: 'fas fa-plug',
                submenu: [
                    {
                        id: 'explore-plugins',
                        label: 'Explore Plugins',
                        icon: 'fas fa-search',
                        action: () => explorePlugins()
                    },
                    {
                        id: 'test-api',
                        label: 'Test API Endpoint',
                        icon: 'fas fa-code',
                        action: () => testApiEndpoint()
                    }
                ]
            },
            {
                id: 'wp-modules',
                label: 'Micro Modules',
                icon: 'fas fa-cubes',
                submenu: [
                    {
                        id: 'create-module',
                        label: 'Create New Module',
                        icon: 'fas fa-plus',
                        action: () => createNewModule()
                    },
                    {
                        id: 'manage-modules',
                        label: 'Manage Modules',
                        icon: 'fas fa-th-list',
                        action: () => manageModules()
                    },
                    {
                        id: 'ai-generate-module',
                        label: 'AI Generate Module',
                        icon: 'fas fa-magic',
                        action: () => aiGenerateModule()
                    }
                ]
            },
            {
                id: 'wp-flows',
                label: 'API Flows',
                icon: 'fas fa-project-diagram',
                submenu: [
                    {
                        id: 'create-flow',
                        label: 'Create New Flow',
                        icon: 'fas fa-plus',
                        action: () => createNewFlow()
                    },
                    {
                        id: 'flow-editor',
                        label: 'Open Flow Editor',
                        icon: 'fas fa-edit',
                        action: () => openFlowEditor()
                    }
                ]
            },
            {
                id: 'wp-settings',
                label: 'WordPress Settings',
                icon: 'fas fa-cog',
                action: () => openWpSettings()
            },
            {
                id: 'storage-providers',
                label: 'Storage Providers',
                icon: 'fas fa-database',
                submenu: [
                    {
                        id: 'storage-cubbit',
                        label: 'Cubbit Storage',
                        icon: 'fas fa-cloud',
                        action: () => openStorageUI('CUBBIT')
                    },
                    {
                        id: 'storage-local',
                        label: 'Local Storage',
                        icon: 'fas fa-hdd',
                        action: () => openStorageUI('LOCAL')
                    },
                    {
                        id: 'storage-aws',
                        label: 'AWS S3',
                        icon: 'fab fa-aws',
                        action: () => openStorageUI('AWS_S3')
                    },
                    {
                        id: 'storage-google',
                        label: 'Google Cloud',
                        icon: 'fab fa-google',
                        action: () => openStorageUI('GOOGLE_CLOUD')
                    },
                    {
                        id: 'storage-azure',
                        label: 'Azure Blob',
                        icon: 'fab fa-microsoft',
                        action: () => openStorageUI('AZURE_BLOB')
                    },
                    {
                        id: 'storage-ipfs',
                        label: 'IPFS (Web3)',
                        icon: 'fab fa-ethereum',
                        action: () => openStorageUI('IPFS')
                    },
                    {
                        id: 'storage-storj',
                        label: 'Storj (Web3)',
                        icon: 'fas fa-cube',
                        action: () => openStorageUI('STORJ')
                    },
                    {
                        id: 'storage-arweave',
                        label: 'Arweave (Web3)',
                        icon: 'fas fa-archive',
                        action: () => openStorageUI('ARWEAVE')
                    },
                    {
                        id: 'storage-filecoin',
                        label: 'Filecoin (Web3)',
                        icon: 'fas fa-coins',
                        action: () => openStorageUI('FILECOIN')
                    },
                    {
                        id: 'storage-sia',
                        label: 'Sia (Web3)',
                        icon: 'fas fa-cloud-upload-alt',
                        action: () => openStorageUI('SIA')
                    },
                    {
                        id: 'storage-swarm',
                        label: 'Swarm (Web3)',
                        icon: 'fas fa-bee',
                        action: () => openStorageUI('SWARM')
                    }
                ]
            }
        ]
    };

    /**
     * Initialize the context menu
     * @param {Object} config - Optional configuration to override defaults
     */
    function init(config = {}) {
        if (_initialized) return;

        console.log('Initializing WordPress Context Menu...');
        
        // Merge provided config with defaults
        _menuConfig = {..._menuConfig, ...config};
        
        // Create menu element
        _createMenuElement();
        
        // Register event listeners
        _registerEventListeners();
        
        _initialized = true;
        console.log('WordPress Context Menu initialized successfully');
    }

    /**
     * Create the menu element
     */
    function _createMenuElement() {
        // Create main container
        _menuElement = document.createElement('div');
        _menuElement.className = 'wp-context-menu';
        _menuElement.style.display = 'none';
        
        // Create menu items
        const menuList = document.createElement('ul');
        menuList.className = 'wp-context-menu-list';
        
        _menuConfig.menuItems.forEach(item => {
            const menuItem = _createMenuItem(item);
            menuList.appendChild(menuItem);
            
            // Create submenu if present
            if (item.submenu && Array.isArray(item.submenu)) {
                const submenu = document.createElement('ul');
                submenu.className = 'wp-context-submenu';
                submenu.id = `submenu-${item.id}`;
                submenu.style.display = 'none';
                
                item.submenu.forEach(subItem => {
                    const submenuItem = _createMenuItem(subItem);
                    submenu.appendChild(submenuItem);
                });
                
                _menuElement.appendChild(submenu);
            }
        });
        
        _menuElement.appendChild(menuList);
        document.body.appendChild(_menuElement);
        
        // Add styles
        _addStyles();
    }

    /**
     * Create a menu item
     * @param {Object} item - Menu item configuration
     * @returns {HTMLElement} Menu item element
     */
    function _createMenuItem(item) {
        const menuItem = document.createElement('li');
        menuItem.className = 'wp-context-menu-item';
        menuItem.dataset.id = item.id;
        
        if (item.disabled) {
            menuItem.classList.add('disabled');
        }
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'wp-context-menu-icon';
        if (item.icon) {
            iconSpan.innerHTML = `<i class="${item.icon}"></i>`;
        }
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'wp-context-menu-label';
        labelSpan.textContent = item.label;
        
        menuItem.appendChild(iconSpan);
        menuItem.appendChild(labelSpan);
        
        if (item.submenu && Array.isArray(item.submenu)) {
            const arrowSpan = document.createElement('span');
            arrowSpan.className = 'wp-context-menu-arrow';
            arrowSpan.innerHTML = '<i class="fas fa-chevron-right"></i>';
            menuItem.appendChild(arrowSpan);
            menuItem.classList.add('has-submenu');
            
            // Store submenu items for later access
            _submenuItems[item.id] = item.submenu;
        }
        
        // Add click handler
        menuItem.addEventListener('click', function(e) {
            if (item.disabled) return;
            
            if (item.action && typeof item.action === 'function') {
                hideMenu();
                item.action(_currentTarget);
            }
        });
        
        // Add mouseover for submenus
        if (item.submenu && Array.isArray(item.submenu)) {
            menuItem.addEventListener('mouseover', function(e) {
                // Hide all other submenus
                document.querySelectorAll('.wp-context-submenu').forEach(submenu => {
                    submenu.style.display = 'none';
                });
                
                // Show this submenu
                const submenu = document.getElementById(`submenu-${item.id}`);
                if (submenu) {
                    // Position the submenu
                    const rect = menuItem.getBoundingClientRect();
                    submenu.style.top = `${rect.top}px`;
                    submenu.style.left = `${rect.right}px`;
                    submenu.style.display = 'block';
                }
            });
        }
        
        return menuItem;
    }

    /**
     * Add styles for the context menu
     */
    function _addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .wp-context-menu {
                position: fixed;
                z-index: 10000;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                min-width: ${_menuConfig.menuWidth}px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 0, 0, 0.1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                animation: wp-context-menu-fade-in ${_menuConfig.animationDuration}ms ease;
                user-select: none;
            }
            
            @keyframes wp-context-menu-fade-in {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .wp-context-menu-list,
            .wp-context-submenu {
                list-style: none;
                margin: 0;
                padding: 5px 0;
            }
            
            .wp-context-submenu {
                position: fixed;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                min-width: ${_menuConfig.submenuWidth}px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .wp-context-menu-item {
                padding: 8px 12px;
                display: flex;
                align-items: center;
                cursor: pointer;
                position: relative;
                color: #333;
            }
            
            .wp-context-menu-item:hover {
                background-color: rgba(79, 70, 229, 0.1);
                color: #4f46e5;
            }
            
            .wp-context-menu-item.disabled {
                opacity: 0.5;
                cursor: default;
            }
            
            .wp-context-menu-item.disabled:hover {
                background-color: transparent;
                color: #333;
            }
            
            .wp-context-menu-icon {
                width: 20px;
                text-align: center;
                margin-right: 8px;
            }
            
            .wp-context-menu-label {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .wp-context-menu-arrow {
                font-size: 12px;
                margin-left: 8px;
            }
            
            .wp-context-menu-separator {
                height: 1px;
                background-color: rgba(0, 0, 0, 0.1);
                margin: 5px 0;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Register event listeners
     */
    function _registerEventListeners() {
        // Listen for right-click on the specified selector
        const container = document.querySelector(_menuConfig.mainSelector);
        if (!container) {
            console.error(`Selector "${_menuConfig.mainSelector}" not found for context menu`);
            return;
        }
        
        container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showMenu(e.clientX, e.clientY, e.target);
        });
        
        // Hide menu on click outside
        document.addEventListener('click', function(e) {
            if (_menuElement && !_menuElement.contains(e.target)) {
                hideMenu();
            }
        });
        
        // Hide menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideMenu();
            }
        });
        
        // Hide menu on scroll
        document.addEventListener('scroll', function() {
            hideMenu();
        });
        
        // Hide menu on window resize
        window.addEventListener('resize', function() {
            hideMenu();
        });
    }

    /**
     * Show the menu at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {HTMLElement} target - The element that was right-clicked
     */
    function showMenu(x, y, target) {
        if (!_menuElement) return;
        
        _currentTarget = target;
        
        // Position the menu
        _menuElement.style.display = 'block';
        
        // Check if the menu will overflow the window
        const menuRect = _menuElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Adjust X position
        if (x + menuRect.width > windowWidth) {
            x = windowWidth - menuRect.width - 5;
        }
        
        // Adjust Y position
        if (y + menuRect.height > windowHeight) {
            y = windowHeight - menuRect.height - 5;
        }
        
        _menuElement.style.top = `${y}px`;
        _menuElement.style.left = `${x}px`;
        
        // Hide all submenus
        document.querySelectorAll('.wp-context-submenu').forEach(submenu => {
            submenu.style.display = 'none';
        });
    }

    /**
     * Hide the menu
     */
    function hideMenu() {
        if (_menuElement) {
            _menuElement.style.display = 'none';
            
            // Hide all submenus
            document.querySelectorAll('.wp-context-submenu').forEach(submenu => {
                submenu.style.display = 'none';
            });
            
            _currentTarget = null;
        }
    }

    /**
     * Add a menu item
     * @param {Object} item - Menu item configuration
     * @param {string} parentId - ID of the parent menu item (for submenu items)
     */
    function addMenuItem(item, parentId = null) {
        if (!item.id || !item.label) {
            console.error('Menu items must have id and label properties');
            return;
        }
        
        if (parentId) {
            // Add to submenu
            if (!_submenuItems[parentId]) {
                _submenuItems[parentId] = [];
            }
            
            _submenuItems[parentId].push(item);
            
            // Update submenu
            const submenu = document.getElementById(`submenu-${parentId}`);
            if (submenu) {
                const submenuItem = _createMenuItem(item);
                submenu.appendChild(submenuItem);
            }
        } else {
            // Add to main menu
            _menuConfig.menuItems.push(item);
            
            // Recreate menu element
            if (_menuElement) {
                document.body.removeChild(_menuElement);
            }
            
            _createMenuElement();
        }
    }
    
    /**
     * Remove a menu item
     * @param {string} id - ID of the menu item to remove
     */
    function removeMenuItem(id) {
        // Remove from main menu
        _menuConfig.menuItems = _menuConfig.menuItems.filter(item => item.id !== id);
        
        // Remove from submenus
        for (const parentId in _submenuItems) {
            _submenuItems[parentId] = _submenuItems[parentId].filter(item => item.id !== id);
        }
        
        // Recreate menu element
        if (_menuElement) {
            document.body.removeChild(_menuElement);
        }
        
        _createMenuElement();
    }
    
    /**
     * Enable or disable a menu item
     * @param {string} id - ID of the menu item
     * @param {boolean} disabled - Whether the item should be disabled
     */
    function setMenuItemDisabled(id, disabled) {
        // Find the menu item
        const menuItem = document.querySelector(`.wp-context-menu-item[data-id="${id}"]`);
        if (menuItem) {
            if (disabled) {
                menuItem.classList.add('disabled');
            } else {
                menuItem.classList.remove('disabled');
            }
        }
        
        // Update the menu config
        _menuConfig.menuItems.forEach(item => {
            if (item.id === id) {
                item.disabled = disabled;
            }
            
            if (item.submenu) {
                item.submenu.forEach(subItem => {
                    if (subItem.id === id) {
                        subItem.disabled = disabled;
                    }
                });
            }
        });
    }

    // Utility functions for menu actions (these will connect to WordPressConnector)
    
    function showAddSiteDialog() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the sites panel
            const sitesTab = document.getElementById('wp-sites-tab');
            if (sitesTab) {
                sitesTab.click();
            }
            
            // Show the add site form
            setTimeout(() => {
                const addSiteBtn = document.getElementById('add-wp-site-btn');
                if (addSiteBtn) {
                    addSiteBtn.click();
                }
            }, 300);
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function openSitesManager() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the sites panel
            const sitesTab = document.getElementById('wp-sites-tab');
            if (sitesTab) {
                sitesTab.click();
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function browseContent(contentType) {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the content panel
            const contentTab = document.getElementById('wp-content-tab');
            if (contentTab) {
                contentTab.click();
                
                // Select the content type
                setTimeout(() => {
                    const contentTypeSelector = document.getElementById('content-type-selector');
                    if (contentTypeSelector) {
                        contentTypeSelector.value = contentType;
                        
                        // Trigger change event
                        const event = new Event('change');
                        contentTypeSelector.dispatchEvent(event);
                    }
                }, 300);
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function explorePlugins() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the plugins panel
            const pluginsTab = document.getElementById('wp-plugins-tab');
            if (pluginsTab) {
                pluginsTab.click();
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function testApiEndpoint() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the plugins panel
            const pluginsTab = document.getElementById('wp-plugins-tab');
            if (pluginsTab) {
                pluginsTab.click();
                
                // This is a stub - in a real implementation, you would show an API test dialog
                setTimeout(() => {
                    alert('API Endpoint Testing will be implemented in a future update.');
                }, 300);
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function createNewModule() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the modules panel
            const modulesTab = document.getElementById('wp-modules-tab');
            if (modulesTab) {
                modulesTab.click();
                
                // Show the create module form
                setTimeout(() => {
                    const createModuleBtn = document.getElementById('create-module-btn');
                    if (createModuleBtn) {
                        createModuleBtn.click();
                    }
                }, 300);
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function manageModules() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the modules panel
            const modulesTab = document.getElementById('wp-modules-tab');
            if (modulesTab) {
                modulesTab.click();
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function aiGenerateModule() {
        if (window.WordPressConnector && window.WordPressConnector.generateModuleFromQuery) {
            // Prompt the user for a query
            const query = prompt('What kind of WordPress module would you like to create? (e.g., "Get recent posts" or "Create new page")');
            
            if (query) {
                // Show loading indicator
                const loadingDialog = document.createElement('div');
                loadingDialog.className = 'wp-loading-dialog';
                loadingDialog.innerHTML = `
                    <div class="wp-loading-dialog-content">
                        <div class="wp-loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="wp-loading-message">
                            Generating module...
                        </div>
                    </div>
                `;
                document.body.appendChild(loadingDialog);
                
                // Add styles for the loading dialog
                const style = document.createElement('style');
                style.textContent = `
                    .wp-loading-dialog {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10001;
                    }
                    
                    .wp-loading-dialog-content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                        text-align: center;
                        min-width: 300px;
                    }
                    
                    .wp-loading-spinner {
                        font-size: 32px;
                        color: #4f46e5;
                        margin-bottom: 16px;
                    }
                    
                    .wp-loading-message {
                        font-size: 16px;
                    }
                `;
                document.head.appendChild(style);
                
                // Generate the module
                window.WordPressConnector.generateModuleFromQuery(query)
                    .then(module => {
                        // Remove loading dialog
                        document.body.removeChild(loadingDialog);
                        
                        if (module) {
                            // Show success message
                            alert(`Module "${module.name}" created successfully!`);
                            
                            // Show the WordPress Connector
                            window.WordPressConnector.toggleConnectorPanel(true);
                            
                            // Navigate to the modules panel
                            const modulesTab = document.getElementById('wp-modules-tab');
                            if (modulesTab) {
                                modulesTab.click();
                            }
                        } else {
                            alert('Failed to generate module. Please try a different query.');
                        }
                    })
                    .catch(error => {
                        // Remove loading dialog
                        document.body.removeChild(loadingDialog);
                        
                        // Show error message
                        alert(`Error generating module: ${error.message}`);
                    });
            }
        } else {
            alert('AI Module Generation is not available. Please make sure the WordPress Connector AI extension is properly loaded.');
        }
    }
    
    function createNewFlow() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the flows panel
            const flowsTab = document.getElementById('wp-flows-tab');
            if (flowsTab) {
                flowsTab.click();
                
                // Select "Create New Flow" option
                setTimeout(() => {
                    const flowSelector = document.getElementById('flow-selector');
                    if (flowSelector) {
                        flowSelector.value = 'new';
                        
                        // Trigger change event
                        const event = new Event('change');
                        flowSelector.dispatchEvent(event);
                    }
                }, 300);
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function openFlowEditor() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Navigate to the flows panel
            const flowsTab = document.getElementById('wp-flows-tab');
            if (flowsTab) {
                flowsTab.click();
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function openWpSettings() {
        if (window.WordPressConnector) {
            // Show the WordPress Connector
            window.WordPressConnector.toggleConnectorPanel(true);
            
            // Show the settings panel
            const settingsBtn = document.getElementById('wp-settings-btn');
            if (settingsBtn) {
                settingsBtn.click();
            }
        } else {
            console.error('WordPress Connector not found');
        }
    }
    
    function openStorageUI(providerKey) {
        if (window.StorageUIManager && typeof window.StorageUIManager.showModal === 'function') {
            window.StorageUIManager.showModal();
            // Try to pre-select the provider if possible
            setTimeout(() => {
                if (providerKey && window.UnifiedStorage && window.UnifiedStorage.PROVIDERS) {
                    const provider = window.UnifiedStorage.PROVIDERS[providerKey];
                    if (provider) {
                        // Try to select the provider in the UI
                        const el = document.querySelector(`[data-provider="${provider}"]`);
                        if (el) el.click();
                    }
                }
            }, 300);
        } else {
            alert('Storage UI Manager is not available.');
        }
    }

    // Public API
    return {
        init,
        showMenu,
        hideMenu,
        addMenuItem,
        removeMenuItem,
        setMenuItemDisabled
    };
})();

// Ensure WordPressContextMenu is initialized after WordPressConnector is available
function initializeContextMenuWhenReady() {
    if (window.WordPressConnector) {
        // Add a visual indicator to the menu if WordPressConnector is loaded
        if (WordPressContextMenu && typeof WordPressContextMenu.init === 'function') {
            // Add a "WordPress Connected" indicator to the menu
            WordPressContextMenu.addMenuItem({
                id: 'wp-connector-status',
                label: 'WordPress Connector Loaded',
                icon: 'fab fa-wordpress',
                disabled: true
            });
        }
        // Initialize the context menu if not already done
        if (WordPressContextMenu && typeof WordPressContextMenu.init === 'function') {
            WordPressContextMenu.init();
        }
        // Expose to global scope
        window.WordPressContextMenu = WordPressContextMenu;
        console.log('WordPress Context Menu initialized and WordPressConnector detected.');
    } else {
        // If not available, show a fallback menu item
        if (WordPressContextMenu && typeof WordPressContextMenu.init === 'function') {
            WordPressContextMenu.addMenuItem({
                id: 'wp-connector-status',
                label: 'WordPress Connector Not Loaded',
                icon: 'fab fa-wordpress',
                disabled: true
            });
            WordPressContextMenu.init();
        }
        window.WordPressContextMenu = WordPressContextMenu;
        console.warn('WordPress Context Menu initialized but WordPressConnector not detected.');
    }
}

// Wait for DOMContentLoaded and then for WordPressConnector
document.addEventListener('DOMContentLoaded', () => {
    // Ensure Font Awesome is loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    // Try to initialize immediately, or retry until WordPressConnector is available
    let tries = 0;
    function tryInit() {
        if (window.WordPressConnector || tries > 10) {
            initializeContextMenuWhenReady();
        } else {
            tries++;
            setTimeout(tryInit, 300);
        }
    }
    tryInit();
});
