/**
 * NexusGrid: Decentralized Application Platform
 * 
 * A distributed application hosting and marketplace system with
 * decentralized storage via Cubbit integration.
 */

const NexusGrid = (function() {
    // Private variables
    let _config = {
        version: '1.0.0',
        apiEndpoint: '/api/nexusgrid',
        nodeId: generateUniqueNodeId(),
        cubbitConfig: {
            bucketName: 'nexusgrid-apps',
            region: 'eu-central-1',
            endpoint: 'https://s3.cubbit.eu'
        },
        discoveryServers: [
            'https://discovery-1.nexusgrid.io',
            'https://discovery-2.nexusgrid.io'
        ],
        maxConcurrentDeployments: 5,
        appContainerDefaults: {
            memoryLimit: '256MB',
            cpuLimit: '0.5',
            storageLimit: '1GB',
            timeout: 30000
        }
    };
    
    // Track connected nodes and running applications
    const _nodes = new Map();
    const _applications = new Map();
    const _deploymentQueue = [];
    const _activeDeployments = new Set();
    const _eventSubscribers = new Map();
    
    // Track marketplace data
    const _marketplace = {
        categories: new Map(),
        featuredApps: [],
        publishedApps: new Map(),
        pendingApps: new Map(),
        userRatings: new Map()
    };
    
    // Cubbit client for decentralized storage
    let _cubbitClient = null;
    
    /**
     * Generates a unique ID for this node in the NexusGrid network
     * @returns {string} A unique node identifier
     */
    function generateUniqueNodeId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `node_${timestamp}_${randomStr}`;
    }
    
    /**
     * Initialize the NexusGrid system
     * @param {Object} config - Configuration options
     * @returns {Promise<void>}
     */
    async function initialize(config = {}) {
        console.log('Initializing NexusGrid platform...');
        
        // Merge provided config with defaults
        _config = {..._config, ...config};
        
        try {
            // Initialize Cubbit storage client
            await initializeCubbitStorage();
            
            // Discover and connect to other nodes
            await discoverNodes();
            
            // Register this node with discovery servers
            await registerWithDiscoveryServers();
            
            // Set up periodic node heartbeat
            startNodeHeartbeat();
            
            // Initialize the application registry
            await initializeApplicationRegistry();
            
            // Initialize marketplace data
            await initializeMarketplace();
            
            console.log(`NexusGrid initialized successfully. Node ID: ${_config.nodeId}`);
            triggerEvent('system:initialized', { nodeId: _config.nodeId });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize NexusGrid:', error);
            triggerEvent('system:error', { error });
            return false;
        }
    }
    
    /**
     * Initialize the Cubbit decentralized storage client
     * @returns {Promise<void>}
     */
    async function initializeCubbitStorage() {
        console.log('Initializing Cubbit storage integration...');
        
        try {
            // Create S3-compatible client for Cubbit
            _cubbitClient = new CubbitStorageClient({
                bucketName: _config.cubbitConfig.bucketName,
                region: _config.cubbitConfig.region,
                endpoint: _config.cubbitConfig.endpoint,
                credentials: _config.cubbitConfig.credentials
            });
            
            // Ensure the application bucket exists
            await _cubbitClient.ensureBucketExists(_config.cubbitConfig.bucketName);
            
            console.log('Cubbit storage initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Cubbit storage:', error);
            throw error;
        }
    }
    
    /**
     * Discover other NexusGrid nodes through discovery servers
     * @returns {Promise<void>}
     */
    async function discoverNodes() {
        console.log('Discovering other NexusGrid nodes...');
        
        try {
            const discoveryPromises = _config.discoveryServers.map(async (server) => {
                try {
                    const response = await fetch(`${server}/nodes`);
                    if (!response.ok) throw new Error(`Discovery server ${server} returned ${response.status}`);
                    
                    const nodes = await response.json();
                    nodes.forEach(node => {
                        if (node.id !== _config.nodeId) {
                            _nodes.set(node.id, {
                                id: node.id,
                                address: node.address,
                                status: 'discovered',
                                lastSeen: Date.now(),
                                capabilities: node.capabilities || []
                            });
                        }
                    });
                    
                    return nodes;
                } catch (err) {
                    console.warn(`Failed to discover nodes from ${server}:`, err);
                    return [];
                }
            });
            
            await Promise.all(discoveryPromises);
            
            console.log(`Discovered ${_nodes.size} other nodes in the NexusGrid network`);
            return true;
        } catch (error) {
            console.error('Node discovery failed:', error);
            throw error;
        }
    }
    
    /**
     * Register this node with discovery servers
     * @returns {Promise<void>}
     */
    async function registerWithDiscoveryServers() {
        console.log('Registering node with discovery servers...');
        
        const nodeInfo = {
            id: _config.nodeId,
            address: window.location.origin,
            capabilities: detectNodeCapabilities(),
            version: _config.version,
            startedAt: Date.now()
        };
        
        const registrationPromises = _config.discoveryServers.map(async (server) => {
            try {
                const response = await fetch(`${server}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nodeInfo)
                });
                
                if (!response.ok) throw new Error(`Registration with ${server} failed: ${response.status}`);
                
                return true;
            } catch (err) {
                console.warn(`Failed to register with discovery server ${server}:`, err);
                return false;
            }
        });
        
        const results = await Promise.all(registrationPromises);
        const successCount = results.filter(Boolean).length;
        
        if (successCount === 0) {
            console.error('Failed to register with any discovery servers');
            throw new Error('Node registration failed');
        }
        
        console.log(`Node registered with ${successCount}/${_config.discoveryServers.length} discovery servers`);
        return true;
    }
    
    /**
     * Detect capabilities of the current node
     * @returns {Array} Array of capability strings
     */
    function detectNodeCapabilities() {
        const capabilities = ['hosting', 'marketplace'];
        
        // Detect if this node can run containers
        if (typeof window.Worker !== 'undefined') {
            capabilities.push('containers');
        }
        
        // Check for WebGL support for 3D demos
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl && gl instanceof WebGLRenderingContext) {
            capabilities.push('webgl');
        }
        
        // Check for WebAssembly support
        if (typeof WebAssembly === 'object') {
            capabilities.push('wasm');
        }
        
        // Check for storage capability
        try {
            localStorage.setItem('nexusgrid_test', '1');
            localStorage.removeItem('nexusgrid_test');
            capabilities.push('storage');
        } catch (e) {
            // Storage not available
        }
        
        return capabilities;
    }
    
    /**
     * Start periodic heartbeat to keep node alive in the network
     */
    function startNodeHeartbeat() {
        const HEARTBEAT_INTERVAL = 60000; // 1 minute
        
        setInterval(async () => {
            try {
                // Ping discovery servers
                for (const server of _config.discoveryServers) {
                    try {
                        await fetch(`${server}/heartbeat`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                nodeId: _config.nodeId,
                                timestamp: Date.now(),
                                applications: Array.from(_applications.keys())
                            })
                        });
                    } catch (err) {
                        console.warn(`Heartbeat to ${server} failed:`, err);
                    }
                }
                
                // Ping directly connected nodes
                for (const [nodeId, node] of _nodes.entries()) {
                    if (node.status === 'connected') {
                        try {
                            const response = await fetch(`${node.address}/api/nexusgrid/heartbeat`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    nodeId: _config.nodeId,
                                    timestamp: Date.now()
                                })
                            });
                            
                            if (response.ok) {
                                node.lastSeen = Date.now();
                            } else {
                                console.warn(`Heartbeat to node ${nodeId} returned status ${response.status}`);
                                if (Date.now() - node.lastSeen > 300000) { // 5 minutes
                                    node.status = 'disconnected';
                                }
                            }
                        } catch (err) {
                            console.warn(`Heartbeat to node ${nodeId} failed:`, err);
                            if (Date.now() - node.lastSeen > 300000) { // 5 minutes
                                node.status = 'disconnected';
                            }
                        }
                    }
                }
                
                // Clean up disconnected nodes
                for (const [nodeId, node] of _nodes.entries()) {
                    if (node.status === 'disconnected' && Date.now() - node.lastSeen > 3600000) { // 1 hour
                        _nodes.delete(nodeId);
                    }
                }
                
                triggerEvent('system:heartbeat', {
                    timestamp: Date.now(),
                    activeNodes: _nodes.size,
                    runningApps: _applications.size
                });
            } catch (error) {
                console.error('Error during node heartbeat:', error);
            }
        }, HEARTBEAT_INTERVAL);
    }
    
    /**
     * Initialize the application registry
     * @returns {Promise<void>}
     */
    async function initializeApplicationRegistry() {
        console.log('Initializing application registry...');
        
        try {
            // Load locally cached application registry
            const cachedRegistry = localStorage.getItem('nexusgrid_app_registry');
            if (cachedRegistry) {
                const parsedRegistry = JSON.parse(cachedRegistry);
                
                parsedRegistry.forEach(app => {
                    _applications.set(app.id, {
                        ...app,
                        status: 'stopped',
                        node: null
                    });
                });
            }
            
            // Sync with network registry
            await syncApplicationRegistry();
            
            console.log(`Application registry initialized with ${_applications.size} applications`);
            return true;
        } catch (error) {
            console.error('Failed to initialize application registry:', error);
            throw error;
        }
    }
    
    /**
     * Sync the local application registry with the network
     * @returns {Promise<void>}
     */
    async function syncApplicationRegistry() {
        console.log('Syncing application registry with network...');
        
        try {
            // Get applications from discovery servers
            const registryPromises = _config.discoveryServers.map(async (server) => {
                try {
                    const response = await fetch(`${server}/applications`);
                    if (!response.ok) throw new Error(`Server ${server} returned ${response.status}`);
                    
                    return await response.json();
                } catch (err) {
                    console.warn(`Failed to fetch applications from ${server}:`, err);
                    return [];
                }
            });
            
            const results = await Promise.all(registryPromises);
            
            // Merge application lists from all servers
            const networkApps = new Map();
            results.forEach(appList => {
                appList.forEach(app => {
                    if (!networkApps.has(app.id) || app.updatedAt > networkApps.get(app.id).updatedAt) {
                        networkApps.set(app.id, app);
                    }
                });
            });
            
            // Update local registry with network data
            networkApps.forEach((app, appId) => {
                if (_applications.has(appId)) {
                    // Update existing app
                    const existingApp = _applications.get(appId);
                    _applications.set(appId, {
                        ...existingApp,
                        ...app,
                        status: existingApp.status,
                        node: existingApp.node
                    });
                } else {
                    // Add new app
                    _applications.set(appId, {
                        ...app,
                        status: 'stopped',
                        node: null
                    });
                }
            });
            
            // Save updated registry to local storage
            saveApplicationRegistry();
            
            console.log(`Application registry synced, now tracking ${_applications.size} applications`);
            return true;
        } catch (error) {
            console.error('Failed to sync application registry:', error);
            throw error;
        }
    }
    
    /**
     * Save the application registry to local storage
     */
    function saveApplicationRegistry() {
        const registryData = Array.from(_applications.values()).map(app => {
            // Don't include runtime properties
            const { status, node, ...appData } = app;
            return appData;
        });
        
        localStorage.setItem('nexusgrid_app_registry', JSON.stringify(registryData));
    }
    
    /**
     * Initialize marketplace data
     * @returns {Promise<void>}
     */
    async function initializeMarketplace() {
        console.log('Initializing marketplace...');
        
        try {
            // Load categories from Cubbit
            const categoriesData = await _cubbitClient.getObject('marketplace/categories.json');
            if (categoriesData) {
                const categories = JSON.parse(categoriesData);
                categories.forEach(category => {
                    _marketplace.categories.set(category.id, category);
                });
            }
            
            // Load featured apps
            const featuredData = await _cubbitClient.getObject('marketplace/featured.json');
            if (featuredData) {
                _marketplace.featuredApps = JSON.parse(featuredData);
            }
            
            // Sync with applications registry
            _applications.forEach((app, appId) => {
                if (app.published) {
                    _marketplace.publishedApps.set(appId, app);
                }
            });
            
            console.log(`Marketplace initialized with ${_marketplace.categories.size} categories and ${_marketplace.publishedApps.size} published apps`);
            return true;
        } catch (error) {
            console.error('Failed to initialize marketplace:', error);
            
            // Continue anyway with empty marketplace
            console.log('Continuing with empty marketplace');
            return false;
        }
    }
    
    /**
     * Deploy an application to the NexusGrid network
     * @param {Object} appData - Application data
     * @returns {Promise<Object>} Deployed application information
     */
    async function deployApplication(appData) {
        console.log(`Deploying application: ${appData.name}`);
        
        // Generate app ID if not provided
        if (!appData.id) {
            appData.id = `app_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Add to deployment queue if we have too many active deployments
        if (_activeDeployments.size >= _config.maxConcurrentDeployments) {
            return new Promise((resolve, reject) => {
                console.log(`Adding ${appData.id} to deployment queue`);
                _deploymentQueue.push({
                    appData,
                    resolve,
                    reject
                });
            });
        }
        
        return processApplicationDeployment(appData);
    }
    
    /**
     * Process an application deployment
     * @param {Object} appData - Application data
     * @returns {Promise<Object>} Deployed application information
     */
    async function processApplicationDeployment(appData) {
        console.log(`Processing deployment for ${appData.id}`);
        _activeDeployments.add(appData.id);
        
        try {
            triggerEvent('application:deploying', { appId: appData.id, name: appData.name });
            
            // Validate application package
            validateApplicationPackage(appData);
            
            // Prepare application files
            const appFiles = await prepareApplicationFiles(appData);
            
            // Upload to Cubbit storage
            await uploadApplicationToStorage(appData.id, appFiles);
            
            // Register the application
            const timestamp = Date.now();
            const appInfo = {
                id: appData.id,
                name: appData.name,
                description: appData.description,
                version: appData.version || '1.0.0',
                author: appData.author,
                homepage: appData.homepage,
                repository: appData.repository,
                license: appData.license,
                tags: appData.tags || [],
                category: appData.category,
                capabilities: appData.capabilities || [],
                containerConfig: {
                    ...(_config.appContainerDefaults),
                    ...(appData.containerConfig || {})
                },
                createdAt: timestamp,
                updatedAt: timestamp,
                published: appData.published || false,
                rating: 0,
                ratingCount: 0,
                downloads: 0
            };
            
            // Add to application registry
            _applications.set(appInfo.id, {
                ...appInfo,
                status: 'stopped',
                node: null
            });
            
            // Add to marketplace if published
            if (appInfo.published) {
                _marketplace.publishedApps.set(appInfo.id, appInfo);
            } else if (appData.pendingPublication) {
                _marketplace.pendingApps.set(appInfo.id, appInfo);
            }
            
            // Save application registry
            saveApplicationRegistry();
            
            // Broadcast to network
            broadcastApplicationDeployment(appInfo);
            
            console.log(`Application ${appInfo.id} deployed successfully`);
            triggerEvent('application:deployed', { appId: appInfo.id, appInfo });
            
            return appInfo;
        } catch (error) {
            console.error(`Application deployment failed for ${appData.id}:`, error);
            triggerEvent('application:deployment-failed', { appId: appData.id, error });
            throw error;
        } finally {
            _activeDeployments.delete(appData.id);
            
            // Process next app in queue if any
            if (_deploymentQueue.length > 0 && _activeDeployments.size < _config.maxConcurrentDeployments) {
                const nextDeployment = _deploymentQueue.shift();
                
                processApplicationDeployment(nextDeployment.appData)
                    .then(nextDeployment.resolve)
                    .catch(nextDeployment.reject);
            }
        }
    }
    
    /**
     * Validate an application package
     * @param {Object} appData - Application data
     * @throws {Error} If validation fails
     */
    function validateApplicationPackage(appData) {
        // Check required fields
        const requiredFields = ['name', 'description', 'files'];
        const missingFields = requiredFields.filter(field => !appData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Check files
        if (!Array.isArray(appData.files) || appData.files.length === 0) {
            throw new Error('Application must include at least one file');
        }
        
        // Check for index file
        const hasIndexFile = appData.files.some(file => 
            file.path === 'index.html' || 
            file.path === 'index.php' || 
            file.path === 'index.js'
        );
        
        if (!hasIndexFile) {
            throw new Error('Application must include an index file (index.html, index.php, or index.js)');
        }
        
        // Additional validation for marketplace publication
        if (appData.published || appData.pendingPublication) {
            // Check additional required fields for marketplace
            const marketplaceFields = ['author', 'version', 'license', 'category'];
            const missingMarketplaceFields = marketplaceFields.filter(field => !appData[field]);
            
            if (missingMarketplaceFields.length > 0) {
                throw new Error(`Missing required fields for marketplace publication: ${missingMarketplaceFields.join(', ')}`);
            }
            
            // Validate category
            if (!_marketplace.categories.has(appData.category)) {
                throw new Error(`Invalid category: ${appData.category}`);
            }
        }
    }
    
    /**
     * Prepare application files for deployment
     * @param {Object} appData - Application data
     * @returns {Promise<Array>} Processed application files
     */
    async function prepareApplicationFiles(appData) {
        console.log(`Preparing files for ${appData.id}`);
        
        // Process and normalize file paths
        const processedFiles = [];
        
        for (const file of appData.files) {
            // Normalize path
            const normalizedPath = file.path.replace(/^\/+/, '');
            
            // Process file content based on type
            let fileContent = file.content;
            
            if (file.contentType === 'text/javascript' || normalizedPath.endsWith('.js')) {
                // Process JavaScript files
                fileContent = processJavaScriptFile(fileContent, appData);
            } else if (file.contentType === 'text/html' || normalizedPath.endsWith('.html')) {
                // Process HTML files
                fileContent = processHtmlFile(fileContent, appData);
            } else if (file.contentType === 'text/css' || normalizedPath.endsWith('.css')) {
                // Process CSS files
                fileContent = processCssFile(fileContent, appData);
            }
            
            processedFiles.push({
                path: normalizedPath,
                content: fileContent,
                contentType: file.contentType || determineContentType(normalizedPath)
            });
        }
        
        // Add NexusGrid client library if not already included
        const hasClientLib = processedFiles.some(file => 
            file.path === 'nexusgrid-client.js' || file.content.includes('nexusgrid-client.js')
        );
        
        if (!hasClientLib) {
            processedFiles.push({
                path: 'nexusgrid-client.js',
                content: await fetchNexusGridClientLibrary(),
                contentType: 'text/javascript'
            });
            
            // Inject client library reference into HTML files
            for (const file of processedFiles) {
                if (file.contentType === 'text/html' || file.path.endsWith('.html')) {
                    // Add script tag before closing head or body
                    const scriptTag = '<script src="nexusgrid-client.js"></script>';
                    
                    if (file.content.includes('</head>')) {
                        file.content = file.content.replace('</head>', `${scriptTag}</head>`);
                    } else if (file.content.includes('</body>')) {
                        file.content = file.content.replace('</body>', `${scriptTag}</body>`);
                    } else {
                        file.content += scriptTag;
                    }
                }
            }
        }
        
        // Generate container config file
        processedFiles.push({
            path: 'nexusgrid.config.json',
            content: JSON.stringify({
                id: appData.id,
                name: appData.name,
                version: appData.version || '1.0.0',
                containerConfig: {
                    ...(_config.appContainerDefaults),
                    ...(appData.containerConfig || {})
                },
                entrypoint: appData.entrypoint || 'index.html'
            }, null, 2),
            contentType: 'application/json'
        });
        
        return processedFiles;
    }
    
    /**
     * Process JavaScript file content
     * @param {string} content - File content
     * @param {Object} appData - Application data
     * @returns {string} Processed content
     */
    function processJavaScriptFile(content, appData) {
        // Add app metadata as global const
        const metadataScript = `
// NexusGrid App Metadata
const NEXUSGRID_APP = {
    id: "${appData.id}",
    name: "${appData.name}",
    version: "${appData.version || '1.0.0'}",
    nodeId: "${_config.nodeId}"
};
`;
        
        return metadataScript + content;
    }
    
    /**
     * Process HTML file content
     * @param {string} content - File content
     * @param {Object} appData - Application data
     * @returns {string} Processed content
     */
    function processHtmlFile(content, appData) {
        // Add app metadata
        const metaTag = `
    <!-- NexusGrid App Metadata -->
    <meta name="nexusgrid:app-id" content="${appData.id}">
    <meta name="nexusgrid:app-name" content="${appData.name}">
    <meta name="nexusgrid:app-version" content="${appData.version || '1.0.0'}">
    <meta name="nexusgrid:node-id" content="${_config.nodeId}">
`;
        
        // Insert meta tags after head tag
        if (content.includes('<head>')) {
            content = content.replace('<head>', '<head>' + metaTag);
        } else {
            // If no head tag, add one
            content = content.replace('<html>', '<html>\n<head>' + metaTag + '</head>');
        }
        
        return content;
    }
    
    /**
     * Process CSS file content
     * @param {string} content - File content
     * @param {Object} appData - Application data
     * @returns {string} Processed content
     */
    function processCssFile(content, appData) {
        // Add app metadata as comment
        const metadataComment = `
/* NexusGrid App: ${appData.name} (${appData.id}) */
/* Version: ${appData.version || '1.0.0'} */
/* Node: ${_config.nodeId} */
`;
        
        return metadataComment + content;
    }
    
    /**
     * Determine content type based on file extension
     * @param {string} path - File path
     * @returns {string} Content type
     */
    function determineContentType(path) {
        const extension = path.split('.').pop().toLowerCase();
        
        const contentTypeMap = {
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'js': 'text/javascript',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'php': 'application/x-httpd-php',
            'wasm': 'application/wasm'
        };
        
        return contentTypeMap[extension] || 'application/octet-stream';
    }
    
    /**
     * Fetch the NexusGrid client library
     * @returns {Promise<string>} Client library code
     */
    async function fetchNexusGridClientLibrary() {
        try {
            // First try to fetch from Cubbit
            const clientLib = await _cubbitClient.getObject('system/nexusgrid-client.js');
            if (clientLib) return clientLib;
            
            // Fall back to embedded version
            return `
/**
 * NexusGrid Client Library
 * Provides integration between deployed applications and the NexusGrid platform
 */
(function() {
    window.NexusGridClient = {
        // App information
        appId: document.querySelector('meta[name="nexusgrid:app-id"]')?.content,
        appName: document.querySelector('meta[name="nexusgrid:app-name"]')?.content,
        appVersion: document.querySelector('meta[name="nexusgrid:app-version"]')?.content,
        nodeId: document.querySelector('meta[name="nexusgrid:node-id"]')?.content,
        
        // Connection to host node
        connect: function() {
            console.log('[NexusGrid] Connecting to host node:', this.nodeId);
            window.parent.postMessage({
                type: 'nexusgrid:connect',
                appId: this.appId
            }, '*');
            
            // Set up message listener
            window.addEventListener('message', this._handleMessage.bind(this));
            
            // Send ready event
            this._sendMessage('app:ready', {
                appId: this.appId,
                appName: this.appName,
                appVersion: this.appVersion
            });
        },
        
        // Data storage API
        storage: {
            set: function(key, value) {
                return window.NexusGridClient._sendMessage('storage:set', { key, value });
            },
            get: function(key) {
                return window.NexusGridClient._sendMessage('storage:get', { key });
            },
            remove: function(key) {
                return window.NexusGridClient._sendMessage('storage:remove', { key });
            },
            clear: function() {
                return window.NexusGridClient._sendMessage('storage:clear');
            }
        },
        
        // User API
        user: {
            getProfile: function() {
                return window.NexusGridClient._sendMessage('user:getProfile');
            },
            isAuthenticated: function() {
                return window.NexusGridClient._sendMessage('user:isAuthenticated');
            }
        },
        
        // Network API
        network: {
            getNodes: function() {
                return window.NexusGridClient._sendMessage('network:getNodes');
            },
            getApplications: function() {
                return window.NexusGridClient._sendMessage('network:getApplications');
            }
        },
        
        // Internal message handling
        _messageHandlers: {},
        _messageId: 0,
        _pendingMessages: {},
        
        _sendMessage: function(type, data = {}) {
            return new Promise((resolve, reject) => {
                const messageId = ++this._messageId;
                
                this._pendingMessages[messageId] = { resolve, reject };
                
                window.parent.postMessage({
                    type: 'nexusgrid:' + type,
                    messageId: messageId,
                    appId: this.appId,
                    data: data
                }, '*');
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this._pendingMessages[messageId]) {
                        reject(new Error('Message timed out'));
                        delete this._pendingMessages[messageId];
                    }
                }, 10000);
            });
        },
        
        _handleMessage: function(event) {
            const message = event.data;
            
            // Ignore non-NexusGrid messages
            if (!message || !message.type || !message.type.startsWith('nexusgrid:')) {
                return;
            }
            
            console.log('[NexusGrid] Received message:', message.type);
            
            // Handle response message
            if (message.messageId && this._pendingMessages[message.messageId]) {
                const { resolve, reject } = this._pendingMessages[message.messageId];
                
                if (message.error) {
                    reject(new Error(message.error));
                } else {
                    resolve(message.data);
                }
                
                delete this._pendingMessages[message.messageId];
                return;
            }
            
            // Handle event message
            const eventType = message.type.replace('nexusgrid:', '');
            
            if (this._messageHandlers[eventType]) {
                this._messageHandlers[eventType].forEach(handler => {
                    try {
                        handler(message.data);
                    } catch (error) {
                        console.error('[NexusGrid] Error in message handler:', error);
                    }
                });
            }
        },
        
        // Event system
        on: function(event, handler) {
            if (!this._messageHandlers[event]) {
                this._messageHandlers[event] = [];
            }
            
            this._messageHandlers[event].push(handler);
            return this;
        },
        
        off: function(event, handler) {
            if (this._messageHandlers[event]) {
                if (handler) {
                    this._messageHandlers[event] = this._messageHandlers[event].filter(h => h !== handler);
                } else {
                    delete this._messageHandlers[event];
                }
            }
            return this;
        }
    };
    
    // Automatically connect when loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.NexusGridClient.connect();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            window.NexusGridClient.connect();
        });
    }
})();
        } catch (error) {
            console.error('Failed to fetch NexusGrid client library:', error);
            throw error;
        }
    }
    
    /**
     * Upload application files to storage
     * @param {string} appId - Application ID
     * @param {Array} files - Application files
     * @returns {Promise<void>}
     */
    async function uploadApplicationToStorage(appId, files) {
        console.log(`Uploading ${files.length} files for ${appId} to Cubbit storage`);
        
        const uploadPromises = files.map(file => {
            const objectKey = `apps/${appId}/${file.path}`;
            
            return _cubbitClient.putObject(objectKey, file.content, {
                contentType: file.contentType
            });
        });
        
        await Promise.all(uploadPromises);
        
        // Also save app metadata
        const appMetadata = _applications.get(appId);
        if (appMetadata) {
            const metadataKey = `metadata/${appId}.json`;
            await _cubbitClient.putObject(metadataKey, JSON.stringify(appMetadata), {
                contentType: 'application/json'
            });
        }
        
        console.log(`Upload complete for ${appId}`);
    }
    
    /**
     * Broadcast application deployment to the network
     * @param {Object} appInfo - Application information
     */
    async function broadcastApplicationDeployment(appInfo) {
        console.log(`Broadcasting deployment of ${appInfo.id} to network`);
        
        // Notify discovery servers
        const broadcastPromises = _config.discoveryServers.map(async (server) => {
            try {
                const response = await fetch(`${server}/applications`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nodeId: _config.nodeId,
                        application: appInfo
                    })
                });
                
                return response.ok;
            } catch (err) {
                console.warn(`Failed to broadcast to discovery server ${server}:`, err);
                return false;
            }
        });
        
        const results = await Promise.all(broadcastPromises);
        const successCount = results.filter(Boolean).length;
        
        console.log(`Application broadcast complete: ${successCount}/${_config.discoveryServers.length} servers notified`);
    }
    
    /**
     * Launch an application on the local node
     * @param {string} appId - Application ID
     * @returns {Promise<Object>} Application runtime information
     */
    async function launchApplication(appId) {
        console.log(`Launching application ${appId}`);
        
        if (!_applications.has(appId)) {
            throw new Error(`Application ${appId} not found`);
        }
        
        const app = _applications.get(appId);
        
        try {
            triggerEvent('application:launching', { appId, name: app.name });
            
            // Check if already running
            if (app.status === 'running') {
                console.log(`Application ${appId} is already running`);
                return {
                    appId: app.id,
                    status: app.status,
                    node: app.node,
                    url: app.url
                };
            }
            
            // Update status to starting
            app.status = 'starting';
            _applications.set(appId, app);
            
            // Create container for the app
            const containerInfo = await createApplicationContainer(app);
            
            // Update application status
            app.status = 'running';
            app.node = _config.nodeId;
            app.url = containerInfo.url;
            app.containerId = containerInfo.containerId;
            app.startedAt = Date.now();
            
            _applications.set(appId, app);
            
            // Track app launch
            app.launchCount = (app.launchCount || 0) + 1;
            
            console.log(`Application ${appId} launched successfully`);
            triggerEvent('application:launched', { 
                appId, 
                name: app.name,
                url: app.url
            });
            
            return {
                appId: app.id,
                status: app.status,
                node: app.node,
                url: app.url
            };
        } catch (error) {
            console.error(`Failed to launch application ${appId}:`, error);
            
            // Update status to failed
            app.status = 'failed';
            app.error = error.message;
            _applications.set(appId, app);
            
            triggerEvent('application:launch-failed', { appId, error });
            throw error;
        }
    }
    
    /**
     * Create a container for an application
     * @param {Object} app - Application information
     * @returns {Promise<Object>} Container information
     */
    async function createApplicationContainer(app) {
        console.log(`Creating container for ${app.id}`);
        
        // In a web-based environment, we'll create an iframe container
        // In a more sophisticated environment, this would create an actual container
        
        // Generate a unique container ID
        const containerId = `container_${app.id}_${Date.now()}`;
        
        // Generate a URL for the application
        const appUrl = `/apps/${app.id}/`;
        
        // Return container information
        return {
            containerId,
            url: appUrl
        };
    }
    
    /**
     * Stop a running application
     * @param {string} appId - Application ID
     * @returns {Promise<boolean>} Success status
     */
    async function stopApplication(appId) {
        console.log(`Stopping application ${appId}`);
        
        if (!_applications.has(appId)) {
            throw new Error(`Application ${appId} not found`);
        }
        
        const app = _applications.get(appId);
        
        try {
            // Check if already stopped
            if (app.status !== 'running') {
                console.log(`Application ${appId} is not running`);
                return true;
            }
            
            triggerEvent('application:stopping', { appId, name: app.name });
            
            // Update status to stopping
            app.status = 'stopping';
            _applications.set(appId, app);
            
            // Stop container
            await stopApplicationContainer(app);
            
            // Update status to stopped
            app.status = 'stopped';
            app.node = null;
            app.url = null;
            app.containerId = null;
            app.stoppedAt = Date.now();
            
            _applications.set(appId, app);
            
            console.log(`Application ${appId} stopped successfully`);
            triggerEvent('application:stopped', { appId, name: app.name });
            
            return true;
        } catch (error) {
            console.error(`Failed to stop application ${appId}:`, error);
            
            // Update status to failed
            app.status = 'failed';
            app.error = error.message;
            _applications.set(appId, app);
            
            triggerEvent('application:stop-failed', { appId, error });
            throw error;
        }
    }
    
    /**
     * Stop an application container
     * @param {Object} app - Application information
     * @returns {Promise<void>}
     */
    async function stopApplicationContainer(app) {
        console.log(`Stopping container for ${app.id}`);
        
        // In a web-based environment, we would remove the iframe
        // In a more sophisticated environment, this would stop the actual container
        
        // Simulate stopping delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
    }
    
    /**
     * Submit an application to the marketplace
     * @param {string} appId - Application ID
     * @returns {Promise<Object>} Submission result
     */
    async function submitToMarketplace(appId) {
        console.log(`Submitting application ${appId} to marketplace`);
        
        if (!_applications.has(appId)) {
            throw new Error(`Application ${appId} not found`);
        }
        
        const app = _applications.get(appId);
        
        try {
            // Validate application for marketplace
            validateForMarketplace(app);
            
            triggerEvent('marketplace:submitting', { appId, name: app.name });
            
            // Add to pending apps
            _marketplace.pendingApps.set(appId, app);
            
            // Submit to marketplace servers
            const submissionPromises = _config.discoveryServers.map(async (server) => {
                try {
                    const response = await fetch(`${server}/marketplace/submit`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nodeId: _config.nodeId,
                            application: app
                        })
                    });
                    
                    return response.ok;
                } catch (err) {
                    console.warn(`Failed to submit to marketplace server ${server}:`, err);
                    return false;
                }
            });
            
            const results = await Promise.all(submissionPromises);
            const successCount = results.filter(Boolean).length;
            
            if (successCount === 0) {
                throw new Error('Failed to submit to any marketplace servers');
            }
            
            console.log(`Application ${appId} submitted to marketplace successfully`);
            triggerEvent('marketplace:submitted', { 
                appId, 
                name: app.name,
                category: app.category
            });
            
            return {
                appId: app.id,
                status: 'pending',
                submittedAt: Date.now()
            };
        } catch (error) {
            console.error(`Failed to submit application ${appId} to marketplace:`, error);
            triggerEvent('marketplace:submission-failed', { appId, error });
            throw error;
        }
    }
    
    /**
     * Validate an application for marketplace submission
     * @param {Object} app - Application information
     * @throws {Error} If validation fails
     */
    function validateForMarketplace(app) {
        // Check required fields
        const requiredFields = ['name', 'description', 'version', 'author', 'license', 'category'];
        const missingFields = requiredFields.filter(field => !app[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields for marketplace: ${missingFields.join(', ')}`);
        }
        
        // Validate category
        if (!_marketplace.categories.has(app.category)) {
            throw new Error(`Invalid category: ${app.category}`);
        }
        
        // Validate version format
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(app.version)) {
            throw new Error('Invalid version format. Must be in the format x.y.z');
        }
    }
    
    /**
     * Get user submitted applications
     * @returns {Array} List of user's applications
     */
    function getUserApplications() {
        // In a real implementation, this would filter apps by user
        // For now, return all applications
        return Array.from(_applications.values());
    }
    
    /**
     * Get marketplace applications
     * @param {Object} filters - Optional filters
     * @returns {Array} List of marketplace applications
     */
    function getMarketplaceApplications(filters = {}) {
        let apps = Array.from(_marketplace.publishedApps.values());
        
        // Apply category filter
        if (filters.category) {
            apps = apps.filter(app => app.category === filters.category);
        }
        
        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            apps = apps.filter(app => 
                app.name.toLowerCase().includes(searchTerm) ||
                app.description.toLowerCase().includes(searchTerm) ||
                (app.tags && app.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        // Apply sort
        if (filters.sort) {
            switch (filters.sort) {
                case 'name':
                    apps.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'rating':
                    apps.sort((a, b) => b.rating - a.rating);
                    break;
                case 'downloads':
                    apps.sort((a, b) => b.downloads - a.downloads);
                    break;
                case 'newest':
                    apps.sort((a, b) => b.createdAt - a.createdAt);
                    break;
                case 'updated':
                    apps.sort((a, b) => b.updatedAt - a.updatedAt);
                    break;
                default:
                    // Default sort by rating
                    apps.sort((a, b) => b.rating - a.rating);
            }
        } else {
            // Default sort by rating
            apps.sort((a, b) => b.rating - a.rating);
        }
        
        return apps;
    }
    
    /**
     * Get featured applications from the marketplace
     * @returns {Array} List of featured applications
     */
    function getFeaturedApplications() {
        // Get featured app data
        const featuredApps = [];
        
        for (const featuredAppId of _marketplace.featuredApps) {
            if (_marketplace.publishedApps.has(featuredAppId)) {
                featuredApps.push(_marketplace.publishedApps.get(featuredAppId));
            }
        }
        
        return featuredApps;
    }
    
    /**
     * Get marketplace categories
     * @returns {Array} List of categories
     */
    function getMarketplaceCategories() {
        return Array.from(_marketplace.categories.values());
    }
    
    /**
     * Subscribe to NexusGrid events
     * @param {string} eventType - Event type to subscribe to
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    function subscribeToEvent(eventType, callback) {
        if (!_eventSubscribers.has(eventType)) {
            _eventSubscribers.set(eventType, new Set());
        }
        
        _eventSubscribers.get(eventType).add(callback);
        
        // Return unsubscribe function
        return () => {
            if (_eventSubscribers.has(eventType)) {
                _eventSubscribers.get(eventType).delete(callback);
            }
        };
    }
    
    /**
     * Trigger an event
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    function triggerEvent(eventType, data) {
        console.log(`Event: ${eventType}`, data);
        
        if (_eventSubscribers.has(eventType)) {
            _eventSubscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event subscriber for ${eventType}:`, error);
                }
            });
        }
        
        // Also trigger 'all' events
        if (_eventSubscribers.has('all')) {
            _eventSubscribers.get('all').forEach(callback => {
                try {
                    callback({ type: eventType, data });
                } catch (error) {
                    console.error(`Error in 'all' event subscriber:`, error);
                }
            });
        }
    }
    
    /**
     * Mock class for Cubbit Storage client
     * This would be replaced with the actual Cubbit client in production
     */
    class CubbitStorageClient {
        constructor(config) {
            this.config = config;
            this.store = new Map();
            console.log('Initialized Cubbit Storage Client with config:', config);
        }
        
        async ensureBucketExists(bucketName) {
            console.log(`Ensuring bucket exists: ${bucketName}`);
            return true;
        }
        
        async putObject(key, data, options = {}) {
            console.log(`Storing object: ${key}`);
            this.store.set(key, {
                data,
                contentType: options.contentType || 'application/octet-stream',
                timestamp: Date.now()
            });
            return { key };
        }
        
        async getObject(key) {
            if (this.store.has(key)) {
                console.log(`Retrieved object: ${key}`);
                return this.store.get(key).data;
            }
            console.log(`Object not found: ${key}`);
            return null;
        }
        
        async deleteObject(key) {
            console.log(`Deleting object: ${key}`);
            return this.store.delete(key);
        }
        
        async listObjects(prefix) {
            console.log(`Listing objects with prefix: ${prefix}`);
            const keys = [];
            
            for (const key of this.store.keys()) {
                if (key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
            
            return keys;
        }
    }
    
    // Public API
    return {
        // System management
        initialize,
        subscribeToEvent,
        
        // Application management
        deployApplication,
        launchApplication,
        stopApplication,
        getUserApplications,
        
        // Marketplace
        submitToMarketplace,
        getMarketplaceApplications,
        getFeaturedApplications,
        getMarketplaceCategories,
        
        // Network information
        getNodes: () => Array.from(_nodes.values()),
        getRunningApplications: () => {
            return Array.from(_applications.values()).filter(app => app.status === 'running');
        },
        
        // For testing and debugging
        _getCubbitClient: () => _cubbitClient,
        _getConfig: () => ({..._config})
    };
})();

// Attach the AlgorithmPress grid builder as a submodule of NexusGrid
NexusGrid.GridBuilder = (function() {
  'use strict';

  // Module state
  let _initialized = false;
  let _panel = null;
  let _panelVisible = false;

  // Grid settings
  const _gridSettings = {
    columns: 12,
    rows: 8,
    cellSize: 80,
    cellGap: 10,
    autoSave: true,
    theme: 'light'
  };

  // Current grid data
  let _gridData = [];

  // Available component types
  const _componentTypes = [
    {
      id: 'data-source',
      name: 'Data Source',
      icon: 'database',
      category: 'data',
      description: 'Connect to external data sources like APIs or databases'
    },
    {
      id: 'data-filter',
      name: 'Data Filter',
      icon: 'filter',
      category: 'data',
      description: 'Filter data based on conditions'
    },
    {
      id: 'data-transform',
      name: 'Data Transform',
      icon: 'exchange-alt',
      category: 'data',
      description: 'Transform data from one format to another'
    },
    {
      id: 'ui-container',
      name: 'UI Container',
      icon: 'border-all',
      category: 'ui',
      description: 'Container element for UI components'
    },
    {
      id: 'ui-card',
      name: 'UI Card',
      icon: 'credit-card',
      category: 'ui',
      description: 'Card component for displaying information'
    },
    {
      id: 'ui-table',
      name: 'UI Table',
      icon: 'table',
      category: 'ui',
      description: 'Table component for displaying data'
    },
    {
      id: 'ui-form',
      name: 'UI Form',
      icon: 'wpforms',
      category: 'ui',
      description: 'Form component for user input'
    },
    {
      id: 'ui-chart',
      name: 'UI Chart',
      icon: 'chart-bar',
      category: 'ui',
      description: 'Chart component for data visualization'
    },
    {
      id: 'logic-condition',
      name: 'Logic Condition',
      icon: 'code-branch',
      category: 'logic',
      description: 'Conditional logic component'
    },
    {
      id: 'logic-loop',
      name: 'Logic Loop',
      icon: 'redo',
      category: 'logic',
      description: 'Loop component for iterating over data'
    },
    {
      id: 'logic-function',
      name: 'Logic Function',
      icon: 'function',
      category: 'logic',
      description: 'Custom function component'
    },
    {
      id: 'output-html',
      name: 'HTML Output',
      icon: 'code',
      category: 'output',
      description: 'Output HTML content'
    },
    {
      id: 'output-json',
      name: 'JSON Output',
      icon: 'brackets-curly',
      category: 'output',
      description: 'Output JSON data'
    },
    {
      id: 'output-api',
      name: 'API Output',
      icon: 'plug',
      category: 'output',
      description: 'Output API response'
    }
  ];

  /**
   * Initialize the NexusGrid module
   * @param {Object} options - Initialization options
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  function initialize(options = {}) {
    return new Promise((resolve) => {
      if (_initialized) {
        console.warn('NexusGrid already initialized');
        resolve();
        return;
      }

      console.log('Initializing NexusGrid...');

      // Merge options with defaults
      Object.assign(_gridSettings, options);

      // Create panel
      createPanel();

      // Load saved grid data
      loadGridData()
        .then(data => {
          _gridData = data || [];
          console.log('Grid data loaded:', _gridData);
        })
        .catch(error => {
          console.error('Error loading grid data:', error);
        });

      // Register with module framework if available
      if (window.ModuleFramework) {
        window.ModuleFramework.registerModule({
          id: 'nexus-grid',
          name: 'NexusGrid',
          version: '1.0.0',
          instance: NexusGrid,
          status: window.ModuleFramework.MODULE_STATUS.ACTIVE
        });
      }

      // Register NexusGrid API if API Gateway is available
      if (window.ApiGateway) {
        window.ApiGateway.registerApi({
          namespace: 'nexus-grid',
          provider: 'nexus-grid',
          version: '1.0.0',
          description: 'NexusGrid API for managing grid components',
          methods: {
            getGridData: {
              handler: function() {
                return _gridData;
              },
              permissions: ['*'],
              description: 'Get current grid data'
            },
            setGridData: {
              handler: function(params) {
                _gridData = params.data;
                saveGridData();
                return { success: true };
              },
              permissions: ['admin', 'developer'],
              description: 'Set grid data',
              schema: {
                required: ['data'],
                properties: {
                  data: { type: 'array' }
                }
              }
            },
            getComponentTypes: {
              handler: function() {
                return _componentTypes;
              },
              permissions: ['*'],
              description: 'Get available component types'
            }
          }
        });
      }

      _initialized = true;
      console.log('NexusGrid initialized');

      resolve();
    });
  }

  /**
   * Create the NexusGrid panel
   */
  function createPanel() {
    // Check if panel already exists
    if (_panel) return;

    // Create panel element
    _panel = document.createElement('div');
    _panel.id = 'nexus-grid-panel';
    _panel.className = 'system-panel nexus-grid-panel hidden';

    _panel.innerHTML = `
      <div class="panel-header">
        <h2>NexusGrid</h2>
        <div class="panel-controls">
          <button class="btn btn-sm btn-outline-secondary" id="nexus-grid-settings-btn" title="Grid Settings">
            <i class="fas fa-cog"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary" id="nexus-grid-code-btn" title="View Generated Code">
            <i class="fas fa-code"></i>
          </button>
          <button class="btn btn-sm btn-outline-success" id="nexus-grid-deploy-btn" title="Deploy Grid">
            <i class="fas fa-rocket"></i>
          </button>
          <button class="panel-close-btn" id="nexus-grid-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="nexus-grid-container">
          <div class="nexus-grid-sidebar">
            <div class="components-palette">
              <h3>Components</h3>
              <div class="components-search">
                <input type="text" id="component-search" class="form-control form-control-sm" placeholder="Search components...">
              </div>
              <div class="component-categories">
                <div class="component-category active" data-category="all">
                  <span>All Components</span>
                </div>
                <div class="component-category" data-category="data">
                  <span>Data</span>
                </div>
                <div class="component-category" data-category="ui">
                  <span>UI</span>
                </div>
                <div class="component-category" data-category="logic">
                  <span>Logic</span>
                </div>
                <div class="component-category" data-category="output">
                  <span>Output</span>
                </div>
              </div>
              <div class="components-list" id="components-list">
                ${_componentTypes.map(component => `
                  <div class="component-item" draggable="true" data-component-type="${component.id}" data-category="${component.category}">
                    <div class="component-icon">
                      <i class="fas fa-${component.icon}"></i>
                    </div>
                    <div class="component-info">
                      <div class="component-name">${component.name}</div>
                      <div class="component-description">${component.description}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="components-properties hidden">
              <h3>Properties</h3>
              <div class="properties-container" id="properties-container">
                <div class="no-selection">
                  <p>No component selected</p>
                </div>
              </div>
              <div class="properties-actions">
                <button class="btn btn-sm btn-primary" id="save-properties-btn">Save</button>
                <button class="btn btn-sm btn-secondary" id="cancel-properties-btn">Cancel</button>
              </div>
            </div>
          </div>
          <div class="nexus-grid-content">
            <div class="grid-toolbar">
              <div class="grid-actions">
                <button class="btn btn-sm btn-outline-primary" id="save-grid-btn" title="Save Grid">
                  <i class="fas fa-save"></i> Save
                </button>
                <button class="btn btn-sm btn-outline-secondary" id="clear-grid-btn" title="Clear Grid">
                  <i class="fas fa-trash"></i> Clear
                </button>
              </div>
              <div class="grid-zoom">
                <button class="btn btn-sm btn-outline-secondary" id="zoom-out-btn" title="Zoom Out">
                  <i class="fas fa-search-minus"></i>
                </button>
                <span id="zoom-level">100%</span>
                <button class="btn btn-sm btn-outline-secondary" id="zoom-in-btn" title="Zoom In">
                  <i class="fas fa-search-plus"></i>
                </button>
              </div>
            </div>
            <div class="grid-container" id="grid-container">
              <div class="grid-background">
                <div class="grid" id="nexus-grid"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(_panel);

    // Add close button event listener
    document.getElementById('nexus-grid-close-btn')?.addEventListener('click', function() {
      togglePanel();
    });

    // Add component category filter
    document.querySelectorAll('.component-category').forEach(category => {
      category.addEventListener('click', function() {
        const categoryValue = this.getAttribute('data-category');

        // Update active class
        document.querySelectorAll('.component-category').forEach(c => {
          c.classList.remove('active');
        });
        this.classList.add('active');

        // Filter components
        document.querySelectorAll('.component-item').forEach(item => {
          if (categoryValue === 'all' || item.getAttribute('data-category') === categoryValue) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });

    // Add component search
    document.getElementById('component-search')?.addEventListener('input', function() {
      const searchValue = this.value.toLowerCase();

      document.querySelectorAll('.component-item').forEach(item => {
        const name = item.querySelector('.component-name').textContent.toLowerCase();
        const description = item.querySelector('.component-description').textContent.toLowerCase();

        if (name.includes(searchValue) || description.includes(searchValue)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });

    // Setup grid
    setupGrid();

    // Add grid action event listeners
    document.getElementById('save-grid-btn')?.addEventListener('click', function() {
      saveGridData()
        .then(() => {
          showToast('success', 'Grid saved successfully');
        })
        .catch(error => {
          showToast('error', 'Error saving grid: ' + error.message);
        });
    });

    document.getElementById('clear-grid-btn')?.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear the grid? All components will be removed.')) {
        clearGrid();
        showToast('info', 'Grid cleared');
      }
    });

    // Add zoom controls
    let zoomLevel = 100;

    document.getElementById('zoom-in-btn')?.addEventListener('click', function() {
      if (zoomLevel < 200) {
        zoomLevel += 10;
        updateZoom();
      }
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', function() {
      if (zoomLevel > 50) {
        zoomLevel -= 10;
        updateZoom();
      }
    });

    function updateZoom() {
      const grid = document.getElementById('nexus-grid');
      if (grid) {
        grid.style.transform = `scale(${zoomLevel / 100})`;
        document.getElementById('zoom-level').textContent = `${zoomLevel}%`;
      }
    }

    // Add component drag and drop
    setupDragAndDrop();

    // Add code view button
    document.getElementById('nexus-grid-code-btn')?.addEventListener('click', function() {
      showCodeView();
    });

    // Add settings button
    document.getElementById('nexus-grid-settings-btn')?.addEventListener('click', function() {
      showSettingsDialog();
    });

    // Add deploy button
    document.getElementById('nexus-grid-deploy-btn')?.addEventListener('click', function() {
      deployGrid();
    });
  }

  /**
   * Setup the grid
   */
  function setupGrid() {
    const grid = document.getElementById('nexus-grid');
    if (!grid) return;

    // Clear existing grid
    grid.innerHTML = '';

    // Create grid cells
    for (let row = 0; row < _gridSettings.rows; row++) {
      for (let col = 0; col < _gridSettings.columns; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);

        cell.style.width = `${_gridSettings.cellSize}px`;
        cell.style.height = `${_gridSettings.cellSize}px`;

        grid.appendChild(cell);
      }
    }

    // Set grid styles
    grid.style.gridTemplateColumns = `repeat(${_gridSettings.columns}, ${_gridSettings.cellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${_gridSettings.rows}, ${_gridSettings.cellSize}px)`;
    grid.style.gap = `${_gridSettings.cellGap}px`;

    // Load existing components
    loadComponentsToGrid();
  }

  /**
   * Load components to grid
   */
  function loadComponentsToGrid() {
    if (!_gridData || _gridData.length === 0) return;

    _gridData.forEach(componentData => {
      addComponentToGrid(componentData);
    });
  }

  /**
   * Add a component to the grid
   * @param {Object} componentData - Component data
   */
  function addComponentToGrid(componentData) {
    const grid = document.getElementById('nexus-grid');
    if (!grid) return;

    // Find component type
    const componentType = _componentTypes.find(type => type.id === componentData.type);
    if (!componentType) return;

    // Create component element
    const component = document.createElement('div');
    component.className = 'grid-component';
    component.setAttribute('data-component-id', componentData.id);
    component.setAttribute('data-component-type', componentData.type);

    // Set position
    component.style.gridRowStart = componentData.position.row + 1;
    component.style.gridColumnStart = componentData.position.col + 1;
    component.style.gridRowEnd = 'span ' + componentData.size.rows;
    component.style.gridColumnEnd = 'span ' + componentData.size.cols;

    // Add component content
    component.innerHTML = `
      <div class="component-header">
        <div class="component-type">
          <i class="fas fa-${componentType.icon}"></i>
          <span>${componentType.name}</span>
        </div>
        <div class="component-controls">
          <button class="component-edit-btn" title="Edit Component">
            <i class="fas fa-edit"></i>
          </button>
          <button class="component-delete-btn" title="Delete Component">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="component-body">
        <div class="component-content">
          ${componentData.name || componentType.name}
        </div>
      </div>
    `;

    // Add to grid
    grid.appendChild(component);

    // Add event listeners
    component.querySelector('.component-edit-btn')?.addEventListener('click', function(e) {
      e.stopPropagation();
      editComponent(componentData.id);
    });

    component.querySelector('.component-delete-btn')?.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteComponent(componentData.id);
    });

    component.addEventListener('click', function() {
      selectComponent(componentData.id);
    });

    // Make component draggable
    component.draggable = true;

    component.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('component-id', componentData.id);
      e.dataTransfer.effectAllowed = 'move';
    });
  }

  /**
   * Setup drag and drop for components
   */
  function setupDragAndDrop() {
    // Make component items draggable
    document.querySelectorAll('.component-item').forEach(item => {
      item.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('component-type', this.getAttribute('data-component-type'));
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    // Setup drop target
    const grid = document.getElementById('nexus-grid');
    if (!grid) return;

    grid.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    grid.addEventListener('drop', function(e) {
      e.preventDefault();

      // Get drop position
      const rect = grid.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate cell position
      const cellSize = _gridSettings.cellSize + _gridSettings.cellGap;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      // Check if position is valid
      if (col < 0 || col >= _gridSettings.columns || row < 0 || row >= _gridSettings.rows) {
        return;
      }

      // Check if we're moving an existing component
      const componentId = e.dataTransfer.getData('component-id');
      if (componentId) {
        // Update component position
        const component = _gridData.find(c => c.id === componentId);
        if (component) {
          component.position = { row, col };

          // Update grid
          updateGrid();
        }
        return;
      }

      // Get component type
      const componentType = e.dataTransfer.getData('component-type');
      if (!componentType) return;

      // Create new component
      const newComponent = {
        id: generateId(),
        type: componentType,
        position: { row, col },
        size: { rows: 1, cols: 2 },
        properties: {}
      };

      // Add to grid data
      _gridData.push(newComponent);

      // Update grid
      updateGrid();
    });
  }

  /**
   * Update the grid
   */
  function updateGrid() {
    // Clear existing components
    const grid = document.getElementById('nexus-grid');
    if (!grid) return;

    // Remove all components
    document.querySelectorAll('.grid-component').forEach(component => {
      component.remove();
    });

    // Add components
    loadComponentsToGrid();

    // Save if auto save is enabled
    if (_gridSettings.autoSave) {
      saveGridData();
    }
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Select a component
   * @param {string} componentId - Component ID
   */
  function selectComponent(componentId) {
    // Find component
    const component = _gridData.find(c => c.id === componentId);
    if (!component) return;

    // Find component type
    const componentType = _componentTypes.find(type => type.id === component.type);
    if (!componentType) return;

    // Show properties panel
    document.querySelector('.components-palette').classList.add('hidden');
    document.querySelector('.components-properties').classList.remove('hidden');

    // Update properties panel
    const propertiesContainer = document.getElementById('properties-container');
    if (!propertiesContainer) return;

    // Generate properties form based on component type
    let propertiesHtml = `
      <div class="property-group">
        <h4>Basic Properties</h4>
        <div class="property-field">
          <label for="component-name">Name</label>
          <input type="text" id="component-name" class="form-control" value="${component.name || componentType.name}">
        </div>
        <div class="property-field">
          <label for="component-description">Description</label>
          <textarea id="component-description" class="form-control">${component.description || ''}</textarea>
        </div>
      </div>
      <div class="property-group">
        <h4>Size & Position</h4>
        <div class="property-row">
          <div class="property-field">
            <label for="component-rows">Rows</label>
            <input type="number" id="component-rows" class="form-control" value="${component.size.rows}" min="1" max="${_gridSettings.rows}">
          </div>
          <div class="property-field">
            <label for="component-cols">Columns</label>
            <input type="number" id="component-cols" class="form-control" value="${component.size.cols}" min="1" max="${_gridSettings.columns}">
          </div>
        </div>
      </div>
    `;

    // Add component-specific properties based on type
    switch (component.type) {
      case 'data-source':
        propertiesHtml += `
          <div class="property-group">
            <h4>Data Source Properties</h4>
            <div class="property-field">
              <label for="data-source-type">Source Type</label>
              <select id="data-source-type" class="form-select">
                <option value="api" ${component.properties.sourceType === 'api' ? 'selected' : ''}>API</option>
                <option value="database" ${component.properties.sourceType === 'database' ? 'selected' : ''}>Database</option>
                <option value="file" ${component.properties.sourceType === 'file' ? 'selected' : ''}>File</option>
              </select>
            </div>
            <div class="property-field">
              <label for="data-source-url">URL/Connection String</label>
              <input type="text" id="data-source-url" class="form-control" value="${component.properties.url || ''}">
            </div>
          </div>
        `;
        break;

      case 'ui-table':
        propertiesHtml += `
          <div class="property-group">
            <h4>Table Properties</h4>
            <div class="property-field">
              <label for="table-data-source">Data Source</label>
              <select id="table-data-source" class="form-select">
                <option value="">Select Data Source</option>
                ${_gridData.filter(c => c.type === 'data-source').map(c => `
                  <option value="${c.id}" ${component.properties.dataSource === c.id ? 'selected' : ''}>${c.name || 'Data Source'}</option>
                `).join('')}
              </select>
            </div>
            <div class="property-field">
              <label for="table-columns">Columns (comma-separated)</label>
              <input type="text" id="table-columns" class="form-control" value="${component.properties.columns || ''}">
            </div>
          </div>
        `;
        break;

      case 'ui-chart':
        propertiesHtml += `
          <div class="property-group">
            <h4>Chart Properties</h4>
            <div class="property-field">
              <label for="chart-type">Chart Type</label>
              <select id="chart-type" class="form-select">
                <option value="bar" ${component.properties.chartType === 'bar' ? 'selected' : ''}>Bar Chart</option>
                <option value="line" ${component.properties.chartType === 'line' ? 'selected' : ''}>Line Chart</option>
                <option value="pie" ${component.properties.chartType === 'pie' ? 'selected' : ''}>Pie Chart</option>
              </select>
            </div>
            <div class="property-field">
              <label for="chart-data-source">Data Source</label>
              <select id="chart-data-source" class="form-select">
                <option value="">Select Data Source</option>
                ${_gridData.filter(c => c.type === 'data-source').map(c => `
                  <option value="${c.id}" ${component.properties.dataSource === c.id ? 'selected' : ''}>${c.name || 'Data Source'}</option>
                `).join('')}
              </select>
            </div>
          </div>
        `;
        break;
    }

    propertiesContainer.innerHTML = propertiesHtml;

    // Add save button event listener
    document.getElementById('save-properties-btn')?.addEventListener('click', function() {
      // Get updated properties
      const updatedComponent = {
        ...component,
        name: document.getElementById('component-name').value,
        description: document.getElementById('component-description').value,
        size: {
          rows: parseInt(document.getElementById('component-rows').value),
          cols: parseInt(document.getElementById('component-cols').value)
        },
        properties: { ...component.properties }
      };

      // Get component-specific properties
      switch (component.type) {
        case 'data-source':
          updatedComponent.properties.sourceType = document.getElementById('data-source-type').value;
          updatedComponent.properties.url = document.getElementById('data-source-url').value;
          break;

        case 'ui-table':
          updatedComponent.properties.dataSource = document.getElementById('table-data-source').value;
          updatedComponent.properties.columns = document.getElementById('table-columns').value;
          break;

        case 'ui-chart':
          updatedComponent.properties.chartType = document.getElementById('chart-type').value;
          updatedComponent.properties.dataSource = document.getElementById('chart-data-source').value;
          break;
      }

      // Update component in grid data
      const index = _gridData.findIndex(c => c.id === componentId);
      if (index !== -1) {
        _gridData[index] = updatedComponent;
      }

      // Update grid
      updateGrid();

      // Hide properties panel
      document.querySelector('.components-palette').classList.remove('hidden');
      document.querySelector('.components-properties').classList.add('hidden');
    });

    // Add cancel button event listener
    document.getElementById('cancel-properties-btn')?.addEventListener('click', function() {
      document.querySelector('.components-palette').classList.remove('hidden');
      document.querySelector('.components-properties').classList.add('hidden');
    });
  }

  /**
   * Edit a component
   * @param {string} componentId - Component ID
   */
  function editComponent(componentId) {
    selectComponent(componentId);
  }

  /**
   * Delete a component
   * @param {string} componentId - Component ID
   */
  function deleteComponent(componentId) {
    if (!confirm('Are you sure you want to delete this component?')) return;

    // Remove component from grid data
    const index = _gridData.findIndex(c => c.id === componentId);
    if (index !== -1) {
      _gridData.splice(index, 1);
    }

    // Update grid
    updateGrid();
  }

  /**
   * Clear the grid
   */
  function clearGrid() {
    _gridData = [];
    updateGrid();
  }

  /**
   * Show code view dialog
   */
  function showCodeView() {
    // Create code view dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Generated Code</h3>
            <button class="modal-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="tabs">
              <button class="tab active" data-tab="php">PHP</button>
              <button class="tab" data-tab="html">HTML</button>
              <button class="tab" data-tab="json">JSON</button>
            </div>
            <div class="tab-content">
              <div class="tab-pane active" id="php-code">
                <pre><code>${generatePHPCode()}</code></pre>
              </div>
              <div class="tab-pane" id="html-code">
                <pre><code>${generateHTMLCode()}</code></pre>
              </div>
              <div class="tab-pane" id="json-code">
                <pre><code>${JSON.stringify(_gridData, null, 2)}</code></pre>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary copy-code-btn">Copy Code</button>
            <button class="btn btn-secondary close-dialog-btn">Close</button>
          </div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(dialog);

    // Add tab switching
    dialog.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        // Update active tab
        dialog.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Show corresponding tab pane
        const tabId = this.getAttribute('data-tab');
        dialog.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        dialog.querySelector(`#${tabId}-code`).classList.add('active');
      });
    });

    // Add copy button event listener
    dialog.querySelector('.copy-code-btn')?.addEventListener('click', function() {
      // Get active tab pane
      const activePane = dialog.querySelector('.tab-pane.active');
      if (!activePane) return;

      // Copy code to clipboard
      const code = activePane.querySelector('code').textContent;
      navigator.clipboard.writeText(code)
        .then(() => {
          showToast('success', 'Code copied to clipboard');
        })
        .catch(error => {
          console.error('Error copying code:', error);
          showToast('error', 'Error copying code');
        });
    });

    // Add close button event listener
    dialog.querySelector('.modal-close-btn')?.addEventListener('click', function() {
      dialog.remove();
    });

    dialog.querySelector('.close-dialog-btn')?.addEventListener('click', function() {
      dialog.remove();
    });
  }

  /**
   * Generate PHP code
   * @returns {string} Generated PHP code
   */
  function generatePHPCode() {
    // Generate PHP code based on grid components
    let code = '<?php\n\n';

    // Add class definition
    code += '/**\n';
    code += ' * NexusGrid Application\n';
    code += ' * Generated by AlgorithmPress NexusGrid\n';
    code += ' */\n';
    code += 'class NexusGridApp {\n';

    // Add properties
    code += '    private $dataSources = [];\n';
    code += '    private $components = [];\n\n';

    // Add constructor
    code += '    public function __construct() {\n';
    code += '        $this->initializeDataSources();\n';
    code += '        $this->initializeComponents();\n';
    code += '    }\n\n';

    // Add data sources initialization
    code += '    private function initializeDataSources() {\n';

    // Add data source components
    const dataSources = _gridData.filter(c => c.type === 'data-source');

    if (dataSources.length === 0) {
      code += '        // No data sources defined\n';
    } else {
      dataSources.forEach((source, index) => {
        code += `        $this->dataSources[${index}] = [\n`;
        code += `            'id' => '${source.id}',\n`;
        code += `            'type' => '${source.properties.sourceType}',\n`;
        code += `            'url' => '${source.properties.url}',\n`;
        code += `            'name' => '${source.name}',\n`;
        code += `            'description' => '${source.description}',\n`;
        code += `            'columns' => '${source.properties.columns}',\n`;
        code += `            'chartType' => '${source.properties.chartType}'\n`;
        code += `        ];\n`;
      });
    }

    code += '    }\n\n';

    // Add components initialization
    code += '    private function initializeComponents() {\n';

    // Add grid components
    _gridData.forEach(component => {
      code += `        $this->components['${component.id}'] = [\n`;
      code += `            'id' => '${component.id}',\n`;
      code += `            'type' => '${component.type}',\n`;
      code += `            'position' => ['row' => ${component.position.row}, 'col' => ${component.position.col}],\n`;
      code += `            'size' => ['rows' => ${component.size.rows}, 'cols' => ${component.size.cols}],\n`;
      code += `            'properties' => ${JSON.stringify(component.properties).replace(/"/g, '\'')}\n`;
      code += `        ];\n`;
    });

    code += '    }\n';
    code += '}\n';

    return code;
  }

  /**
   * Generate HTML code
   * @returns {string} Generated HTML code
   */
  function generateHTMLCode() {
    let html = '<!DOCTYPE html>\n';
    html += '<html lang="en">\n';
    html += '<head>\n';
    html += '    <meta charset="UTF-8">\n';
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '    <title>NexusGrid Application</title>\n';
    html += '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">\n';
    html += '    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">\n';
    html += '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.css">\n';
    html += '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nexusgrid/1.0.0/nexusgrid.min.css">\n';
    html += '    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>\n';
    html += '    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"></script>\n';
    html += '    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>\n';
    html += '    <script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.js"></script>\n';
    html += '    <script src="https://cdnjs.cloudflare.com/ajax/libs/nexusgrid/1.0.0/nexusgrid.min.js"></script>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '    <div class="container">\n';
    html += '        <h1 class="my-4">NexusGrid Application</h1>\n';
    html += '        <div id="app"></div>\n';
    html += '    </div>\n';
    html += '\n';
    html += '    <script>\n';
    html += '        // Initialize NexusGrid\n';
    html += '        NexusGrid.initialize({\n';
    html += '            // Custom initialization options\n';
    html += '        }).then(() => {\n';
    html += '            console.log("NexusGrid initialized");\n';
    html += '        }).catch(error => {\n';
    html += '            console.error("Error initializing NexusGrid:", error);\n';
    html += '        });\n';
    html += '\n';
    html += '        // Example: Deploy an application\n';
    html += '        function deployApp() {\n';
    html += '            NexusGrid.deployApplication({\n';
    html += '                name: "My App",\n';
    html += '                description: "This is my app",\n';
    html += '                files: [\n';
    html += '                    {\n';
    html += '                        path: "index.html",\n';
    html += '                        content: "<h1>Hello, NexusGrid!</h1>",\n';
    html += '                        contentType: "text/html"\n';
    html += '                    }\n';
    html += '                ],\n';
    html += '                published: true\n';
    html += '            }).then(appInfo => {\n';
    html += '                console.log("App deployed:", appInfo);\n';
    html += '            }).catch(error => {\n';
    html += '                console.error("Error deploying app:", error);\n';
    html += '            });\n';
    html += '        }\n';
    html += '\n';
    html += '        // Example: Launch an application\n';
    html += '        function launchApp(appId) {\n';
    html += '            NexusGrid.launchApplication(appId)\n';
    html += '                .then(runtimeInfo => {\n';
    html += '                    console.log("App launched:", runtimeInfo);\n';
    html += '                })\n';
    html += '                .catch(error => {\n';
    html += '                    console.error("Error launching app:", error);\n';
    html += '                });\n';
    html += '        }\n';
    html += '\n';
    html += '        // Example: Stop an application\n';
    html += '        function stopApp(appId) {\n';
    html += '            NexusGrid.stopApplication(appId)\n';
    html += '                .then(success => {\n';
    html += '                    console.log("App stopped:", success);\n';
    html += '                })\n';
    html += '                .catch(error => {\n';
    html += '                    console.error("Error stopping app:", error);\n';
    html += '                });\n';
    html += '        }\n';
    html += '\n';
    html += '        // Example: Submit an application to marketplace\n';
    html += '        function submitAppToMarketplace(appId) {\n';
    html += '            NexusGrid.submitToMarketplace(appId)\n';
    html += '                .then(result => {\n';
    html += '                    console.log("App submitted to marketplace:", result);\n';
    html += '                })\n';
    html += '                .catch(error => {\n';
    html += '                    console.error("Error submitting app to marketplace:", error);\n';
    html += '                });\n';
    html += '        }\n';
    html += '    </script>\n';
    html += '</body>\n';
    html += '</html>\n';

    return html;
  }

  /**
   * Export API for CMS integration
   */
  return {
    initialize,
    getGridData: () => _gridData,
    setGridData: (data) => { _gridData = data; },
    getComponentTypes: () => _componentTypes,
    showPanel: () => { if (!_panelVisible) { createPanel(); _panelVisible = true; } },
    hidePanel: () => { if (_panel && _panelVisible) { _panel.classList.add('hidden'); _panelVisible = false; } }
  };
})();

// Add togglePanel method to NexusGrid for integration with module framework and dock
NexusGrid.togglePanel = function() {
  let panel = document.getElementById('nexus-grid-panel');
  if (!panel) {
    // Create the panel if it doesn't exist
    panel = document.createElement('div');
    panel.id = 'nexus-grid-panel';
    panel.className = 'system-panel nexus-grid-panel hidden';
    panel.innerHTML = `
      <div class="panel-header">
        <h2>NexusGrid</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="nexus-grid-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="nexus-grid-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading NexusGrid...</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    // Close button event
    document.getElementById('nexus-grid-close-btn').addEventListener('click', function() {
      NexusGrid.togglePanel();
    });
  }
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
};