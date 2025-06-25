/**
 * AlgorithmPress Module Integration Framework
/**
 * AlgorithmPress Module Integration Framework
 * Creates a standardized system for module registration, discovery, and integration
 */
// console.log('[ModuleFramework] Script start'); // Removed

const ModuleFramework = (function() {
  'use strict';
  // console.log('[ModuleFramework] IIFE start'); // Removed
  
  // Private module registry
  const _modules = {};
  
  // Event bus for inter-module communication
  const _eventBus = createEventBus();
  
  // Module statuses
  const MODULE_STATUS = {
    REGISTERED: 'registered',
    LOADING: 'loading',
    ACTIVE: 'active',
    ERROR: 'error',
    DISABLED: 'disabled'
  };
  
  /**
   * Create a simple event bus for pub/sub communication
   * @returns {Object} Event bus object
   */
  function createEventBus() {
    const events = {};
    
    return {
      /**
       * Subscribe to an event
       * @param {string} event - Event name
       * @param {Function} callback - Event callback
       * @returns {Function} Unsubscribe function
       */
      subscribe: function(event, callback) {
        if (!events[event]) {
          events[event] = [];
        }
        
        events[event].push(callback);
        
        // Return unsubscribe function
        return function() {
          events[event] = events[event].filter(cb => cb !== callback);
        };
      },
      
      /**
       * Publish an event
       * @param {string} event - Event name
       * @param {*} data - Event data
       */
      publish: function(event, data) {
        if (!events[event]) {
          return;
        }
        
        events[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`[ModuleFramework] Error in event handler for ${event}:`, error); // Keep critical error
          }
        });
      },
      
      /**
       * Clear all event handlers
       */
      clear: function() {
        Object.keys(events).forEach(event => {
          events[event] = [];
        });
      }
    };
  }
  
  /**
   * Register a module with the framework
   * @param {Object} moduleConfig - Module configuration
   * @returns {boolean} Success status
   */
  function registerModule(moduleConfig) {
    // Validate module configuration
    if (!moduleConfig || !moduleConfig.id || !moduleConfig.name) {
      console.error('[ModuleFramework] Invalid module configuration:', moduleConfig); // Keep critical error
      return false;
    }
    
    // Check if module is already registered
    if (_modules[moduleConfig.id]) {
      const warnMsg = `[ModuleFramework] Module ${moduleConfig.id} is already registered. Skipping.`;
      window.debugLog(warnMsg);
      // Potentially keep as a console.warn if this indicates a problem in non-debug scenarios.
      if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) console.warn(warnMsg);
      return false;
    }
    
    // Default configuration
    const defaultConfig = {
      version: '1.0.0',
      dependencies: [],
      autoStart: false,
      status: MODULE_STATUS.REGISTERED,
      permissions: [],
      settings: {},
      api: {}
    };
    
    // Merge with default configuration
    const module = {
      ...defaultConfig,
      ...moduleConfig,
      loadTime: null,
      initTime: null,
      instance: null
    };
    
    // Register module
    _modules[module.id] = module;
    
    window.debugLog(`[ModuleFramework] Module ${module.name} (${module.id}) registered.`);
    
    // Publish registration event
    _eventBus.publish('module:registered', {
      id: module.id,
      name: module.name,
      version: module.version
    });
    
    // Auto-start module if configured
    if (module.autoStart) {
      setTimeout(() => {
        loadModule(module.id);
      }, 0);
    }
    
    return true;
  }
  
  /**
   * Load a module
   * @param {string} moduleId - Module ID
   * @returns {Promise} Promise that resolves when module is loaded
   */
  function loadModule(moduleId) {
    return new Promise((resolve, reject) => {
      const module = _modules[moduleId];
      
      if (!module) {
        reject(new Error(`Module ${moduleId} not found`));
        return;
      }
      
      if (module.status === MODULE_STATUS.ACTIVE) {
        resolve(module.instance);
        return;
      }
      
      if (module.status === MODULE_STATUS.LOADING) {
        // Wait for module to finish loading
        const unsubscribe = _eventBus.subscribe('module:loaded', data => {
          if (data.id === moduleId) {
            unsubscribe();
            resolve(module.instance);
          }
        });
        return;
      }
      
      // Update module status
      module.status = MODULE_STATUS.LOADING;
      
      // Load dependencies first
      const dependencyPromises = (module.dependencies || []).map(depId => {
        return loadModule(depId);
      });
      
      // Start loading timestamp
      const startTime = performance.now();
      
      Promise.all(dependencyPromises)
        .then(() => {
          // Check if module has a loader function
          if (typeof module.loader === 'function') {
            return module.loader();
          } else if (typeof window[moduleId] !== 'undefined') {
            // Module is already loaded in global scope
            return window[moduleId];
          } else if (module.url) {
            // Load module from URL
            return loadModuleFromUrl(module.url);
          } else {
            throw new Error(`No loader defined for module ${moduleId}`);
          }
        })
        .then(instance => {
          // Store module instance
          module.instance = instance;
          
          // Calculate load time
          module.loadTime = performance.now() - startTime;
          
          // Update module status
          module.status = MODULE_STATUS.ACTIVE;
          
          // Initialize module if it has an initialize method
          if (instance && typeof instance.initialize === 'function') {
            const initStartTime = performance.now();
            
            return instance.initialize()
              .then(() => {
                module.initTime = performance.now() - initStartTime;
                return instance;
              });
          }
          
          return instance;
        })
        .then(instance => {
          // Publish loaded event
          _eventBus.publish('module:loaded', {
            id: moduleId,
            name: module.name,
            instance
          });
          
          window.debugLog(`Module ${module.name} (${moduleId}) loaded successfully in ${module.loadTime.toFixed(2)}ms`);
          
          resolve(instance);
        })
        .catch(error => {
          // Update module status
          module.status = MODULE_STATUS.ERROR;
          module.error = error;
          
          // Publish error event
          _eventBus.publish('module:error', {
            id: moduleId,
            name: module.name,
            error
          });
          
          console.error(`[ModuleFramework] Failed to load module ${module.name} (${moduleId}):`, error); // Keep critical error
          
          reject(error);
        });
    });
  }
  
  /**
   * Load a module from URL
   * @param {string} url - Module URL
   * @returns {Promise} Promise that resolves when module is loaded
   */
  function loadModuleFromUrl(url) {
    return new Promise((resolve, reject) => {
      // Check if URL is a JavaScript file
      if (url.endsWith('.js')) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        // TODO: For production, implement Subresource Integrity (SRI) here.
        // This requires knowing the hash of the script content beforehand.
        // If module URLs are fixed and known at build time, their hashes could be
        // stored (e.g., in module registration data or a separate manifest) and applied here.
        // Example: if (module.sriHash) { script.integrity = module.sriHash; script.crossOrigin = "anonymous"; }
        // If URLs are fully dynamic or user-provided, SRI is not practically enforceable here
        // without a trusted external mechanism to verify content and provide hashes.
        
        script.onload = function() {
          // Ensure the module is actually available if it's expected to register itself globally
          // This depends on module design. For now, we assume simple script load is enough.
          resolve();
        };
        
        script.onerror = function() {
          reject(new Error(`Failed to load script from ${url}`));
        };
        
        document.head.appendChild(script);
      } else if (url.endsWith('.css')) {
        // Load CSS file
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        
        link.onload = function() {
          resolve();
        };
        
        link.onerror = function() {
          reject(new Error(`Failed to load CSS from ${url}`));
        };
        
        document.head.appendChild(link);
      } else {
        // Load module using fetch
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              return response.json();
            } else {
              return response.text();
            }
          })
          .then(data => {
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }
  
  /**
   * Unload a module
   * @param {string} moduleId - Module ID
   * @returns {boolean} Success status
   */
  function unloadModule(moduleId) {
    const module = _modules[moduleId];
    
    if (!module) {
      window.debugLog(`[ModuleFramework] Warning: Module ${moduleId} not found for unloading.`);
      return false;
    }
    
    if (module.status !== MODULE_STATUS.ACTIVE) {
      window.debugLog(`[ModuleFramework] Warning: Module ${moduleId} is not active, cannot unload.`);
      return false;
    }
    
    // Check if any modules depend on this one
    const dependents = Object.values(_modules).filter(m => 
      m.dependencies && m.dependencies.includes(moduleId) && m.status === MODULE_STATUS.ACTIVE
    );
    
    if (dependents.length > 0) {
      const errorMsg = `[ModuleFramework] Cannot unload module ${moduleId} because it is a dependency for: ${dependents.map(m => m.id).join(', ')}`;
      window.debugLog(errorMsg);
      if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) console.warn(errorMsg); // Important warning
      return false;
    }
    
    // Call module's destroy method if available
    if (module.instance && typeof module.instance.destroy === 'function') {
      try {
        module.instance.destroy();
        window.debugLog(`[ModuleFramework] Module ${moduleId} destroy() method called.`);
      } catch (error) {
        console.error(`[ModuleFramework] Error destroying module ${moduleId}:`, error); // Keep critical error
      }
    }
    
    // Reset module status
    module.status = MODULE_STATUS.REGISTERED;
    module.instance = null;
    
    // Publish unloaded event
    _eventBus.publish('module:unloaded', {
      id: moduleId,
      name: module.name
    });
    
    window.debugLog(`[ModuleFramework] Module ${module.name} (${moduleId}) unloaded.`);
    
    return true;
  }
  
  /**
   * Get a module instance
   * @param {string} moduleId - Module ID
   * @returns {Object|null} Module instance or null if not found/active
   */
  function getModule(moduleId) {
    const module = _modules[moduleId];
    
    if (!module || module.status !== MODULE_STATUS.ACTIVE) {
      return null;
    }
    
    return module.instance;
  }
  
  /**
   * Get all registered modules
   * @param {boolean} activeOnly - Only return active modules
   * @returns {Array} Array of modules
   */
  function getModules(activeOnly = false) {
    return Object.values(_modules)
      .filter(module => !activeOnly || module.status === MODULE_STATUS.ACTIVE)
      .map(module => ({
        id: module.id,
        name: module.name,
        version: module.version,
        status: module.status,
        dependencies: module.dependencies,
        loadTime: module.loadTime,
        initTime: module.initTime
      }));
  }
  
  /**
   * Call a method on a module
   * @param {string} moduleId - Module ID
   * @param {string} method - Method name
   * @param {...*} args - Method arguments
   * @returns {Promise} Promise that resolves with method result
   */
  function callModuleMethod(moduleId, method, ...args) {
    return new Promise((resolve, reject) => {
      // Get module instance
      const instance = getModule(moduleId);
      
      if (!instance) {
        // Try to load module first
        loadModule(moduleId)
          .then(loadedInstance => {
            if (!loadedInstance || typeof loadedInstance[method] !== 'function') {
              reject(new Error(`Method ${method} not found on module ${moduleId}`));
              return;
            }
            
            try {
              const result = loadedInstance[method](...args);
              
              // Handle async results
              if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
              } else {
                resolve(result);
              }
            } catch (error) {
              reject(error);
            }
          })
          .catch(reject);
        
        return;
      }
      
      if (typeof instance[method] !== 'function') {
        reject(new Error(`Method ${method} not found on module ${moduleId}`));
        return;
      }
      
      try {
        const result = instance[method](...args);
        
        // Handle async results
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Subscribe to module events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  function on(event, callback) {
    return _eventBus.subscribe(event, callback);
  }
  
  /**
   * Publish module event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  function emit(event, data) {
    _eventBus.publish(event, data);
  }
  
  /**
   * Initialize the framework
   */
  function initialize() {
    window.debugLog('AlgorithmPress Module Framework initialized');
    
    // Check for previously registered modules
    // This behavior might be too implicit for a robust framework.
    // It's generally better to explicitly register all modules.
    // For now, converting to debugLog.
    const preloadedModules = Object.keys(window).filter(key => {
      return typeof window[key] === 'object' && 
             window[key] !== null && 
             typeof window[key]._moduleId === 'string'; // Assuming a convention for preloaded modules
    });
    
    if (preloadedModules.length > 0) {
      window.debugLog(`[ModuleFramework] Found ${preloadedModules.length} potential pre-loaded modules:`, preloadedModules);
      
      // Auto-register pre-loaded modules
      preloadedModules.forEach(key => {
        const module = window[key];
        // Ensure we don't re-register if already handled by explicit registration
        if (!_modules[module._moduleId]) {
            registerModule({
            id: module._moduleId,
            name: module._moduleName || module._moduleId,
            version: module._moduleVersion || '1.0.0',
            instance: module,
            status: MODULE_STATUS.ACTIVE // Assume preloaded means active
            });
        }
      });
    }
    
    // Register standard modules
    registerStandardModules();
    
    // Publish initialized event
    _eventBus.publish('framework:initialized', {
      timestamp: Date.now()
    });
  }
  
  /**
   * Register standard modules that should be available
   */
  function registerStandardModules() {
    // Voice Control
    if (typeof window.VoiceControlSystem !== 'undefined') {
      registerModule({
        id: 'voice-control',
        name: 'Voice Control System',
        version: window.VoiceControlSystem.version || '1.0.0',
        instance: window.VoiceControlSystem,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'voice-control',
        name: 'Voice Control System',
        url: 'https://s3.cubbit.eu/algorithmpress/voice-control-system.js',
        dependencies: [],
        autoStart: false
      });
    }
    
    // NexusGrid
    if (typeof window.NexusGrid !== 'undefined') {
      registerModule({
        id: 'nexus-grid',
        name: 'NexusGrid',
        version: window.NexusGrid.version || '1.0.0',
        instance: window.NexusGrid,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'nexus-grid',
        name: 'NexusGrid',
        url: 'nexus-grid.js',
        dependencies: [],
        autoStart: false
      });
    }
    
    // Demonstration System
    if (typeof window.NexusGridDemoSystem !== 'undefined') {
      registerModule({
        id: 'demo-system',
        name: 'Demonstration System',
        version: window.NexusGridDemoSystem.version || '1.0.0',
        instance: window.NexusGridDemoSystem,
        status: MODULE_STATUS.ACTIVE,
        dependencies: ['nexus-grid']
      });
    } else {
      registerModule({
        id: 'demo-system',
        name: 'Demonstration System',
        url: 'https://s3.cubbit.eu/algorithmpress/demo-system-module.js',
        dependencies: ['nexus-grid'],
        autoStart: false
      });
    }
    
    // Rainbow Indicator
    if (typeof window.RainbowIndicator !== 'undefined') {
      registerModule({
        id: 'rainbow-indicator',
        name: 'Rainbow Indicator',
        version: window.RainbowIndicator.version || '1.0.0',
        instance: window.RainbowIndicator,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'rainbow-indicator',
        name: 'Rainbow Indicator',
        url: 'https://s3.cubbit.eu/algorithmpress/rainbow-indicator.js',
        dependencies: [],
        autoStart: false
      });
    }
    
    // Cubbit Storage
    if (typeof window.CubbitStorage !== 'undefined') {
      registerModule({
        id: 'cubbit-storage',
        name: 'Cubbit Storage',
        version: window.CubbitStorage.version || '1.0.0',
        instance: window.CubbitStorage,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'cubbit-storage',
        name: 'Cubbit Storage',
        url: 'https://s3.cubbit.eu/algorithmpress/cubbit-storage-integration.js',
        dependencies: [],
        autoStart: false
      });
    }

    // Storage UI Manager
    if (typeof window.StorageUIManager !== 'undefined') {
      registerModule({
        id: 'storage-ui-manager',
        name: 'Storage UI Manager',
        version: window.StorageUIManager.version || '1.0.0',
        instance: window.StorageUIManager,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'storage-ui-manager',
        name: 'Storage UI Manager',
        url: 'storage-ui-manager.js',
        dependencies: ['unified-storage-interface', 'storage-config-manager'],
        autoStart: false
      });
    }

    // Storage Config Manager
    if (typeof window.StorageConfigManager !== 'undefined') {
      registerModule({
        id: 'storage-config-manager',
        name: 'Storage Config Manager',
        version: window.StorageConfigManager.version || '1.0.0',
        instance: window.StorageConfigManager,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'storage-config-manager',
        name: 'Storage Config Manager',
        url: 'storage-config-manager.js',
        dependencies: [],
        autoStart: false
      });
    }

    // Unified Storage Interface
    if (typeof window.UnifiedStorage !== 'undefined') {
      registerModule({
        id: 'unified-storage-interface',
        name: 'Unified Storage Interface',
        version: window.UnifiedStorage.version || '1.0.0',
        instance: window.UnifiedStorage,
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'unified-storage-interface',
        name: 'Unified Storage Interface',
        url: 'unified-storage-interface.js',
        dependencies: ['storage-providers'],
        autoStart: false
      });
    }

    // Storage Providers
    if (typeof window.initializeLocalStorage !== 'undefined') {
      registerModule({
        id: 'storage-providers',
        name: 'Storage Providers',
        version: '1.0.0',
        instance: {
          initializeLocalStorage: window.initializeLocalStorage,
          initializeCubbitStorage: window.initializeCubbitStorage,
          // ...add other provider initializers as needed...
        },
        status: MODULE_STATUS.ACTIVE
      });
    } else {
      registerModule({
        id: 'storage-providers',
        name: 'Storage Providers',
        url: 'storage-providers.js',
        dependencies: [],
        autoStart: false
      });
    }

    // Implementation Example
    registerModule({
      id: 'implementation',
      name: 'Implementation Example',
      url: 'https://s3.cubbit.eu/algorithmpress/implementation-example-module.js',
      dependencies: ['rainbow-indicator'],
      autoStart: false
    });
  }
  
  // Public API
  return {
    initialize,
    registerModule,
    loadModule,
    unloadModule,
    getModule,
    getModules,
    callModuleMethod,
    on,
    emit,
    MODULE_STATUS
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  window.debugLog('[ModuleFramework] DOMContentLoaded, initializing ModuleFramework itself.');
  ModuleFramework.initialize();
  
  // Setup dock to work with module framework
  ModuleFramework.on('module:loaded', function(data) {
    window.debugLog(`[ModuleFramework] Event: Module ${data.name} loaded and ready.`);
    updateDockButtonState(data.id, true);
  });
  
  ModuleFramework.on('module:unloaded', function(data) {
    window.debugLog(`[ModuleFramework] Event: Module ${data.name} unloaded.`);
    updateDockButtonState(data.id, false);
  });
  
  // Function to update dock button state
  function updateDockButtonState(moduleId, active) {
    const button = document.getElementById(`${moduleId}-dock-btn`);
    if (!button) return;
    
    if (active) {
      button.classList.add('module-available');
    } else {
      button.classList.remove('module-available');
    }
  }
  
  // Connect dock buttons to module framework
  setupDockButtons();
  
  function setupDockButtons() {
    const buttons = document.querySelectorAll('.dock-button[id$="-dock-btn"]');
    
    buttons.forEach(button => {
      const moduleId = button.id.replace('-dock-btn', '');
      
      button.addEventListener('click', function() {
        const module = ModuleFramework.getModule(moduleId);
        
        if (!module) {
          // Try to load the module
          ModuleFramework.loadModule(moduleId)
            .then(() => {
              // Toggle panel if module has a togglePanel method
              ModuleFramework.callModuleMethod(moduleId, 'togglePanel')
                .catch(err => { // Changed 'error' to 'err' to avoid conflict with outer scope
                  window.debugLog(`[ModuleFramework] Module ${moduleId} doesn't have a togglePanel method:`, err.message);
                  // Try to toggle the panel directly
                  toggleModulePanel(moduleId);
                });
            })
            .catch(error => { // This 'error' is from loadModule
              console.error(`[ModuleFramework] Failed to load module ${moduleId}:`, error); // Keep critical error
              showToast('error', `Failed to load ${moduleId.replace('-', ' ')}: ${error.message}`);
            });
        } else {
          // Toggle panel if module has a togglePanel method
          ModuleFramework.callModuleMethod(moduleId, 'togglePanel')
            .catch(err => { // Changed 'error' to 'err'
              window.debugLog(`[ModuleFramework] Module ${moduleId} doesn't have a togglePanel method:`, err.message);
              // Try to toggle the panel directly
              toggleModulePanel(moduleId);
            });
        }
      });
    });
  }
  
  // Function to toggle a module panel
  function toggleModulePanel(moduleId) {
    const panel = document.getElementById(`${moduleId}-panel`);
    
    if (!panel) {
      // Fallback for NexusGrid: call its togglePanel method directly if available
      if (moduleId === 'nexus-grid' && window.NexusGrid && typeof window.NexusGrid.togglePanel === 'function') {
        window.NexusGrid.togglePanel();
        return;
      }
      const warnMsg = `[ModuleFramework] Panel for module ${moduleId} not found when trying to toggle.`;
      window.debugLog(warnMsg);
      if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) console.warn(warnMsg);
      return;
    }
    
    if (panel.classList.contains('hidden')) {
      // Hide all other panels first
      document.querySelectorAll('.system-panel').forEach(p => {
        p.classList.add('hidden');
      });
      
      // Show this panel
      panel.classList.remove('hidden');
      document.getElementById(`${moduleId}-dock-btn`).classList.add('active');
    } else {
      panel.classList.add('hidden');
      document.getElementById(`${moduleId}-dock-btn`).classList.remove('active');
    }
  }
  
  // Function to show toast notification
  function showToast(type, message) {
    // Check if function exists in the global scope
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
      return;
    }
    
    // console.log(`${type}: ${message}`); // Fallback, ideally showToast is globally available via ErrorMonitoringSystem or similar
    if (window.ErrorMonitoringSystem && window.ErrorMonitoringSystem.showToast) {
        window.ErrorMonitoringSystem.showToast(type, message);
    } else {
        console.warn(`[ModuleFramework] Toast: (${type}) ${message} (showToast not available)`);
    }
  }
});

// Export module framework to global scope
if (typeof window !== 'undefined') {
    window.ModuleFramework = ModuleFramework;
    if (typeof window.debugLog === 'function') {
        window.debugLog('[ModuleFramework] Assigned to window.ModuleFramework.');
    } else if (console && console.log && (window.PRODUCTION_CONFIG ? window.PRODUCTION_CONFIG.debug : false) ) {
        console.log('[ModuleFramework] Assigned to window.ModuleFramework (debugLog not ready).');
    }
}
// window.debugLog('[ModuleFramework] Script end'); // Removed
