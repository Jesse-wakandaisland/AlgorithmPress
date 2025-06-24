/**
 * RainbowIndicator - A module that adds rainbow border animations to elements
 * as a visual indicator for ongoing events.
 */
const RainbowIndicator = (function() {
    // Private variables to track state and active animations
    const activeIndicators = new Map();
    let idCounter = 0;
    
    /**
     * Injects required CSS styles into the document
     */
    function injectStyles() {
        if (document.getElementById('rainbow-indicator-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'rainbow-indicator-styles';
        styleEl.textContent = `
            .rainbow-indicator-container {
                position: relative !important;
                z-index: 1;
            }
            
            .rainbow-indicator-glow {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                border-radius: inherit;
                z-index: -1;
            }
            
            .rainbow-indicator-glow:before {
                content: '';
                display: block;
                position: absolute;
                width: 200%;
                height: 200%;
                right: -50%;
                bottom: -50%;
                top: -50%;
                left: -50%;
                background-position: center center;
                background-image: conic-gradient(from 0 at 50% 50%, transparent 50%, #fff845, #1cc98c, #24cbde, #57a9f7, #bd52f9, #ebb347);
                animation: rainbowGlowRotate 4s linear infinite;
                filter: blur(20px);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .rainbow-indicator-border {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                border-radius: inherit;
                overflow: hidden;
            }
            
            .rainbow-indicator-border:before {
                content: '';
                display: block;
                position: absolute;
                width: 200%;
                height: 200%;
                right: -50%;
                bottom: -50%;
                top: -50%;
                left: -50%;
                background-position: center center;
                background-image: conic-gradient(from 0 at 50% 50%, transparent 50%, #fff845, #1cc98c, #24cbde, #57a9f7, #bd52f9, #ebb347);
                animation: rainbowRotate 4s linear infinite;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .rainbow-indicator-active .rainbow-indicator-glow:before,
            .rainbow-indicator-active .rainbow-indicator-border:before {
                opacity: 1;
            }
            
            @keyframes rainbowRotate {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
            
            @keyframes rainbowGlowRotate {
                0% {
                    transform: rotate(0deg) scale(0.3);
                }
                50% {
                    transform: rotate(180deg) scale(0.3);
                }
                100% {
                    transform: rotate(360deg) scale(0.3);
                }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Creates the necessary DOM elements for the indicator
     * @param {HTMLElement} targetEl - The target element to apply the indicator to
     */
    function createIndicatorElements(targetEl) {
        // Add container class
        if (!targetEl.classList.contains('rainbow-indicator-container')) {
            targetEl.classList.add('rainbow-indicator-container');
        }
        
        // Create glow element if it doesn't exist
        if (!targetEl.querySelector('.rainbow-indicator-glow')) {
            const glowEl = document.createElement('div');
            glowEl.className = 'rainbow-indicator-glow';
            targetEl.appendChild(glowEl);
        }
        
        // Create border element if it doesn't exist
        if (!targetEl.querySelector('.rainbow-indicator-border')) {
            const borderEl = document.createElement('div');
            borderEl.className = 'rainbow-indicator-border';
            targetEl.appendChild(borderEl);
        }
    }
    
    /**
     * Sets up an intersection observer for the element
     * @param {HTMLElement} targetEl - The target element
     * @param {Object} options - Configuration options
     * @returns {IntersectionObserver|null} - The created observer or null
     */
    function setupIntersectionObserver(targetEl, options) {
        if (!options.useIntersectionObserver) return null;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = targetEl.dataset.rainbowIndicatorId;
                const indicator = activeIndicators.get(id);
                
                if (!indicator) return;
                
                if (entry.isIntersecting) {
                    if (indicator.active && !indicator.visible) {
                        targetEl.classList.add('rainbow-indicator-active');
                        indicator.visible = true;
                    }
                } else {
                    if (indicator.visible) {
                        targetEl.classList.remove('rainbow-indicator-active');
                        indicator.visible = false;
                    }
                }
            });
        }, {
            root: options.root || null,
            rootMargin: options.rootMargin || '0px',
            threshold: options.threshold || 0
        });
        
        observer.observe(targetEl);
        return observer;
    }
    
    /**
     * Sets up a mutation observer to maintain the indicator elements
     * @param {HTMLElement} targetEl - The target element
     * @returns {MutationObserver} - The created observer
     */
    function setupMutationObserver(targetEl) {
        const observer = new MutationObserver((mutations) => {
            let needsRebuild = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Check if our indicator elements were removed
                    const glowEl = targetEl.querySelector('.rainbow-indicator-glow');
                    const borderEl = targetEl.querySelector('.rainbow-indicator-border');
                    
                    if (!glowEl || !borderEl) {
                        needsRebuild = true;
                    }
                }
            });
            
            if (needsRebuild) {
                createIndicatorElements(targetEl);
            }
        });
        
        observer.observe(targetEl, { childList: true });
        return observer;
    }
    
    /**
     * Activates the indicator on a target element
     * @param {HTMLElement} targetEl - The target element
     */
    function activateIndicator(targetEl) {
        const id = targetEl.dataset.rainbowIndicatorId;
        if (!activeIndicators.has(id)) return;
        
        const indicator = activeIndicators.get(id);
        indicator.active = true;
        
        // Only show the visual indicator if visible (or if not using intersection observer)
        if (!indicator.useIntersectionObserver || indicator.visible) {
            targetEl.classList.add('rainbow-indicator-active');
        }
        
        // Call user's onStart callback if provided
        if (typeof indicator.onStart === 'function') {
            indicator.onStart(targetEl);
        }
        
        // Set up auto deactivation timer if specified
        if (indicator.duration > 0) {
            if (indicator.timer) clearTimeout(indicator.timer);
            
            indicator.timer = setTimeout(() => {
                deactivateIndicator(targetEl);
            }, indicator.duration);
        }
    }
    
    /**
     * Deactivates the indicator on a target element
     * @param {HTMLElement} targetEl - The target element
     */
    function deactivateIndicator(targetEl) {
        const id = targetEl.dataset.rainbowIndicatorId;
        if (!activeIndicators.has(id)) return;
        
        const indicator = activeIndicators.get(id);
        indicator.active = false;
        
        targetEl.classList.remove('rainbow-indicator-active');
        
        // Clear any existing timer
        if (indicator.timer) {
            clearTimeout(indicator.timer);
            indicator.timer = null;
        }
        
        // Call user's onEnd callback if provided
        if (typeof indicator.onEnd === 'function') {
            indicator.onEnd(targetEl, indicator.eventData);
        }
        
        // Reset event data
        indicator.eventData = null;
    }
    
    /**
     * Initializes event listeners for automatic indicator activation
     * @param {HTMLElement} targetEl - The element to apply the indicator to
     * @param {Object} options - Configuration options
     * @returns {Object} - Map of registered event listeners
     */
    function setupEventListeners(targetEl, options) {
        const eventCallbacks = {};
        
        if (options.events && options.events.length) {
            options.events.forEach(eventConfig => {
                const { name, target, start, end } = eventConfig;
                const eventTarget = target || document;
                
                const callback = function(event) {
                    // Get indicator data
                    const id = targetEl.dataset.rainbowIndicatorId;
                    const indicator = activeIndicators.get(id);
                    if (!indicator) return;
                    
                    // Check if this is a start event
                    if (typeof start === 'function') {
                        const shouldActivate = start(event);
                        if (shouldActivate) {
                            activateIndicator(targetEl);
                            // Store event data if needed for deactivation
                            indicator.eventData = event;
                            return;
                        }
                    }
                    
                    // Check if this is an end event
                    if (typeof end === 'function') {
                        const shouldDeactivate = end(event);
                        if (shouldDeactivate) {
                            deactivateIndicator(targetEl);
                            return;
                        }
                    }
                };
                
                eventTarget.addEventListener(name, callback);
                if (!eventCallbacks[name]) {
                    eventCallbacks[name] = [];
                }
                eventCallbacks[name].push({
                    target: eventTarget,
                    callback
                });
            });
        }
        
        return eventCallbacks;
    }
    
    /**
     * Applies custom styles to the indicator elements
     * @param {HTMLElement} targetEl - The target element
     * @param {string} id - The indicator ID
     * @param {Object} config - Configuration options
     */
    function applyCustomStyles(targetEl, id, config) {
        // Apply custom styles
        const glowEl = targetEl.querySelector('.rainbow-indicator-glow');
        const borderEl = targetEl.querySelector('.rainbow-indicator-border');
        
        if (glowEl) {
            glowEl.style.filter = `blur(${config.glowSize}px)`;
        }
        
        if (borderEl) {
            borderEl.style.padding = `${config.borderSize}px`;
        }
        
        // Apply custom colors if provided
        if (config.customColors) {
            const styleId = `rainbow-indicator-style-${id}`;
            let styleEl = document.getElementById(styleId);
            
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            
            styleEl.textContent = `
                [data-rainbow-indicator-id="${id}"] .rainbow-indicator-glow:before,
                [data-rainbow-indicator-id="${id}"] .rainbow-indicator-border:before {
                    background-image: conic-gradient(from 0 at 50% 50%, transparent 50%, ${config.customColors.join(', ')});
                    animation-duration: ${config.animationSpeed}s;
                }
            `;
        }
    }
    
    /**
     * Main initialization function
     * @param {string|HTMLElement} selector - CSS selector or element to apply indicator to
     * @param {Object} options - Configuration options
     * @returns {Object|Array} - Instance API object or array of instances
     */
    function init(selector, options = {}) {
        // Make sure styles are injected
        injectStyles();
        
        // Get target element(s)
        const elements = typeof selector === 'string' 
            ? document.querySelectorAll(selector) 
            : [selector];
        
        const instances = [];
        
        elements.forEach(el => {
            // Skip if element doesn't exist
            if (!el) return;
            
            // Create a unique ID for this indicator
            const id = `rainbow-indicator-${idCounter++}`;
            el.dataset.rainbowIndicatorId = id;
            
            // Create indicator elements
            createIndicatorElements(el);
            
            // Default options
            const config = {
                useIntersectionObserver: options.useIntersectionObserver !== false,
                duration: options.duration || 0, // 0 means it stays active until manually deactivated
                glowSize: options.glowSize || 20,
                borderSize: options.borderSize || 2,
                animationSpeed: options.animationSpeed || 4,
                events: options.events || [],
                onStart: options.onStart || null,
                onEnd: options.onEnd || null,
                customColors: options.customColors || null,
                root: options.root || null,
                rootMargin: options.rootMargin || '0px',
                threshold: options.threshold || 0
            };
            
            // Apply custom styles
            applyCustomStyles(el, id, config);
            
            // Setup intersection observer
            const intersectionObserver = setupIntersectionObserver(el, config);
            
            // Setup mutation observer to maintain indicator elements
            const mutationObserver = setupMutationObserver(el);
            
            // Setup event listeners
            const eventCallbacks = setupEventListeners(el, config);
            
            // Store indicator data
            activeIndicators.set(id, {
                element: el,
                config,
                active: false,
                visible: !config.useIntersectionObserver, // If not using IntersectionObserver, consider it always visible
                intersectionObserver,
                mutationObserver,
                eventCallbacks,
                timer: null,
                eventData: null,
                onStart: config.onStart,
                onEnd: config.onEnd,
                useIntersectionObserver: config.useIntersectionObserver,
                duration: config.duration
            });
            
            // Create instance API
            const instance = {
                id,
                element: el,
                // Public methods
                start: () => {
                    activateIndicator(el);
                    return instance;
                },
                stop: () => {
                    deactivateIndicator(el);
                    return instance;
                },
                toggle: () => {
                    const indicator = activeIndicators.get(id);
                    if (indicator && indicator.active) {
                        deactivateIndicator(el);
                    } else {
                        activateIndicator(el);
                    }
                    return instance;
                },
                isActive: () => {
                    const indicator = activeIndicators.get(id);
                    return indicator ? indicator.active : false;
                },
                update: (newOptions) => {
                    const indicator = activeIndicators.get(id);
                    if (!indicator) return instance;
                    
                    // Update configuration
                    Object.assign(indicator.config, newOptions);
                    
                    // Apply updated styles
                    applyCustomStyles(el, id, indicator.config);
                    
                    return instance;
                },
                destroy: () => {
                    const indicator = activeIndicators.get(id);
                    if (!indicator) return;
                    
                    // Remove event listeners
                    if (indicator.eventCallbacks) {
                        Object.entries(indicator.eventCallbacks).forEach(([_, callbacksArray]) => {
                            callbacksArray.forEach(({target, callback}) => {
                                target.removeEventListener(_, callback);
                            });
                        });
                    }
                    
                    // Disconnect observers
                    if (indicator.intersectionObserver) {
                        indicator.intersectionObserver.disconnect();
                    }
                    
                    if (indicator.mutationObserver) {
                        indicator.mutationObserver.disconnect();
                    }
                    
                    // Clear any timers
                    if (indicator.timer) {
                        clearTimeout(indicator.timer);
                    }
                    
                    // Remove classes and attributes
                    el.classList.remove('rainbow-indicator-container', 'rainbow-indicator-active');
                    delete el.dataset.rainbowIndicatorId;
                    
                    // Remove elements
                    const glowEl = el.querySelector('.rainbow-indicator-glow');
                    const borderEl = el.querySelector('.rainbow-indicator-border');
                    
                    if (glowEl) el.removeChild(glowEl);
                    if (borderEl) el.removeChild(borderEl);
                    
                    // Remove custom styles
                    const styleEl = document.getElementById(`rainbow-indicator-style-${id}`);
                    if (styleEl) {
                        document.head.removeChild(styleEl);
                    }
                    
                    // Remove from active indicators
                    activeIndicators.delete(id);
                }
            };
            
            instances.push(instance);
        });
        
        return instances.length === 1 ? instances[0] : instances;
    }
    
    /**
     * Auto-hooks into common events for automatic indicator activation
     * @param {Object} indicator - The indicator instance
     */
    function setupAutoHooks(indicator) {
        // Track AJAX requests
        if (window.XMLHttpRequest) {
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
                this.addEventListener('loadstart', () => {
                    indicator.start();
                });
                
                this.addEventListener('loadend', () => {
                    indicator.stop();
                });
                
                return originalXHR.apply(this, arguments);
            };
        }
        
        // Track fetch requests
        if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function() {
                indicator.start();
                
                return originalFetch.apply(this, arguments)
                    .then(response => {
                        indicator.stop();
                        return response;
                    })
                    .catch(error => {
                        indicator.stop();
                        throw error;
                    });
            };
        }
        
        // Form submissions
        document.addEventListener('submit', () => {
            indicator.start();
        });
        
        // Page transitions
        window.addEventListener('beforeunload', () => {
            indicator.start();
        });
        
        // History navigation events
        window.addEventListener('popstate', () => {
            indicator.start();
            
            // Stop after a short delay to allow page to render
            setTimeout(() => {
                indicator.stop();
            }, 500);
        });
    }
    
    // Public API
    return {
        init,
        setupAutoHooks,
        start: (selector) => {
            const elements = typeof selector === 'string' 
                ? document.querySelectorAll(selector) 
                : [selector];
                
            elements.forEach(el => {
                if (el && el.dataset.rainbowIndicatorId) {
                    activateIndicator(el);
                }
            });
        },
        stop: (selector) => {
            const elements = typeof selector === 'string' 
                ? document.querySelectorAll(selector) 
                : [selector];
                
            elements.forEach(el => {
                if (el && el.dataset.rainbowIndicatorId) {
                    deactivateIndicator(el);
                }
            });
        },
        getActiveIndicators: () => {
            return Array.from(activeIndicators.entries())
                .filter(([_, indicator]) => indicator.active)
                .map(([id, _]) => id);
        },
        destroyAll: () => {
            activeIndicators.forEach((indicator) => {
                if (indicator.element) {
                    const instance = init(indicator.element);
                    instance.destroy();
                }
            });
            
            // Clear the active indicators map
            activeIndicators.clear();
            
            // Remove the global style element
            const styleEl = document.getElementById('rainbow-indicator-styles');
            if (styleEl) {
                document.head.removeChild(styleEl);
            }
        }
    };
})();
