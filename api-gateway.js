/**
 * AlgorithmPress API Gateway
 * Provides a unified interface for inter-module communication with
 * security, versioning, and telemetry
 */

const ApiGateway = (function() {
  'use strict';
  
  // API registry
  const _apis = {};
  
  // API call history for diagnostics
  const _callHistory = [];
  
  // Maximum history size
  const MAX_HISTORY_SIZE = 1000;
  
  // Gateway status
  let _initialized = false;
  
  // Security settings
  const _securitySettings = {
    enforcePermissions: true,
    logAllCalls: true,
    validateParameters: true
  };
  
  /**
   * Initialize the API Gateway
   * @param {Object} options - Initialization options
   */
  function initialize(options = {}) {
    if (_initialized) {
      window.debugLog('[ApiGateway] Warning: API Gateway already initialized.');
      return;
    }
    
    // Configure security settings
    Object.assign(_securitySettings, options.security || {});
    
    // Register with module framework if available
    if (window.ModuleFramework) {
      window.ModuleFramework.registerModule({
        id: 'api-gateway',
        name: 'API Gateway',
        version: '1.0.0',
        instance: ApiGateway, // Assuming ApiGateway is the object itself
        status: window.ModuleFramework.MODULE_STATUS.ACTIVE
      });
      
      // Listen for module events
      window.ModuleFramework.on('module:loaded', moduleLoaded);
      window.ModuleFramework.on('module:unloaded', moduleUnloaded);
      window.debugLog('[ApiGateway] Registered with ModuleFramework and listening for module events.');
    }
    
    _initialized = true;
    window.debugLog('[ApiGateway] Initialized.');
    
    if (options.apis) {
      // Register initial APIs
      options.apis.forEach(api => {
        registerApi(api);
      });
    }
  }
  
  /**
   * Handle module loaded event
   * @param {Object} data - Module data
   */
  function moduleLoaded(data) {
    const { id, instance } = data;
    
    // Check if module exposes an API
    if (instance && instance.api) {
      // Auto-register module API
      registerApi({
        provider: id,
        namespace: id,
        methods: Object.keys(instance.api).reduce((methods, method) => {
          methods[method] = {
            handler: instance.api[method],
            permissions: ['*'],
            description: `${id}.${method} method`
          };
          return methods;
        }, {})
      });
    }
  }
  
  /**
   * Handle module unloaded event
   * @param {Object} data - Module data
   */
  function moduleUnloaded(data) {
    const { id } = data;
    
    // Unregister all APIs provided by this module
    Object.keys(_apis).forEach(namespace => {
      if (_apis[namespace].provider === id) {
        unregisterApi(namespace);
      }
    });
  }
  
  /**
   * Register an API with the gateway
   * @param {Object} api - API configuration
   * @returns {boolean} Success status
   */
  function registerApi(api) {
    if (!api || !api.namespace || !api.methods) {
      console.error('[ApiGateway] Invalid API configuration:', api); // Keep critical error
      return false;
    }
    
    if (_apis[api.namespace]) {
      window.debugLog(`[ApiGateway] Warning: API namespace ${api.namespace} is already registered. Overwriting.`);
      // Allow overwriting for flexibility, but log it. Or decide if this should be an error.
      // For now, let's allow overwrite but log as a warning if not in debug mode.
      if (!PRODUCTION_CONFIG.debug) console.warn(`[ApiGateway] API namespace ${api.namespace} was overwritten.`);
    }
    
    // Default configuration
    const defaultApi = {
      provider: api.provider || api.namespace,
      version: api.version || '1.0.0',
      permissions: api.permissions || ['*'],
      description: api.description || `${api.namespace} API`
    };
    
    // Register API
    _apis[api.namespace] = {
      ...defaultApi,
      methods: api.methods,
      registeredAt: Date.now()
    };
    
    window.debugLog(`[ApiGateway] API ${api.namespace} v${defaultApi.version} registered.`);
    
    return true;
  }
  
  /**
   * Unregister an API
   * @param {string} namespace - API namespace
   * @returns {boolean} Success status
   */
  function unregisterApi(namespace) {
    if (!_apis[namespace]) {
      window.debugLog(`[ApiGateway] Warning: API namespace ${namespace} not found for unregistration.`);
      return false;
    }
    
    // Remove API
    delete _apis[namespace];
    
    window.debugLog(`[ApiGateway] API ${namespace} unregistered.`);
    
    return true;
  }
  
  /**
   * Call an API method
   * @param {string} path - API path in format namespace.method
   * @param {Object} params - Method parameters
   * @param {Object} options - Call options
   * @returns {Promise} Promise that resolves with method result
   */
  function call(path, params = {}, options = {}) {
    return new Promise((resolve, reject) => {
      // Parse path
      const [namespace, method] = path.split('.');
      
      if (!namespace || !method) {
        reject(new Error(`Invalid API path: ${path}`));
        return;
      }
      
      // Get API
      const api = _apis[namespace];
      
      if (!api) {
        reject(new Error(`API namespace not found: ${namespace}`));
        return;
      }
      
      // Get method
      const methodConfig = api.methods[method];
      
      if (!methodConfig) {
        reject(new Error(`Method not found: ${namespace}.${method}`));
        return;
      }
      
      // Check permissions
      if (_securitySettings.enforcePermissions && !hasPermission(options.caller, methodConfig.permissions)) {
        reject(new Error(`Permission denied for ${namespace}.${method}`));
        return;
      }
      
      // Validate parameters
      if (_securitySettings.validateParameters && methodConfig.schema) {
        try {
          validateParameters(params, methodConfig.schema);
        } catch (error) {
          reject(error);
          return;
        }
      }
      
      // Create call context
      const context = {
        caller: options.caller || 'anonymous',
        path,
        timestamp: Date.now(),
        gateway: ApiGateway
      };
      
      // Track call start for telemetry
      const callStart = performance.now();
      const callId = generateCallId();
      
      // Add to history if logging is enabled
      if (_securitySettings.logAllCalls) {
        addToHistory({
          id: callId,
          path,
          params: { ...params },
          caller: context.caller,
          timestamp: context.timestamp,
          status: 'pending'
        });
      }
      
      // Call method
      try {
        const result = methodConfig.handler(params, context);
        
        // Handle async results
        if (result && typeof result.then === 'function') {
          result
            .then(data => {
              // Update history
              if (_securitySettings.logAllCalls) {
                updateHistory(callId, {
                  status: 'success',
                  duration: performance.now() - callStart
                });
              }
              
              resolve(data);
            })
            .catch(error => {
              // Update history
              if (_securitySettings.logAllCalls) {
                updateHistory(callId, {
                  status: 'error',
                  error: error.message,
                  duration: performance.now() - callStart
                });
              }
              
              reject(error);
            });
        } else {
          // Synchronous result
          if (_securitySettings.logAllCalls) {
            updateHistory(callId, {
              status: 'success',
              duration: performance.now() - callStart
            });
          }
          
          resolve(result);
        }
      } catch (error) {
        // Method threw an error
        if (_securitySettings.logAllCalls) {
          updateHistory(callId, {
            status: 'error',
            error: error.message,
            duration: performance.now() - callStart
          });
        }
        
        reject(error);
      }
    });
  }
  
  /**
   * Generate a unique call ID
   * @returns {string} Call ID
   */
  function generateCallId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * Add a call to the history
   * @param {Object} call - Call data
   */
  function addToHistory(call) {
    _callHistory.unshift(call);
    
    // Trim history if needed
    if (_callHistory.length > MAX_HISTORY_SIZE) {
      _callHistory.pop();
    }
  }
  
  /**
   * Update a call in the history
   * @param {string} callId - Call ID
   * @param {Object} data - Data to update
   */
  function updateHistory(callId, data) {
    const call = _callHistory.find(c => c.id === callId);
    
    if (call) {
      Object.assign(call, data);
    }
  }
  
  /**
   * Check if a caller has permission to call a method
   * @param {string} caller - Caller ID
   * @param {Array} permissions - Required permissions
   * @returns {boolean} Whether caller has permission
   */
  function hasPermission(caller, permissions) {
    if (!caller || !permissions || !permissions.length) {
      return false;
    }
    
    // Allow all if permissions include "*"
    if (permissions.includes('*')) {
      return true;
    }
    
    // TODO: Implement more sophisticated permission checking
    // For now, if not a wildcard, and no specific permission matched (which is not implemented yet), deny.
    // This makes it default deny instead of default allow.
    const permMessage = `[ApiGateway] Permission check for caller '${caller}' on permissions '${permissions.join(',')}' defaulted to deny. Implement sophisticated checks.`;
    window.debugLog(permMessage);
    if (!PRODUCTION_CONFIG.debug) console.warn(permMessage); // Show warning in prod if not in debug mode, as this is a security default.
    return false;
  }
  
  /**
   * Validate parameters against a schema
   * @param {Object} params - Parameters to validate
   * @param {Object} schema - Schema to validate against
   * @throws {Error} If validation fails
   */
  function validateParameters(params, schema) {
    // Simple validation for required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (params[field] === undefined) {
          throw new Error(`Missing required parameter: ${field}`);
        }
      });
    }
    
    // Type validation
    if (schema.properties) {
      Object.keys(schema.properties).forEach(field => {
        const property = schema.properties[field];
        const value = params[field];
        
        if (value !== undefined) {
          // Check type
          if (property.type && !validateType(value, property.type)) {
            throw new Error(`Invalid type for parameter ${field}: expected ${property.type}`);
          }
          
          // Check enum
          if (property.enum && !property.enum.includes(value)) {
            throw new Error(`Invalid value for parameter ${field}: must be one of ${property.enum.join(', ')}`);
          }
          
          // Check minimum
          if (property.minimum !== undefined && value < property.minimum) {
            throw new Error(`Invalid value for parameter ${field}: must be at least ${property.minimum}`);
          }
          
          // Check maximum
          if (property.maximum !== undefined && value > property.maximum) {
            throw new Error(`Invalid value for parameter ${field}: must be at most ${property.maximum}`);
          }
          
          // Check minLength
          if (property.minLength !== undefined && typeof value === 'string' && value.length < property.minLength) {
            throw new Error(`Invalid value for parameter ${field}: must be at least ${property.minLength} characters`);
          }
          
          // Check maxLength
          if (property.maxLength !== undefined && typeof value === 'string' && value.length > property.maxLength) {
            throw new Error(`Invalid value for parameter ${field}: must be at most ${property.maxLength} characters`);
          }
        }
      });
    }
  }
  
  /**
   * Validate a value against a type
   * @param {*} value - Value to validate
   * @param {string} type - Type to validate against
   * @returns {boolean} Whether value is of the specified type
   */
  function validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }
  
  /**
   * Get API history
   * @param {Object} filters - History filters
   * @returns {Array} Filtered history
   */
  function getHistory(filters = {}) {
    let history = [..._callHistory];
    
    // Apply filters
    if (filters.path) {
      history = history.filter(call => call.path === filters.path);
    }
    
    if (filters.caller) {
      history = history.filter(call => call.caller === filters.caller);
    }
    
    if (filters.status) {
      history = history.filter(call => call.status === filters.status);
    }
    
    if (filters.since) {
      history = history.filter(call => call.timestamp >= filters.since);
    }
    
    if (filters.until) {
      history = history.filter(call => call.timestamp <= filters.until);
    }
    
    // Apply limit
    if (filters.limit && filters.limit > 0) {
      history = history.slice(0, filters.limit);
    }
    
    return history;
  }
  
  /**
   * Clear API history
   */
  function clearHistory() {
    _callHistory.length = 0;
  }
  
  /**
   * Get available APIs
   * @returns {Object} Available APIs
   */
  function getApis() {
    const apis = {};
    
    Object.keys(_apis).forEach(namespace => {
      const api = _apis[namespace];
      
      apis[namespace] = {
        provider: api.provider,
        version: api.version,
        description: api.description,
        methods: Object.keys(api.methods).map(method => ({
          name: method,
          description: api.methods[method].description,
          permissions: api.methods[method].permissions
        }))
      };
    });
    
    return apis;
  }
  
  // Public API
  return {
    initialize,
    registerApi,
    unregisterApi,
    call,
    getHistory,
    clearHistory,
    getApis
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  window.debugLog('[ApiGateway] DOMContentLoaded, initializing ApiGateway...');
  ApiGateway.initialize();
  
  // Register built-in APIs
  window.debugLog('[ApiGateway] Registering built-in system API...');
  ApiGateway.registerApi({
    namespace: 'system',
    provider: 'api-gateway',
    version: '1.0.0',
    description: 'System API for core operations',
    methods: {
      getModules: {
        handler: function() {
          if (window.ModuleFramework) {
            return window.ModuleFramework.getModules();
          }
          return [];
        },
        permissions: ['*'],
        description: 'Get all registered modules'
      },
      getApis: {
        handler: function() {
          return ApiGateway.getApis();
        },
        permissions: ['*'],
        description: 'Get all registered APIs'
      },
      getHistory: {
        handler: function(params) {
          return ApiGateway.getHistory(params);
        },
        permissions: ['admin'], // Example permission
        description: 'Get API call history',
        schema: {
          properties: {
            path: { type: 'string' },
            caller: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'success', 'error'] },
            since: { type: 'number' },
            until: { type: 'number' },
            limit: { type: 'integer', minimum: 1 }
          }
        }
      },
      clearHistory: {
        handler: function() {
          ApiGateway.clearHistory();
          return { success: true };
        },
        permissions: ['admin'], // Example permission
        description: 'Clear API call history'
      }
    }
  });
  window.debugLog('[ApiGateway] Built-in system API registered.');
});

// Export API gateway to global scope
if (typeof window !== 'undefined') {
    window.ApiGateway = ApiGateway;
    // Conditional log for assignment, as debugLog might depend on PRODUCTION_CONFIG
    if (typeof window.debugLog === 'function') {
        window.debugLog('[ApiGateway] Assigned to window.ApiGateway.');
    } else if (console && console.log && (window.PRODUCTION_CONFIG ? window.PRODUCTION_CONFIG.debug : false) ) {
        console.log('[ApiGateway] Assigned to window.ApiGateway (debugLog not ready).');
    }
}
