/**
 * AlgorithmPress Plugin System
 * Provides a extensibility framework for users to create and share plugins
 */

const PluginSystem = (function() {
  'use strict';
  
  // Plugin registry
  const _plugins = {};
  
  // Plugin hooks registry
  const _hooks = {};
  
  // Plugin marketplace data
  let _marketplace = null;
  
  // Plugin system status
  let _initialized = false;
  
  // Plugin system options
  const _options = {
    allowUnsignedPlugins: false,
    automaticUpdates: true,
    marketplaceUrl: 'https://plugins.algorithmpress.com/api',
    pluginStoragePath: 'plugins',
    maxPlugins: 50
  };
  
  /**
   * Plugin statuses
   */
  const PLUGIN_STATUS = {
    REGISTERED: 'registered',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ERROR: 'error',
    UPDATING: 'updating'
  };
  
  /**
   * Initialize the plugin system
   * @param {Object} options - Initialization options
   */
  function initialize(options = {}) {
    if (_initialized) {
      console.warn('Plugin system already initialized');
      return;
    }
    
    // Configure options
    Object.assign(_options, options);
    
    // Register with module framework if available
    if (window.ModuleFramework) {
      window.ModuleFramework.registerModule({
        id: 'plugin-system',
        name: 'Plugin System',
        version: '1.0.0',
        instance: PluginSystem,
        status: window.ModuleFramework.MODULE_STATUS.ACTIVE
      });
    }
    
    // Register plugin system API if API Gateway is available
    if (window.ApiGateway) {
      window.ApiGateway.registerApi({
        namespace: 'plugins',
        provider: 'plugin-system',
        version: '1.0.0',
        description: 'Plugin system API',
        methods: {
          getPlugins: {
            handler: function() {
              return getPlugins();
            },
            permissions: ['*'],
            description: 'Get all registered plugins'
          },
          activatePlugin: {
            handler: function(params) {
              return activatePlugin(params.id);
            },
            permissions: ['admin', 'developer'],
            description: 'Activate a plugin',
            schema: {
              required: ['id'],
              properties: {
                id: { type: 'string' }
              }
            }
          },
          deactivatePlugin: {
            handler: function(params) {
              return deactivatePlugin(params.id);
            },
            permissions: ['admin', 'developer'],
            description: 'Deactivate a plugin',
            schema: {
              required: ['id'],
              properties: {
                id: { type: 'string' }
              }
            }
          },
          installPlugin: {
            handler: function(params) {
              return installPlugin(params.id, params.source);
            },
            permissions: ['admin', 'developer'],
            description: 'Install a plugin',
            schema: {
              required: ['id', 'source'],
              properties: {
                id: { type: 'string' },
                source: { type: 'string' }
              }
            }
          },
          uninstallPlugin: {
            handler: function(params) {
              return uninstallPlugin(params.id);
            },
            permissions: ['admin', 'developer'],
            description: 'Uninstall a plugin',
            schema: {
              required: ['id'],
              properties: {
                id: { type: 'string' }
              }
            }
          },
          searchMarketplace: {
            handler: function(params) {
              return searchMarketplace(params.query, params.category, params.page, params.limit);
            },
            permissions: ['*'],
            description: 'Search the plugin marketplace',
            schema: {
              properties: {
                query: { type: 'string' },
                category: { type: 'string' },
                page: { type: 'integer', minimum: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100 }
              }
            }
          }
        }
      });
    }
    
    // Create plugin settings UI
    createPluginSettingsUI();
    
    // Load installed plugins from storage
    loadInstalledPlugins()
      .then(() => {
        console.log('Installed plugins loaded');
        
        // Auto-activate plugins
        Object.values(_plugins).forEach(plugin => {
          if (plugin.autoStart && plugin.status === PLUGIN_STATUS.REGISTERED) {
            activatePlugin(plugin.id)
              .catch(error => {
                console.error(`Error auto-activating plugin ${plugin.id}:`, error);
              });
          }
        });
      })
      .catch(error => {
        console.error('Error loading installed plugins:', error);
      });
    
    // Fetch marketplace data
    fetchMarketplaceData()
      .then(data => {
        _marketplace = data;
        console.log('Plugin marketplace data loaded');
      })
      .catch(error => {
        console.error('Error fetching marketplace data:', error);
      });
    
    _initialized = true;
    console.log('Plugin system initialized');
  }
  
  /**
   * Load installed plugins from storage
   * @returns {Promise} Promise that resolves when plugins are loaded
   */
  function loadInstalledPlugins() {
    return new Promise((resolve, reject) => {
      // Try to get plugins from localStorage
      const savedPlugins = localStorage.getItem('algorithmpress_plugins');
      
      if (!savedPlugins) {
        resolve([]);
        return;
      }
      
      try {
        const pluginData = JSON.parse(savedPlugins);
        
        // Register each plugin
        const promises = pluginData.map(plugin => {
          return registerPlugin(plugin);
        });
        
        Promise.all(promises)
          .then(results => {
            resolve(results.filter(Boolean));
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Save installed plugins to storage
   * @returns {Promise} Promise that resolves when plugins are saved
   */
  function saveInstalledPlugins() {
    return new Promise((resolve, reject) => {
      try {
        // Convert plugins to a serializable format
        const pluginData = Object.values(_plugins).map(plugin => ({
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description,
          author: plugin.author,
          url: plugin.url,
          autoStart: plugin.autoStart,
          hooks: plugin.hooks,
          dependencies: plugin.dependencies,
          settings: plugin.settings
        }));
        
        // Save to localStorage
        localStorage.setItem('algorithmpress_plugins', JSON.stringify(pluginData));
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Fetch marketplace data
   * @returns {Promise} Promise that resolves with marketplace data
   */
  function fetchMarketplaceData() {
    return new Promise((resolve) => {
      // In a real implementation, this would fetch data from the marketplace API
      // For now, we'll use mock data
      setTimeout(() => {
        resolve({
          featured: [
            {
              id: 'export-templates',
              name: 'Export Templates',
              version: '1.2.0',
              description: 'Export your projects as templates to share with others.',
              author: 'AlgorithmPress',
              stars: 4.8,
              downloads: 12500,
              price: 0,
              category: 'utilities'
            },
            {
              id: 'code-formatter',
              name: 'Code Formatter',
              version: '2.0.1',
              description: 'Format your code with various styling options.',
              author: 'DevTools Inc.',
              stars: 4.7,
              downloads: 9800,
              price: 0,
              category: 'development'
            },
            {
              id: 'db-designer',
              name: 'Database Designer',
              version: '1.5.0',
              description: 'Design your database schema visually and generate code.',
              author: 'DataWizards',
              stars: 4.9,
              downloads: 8700,
              price: 4.99,
              category: 'development'
            }
          ],
          categories: [
            { id: 'development', name: 'Development Tools', count: 45 },
            { id: 'utilities', name: 'Utilities', count: 38 },
            { id: 'templates', name: 'Templates', count: 72 },
            { id: 'themes', name: 'Themes', count: 24 },
            { id: 'integrations', name: 'Integrations', count: 19 }
          ],
          latest: [
            {
              id: 'performance-analyzer',
              name: 'Performance Analyzer',
              version: '1.0.0',
              description: 'Analyze the performance of your PHP code.',
              author: 'OptimizeWare',
              stars: 4.5,
              downloads: 1200,
              price: 0,
              category: 'development'
            },
            {
              id: 'api-generator',
              name: 'API Generator',
              version: '1.1.0',
              description: 'Generate RESTful API endpoints from your data models.',
              author: 'APIWizard',
              stars: 4.6,
              downloads: 2300,
              price: 2.99,
              category: 'development'
            }
          ]
        });
      }, 500);
    });
  }
  
  /**
   * Search the plugin marketplace
   * @param {string} query - Search query
   * @param {string} category - Category filter
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise} Promise that resolves with search results
   */
  function searchMarketplace(query = '', category = '', page = 1, limit = 10) {
    return new Promise((resolve) => {
      // In a real implementation, this would search the marketplace API
      // For now, we'll use mock data
      setTimeout(() => {
        // Get all plugins from marketplace
        const allPlugins = [
          ..._marketplace.featured,
          ..._marketplace.latest
        ];
        
        // Filter by query and category
        let results = allPlugins;
        
        if (query) {
          const lowerQuery = query.toLowerCase();
          results = results.filter(plugin => 
            plugin.name.toLowerCase().includes(lowerQuery) ||
            plugin.description.toLowerCase().includes(lowerQuery) ||
            plugin.author.toLowerCase().includes(lowerQuery)
          );
        }
        
        if (category) {
          results = results.filter(plugin => plugin.category === category);
        }
        
        // Calculate pagination
        const total = results.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedResults = results.slice(offset, offset + limit);
        
        resolve({
          results: paginatedResults,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        });
      }, 300);
    });
  }
  
  /**
   * Register a plugin
   * @param {Object} plugin - Plugin configuration
   * @returns {Promise} Promise that resolves when plugin is registered
   */
  function registerPlugin(plugin) {
    return new Promise((resolve, reject) => {
      // Validate plugin
      if (!plugin || !plugin.id || !plugin.name) {
        reject(new Error('Invalid plugin configuration'));
        return;
      }
      
      // Check if plugin is already registered
      if (_plugins[plugin.id]) {
        resolve(_plugins[plugin.id]);
        return;
      }
      
      // Check plugin limit
      if (Object.keys(_plugins).length >= _options.maxPlugins) {
        reject(new Error(`Plugin limit reached (${_options.maxPlugins})`));
        return;
      }
      
      // Default configuration
      const defaultConfig = {
        version: '1.0.0',
        description: '',
        author: 'Unknown',
        url: '',
        autoStart: false,
        status: PLUGIN_STATUS.REGISTERED,
        hooks: {},
        dependencies: [],
        settings: {}
      };
      
      // Create plugin object
      const pluginObj = {
        ...defaultConfig,
        ...plugin,
        registeredAt: Date.now()
      };
      
      // Register plugin
      _plugins[plugin.id] = pluginObj;
      
      // Register hooks
      if (pluginObj.hooks) {
        Object.keys(pluginObj.hooks).forEach(hook => {
          registerHook(hook, plugin.id, pluginObj.hooks[hook]);
        });
      }
      
      console.log(`Plugin ${plugin.name} (${plugin.id}) registered`);
      
      // Save installed plugins
      saveInstalledPlugins()
        .then(() => {
          resolve(pluginObj);
        })
        .catch(error => {
          console.error('Error saving plugins:', error);
          resolve(pluginObj);
        });
    });
  }
  
  /**
   * Register a hook
   * @param {string} hookName - Hook name
   * @param {string} pluginId - Plugin ID
   * @param {Function} callback - Hook callback
   */
  function registerHook(hookName, pluginId, callback) {
    if (!_hooks[hookName]) {
      _hooks[hookName] = [];
    }
    
    // Check if hook is already registered
    const existingHook = _hooks[hookName].find(h => h.pluginId === pluginId);
    
    if (existingHook) {
      // Replace existing hook
      existingHook.callback = callback;
    } else {
      // Add new hook
      _hooks[hookName].push({
        pluginId,
        callback,
        registeredAt: Date.now()
      });
    }
  }
  
  /**
   * Unregister hooks for a plugin
   * @param {string} pluginId - Plugin ID
   */
  function unregisterHooks(pluginId) {
    Object.keys(_hooks).forEach(hookName => {
      _hooks[hookName] = _hooks[hookName].filter(hook => hook.pluginId !== pluginId);
      
      // Remove empty hook arrays
      if (_hooks[hookName].length === 0) {
        delete _hooks[hookName];
      }
    });
  }
  
  /**
   * Apply hooks
   * @param {string} hookName - Hook name
   * @param {*} data - Hook data
   * @returns {Promise} Promise that resolves with modified data
   */
  function applyHooks(hookName, data) {
    return new Promise((resolve) => {
      if (!_hooks[hookName] || _hooks[hookName].length === 0) {
        resolve(data);
        return;
      }
      
      // Sort hooks by registration time
      const sortedHooks = [..._hooks[hookName]].sort((a, b) => a.registeredAt - b.registeredAt);
      
      // Apply hooks sequentially
      let result = data;
      let hookIndex = 0;
      
      function applyNextHook() {
        if (hookIndex >= sortedHooks.length) {
          resolve(result);
          return;
        }
        
        const hook = sortedHooks[hookIndex++];
        
        try {
          const hookResult = hook.callback(result);
          
          // Handle async hook results
          if (hookResult && typeof hookResult.then === 'function') {
            hookResult
              .then(newResult => {
                result = newResult;
                applyNextHook();
              })
              .catch(error => {
                console.error(`Error in hook ${hookName} from plugin ${hook.pluginId}:`, error);
                applyNextHook();
              });
          } else {
            result = hookResult !== undefined ? hookResult : result;
            applyNextHook();
          }
        } catch (error) {
          console.error(`Error in hook ${hookName} from plugin ${hook.pluginId}:`, error);
          applyNextHook();
        }
      }
      
      applyNextHook();
    });
  }
  
  /**
   * Activate a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Promise} Promise that resolves when plugin is activated
   */
  function activatePlugin(pluginId) {
    return new Promise((resolve, reject) => {
      const plugin = _plugins[pluginId];
      
      if (!plugin) {
        reject(new Error(`Plugin ${pluginId} not found`));
        return;
      }
      
      if (plugin.status === PLUGIN_STATUS.ACTIVE) {
        resolve(plugin);
        return;
      }
      
      // Check dependencies
      if (plugin.dependencies && plugin.dependencies.length > 0) {
        const missingDeps = plugin.dependencies.filter(dep => {
          return !_plugins[dep] || _plugins[dep].status !== PLUGIN_STATUS.ACTIVE;
        });
        
        if (missingDeps.length > 0) {
          reject(new Error(`Missing dependencies: ${missingDeps.join(', ')}`));
          return;
        }
      }
      
      // Update plugin status
      plugin.status = PLUGIN_STATUS.ACTIVE;
      
      // Load plugin script if specified
      if (plugin.script && !plugin.loaded) {
        loadPluginScript(plugin)
          .then(() => {
            plugin.loaded = true;
            
            // Initialize plugin if it has a initializer
            if (window[pluginId] && typeof window[pluginId].initialize === 'function') {
              try {
                const initResult = window[pluginId].initialize(plugin.settings);
                
                // Handle async initialization
                if (initResult && typeof initResult.then === 'function') {
                  initResult
                    .then(() => {
                      console.log(`Plugin ${plugin.name} (${pluginId}) activated`);
                      resolve(plugin);
                    })
                    .catch(error => {
                      plugin.status = PLUGIN_STATUS.ERROR;
                      plugin.error = error;
                      reject(error);
                    });
                } else {
                  console.log(`Plugin ${plugin.name} (${pluginId}) activated`);
                  resolve(plugin);
                }
              } catch (error) {
                plugin.status = PLUGIN_STATUS.ERROR;
                plugin.error = error;
                reject(error);
              }
            } else {
              console.log(`Plugin ${plugin.name} (${pluginId}) activated`);
              resolve(plugin);
            }
          })
          .catch(error => {
            plugin.status = PLUGIN_STATUS.ERROR;
            plugin.error = error;
            reject(error);
          });
      } else {
        console.log(`Plugin ${plugin.name} (${pluginId}) activated`);
        resolve(plugin);
      }
    });
  }
  
  /**
   * Load a plugin script
   * @param {Object} plugin - Plugin object
   * @returns {Promise} Promise that resolves when script is loaded
   */
  function loadPluginScript(plugin) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = plugin.script;
      script.async = true;
      
      script.onload = function() {
        resolve();
      };
      
      script.onerror = function() {
        reject(new Error(`Failed to load plugin script: ${plugin.script}`));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Deactivate a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Promise} Promise that resolves when plugin is deactivated
   */
  function deactivatePlugin(pluginId) {
    return new Promise((resolve, reject) => {
      const plugin = _plugins[pluginId];
      
      if (!plugin) {
        reject(new Error(`Plugin ${pluginId} not found`));
        return;
      }
      
      if (plugin.status !== PLUGIN_STATUS.ACTIVE) {
        resolve(plugin);
        return;
      }
      
      // Check if any plugins depend on this one
      const dependents = Object.values(_plugins).filter(p => 
        p.dependencies && 
        p.dependencies.includes(pluginId) && 
        p.status === PLUGIN_STATUS.ACTIVE
      );
      
      if (dependents.length > 0) {
        reject(new Error(`Cannot deactivate plugin because it is required by: ${dependents.map(p => p.name).join(', ')}`));
        return;
      }
      
      // Call deactivate method if available
      if (window[pluginId] && typeof window[pluginId].deactivate === 'function') {
        try {
          const deactivateResult = window[pluginId].deactivate();
          
          // Handle async deactivation
          if (deactivateResult && typeof deactivateResult.then === 'function') {
            deactivateResult
              .then(() => {
                plugin.status = PLUGIN_STATUS.INACTIVE;
                console.log(`Plugin ${plugin.name} (${pluginId}) deactivated`);
                resolve(plugin);
              })
              .catch(error => {
                reject(error);
              });
          } else {
            plugin.status = PLUGIN_STATUS.INACTIVE;
            console.log(`Plugin ${plugin.name} (${pluginId}) deactivated`);
            resolve(plugin);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        plugin.status = PLUGIN_STATUS.INACTIVE;
        console.log(`Plugin ${plugin.name} (${pluginId}) deactivated`);
        resolve(plugin);
      }
    });
  }
  
  /**
   * Install a plugin
   * @param {string} pluginId - Plugin ID
   * @param {string} source - Plugin source URL
   * @returns {Promise} Promise that resolves when plugin is installed
   */
  function installPlugin(pluginId, source) {
    return new Promise((resolve, reject) => {
      // Check if plugin is already installed
      if (_plugins[pluginId]) {
        reject(new Error(`Plugin ${pluginId} is already installed`));
        return;
      }
      
      // In a real implementation, this would download and verify the plugin
      // For now, we'll use mock data
      const pluginData = {
        id: pluginId,
        name: pluginId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        version: '1.0.0',
        description: 'A plugin for AlgorithmPress',
        author: 'Plugin Developer',
        url: source,
        script: source,
        autoStart: false,
        hooks: {},
        dependencies: []
      };
      
      // Register plugin
      registerPlugin(pluginData)
        .then(plugin => {
          console.log(`Plugin ${plugin.name} (${pluginId}) installed`);
          resolve(plugin);
        })
        .catch(reject);
    });
  }
  
  /**
   * Uninstall a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Promise} Promise that resolves when plugin is uninstalled
   */
  function uninstallPlugin(pluginId) {
    return new Promise((resolve, reject) => {
      const plugin = _plugins[pluginId];
      
      if (!plugin) {
        reject(new Error(`Plugin ${pluginId} not found`));
        return;
      }
      
      // Deactivate plugin first if active
      if (plugin.status === PLUGIN_STATUS.ACTIVE) {
        deactivatePlugin(pluginId)
          .then(() => {
            // Remove plugin
            delete _plugins[pluginId];
            
            // Unregister hooks
            unregisterHooks(pluginId);
            
            // Save changes
            saveInstalledPlugins()
              .then(() => {
                console.log(`Plugin ${plugin.name} (${pluginId}) uninstalled`);
                resolve({ success: true });
              })
              .catch(error => {
                console.error('Error saving plugins:', error);
                resolve({ success: true });
              });
          })
          .catch(reject);
      } else {
        // Remove plugin
        delete _plugins[pluginId];
        
        // Unregister hooks
        unregisterHooks(pluginId);
        
        // Save changes
        saveInstalledPlugins()
          .then(() => {
            console.log(`Plugin ${plugin.name} (${pluginId}) uninstalled`);
            resolve({ success: true });
          })
          .catch(error => {
            console.error('Error saving plugins:', error);
            resolve({ success: true });
          });
      }
    });
  }
  
  /**
   * Get all plugins
   * @param {Object} filters - Plugin filters
   * @returns {Array} Array of plugins
   */
  function getPlugins(filters = {}) {
    let plugins = Object.values(_plugins);
    
    // Apply filters
    if (filters.status) {
      plugins = plugins.filter(plugin => plugin.status === filters.status);
    }
    
    if (filters.author) {
      plugins = plugins.filter(plugin => plugin.author === filters.author);
    }
    
    if (filters.dependency) {
      plugins = plugins.filter(plugin => 
        plugin.dependencies && plugin.dependencies.includes(filters.dependency)
      );
    }
    
    // Sort plugins by name
    plugins.sort((a, b) => a.name.localeCompare(b.name));
    
    return plugins;
  }
  
  /**
   * Create plugin settings UI
   */
  function createPluginSettingsUI() {
    // Create plugin settings panel if not exists
    const existingPanel = document.getElementById('plugins-panel');
    if (existingPanel) return;
    
    const panel = document.createElement('div');
    panel.id = 'plugins-panel';
    panel.className = 'system-panel plugins-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Plugins</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="plugins-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="plugins-content">
          <div class="plugins-tabs">
            <button class="plugins-tab active" data-tab="installed">Installed</button>
            <button class="plugins-tab" data-tab="marketplace">Marketplace</button>
            <button class="plugins-tab" data-tab="settings">Settings</button>
          </div>
          
          <div class="plugins-tab-panels">
            <div class="plugins-tab-panel active" id="installed-plugins-panel">
              <div class="plugins-toolbar">
                <button class="btn btn-sm btn-primary" id="refresh-plugins-btn">
                  <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button class="btn btn-sm btn-success" id="install-plugin-btn">
                  <i class="fas fa-plus"></i> Install from URL
                </button>
              </div>
              
              <div class="plugins-list" id="installed-plugins-list">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Loading plugins...</span>
                </div>
              </div>
            </div>
            
            <div class="plugins-tab-panel" id="marketplace-plugins-panel">
              <div class="marketplace-header">
                <div class="search-box">
                  <input type="text" id="plugin-search" class="form-control" placeholder="Search plugins...">
                  <button class="btn btn-primary" id="plugin-search-btn">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
                <div class="category-filter">
                  <select id="category-filter" class="form-select">
                    <option value="">All Categories</option>
                  </select>
                </div>
              </div>
              
              <div class="featured-plugins">
                <h3>Featured Plugins</h3>
                <div class="featured-plugins-grid" id="featured-plugins-grid">
                  <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading featured plugins...</span>
                  </div>
                </div>
              </div>
              
              <div class="marketplace-plugins">
                <h3>All Plugins</h3>
                <div class="marketplace-plugins-list" id="marketplace-plugins-list">
                  <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading marketplace plugins...</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="plugins-tab-panel" id="plugins-settings-panel">
              <h3>Plugin System Settings</h3>
              <div class="settings-group">
                <div class="form-check">
                  <input type="checkbox" id="allow-unsigned-plugins" class="form-check-input">
                  <label for="allow-unsigned-plugins" class="form-check-label">
                    Allow unsigned plugins (not recommended)
                  </label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="automatic-updates" class="form-check-input" checked>
                  <label for="automatic-updates" class="form-check-label">
                    Enable automatic updates
                  </label>
                </div>
                <div class="form-group">
                  <label for="marketplace-url" class="form-label">Marketplace URL</label>
                  <input type="text" id="marketplace-url" class="form-control" value="${_options.marketplaceUrl}">
                </div>
                <div class="form-group">
                  <label for="max-plugins" class="form-label">Maximum number of plugins</label>
                  <input type="number" id="max-plugins" class="form-control" value="${_options.maxPlugins}" min="1" max="100">
                </div>
              </div>
              <div class="plugin-actions">
                <button id="save-plugin-settings-btn" class="btn btn-primary">Save Settings</button>
                <button id="reset-plugin-settings-btn" class="btn btn-secondary">Reset to Defaults</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners
    document.getElementById('plugins-close-btn')?.addEventListener('click', function() {
      document.getElementById('plugins-panel').classList.add('hidden');
    });
    
    // Add tabs functionality
    const pluginsTabs = document.querySelectorAll('.plugins-tab');
    pluginsTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        pluginsTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding panel
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.plugins-tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-plugins-panel`).classList.add('active');
        
        // Load content for the selected tab
        if (tabId === 'marketplace' && !_marketplace) {
          fetchMarketplaceData()
            .then(data => {
              _marketplace = data;
              updateMarketplaceUI();
            })
            .catch(error => {
              console.error('Error fetching marketplace data:', error);
            });
        }
      });
    });
    
    // Add settings save event listener
    document.getElementById('save-plugin-settings-btn')?.addEventListener('click', function() {
      // Get settings
      const allowUnsignedPlugins = document.getElementById('allow-unsigned-plugins').checked;
      const automaticUpdates = document.getElementById('automatic-updates').checked;
      const marketplaceUrl = document.getElementById('marketplace-url').value;
      const maxPlugins = parseInt(document.getElementById('max-plugins').value);
      
      // Update options
      _options.allowUnsignedPlugins = allowUnsignedPlugins;
      _options.automaticUpdates = automaticUpdates;
      _options.marketplaceUrl = marketplaceUrl;
      _options.maxPlugins = maxPlugins;
      
      // Save options to localStorage
      localStorage.setItem('algorithmpress_plugin_options', JSON.stringify(_options));
      
      showToast('success', 'Plugin settings saved');
    });
    
    // Install plugin button
    document.getElementById('install-plugin-btn')?.addEventListener('click', function() {
      const url = prompt('Enter plugin URL:');
      
      if (!url) return;
      
      const pluginId = url.split('/').pop().replace(/\.js$/, '');
      
      installPlugin(pluginId, url)
        .then(() => {
          showToast('success', 'Plugin installed successfully');
          updateInstalledPluginsUI();
        })
        .catch(error => {
          showToast('error', 'Error installing plugin: ' + error.message);
        });
    });
    
    // Refresh plugins button
    document.getElementById('refresh-plugins-btn')?.addEventListener('click', function() {
      updateInstalledPluginsUI();
      showToast('info', 'Plugins refreshed');
    });
    
    // Initialize UI
    updateInstalledPluginsUI();
    
    // Add dock button if available
    addPluginsDockButton();
  }
  
  /**
   * Update installed plugins UI
   */
  function updateInstalledPluginsUI() {
    const pluginsList = document.getElementById('installed-plugins-list');
    
    if (!pluginsList) return;
    
    // Get installed plugins
    const plugins = getPlugins();
    
    if (plugins.length === 0) {
      pluginsList.innerHTML = `
        <div class="no-plugins">
          <i class="fas fa-puzzle-piece"></i>
          <p>No plugins installed</p>
          <button class="btn btn-primary btn-sm" id="browse-marketplace-btn">
            Browse Marketplace
          </button>
        </div>
      `;
      
      document.getElementById('browse-marketplace-btn')?.addEventListener('click', function() {
        // Switch to marketplace tab
        document.querySelector('.plugins-tab[data-tab="marketplace"]').click();
      });
      
      return;
    }
    
    // Build plugins list
    let html = '';
    
    plugins.forEach(plugin => {
      const isActive = plugin.status === PLUGIN_STATUS.ACTIVE;
      
      html += `
        <div class="plugin-item ${isActive ? 'active' : ''}">
          <div class="plugin-info">
            <h4>${plugin.name}</h4>
            <p>${plugin.description}</p>
            <div class="plugin-meta">
              <span class="plugin-version"><i class="fas fa-code-branch"></i> ${plugin.version}</span>
              <span class="plugin-author"><i class="fas fa-user"></i> ${plugin.author}</span>
            </div>
          </div>
          <div class="plugin-actions">
            <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'} toggle-plugin-btn" 
                    data-plugin-id="${plugin.id}" data-action="${isActive ? 'deactivate' : 'activate'}">
              ${isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button class="btn btn-sm btn-danger uninstall-plugin-btn" data-plugin-id="${plugin.id}">
              Uninstall
            </button>
          </div>
        </div>
      `;
    });
    
    pluginsList.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.toggle-plugin-btn').forEach(button => {
      button.addEventListener('click', function() {
        const pluginId = this.getAttribute('data-plugin-id');
        const action = this.getAttribute('data-action');
        
        if (action === 'activate') {
          activatePlugin(pluginId)
            .then(() => {
              updateInstalledPluginsUI();
              showToast('success', 'Plugin activated');
            })
            .catch(error => {
              showToast('error', 'Error activating plugin: ' + error.message);
            });
        } else {
          deactivatePlugin(pluginId)
            .then(() => {
              updateInstalledPluginsUI();
              showToast('success', 'Plugin deactivated');
            })
            .catch(error => {
              showToast('error', 'Error deactivating plugin: ' + error.message);
            });
        }
      });
    });
    
    document.querySelectorAll('.uninstall-plugin-btn').forEach(button => {
      button.addEventListener('click', function() {
        const pluginId = this.getAttribute('data-plugin-id');
        
        if (confirm(`Are you sure you want to uninstall the ${_plugins[pluginId].name} plugin?`)) {
          uninstallPlugin(pluginId)
            .then(() => {
              updateInstalledPluginsUI();
              showToast('success', 'Plugin uninstalled');
            })
            .catch(error => {
              showToast('error', 'Error uninstalling plugin: ' + error.message);
            });
        }
      });
    });
  }
  
  /**
   * Update marketplace UI
   */
  function updateMarketplaceUI() {
    if (!_marketplace) return;
    
    // Update category filter
    const categoryFilter = document.getElementById('category-filter');
    
    if (categoryFilter) {
      let html = '<option value="">All Categories</option>';
      
      _marketplace.categories.forEach(category => {
        html += `<option value="${category.id}">${category.name} (${category.count})</option>`;
      });
      
      categoryFilter.innerHTML = html;
    }
    
    // Update featured plugins
    const featuredGrid = document.getElementById('featured-plugins-grid');
    
    if (featuredGrid) {
      let html = '';
      
      _marketplace.featured.forEach(plugin => {
        const isInstalled = !!_plugins[plugin.id];
        
        html += `
          <div class="featured-plugin-card">
            <h4>${plugin.name}</h4>
            <p>${plugin.description}</p>
            <div class="plugin-meta">
              <span class="plugin-version"><i class="fas fa-code-branch"></i> ${plugin.version}</span>
              <span class="plugin-author"><i class="fas fa-user"></i> ${plugin.author}</span>
              <span class="plugin-rating"><i class="fas fa-star"></i> ${plugin.stars}</span>
              <span class="plugin-downloads"><i class="fas fa-download"></i> ${plugin.downloads}</span>
            </div>
            <div class="plugin-actions">
              <button class="btn btn-sm ${isInstalled ? 'btn-secondary disabled' : 'btn-primary'} install-marketplace-plugin-btn"
                      data-plugin-id="${plugin.id}" ${isInstalled ? 'disabled' : ''}>
                ${isInstalled ? 'Installed' : plugin.price > 0 ? `$${plugin.price.toFixed(2)}` : 'Install'}
              </button>
            </div>
          </div>
        `;
      });
      
      featuredGrid.innerHTML = html;
    }
    
    // Update all plugins list
    const marketplaceList = document.getElementById('marketplace-plugins-list');
    
    if (marketplaceList) {
      let html = '';
      
      const allPlugins = [
        ..._marketplace.featured,
        ..._marketplace.latest
      ];
      
      allPlugins.forEach(plugin => {
        const isInstalled = !!_plugins[plugin.id];
        
        html += `
          <div class="marketplace-plugin-item">
            <div class="plugin-info">
              <h4>${plugin.name}</h4>
              <p>${plugin.description}</p>
              <div class="plugin-meta">
                <span class="plugin-version"><i class="fas fa-code-branch"></i> ${plugin.version}</span>
                <span class="plugin-author"><i class="fas fa-user"></i> ${plugin.author}</span>
                <span class="plugin-rating"><i class="fas fa-star"></i> ${plugin.stars}</span>
                <span class="plugin-downloads"><i class="fas fa-download"></i> ${plugin.downloads}</span>
                <span class="plugin-category"><i class="fas fa-tag"></i> ${plugin.category}</span>
              </div>
            </div>
            <div class="plugin-actions">
              <button class="btn ${isInstalled ? 'btn-secondary disabled' : 'btn-primary'} install-marketplace-plugin-btn"
                      data-plugin-id="${plugin.id}" ${isInstalled ? 'disabled' : ''}>
                ${isInstalled ? 'Installed' : plugin.price > 0 ? `$${plugin.price.toFixed(2)}` : 'Install'}
              </button>
            </div>
          </div>
        `;
      });
      
      marketplaceList.innerHTML = html;
    }
    
    // Add event listeners to install buttons
    document.querySelectorAll('.install-marketplace-plugin-btn').forEach(button => {
      if (button.disabled) return;
      
      button.addEventListener('click', function() {
        const pluginId = this.getAttribute('data-plugin-id');
        const plugin = [..._marketplace.featured, ..._marketplace.latest].find(p => p.id === pluginId);
        
        if (plugin.price > 0) {
          showToast('info', `This plugin costs $${plugin.price.toFixed(2)}. Purchase through the marketplace website.`);
          return;
        }
        
        const mockUrl = `https://plugins.algorithmpress.com/plugins/${pluginId}/${pluginId}.js`;
        
        installPlugin(pluginId, mockUrl)
          .then(() => {
            updateMarketplaceUI();
            updateInstalledPluginsUI();
            showToast('success', 'Plugin installed successfully');
          })
          .catch(error => {
            showToast('error', 'Error installing plugin: ' + error.message);
          });
      });
    });
    
    // Add search functionality
    document.getElementById('plugin-search-btn')?.addEventListener('click', function() {
      const query = document.getElementById('plugin-search').value;
      const category = document.getElementById('category-filter').value;
      
      searchMarketplace(query, category)
        .then(results => {
          // Update marketplace list with search results
          const marketplaceList = document.getElementById('marketplace-plugins-list');
          
          if (!marketplaceList) return;
          
          if (results.results.length === 0) {
            marketplaceList.innerHTML = `
              <div class="no-plugins">
                <i class="fas fa-search"></i>
                <p>No plugins found for "${query}"</p>
              </div>
            `;
            return;
          }
          
          let html = '';
          
          results.results.forEach(plugin => {
            const isInstalled = !!_plugins[plugin.id];
            
            html += `
              <div class="marketplace-plugin-item">
                <div class="plugin-info">
                  <h4>${plugin.name}</h4>
                  <p>${plugin.description}</p>
                  <div class="plugin-meta">
                    <span class="plugin-version"><i class="fas fa-code-branch"></i> ${plugin.version}</span>
                    <span class="plugin-author"><i class="fas fa-user"></i> ${plugin.author}</span>
                    <span class="plugin-rating"><i class="fas fa-star"></i> ${plugin.stars}</span>
                    <span class="plugin-downloads"><i class="fas fa-download"></i> ${plugin.downloads}</span>
                    <span class="plugin-category"><i class="fas fa-tag"></i> ${plugin.category}</span>
                  </div>
                </div>
                <div class="plugin-actions">
                  <button class="btn ${isInstalled ? 'btn-secondary disabled' : 'btn-primary'} install-marketplace-plugin-btn"
                          data-plugin-id="${plugin.id}" ${isInstalled ? 'disabled' : ''}>
                    ${isInstalled ? 'Installed' : plugin.price > 0 ? `$${plugin.price.toFixed(2)}` : 'Install'}
                  </button>
                </div>
              </div>
            `;
          });
          
          marketplaceList.innerHTML = html;
          
          // Re-add event listeners
          document.querySelectorAll('.install-marketplace-plugin-btn').forEach(button => {
            if (button.disabled) return;
            
            button.addEventListener('click', function() {
              const pluginId = this.getAttribute('data-plugin-id');
              const plugin = results.results.find(p => p.id === pluginId);
              
              if (plugin.price > 0) {
                showToast('info', `This plugin costs $${plugin.price.toFixed(2)}. Purchase through the marketplace website.`);
                return;
              }
              
              const mockUrl = `https://plugins.algorithmpress.com/plugins/${pluginId}/${pluginId}.js`;
              
              installPlugin(pluginId, mockUrl)
                .then(() => {
                  updateMarketplaceUI();
                  updateInstalledPluginsUI();
                  showToast('success', 'Plugin installed successfully');
                })
                .catch(error => {
                  showToast('error', 'Error installing plugin: ' + error.message);
                });
            });
          });
        })
        .catch(error => {
          console.error('Error searching marketplace:', error);
        });
    });
  }
  
  /**
   * Add plugins dock button
   */
  function addPluginsDockButton() {
    // Check if button already exists
    if (document.getElementById('plugins-dock-btn')) return;
    
    // Create plugins dock button
    const dockContainer = document.querySelector('.dock-container');
    
    if (!dockContainer) return;
    
    const pluginsButton = document.createElement('button');
    pluginsButton.id = 'plugins-dock-btn';
    pluginsButton.className = 'dock-button';
    pluginsButton.title = 'Plugins';
    
    pluginsButton.innerHTML = `
      <i class="fas fa-puzzle-piece"></i>
      <span class="dock-button-label">Plugins</span>
    `;
    
    dockContainer.appendChild(pluginsButton);
    
    // Add click event
    pluginsButton.addEventListener('click', function() {
      const panel = document.getElementById('plugins-panel');
      
      if (panel) {
        // Hide all other panels first
        document.querySelectorAll('.system-panel').forEach(p => {
          p.classList.add('hidden');
        });
        
        // Show plugins panel
        panel.classList.remove('hidden');
        
        // Update UI
        updateInstalledPluginsUI();
      }
    });
  }
  
  /**
   * Show a toast notification
   * @param {string} type - Toast type (success, info, warning, error)
   * @param {string} message - Toast message
   */
  function showToast(type, message) {
    // Check if function exists in the global scope
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
      return;
    }
    
    console.log(`${type}: ${message}`);
  }
  
  // Public API
  return {
    initialize,
    registerPlugin,
    registerHook,
    applyHooks,
    activatePlugin,
    deactivatePlugin,
    installPlugin,
    uninstallPlugin,
    getPlugins,
    searchMarketplace,
    PLUGIN_STATUS
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  PluginSystem.initialize();
});

// Export plugin system to global scope
window.PluginSystem = PluginSystem;
