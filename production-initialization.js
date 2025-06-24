/**
 * Production Initialization Script for AlgorithmPress
 * Ensures all modules are properly integrated and production-ready
 */
console.log('[ProductionInitialization] Script start');

(function() {
  'use strict';
  console.log('[ProductionInitialization] IIFE start');

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
  let initializationStartTime = Date.now();

  /**
   * Main production initialization
   */
  async function initializeProduction() {
    console.log('🏭 Starting AlgorithmPress Production Initialization...');
    
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
      
      console.log(`✅ AlgorithmPress Production Ready! (${totalTime}ms)`);
      
      // Notify parent window if in iframe
      notifyParentWindow('production_ready', {
        success: true,
        initializationTime: totalTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Production initialization failed:', error);
      
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
    
    console.log('🔍 Initializing production diagnostics...');
    
    // Wait for diagnostics to be available
    await waitForGlobal('ProductionDiagnostics', 5000);
    
    if (window.ProductionDiagnostics) {
      try {
        await window.ProductionDiagnostics.initialize();
        console.log('✅ Production diagnostics initialized');
      } catch (error) {
        console.warn('⚠️ Diagnostics initialization failed:', error);
      }
    }
  }

  /**
   * Initialize core system
   */
  async function initializeCoreSystem() {
    console.log('🔧 Initializing core system...');
    
    // Ensure critical modules are loaded
    const criticalModules = [
      'ErrorMonitoringSystem',
      'UnifiedStorage', 
      'StorageConfigManager',
      'ModuleFramework'
    ];
    
    for (const module of criticalModules) {
      await waitForGlobal(module, PRODUCTION_CONFIG.moduleTimeout);
      if (!window[module]) {
        throw new Error(`Critical module not available: ${module}`);
      }
    }
    
    // Initialize error monitoring first
    if (window.ErrorMonitoringSystem) {
      try {
        // TODO: Configure remoteEndpoint from a global config or environment variable
        const remoteLoggingEndpoint = null; // Example: window.APP_CONFIG.REMOTE_LOG_URL || null;

        await window.ErrorMonitoringSystem.initialize({
          enableConsoleLogging: PRODUCTION_CONFIG.debug,
          enableRemoteLogging: PRODUCTION_CONFIG.enableErrorReporting,
          remoteEndpoint: remoteLoggingEndpoint, // Set the endpoint here
          enableUserNotifications: false, // User notifications can be enabled if a proper system is in place
          enablePerformanceMonitoring: PRODUCTION_CONFIG.enablePerformanceMonitoring
        });
        console.log('✅ Error monitoring system initialized');
      } catch (error) {
        console.error('❌ Error monitoring initialization failed:', error);
        throw error;
      }
    }
    
    // Initialize storage systems
    let activeStorageConfig = null;
    if (window.StorageConfigManager) {
      try {
        await window.StorageConfigManager.initialize();
        console.log('✅ Storage config manager initialized');
        activeStorageConfig = await window.StorageConfigManager.getActiveStorageSettings();
        if (activeStorageConfig) {
          console.log(`✅ Active storage settings loaded: ${activeStorageConfig.providerType}`);
        } else {
          console.log('ℹ️ No active storage settings found, will use defaults.');
        }
      } catch (error) {
        console.error('❌ Storage config manager initialization or loading active settings failed:', error);
        // Proceed with default storage if config manager fails
      }
    }
    
    if (window.UnifiedStorage) {
      try {
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
          unifiedStorageInitOptions.primaryProvider = activeStorageConfig.providerType;
          // Ensure the primary provider is also in fallback if it's not localStorage
          if (activeStorageConfig.providerType !== 'localStorage') {
            unifiedStorageInitOptions.fallbackProviders = [activeStorageConfig.providerType, 'localStorage'];
          } else {
             unifiedStorageInitOptions.fallbackProviders = ['localStorage'];
          }
          // Pass the specific configuration for the chosen provider
          unifiedStorageInitOptions.providers[activeStorageConfig.providerType] = activeStorageConfig.config;

          // Also, ensure any other configurations from StorageConfigManager are loaded
          // This part might need more sophisticated merging if multiple providers can be active simultaneously
          // For now, we prioritize the activeStorageConfig
          const allStoredConfigs = await window.StorageConfigManager.exportConfigurations(); // This is encrypted
                                                                                             // We need a method to get decrypted configs for UnifiedStorage
                                                                                             // Or StorageConfigManager itself should initialize UnifiedStorage providers
          // For now, let's assume activeStorageConfig.config is what UnifiedStorage needs for its primary provider
          // unifiedStorageInitOptions.providers = { ... allDecryptedConfigs, [activeStorageConfig.providerType]: activeStorageConfig.config };

        } else {
          console.log('ℹ️ Initializing UnifiedStorage with default localStorage.');
        }

        await window.UnifiedStorage.initialize(unifiedStorageInitOptions);
        console.log(`✅ Unified storage initialized with primary: ${window.UnifiedStorage.getStats().primaryProvider}`);
      } catch (error) {
        console.warn('⚠️ Unified storage initialization failed, attempting fallback to basic localStorage:', error);
        try {
          // Simplified fallback initialization
          await window.UnifiedStorage.initialize({ primaryProvider: 'localStorage', fallbackProviders: ['localStorage'] });
          console.log('✅ Unified storage initialized with basic localStorage fallback.');
        } catch (fallbackError) {
          console.error('❌ Basic localStorage fallback for UnifiedStorage also failed:', fallbackError);
        }
      }
    }
    
    // Initialize module framework
    if (window.ModuleFramework) {
      try {
        await window.ModuleFramework.initialize();
        console.log('✅ Module framework initialized');
      } catch (error) {
        console.error('❌ Module framework initialization failed:', error);
        throw error;
      }
    }
  }

  /**
   * Initialize integration helper
   */
  async function initializeIntegrationHelper() {
    console.log('🔗 Initializing integration helper...');
    
    await waitForGlobal('ProductionIntegrationHelper', 10000);
    
    if (window.ProductionIntegrationHelper) {
      try {
        await window.ProductionIntegrationHelper.initialize();
        console.log('✅ Integration helper initialized');
      } catch (error) {
        console.warn('⚠️ Integration helper initialization failed:', error);
      }
    }
  }

  /**
   * Verify production readiness
   */
  async function verifyProductionReadiness() {
    console.log('🔍 Verifying production readiness...');
    
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
        } else {
          console.log(`✅ Production check passed: ${check.name}`);
        }
      } catch (error) {
        console.error(`❌ Production check failed: ${check.name}`, error);
        failedChecks.push(check.name);
      }
    }
    
    if (failedChecks.length > 0) {
      throw new Error(`Production readiness checks failed: ${failedChecks.join(', ')}`);
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
      }
      
      // Test error monitoring
      if (window.ErrorMonitoringSystem) {
        window.ErrorMonitoringSystem.logInfo('system', 'Production readiness verification completed');
      }
      
      console.log('✅ Production functionality tests passed');
      
    } catch (error) {
      console.error('❌ Production functionality tests failed:', error);
      throw error;
    }
  }

  /**
   * Setup production monitoring
   */
  function setupProductionMonitoring() {
    if (!PRODUCTION_CONFIG.enablePerformanceMonitoring) return;
    
    console.log('📊 Setting up production monitoring...');
    
    // Monitor performance
    if (window.performance && window.performance.observer) {
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
        console.warn('⚠️ Performance monitoring setup failed:', error);
      }
    }
    
    // Monitor memory usage
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        if (usedMB > 100) { // Log high memory usage
          console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }, 60000); // Check every minute
    }
    
    // Monitor errors
    window.addEventListener('error', (event) => {
      if (window.ErrorMonitoringSystem) {
        window.ErrorMonitoringSystem.logError('runtime', 'Unhandled error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }, event.error);
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (window.ErrorMonitoringSystem) {
        window.ErrorMonitoringSystem.logError('runtime', 'Unhandled promise rejection', {
          reason: event.reason
        });
      }
    });
    
    console.log('✅ Production monitoring setup complete');
  }

  /**
   * Emergency fallback for critical failures
   */
  async function emergencyFallback(error) {
    console.log('🚨 Activating emergency fallback...');
    
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
    window.ErrorMonitoringSystem.logError('system', 'Emergency fallback activated', {
      originalError: error.message,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Emergency fallback activated');
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
        // TODO: Replace '*' with a specific target origin for postMessage if the embedding context is known and trusted.
        // Using '*' can be a security risk if the application is embedded in malicious sites.
        // For a general purpose tool, this might need to be configurable or carefully documented.
        window.parent.postMessage({
          source: 'algorithmpress',
          event,
          data
        }, '*');
      }
    } catch (error) {
      // Ignore postMessage errors
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
    console.log('[ProductionInitialization] Calling initializeProduction after delay.');
    initializeProduction();
  }, PRODUCTION_CONFIG.initializationDelay);

  console.log('🏭 Production initialization script loaded, IIFE end');
})();
console.log('[ProductionInitialization] Script end');