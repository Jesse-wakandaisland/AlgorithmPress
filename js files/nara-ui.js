/**
 * Nara UI - Novel Attire Ranking Algorithm Theme Engine
 * A glass-like UI theme engine that dynamically responds to canvas background movements
 */

const NaraUI = (function() {
    // Private variables
    const state = {
        enabled: true,
        intensity: 0.7,
        reflectionFrequency: 0.3,
        canvasSampleRate: 100, // ms
        glassOpacity: 0.7,
        blurStrength: 10,
        glowStrength: 5,
        accentHue: 210, // Default blue hue
        elementRegistry: new Map(),
        canvasColorData: [],
        animationFrameId: null,
        averageMotion: 0,
        peakMotion: 0,
        motionHistory: [],
        lastSampleTime: 0,
        observer: null,
        initialized: false
    };
    
    // Color extraction and processing util functions
    const colorUtils = {
        // Extract dominant colors from canvas
        extractColorsFromCanvas: function(canvas, samplePoints = 20) {
            if (!canvas || !canvas.getContext) return [];
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            // Sample points in a grid pattern
            const colors = [];
            const xStep = width / Math.sqrt(samplePoints);
            const yStep = height / Math.sqrt(samplePoints);
            
            for (let x = xStep/2; x < width; x += xStep) {
                for (let y = yStep/2; y < height; y += yStep) {
                    try {
                        const pixel = ctx.getImageData(x, y, 1, 1).data;
                        colors.push({
                            r: pixel[0],
                            g: pixel[1],
                            b: pixel[2],
                            x: x / width,
                            y: y / height
                        });
                    } catch (e) {
                        // Handle potential security errors with cross-origin canvases
                        console.warn("Nara UI: Cannot access canvas data - possible cross-origin restrictions");
                        return [];
                    }
                }
            }
            
            return colors;
        },
        
        // Calculate color brightness (0-1)
        calculateBrightness: function(r, g, b) {
            // Using the perceived brightness formula
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        },
        
        // Calculate color contrast ratio against white
        calculateContrastWithWhite: function(r, g, b) {
            const brightness = this.calculateBrightness(r, g, b);
            const whiteContrast = (brightness + 0.05) / 1.05; // White is 1.0 brightness
            return whiteContrast;
        },
        
        // Calculate contrast ratio against black
        calculateContrastWithBlack: function(r, g, b) {
            const brightness = this.calculateBrightness(r, g, b);
            const blackContrast = 1.05 / (brightness + 0.05); // Black is 0.0 brightness
            return blackContrast;
        },
        
        // Determine if white or black text would be more readable
        getTextColorForBackground: function(r, g, b) {
            const whiteContrast = this.calculateContrastWithWhite(r, g, b);
            const blackContrast = this.calculateContrastWithBlack(r, g, b);
            
            return blackContrast > whiteContrast ? '#000' : '#fff';
        },
        
        // Convert RGB to HSL
        rgbToHsl: function(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0; // achromatic
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
            
            return {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                l: Math.round(l * 100)
            };
        },
        
        // Calculate average color
        calculateAverageColor: function(colors) {
            if (!colors || colors.length === 0) {
                return { r: 0, g: 0, b: 0 };
            }
            
            let r = 0, g = 0, b = 0;
            
            for (const color of colors) {
                r += color.r;
                g += color.g;
                b += color.b;
            }
            
            r = Math.round(r / colors.length);
            g = Math.round(g / colors.length);
            b = Math.round(b / colors.length);
            
            return { r, g, b };
        },
        
        // Calculate color distance
        colorDistance: function(color1, color2) {
            return Math.sqrt(
                Math.pow(color1.r - color2.r, 2) +
                Math.pow(color1.g - color2.g, 2) +
                Math.pow(color1.b - color2.b, 2)
            );
        },
        
        // Calculate color variance
        calculateColorVariance: function(colors) {
            if (!colors || colors.length <= 1) return 0;
            
            const avgColor = this.calculateAverageColor(colors);
            let totalDistance = 0;
            
            for (const color of colors) {
                totalDistance += this.colorDistance(color, avgColor);
            }
            
            return totalDistance / colors.length;
        }
    };
    
    // Motion detection and processing
    const motionDetector = {
        // Initialize motion detection
        initialize: function() {
            state.motionHistory = Array(10).fill(0);
            state.lastColors = [];
        },
        
        // Detect motion between color samples
        detectMotion: function(newColors) {
            if (!state.lastColors || state.lastColors.length === 0) {
                state.lastColors = newColors;
                return 0;
            }
            
            // Calculate color changes between frames
            const minLength = Math.min(newColors.length, state.lastColors.length);
            let totalMotion = 0;
            
            for (let i = 0; i < minLength; i++) {
                const newColor = newColors[i];
                const lastColor = state.lastColors[i];
                
                // Calculate color difference as motion
                const colorDiff = colorUtils.colorDistance(newColor, lastColor);
                totalMotion += colorDiff;
            }
            
            const avgMotion = totalMotion / minLength;
            
            // Update motion history
            state.motionHistory.shift();
            state.motionHistory.push(avgMotion);
            
            // Update peak motion
            if (avgMotion > state.peakMotion) {
                state.peakMotion = avgMotion;
            } else {
                // Gradually decrease peak to adapt to changing scenes
                state.peakMotion = state.peakMotion * 0.95;
            }
            
            // Update average motion
            state.averageMotion = state.motionHistory.reduce((sum, m) => sum + m, 0) / state.motionHistory.length;
            
            // Store current colors for next comparison
            state.lastColors = newColors;
            
            return avgMotion;
        },
        
        // Get normalized motion (0-1)
        getNormalizedMotion: function() {
            if (state.peakMotion === 0) return 0;
            return Math.min(state.averageMotion / (state.peakMotion * 0.5), 1);
        },
        
        // Check if motion exceeds threshold
        isSignificantMotion: function(threshold = 0.3) {
            return this.getNormalizedMotion() >= threshold;
        }
    };
    
    // Element manager for applying glass effect
    const elementManager = {
        // Register a DOM element for glass effect
        registerElement: function(element, options = {}) {
            if (!element || state.elementRegistry.has(element)) return;
            
            // Default options
            const defaultOptions = {
                glassStrength: 1.0, // 0-1 full glass effect
                reflectionStrength: 1.0, // 0-1 reflection intensity
                reflectionOffset: { x: 0, y: 0 }, // Offset for reflection
                customColors: null, // Override with custom colors
                alwaysOn: false, // Always apply effect regardless of motion
                dynamicTextColor: true, // Change text color based on background
                priority: 0 // Higher priority elements get effects first
            };
            
            const elementOptions = { ...defaultOptions, ...options };
            
            // Add element to registry
            state.elementRegistry.set(element, {
                options: elementOptions,
                originalStyles: {
                    backgroundColor: window.getComputedStyle(element).backgroundColor,
                    boxShadow: window.getComputedStyle(element).boxShadow,
                    color: window.getComputedStyle(element).color,
                    borderColor: window.getComputedStyle(element).borderColor
                },
                reflectionState: 0
            });
            
            // Apply initial glass effect
            this.applyGlassEffect(element);
            
            // Observe element
            if (state.observer) {
                state.observer.observe(element);
            }
        },
        
        // Unregister element
        unregisterElement: function(element) {
            if (!element || !state.elementRegistry.has(element)) return;
            
            // Restore original styles
            const data = state.elementRegistry.get(element);
            element.style.backgroundColor = data.originalStyles.backgroundColor;
            element.style.boxShadow = data.originalStyles.boxShadow;
            
            // If we modified text color, restore it
            if (data.options.dynamicTextColor) {
                element.style.color = data.originalStyles.color;
                element.style.borderColor = data.originalStyles.borderColor;
            }
            
            // Remove backdrop-filter
            element.style.backdropFilter = '';
            element.style.webkitBackdropFilter = '';
            
            // Stop observing
            if (state.observer) {
                state.observer.unobserve(element);
            }
            
            // Remove from registry
            state.elementRegistry.delete(element);
        },
        
        // Apply glass effect to element
        applyGlassEffect: function(element) {
            if (!element || !state.elementRegistry.has(element) || !state.enabled) return;
            
            const data = state.elementRegistry.get(element);
            const options = data.options;
            
            // If element is not visible, skip processing
            if (element.offsetParent === null) return;
            
            // Get element position relative to viewport
            const rect = element.getBoundingClientRect();
            const elementCenterX = (rect.left + rect.right) / 2 / window.innerWidth;
            const elementCenterY = (rect.top + rect.bottom) / 2 / window.innerHeight;
            
            // Get closest colors from canvas samples
            let nearestColors = [];
            const customColors = options.customColors;
            
            if (customColors && Array.isArray(customColors) && customColors.length > 0) {
                // Use custom colors if provided
                nearestColors = customColors;
            } else {
                // Find colors near this element's position
                nearestColors = state.canvasColorData.map(color => {
                    // Calculate distance from element center to this color sample
                    const distance = Math.sqrt(
                        Math.pow(color.x - elementCenterX, 2) +
                        Math.pow(color.y - elementCenterY, 2)
                    );
                    return { ...color, distance };
                })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5); // Get 5 closest colors
            }
            
            if (nearestColors.length === 0) return;
            
            // Calculate average color for this element
            const avgColor = colorUtils.calculateAverageColor(nearestColors);
            
            // Determine text color based on background
            if (options.dynamicTextColor) {
                const textColor = colorUtils.getTextColorForBackground(avgColor.r, avgColor.g, avgColor.b);
                element.style.color = textColor;
                element.style.borderColor = textColor === '#fff' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
            }
            
            // Calculate glass effect strength based on motion
            let effectIntensity = options.alwaysOn ? 1 : 
                motionDetector.getNormalizedMotion() * state.intensity;
            
            // Scale by element's glass strength option
            effectIntensity *= options.glassStrength;
            
            // Apply glass effect
            const blurAmount = state.blurStrength * effectIntensity;
            
            // Glass colors slightly adapted to the background
            const glassOpacity = state.glassOpacity;
            const r = avgColor.r;
            const g = avgColor.g;
            const b = avgColor.b;
            
            element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${glassOpacity * effectIntensity})`;
            element.style.backdropFilter = `blur(${blurAmount}px)`;
            element.style.webkitBackdropFilter = `blur(${blurAmount}px)`; // For Safari
            
            // Update reflection state based on motion
            const shouldReflect = Math.random() < (state.reflectionFrequency * effectIntensity);
            
            if (shouldReflect || options.alwaysOn) {
                // Create reflection/glow effect
                const reflectionStrength = options.reflectionStrength * state.glowStrength * effectIntensity;
                
                // Create dynamic glow based on motion and element position
                const hslColor = colorUtils.rgbToHsl(r, g, b);
                const accentHue = state.accentHue;
                const reflectionHue = (hslColor.h + accentHue) % 360;
                
                // Position for reflection (use offset if provided)
                const offsetX = options.reflectionOffset.x * 100;
                const offsetY = options.reflectionOffset.y * 100;
                
                // Apply reflection with box-shadow and internal gradients
                element.style.boxShadow = `
                    0 0 ${reflectionStrength * 5}px rgba(${r}, ${g}, ${b}, ${0.3 * effectIntensity}),
                    0 0 ${reflectionStrength * 10}px rgba(${r}, ${g}, ${b}, ${0.2 * effectIntensity}),
                    inset 0 0 ${reflectionStrength * 3}px rgba(255, 255, 255, ${0.4 * effectIntensity})
                `;
                
                // Add additional reflection using background-image
                const gradientSize = 200 + (100 * effectIntensity);
                element.style.backgroundImage = `
                    radial-gradient(
                        circle at ${50 + offsetX}% ${50 + offsetY}%, 
                        hsla(${reflectionHue}, 100%, 80%, ${0.2 * effectIntensity}), 
                        transparent ${gradientSize}%
                    )
                `;
                
                // Store reflection state
                data.reflectionState = 1;
            } else if (data.reflectionState > 0) {
                // Gradually fade out reflection
                const fadeSpeed = 0.1;
                data.reflectionState -= fadeSpeed;
                
                if (data.reflectionState <= 0) {
                    data.reflectionState = 0;
                    element.style.boxShadow = '';
                    element.style.backgroundImage = '';
                }
            }
            
            // Update element data
            state.elementRegistry.set(element, data);
        },
        
        // Update all registered elements
        updateAllElements: function() {
            // Sort elements by priority
            const elements = Array.from(state.elementRegistry.entries())
                .sort((a, b) => b[1].options.priority - a[1].options.priority)
                .map(entry => entry[0]);
                
            elements.forEach(element => {
                this.applyGlassEffect(element);
            });
        },
        
        // Auto-register elements matching selectors
        autoRegisterBySelectors: function(selectors, options = {}) {
            if (!selectors) return;
            
            // Convert string to array if needed
            const selectorList = typeof selectors === 'string' ? [selectors] : selectors;
            
            selectorList.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    this.registerElement(element, options);
                });
            });
        }
    };
    
    // Main update cycle
    const updateCycle = {
        // Start the update loop
        start: function() {
            if (state.animationFrameId) return;
            
            const updateLoop = () => {
                const now = performance.now();
                
                // Check if it's time to sample the canvas
                if (now - state.lastSampleTime >= state.canvasSampleRate) {
                    this.updateCanvasData();
                    state.lastSampleTime = now;
                }
                
                // Update glass effects
                elementManager.updateAllElements();
                
                // Continue loop
                state.animationFrameId = requestAnimationFrame(updateLoop);
            };
            
            state.animationFrameId = requestAnimationFrame(updateLoop);
        },
        
        // Stop the update loop
        stop: function() {
            if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
            }
        },
        
        // Update canvas color data for glass effect
        updateCanvasData: function() {
            // Find the canvas element
            const canvas = document.querySelector('canvas');
            if (!canvas) return;
            
            // Extract colors
            const colors = colorUtils.extractColorsFromCanvas(canvas, 30);
            
            // Store for glass effects
            state.canvasColorData = colors;
            
            // Detect motion
            motionDetector.detectMotion(colors);
        }
    };
    
    // Intersection Observer to monitor element visibility
    const createObserver = function() {
        // Only create if supported
        if (!('IntersectionObserver' in window)) return null;
        
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                
                // Skip processing for invisible elements
                if (!entry.isIntersecting) return;
                
                // Process visible elements
                if (state.elementRegistry.has(element)) {
                    elementManager.applyGlassEffect(element);
                }
            });
        }, {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // trigger when 10% visible
        });
    };
    
    // Initialize the theme engine
    const initialize = function() {
        if (state.initialized) return;
        
        // Create observer for elements
        state.observer = createObserver();
        
        // Initialize motion detection
        motionDetector.initialize();
        
        // Start update cycle
        updateCycle.start();
        
        // Set up mutation observer to detect new elements
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // For added nodes that match our auto-register selectors
                    const added = Array.from(mutation.addedNodes).filter(node => 
                        node.nodeType === Node.ELEMENT_NODE);
                    
                    // Handle added elements
                    added.forEach(element => {
                        // Check if element matches known selectors and auto-register
                        // This is simplified - you would maintain a list of selectors to check
                        autoDetectElements(element);
                    });
                }
            });
        });
        
        // Start observing document for element changes
        mutationObserver.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        state.initialized = true;
    };
    
    // Auto-detect and register window and UI elements
    const autoDetectElements = function(rootElement = document.body) {
        // Common window UI element selectors
        const uiSelectors = {
            // Window containers - high priority
            windows: {
                selector: '.window-container',
                options: {
                    glassStrength: 1.0,
                    reflectionStrength: 0.8,
                    dynamicTextColor: false,
                    priority: 10
                }
            },
            // Window headers - highest priority
            headers: {
                selector: '.window-header',
                options: {
                    glassStrength: 1.0,
                    reflectionStrength: 1.0,
                    dynamicTextColor: true,
                    priority: 20
                }
            },
            // Widgets
            widgets: {
                selector: '.desktop-widget',
                options: {
                    glassStrength: 0.9,
                    reflectionStrength: 0.7,
                    dynamicTextColor: false,
                    priority: 5
                }
            },
            // Taskbar
            taskbar: {
                selector: '#taskbar',
                options: {
                    glassStrength: 1.0,
                    reflectionStrength: 0.6,
                    dynamicTextColor: false,
                    alwaysOn: true,
                    priority: 15
                }
            },
            // Context menus
            menus: {
                selector: '.context-menu',
                options: {
                    glassStrength: 0.95,
                    reflectionStrength: 0.6,
                    dynamicTextColor: false,
                    priority: 12
                }
            },
            // Buttons
            buttons: {
                selector: '.create-window-button, .toggle-button',
                options: {
                    glassStrength: 0.8,
                    reflectionStrength: 0.9,
                    dynamicTextColor: true,
                    priority: 8
                }
            },
            // Dialogs and panels
            dialogs: {
                selector: '.theme-selector, .widget-selector, .accessibility-panel, .share-panel',
                options: {
                    glassStrength: 0.9,
                    reflectionStrength: 0.8,
                    dynamicTextColor: false,
                    priority: 15
                }
            },
            // Notification area
            notifications: {
                selector: '#notification-panel, .notification-item',
                options: {
                    glassStrength: 1.0,
                    reflectionStrength: 1.0,
                    dynamicTextColor: true,
                    priority: 18
                }
            }
        };
        
        // Process each selector group
        Object.values(uiSelectors).forEach(({ selector, options }) => {
            let elements;
            
            if (rootElement === document.body) {
                elements = document.querySelectorAll(selector);
            } else {
                // Check if root element itself matches
                if (rootElement.matches(selector)) {
                    elements = [rootElement];
                } else {
                    // Check children
                    elements = rootElement.querySelectorAll(selector);
                }
            }
            
            // Register elements
            elements.forEach(element => {
                elementManager.registerElement(element, options);
            });
        });
    };
    
    // Curry function to efficiently update styles
    const createStyleUpdater = function(element, styleProps) {
        // Return a function that applies multiple styles at once
        return function(values) {
            // Apply each style property with the corresponding value
            styleProps.forEach((prop, index) => {
                if (values[index] !== undefined) {
                    element.style[prop] = values[index];
                }
            });
        };
    };
    
    // Public API
    return {
        // Initialize the theme engine
        init: function(options = {}) {
            // Apply configuration options
            if (options.intensity !== undefined) state.intensity = options.intensity;
            if (options.reflectionFrequency !== undefined) state.reflectionFrequency = options.reflectionFrequency;
            if (options.canvasSampleRate !== undefined) state.canvasSampleRate = options.canvasSampleRate;
            if (options.glassOpacity !== undefined) state.glassOpacity = options.glassOpacity;
            if (options.blurStrength !== undefined) state.blurStrength = options.blurStrength;
            if (options.glowStrength !== undefined) state.glowStrength = options.glowStrength;
            if (options.accentHue !== undefined) state.accentHue = options.accentHue;
            
            // Initialize the system
            initialize();
            
            // Auto-detect and register UI elements
            setTimeout(() => {
                autoDetectElements();
            }, 500);
            
            return this;
        },
        
        // Enable/disable the theme engine
        enable: function(enabled = true) {
            state.enabled = enabled;
            
            if (enabled && !state.initialized) {
                this.init();
            } else if (!enabled) {
                updateCycle.stop();
            } else if (enabled && state.initialized) {
                updateCycle.start();
            }
            
            return this;
        },
        
        // Register a DOM element for glass effect
        register: function(element, options = {}) {
            if (!element) return this;
            
            // Support for multiple elements
            if (Array.isArray(element)) {
                element.forEach(el => elementManager.registerElement(el, options));
            } else if (typeof element === 'string') {
                // Support for selector strings
                document.querySelectorAll(element).forEach(el => 
                    elementManager.registerElement(el, options));
            } else {
                // Single element
                elementManager.registerElement(element, options);
            }
            
            return this;
        },
        
        // Unregister element(s)
        unregister: function(element) {
            if (!element) return this;
            
            if (Array.isArray(element)) {
                element.forEach(el => elementManager.unregisterElement(el));
            } else if (typeof element === 'string') {
                document.querySelectorAll(element).forEach(el => 
                    elementManager.unregisterElement(el));
            } else {
                elementManager.unregisterElement(element);
            }
            
            return this;
        },
        
        // Update registered elements manually
        update: function() {
            if (!state.initialized) return this;
            updateCycle.updateCanvasData();
            elementManager.updateAllElements();
            return this;
        },
        
        // Change theme parameters
        setTheme: function(options = {}) {
            if (options.intensity !== undefined) state.intensity = options.intensity;
            if (options.reflectionFrequency !== undefined) state.reflectionFrequency = options.reflectionFrequency;
            if (options.glassOpacity !== undefined) state.glassOpacity = options.glassOpacity;
            if (options.blurStrength !== undefined) state.blurStrength = options.blurStrength;
            if (options.glowStrength !== undefined) state.glowStrength = options.glowStrength;
            if (options.accentHue !== undefined) state.accentHue = options.accentHue;
            
            // Immediate update
            this.update();
            
            return this;
        },
        
        // Create a preset theme
        createPreset: function(name, options = {}) {
            const presets = {
                intense: {
                    intensity: 1.0,
                    reflectionFrequency: 0.5,
                    glassOpacity: 0.75,
                    blurStrength: 15,
                    glowStrength: 8,
                    accentHue: 210
                },
                subtle: {
                    intensity: 0.5,
                    reflectionFrequency: 0.2,
                    glassOpacity: 0.6,
                    blurStrength: 8,
                    glowStrength: 3,
                    accentHue: 210
                },
                warm: {
                    intensity: 0.7,
                    reflectionFrequency: 0.3,
                    glassOpacity: 0.65,
                    blurStrength: 10,
                    glowStrength: 5,
                    accentHue: 30 // Orange/gold
                },
                cool: {
                    intensity: 0.7,
                    reflectionFrequency: 0.3,
                    glassOpacity: 0.65,
                    blurStrength: 10,
                    glowStrength: 5,
                    accentHue: 240 // Blue/purple
                },
                neon: {
                    intensity: 0.8,
                    reflectionFrequency: 0.4,
                    glassOpacity: 0.6,
                    blurStrength: 12,
                    glowStrength: 15,
                    accentHue: 300 // Magenta
                }
            };
            
            // Save new preset if options provided
            if (name && Object.keys(options).length > 0) {
                presets[name] = { ...options };
            }
            
            return presets;
        },
        
        // Apply preset theme
        applyPreset: function(presetName) {
            const presets = this.createPreset();
            
            if (presets[presetName]) {
                this.setTheme(presets[presetName]);
            }
            
            return this;
        },
        
        // Get current settings
        getSettings: function() {
            return {
                enabled: state.enabled,
                intensity: state.intensity,
                reflectionFrequency: state.reflectionFrequency,
                canvasSampleRate: state.canvasSampleRate,
                glassOpacity: state.glassOpacity,
                blurStrength: state.blurStrength,
                glowStrength: state.glowStrength,
                accentHue: state.accentHue,
                motion: motionDetector.getNormalizedMotion(),
                elementCount: state.elementRegistry.size
            };
        }
    };
})();
