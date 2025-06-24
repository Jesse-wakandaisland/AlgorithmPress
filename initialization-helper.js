/**
 * AlgorithmPress Initialization Helper
 * This script helps ensure proper initialization of AlgorithmPress in an iframe
 */

// Function to inject this script into the AlgorithmPress iframe
function injectInitHelper() {
  // Create a script element
  const script = document.createElement('script');
  script.id = 'ap-init-helper';
  script.type = 'text/javascript';
  
  // The actual helper code to inject
  script.textContent = `
    (function() {
      // Configuration
      const DEBUG = true;
      const MAX_INIT_ATTEMPTS = 5;
      const INIT_INTERVAL = 1000; // 1 second between attempts
      
      // State tracking
      let initAttempts = 0;
      let initialized = false;
      let originalInitFunction = null;
      let checkInterval = null;
      
      // Logging function
      function log(message, type = 'info') {
        if (!DEBUG && type !== 'error') return;
        
        const prefix = '[AP-Helper]';
        if (type === 'error') {
          console.error(prefix, message);
        } else {
          console.log(prefix, message);
        }
        
        // Also notify parent frame
        try {
          window.parent.postMessage({
            from: 'algorithmpress-helper',
            type: type,
            message: message
          }, '*');
        } catch (e) {
          // Ignore postMessage errors
        }
      }
      
      // Initialize AlgorithmPress
      function initializeAlgorithmPress() {
        log('Attempting to initialize AlgorithmPress...');
        
        // Check if we've already initialized
        if (initialized) {
          log('AlgorithmPress already initialized');
          return true;
        }
        
        // Increment attempt counter
        initAttempts++;
        
        // Check if main components are loaded
        if (!window.AlgorithmPress) {
          log('AlgorithmPress main object not found', 'error');
          return false;
        }
        
        try {
          // Try to initialize all components
          if (typeof window.AlgorithmPress.init === 'function') {
            // Store original init function if not already stored
            if (!originalInitFunction) {
              originalInitFunction = window.AlgorithmPress.init;
              
              // Override with our own version
              window.AlgorithmPress.init = function() {
                log('Custom init function called');
                
                try {
                  // Call original init with iframe-specific options
                  originalInitFunction.call(window.AlgorithmPress, {
                    embedded: true,
                    forceInit: true,
                    autoStart: true
                  });
                  
                  // Mark as initialized
                  initialized = true;
                  
                  // Notify parent frame
                  notifyInitSuccess();
                  
                  return true;
                } catch (e) {
                  log('Error during custom init: ' + e.message, 'error');
                  return false;
                }
              };
            }
            
            // Call the init function
            log('Calling AlgorithmPress.init()');
            window.AlgorithmPress.init();
          }
          
          // Initialize each module if available
          const modules = [
            'Dock',
            'DesktopIntegration',
            'CommandPalette',
            'WordPressConnector'
          ];
          
          modules.forEach(moduleName => {
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
              try {
                log('Initializing module: ' + moduleName);
                window[moduleName].init();
              } catch (e) {
                log('Error initializing ' + moduleName + ': ' + e.message, 'error');
              }
            }
          });
          
          // Check if PHP-WASM is loaded and initialize
          if (window.PHPWASM && !window.PHPWASM.initialized) {
            log('Initializing PHP-WASM');
            try {
              if (typeof window.PHPWASM.init === 'function') {
                window.PHPWASM.init();
              }
              
              // Check if PHP environment is available
              if (window.PHP) {
                window.PHP.isPHPReady = true;
              }
            } catch (e) {
              log('Error initializing PHP-WASM: ' + e.message, 'error');
            }
          }
          
          // Check if initialization was successful
          if (checkInitializationSuccess()) {
            log('Initialization successful');
            initialized = true;
            notifyInitSuccess();
            return true;
          } else {
            log('Initialization incomplete');
          }
        } catch (e) {
          log('Error during initialization: ' + e.message, 'error');
        }
        
        // If we've reached max attempts, give up
        if (initAttempts >= MAX_INIT_ATTEMPTS) {
          log('Max initialization attempts reached, giving up', 'error');
          notifyInitFailure('Max attempts reached');
          return false;
        }
        
        return false;
      }
      
      // Check if initialization appears to be successful
      function checkInitializationSuccess() {
        // Check for critical components
        const criticalComponents = [
          window.AlgorithmPress,
          document.getElementById('php-wasm-container'),
          document.querySelector('.dock-container')
        ];
        
        // If any critical component is missing, initialization is not complete
        if (criticalComponents.some(comp => !comp)) {
          return false;
        }
        
        // Additional checks for specific components
        if (window.DesktopIntegration && !window.DesktopIntegration.initialized) {
          return false;
        }
        
        // Verify PHP-WASM is available
        if (!window.PHPWASM || (window.PHPWASM && !window.PHPWASM.initialized)) {
          return false;
        }
        
        return true;
      }
      
      // Notify parent frame of successful initialization
      function notifyInitSuccess() {
        try {
          log('Notifying parent frame of successful initialization');
          window.parent.postMessage({
            from: 'algorithmpress',
            action: 'initialized',
            success: true
          }, '*');
          
          // Clear the interval now that we've initialized
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        } catch (e) {
          log('Error notifying parent: ' + e.message, 'error');
        }
      }
      
      // Notify parent frame of initialization failure
      function notifyInitFailure(reason) {
        try {
          log('Notifying parent frame of initialization failure: ' + reason, 'error');
          window.parent.postMessage({
            from: 'algorithmpress',
            action: 'initialized',
            success: false,
            reason: reason
          }, '*');
          
          // Clear the interval since we're giving up
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        } catch (e) {
          log('Error notifying parent: ' + e.message, 'error');
        }
      }
      
      // Listen for messages from parent frame
      window.addEventListener('message', function(event) {
        try {
          const data = event.data;
          
          if (data && data.action) {
            log('Received message from parent: ' + data.action);
            
            switch (data.action) {
              case 'init':
                // Force initialization
                initializeAlgorithmPress();
                break;
                
              case 'setTheme':
                // Set theme if theme system is available
                if (window.AlgorithmPress && window.AlgorithmPress.setTheme) {
                  window.AlgorithmPress.setTheme(data.theme);
                }
                break;
                
              case 'setGradient':
                // Set background gradient if available
                if (window.AlgorithmPress && window.AlgorithmPress.setGradient) {
                  window.AlgorithmPress.setGradient(data.active);
                }
                break;
            }
          }
        } catch (e) {
          log('Error processing message: ' + e.message, 'error');
        }
      });
      
      // Start initialization process
      log('Initialization helper starting');
      
      // Try immediate initialization
      initializeAlgorithmPress();
      
      // Set up interval to repeatedly try initialization
      checkInterval = setInterval(function() {
        if (!initialized) {
          initializeAlgorithmPress();
        } else {
          clearInterval(checkInterval);
        }
      }, INIT_INTERVAL);
      
      // Setup MutationObserver to detect when key elements are added to DOM
      try {
        const observer = new MutationObserver(function(mutations) {
          for (let mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Check if any of our key elements were added
              const keyElements = [
                '#php-wasm-container',
                '.dock-container'
              ];
              
              for (let selector of keyElements) {
                if (document.querySelector(selector)) {
                  log('Key element detected: ' + selector);
                  initializeAlgorithmPress();
                  break;
                }
              }
            }
          }
        });
        
        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        log('MutationObserver initialized');
      } catch (e) {
        log('Error setting up MutationObserver: ' + e.message, 'error');
      }
    })();
  `;
  
  // Add the script to the iframe document
  try {
    const iframeDoc = document.getElementById('contentFrame').contentDocument || 
                      document.getElementById('contentFrame').contentWindow.document;
    iframeDoc.body.appendChild(script);
    console.log('Initialization helper script injected successfully');
    return true;
  } catch (e) {
    console.error('Failed to inject initialization helper:', e);
    return false;
  }
}

// Function to check if we need to manually inject init helper
function checkAndInjectHelper() {
  const contentFrame = document.getElementById('contentFrame');
  
  // Wait for iframe to load
  contentFrame.addEventListener('load', function() {
    // Short delay to allow initial scripts to load
    setTimeout(function() {
      try {
        // Check if AlgorithmPress is initialized
        const frameWindow = contentFrame.contentWindow;
        
        if (!frameWindow.AlgorithmPress || 
            !frameWindow.AlgorithmPress.initialized) {
          console.log('AlgorithmPress not initialized, injecting helper...');
          injectInitHelper();
        } else {
          console.log('AlgorithmPress already initialized');
        }
      } catch (e) {
        console.warn('Error checking initialization status:', e);
        // Inject helper anyway
        injectInitHelper();
      }
    }, 2000);
  });
}

// Add a button to manually inject the helper
function addHelperButton() {
  const button = document.createElement('button');
  button.id = 'injectHelperBtn';
  button.innerHTML = '<i class="fas fa-code-branch"></i> Inject Helper';
  button.title = 'Manually inject initialization helper';
  button.style.position = 'fixed';
  button.style.top = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.background = 'rgba(41, 128, 185, 0.8)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.padding = '8px 12px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', function() {
    injectInitHelper();
    this.innerHTML = '<i class="fas fa-check"></i> Helper Injected';
    setTimeout(() => {
      this.innerHTML = '<i class="fas fa-code-branch"></i> Inject Helper';
    }, 2000);
  });
  
  document.body.appendChild(button);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for our iframe container to be ready
  setTimeout(function() {
    checkAndInjectHelper();
    addHelperButton();
  }, 1000);
});
