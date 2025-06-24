/**
 * Debug Validation Logs for AlgorithmPress
 * Adds specific logging to validate our diagnostic assumptions
 */

(function() {
    'use strict';

    const DEBUG_CONFIG = {
        enableModuleLoadingLogs: true,
        enableStorageConflictLogs: true,
        enableTimingLogs: true,
        enableDependencyLogs: true
    };

    let moduleLoadTimes = new Map();
    let storageInitAttempts = [];
    let dependencyWaitTimes = new Map();

    /**
     * ASSUMPTION 1: Module Loading Race Conditions
     * Log script loading order and timing to identify race conditions
     */
    function validateModuleLoadingAssumption() {
        if (!DEBUG_CONFIG.enableModuleLoadingLogs) return;

        console.log('🔍 [DEBUG] Validating Module Loading Race Conditions...');

        // Monitor script loading order
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script, index) => {
            const src = script.src;
            const startTime = performance.now();
            
            script.addEventListener('load', () => {
                const loadTime = performance.now() - startTime;
                moduleLoadTimes.set(src, {
                    order: index,
                    loadTime,
                    timestamp: Date.now()
                });
                
                console.log(`📦 [MODULE-LOAD] ${src.split('/').pop()} loaded in ${loadTime.toFixed(2)}ms (order: ${index})`);
                
                // Check for potential race conditions
                if (loadTime > 5000) {
                    console.warn(`⚠️ [RACE-CONDITION] Slow loading script detected: ${src.split('/').pop()} (${loadTime.toFixed(2)}ms)`);
                }
            });

            script.addEventListener('error', () => {
                console.error(`❌ [MODULE-ERROR] Failed to load: ${src.split('/').pop()}`);
            });
        });

        // Monitor ModuleFramework initialization
        const checkModuleFramework = () => {
            if (typeof window.ModuleFramework !== 'undefined') {
                console.log('✅ [MODULE-FRAMEWORK] ModuleFramework available');
                
                // Hook into module loading events
                if (window.ModuleFramework.on) {
                    window.ModuleFramework.on('module:registered', (data) => {
                        console.log(`📋 [MODULE-REG] ${data.name} registered`);
                    });
                    
                    window.ModuleFramework.on('module:loaded', (data) => {
                        console.log(`🚀 [MODULE-LOADED] ${data.name} loaded successfully`);
                    });
                    
                    window.ModuleFramework.on('module:error', (data) => {
                        console.error(`❌ [MODULE-ERROR] ${data.name} failed:`, data.error);
                        
                        // Check if this is a dependency issue
                        if (data.error.message.includes('dependency') || data.error.message.includes('not found')) {
                            console.warn(`🔗 [DEPENDENCY-ISSUE] Potential dependency race condition for ${data.name}`);
                        }
                    });
                }
            } else {
                console.warn('⚠️ [MODULE-FRAMEWORK] ModuleFramework not yet available');
                setTimeout(checkModuleFramework, 1000);
            }
        };
        
        setTimeout(checkModuleFramework, 100);
    }

    /**
     * ASSUMPTION 2: Storage System Integration Conflicts
     * Log storage system initialization attempts to identify conflicts
     */
    function validateStorageConflictAssumption() {
        if (!DEBUG_CONFIG.enableStorageConflictLogs) return;

        console.log('🔍 [DEBUG] Validating Storage System Conflicts...');

        const storageModules = [
            'UnifiedStorage',
            'StorageConfigManager', 
            'StorageUIManager',
            'CubbitStorage'
        ];

        storageModules.forEach(moduleName => {
            const checkModule = () => {
                if (typeof window[moduleName] !== 'undefined') {
                    const initTime = Date.now();
                    storageInitAttempts.push({
                        module: moduleName,
                        timestamp: initTime,
                        available: true
                    });
                    
                    console.log(`💾 [STORAGE-AVAILABLE] ${moduleName} detected at ${new Date(initTime).toISOString()}`);
                    
                    // Check for initialization method
                    if (typeof window[moduleName].initialize === 'function') {
                        console.log(`🔧 [STORAGE-INIT] ${moduleName} has initialize method`);
                        
                        // Monitor initialization attempts
                        const originalInit = window[moduleName].initialize;
                        window[moduleName].initialize = function(...args) {
                            const startTime = performance.now();
                            console.log(`🚀 [STORAGE-INIT-START] ${moduleName} initialization starting...`);
                            
                            try {
                                const result = originalInit.apply(this, args);
                                
                                if (result && typeof result.then === 'function') {
                                    return result.then(res => {
                                        const duration = performance.now() - startTime;
                                        console.log(`✅ [STORAGE-INIT-SUCCESS] ${moduleName} initialized in ${duration.toFixed(2)}ms`);
                                        return res;
                                    }).catch(error => {
                                        const duration = performance.now() - startTime;
                                        console.error(`❌ [STORAGE-INIT-ERROR] ${moduleName} failed after ${duration.toFixed(2)}ms:`, error);
                                        throw error;
                                    });
                                } else {
                                    const duration = performance.now() - startTime;
                                    console.log(`✅ [STORAGE-INIT-SUCCESS] ${moduleName} initialized synchronously in ${duration.toFixed(2)}ms`);
                                    return result;
                                }
                            } catch (error) {
                                const duration = performance.now() - startTime;
                                console.error(`❌ [STORAGE-INIT-ERROR] ${moduleName} failed synchronously after ${duration.toFixed(2)}ms:`, error);
                                throw error;
                            }
                        };
                    }
                } else {
                    storageInitAttempts.push({
                        module: moduleName,
                        timestamp: Date.now(),
                        available: false
                    });
                    console.warn(`⚠️ [STORAGE-MISSING] ${moduleName} not available`);
                }
            };
            
            // Check immediately and periodically
            checkModule();
            setTimeout(checkModule, 2000);
            setTimeout(checkModule, 5000);
        });

        // Check for storage conflicts after 10 seconds
        setTimeout(() => {
            const availableModules = storageInitAttempts.filter(attempt => attempt.available);
            if (availableModules.length > 2) {
                console.warn(`⚠️ [STORAGE-CONFLICT] Multiple storage modules detected simultaneously:`, 
                    availableModules.map(m => m.module));
            }
        }, 10000);
    }

    /**
     * Monitor dependency wait times
     */
    function monitorDependencyWaitTimes() {
        if (!DEBUG_CONFIG.enableDependencyLogs) return;

        console.log('🔍 [DEBUG] Monitoring Dependency Wait Times...');

        // Override the waitForGlobal function if it exists
        const originalWaitForGlobal = window.waitForGlobal;
        if (typeof originalWaitForGlobal === 'function') {
            window.waitForGlobal = function(globalName, timeout = 10000) {
                const startTime = performance.now();
                console.log(`⏳ [DEPENDENCY-WAIT] Waiting for ${globalName} (timeout: ${timeout}ms)`);
                
                return originalWaitForGlobal(globalName, timeout).then(result => {
                    const waitTime = performance.now() - startTime;
                    dependencyWaitTimes.set(globalName, waitTime);
                    console.log(`✅ [DEPENDENCY-READY] ${globalName} available after ${waitTime.toFixed(2)}ms`);
                    return result;
                }).catch(error => {
                    const waitTime = performance.now() - startTime;
                    console.error(`❌ [DEPENDENCY-TIMEOUT] ${globalName} not available after ${waitTime.toFixed(2)}ms`);
                    throw error;
                });
            };
        }
    }

    /**
     * Generate diagnostic report
     */
    function generateDiagnosticReport() {
        setTimeout(() => {
            console.log('\n📊 [DIAGNOSTIC-REPORT] AlgorithmPress Debug Validation Results:');
            console.log('='.repeat(60));
            
            // Module loading analysis
            console.log('\n📦 MODULE LOADING ANALYSIS:');
            if (moduleLoadTimes.size > 0) {
                const sortedModules = Array.from(moduleLoadTimes.entries())
                    .sort((a, b) => a[1].order - b[1].order);
                
                sortedModules.forEach(([src, data]) => {
                    const status = data.loadTime > 5000 ? '⚠️ SLOW' : '✅ OK';
                    console.log(`  ${status} ${src.split('/').pop()}: ${data.loadTime.toFixed(2)}ms (order: ${data.order})`);
                });
                
                const slowModules = sortedModules.filter(([, data]) => data.loadTime > 5000);
                if (slowModules.length > 0) {
                    console.warn(`\n⚠️ RACE CONDITION RISK: ${slowModules.length} slow-loading modules detected`);
                }
            } else {
                console.log('  No module loading data collected');
            }
            
            // Storage system analysis
            console.log('\n💾 STORAGE SYSTEM ANALYSIS:');
            if (storageInitAttempts.length > 0) {
                const availableModules = storageInitAttempts.filter(attempt => attempt.available);
                const missingModules = storageInitAttempts.filter(attempt => !attempt.available);
                
                console.log(`  Available: ${availableModules.map(m => m.module).join(', ')}`);
                console.log(`  Missing: ${missingModules.map(m => m.module).join(', ')}`);
                
                if (availableModules.length > 2) {
                    console.warn(`  ⚠️ POTENTIAL CONFLICT: ${availableModules.length} storage modules active`);
                }
            } else {
                console.log('  No storage initialization data collected');
            }
            
            // Dependency analysis
            console.log('\n🔗 DEPENDENCY ANALYSIS:');
            if (dependencyWaitTimes.size > 0) {
                dependencyWaitTimes.forEach((waitTime, globalName) => {
                    const status = waitTime > 5000 ? '⚠️ SLOW' : '✅ OK';
                    console.log(`  ${status} ${globalName}: ${waitTime.toFixed(2)}ms`);
                });
            } else {
                console.log('  No dependency wait data collected');
            }
            
            console.log('\n='.repeat(60));
            
            // Recommendations
            const recommendations = [];
            
            if (Array.from(moduleLoadTimes.values()).some(data => data.loadTime > 5000)) {
                recommendations.push('Consider optimizing slow-loading modules or loading them earlier');
            }
            
            const availableStorageModules = storageInitAttempts.filter(attempt => attempt.available).length;
            if (availableStorageModules > 2) {
                recommendations.push('Multiple storage modules detected - consider consolidating to avoid conflicts');
            }
            
            if (Array.from(dependencyWaitTimes.values()).some(time => time > 5000)) {
                recommendations.push('Long dependency wait times detected - review initialization order');
            }
            
            if (recommendations.length > 0) {
                console.log('💡 RECOMMENDATIONS:');
                recommendations.forEach((rec, index) => {
                    console.log(`  ${index + 1}. ${rec}`);
                });
            } else {
                console.log('✅ No critical issues detected in validation');
            }
            
        }, 15000); // Generate report after 15 seconds
    }

    // Initialize validation
    function initializeValidation() {
        console.log('🔍 [DEBUG] AlgorithmPress Debug Validation Starting...');
        
        validateModuleLoadingAssumption();
        validateStorageConflictAssumption();
        monitorDependencyWaitTimes();
        generateDiagnosticReport();
    }

    // Start validation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeValidation);
    } else {
        initializeValidation();
    }

    // Export for global access
    window.DebugValidation = {
        getModuleLoadTimes: () => moduleLoadTimes,
        getStorageInitAttempts: () => storageInitAttempts,
        getDependencyWaitTimes: () => dependencyWaitTimes,
        generateReport: generateDiagnosticReport
    };

})();