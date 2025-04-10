/**
 * AlgorithmPress Module Integration Framework
 * Creates a standardized system for module registration, discovery, and integration
 */

const ModuleFramework = (function() {
  'use strict';
  
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
            console.error(`Error in event handler for ${event}:`, error);
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
      console.error('Invalid module configuration', moduleConfig);
      return false;
    }
    
    // Check if module is already registered
    if (_modules[moduleConfig.id]) {
      console.warn(`Module ${moduleConfig.id} is already registered`);
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
    
    console.log(`Module ${module.name} (${module.id}) registered with framework`);
    
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
          
          console.log(`Module ${module.name} (${moduleId}) loaded successfully in ${module.loadTime.toFixed(2)}ms`);
          
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
          
          console.error(`Failed to load module ${module.name} (${moduleId}):`, error);
          
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
        
        script.onload = function() {
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
      console.warn(`Module ${moduleId} not found`);
      return false;
    }
    
    if (module.status !== MODULE_STATUS.ACTIVE) {
      console.warn(`Module ${moduleId} is not active`);
      return false;
    }
    
    // Check if any modules depend on this one
    const dependents = Object.values(_modules).filter(m => 
      m.dependencies && m.dependencies.includes(moduleId) && m.status === MODULE_STATUS.ACTIVE
    );
    
    if (dependents.length > 0) {
      console.warn(`Cannot unload module ${moduleId} because it is a dependency for:`, dependents.map(m => m.id));
      return false;
    }
    
    // Call module's destroy method if available
    if (module.instance && typeof module.instance.destroy === 'function') {
      try {
        module.instance.destroy();
      } catch (error) {
        console.error(`Error destroying module ${moduleId}:`, error);
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
    
    console.log(`Module ${module.name} (${moduleId}) unloaded`);
    
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
    console.log('AlgorithmPress Module Framework initialized');
    
    // Check for previously registered modules
    const modules = Object.keys(window).filter(key => {
      return typeof window[key] === 'object' && 
             window[key] !== null && 
             typeof window[key]._moduleId === 'string';
    });
    
    if (modules.length > 0) {
      console.log(`Found ${modules.length} pre-loaded modules:`, modules);
      
      // Auto-register pre-loaded modules
      modules.forEach(key => {
        const module = window[key];
        
        registerModule({
          id: module._moduleId,
          name: module._moduleName || module._moduleId,
          version: module._moduleVersion || '1.0.0',
          instance: module
        });
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
  ModuleFramework.initialize();
  
  // Setup dock to work with module framework
  ModuleFramework.on('module:loaded', function(data) {
    console.log(`Module ${data.name} loaded and ready`);
    updateDockButtonState(data.id, true);
  });
  
  ModuleFramework.on('module:unloaded', function(data) {
    console.log(`Module ${data.name} unloaded`);
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
                .catch(error => {
                  console.warn(`Module ${moduleId} doesn't have a togglePanel method:`, error);
                  // Try to toggle the panel directly
                  toggleModulePanel(moduleId);
                });
            })
            .catch(error => {
              console.error(`Failed to load module ${moduleId}:`, error);
              showToast('error', `Failed to load ${moduleId.replace('-', ' ')}: ${error.message}`);
            });
        } else {
          // Toggle panel if module has a togglePanel method
          ModuleFramework.callModuleMethod(moduleId, 'togglePanel')
            .catch(error => {
              console.warn(`Module ${moduleId} doesn't have a togglePanel method:`, error);
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
      console.warn(`Panel for module ${moduleId} not found`);
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
    
    console.log(`${type}: ${message}`);
  }
});

// Export module framework to global scope
window.ModuleFramework = ModuleFramework;
