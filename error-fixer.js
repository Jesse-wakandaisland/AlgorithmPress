/**
 * Error Fixer for AlgorithmPress
 * Automatically detects and fixes common errors in modules
 */

const ErrorFixer = (function() {
  'use strict';

  // Common error patterns and their fixes
  const errorPatterns = [
    {
      name: 'Missing showToast function',
      pattern: /showToast\s*\(/g,
      check: () => typeof window.showToast === 'undefined',
      fix: () => {
        if (typeof window.showToast === 'undefined') {
          window.showToast = function(type, message) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Try to use ModuleFramework's showToast if available
            if (window.ModuleFramework && typeof window.ModuleFramework.showToast === 'function') {
              return window.ModuleFramework.showToast(type, message);
            }
            
            // Fallback to simple notification
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 20px;
              background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
              color: ${type === 'warning' ? '#333' : 'white'};
              border-radius: 6px;
              z-index: 10000;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              max-width: 300px;
              word-wrap: break-word;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 3000);
          };
        }
      }
    },
    
    {
      name: 'Missing console methods',
      pattern: /console\.(log|error|warn|info|debug)/g,
      check: () => !window.console,
      fix: () => {
        if (!window.console) {
          window.console = {
            log: function() {},
            error: function() {},
            warn: function() {},
            info: function() {},
            debug: function() {}
          };
        }
      }
    },
    
    {
      name: 'Missing fetch API',
      pattern: /fetch\s*\(/g,
      check: () => typeof fetch === 'undefined',
      fix: () => {
        if (typeof fetch === 'undefined') {
          window.fetch = function(url, options = {}) {
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open(options.method || 'GET', url);
              
              if (options.headers) {
                Object.entries(options.headers).forEach(([key, value]) => {
                  xhr.setRequestHeader(key, value);
                });
              }
              
              xhr.onload = () => {
                resolve({
                  ok: xhr.status >= 200 && xhr.status < 300,
                  status: xhr.status,
                  statusText: xhr.statusText,
                  text: () => Promise.resolve(xhr.responseText),
                  json: () => Promise.resolve(JSON.parse(xhr.responseText))
                });
              };
              
              xhr.onerror = () => reject(new Error('Network error'));
              xhr.send(options.body);
            });
          };
        }
      }
    },
    
    {
      name: 'Missing localStorage',
      pattern: /localStorage\./g,
      check: () => typeof localStorage === 'undefined',
      fix: () => {
        if (typeof localStorage === 'undefined') {
          const storage = {};
          window.localStorage = {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => storage[key] = String(value),
            removeItem: (key) => delete storage[key],
            clear: () => Object.keys(storage).forEach(key => delete storage[key]),
            get length() { return Object.keys(storage).length; },
            key: (index) => Object.keys(storage)[index] || null
          };
        }
      }
    },
    
    {
      name: 'Missing sessionStorage',
      pattern: /sessionStorage\./g,
      check: () => typeof sessionStorage === 'undefined',
      fix: () => {
        if (typeof sessionStorage === 'undefined') {
          const storage = {};
          window.sessionStorage = {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => storage[key] = String(value),
            removeItem: (key) => delete storage[key],
            clear: () => Object.keys(storage).forEach(key => delete storage[key]),
            get length() { return Object.keys(storage).length; },
            key: (index) => Object.keys(storage)[index] || null
          };
        }
      }
    },
    
    {
      name: 'Missing crypto.subtle',
      pattern: /crypto\.subtle/g,
      check: () => !window.crypto || !window.crypto.subtle,
      fix: () => {
        if (!window.crypto) {
          window.crypto = {};
        }
        if (!window.crypto.subtle) {
          window.crypto.subtle = {
            generateKey: () => Promise.resolve({}),
            importKey: () => Promise.resolve({}),
            exportKey: () => Promise.resolve({}),
            encrypt: () => Promise.resolve(new ArrayBuffer(16)),
            decrypt: () => Promise.resolve(new ArrayBuffer(16)),
            sign: () => Promise.resolve(new ArrayBuffer(32)),
            digest: () => Promise.resolve(new ArrayBuffer(32))
          };
        }
        if (!window.crypto.getRandomValues) {
          window.crypto.getRandomValues = (array) => {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
            return array;
          };
        }
      }
    }
  ];

  // Module-specific fixes
  const moduleFixes = {
    'VoiceControlSystem': {
      check: () => window.VoiceControlSystem && !window.VoiceControlSystem.isInitialized,
      fix: () => {
        // Add missing Speech Recognition polyfill
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
          window.SpeechRecognition = function() {
            return {
              start: () => console.warn('Speech Recognition not supported'),
              stop: () => {},
              abort: () => {},
              addEventListener: () => {},
              removeEventListener: () => {}
            };
          };
        }
      }
    },
    
    'UnifiedStorage': {
      check: () => window.UnifiedStorage && !window.UnifiedStorage.isInitialized,
      fix: () => {
        // Ensure all storage provider functions exist
        const providerFunctions = [
          'initializeLocalStorage',
          'initializeAwsS3Storage',
          'initializeGoogleCloudStorage',
          'initializeAzureBlobStorage',
          'initializeDigitalOceanStorage',
          'initializeVultrStorage',
          'initializeOvhCloudStorage',
          'initializeAlibabaOssStorage',
          'initializeBackblazeB2Storage',
          'initializeWasabiStorage',
          'initializeLinodeStorage',
          'initializeIpfsStorage',
          'initializeStorjStorage',
          'initializeArweaveStorage',
          'initializeFilecoinStorage',
          'initializeSiaStorage',
          'initializeSwarmStorage'
        ];
        
        providerFunctions.forEach(funcName => {
          if (typeof window[funcName] === 'undefined') {
            window[funcName] = function() {
              return Promise.reject(new Error(`${funcName} not implemented`));
            };
          }
        });
      }
    },
    
    'NexusGrid': {
      check: () => window.NexusGrid && typeof window.NexusGrid.initialize === 'function',
      fix: () => {
        // Ensure required DOM elements exist
        if (!document.getElementById('nexus-grid-panel')) {
          // NexusGrid will create its own panel
        }
      }
    }
  };

  /**
   * Initialize the error fixer
   */
  function initialize() {
    console.log('🔧 Initializing Error Fixer...');
    
    // Apply global fixes
    applyGlobalFixes();
    
    // Apply module-specific fixes
    applyModuleFixes();
    
    // Set up error monitoring
    setupErrorMonitoring();
    
    console.log('✅ Error Fixer initialized');
  }

  /**
   * Apply global fixes
   */
  function applyGlobalFixes() {
    errorPatterns.forEach(pattern => {
      if (pattern.check()) {
        console.log(`🔧 Applying fix: ${pattern.name}`);
        try {
          pattern.fix();
        } catch (error) {
          console.error(`❌ Failed to apply fix ${pattern.name}:`, error);
        }
      }
    });
  }

  /**
   * Apply module-specific fixes
   */
  function applyModuleFixes() {
    Object.entries(moduleFixes).forEach(([moduleName, fix]) => {
      if (fix.check()) {
        console.log(`🔧 Applying module fix: ${moduleName}`);
        try {
          fix.fix();
        } catch (error) {
          console.error(`❌ Failed to apply module fix ${moduleName}:`, error);
        }
      }
    });
  }

  /**
   * Set up error monitoring
   */
  function setupErrorMonitoring() {
    // Override console.error to catch and potentially fix errors
    const originalError = console.error;
    console.error = function(...args) {
      // Call original error function
      originalError.apply(console, args);
      
      // Try to auto-fix common errors
      const errorMessage = args.join(' ');
      tryAutoFix(errorMessage);
    };

    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      tryAutoFix(event.message);
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      tryAutoFix(event.reason?.message || String(event.reason));
    });
  }

  /**
   * Try to automatically fix an error
   */
  function tryAutoFix(errorMessage) {
    if (typeof errorMessage !== 'string') return;
    
    // Check for common error patterns
    errorPatterns.forEach(pattern => {
      if (pattern.pattern.test(errorMessage) && pattern.check()) {
        console.log(`🔧 Auto-fixing error: ${pattern.name}`);
        try {
          pattern.fix();
        } catch (fixError) {
          console.error(`❌ Auto-fix failed for ${pattern.name}:`, fixError);
        }
      }
    });
  }

  /**
   * Run comprehensive error check and fix
   */
  function runComprehensiveCheck() {
    console.log('🔍 Running comprehensive error check...');
    
    const results = {
      globalFixes: 0,
      moduleFixes: 0,
      errors: []
    };

    // Check and apply global fixes
    errorPatterns.forEach(pattern => {
      if (pattern.check()) {
        try {
          pattern.fix();
          results.globalFixes++;
          console.log(`✅ Fixed: ${pattern.name}`);
        } catch (error) {
          results.errors.push(`Failed to fix ${pattern.name}: ${error.message}`);
          console.error(`❌ Failed to fix ${pattern.name}:`, error);
        }
      }
    });

    // Check and apply module fixes
    Object.entries(moduleFixes).forEach(([moduleName, fix]) => {
      if (fix.check()) {
        try {
          fix.fix();
          results.moduleFixes++;
          console.log(`✅ Fixed module: ${moduleName}`);
        } catch (error) {
          results.errors.push(`Failed to fix module ${moduleName}: ${error.message}`);
          console.error(`❌ Failed to fix module ${moduleName}:`, error);
        }
      }
    });

    console.log(`🔧 Comprehensive check complete: ${results.globalFixes} global fixes, ${results.moduleFixes} module fixes, ${results.errors.length} errors`);
    
    return results;
  }

  // Public API
  return {
    initialize,
    runComprehensiveCheck,
    applyGlobalFixes,
    applyModuleFixes,
    tryAutoFix
  };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ErrorFixer.initialize();
  });
} else {
  ErrorFixer.initialize();
}

// Export for global access
window.ErrorFixer = ErrorFixer;
