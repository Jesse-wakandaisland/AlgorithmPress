/**
 * Dock Desktop Integration - Fixed Version
 * Direct approach to integrate the dock with desktop environment
 */

const DockDesktopIntegration = (function() {
    // Private state
    const state = {
        initialized: false,
        dockButtons: []
    };
    
    // Create desktop dock
    const createDesktopDock = function() {
        console.log("Creating desktop dock...");
        
        // Find all dock buttons in the original dock
        const originalButtons = document.querySelectorAll('.dock-button');
        if (!originalButtons || originalButtons.length === 0) {
            console.warn('No dock buttons found');
            return null;
        }
        
        // Store button references
        state.dockButtons = Array.from(originalButtons);
        console.log(`Found ${state.dockButtons.length} dock buttons`);
        
        // Create desktop dock container
        const desktopDock = document.createElement('div');
        desktopDock.id = 'desktop-dock';
        desktopDock.className = 'desktop-dock';
        
        // Clone dock buttons
        state.dockButtons.forEach((button, index) => {
            // Clone the button
            const clonedButton = button.cloneNode(true);
            
            // Ensure it has an ID
            if (!clonedButton.id) {
                clonedButton.id = `desktop-dock-btn-${index}`;
            }
            
            // Store the original button's ID or data
            const buttonId = button.id || `button-${index}`;
            const buttonTitle = button.getAttribute('title') || button.textContent || `Module ${index + 1}`;
            const moduleName = buttonId.replace('-dock-btn', '');
            
            clonedButton.setAttribute('data-original-id', buttonId);
            clonedButton.setAttribute('data-module-name', moduleName);
            
            // Add click handler
            clonedButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleDockButtonClick(clonedButton, buttonTitle, moduleName);
            });
            
            desktopDock.appendChild(clonedButton);
            console.log(`Added button for module: ${moduleName}`);
        });
        
        return desktopDock;
    };
    
    // Direct override of togglePanel function
    const overrideTogglePanel = function() {
        console.log("Overriding togglePanel function...");
        
        // Check if window.togglePanel exists
        if (window.togglePanel && typeof window.togglePanel === 'function') {
            console.log("Found existing togglePanel function, saving reference");
            
            // Store the original function
            window._originalTogglePanel = window.togglePanel;
            
            // Override with our version
            window.togglePanel = function(panelId) {
                // In desktop mode, handle with desktop system
                if (document.getElementById('desktop-container') !== null) {
                    console.log(`togglePanel called in desktop mode for: ${panelId}`);
                    openModuleInDesktop(panelId);
                } else {
                    // Use original function in normal mode
                    console.log(`Using original togglePanel for: ${panelId}`);
                    window._originalTogglePanel(panelId);
                }
            };
            
            return true;
        } else {
            console.warn("togglePanel function not found");
            return false;
        }
    };
    
    // Handle dock button clicks
    const handleDockButtonClick = function(buttonElement, title, moduleName) {
        console.log(`Dock button clicked: ${moduleName}`);
        openModuleInDesktop(moduleName, title);
    };
    
    // Open module in desktop window
    const openModuleInDesktop = function(moduleName, customTitle) {
        console.log(`Opening module in desktop: ${moduleName}`);
        
        // Normalize moduleName (remove any -panel suffix)
        moduleName = moduleName.replace('-panel', '');
        
        // Default title based on module name
        let title = customTitle || moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/-/g, ' ');
        
        // Find if window already exists
        const existingWindows = document.querySelectorAll('.window-container');
        let windowExists = false;
        
        existingWindows.forEach(win => {
            if (win.getAttribute('data-module') === moduleName) {
                console.log(`Window for ${moduleName} already exists, activating it`);
                if (window.DesktopIntegration && window.DesktopIntegration.windowManager) {
                    window.DesktopIntegration.windowManager.activateWindow(win);
                    windowExists = true;
                }
            }
        });
        
        if (windowExists) return;
        
        // Create content for window
        let content;
        
        // Look for existing panel first
        const existingPanel = document.getElementById(`${moduleName}-panel`);
        if (existingPanel) {
            console.log(`Found existing panel for ${moduleName}, cloning content`);
            content = existingPanel.cloneNode(true);
            content.style.display = 'block'; // Ensure it's visible
            content.classList.remove('hidden');
        } else {
            // Create new content if no panel exists
            console.log(`No existing panel found for ${moduleName}, creating new content`);
            content = createDefaultContent(moduleName, title);
        }
        
        // Special handling for WordPress connector
        if (moduleName === 'wordpress-connector') {
            title = 'WordPress Connector';
            content = createWordPressConnectorContent();
        }
        
        // Create window if DesktopIntegration is available
        if (window.DesktopIntegration && window.DesktopIntegration.createWindow) {
            console.log(`Creating window for ${moduleName}`);
            const win = window.DesktopIntegration.createWindow(title, content, {
                width: 800,
                height: 600,
                x: 50 + Math.random() * 100,
                y: 50 + Math.random() * 100
            });
            
            // Store module name in window element
            if (win) {
                win.setAttribute('data-module', moduleName);
                
                // Initialize WordPress connector if needed
                if (moduleName === 'wordpress-connector') {
                    initializeWordPressConnector(win);
                }
            }
        } else {
            console.error("DesktopIntegration not available");
        }
    };
    
    // Create WordPress connector content
    const createWordPressConnectorContent = function() {
        const container = document.createElement('div');
        container.id = 'wp-connector-container';
        container.className = 'module-container wp-connector-container';
        container.innerHTML = `
            <div class="module-header">
                <h2><i class="fab fa-wordpress"></i> WordPress Connector</h2>
            </div>
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading WordPress Connector...</span>
            </div>
        `;
        return container;
    };
    
    // Initialize WordPress connector
    const initializeWordPressConnector = function(windowElement) {
        console.log("Initializing WordPress connector...");
        
        // Find the container
        const container = windowElement.querySelector('#wp-connector-container');
        if (!container) {
            console.warn("WordPress connector container not found in window");
            return;
        }
        
        // Try to initialize
        if (window.WordPressConnector) {
            console.log("WordPress connector found, initializing...");
            
            // Delay to ensure DOM is ready
            setTimeout(() => {
                try {
                    if (typeof window.WordPressConnector.init === 'function') {
                        window.WordPressConnector.init();
                        console.log("WordPress connector initialized");
                        
                        // Toggle panel visibility if needed
                        if (typeof window.WordPressConnector.toggleConnectorPanel === 'function') {
                            window.WordPressConnector.toggleConnectorPanel(true);
                        }
                    } else {
                        console.warn("WordPress connector init method not found");
                        container.innerHTML = `
                            <div class="module-header">
                                <h2><i class="fab fa-wordpress"></i> WordPress Connector</h2>
                            </div>
                            <div class="error-message" style="text-align: center; padding: 40px;">
                                <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
                                <p>WordPress Connector initialization method not found.</p>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.error("Error initializing WordPress connector:", e);
                    container.innerHTML = `
                        <div class="module-header">
                            <h2><i class="fab fa-wordpress"></i> WordPress Connector</h2>
                        </div>
                        <div class="error-message" style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
                            <p>Error initializing WordPress Connector: ${e.message}</p>
                        </div>
                    `;
                }
            }, 500);
        } else {
            console.warn("WordPress connector not found");
            container.innerHTML = `
                <div class="module-header">
                    <h2><i class="fab fa-wordpress"></i> WordPress Connector</h2>
                </div>
                <div class="error-message" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
                    <p>WordPress Connector module is not available.</p>
                </div>
            `;
        }
    };
    
    // Create default content for modules without specific handlers
    const createDefaultContent = function(moduleName, title) {
        console.log(`Creating default content for ${moduleName}`);
        
        const container = document.createElement('div');
        container.className = `module-container ${moduleName}-container`;
        container.innerHTML = `
            <div class="module-header">
                <h2><i class="fas fa-puzzle-piece"></i> ${title}</h2>
            </div>
            <div class="module-content">
                <p>Module: ${title}</p>
                <p>This module is initializing...</p>
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        `;
        return container;
    };
    
    // Position dock
    const positionDock = function(dockElement) {
        if (!dockElement) return;
        
        // Get desktop container
        const desktop = document.getElementById('desktop-container');
        if (!desktop) {
            console.warn("Desktop container not found");
            return;
        }
        
        // Position at bottom center
        dockElement.style.position = 'absolute';
        dockElement.style.bottom = '50px';
        dockElement.style.left = '50%';
        dockElement.style.transform = 'translateX(-50%)';
        dockElement.style.zIndex = '900';
        
        // Make sure dock is visible
        dockElement.style.display = 'flex';
        
        console.log("Dock positioned at bottom center");
    };
    
    // Add dock to desktop
    const addDockToDesktop = function() {
        console.log("Adding dock to desktop...");
        
        // Get desktop container
        const desktop = document.getElementById('desktop-container');
        if (!desktop) {
            console.warn("Desktop container not found");
            return false;
        }
        
        // Check if dock already exists
        if (document.getElementById('desktop-dock')) {
            console.log("Desktop dock already exists");
            return true;
        }
        
        // Create dock
        const dock = createDesktopDock();
        if (!dock) {
            console.warn("Failed to create desktop dock");
            return false;
        }
        
        // Add dock to desktop
        desktop.appendChild(dock);
        
        // Position dock
        positionDock(dock);
        
        // Register with NaraUI if available
        if (window.NaraUI) {
            console.log("Registering dock with NaraUI");
            try {
                window.NaraUI.register('#desktop-dock', {
                    glassStrength: 1.0,
                    reflectionStrength: 0.8,
                    dynamicTextColor: false,
                    alwaysOn: true,
                    priority: 15
                });
            } catch (e) {
                console.warn("Error registering dock with NaraUI:", e);
            }
        }
        
        return true;
    };
    
    // Handle desktop mode activation
    const onDesktopModeActivated = function() {
        console.log("Desktop mode activated event received");
        addDockToDesktop();
    };
    
    // Public API
    return {
        // Initialize dock integration
        init: function() {
            console.log("Initializing DockDesktopIntegration...");
            
            if (state.initialized) {
                console.log("Already initialized");
                return this;
            }
            
            // Override togglePanel function
            overrideTogglePanel();
            
            // Listen for desktop mode activation
            document.addEventListener('desktop-mode-activated', onDesktopModeActivated);
            
            // Add dock if desktop is already active
            if (document.getElementById('desktop-container')) {
                console.log("Desktop already active, adding dock");
                addDockToDesktop();
            }
            
            console.log("DockDesktopIntegration initialized");
            state.initialized = true;
            
            // Add a button click handler to all dock buttons in original dock
            // This is a backup in case the override doesn't work
            document.querySelectorAll('.dock-button').forEach(button => {
                const buttonId = button.id || '';
                const moduleName = buttonId.replace('-dock-btn', '');
                const oldClickHandler = button.onclick;
                
                button.onclick = function(e) {
                    // Check if we're in desktop mode
                    if (document.getElementById('desktop-container')) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Direct click handler for button: ${moduleName}`);
                        openModuleInDesktop(moduleName);
                        return false;
                    } else if (oldClickHandler) {
                        // Use original handler in normal mode
                        return oldClickHandler.call(this, e);
                    }
                };
            });
            
            return this;
        },
        
        // Force dock to be added to desktop
        addDockToDesktop: function() {
            return addDockToDesktop();
        },
        
        // Manually open a module in desktop mode
        openModule: function(moduleName, title) {
            openModuleInDesktop(moduleName, title);
            return this;
        }
    };
})();

// Auto-initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof DockDesktopIntegration !== 'undefined') {
            console.log("Auto-initializing DockDesktopIntegration");
            DockDesktopIntegration.init();
        }
    }, 1000);
});

// Export for global access
window.DockDesktopIntegration = DockDesktopIntegration;
