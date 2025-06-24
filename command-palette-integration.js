/**
 * AlgorithmPress Command Palette Integration Guide
 * This guide demonstrates how to integrate modules with the Command Palette
 */

// Example of integrating WordPress Connector with Command Palette
const wpConnectorCommandProvider = {
    id: 'wordpress-connector',
    name: 'WordPress Connector',
    getCommands: function() {
        return [
            {
                id: 'wp-connect-site',
                name: 'Connect WordPress Site',
                description: 'Connect to a WordPress site via REST API',
                category: 'wordpress',
                keywords: ['wordpress', 'connect', 'site', 'api', 'wp'],
                context: ['always'],
                params: [
                    {
                        name: 'url',
                        type: 'string',
                        required: true,
                        description: 'WordPress site URL'
                    }
                ],
                execute: function(params) {
                    // Open WordPress connector if not open
                    if (window.togglePanel) {
                        window.togglePanel('wordpress-connector');
                    } else if (window.DockDesktopIntegration) {
                        window.DockDesktopIntegration.openModule('wordpress-connector');
                    }
                    
                    // Connect to site with the provided URL
                    if (window.WordPressConnector && typeof window.WordPressConnector.connectSite === 'function') {
                        window.WordPressConnector.connectSite(params.url);
                        return true;
                    }
                    
                    return false;
                },
                icon: 'fab fa-wordpress'
            },
            {
                id: 'wp-list-posts',
                name: 'List WordPress Posts',
                description: 'Show recent posts from connected WordPress site',
                category: 'wordpress',
                keywords: ['wordpress', 'posts', 'list', 'recent', 'wp'],
                context: ['wordpress'],
                execute: function() {
                    if (window.WordPressConnector && typeof window.WordPressConnector.listPosts === 'function') {
                        window.WordPressConnector.listPosts();
                        return true;
                    }
                    return false;
                },
                icon: 'fas fa-list'
            },
            {
                id: 'wp-create-post',
                name: 'Create WordPress Post',
                description: 'Create a new post on connected WordPress site',
                category: 'wordpress',
                keywords: ['wordpress', 'post', 'create', 'new', 'wp'],
                context: ['wordpress'],
                execute: function() {
                    if (window.WordPressConnector && typeof window.WordPressConnector.createPost === 'function') {
                        window.WordPressConnector.createPost();
                        return true;
                    }
                    return false;
                },
                icon: 'fas fa-plus'
            },
            {
                id: 'wp-manage-plugins',
                name: 'Manage WordPress Plugins',
                description: 'View and manage plugins on connected WordPress site',
                category: 'wordpress',
                keywords: ['wordpress', 'plugins', 'manage', 'wp'],
                context: ['wordpress'],
                execute: function() {
                    if (window.WordPressConnector && typeof window.WordPressConnector.managePlugins === 'function') {
                        window.WordPressConnector.managePlugins();
                        return true;
                    }
                    return false;
                },
                icon: 'fas fa-puzzle-piece'
            }
        ];
    }
};

// Example of integrating PHP Editor with Command Palette
const phpEditorCommandProvider = {
    id: 'php-editor',
    name: 'PHP Editor',
    getCommands: function() {
        return [
            {
                id: 'php-run-code',
                name: 'Run PHP Code',
                description: 'Execute the current PHP code',
                category: 'php',
                keywords: ['php', 'run', 'execute', 'code'],
                context: ['editor'],
                execute: function() {
                    // Placeholder for actual implementation
                    console.log('Running PHP code');
                    // If your PHP runner has a global function, call it
                    if (window.runPHPCode) {
                        window.runPHPCode();
                        return true;
                    }
                    return false;
                },
                shortcut: 'F5',
                icon: 'fas fa-play'
            },
            {
                id: 'php-format-code',
                name: 'Format PHP Code',
                description: 'Auto-format the current PHP code',
                category: 'php',
                keywords: ['php', 'format', 'beautify', 'indent'],
                context: ['editor'],
                execute: function() {
                    // Placeholder for actual implementation
                    console.log('Formatting PHP code');
                    // If your code formatter has a global function, call it
                    if (window.formatPHPCode) {
                        window.formatPHPCode();
                        return true;
                    }
                    return false;
                },
                shortcut: 'Ctrl+Alt+F',
                icon: 'fas fa-align-left'
            },
            {
                id: 'php-validate',
                name: 'Validate PHP Code',
                description: 'Check current PHP code for syntax errors',
                category: 'php',
                keywords: ['php', 'validate', 'check', 'syntax', 'errors'],
                context: ['editor'],
                execute: function() {
                    // Placeholder for actual implementation
                    console.log('Validating PHP code');
                    // If your validator has a global function, call it
                    if (window.validatePHPCode) {
                        window.validatePHPCode();
                        return true;
                    }
                    return false;
                },
                shortcut: 'Ctrl+Alt+V',
                icon: 'fas fa-check-circle'
            },
            {
                id: 'php-insert-snippet',
                name: 'Insert PHP Snippet',
                description: 'Insert a predefined code snippet',
                category: 'php',
                keywords: ['php', 'snippet', 'insert', 'template', 'code'],
                context: ['editor'],
                execute: function() {
                    // Placeholder for actual implementation
                    console.log('Inserting PHP snippet');
                    // If your snippet system has a global function, call it
                    if (window.openSnippetSelector) {
                        window.openSnippetSelector();
                        return true;
                    }
                    return false;
                },
                icon: 'fas fa-code'
            }
        ];
    }
};

// Example of integrating Desktop system with Command Palette
const desktopCommandProvider = {
    id: 'desktop',
    name: 'Desktop System',
    getCommands: function() {
        return [
            {
                id: 'create-new-window',
                name: 'Create New Window',
                description: 'Create a new empty window',
                category: 'desktop',
                keywords: ['window', 'new', 'create'],
                context: ['desktop'],
                params: [
                    {
                        name: 'title',
                        type: 'string',
                        required: false,
                        description: 'Window title'
                    }
                ],
                execute: function(params) {
                    if (window.DesktopIntegration && window.DesktopIntegration.createWindow) {
                        const title = params.title || 'New Window';
                        window.DesktopIntegration.createWindow(title, `
                            <div style="padding: 20px; text-align: center;">
                                <h2>${title}</h2>
                                <p>Empty window created via Command Palette</p>
                            </div>
                        `);
                        return true;
                    }
                    return false;
                },
                icon: 'fas fa-window-maximize'
            },
            {
                id: 'tile-windows',
                name: 'Tile Windows',
                description: 'Arrange all windows in a tile pattern',
                category: 'desktop',
                keywords: ['windows', 'tile', 'arrange'],
                context: ['desktop'],
                execute: function() {
                    // Implement window tiling
                    console.log('Tiling windows');
                    // This requires access to the window manager's internal state
                    return false;
                },
                icon: 'fas fa-th-large'
            },
            {
                id: 'close-all-windows',
                name: 'Close All Windows',
                description: 'Close all open windows',
                category: 'desktop',
                keywords: ['windows', 'close', 'all'],
                context: ['desktop'],
                execute: function() {
                    // Find all windows and close them
                    const windows = document.querySelectorAll('.window-container');
                    windows.forEach(win => {
                        const closeBtn = win.querySelector('.window-control.close');
                        if (closeBtn) {
                            closeBtn.click();
                        }
                    });
                    return true;
                },
                icon: 'fas fa-times-circle'
            }
        ];
    }
};

// Example of adding command palette button to taskbar
function addCommandPaletteToTaskbar() {
    // Check if we're in desktop mode with a taskbar
    const taskbar = document.getElementById('desktop-taskbar');
    if (!taskbar) return;
    
    // Check if button already exists
    if (taskbar.querySelector('.command-palette-button')) return;
    
    // Create button
    const button = document.createElement('button');
    button.className = 'command-palette-button';
    button.innerHTML = '<i class="fas fa-search"></i>';
    button.title = 'Command Palette (Ctrl+P)';
    button.addEventListener('click', function() {
        if (window.CommandPalette) {
            window.CommandPalette.show();
        }
    });
    
    // Add to system tray or beginning of taskbar
    const systemTray = taskbar.querySelector('#system-tray');
    if (systemTray) {
        taskbar.insertBefore(button, systemTray);
    } else {
        taskbar.appendChild(button);
    }
}

// Example of adding command palette to dock
function addCommandPaletteToDock() {
    // Check if we're in desktop mode with a dock
    const dock = document.getElementById('desktop-dock');
    if (!dock) return;
    
    // Check if button already exists
    if (dock.querySelector('.command-palette-dock-button')) return;
    
    // Create button
    const button = document.createElement('button');
    button.className = 'command-palette-dock-button';
    button.innerHTML = '<i class="fas fa-search"></i>';
    button.title = 'Command Palette';
    button.addEventListener('click', function() {
        if (window.CommandPalette) {
            window.CommandPalette.show();
        }
    });
    
    // Add to dock
    dock.appendChild(button);
}

// Example of adding floating activator button
function addCommandPaletteFloatingButton() {
    // Check if button already exists
    if (document.querySelector('.command-palette-activator')) return;
    
    // Create button
    const button = document.createElement('button');
    button.className = 'command-palette-activator';
    button.innerHTML = '<i class="fas fa-search"></i>';
    button.title = 'Command Palette (Ctrl+P)';
    button.addEventListener('click', function() {
        if (window.CommandPalette) {
            window.CommandPalette.show();
        }
    });
    
    // Add to body
    document.body.appendChild(button);
}

// Monitor for desktop mode changes
function setupCommandPaletteIntegration() {
    // Register providers with Command Palette
    if (window.CommandPalette) {
        // Register core module providers
        window.CommandPalette.registerProvider(wpConnectorCommandProvider);
        window.CommandPalette.registerProvider(phpEditorCommandProvider);
        window.CommandPalette.registerProvider(desktopCommandProvider);
        
        // Add UI elements
        addCommandPaletteFloatingButton();
        
        // Listen for desktop mode activation
        document.addEventListener('desktop-mode-activated', function() {
            setTimeout(function() {
                addCommandPaletteToTaskbar();
                addCommandPaletteToDock();
            }, 1000);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CommandPalette to be initialized
    document.addEventListener('command-palette-initialized', setupCommandPaletteIntegration);
    
    // Fallback timeout in case event isn't fired
    setTimeout(function() {
        if (window.CommandPalette) {
            setupCommandPaletteIntegration();
        }
    }, 2000);
});
