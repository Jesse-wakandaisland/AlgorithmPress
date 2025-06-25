/**
/**
 * Production Initialization Script for AlgorithmPress
 * Ensures all modules are properly integrated and production-ready
 */
// console.log('[ProductionInitialization] Script execution start.'); // Removed for production

(function() {
  'use strict';
  // console.log('[ProductionInitialization] IIFE start.'); // Removed for production

  // Production configuration
  const PRODUCTION_CONFIG = {
    environment: 'production',
    debug: false,
    enableDiagnostics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    moduleTimeout: 30000,
    initializationDelay: 2000
  };

  let initializationComplete = false;
  let initializationStartTime = 0; // Will be set when initializeProduction is called

  /**
   * Main production initialization
   */
  async function initializeProduction() {
    initializationStartTime = Date.now();
    window.debugLog('🏭 Starting AlgorithmPress Production Initialization...');
    
    try {
      // Step 1: Wait for DOM to be ready
      await waitForDOM();
      
      // Step 2: Initialize diagnostics
      await initializeDiagnostics();
      
      // Step 3: Initialize core systems
      await initializeCoreSystem();
      
      // Step 4: Initialize integration helper
      await initializeIntegrationHelper();
      
      // Step 5: Verify production readiness
      await verifyProductionReadiness();
      
      // Step 6: Setup production monitoring
      setupProductionMonitoring();
      
      initializationComplete = true;
      const totalTime = Date.now() - initializationStartTime;
      
      window.debugLog(`✅ AlgorithmPress Production Ready! (${totalTime}ms)`);
      if (PRODUCTION_CONFIG.debug) { // Keep this important log if debug is true
        console.log(`✅ AlgorithmPress Production Ready! (${totalTime}ms)`);
      }
      
      // Notify parent window if in iframe
      notifyParentWindow('production_ready', {
        success: true,
        initializationTime: totalTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      // Use ErrorMonitoringSystem if available, otherwise console.error
      if (window.ErrorMonitoringSystem && window.ErrorMonitoringSystem.logError) {
        window.ErrorMonitoringSystem.logError('critical', 'Production initialization failed', { error: error.message, stack: error.stack }, error);
      } else {
        console.error('❌ Production initialization failed:', error);
      }
      
      // Attempt emergency fallback
      await emergencyFallback(error);
      
      // Notify parent window of failure
      notifyParentWindow('production_failed', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Wait for DOM to be ready
   */
  function waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize diagnostics system
   */
  async function initializeDiagnostics() {
    if (!PRODUCTION_CONFIG.enableDiagnostics) return;
    
    window.debugLog('🔍 Initializing production diagnostics...');
    
    // Wait for diagnostics to be available
    await waitForGlobal('ProductionDiagnostics', 5000);
    
    if (window.ProductionDiagnostics) {
      try {
        await window.ProductionDiagnostics.initialize();
        window.debugLog('✅ Production diagnostics initialized');
      } catch (error) {
        console.warn('⚠️ Diagnostics initialization failed:', error); // Keep this warning
      }
    }
  }

  /**
   * Initialize core system
   */
  async function initializeCoreSystem() {
    window.debugLog('[ProductionInitialization] 🔧 Initializing core system...');
    
    // Ensure critical modules are loaded
    const criticalModules = [
      'ErrorMonitoringSystem',
      'UnifiedStorage', 
      'StorageConfigManager',
      'ModuleFramework'
    ];
    
    for (const module of criticalModules) {
      window.debugLog(`[ProductionInitialization] Waiting for global: ${module}`);
      await waitForGlobal(module, PRODUCTION_CONFIG.moduleTimeout);
      if (!window[module]) {
        // This is critical, so a console.error is warranted even in production for initial setup issues.
        console.error(`[ProductionInitialization] CRITICAL: Module ${module} not available after timeout.`);
        throw new Error(`Critical module not available: ${module}`);
      }
      window.debugLog(`[ProductionInitialization] Global ${module} is available.`);
    }
    
    // Initialize error monitoring first
    if (window.ErrorMonitoringSystem) {
      try {
        window.debugLog('[ProductionInitialization] Initializing ErrorMonitoringSystem...');
        // TODO: Configure remoteEndpoint from a global config or environment variable
        const remoteLoggingEndpoint = null; // Example: window.APP_CONFIG.REMOTE_LOG_URL || null;

        await window.ErrorMonitoringSystem.initialize({
          enableConsoleLogging: PRODUCTION_CONFIG.debug,
          enableRemoteLogging: PRODUCTION_CONFIG.enableErrorReporting,
          remoteEndpoint: remoteLoggingEndpoint, // Set the endpoint here
          enableUserNotifications: false, // User notifications can be enabled if a proper system is in place
          enablePerformanceMonitoring: PRODUCTION_CONFIG.enablePerformanceMonitoring
        });
        window.debugLog('[ProductionInitialization] ✅ Error monitoring system initialized');
      } catch (error) {
        console.error('[ProductionInitialization] ❌ Error monitoring initialization failed:', error); // Keep critical error
        throw error;
      }
    }
    
    // Initialize storage systems
    let activeStorageConfig = null;
    if (window.StorageConfigManager) {
      try {
        window.debugLog('[ProductionInitialization] Initializing StorageConfigManager...');
        await window.StorageConfigManager.initialize();
        window.debugLog('[ProductionInitialization] ✅ Storage config manager initialized');
        activeStorageConfig = await window.StorageConfigManager.getActiveStorageSettings();
        if (activeStorageConfig) {
          window.debugLog(`[ProductionInitialization] ✅ Active storage settings loaded: ${activeStorageConfig.providerType}`);
        } else {
          window.debugLog('[ProductionInitialization] ℹ️ No active storage settings found, will use defaults.');
        }
      } catch (error) {
        console.error('[ProductionInitialization] ❌ Storage config manager initialization or loading active settings failed:', error); // Keep critical error
        // Proceed with default storage if config manager fails
      }
    } else {
      console.error('[ProductionInitialization] CRITICAL: StorageConfigManager is not defined on window.'); // Keep critical error
    }
    
    if (window.UnifiedStorage) {
      try {
        window.debugLog('[ProductionInitialization] Initializing UnifiedStorage...');
        let unifiedStorageInitOptions = {
          primaryProvider: 'localStorage', // Default
          fallbackProviders: ['localStorage'],
          providers: {}, // To store specific provider configs
          settings: {
            enableFailover: true,
            enableCaching: true,
            retryAttempts: 3,
            connectionTimeout: 10000
          }
        };

        if (activeStorageConfig && activeStorageConfig.providerType && activeStorageConfig.config) {
          window.debugLog(`[ProductionInitialization] Using active storage config for UnifiedStorage: ${activeStorageConfig.providerType}`);
          unifiedStorageInitOptions.primaryProvider = activeStorageConfig.providerType;
          if (activeStorageConfig.providerType !== 'localStorage') {
            unifiedStorageInitOptions.fallbackProviders = [activeStorageConfig.providerType, 'localStorage'];
          } else {
             unifiedStorageInitOptions.fallbackProviders = ['localStorage'];
          }
          unifiedStorageInitOptions.providers[activeStorageConfig.providerType] = activeStorageConfig.config;
        } else {
          window.debugLog('[ProductionInitialization] ℹ️ Initializing UnifiedStorage with default localStorage.');
        }

        await window.UnifiedStorage.initialize(unifiedStorageInitOptions);
        window.debugLog(`[ProductionInitialization] ✅ Unified storage initialized with primary: ${window.UnifiedStorage.getStats().primaryProvider}`);
      } catch (error) {
        console.warn('[ProductionInitialization] ⚠️ Unified storage initialization failed, attempting fallback to basic localStorage:', error); // Keep warning
        try {
          await window.UnifiedStorage.initialize({ primaryProvider: 'localStorage', fallbackProviders: ['localStorage'] });
          window.debugLog('[ProductionInitialization] ✅ Unified storage initialized with basic localStorage fallback.');
        } catch (fallbackError) {
          console.error('[ProductionInitialization] ❌ Basic localStorage fallback for UnifiedStorage also failed:', fallbackError); // Keep critical error
        }
      }
    } else {
        console.error('[ProductionInitialization] CRITICAL: UnifiedStorage is not defined on window.'); // Keep critical error
    }
    
    // Initialize module framework
    if (window.ModuleFramework) {
      try {
        window.debugLog('[ProductionInitialization] Initializing ModuleFramework...');
        await window.ModuleFramework.initialize();
        window.debugLog('[ProductionInitialization] ✅ Module framework initialized');
      } catch (error) {
        console.error('[ProductionInitialization] ❌ Module framework initialization failed:', error); // Keep critical error
        throw error;
      }
    }
  }

  /**
   * Initialize integration helper
   */
  async function initializeIntegrationHelper() {
    window.debugLog('🔗 Initializing integration helper...');
    
    await waitForGlobal('ProductionIntegrationHelper', 10000);
    
    if (window.ProductionIntegrationHelper) {
      try {
        await window.ProductionIntegrationHelper.initialize();
        window.debugLog('✅ Integration helper initialized');
      } catch (error) {
        console.warn('⚠️ Integration helper initialization failed:', error); // Keep warning
      }
    }
  }

  /**
   * Verify production readiness
   */
  async function verifyProductionReadiness() {
    window.debugLog('🔍 Verifying production readiness...');
    
    const checks = [
      {
        name: 'Error Monitoring',
        check: () => window.ErrorMonitoringSystem && 
                    typeof window.ErrorMonitoringSystem.logError === 'function'
      },
      {
        name: 'Storage System',
        check: () => window.UnifiedStorage && 
                    typeof window.UnifiedStorage.save === 'function'
      },
      {
        name: 'Module Framework',
        check: () => window.ModuleFramework && 
                    typeof window.ModuleFramework.registerModule === 'function'
      },
      {
        name: 'DOM Elements',
        check: () => document.getElementById('php-wasm-container') !== null
      },
      {
        name: 'Bootstrap',
        check: () => typeof window.bootstrap !== 'undefined'
      }
    ];
    
    const failedChecks = [];
    
    for (const check of checks) {
      try {
        if (!check.check()) {
          failedChecks.push(check.name);
          window.debugLog(`❌ Production check failed: ${check.name}`);
        } else {
          window.debugLog(`✅ Production check passed: ${check.name}`);
        }
      } catch (error) {
        console.error(`❌ Production check FAILED (exception): ${check.name}`, error); // Keep critical error
        failedChecks.push(check.name);
      }
    }
    
    if (failedChecks.length > 0) {
      const errorMsg = `Production readiness checks failed: ${failedChecks.join(', ')}`;
      console.error(`❌ ${errorMsg}`); // Keep critical error
      throw new Error(errorMsg);
    }
    
    // Test basic functionality
    try {
      // Test storage
      if (window.UnifiedStorage) {
        await window.UnifiedStorage.save('production_test', { 
          timestamp: Date.now(),
          test: 'production_ready'
        });
        const testData = await window.UnifiedStorage.load('production_test');
        if (!testData || testData.test !== 'production_ready') {
          throw new Error('Storage functionality test failed');
        }
        window.debugLog('Storage functionality test passed.');
      }
      
      // Test error monitoring
      if (window.ErrorMonitoringSystem) {
        window.ErrorMonitoringSystem.logInfo('system', 'Production readiness verification completed');
      }
      
      window.debugLog('✅ Production functionality tests passed');
      
    } catch (error) {
      console.error('❌ Production functionality tests failed:', error); // Keep critical error
      throw error;
    }
  }

  /**
   * Setup production monitoring
   */
  function setupProductionMonitoring() {
    if (!PRODUCTION_CONFIG.enablePerformanceMonitoring && !PRODUCTION_CONFIG.enableErrorReporting) return;
    
    window.debugLog('📊 Setting up production monitoring...');
    
    // Monitor performance
    if (PRODUCTION_CONFIG.enablePerformanceMonitoring && window.performance && window.performance.observer) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // Log slow operations
              console.warn(`⚠️ Slow operation detected: ${entry.name} (${entry.duration}ms)`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('⚠️ Performance monitoring setup failed:', error); // Keep warning
      }
    }
    
    // Monitor memory usage
    if (PRODUCTION_CONFIG.enablePerformanceMonitoring && window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        if (usedMB > 100) { // Log high memory usage
          // This is a warning, so keep it if performance monitoring is on.
          console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }, 60000); // Check every minute
    }
    
    // Monitor errors - This should always be active if ErrorMonitoringSystem is available and enableErrorReporting is true
    if (PRODUCTION_CONFIG.enableErrorReporting && window.ErrorMonitoringSystem && typeof window.ErrorMonitoringSystem.logError === 'function') {
        window.addEventListener('error', (event) => {
            window.ErrorMonitoringSystem.logError('runtime', 'Unhandled error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
            }, event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            window.ErrorMonitoringSystem.logError('runtime', 'Unhandled promise rejection', {
            reason: event.reason
            });
        });
        window.debugLog('Global error handlers attached to ErrorMonitoringSystem.');
    }
    
    window.debugLog('✅ Production monitoring setup complete');
  }

  /**
   * Emergency fallback for critical failures
   */
  async function emergencyFallback(error) {
    console.error('🚨 Activating emergency fallback due to error:', error.message); // Keep critical error
    
    // Create minimal error logging
    if (!window.ErrorMonitoringSystem) {
      window.ErrorMonitoringSystem = {
        logError: (category, message, data, error) => {
          console.error(`[${category}] ${message}`, data, error);
        },
        logInfo: (category, message) => {
          console.log(`[${category}] ${message}`);
        }
      };
    }
    
    // Create minimal storage
    if (!window.UnifiedStorage) {
      window.UnifiedStorage = {
        save: (key, data) => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
            return Promise.resolve({ success: true });
          } catch (e) {
            return Promise.reject(e);
          }
        },
        load: (key) => {
          try {
            const data = localStorage.getItem(key);
            return Promise.resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            return Promise.reject(e);
          }
        }
      };
    }
    
    // Log the emergency fallback
    if (window.ErrorMonitoringSystem && window.ErrorMonitoringSystem.logError) {
        window.ErrorMonitoringSystem.logError('system', 'Emergency fallback activated', {
        originalError: error.message,
        timestamp: new Date().toISOString()
        });
    }
    // console.error is already done at the start of this function.
    window.debugLog('✅ Emergency fallback setup complete.');
  }

  /**
   * Wait for a global variable to be available
   */
  function waitForGlobal(globalName, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkGlobal = () => {
        if (typeof window[globalName] !== 'undefined') {
          resolve(window[globalName]);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Global ${globalName} not available after ${timeout}ms`));
        } else {
          setTimeout(checkGlobal, 100);
        }
      };
      
      checkGlobal();
    });
  }

  /**
   * Notify parent window of initialization status
   */
  function notifyParentWindow(event, data) {
    try {
      if (window.parent && window.parent !== window) {
        let targetOrigin = '*';
        const primaryKnownOrigin = 'https://algorithmpress.com';

        // Check if running inside an iframe and try to determine parent origin
        if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
          const parentOrigin = window.location.ancestorOrigins[0];
          if (parentOrigin === primaryKnownOrigin) {
            targetOrigin = primaryKnownOrigin;
          } else if (parentOrigin.startsWith('file://')) {
            // Allow '*' for file:// protocol (local use), but warn if not in debug.
            // No, for file://, the origin is 'null' or specific file path, '*' is still the only reliable way for general local files.
            // The main concern is untrusted remote origins.
            window.debugLog(`[ProductionInitialization] postMessage target is '*' for local file origin: ${parentOrigin}. This is expected for local use.`);
          } else {
            // For other origins, if not the primary known one, warn about using '*'
             const warnMsg = `[ProductionInitialization] WARNING: postMessage target is '*' for parent origin: ${parentOrigin}. If embedding on a new trusted domain, update targetOrigin in production-initialization.js.`;
             window.debugLog(warnMsg);
             if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) {
                console.warn(warnMsg);
             }
          }
        } else if (document.referrer) {
            // Fallback for older browsers or specific iframe setups, less reliable
            try {
                const referrerOrigin = new URL(document.referrer).origin;
                if (referrerOrigin === primaryKnownOrigin) {
                    targetOrigin = primaryKnownOrigin;
                } else if (referrerOrigin.startsWith('file://')) {
                    window.debugLog(`[ProductionInitialization] postMessage target is '*' due to local file referrer: ${referrerOrigin}.`);
                } else {
                    const warnMsg = `[ProductionInitialization] WARNING: postMessage target is '*' for referrer origin: ${referrerOrigin}. Consider updating targetOrigin if this is a trusted embedder.`;
                    window.debugLog(warnMsg);
                    if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) {
                        console.warn(warnMsg);
                    }
                }
            } catch (e) {
                 window.debugLog(`[ProductionInitialization] Could not parse document.referrer: ${document.referrer}. Using '*' for postMessage.`);
            }
        } else {
          // If ancestorOrigins is not supported and no referrer, or if parent is not the primary known one.
          const warnMsg = `[ProductionInitialization] WARNING: Using '*' as targetOrigin for postMessage due to unknown or non-primary parent origin. This is a security risk if embedded in untrusted third-party sites.`;
          window.debugLog(warnMsg);
          if (PRODUCTION_CONFIG && !PRODUCTION_CONFIG.debug) { // Show warning if not in debug mode
            console.warn(warnMsg);
          }
        }

        window.debugLog(`[ProductionInitialization] Notifying parent window. Event: ${event}, Target Origin: ${targetOrigin}`);
        window.parent.postMessage({
          source: 'algorithmpress',
          event,
          data
        }, targetOrigin);
      }
    } catch (error) {
      // Ignore postMessage errors, but log in debug mode
      window.debugLog('[ProductionInitialization] Error in notifyParentWindow:', error);
    }
  }

  /**
   * Get production status
   */
  function getProductionStatus() {
    return {
      initialized: initializationComplete,
      uptime: Date.now() - initializationStartTime,
      config: PRODUCTION_CONFIG,
      timestamp: new Date().toISOString(),
      modules: {
        errorMonitoring: typeof window.ErrorMonitoringSystem !== 'undefined',
        unifiedStorage: typeof window.UnifiedStorage !== 'undefined',
        moduleFramework: typeof window.ModuleFramework !== 'undefined',
        storageConfig: typeof window.StorageConfigManager !== 'undefined'
      }
    };
  }

  // Export production status checker
  window.getProductionStatus = getProductionStatus;

  // Global debug logger
  window.debugLog = function(...args) {
    if (PRODUCTION_CONFIG && PRODUCTION_CONFIG.debug) {
      console.log(...args);
    }
  };

  // Start initialization after a short delay
  setTimeout(() => {
    window.debugLog(`[ProductionInitialization] Calling initializeProduction after ${PRODUCTION_CONFIG.initializationDelay}ms delay.`);
    initializeProduction();
  }, PRODUCTION_CONFIG.initializationDelay);

  window.debugLog('[ProductionInitialization] IIFE end. Initialization process will start after delay.');
})();
// console.log('[ProductionInitialization] Script execution end.'); // Removed for production