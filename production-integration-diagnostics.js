/**
 * Production Integration Diagnostics for AlgorithmPress
 * Comprehensive diagnostic system to identify integration issues
 */

const ProductionDiagnostics = (function() {
  'use strict';

  const diagnostics = {
    moduleLoadOrder: [],
    dependencyIssues: [],
    initializationErrors: [],
    missingDependencies: [],
    loadingTimes: new Map(),
    criticalErrors: []
  };

  let diagnosticsStartTime = Date.now();

  /**
   * Initialize diagnostics system
   */
  function initialize() {
    console.log('🔍 Production Integration Diagnostics Starting...');
    
    // Monitor script loading
    monitorScriptLoading();
    
    // Monitor module framework
    monitorModuleFramework();
    
    // Monitor storage system
    monitorStorageSystem();
    
    // Monitor error system
    monitorErrorSystem();
    
    // Check for missing dependencies
    checkCriticalDependencies();
    
    // Set up periodic health checks
    setInterval(performHealthCheck, 5000);
    
    console.log('✅ Diagnostics system initialized');
  }

  /**
   * Monitor script loading order and timing
   */
  function monitorScriptLoading() {
    const scripts = document.querySelectorAll('script[src]');
    
    scripts.forEach((script, index) => {
      const src = script.src;
      const startTime = Date.now();
      
      script.addEventListener('load', () => {
        const loadTime = Date.now() - startTime;
        diagnostics.loadingTimes.set(src, loadTime);
        diagnostics.moduleLoadOrder.push({
          index,
          src,
          loadTime,
          timestamp: Date.now()
        });
        
        console.log(`📦 Script loaded: ${src.split('/').pop()} (${loadTime}ms)`);
      });
      
      script.addEventListener('error', (error) => {
        diagnostics.criticalErrors.push({
          type: 'script_load_error',
          src,
          error: error.message,
          timestamp: Date.now()
        });
        
        console.error(`❌ Script failed to load: ${src}`, error);
      });
    });
  }

  /**
   * Monitor module framework initialization
   */
  function monitorModuleFramework() {
    // Check if ModuleFramework exists
    const checkModuleFramework = () => {
      if (typeof window.ModuleFramework !== 'undefined') {
        console.log('✅ ModuleFramework detected');
        
        // Monitor module registration
        if (window.ModuleFramework.on) {
          window.ModuleFramework.on('module:registered', (data) => {
            console.log(`📋 Module registered: ${data.name} (${data.id})`);
          });
          
          window.ModuleFramework.on('module:loaded', (data) => {
            console.log(`🚀 Module loaded: ${data.name} (${data.id})`);
          });
          
          window.ModuleFramework.on('module:error', (data) => {
            diagnostics.initializationErrors.push({
              module: data.name,
              error: data.error,
              timestamp: Date.now()
            });
            console.error(`❌ Module error: ${data.name}`, data.error);
          });
        }
      } else {
        diagnostics.missingDependencies.push('ModuleFramework');
        console.warn('⚠️ ModuleFramework not found');
      }
    };
    
    // Check immediately and after delay
    checkModuleFramework();
    setTimeout(checkModuleFramework, 2000);
    setTimeout(checkModuleFramework, 5000);
  }

  /**
   * Monitor storage system initialization
   */
  function monitorStorageSystem() {
    const checkStorageSystem = () => {
      const storageComponents = [
        'UnifiedStorage',
        'StorageConfigManager', 
        'StorageUIManager'
      ];
      
      storageComponents.forEach(component => {
        if (typeof window[component] !== 'undefined') {
          console.log(`✅ ${component} detected`);
          
          // Check if it has initialize method
          if (typeof window[component].initialize === 'function') {
            console.log(`🔧 ${component} has initialize method`);
          }
        } else {
          diagnostics.missingDependencies.push(component);
          console.warn(`⚠️ ${component} not found`);
        }
      });
      
      // Check UnifiedStorage providers
      if (typeof window.UnifiedStorage !== 'undefined' && window.UnifiedStorage.PROVIDERS) {
        console.log('📊 Available storage providers:', Object.keys(window.UnifiedStorage.PROVIDERS));
      }
    };
    
    setTimeout(checkStorageSystem, 1000);
    setTimeout(checkStorageSystem, 3000);
    setTimeout(checkStorageSystem, 6000);
  }

  /**
   * Monitor error monitoring system
   */
  function monitorErrorSystem() {
    const checkErrorSystem = () => {
      if (typeof window.ErrorMonitoringSystem !== 'undefined') {
        console.log('✅ ErrorMonitoringSystem detected');
        
        // Try to initialize if not already done
        try {
          if (typeof window.ErrorMonitoringSystem.initialize === 'function') {
            window.ErrorMonitoringSystem.initialize({
              enableConsoleLogging: true,
              enableUserNotifications: false
            });
            console.log('🔧 ErrorMonitoringSystem initialized');
          }
        } catch (error) {
          console.error('❌ Failed to initialize ErrorMonitoringSystem:', error);
        }
      } else {
        diagnostics.missingDependencies.push('ErrorMonitoringSystem');
        console.warn('⚠️ ErrorMonitoringSystem not found');
      }
    };
    
    setTimeout(checkErrorSystem, 500);
    setTimeout(checkErrorSystem, 2000);
  }

  /**
   * Check for critical dependencies
   */
  function checkCriticalDependencies() {
    const criticalDependencies = [
      'ModuleFramework',
      'ErrorMonitoringSystem',
      'UnifiedStorage',
      'StorageConfigManager'
    ];
    
    setTimeout(() => {
      console.log('🔍 Checking critical dependencies...');
      
      criticalDependencies.forEach(dep => {
        if (typeof window[dep] === 'undefined') {
          diagnostics.criticalErrors.push({
            type: 'missing_dependency',
            dependency: dep,
            timestamp: Date.now()
          });
          console.error(`❌ Critical dependency missing: ${dep}`);
        } else {
          console.log(`✅ Critical dependency found: ${dep}`);
        }
      });
      
      // Check for circular dependencies
      checkCircularDependencies();
      
    }, 3000);
  }

  /**
   * Check for circular dependencies
   */
  function checkCircularDependencies() {
    console.log('🔄 Checking for circular dependencies...');
    
    // Check if modules are trying to initialize each other
    const initializationOrder = [
      'ErrorMonitoringSystem',
      'StorageConfigManager',
      'UnifiedStorage',
      'StorageUIManager',
      'ModuleFramework'
    ];
    
    initializationOrder.forEach((module, index) => {
      if (typeof window[module] !== 'undefined') {
        console.log(`📋 ${module} initialization order: ${index + 1}`);
      }
    });
  }

  /**
   * Perform periodic health check
   */
  function performHealthCheck() {
    const healthStatus = {
      timestamp: Date.now(),
      uptime: Date.now() - diagnosticsStartTime,
      moduleFramework: typeof window.ModuleFramework !== 'undefined',
      errorMonitoring: typeof window.ErrorMonitoringSystem !== 'undefined',
      unifiedStorage: typeof window.UnifiedStorage !== 'undefined',
      storageConfig: typeof window.StorageConfigManager !== 'undefined',
      storageUI: typeof window.StorageUIManager !== 'undefined'
    };
    
    // Check if all critical systems are running
    const criticalSystems = [
      healthStatus.moduleFramework,
      healthStatus.errorMonitoring,
      healthStatus.unifiedStorage
    ];
    
    const allSystemsOperational = criticalSystems.every(system => system);
    
    if (allSystemsOperational) {
      console.log('💚 Health Check: All critical systems operational');
    } else {
      console.warn('⚠️ Health Check: Some critical systems are not operational', healthStatus);
    }
    
    return healthStatus;
  }

  /**
   * Generate comprehensive diagnostic report
   */
  function generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - diagnosticsStartTime,
      moduleLoadOrder: diagnostics.moduleLoadOrder,
      loadingTimes: Object.fromEntries(diagnostics.loadingTimes),
      missingDependencies: diagnostics.missingDependencies,
      initializationErrors: diagnostics.initializationErrors,
      criticalErrors: diagnostics.criticalErrors,
      healthStatus: performHealthCheck(),
      recommendations: generateRecommendations()
    };
    
    console.log('📊 Diagnostic Report Generated:', report);
    return report;
  }

  /**
   * Generate recommendations based on diagnostics
   */
  function generateRecommendations() {
    const recommendations = [];
    
    if (diagnostics.missingDependencies.length > 0) {
      recommendations.push({
        type: 'missing_dependencies',
        severity: 'high',
        message: `Missing critical dependencies: ${diagnostics.missingDependencies.join(', ')}`,
        action: 'Ensure all required scripts are loaded before initialization'
      });
    }
    
    if (diagnostics.criticalErrors.length > 0) {
      recommendations.push({
        type: 'critical_errors',
        severity: 'high',
        message: `${diagnostics.criticalErrors.length} critical errors detected`,
        action: 'Review error logs and fix critical issues'
      });
    }
    
    if (diagnostics.initializationErrors.length > 0) {
      recommendations.push({
        type: 'initialization_errors',
        severity: 'medium',
        message: `${diagnostics.initializationErrors.length} module initialization errors`,
        action: 'Check module dependencies and initialization order'
      });
    }
    
    // Check loading times
    const slowLoadingScripts = Array.from(diagnostics.loadingTimes.entries())
      .filter(([src, time]) => time > 5000);
    
    if (slowLoadingScripts.length > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `${slowLoadingScripts.length} scripts loading slowly (>5s)`,
        action: 'Consider optimizing script loading or using local copies'
      });
    }
    
    return recommendations;
  }

  /**
   * Fix common integration issues automatically
   */
  function autoFix() {
    console.log('🔧 Attempting automatic fixes...');
    
    // Fix 1: Ensure proper initialization order
    setTimeout(() => {
      if (typeof window.ErrorMonitoringSystem !== 'undefined' && 
          typeof window.ErrorMonitoringSystem.initialize === 'function') {
        try {
          window.ErrorMonitoringSystem.initialize();
          console.log('✅ Auto-fix: ErrorMonitoringSystem initialized');
        } catch (error) {
          console.error('❌ Auto-fix failed for ErrorMonitoringSystem:', error);
        }
      }
    }, 1000);
    
    // Fix 2: Initialize storage config manager
    setTimeout(() => {
      if (typeof window.StorageConfigManager !== 'undefined' && 
          typeof window.StorageConfigManager.initialize === 'function') {
        try {
          window.StorageConfigManager.initialize();
          console.log('✅ Auto-fix: StorageConfigManager initialized');
        } catch (error) {
          console.error('❌ Auto-fix failed for StorageConfigManager:', error);
        }
      }
    }, 2000);
    
    // Fix 3: Initialize unified storage
    setTimeout(() => {
      if (typeof window.UnifiedStorage !== 'undefined' && 
          typeof window.UnifiedStorage.initialize === 'function') {
        try {
          window.UnifiedStorage.initialize({
            primaryProvider: 'localStorage',
            fallbackProviders: ['localStorage']
          });
          console.log('✅ Auto-fix: UnifiedStorage initialized');
        } catch (error) {
          console.error('❌ Auto-fix failed for UnifiedStorage:', error);
        }
      }
    }, 3000);
  }

  // Public API
  return {
    initialize,
    generateReport,
    performHealthCheck,
    autoFix,
    getDiagnostics: () => ({ ...diagnostics })
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ProductionDiagnostics.initialize();
  });
} else {
  ProductionDiagnostics.initialize();
}

// Export for global access
window.ProductionDiagnostics = ProductionDiagnostics;

// Auto-fix after 10 seconds
setTimeout(() => {
  ProductionDiagnostics.autoFix();
}, 10000);

// Generate report after 15 seconds
setTimeout(() => {
  const report = ProductionDiagnostics.generateReport();
  console.log('📋 Final Integration Report:', report);
}, 15000);