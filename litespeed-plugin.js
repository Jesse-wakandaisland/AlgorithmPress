/**
 * LiteSpeed CDN Plugin for AlgorithmPress
 * Connects to LiteSpeed CDN services and provides caching capabilities
 * for the PHP-WASM environment, similar to the WordPress LiteSpeed plugin.
 */

const LiteSpeedPlugin = (function() {
    // Private variables
    const state = {
        initialized: false,
        connected: false,
        apiKey: '',
        siteId: '',
        enabled: true,
        cdnEnabled: false,
        cacheEnabled: true,
        imageOptEnabled: false,
        cssJsMinify: false,
        lazyLoadEnabled: false,
        criticalCSSEnabled: false,
        settings: {},
        stats: {
            cacheHits: 0,
            cacheMisses: 0,
            cdnBandwidthSaved: 0,
            imageOptimizationSavings: 0
        },
        apiEndpoints: {
            connect: 'https://api.quic.cloud/connect',
            validate: 'https://api.quic.cloud/validate',
            cdn: 'https://api.quic.cloud/cdn',
            imageOptimize: 'https://api.quic.cloud/img_optm'
        }
    };

    // Cache management
    const cacheManager = {
        cacheStorage: null,
        cacheName: 'litespeed-algorithpress-cache',
        
        // Initialize cache
        init: async function() {
            if ('caches' in window) {
                this.cacheStorage = await caches.open(this.cacheName);
                return true;
            }
            return false;
        },
        
        // Store in cache
        async store(key, data, contentType = 'text/plain', ttl = 3600) {
            if (!this.cacheStorage) return false;
            
            try {
                const options = {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': `max-age=${ttl}`,
                        'X-LiteSpeed-Cache': 'true',
                        'X-LiteSpeed-Cache-TTL': ttl,
                        'X-LiteSpeed-Cache-Timestamp': Date.now()
                    }
                };
                
                const blob = new Blob([data], { type: contentType });
                const response = new Response(blob, options);
                await this.cacheStorage.put(key, response);
                return true;
            } catch (error) {
                console.error('LiteSpeed Cache: Failed to store in cache', error);
                return false;
            }
        },
        
        // Retrieve from cache
        async retrieve(key) {
            if (!this.cacheStorage) return null;
            
            try {
                const response = await this.cacheStorage.match(key);
                if (!response) {
                    state.stats.cacheMisses++;
                    return null;
                }
                
                // Check if cache is still valid
                const timestamp = parseInt(response.headers.get('X-LiteSpeed-Cache-Timestamp') || '0');
                const ttl = parseInt(response.headers.get('X-LiteSpeed-Cache-TTL') || '0');
                const now = Date.now();
                
                if (timestamp + (ttl * 1000) < now) {
                    // Cache expired
                    await this.cacheStorage.delete(key);
                    state.stats.cacheMisses++;
                    return null;
                }
                
                state.stats.cacheHits++;
                return await response.text();
            } catch (error) {
                console.error('LiteSpeed Cache: Failed to retrieve from cache', error);
                state.stats.cacheMisses++;
                return null;
            }
        },
        
        // Clear cache
        async clear() {
            if (!this.cacheStorage) return false;
            
            try {
                const keys = await this.cacheStorage.keys();
                for (const request of keys) {
                    await this.cacheStorage.delete(request);
                }
                return true;
            } catch (error) {
                console.error('LiteSpeed Cache: Failed to clear cache', error);
                return false;
            }
        },
        
        // Purge specific cache entry
        async purge(key) {
            if (!this.cacheStorage) return false;
            
            try {
                return await this.cacheStorage.delete(key);
            } catch (error) {
                console.error('LiteSpeed Cache: Failed to purge cache entry', error);
                return false;
            }
        }
    };

    // CDN Management
    const cdnManager = {
        cdnDomain: '',
        cdnEnabled: false,
        excludedFiles: [],
        
        // Initialize CDN
        init: function(cdnDomain) {
            this.cdnDomain = cdnDomain || '';
            this.cdnEnabled = Boolean(cdnDomain);
            return this.cdnEnabled;
        },
        
        // Generate CDN URL for a resource
        getCdnUrl: function(originalUrl) {
            if (!this.cdnEnabled || !this.cdnDomain) return originalUrl;
            
            try {
                // Check if file should be excluded from CDN
                const filename = originalUrl.split('/').pop();
                if (this.excludedFiles.includes(filename)) {
                    return originalUrl;
                }
                
                // Ensure it's a valid URL
                const url = new URL(originalUrl, window.location.origin);
                
                // Don't CDN external domains or special URLs
                if (url.hostname !== window.location.hostname && 
                    !originalUrl.startsWith('/')) {
                    return originalUrl;
                }
                
                // Replace domain with CDN domain
                const cdnUrl = new URL(url.pathname + url.search, this.cdnDomain);
                return cdnUrl.toString();
            } catch (error) {
                console.error('LiteSpeed CDN: Error generating CDN URL', error);
                return originalUrl;
            }
        },
        
        // Set excluded files that shouldn't go through CDN
        setExcludedFiles: function(excludedFiles) {
            this.excludedFiles = Array.isArray(excludedFiles) ? excludedFiles : [];
        },
        
        // Enable/disable CDN
        enable: function(enabled) {
            this.cdnEnabled = enabled && Boolean(this.cdnDomain);
            return this.cdnEnabled;
        }
    };

    // Image Optimization
    const imageOptimizer = {
        enabled: false,
        quality: 85,
        webpEnabled: true,
        lazyLoadEnabled: false,
        excludedImages: [],
        
        // Initialize image optimizer
        init: function(config = {}) {
            this.enabled = config.enabled !== false;
            this.quality = config.quality || 85;
            this.webpEnabled = config.webpEnabled !== false;
            this.lazyLoadEnabled = config.lazyLoadEnabled || false;
            this.excludedImages = config.excludedImages || [];
            
            // Listen for image loading if using lazy load
            if (this.enabled && this.lazyLoadEnabled) {
                this.setupLazyLoading();
            }
            
            return this.enabled;
        },
        
        // Process an image URL through LiteSpeed image optimization
        processImageUrl: function(originalUrl) {
            if (!this.enabled) return originalUrl;
            
            try {
                // Check if image should be excluded
                const filename = originalUrl.split('/').pop();
                if (this.excludedImages.includes(filename)) {
                    return originalUrl;
                }
                
                // Validate URL
                const url = new URL(originalUrl, window.location.origin);
                
                // Don't process external images
                if (url.hostname !== window.location.hostname && 
                    !originalUrl.startsWith('/')) {
                    return originalUrl;
                }
                
                // If CDN is enabled, use CDN URL as the base
                let baseUrl = originalUrl;
                if (cdnManager.cdnEnabled) {
                    baseUrl = cdnManager.getCdnUrl(originalUrl);
                }
                
                // Append image optimization parameters
                const separator = baseUrl.includes('?') ? '&' : '?';
                let optimizedUrl = `${baseUrl}${separator}ls-img=1&q=${this.quality}`;
                
                // Add WebP if supported and enabled
                if (this.webpEnabled && this.isWebpSupported()) {
                    optimizedUrl += '&webp=1';
                }
                
                return optimizedUrl;
            } catch (error) {
                console.error('LiteSpeed Image Optimizer: Error processing image URL', error);
                return originalUrl;
            }
        },
        
        // Check if browser supports WebP
        isWebpSupported: function() {
            // Simple detection based on Safari support which was the last major browser to add WebP
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isSafari12OrNewer = isSafari && (parseInt(navigator.appVersion.match(/Version\/(\d+)/)?.[1] || 0) >= 12);
            
            // WebP is supported in Chrome, Firefox, Edge, and Safari 12+
            return !isSafari || isSafari12OrNewer;
        },
        
        // Set up lazy loading for images
        setupLazyLoading: function() {
            if (!('IntersectionObserver' in window)) return false;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const lazySrc = img.getAttribute('data-ls-src');
                        
                        if (lazySrc) {
                            // Process and set the actual image source
                            img.src = this.processImageUrl(lazySrc);
                            // Remove the lazy attribute to prevent future observation
                            img.removeAttribute('data-ls-src');
                            // Stop observing this image
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '200px' // Load images when they're 200px away from viewport
            });
            
            // Find all images with data-ls-src attribute and observe them
            document.querySelectorAll('img[data-ls-src]').forEach(img => {
                observer.observe(img);
            });
            
            // Store the observer reference for future images
            this.lazyLoadObserver = observer;
            
            // Monitor for DOM changes to catch new images
            if ('MutationObserver' in window) {
                const mutationObserver = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1) { // Element node
                                    // Check if this node is an image with data-ls-src
                                    if (node.nodeName === 'IMG' && node.hasAttribute('data-ls-src')) {
                                        observer.observe(node);
                                    }
                                    
                                    // Check child images
                                    node.querySelectorAll('img[data-ls-src]').forEach(img => {
                                        observer.observe(img);
                                    });
                                }
                            });
                        }
                    });
                });
                
                mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                this.mutationObserver = mutationObserver;
            }
            
            return true;
        },
        
        // Add an image to lazy loading
        addToLazyLoad: function(imgElement, originalSrc) {
            if (!this.lazyLoadEnabled || !this.lazyLoadObserver) return false;
            
            try {
                // Set a placeholder image or low-quality version
                imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                
                // Store the original source
                imgElement.setAttribute('data-ls-src', originalSrc);
                
                // Start observing this image
                this.lazyLoadObserver.observe(imgElement);
                return true;
            } catch (error) {
                console.error('LiteSpeed Image Optimizer: Error adding image to lazy load', error);
                return false;
            }
        }
    };

    // CSS/JS Minification
    const minifier = {
        enabled: false,
        cssMinifyEnabled: false,
        jsMinifyEnabled: false,
        htmlMinifyEnabled: false,
        excludedFiles: [],
        
        // Initialize minifier
        init: function(config = {}) {
            this.enabled = config.enabled !== false;
            this.cssMinifyEnabled = config.cssMinifyEnabled !== false;
            this.jsMinifyEnabled = config.jsMinifyEnabled !== false;
            this.htmlMinifyEnabled = config.htmlMinifyEnabled || false;
            this.excludedFiles = config.excludedFiles || [];
            
            return this.enabled;
        },
        
        // Process CSS content
        minifyCss: function(css) {
            if (!this.enabled || !this.cssMinifyEnabled) return css;
            
            try {
                // Basic CSS minification
                return css
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/\s*(\{|\}|\:|\;|\,)\s*/g, '$1') // Remove spaces around {, }, :, ;, ,
                    .replace(/;\}/g, '}') // Remove unnecessary semicolons
                    .trim();
            } catch (error) {
                console.error('LiteSpeed Minifier: Error minifying CSS', error);
                return css;
            }
        },
        
        // Process JavaScript content
        minifyJs: function(js) {
            if (!this.enabled || !this.jsMinifyEnabled) return js;
            
            try {
                // Basic JS minification - in a real implementation, use a proper minifier
                return js
                    .replace(/\/\/.*$/gm, '') // Remove single-line comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                    .replace(/^\s*\n/gm, '') // Remove empty lines
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/\s*(\(|\)|\{|\}|\[|\]|\:|\;|\,|\.|=|\+|-|\*|\/|>|<|&|\||\?)\s*/g, '$1') // Remove spaces around operators
                    .trim();
            } catch (error) {
                console.error('LiteSpeed Minifier: Error minifying JavaScript', error);
                return js;
            }
        },
        
        // Process HTML content
        minifyHtml: function(html) {
            if (!this.enabled || !this.htmlMinifyEnabled) return html;
            
            try {
                // Basic HTML minification
                return html
                    .replace(/<!--(?!<!)[^\[>][\s\S]*?-->/g, '') // Remove HTML comments
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/>\s+</g, '><') // Remove spaces between tags
                    .replace(/\s+>/g, '>') // Remove spaces before closing brackets
                    .replace(/<\s+/g, '<') // Remove spaces after opening brackets
                    .trim();
            } catch (error) {
                console.error('LiteSpeed Minifier: Error minifying HTML', error);
                return html;
            }
        }
    };

    // API integration
    const apiClient = {
        // Connect to LiteSpeed API
        connect: async function(apiKey, domain) {
            try {
                const response = await fetch(state.apiEndpoints.connect, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-LSCAPI-KEY': apiKey
                    },
                    body: JSON.stringify({
                        domain: domain || window.location.hostname,
                        source: 'algorithpress'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    state.connected = true;
                    state.siteId = data.site_id || '';
                    return {
                        success: true,
                        siteId: data.site_id,
                        message: data.message || 'Successfully connected to LiteSpeed CDN'
                    };
                } else {
                    return {
                        success: false,
                        message: data.message || 'Failed to connect to LiteSpeed CDN'
                    };
                }
            } catch (error) {
                console.error('LiteSpeed API: Connection error', error);
                return {
                    success: false,
                    message: error.message || 'Connection error'
                };
            }
        },
        
        // Validate connection
        validateConnection: async function() {
            if (!state.apiKey || !state.siteId) {
                return { success: false, message: 'API key or Site ID not set' };
            }
            
            try {
                const response = await fetch(state.apiEndpoints.validate, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-LSCAPI-KEY': state.apiKey
                    },
                    body: JSON.stringify({
                        site_id: state.siteId
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    state.connected = true;
                    return {
                        success: true,
                        message: data.message || 'Connection validated'
                    };
                } else {
                    state.connected = false;
                    return {
                        success: false,
                        message: data.message || 'Connection validation failed'
                    };
                }
            } catch (error) {
                console.error('LiteSpeed API: Validation error', error);
                state.connected = false;
                return {
                    success: false,
                    message: error.message || 'Validation error'
                };
            }
        },
        
        // Get CDN configuration
        getCdnConfig: async function() {
            if (!state.apiKey || !state.siteId || !state.connected) {
                return { success: false, message: 'Not connected to LiteSpeed API' };
            }
            
            try {
                const response = await fetch(`${state.apiEndpoints.cdn}/${state.siteId}/config`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-LSCAPI-KEY': state.apiKey
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    return {
                        success: true,
                        config: data.config || {},
                        message: 'CDN configuration retrieved'
                    };
                } else {
                    return {
                        success: false,
                        message: data.message || 'Failed to retrieve CDN configuration'
                    };
                }
            } catch (error) {
                console.error('LiteSpeed API: Error getting CDN config', error);
                return {
                    success: false,
                    message: error.message || 'Error retrieving CDN configuration'
                };
            }
        },
        
        // Purge CDN cache
        purgeCdnCache: async function(urls = []) {
            if (!state.apiKey || !state.siteId || !state.connected) {
                return { success: false, message: 'Not connected to LiteSpeed API' };
            }
            
            try {
                const response = await fetch(`${state.apiEndpoints.cdn}/${state.siteId}/purge`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-LSCAPI-KEY': state.apiKey
                    },
                    body: JSON.stringify({
                        urls: urls.length ? urls : ['*'] // Purge all if no URLs specified
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    return {
                        success: true,
                        message: data.message || 'Cache purged successfully'
                    };
                } else {
                    return {
                        success: false,
                        message: data.message || 'Failed to purge cache'
                    };
                }
            } catch (error) {
                console.error('LiteSpeed API: Error purging cache', error);
                return {
                    success: false,
                    message: error.message || 'Error purging cache'
                };
            }
        }
    };

    // Settings management
    const settingsManager = {
        defaultSettings: {
            apiKey: '',
            siteId: '',
            enabled: true,
            cdnEnabled: false,
            cdnDomain: '',
            cacheEnabled: true,
            cacheTTL: 3600, // 1 hour
            imageOptEnabled: false,
            imageQuality: 85,
            webpEnabled: true,
            lazyLoadEnabled: false,
            cssJsMinify: false,
            excludedFiles: [],
            excludedImages: []
        },
        
        // Load settings from storage
        loadSettings: function() {
            try {
                const savedSettings = localStorage.getItem('litespeed_settings');
                if (savedSettings) {
                    state.settings = JSON.parse(savedSettings);
                } else {
                    state.settings = { ...this.defaultSettings };
                }
                
                // Apply loaded settings to state
                this.applySettings();
                
                return state.settings;
            } catch (error) {
                console.error('LiteSpeed Settings: Error loading settings', error);
                state.settings = { ...this.defaultSettings };
                return state.settings;
            }
        },
        
        // Save settings to storage
        saveSettings: function(settings = {}) {
            try {
                // Merge new settings with existing
                state.settings = { ...state.settings, ...settings };
                
                // Save to localStorage
                localStorage.setItem('litespeed_settings', JSON.stringify(state.settings));
                
                // Apply new settings
                this.applySettings();
                
                return true;
            } catch (error) {
                console.error('LiteSpeed Settings: Error saving settings', error);
                return false;
            }
        },
        
        // Apply settings to various components
        applySettings: function() {
            // Apply to state
            state.apiKey = state.settings.apiKey || '';
            state.siteId = state.settings.siteId || '';
            state.enabled = state.settings.enabled !== false;
            state.cdnEnabled = state.settings.cdnEnabled || false;
            state.cacheEnabled = state.settings.cacheEnabled !== false;
            state.imageOptEnabled = state.settings.imageOptEnabled || false;
            state.cssJsMinify = state.settings.cssJsMinify || false;
            state.lazyLoadEnabled = state.settings.lazyLoadEnabled || false;
            
            // Apply to CDN Manager
            cdnManager.init(state.settings.cdnDomain || '');
            cdnManager.enable(state.cdnEnabled);
            cdnManager.setExcludedFiles(state.settings.excludedFiles || []);
            
            // Apply to Image Optimizer
            imageOptimizer.init({
                enabled: state.imageOptEnabled,
                quality: state.settings.imageQuality || 85,
                webpEnabled: state.settings.webpEnabled !== false,
                lazyLoadEnabled: state.lazyLoadEnabled,
                excludedImages: state.settings.excludedImages || []
            });
            
            // Apply to Minifier
            minifier.init({
                enabled: state.cssJsMinify,
                cssMinifyEnabled: state.cssJsMinify,
                jsMinifyEnabled: state.cssJsMinify,
                htmlMinifyEnabled: false, // HTML minification is more complex, disabled by default
                excludedFiles: state.settings.excludedFiles || []
            });
        },
        
        // Reset settings to defaults
        resetSettings: function() {
            state.settings = { ...this.defaultSettings };
            localStorage.setItem('litespeed_settings', JSON.stringify(state.settings));
            this.applySettings();
            return state.settings;
        }
    };

    // UI Management
    const uiManager = {
        panelContainer: null,
        
        // Initialize UI
        init: function() {
            // Create panel container if it doesn't exist
            if (!this.panelContainer) {
                this.createPanelContainer();
            }
            
            return true;
        },
        
        // Create panel container
        createPanelContainer: function() {
            // Check if panel already exists
            if (document.getElementById('litespeed-panel')) {
                this.panelContainer = document.getElementById('litespeed-panel');
                return this.panelContainer;
            }
            
            // Create panel container
            const container = document.createElement('div');
            container.id = 'litespeed-panel';
            container.className = 'litespeed-panel';
            container.style.display = 'none';
            
            // Add to document
            document.body.appendChild(container);
            
            this.panelContainer = container;
            return container;
        },
        
        // Show settings panel
        showSettings: function() {
            if (!this.panelContainer) {
                this.createPanelContainer();
            }
            
            // Create settings panel content
            this.panelContainer.innerHTML = `
                <div class="litespeed-panel-header">
                    <h2>LiteSpeed CDN Settings</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="litespeed-panel-body">
                    <div class="litespeed-form-group">
                        <label for="ls-api-key">API Key</label>
                        <input type="text" id="ls-api-key" value="${state.apiKey}" placeholder="Enter your LiteSpeed API Key">
                    </div>
                    <div class="litespeed-form-group">
                        <label for="ls-site-id">Site ID</label>
                        <input type="text" id="ls-site-id" value="${state.siteId}" placeholder="Site ID (assigned after connection)">
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-enabled" ${state.enabled ? 'checked' : ''}>
                            <span class="toggle-text">Enable LiteSpeed Integration</span>
                        </label>
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-cdn-enabled" ${state.cdnEnabled ? 'checked' : ''}>
                            <span class="toggle-text">Enable CDN</span>
                        </label>
                    </div>
                    <div class="litespeed-form-group">
                        <label for="ls-cdn-domain">CDN Domain</label>
                        <input type="text" id="ls-cdn-domain" value="${state.settings.cdnDomain || ''}" placeholder="e.g., cdn.yourdomain.com">
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-cache-enabled" ${state.cacheEnabled ? 'checked' : ''}>
                            <span class="toggle-text">Enable Page Caching</span>
                        </label>
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-img-enabled" ${state.imageOptEnabled ? 'checked' : ''}>
                            <span class="toggle-text">Enable Image Optimization</span>
                        </label>
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-minify-enabled" ${state.cssJsMinify ? 'checked' : ''}>
                            <span class="toggle-text">Enable CSS/JS Minification</span>
                        </label>
                    </div>
                    <div class="litespeed-form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="ls-lazy-enabled" ${state.lazyLoadEnabled ? 'checked' : ''}>
                            <span class="toggle-text">Enable Lazy Loading</span>
                        </label>
                    </div>
                    <div class="litespeed-button-group">
                        <button id="ls-connect-btn" class="litespeed-btn litespeed-primary-btn">Connect</button>
                        <button id="ls-save-btn" class="litespeed-btn litespeed-primary-btn">Save Settings</button>
                        <button id="ls-purge-btn" class="litespeed-btn litespeed-secondary-btn">Purge Cache</button>
                        <button id="ls-reset-btn" class="litespeed-btn litespeed-danger-btn">Reset</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            this.panelContainer.querySelector('.close-btn').addEventListener('click', () => {
                this.hidePanel();
            });
            
            // Connect button
            this.panelContainer.querySelector('#ls-connect-btn').addEventListener('click', async () => {
                const apiKey = this.panelContainer.querySelector('#ls-api-key').value;
                const result = await apiClient.connect(apiKey);
                
                if (result.success) {
                    this.panelContainer.querySelector('#ls-site-id').value = result.siteId || '';
                    this.showMessage(result.message, 'success');
                } else {
                    this.showMessage(result.message, 'error');
                }
            });
            
            // Save button
            this.panelContainer.querySelector('#ls-save-btn').addEventListener('click', () => {
                const settings = {
                    apiKey: this.panelContainer.querySelector('#ls-api-key').value,
                    siteId: this.panelContainer.querySelector('#ls-site-id').value,
                    enabled: this.panelContainer.querySelector('#ls-enabled').checked,
                    cdnEnabled: this.panelContainer.querySelector('#ls-cdn-enabled').checked,
                    cdnDomain: this.panelContainer.querySelector('#ls-cdn-domain').value,
                    cacheEnabled: this.panelContainer.querySelector('#ls-cache-enabled').checked,
                    imageOptEnabled: this.panelContainer.querySelector('#ls-img-enabled').checked,
                    cssJsMinify: this.panelContainer.querySelector('#ls-minify-enabled').checked,
                    lazyLoadEnabled: this.panelContainer.querySelector('#ls-lazy-enabled').checked
                };
                
                settingsManager.saveSettings(settings);
                this.showMessage('Settings saved successfully', 'success');
            });
            
            // Purge button
            this.panelContainer.querySelector('#ls-purge-btn').addEventListener('click', async () => {
                const result = await apiClient.purgeCdnCache();
                
                if (result.success) {
                    this.showMessage(result.message, 'success');
                } else {
                    this.showMessage(result.message, 'error');
                }
            });
            
            // Reset button
            this.panelContainer.querySelector('#ls-reset-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings?')) {
                    settingsManager.resetSettings();
                    this.showSettings(); // Reload panel with default settings
                    this.showMessage('Settings reset to defaults', 'success');
                }
            });
            
            // Show the panel
            this.showPanel();
        },
        
        // Show statistics panel
        showStatistics: function() {
            if (!this.panelContainer) {
                this.createPanelContainer();
            }
            
            // Create statistics panel content
            this.panelContainer.innerHTML = `
                <div class="litespeed-panel-header">
                    <h2>LiteSpeed CDN Statistics</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="litespeed-panel-body">
                    <div class="litespeed-stat-group">
                        <div class="litespeed-stat-item">
                            <div class="stat-label">Cache Hits</div>
                            <div class="stat-value">${state.stats.cacheHits}</div>
                        </div>
                        <div class="litespeed-stat-item">
                            <div class="stat-label">Cache Misses</div>
                            <div class="stat-value">${state.stats.cacheMisses}</div>
                        </div>
                    </div>
                    <div class="litespeed-stat-group">
                        <div class="litespeed-stat-item">
                            <div class="stat-label">Cache Hit Ratio</div>
                            <div class="stat-value">
                                ${this.calculateCacheHitRatio()}%
                            </div>
                        </div>
                        <div class="litespeed-stat-item">
                            <div class="stat-label">CDN Status</div>
                            <div class="stat-value ${state.cdnEnabled ? 'enabled' : 'disabled'}">
                                ${state.cdnEnabled ? 'Active' : 'Disabled'}
                            </div>
                        </div>
                    </div>
                    <div class="litespeed-button-group">
                        <button id="ls-refresh-stats" class="litespeed-btn litespeed-primary-btn">Refresh</button>
                        <button id="ls-clear-stats" class="litespeed-btn litespeed-secondary-btn">Clear Stats</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            this.panelContainer.querySelector('.close-btn').addEventListener('click', () => {
                this.hidePanel();
            });
            
            // Refresh button
            this.panelContainer.querySelector('#ls-refresh-stats').addEventListener('click', () => {
                this.showStatistics(); // Reload with current stats
            });
            
            // Clear stats button
            this.panelContainer.querySelector('#ls-clear-stats').addEventListener('click', () => {
                state.stats.cacheHits = 0;
                state.stats.cacheMisses = 0;
                state.stats.cdnBandwidthSaved = 0;
                state.stats.imageOptimizationSavings = 0;
                this.showStatistics(); // Reload with cleared stats
            });
            
            // Show the panel
            this.showPanel();
        },
        
        // Calculate cache hit ratio
        calculateCacheHitRatio: function() {
            const total = state.stats.cacheHits + state.stats.cacheMisses;
            if (total === 0) return '0.00';
            
            const ratio = (state.stats.cacheHits / total) * 100;
            return ratio.toFixed(2);
        },
        
        // Show panel
        showPanel: function() {
            if (!this.panelContainer) return;
            
            // Add panel styles if not already added
            this.addPanelStyles();
            
            // Show panel
            this.panelContainer.style.display = 'block';
        },
        
        // Hide panel
        hidePanel: function() {
            if (!this.panelContainer) return;
            
            this.panelContainer.style.display = 'none';
        },
        
        // Add CSS styles for panel
        addPanelStyles: function() {
            // Check if styles already exist
            if (document.getElementById('litespeed-styles')) return;
            
            // Create style element
            const style = document.createElement('style');
            style.id = 'litespeed-styles';
            style.textContent = `
                .litespeed-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    max-width: 90%;
                    max-height: 90vh;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                
                .litespeed-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: #0073aa;
                    color: white;
                }
                
                .litespeed-panel-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 500;
                }
                
                .litespeed-panel-header .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                
                .litespeed-panel-body {
                    padding: 20px;
                    max-height: calc(90vh - 60px);
                    overflow-y: auto;
                }
                
                .litespeed-form-group {
                    margin-bottom: 15px;
                }
                
                .litespeed-form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .litespeed-form-group input[type="text"] {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .toggle-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                
                .toggle-label input[type="checkbox"] {
                    margin-right: 8px;
                }
                
                .litespeed-button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .litespeed-btn {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .litespeed-primary-btn {
                    background: #0073aa;
                    color: white;
                }
                
                .litespeed-primary-btn:hover {
                    background: #005d8c;
                }
                
                .litespeed-secondary-btn {
                    background: #f0f0f0;
                    color: #333;
                }
                
                .litespeed-secondary-btn:hover {
                    background: #e0e0e0;
                }
                
                .litespeed-danger-btn {
                    background: #dc3545;
                    color: white;
                }
                
                .litespeed-danger-btn:hover {
                    background: #bd2130;
                }
                
                .litespeed-stat-group {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .litespeed-stat-item {
                    flex: 1;
                    background: #f5f5f5;
                    border-radius: 6px;
                    padding: 15px;
                    text-align: center;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                }
                
                .stat-value.enabled {
                    color: #28a745;
                }
                
                .stat-value.disabled {
                    color: #dc3545;
                }
                
                .litespeed-message {
                    padding: 10px 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }
                
                .litespeed-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .litespeed-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            `;
            
            // Add to head
            document.head.appendChild(style);
        },
        
        // Show message in panel
        showMessage: function(message, type = 'success') {
            if (!this.panelContainer) return;
            
            // Remove existing messages
            const existingMessages = this.panelContainer.querySelectorAll('.litespeed-message');
            existingMessages.forEach(msg => msg.remove());
            
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = `litespeed-message ${type}`;
            messageEl.textContent = message;
            
            // Add to panel body
            const panelBody = this.panelContainer.querySelector('.litespeed-panel-body');
            if (panelBody) {
                panelBody.insertBefore(messageEl, panelBody.firstChild);
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    messageEl.remove();
                }, 5000);
            }
        }
    };

    // Initialize the plugin
    const initialize = async function() {
        if (state.initialized) return true;
        
        try {
            // Load settings
            settingsManager.loadSettings();
            
            // Initialize cache manager
            await cacheManager.init();
            
            // Check connection if API key and site ID are set
            if (state.apiKey && state.siteId) {
                apiClient.validateConnection();
            }
            
            // Register with AlgorithmPress plugin system if available
            if (window.AlgorithmPress && window.AlgorithmPress.PluginSystem) {
                window.AlgorithmPress.PluginSystem.registerPlugin({
                    name: 'LiteSpeed CDN',
                    id: 'litespeed-cdn',
                    version: '1.0.0',
                    description: 'Connects to LiteSpeed CDN for caching and optimization',
                    author: 'AlgorithmPress',
                    icon: 'cloud',
                    onActivate: function() {
                        state.enabled = true;
                        settingsManager.saveSettings({ enabled: true });
                        return true;
                    },
                    onDeactivate: function() {
                        state.enabled = false;
                        settingsManager.saveSettings({ enabled: false });
                        return true;
                    },
                    settingsUI: function() {
                        uiManager.showSettings();
                    }
                });
            }
            
            state.initialized = true;
            return true;
        } catch (error) {
            console.error('LiteSpeed Plugin: Initialization error', error);
            return false;
        }
    };

    // Public API
    return {
        // Initialize the plugin
        init: async function() {
            return await initialize();
        },
        
        // Connect to LiteSpeed API
        connect: async function(apiKey, domain) {
            const result = await apiClient.connect(apiKey, domain);
            
            if (result.success) {
                settingsManager.saveSettings({ 
                    apiKey: apiKey,
                    siteId: result.siteId
                });
            }
            
            return result;
        },
        
        // Process URL through CDN if enabled
        processUrl: function(url, type = 'generic') {
            if (!state.enabled) return url;
            
            if (type === 'image' && state.imageOptEnabled) {
                return imageOptimizer.processImageUrl(url);
            } else if (state.cdnEnabled) {
                return cdnManager.getCdnUrl(url);
            }
            
            return url;
        },
        
        // Store data in cache
        cache: async function(key, data, contentType = 'text/plain', ttl = 3600) {
            if (!state.enabled || !state.cacheEnabled) return false;
            
            return await cacheManager.store(key, data, contentType, ttl);
        },
        
        // Retrieve data from cache
        getFromCache: async function(key) {
            if (!state.enabled || !state.cacheEnabled) return null;
            
            return await cacheManager.retrieve(key);
        },
        
        // Purge cache (local or CDN)
        purgeCache: async function(type = 'all', urls = []) {
            if (!state.enabled) return false;
            
            if (type === 'cdn' || type === 'all') {
                await apiClient.purgeCdnCache(urls);
            }
            
            if (type === 'local' || type === 'all') {
                await cacheManager.clear();
            }
            
            return true;
        },
        
        // Minify CSS
        minifyCss: function(css) {
            if (!state.enabled || !state.cssJsMinify) return css;
            
            return minifier.minifyCss(css);
        },
        
        // Minify JavaScript
        minifyJs: function(js) {
            if (!state.enabled || !state.cssJsMinify) return js;
            
            return minifier.minifyJs(js);
        },
        
        // Add image to lazy loading
        addLazyLoadImage: function(imgElement, originalSrc) {
            if (!state.enabled || !state.lazyLoadEnabled) return false;
            
            return imageOptimizer.addToLazyLoad(imgElement, originalSrc);
        },
        
        // Show settings UI
        showSettings: function() {
            uiManager.showSettings();
        },
        
        // Show statistics UI
        showStatistics: function() {
            uiManager.showStatistics();
        },
        
        // Get current settings
        getSettings: function() {
            return { ...state.settings };
        },
        
        // Update settings
        updateSettings: function(settings) {
            return settingsManager.saveSettings(settings);
        },
        
        // Get connection status
        isConnected: function() {
            return state.connected;
        },
        
        // Get plugin status
        isEnabled: function() {
            return state.enabled;
        }
    };
})();

// Auto-initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    LiteSpeedPlugin.init();
});

// Register with AlgorithmPress Plugin System if available
if (window.AlgorithmPress && window.AlgorithmPress.registerPlugin) {
    window.AlgorithmPress.registerPlugin({
        name: 'LiteSpeed CDN',
        version: '1.0.0',
        description: 'LiteSpeed CDN integration for AlgorithmPress',
        api: LiteSpeedPlugin,
        menu: {
            title: 'LiteSpeed CDN',
            icon: 'cloud',
            action: function() {
                LiteSpeedPlugin.showSettings();
            }
        }
    });
}

// Export for global access
window.LiteSpeedPlugin = LiteSpeedPlugin;
