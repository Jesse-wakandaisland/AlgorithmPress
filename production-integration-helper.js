/**
 * Production Integration Helper for AlgorithmPress
 * Ensures proper module loading, dependency resolution, and error handling
 */
console.log('[ProductionIntegrationHelper] Script start');

const ProductionIntegrationHelper = (function() {
  'use strict';
  console.log('[ProductionIntegrationHelper] IIFE start');

  const INTEGRATION_CONFIG = {
    // Critical modules that must load first
    coreModules: [
      'ErrorMonitoringSystem',
      'StorageConfigManager', 
      'UnifiedStorage',
      'ModuleFramework'
    ],
    
    // UI modules that can load after core
    uiModules: [
      'StorageUIManager',
      'NaraUI',
      'PluginManagerUI'
    ],
    
    // Feature modules that load last
    featureModules: [
      'VoiceControlSystem',
      'NexusGrid',
      'PublishingSystem',
      'WordPressConnector'
    ],
    
    // Maximum wait time for dependencies
    maxWaitTime: 30000,
    
    // Retry configuration
    retryAttempts: 3,
    retryDelay: 1000
  };

  let initializationState = {
    coreInitialized: false,
    uiInitialized: false,
    featuresInitialized: false,
    errors: [],
    startTime: Date.now()
  };

  /**
   * Main integration initialization
   */
  async function initialize() {
    console.log('🚀 Starting Production Integration...');
    
    try {
      // Step 1: Initialize core systems
      await initializeCoreModules();
      
      // Step 2: Initialize UI modules
      await initializeUIModules();
      
      // Step 3: Initialize feature modules
      await initializeFeatureModules();
      
      // Step 4: Verify integration
      await verifyIntegration();
      
      console.log('✅ Production Integration Complete!');
      return true;
      
    } catch (error) {
      console.error('❌ Production Integration Failed:', error);
      initializationState.errors.push(error);
      
      // Attempt recovery
      await attemptRecovery();
      return false;
    }
  }

  /**
   * Initialize core modules in correct order
   */
  async function initializeCoreModules() {
    console.log('🔧 Initializing core modules...');
    
    // Wait for core modules to be available
    await waitForModules(INTEGRATION_CONFIG.coreModules);
    
    // Initialize ErrorMonitoringSystem first
    if (window.ErrorMonitoringSystem) {
      try {
        await window.ErrorMonitoringSystem.initialize({
          enableConsoleLogging: true,
          enableRemoteLogging: false,
          enableUserNotifications: true,
          enablePerformanceMonitoring: true
        });
        console.log('✅ ErrorMonitoringSystem initialized');
      } catch (error) {
        console.error('❌ ErrorMonitoringSystem initialization failed:', error);
        throw error;
      }
    }
    
    // Initialize StorageConfigManager
    if (window.StorageConfigManager) {
      try {
        await window.StorageConfigManager.initialize();
        console.log('✅ StorageConfigManager initialized');
      } catch (error) {
        console.error('❌ StorageConfigManager initialization failed:', error);
        throw error;
      }
    }
    
    // Initialize UnifiedStorage
    if (window.UnifiedStorage) {
      try {
        await window.UnifiedStorage.initialize({
          primaryProvider: 'localStorage',
          fallbackProviders: ['localStorage'],
          settings: {
            enableFailover: true,
            enableCaching: true,
            retryAttempts: 3
          }
        });
        console.log('✅ UnifiedStorage initialized');
      } catch (error) {
        console.error('❌ UnifiedStorage initialization failed:', error);
        // Don't throw - localStorage should always work
        console.warn('⚠️ Continuing with localStorage fallback');
      }
    }
    
    // Initialize ModuleFramework last
    if (window.ModuleFramework) {
      try {
        await window.ModuleFramework.initialize();
        console.log('✅ ModuleFramework initialized');
      } catch (error) {
        console.error('❌ ModuleFramework initialization failed:', error);
        throw error;
      }
    }
    
    initializationState.coreInitialized = true;
    console.log('✅ Core modules initialized successfully');
  }

  /**
   * Initialize UI modules
   */
  async function initializeUIModules() {
    console.log('🎨 Initializing UI modules...');
    
    // Wait for UI modules to be available
    await waitForModules(INTEGRATION_CONFIG.uiModules, false);
    
    // Initialize StorageUIManager
    if (window.StorageUIManager) {
      try {
        await window.StorageUIManager.initialize();
        console.log('✅ StorageUIManager initialized');
      } catch (error) {
        console.error('❌ StorageUIManager initialization failed:', error);
        // Non-critical, continue
      }
    }
    
    // Initialize NaraUI
    if (window.NaraUI) {
      try {
        await window.NaraUI.initialize();
        console.log('✅ NaraUI initialized');
      } catch (error) {
        console.error('❌ NaraUI initialization failed:', error);
        // Non-critical, continue
      }
    }
    
    // Initialize PluginManagerUI
    if (window.PluginManagerUI) {
      try {
        await window.PluginManagerUI.initialize();
        console.log('✅ PluginManagerUI initialized');
      } catch (error) {
        console.error('❌ PluginManagerUI initialization failed:', error);
        // Non-critical, continue
      }
    }
    
    initializationState.uiInitialized = true;
    console.log('✅ UI modules initialized successfully');
  }

  /**
   * Initialize feature modules
   */
  async function initializeFeatureModules() {
    console.log('🚀 Initializing feature modules...');
    
    // These are optional, so don't wait too long
    await waitForModules(INTEGRATION_CONFIG.featureModules, false, 5000);
    
    // Initialize each feature module if available
    const featureModules = [
      'VoiceControlSystem',
      'NexusGrid', 
      'PublishingSystem',
      'WordPressConnector',
      'EcommerceSystem'
    ];
    
    for (const moduleName of featureModules) {
      if (window[moduleName]) {
        try {
          if (typeof window[moduleName].initialize === 'function') {
            await window[moduleName].initialize();
            console.log(`✅ ${moduleName} initialized`);
          }
        } catch (error) {
          console.error(`❌ ${moduleName} initialization failed:`, error);
          // Non-critical, continue with other modules
        }
      }
    }
    
    initializationState.featuresInitialized = true;
    console.log('✅ Feature modules initialized successfully');
  }

  /**
   * Wait for modules to be available
   */
  async function waitForModules(moduleNames, required = true, timeout = INTEGRATION_CONFIG.maxWaitTime) {
    const startTime = Date.now();
    const missingModules = [...moduleNames];
    
    while (missingModules.length > 0 && (Date.now() - startTime) < timeout) {
      for (let i = missingModules.length - 1; i >= 0; i--) {
        const moduleName = missingModules[i];
        if (typeof window[moduleName] !== 'undefined') {
          missingModules.splice(i, 1);
          console.log(`📦 Module available: ${moduleName}`);
        }
      }
      
      if (missingModules.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (missingModules.length > 0) {
      const message = `Modules not available after ${timeout}ms: ${missingModules.join(', ')}`;
      console.warn('⚠️', message);
      
      if (required) {
        throw new Error(message);
      }
    }
  }

  /**
   * Verify integration is working correctly
   */
  async function verifyIntegration() {
    console.log('🔍 Verifying integration...');
    
    const verificationTests = [
      {
        name: 'ErrorMonitoringSystem',
        test: () => window.ErrorMonitoringSystem && typeof window.ErrorMonitoringSystem.logInfo === 'function'
      },
      {
        name: 'UnifiedStorage',
        test: () => window.UnifiedStorage && typeof window.UnifiedStorage.save === 'function'
      },
      {
        name: 'ModuleFramework',
        test: () => window.ModuleFramework && typeof window.ModuleFramework.registerModule === 'function'
      },
      {
        name: 'StorageConfigManager',
        test: () => window.StorageConfigManager && typeof window.StorageConfigManager.getConfig === 'function'
      }
    ];
    
    const failedTests = [];
    
    for (const test of verificationTests) {
      try {
        if (!test.test()) {
          failedTests.push(test.name);
        } else {
          console.log(`✅ Verification passed: ${test.name}`);
        }
      } catch (error) {
        console.error(`❌ Verification failed: ${test.name}`, error);
        failedTests.push(test.name);
      }
    }
    
    if (failedTests.length > 0) {
      throw new Error(`Integration verification failed for: ${failedTests.join(', ')}`);
    }
    
    // Test basic functionality
    try {
      // Test error monitoring
      if (window.ErrorMonitoringSystem) {
        window.ErrorMonitoringSystem.logInfo('system', 'Integration verification test');
      }
      
      // Test storage
      if (window.UnifiedStorage) {
        await window.UnifiedStorage.save('integration_test', { timestamp: Date.now() });
        const testData = await window.UnifiedStorage.load('integration_test');
        if (!testData) {
          throw new Error('Storage test failed');
        }
      }
      
      console.log('✅ Integration verification completed successfully');
      
    } catch (error) {
      console.error('❌ Integration functionality test failed:', error);
      throw error;
    }
  }

  /**
   * Attempt recovery from initialization failures
   */
  async function attemptRecovery() {
    console.log('🔄 Attempting recovery...');
    
    // Try to initialize critical modules individually with fallbacks
    const criticalModules = [
      {
        name: 'ErrorMonitoringSystem',
        fallback: () => {
          // Create minimal error monitoring
          window.ErrorMonitoringSystem = {
            logInfo: (category, message) => console.log(`[${category}] ${message}`),
            logError: (category, message, data, error) => console.error(`[${category}] ${message}`, data, error),
            initialize: () => Promise.resolve()
          };
        }
      },
      {
        name: 'UnifiedStorage',
        fallback: () => {
          // Create minimal storage using localStorage
          window.UnifiedStorage = {
            save: (key, data) => {
              localStorage.setItem(key, JSON.stringify(data));
              return Promise.resolve({ success: true });
            },
            load: (key) => {
              const data = localStorage.getItem(key);
              return Promise.resolve(data ? JSON.parse(data) : null);
            },
            initialize: () => Promise.resolve()
          };
        }
      }
    ];
    
    for (const module of criticalModules) {
      if (!window[module.name]) {
        console.log(`🔧 Creating fallback for ${module.name}`);
        module.fallback();
      }
    }
    
    console.log('✅ Recovery attempt completed');
  }

  /**
   * Get integration status
   */
  function getStatus() {
    return {
      ...initializationState,
      uptime: Date.now() - initializationState.startTime,
      timestamp: new Date().toISOString()
    };
  }

  // Public API
  return {
    initialize,
    getStatus,
    
    // Manual initialization methods
    initializeCoreModules,
    initializeUIModules, 
    initializeFeatureModules,
    verifyIntegration,
    attemptRecovery
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ProductionIntegrationHelper.initialize();
    }, 1000);
  });
} else {
  setTimeout(() => {
    ProductionIntegrationHelper.initialize();
  }, 1000);
}

// Export for global access
window.ProductionIntegrationHelper = ProductionIntegrationHelper;
console.log('[ProductionIntegrationHelper] Assigned to window.ProductionIntegrationHelper');
console.log('[ProductionIntegrationHelper] Script end');