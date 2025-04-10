/**
 * AlgorithmPress Desktop Integration
 * Wraps the PHP-WASM Builder in a desktop-like environment using NaraUI
 */

const DesktopIntegration = (function() {
    // Private state
    const state = {
        initialized: false,
        desktopMode: false,
        originalContent: null,
        windows: [],
        activeWindow: null,
        backgroundCanvas: null,
        animationController: null
    };

    // Window management
    const windowManager = {
        createWindow: function(title, content, options = {}) {
            const defaults = {
                width: 800,
                height: 600,
                x: 50 + Math.random() * 100,
                y: 50 + Math.random() * 100,
                resizable: true,
                minimizable: true,
                maximizable: true,
                closable: true
            };
            
            const windowOptions = { ...defaults, ...options };
            
            // Create window container
            const windowEl = document.createElement('div');
            windowEl.className = 'window-container opening';
            windowEl.style.width = `${windowOptions.width}px`;
            windowEl.style.height = `${windowOptions.height}px`;
            windowEl.style.left = `${windowOptions.x}px`;
            windowEl.style.top = `${windowOptions.y}px`;
            windowEl.style.zIndex = 100 + state.windows.length;
            
            // Create window header
            const headerEl = document.createElement('div');
            headerEl.className = 'window-header';
            
            // Window title
            const titleEl = document.createElement('div');
            titleEl.className = 'window-title';
            titleEl.textContent = title;
            headerEl.appendChild(titleEl);
            
            // Window controls
            const controlsEl = document.createElement('div');
            controlsEl.className = 'window-controls';
            
            if (windowOptions.minimizable) {
                const minBtn = document.createElement('button');
                minBtn.className = 'window-control minimize';
                minBtn.innerHTML = '−';
                minBtn.title = 'Minimize';
                minBtn.addEventListener('click', () => this.minimizeWindow(windowEl));
                controlsEl.appendChild(minBtn);
            }
            
            if (windowOptions.maximizable) {
                const maxBtn = document.createElement('button');
                maxBtn.className = 'window-control maximize';
                maxBtn.innerHTML = '□';
                maxBtn.title = 'Maximize';
                maxBtn.addEventListener('click', () => this.toggleMaximize(windowEl));
                controlsEl.appendChild(maxBtn);
            }
            
            if (windowOptions.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'window-control close';
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close';
                closeBtn.addEventListener('click', () => this.closeWindow(windowEl));
                controlsEl.appendChild(closeBtn);
            }
            
            headerEl.appendChild(controlsEl);
            windowEl.appendChild(headerEl);
            
            // Window content
            const contentEl = document.createElement('div');
            contentEl.className = 'window-content';
            
            // If content is a DOM element, append it; otherwise set innerHTML
            if (content instanceof HTMLElement) {
                contentEl.appendChild(content);
            } else if (typeof content === 'string') {
                contentEl.innerHTML = content;
            }
            
            windowEl.appendChild(contentEl);
            
            // Window resize handle if resizable
            if (windowOptions.resizable) {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'window-resize-handle';
                windowEl.appendChild(resizeHandle);
                
                // Initialize resize functionality
                this.initResizable(windowEl, resizeHandle);
            }
            
            // Add to desktop
            const desktop = document.getElementById('desktop-container');
            desktop.appendChild(windowEl);
            
            // Register window with NaraUI
            if (window.NaraUI) {
                NaraUI.register(windowEl, {
                    glassStrength: 1.0,
                    reflectionStrength: 0.8,
                    dynamicTextColor: false,
                    priority: 10
                });
                
                NaraUI.register(headerEl, {
                    glassStrength: 1.0,
                    reflectionStrength: 1.0,
                    dynamicTextColor: true,
                    priority: 20
                });
            }
            
            // Make window draggable
            this.initDraggable(windowEl, headerEl);
            
            // Store window in state
            const windowData = {
                el: windowEl,
                title: title,
                options: windowOptions,
                minimized: false,
                maximized: false,
                originalDimensions: {
                    width: windowOptions.width,
                    height: windowOptions.height,
                    x: windowOptions.x,
                    y: windowOptions.y
                }
            };
            
            state.windows.push(windowData);
            
            // Activate this window
            this.activateWindow(windowEl);
            
            // Remove opening class after animation completes
            setTimeout(() => {
                windowEl.classList.remove('opening');
            }, 300);
            
            return windowEl;
        },
        
        closeWindow: function(windowEl) {
            // Find window in array
            const index = state.windows.findIndex(w => w.el === windowEl);
            if (index !== -1) {
                // Add closing animation class
                windowEl.classList.add('closing');
                
                // Wait for animation to complete
                setTimeout(() => {
                    // Remove from NaraUI
                    if (window.NaraUI) {
                        NaraUI.unregister(windowEl);
                    }
                    
                    // Remove from DOM
                    windowEl.remove();
                    
                    // Remove from state
                    state.windows.splice(index, 1);
                    
                    // Activate the top-most remaining window
                    if (state.windows.length > 0) {
                        this.activateWindow(state.windows[state.windows.length - 1].el);
                    }
                    
                    // Update taskbar
                    taskbarManager.updateTaskbar();
                }, 300);
            }
        },
        
        minimizeWindow: function(windowEl) {
            const winData = state.windows.find(w => w.el === windowEl);
            if (!winData) return;
            
            winData.minimized = !winData.minimized;
            
            if (winData.minimized) {
                windowEl.classList.add('minimized');
                
                // Activate another window if this was active
                if (state.activeWindow === windowEl) {
                    const visibleWindows = state.windows.filter(
                        w => !w.minimized && w.el !== windowEl
                    );
                    if (visibleWindows.length > 0) {
                        this.activateWindow(visibleWindows[visibleWindows.length - 1].el);
                    } else {
                        state.activeWindow = null;
                    }
                }
            } else {
                windowEl.classList.remove('minimized');
                this.activateWindow(windowEl);
            }
            
            // Update taskbar
            taskbarManager.updateTaskbar();
        },
        
        toggleMaximize: function(windowEl) {
            const winData = state.windows.find(w => w.el === windowEl);
            if (!winData) return;
            
            winData.maximized = !winData.maximized;
            
            if (winData.maximized) {
                // Store current dimensions before maximizing
                winData.originalDimensions = {
                    width: windowEl.offsetWidth,
                    height: windowEl.offsetHeight,
                    x: windowEl.offsetLeft,
                    y: windowEl.offsetTop
                };
                
                windowEl.classList.add('maximized');
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 40px)'; // Account for taskbar
                windowEl.style.left = '0';
                windowEl.style.top = '0';
            } else {
                windowEl.classList.remove('maximized');
                windowEl.style.width = `${winData.originalDimensions.width}px`;
                windowEl.style.height = `${winData.originalDimensions.height}px`;
                windowEl.style.left = `${winData.originalDimensions.x}px`;
                windowEl.style.top = `${winData.originalDimensions.y}px`;
            }
            
            this.activateWindow(windowEl);
        },
        
        activateWindow: function(windowEl) {
            // Deactivate all windows
            state.windows.forEach(winData => {
                winData.el.classList.remove('active');
                winData.el.style.zIndex = 100;
            });
            
            // Activate the selected window
            const winData = state.windows.find(w => w.el === windowEl);
            if (winData && !winData.minimized) {
                windowEl.classList.add('active');
                windowEl.style.zIndex = 200;
                state.activeWindow = windowEl;
            }
        },
        
        initDraggable: function(windowEl, handleEl) {
            let offsetX, offsetY, isDragging = false;
            
            const startDrag = (e) => {
                // Don't drag if maximized
                const winData = state.windows.find(w => w.el === windowEl);
                if (winData && winData.maximized) return;
                
                // Activate window on drag start
                this.activateWindow(windowEl);
                
                // Calculate offset
                const rect = windowEl.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                isDragging = true;
                
                // Prevent text selection during drag
                e.preventDefault();
            };
            
            const doDrag = (e) => {
                if (!isDragging) return;
                
                const desktopRect = document.getElementById('desktop-container').getBoundingClientRect();
                const newLeft = e.clientX - desktopRect.left - offsetX;
                const newTop = e.clientY - desktopRect.top - offsetY;
                
                // Keep window within desktop bounds
                windowEl.style.left = `${Math.max(0, newLeft)}px`;
                windowEl.style.top = `${Math.max(0, newTop)}px`;
            };
            
            const endDrag = () => {
                isDragging = false;
            };
            
            // Add event listeners
            handleEl.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', endDrag);
        },
        
        initResizable: function(windowEl, handleEl) {
            let startWidth, startHeight, startX, startY, isResizing = false;
            
            const startResize = (e) => {
                // Activate window on resize start
                this.activateWindow(windowEl);
                
                // Get initial dimensions
                startWidth = windowEl.offsetWidth;
                startHeight = windowEl.offsetHeight;
                startX = e.clientX;
                startY = e.clientY;
                isResizing = true;
                
                // Prevent text selection during resize
                e.preventDefault();
            };
            
            const doResize = (e) => {
                if (!isResizing) return;
                
                // Calculate new dimensions
                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);
                
                // Apply new dimensions with min size limit
                windowEl.style.width = `${Math.max(300, newWidth)}px`;
                windowEl.style.height = `${Math.max(200, newHeight)}px`;
            };
            
            const endResize = () => {
                isResizing = false;
            };
            
            // Add event listeners
            handleEl.addEventListener('mousedown', startResize);
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', endResize);
        }
    };
    
    // Taskbar management
    const taskbarManager = {
        init: function() {
            // Create taskbar if it doesn't exist
            let taskbar = document.getElementById('desktop-taskbar');
            if (!taskbar) {
                taskbar = document.createElement('div');
                taskbar.id = 'desktop-taskbar';
                
                // Start button
                const startBtn = document.createElement('button');
                startBtn.id = 'start-button';
                startBtn.innerHTML = '<i class="fas fa-code"></i> AlgorithmPress';
                startBtn.addEventListener('click', this.toggleStartMenu);
                taskbar.appendChild(startBtn);
                
                // Window buttons container
                const windowButtons = document.createElement('div');
                windowButtons.id = 'taskbar-window-buttons';
                taskbar.appendChild(windowButtons);
                
                // System tray
                const systemTray = document.createElement('div');
                systemTray.id = 'system-tray';
                
                // Toggle desktop mode button
                const toggleDesktopBtn = document.createElement('button');
                toggleDesktopBtn.id = 'toggle-desktop-mode';
                toggleDesktopBtn.innerHTML = '<i class="fas fa-desktop"></i>';
                toggleDesktopBtn.title = 'Toggle Desktop Mode';
                toggleDesktopBtn.addEventListener('click', () => {
                    // Toggle between desktop and normal mode
                    DesktopIntegration.toggleDesktopMode();
                });
                systemTray.appendChild(toggleDesktopBtn);
                
                // Clock
                const clock = document.createElement('div');
                clock.id = 'taskbar-clock';
                this.updateClock(clock);
                setInterval(() => this.updateClock(clock), 1000);
                systemTray.appendChild(clock);
                
                taskbar.appendChild(systemTray);
                
                // Add taskbar to desktop
                document.getElementById('desktop-container').appendChild(taskbar);
                
                // Register with NaraUI
                if (window.NaraUI) {
                    NaraUI.register(taskbar, {
                        glassStrength: 1.0,
                        reflectionStrength: 0.6,
                        dynamicTextColor: false,
                        alwaysOn: true,
                        priority: 15
                    });
                }
            }
            
            this.updateTaskbar();
        },
        
        updateTaskbar: function() {
            const windowButtons = document.getElementById('taskbar-window-buttons');
            if (!windowButtons) return;
            
            // Clear existing buttons
            windowButtons.innerHTML = '';
            
            // Add a button for each window
            state.windows.forEach(winData => {
                const button = document.createElement('button');
                button.className = 'taskbar-window-button';
                if (state.activeWindow === winData.el) {
                    button.classList.add('active');
                }
                if (winData.minimized) {
                    button.classList.add('minimized');
                }
                
                button.textContent = winData.title;
                
                button.addEventListener('click', () => {
                    if (winData.minimized) {
                        windowManager.minimizeWindow(winData.el);
                    } else if (state.activeWindow === winData.el) {
                        windowManager.minimizeWindow(winData.el);
                    } else {
                        windowManager.activateWindow(winData.el);
                    }
                });
                
                windowButtons.appendChild(button);
            });
        },
        
        updateClock: function(clockEl) {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        
        toggleStartMenu: function() {
            let startMenu = document.getElementById('start-menu');
            
            if (startMenu) {
                startMenu.remove();
                return;
            }
            
            // Create start menu
            startMenu = document.createElement('div');
            startMenu.id = 'start-menu';
            
            // Menu items
            const menuItems = [
                {
                    icon: 'fas fa-code',
                    title: 'PHP Editor',
                    action: () => {
                        windowManager.createWindow('PHP Editor', document.getElementById('php-wasm-container'), {
                            width: 1000,
                            height: 700
                        });
                        startMenu.remove();
                    }
                },
                {
                    icon: 'fas fa-wordpress',
                    title: 'WordPress Connector',
                    action: () => {
                        // Assuming there's a WordPress connector panel
                        const wpPanel = document.createElement('div');
                        wpPanel.id = 'wp-connector-container';
                        wpPanel.innerHTML = `
                            <div class="loading-spinner">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Loading WordPress Connector...</span>
                            </div>
                        `;
                        
                        const wpWindow = windowManager.createWindow('WordPress Connector', wpPanel, {
                            width: 800,
                            height: 600
                        });
                        
                        // Initialize WordPress connector
                        if (window.WordPressConnector && typeof window.WordPressConnector.init === 'function') {
                            window.WordPressConnector.init();
                        }
                        
                        startMenu.remove();
                    }
                },
                {
                    icon: 'fas fa-cog',
                    title: 'Settings',
                    action: () => {
                        windowManager.createWindow('Settings', 
                            '<div class="settings-container"><h2>System Settings</h2><p>Settings options will appear here.</p></div>', 
                            { width: 500, height: 400 });
                        startMenu.remove();
                    }
                },
                {
                    icon: 'fas fa-question-circle',
                    title: 'Help',
                    action: () => {
                        windowManager.createWindow('Help', 
                            '<div class="help-container"><h2>AlgorithmPress Help</h2><p>Documentation and help will appear here.</p></div>', 
                            { width: 600, height: 500 });
                        startMenu.remove();
                    }
                }
            ];
            
            // Create menu items
            menuItems.forEach(item => {
                const menuItem = document.createElement('button');
                menuItem.className = 'start-menu-item';
                menuItem.innerHTML = `<i class="${item.icon}"></i> <span>${item.title}</span>`;
                menuItem.addEventListener('click', item.action);
                startMenu.appendChild(menuItem);
            });
            
            // Add separator
            const separator = document.createElement('div');
            separator.className = 'menu-separator';
            startMenu.appendChild(separator);
            
            // Power options
            const powerBtn = document.createElement('button');
            powerBtn.className = 'start-menu-item power-button';
            powerBtn.innerHTML = '<i class="fas fa-power-off"></i> <span>Exit Desktop Mode</span>';
            powerBtn.addEventListener('click', () => {
                DesktopIntegration.toggleDesktopMode();
                startMenu.remove();
            });
            startMenu.appendChild(powerBtn);
            
            // Position the menu
            const startBtn = document.getElementById('start-button');
            const startBtnRect = startBtn.getBoundingClientRect();
            const desktopRect = document.getElementById('desktop-container').getBoundingClientRect();
            
            startMenu.style.left = `${startBtnRect.left - desktopRect.left}px`;
            startMenu.style.bottom = `${desktopRect.height - (startBtnRect.top - desktopRect.top)}px`;
            
            // Add to desktop
            document.getElementById('desktop-container').appendChild(startMenu);
            
            // Register with NaraUI
            if (window.NaraUI) {
                NaraUI.register(startMenu, {
                    glassStrength: 0.95,
                    reflectionStrength: 0.8,
                    dynamicTextColor: true,
                    priority: 25
                });
            }
            
            // Close menu when clicking outside
            const closeMenu = (e) => {
                if (!startMenu.contains(e.target) && e.target !== document.getElementById('start-button')) {
                    startMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            // Use setTimeout to avoid immediate closure
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
        }
    };
    
    // Background animation
    const backgroundAnimator = {
        // Color themes for gradients
        colorThemes: [
            // Blue-Red-Gold theme
            [
                { x: 0, y: 0, color: '#1a2a6c' },
                { x: 0.5, y: 0.5, color: '#b21f1f' },
                { x: 1, y: 1, color: '#fdbb2d' }
            ],
            // Purple-Pink-Blue theme
            [
                { x: 0, y: 0, color: '#41295a' },
                { x: 0.5, y: 0.3, color: '#f25eac' },
                { x: 1, y: 1, color: '#2F80ED' }
            ],
            // Dark Green-Teal-Light Green theme
            [
                { x: 0, y: 0, color: '#134e5e' },
                { x: 0.5, y: 0.5, color: '#2EB6AF' },
                { x: 1, y: 1, color: '#71B280' }
            ],
            // Sunset theme
            [
                { x: 0, y: 0, color: '#0B486B' },
                { x: 0.4, y: 0.4, color: '#F56217' },
                { x: 1, y: 1, color: '#FCB07E' }
            ],
            // Night sky theme
            [
                { x: 0, y: 0, color: '#141E30' },
                { x: 0.5, y: 0.5, color: '#243B55' },
                { x: 1, y: 1, color: '#6593AB' }
            ],
            // Cherry Blossom theme
            [
                { x: 0, y: 0, color: '#5E1D4C' },
                { x: 0.5, y: 0.5, color: '#C33764' },
                { x: 1, y: 1, color: '#FFC7C2' }
            ],
            // Aurora Borealis theme
            [
                { x: 0, y: 0, color: '#003973' },
                { x: 0.4, y: 0.5, color: '#048B9A' },
                { x: 0.7, y: 0.7, color: '#13B995' },
                { x: 1, y: 1, color: '#96DED1' }
            ],
            // Cyberpunk theme
            [
                { x: 0, y: 0, color: '#09203f' },
                { x: 0.5, y: 0.4, color: '#EE3E6D' },
                { x: 1, y: 1, color: '#F9D978' }
            ],
            // Ocean theme
            [
                { x: 0, y: 0, color: '#1A2980' },
                { x: 0.6, y: 0.5, color: '#26D0CE' },
                { x: 1, y: 1, color: '#9CECFB' }
            ]
        ],
        
        // Current animation state
        animState: {
            currentThemeIndex: 0,
            nextThemeIndex: 1,
            transitionProgress: 0,
            isTransitioning: false,
            timeUntilNextTransition: 60, // seconds until next theme change
            transitionDuration: 5, // seconds for transition
            lastTimestamp: 0
        },
        
        init: function(container) {
            // Create canvas for background animation
            const canvas = document.createElement('canvas');
            canvas.id = 'desktop-background-canvas';
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '0';
            
            // Insert at beginning of container
            container.insertBefore(canvas, container.firstChild);
            
            // Store reference
            state.backgroundCanvas = canvas;
            
            // Initialize with random theme
            this.animState.currentThemeIndex = Math.floor(Math.random() * this.colorThemes.length);
            this.animState.nextThemeIndex = (this.animState.currentThemeIndex + 1) % this.colorThemes.length;
            
            // Start animation
            this.startAnimation(canvas);
            
            // Handle resize
            window.addEventListener('resize', () => {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            });
            
            // Add theme cycle button to system tray
            this.addThemeCycleButton();
        },
        
        // Add a button to manually cycle themes
        addThemeCycleButton: function() {
            setTimeout(() => {
                const systemTray = document.getElementById('system-tray');
                if (!systemTray) return;
                
                // Create button if it doesn't exist
                if (!document.getElementById('cycle-theme-button')) {
                    const cycleButton = document.createElement('button');
                    cycleButton.id = 'cycle-theme-button';
                    cycleButton.className = 'system-tray-button';
                    cycleButton.innerHTML = '<i class="fas fa-palette"></i>';
                    cycleButton.title = 'Cycle Background Theme';
                    cycleButton.addEventListener('click', () => this.cycleToNextTheme());
                    
                    // Insert before clock
                    const clock = document.getElementById('taskbar-clock');
                    if (clock) {
                        systemTray.insertBefore(cycleButton, clock);
                    } else {
                        systemTray.appendChild(cycleButton);
                    }
                }
            }, 1000); // Delay to ensure system tray exists
        },
        
        // Manually cycle to the next theme
        cycleToNextTheme: function() {
            if (this.animState.isTransitioning) return;
            
            this.animState.isTransitioning = true;
            this.animState.transitionProgress = 0;
            this.animState.nextThemeIndex = (this.animState.currentThemeIndex + 1) % this.colorThemes.length;
        },
        
        // Interpolate between two colors
        interpolateColor: function(color1, color2, factor) {
            // Parse hex colors to RGB
            const parseColor = (hexColor) => {
                const r = parseInt(hexColor.slice(1, 3), 16);
                const g = parseInt(hexColor.slice(3, 5), 16);
                const b = parseInt(hexColor.slice(5, 7), 16);
                return { r, g, b };
            };
            
            // Convert RGB to hex
            const rgbToHex = (r, g, b) => {
                return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            };
            
            const c1 = parseColor(color1);
            const c2 = parseColor(color2);
            
            // Interpolate each channel
            const r = Math.round(c1.r + factor * (c2.r - c1.r));
            const g = Math.round(c1.g + factor * (c2.g - c1.g));
            const b = Math.round(c1.b + factor * (c2.b - c1.b));
            
            return rgbToHex(r, g, b);
        },
        
        // Get current gradient points (interpolated if transitioning)
        getCurrentGradientPoints: function() {
            if (!this.animState.isTransitioning) {
                return this.colorThemes[this.animState.currentThemeIndex];
            }
            
            const currentTheme = this.colorThemes[this.animState.currentThemeIndex];
            const nextTheme = this.colorThemes[this.animState.nextThemeIndex];
            const progress = this.animState.transitionProgress;
            
            // Handle themes with different numbers of points
            const maxPoints = Math.max(currentTheme.length, nextTheme.length);
            const interpolatedPoints = [];
            
            for (let i = 0; i < maxPoints; i++) {
                const currentPoint = currentTheme[Math.min(i, currentTheme.length - 1)];
                const nextPoint = nextTheme[Math.min(i, nextTheme.length - 1)];
                
                // Interpolate position and color
                interpolatedPoints.push({
                    x: currentPoint.x + (nextPoint.x - currentPoint.x) * progress,
                    y: currentPoint.y + (nextPoint.y - currentPoint.y) * progress,
                    color: this.interpolateColor(currentPoint.color, nextPoint.color, progress)
                });
            }
            
            return interpolatedPoints;
        },
        
        startAnimation: function(canvas) {
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // Particle system
            const particles = [];
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 1,
                    color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`,
                    vx: Math.random() * 0.5 - 0.25,
                    vy: Math.random() * 0.5 - 0.25
                });
            }
            
            // Animation variables
            let time = 0;
            let mouseX = 0;
            let mouseY = 0;
            
            // Track mouse position
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / canvas.width;
                mouseY = (e.clientY - rect.top) / canvas.height;
            });
            
            // Animation function
            const animate = (timestamp) => {
                // Calculate delta time in seconds
                const deltaTime = (timestamp - this.animState.lastTimestamp) / 1000;
                this.animState.lastTimestamp = timestamp;
                
                // Update theme transition
                if (this.animState.isTransitioning) {
                    // Progress the transition
                    this.animState.transitionProgress += deltaTime / this.animState.transitionDuration;
                    
                    // Check if transition is complete
                    if (this.animState.transitionProgress >= 1) {
                        this.animState.isTransitioning = false;
                        this.animState.transitionProgress = 0;
                        this.animState.currentThemeIndex = this.animState.nextThemeIndex;
                        this.animState.nextThemeIndex = (this.animState.currentThemeIndex + 1) % this.colorThemes.length;
                        this.animState.timeUntilNextTransition = 60; // Reset timer
                    }
                } else {
                    // Count down to next automatic transition
                    this.animState.timeUntilNextTransition -= deltaTime;
                    if (this.animState.timeUntilNextTransition <= 0) {
                        this.animState.isTransitioning = true;
                        this.animState.transitionProgress = 0;
                    }
                }
                
                time += 0.01;
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Get current gradient points (interpolated if transitioning)
                const gradientPoints = this.getCurrentGradientPoints();
                
                // Create dynamic gradient
                const gradient = ctx.createRadialGradient(
                    canvas.width * (0.5 + Math.sin(time * 0.2) * 0.2 + mouseX * 0.1),
                    canvas.height * (0.5 + Math.cos(time * 0.3) * 0.2 + mouseY * 0.1),
                    0,
                    canvas.width * 0.5,
                    canvas.height * 0.5,
                    Math.max(canvas.width, canvas.height) * 0.8
                );
                
                // Add color stops
                gradientPoints.forEach((point, index) => {
                    const r = (index / gradientPoints.length) + Math.sin(time + index) * 0.1;
                    gradient.addColorStop(Math.max(0, Math.min(1, r)), point.color);
                });
                
                // Fill background
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw particles
                particles.forEach(p => {
                    // Update position
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Wrap around
                    if (p.x < 0) p.x = canvas.width;
                    if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height;
                    if (p.y > canvas.height) p.y = 0;
                    
                    // Draw particle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                });
                
                // Draw blurred overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.filter = 'blur(40px)';
                
                for (let i = 0; i < 3; i++) {
                    const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * canvas.width;
                    const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * canvas.height;
                    const radius = 100 + Math.sin(time + i) * 50;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.filter = 'none';
                
                // Continue animation
                state.animationController = requestAnimationFrame(animate);
            };
            
            // Start animation
            this.animState.lastTimestamp = performance.now();
            state.animationController = requestAnimationFrame(animate);
        },
        
        stopAnimation: function() {
            if (state.animationController) {
                cancelAnimationFrame(state.animationController);
                state.animationController = null;
            }
        }
    };
    
    // CSS styles for desktop environment
    const injectStyles = function() {
        const styleEl = document.createElement('style');
        styleEl.id = 'desktop-integration-styles';
        styleEl.textContent = `
            #desktop-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #111;
                overflow: hidden;
                font-family: 'Segoe UI', 'Arial', sans-serif;
                color: #fff;
                z-index: 99999;
            }
            
            /* Window styles */
            .window-container {
                position: absolute;
                background-color: rgba(30, 30, 30, 0.7);
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                transition: box-shadow 0.3s ease;
                min-width: 300px;
                min-height: 200px;
            }
            
            .window-container.active {
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
            }
            
            .window-container.minimized {
                display: none;
            }
            
            .window-container.maximized {
                border-radius: 0;
            }
            
            .window-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 12px;
                background-color: rgba(50, 50, 50, 0.7);
                cursor: move;
                height: 32px;
            }
            
            .window-title {
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 10px;
            }
            
            .window-controls {
                display: flex;
                gap: 6px;
            }
            
            .window-control {
                background: none;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 12px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.2s;
            }
            
            .window-control:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .window-control.close:hover {
                background-color: rgba(232, 17, 35, 0.9);
            }
            
            .window-content {
                height: calc(100% - 32px);
                overflow: auto;
                position: relative;
            }
            
            .window-resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 16px;
                height: 16px;
                cursor: nwse-resize;
            }
            
            .window-resize-handle::after {
                content: '';
                position: absolute;
                right: 3px;
                bottom: 3px;
                width: 8px;
                height: 8px;
                border-right: 2px solid rgba(255, 255, 255, 0.5);
                border-bottom: 2px solid rgba(255, 255, 255, 0.5);
            }
            
            /* Taskbar styles */
            #desktop-taskbar {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 40px;
                background-color: rgba(30, 30, 30, 0.7);
                display: flex;
                align-items: center;
                padding: 0 8px;
                z-index: 1000;
            }
            
            #start-button {
                background: none;
                border: none;
                height: 32px;
                padding: 0 12px;
                border-radius: 4px;
                color: #fff;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            #start-button:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            #taskbar-window-buttons {
                display: flex;
                gap: 4px;
                margin-left: 8px;
                overflow-x: auto;
                flex: 1;
            }
            
            .taskbar-window-button {
                background: rgba(60, 60, 60, 0.5);
                border: none;
                height: 32px;
                padding: 0 12px;
                border-radius: 4px;
                color: #fff;
                font-size: 13px;
                display: flex;
                align-items: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                max-width: 200px;
                transition: background-color 0.2s;
            }
            
            .taskbar-window-button:hover {
                background-color: rgba(80, 80, 80, 0.5);
            }
            
            .taskbar-window-button.active {
                background-color: rgba(100, 100, 100, 0.8);
                box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.5);
            }
            
            #system-tray {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
            }
            
            #toggle-desktop-mode {
                background: none;
                border: none;
                height: 32px;
                width: 32px;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            #toggle-desktop-mode:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            #taskbar-clock {
                font-size: 13px;
                padding: 0 8px;
            }
            
            /* Start menu */
            #start-menu {
                position: absolute;
                bottom: 40px;
                width: 280px;
                background-color: rgba(30, 30, 30, 0.9);
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                z-index: 1100;
            }
            
            .start-menu-item {
                background: none;
                border: none;
                height: 40px;
                padding: 0 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #fff;
                text-align: left;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .start-menu-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .start-menu-item i {
                width: 16px;
                text-align: center;
            }
            
            .menu-separator {
                height: 1px;
                background-color: rgba(255, 255, 255, 0.1);
                margin: 4px 0;
            }
            
            .power-button {
                color: #e81123;
            }
            
            /* Loading spinner */
            .loading-spinner {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                gap: 12px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .loading-spinner i {
                font-size: 24px;
            }
            
            /* Desktop button */
            #desktop-toggle-button {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9998;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: background-color 0.2s;
            }
            
            #desktop-toggle-button:hover {
                background: rgba(0, 0, 0, 0.8);
            }
            
            /* Ensure FontAwesome icons are loaded */
            .fa, .fas, .far, .fab {
                font-family: 'Font Awesome 5 Free', 'Font Awesome 5 Brands';
                font-weight: 900;
            }
        `;
        
        document.head.appendChild(styleEl);
    };
    
    // Add FontAwesome if not already present
    const loadFontAwesome = function() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(link);
        }
    };
    
    // Initialize desktop environment
    const initDesktop = function() {
        // Create desktop container
        const desktopContainer = document.createElement('div');
        desktopContainer.id = 'desktop-container';
        document.body.appendChild(desktopContainer);
        
        // Initialize background animation
        backgroundAnimator.init(desktopContainer);
        
        // Initialize taskbar
        taskbarManager.init();
        
        // Store original content
        if (!state.originalContent) {
            const mainContent = document.getElementById('php-wasm-container');
            if (mainContent) {
                state.originalContent = mainContent.parentNode.innerHTML;
            }
        }
        
        // Create main window with PHP-WASM content
        if (document.getElementById('php-wasm-container')) {
            // Move the PHP-WASM container to desktop
            windowManager.createWindow('PHP Editor', document.getElementById('php-wasm-container'), {
                width: 1000,
                height: 700,
                x: (window.innerWidth - 1000) / 2,
                y: (window.innerHeight - 700) / 2
            });
        } else {
            // Create a placeholder window
            windowManager.createWindow('Welcome', `
                <div style="padding: 20px; text-align: center;">
                    <h2>Welcome to AlgorithmPress Desktop</h2>
                    <p>The PHP-WASM container is not available.</p>
                </div>
            `, {
                width: 600,
                height: 400,
                x: (window.innerWidth - 600) / 2,
                y: (window.innerHeight - 400) / 2
            });
        }
        
        // Initialize NaraUI if available
        if (window.NaraUI) {
            NaraUI.init({
                intensity: 0.8,
                reflectionFrequency: 0.4,
                glassOpacity: 0.7,
                blurStrength: 12,
                glowStrength: 6,
                accentHue: 210
            });
        }
        
        state.desktopMode = true;
    };
    
    // Exit desktop mode
    const exitDesktop = function() {
        // Stop background animation
        backgroundAnimator.stopAnimation();
        
        // Restore original content if available
        if (state.originalContent) {
            document.body.innerHTML = state.originalContent;
        }
        
        // Clean up color synchronizer
        if (builderColorSynchronizer && typeof builderColorSynchronizer.destroy === 'function') {
            builderColorSynchronizer.destroy();
        }
        
        // Remove desktop container
        const desktopContainer = document.getElementById('desktop-container');
        if (desktopContainer) {
            desktopContainer.remove();
        }
        
        // Add toggle button back
        addDesktopToggleButton();
        
        // Dispatch event for other modules to know desktop mode is deactivated
        const event = new CustomEvent('desktop-mode-deactivated');
        document.dispatchEvent(event);
        
        state.desktopMode = false;
    };
    
    // Builder element color synchronizer
    const builderColorSynchronizer = {
        // State for tracking color updates
        state: {
            colorUpdateInterval: null,
            lastDominantColors: [],
            targetElements: [],
            colorUpdateFrequency: 500, // ms
            contrastThreshold: 4.5, // WCAG AA standard
            textElements: [] // Elements that need high contrast
        },
        
        // Initialize color synchronization
        init: function() {
            // Clear any existing interval
            if (this.state.colorUpdateInterval) {
                clearInterval(this.state.colorUpdateInterval);
            }
            
            // Find builder elements that need to be synchronized
            this.findBuilderElements();
            
            // Apply initial styles if possible
            this.applyDynamicStyles();
            
            // Set up regular color sampling and style updates
            this.state.colorUpdateInterval = setInterval(() => {
                this.updateElementColors();
            }, this.state.colorUpdateFrequency);
            
            // Listen for background theme changes
            document.addEventListener('background-theme-changed', () => {
                // Force immediate update when theme changes
                setTimeout(() => this.updateElementColors(), 100);
            });
            
            console.log('Builder color synchronizer initialized');
        },
        
        // Find all builder elements that need color adaptation
        findBuilderElements: function() {
            const mainContainer = document.getElementById('php-wasm-container');
            if (!mainContainer) return;
            
            // Reset target elements array
            this.state.targetElements = [];
            this.state.textElements = [];
            
            // Find all main container elements in the builder
            // These selectors should match your builder's main UI components
            const builderSelectors = [
                '.php-editor', 
                '.editor-panel',
                '.code-container', 
                '.output-container',
                '.control-panel',
                '.builder-sidebar',
                '.tool-panel',
                '.component-preview',
                '.property-editor',
                '.builder-header',
                '.builder-footer',
                '.module-container',
                '.wp-connector-panel',
                '.code-window',
                '.config-panel',
                '.component-browser',
                '.preview-frame',
                '.toolbar-container',
                '.panel-header',
                '.panel-footer',
                '.file-browser',
                '.component-library',
                '.layout-editor',
                '.option-panel'
            ];
            
            // Text elements that need high contrast
            const textSelectors = [
                '.editor-label',
                '.option-label',
                '.component-name',
                '.file-name',
                '.property-name',
                '.menu-item-text',
                '.status-text',
                '.console-output',
                '.property-value',
                '.panel-title',
                'textarea',
                'input[type="text"]',
                'select',
                '.component-description',
                '.help-text',
                '.tooltip-content',
                '.error-message',
                '.success-message',
                '.info-message'
            ];
            
            // Find all matching elements
            builderSelectors.forEach(selector => {
                try {
                    const elements = mainContainer.querySelectorAll(selector);
                    if (elements && elements.length > 0) {
                        elements.forEach(el => this.state.targetElements.push(el));
                    }
                } catch (e) {
                    console.warn('Error finding builder elements:', e);
                }
            });
            
            // Find text elements
            textSelectors.forEach(selector => {
                try {
                    const elements = mainContainer.querySelectorAll(selector);
                    if (elements && elements.length > 0) {
                        elements.forEach(el => this.state.textElements.push(el));
                    }
                } catch (e) {
                    console.warn('Error finding text elements:', e);
                }
            });
            
            // Also handle the window content containing the PHP builder
            const builderWindow = document.querySelector('.window-content');
            if (builderWindow) {
                this.state.targetElements.push(builderWindow);
            }
            
            console.log(`Found ${this.state.targetElements.length} builder elements to synchronize`);
        },
        
        // Sample the current background colors
        sampleBackgroundColors: function() {
            const canvas = state.backgroundCanvas;
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            // Sample points in a grid pattern
            const samplePoints = [
                {x: width * 0.25, y: height * 0.25},
                {x: width * 0.75, y: height * 0.25},
                {x: width * 0.5, y: height * 0.5},
                {x: width * 0.25, y: height * 0.75},
                {x: width * 0.75, y: height * 0.75}
            ];
            
            const colors = [];
            
            // Sample colors from each point
            samplePoints.forEach(point => {
                try {
                    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
                    colors.push({
                        r: pixel[0],
                        g: pixel[1],
                        b: pixel[2],
                        a: pixel[3] / 255
                    });
                } catch (e) {
                    console.warn('Error sampling background color:', e);
                }
            });
            
            return colors;
        },
        
        // Calculate brightness of a color (0-1)
        calculateBrightness: function(r, g, b) {
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        },
        
        // Calculate contrast ratio between two colors
        calculateContrast: function(color1, color2) {
            const luminance1 = this.calculateBrightness(color1.r, color1.g, color1.b);
            const luminance2 = this.calculateBrightness(color2.r, color2.g, color2.b);
            
            const lighter = Math.max(luminance1, luminance2);
            const darker = Math.min(luminance1, luminance2);
            
            return (lighter + 0.05) / (darker + 0.05);
        },
        
        // Get appropriate text color for a background
        getTextColor: function(bgColor) {
            const brightness = this.calculateBrightness(bgColor.r, bgColor.g, bgColor.b);
            
            // If background is dark, use white text
            if (brightness < 0.5) {
                return {r: 255, g: 255, b: 255};
            } else {
                return {r: 0, g: 0, b: 0};
            }
        },
        
        // Create a complementary color
        getComplementaryColor: function(color) {
            return {
                r: 255 - color.r,
                g: 255 - color.g,
                b: 255 - color.b,
                a: color.a
            };
        },
        
        // Create a derived color with adjustments
        deriveColor: function(baseColor, options = {}) {
            const {
                lighten = 0,
                darken = 0,
                alpha = null,
                saturation = 0
            } = options;
            
            // Convert RGB to HSL
            let r = baseColor.r / 255;
            let g = baseColor.g / 255;
            let b = baseColor.b / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                
                h /= 6;
            }
            
            // Apply adjustments
            l = Math.max(0, Math.min(1, l + lighten - darken));
            s = Math.max(0, Math.min(1, s + saturation));
            
            // Convert back to RGB
            let r1, g1, b1;
            
            if (s === 0) {
                r1 = g1 = b1 = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                
                r1 = hue2rgb(p, q, h + 1/3);
                g1 = hue2rgb(p, q, h);
                b1 = hue2rgb(p, q, h - 1/3);
            }
            
            // Return new color
            return {
                r: Math.round(r1 * 255),
                g: Math.round(g1 * 255),
                b: Math.round(b1 * 255),
                a: alpha !== null ? alpha : (baseColor.a || 1)
            };
        },
        
        // Convert color object to CSS rgba string
        colorToCss: function(color) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
        },
        
        // Update element colors based on background
        updateElementColors: function() {
            // Sample background colors
            const colors = this.sampleBackgroundColors();
            if (!colors || colors.length === 0) return;
            
            // Calculate average color
            let avgR = 0, avgG = 0, avgB = 0;
            colors.forEach(color => {
                avgR += color.r;
                avgG += color.g;
                avgB += color.b;
            });
            
            const avgColor = {
                r: Math.round(avgR / colors.length),
                g: Math.round(avgG / colors.length),
                b: Math.round(avgB / colors.length),
                a: 0.85
            };
            
            // Store for comparison
            this.state.lastDominantColors = colors;
            
            // Apply styles
            this.applyDynamicStyles(avgColor, colors);
            
            // Dispatch event for other components to react
            const event = new CustomEvent('builder-colors-updated', {
                detail: {
                    dominantColor: avgColor,
                    sampledColors: colors
                }
            });
            document.dispatchEvent(event);
        },
        
        // Apply dynamic styles to builder elements
        applyDynamicStyles: function(avgColor, colors) {
            if (!avgColor && this.state.lastDominantColors.length > 0) {
                // Use last colors if not provided
                colors = this.state.lastDominantColors;
                avgColor = {
                    r: Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length),
                    g: Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length),
                    b: Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length),
                    a: 0.85
                };
            }
            
            if (!avgColor) return;
            
            // Get text color based on background
            const textColor = this.getTextColor(avgColor);
            const isDarkBackground = this.calculateBrightness(avgColor.r, avgColor.g, avgColor.b) < 0.5;
            
            // Calculate base panel color (slightly lighter/darker than background)
            const panelBaseColor = this.deriveColor(avgColor, {
                lighten: isDarkBackground ? 0.1 : 0,
                darken: isDarkBackground ? 0 : 0.1,
                alpha: 0.7
            });
            
            // Calculate accent color
            const accentColor = colors.length >= 2 ? 
                this.deriveColor(colors[1], { saturation: 0.2, alpha: 0.9 }) : 
                this.deriveColor(avgColor, { saturation: 0.3, alpha: 0.9 });
            
            // Apply styles to target elements
            this.state.targetElements.forEach((element, index) => {
                // Vary the transparency and color slightly for each element
                // to create visual interest and depth
                const adjustmentFactor = (index % 5) * 0.03;
                
                // Create derived colors for this specific element
                const elementBaseColor = this.deriveColor(panelBaseColor, {
                    lighten: isDarkBackground ? adjustmentFactor : 0,
                    darken: isDarkBackground ? 0 : adjustmentFactor,
                    alpha: 0.7 - adjustmentFactor
                });
                
                // Apply styles based on element type
                element.style.backgroundColor = this.colorToCss(elementBaseColor);
                
                // Add a subtle border for definition if it doesn't have one
                if (getComputedStyle(element).borderWidth === '0px') {
                    const borderColor = this.deriveColor(elementBaseColor, {
                        lighten: isDarkBackground ? 0.1 : 0,
                        darken: isDarkBackground ? 0 : 0.1,
                        alpha: 0.3
                    });
                    element.style.borderBottom = `1px solid ${this.colorToCss(borderColor)}`;
                }
                
                // Add box shadow for depth
                const shadowColor = isDarkBackground ? 
                    'rgba(0, 0, 0, 0.2)' : 
                    'rgba(0, 0, 0, 0.15)';
                    
                element.style.boxShadow = `0 2px 8px ${shadowColor}`;
                
                // Add subtle backdrop filter if supported
                if ('backdropFilter' in document.documentElement.style) {
                    element.style.backdropFilter = 'blur(8px)';
                } else if ('webkitBackdropFilter' in document.documentElement.style) {
                    element.style.webkitBackdropFilter = 'blur(8px)';
                }
                
                // Update border radius for consistent styling
                if (getComputedStyle(element).borderRadius === '0px') {
                    element.style.borderRadius = '6px';
                }
            });
            
            // Update text elements to ensure readability
            this.state.textElements.forEach(element => {
                // Get background color of this element or its parent
                const bgStyles = window.getComputedStyle(element);
                let bgColor = {r: avgColor.r, g: avgColor.g, b: avgColor.b};
                
                if (bgStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && bgStyles.backgroundColor !== 'transparent') {
                    // Extract RGB from background color
                    const match = bgStyles.backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)/);
                    if (match) {
                        bgColor = {
                            r: parseInt(match[1]),
                            g: parseInt(match[2]),
                            b: parseInt(match[3])
                        };
                    }
                }
                
                // Determine text color based on background
                const elementTextColor = this.getTextColor(bgColor);
                
                // Apply high-contrast text color
                element.style.color = this.colorToCss(elementTextColor);
                
                // Add text shadow for better readability if text is light on dark
                if (elementTextColor.r > 200) {
                    element.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
                } else {
                    element.style.textShadow = 'none';
                }
            });
            
            // Set CSS variables for consistent styling
            const rootElement = document.documentElement;
            rootElement.style.setProperty('--builder-bg-color', this.colorToCss(avgColor));
            rootElement.style.setProperty('--builder-panel-color', this.colorToCss(panelBaseColor));
            rootElement.style.setProperty('--builder-accent-color', this.colorToCss(accentColor));
            rootElement.style.setProperty('--builder-text-color', this.colorToCss(textColor));
        },
        
        // Clean up when no longer needed
        destroy: function() {
            if (this.state.colorUpdateInterval) {
                clearInterval(this.state.colorUpdateInterval);
                this.state.colorUpdateInterval = null;
            }
        }
    };
    
    // Add desktop toggle button to main UI
    const addDesktopToggleButton = function() {
        // Remove existing button if any
        const existingBtn = document.getElementById('desktop-toggle-button');
        if (existingBtn) existingBtn.remove();
        
        // Create new button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'desktop-toggle-button';
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop Mode';
        toggleButton.addEventListener('click', () => {
            DesktopIntegration.toggleDesktopMode();
        });
        
        document.body.appendChild(toggleButton);
    };
    
    // Public API
    return {
        // Initialize the desktop integration
        init: function() {
            if (state.initialized) return this;
            
            // Load Font Awesome
            loadFontAwesome();
            
            // Inject CSS styles
            injectStyles();
            
            // Add desktop toggle button
            addDesktopToggleButton();
            
            state.initialized = true;
            
            return this;
        },
        
        // Toggle between desktop and normal modes
        toggleDesktopMode: function() {
            if (state.desktopMode) {
                exitDesktop();
            } else {
                initDesktop();
            }
            
            return this;
        },
        
        // Get current state
        getState: function() {
            return {
                initialized: state.initialized,
                desktopMode: state.desktopMode,
                windowCount: state.windows.length
            };
        },
        
        // Create a new window
        createWindow: function(title, content, options) {
            if (!state.desktopMode) {
                this.toggleDesktopMode();
            }
            
            return windowManager.createWindow(title, content, options);
        },
        
        // Cycle to the next background theme
        cycleBackgroundTheme: function() {
            if (state.desktopMode && backgroundAnimator) {
                backgroundAnimator.cycleToNextTheme();
            }
            return this;
        },
        
        // Set a specific background theme by index
        setBackgroundTheme: function(themeIndex) {
            if (!state.desktopMode || !backgroundAnimator) return this;
            
            if (themeIndex >= 0 && themeIndex < backgroundAnimator.colorThemes.length) {
                backgroundAnimator.animState.isTransitioning = true;
                backgroundAnimator.animState.transitionProgress = 0;
                backgroundAnimator.animState.nextThemeIndex = themeIndex;
            }
            
            return this;
        },
        
        // Access to window manager for external use
        windowManager: windowManager
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    DesktopIntegration.init();
});

// Export for global access
window.DesktopIntegration = DesktopIntegration;
