/**
 * PHP-WASM Integration Module
 * Handles PHP environment initialization and management for the builder
 */

const PHPWasmIntegration = (function() {
  'use strict';
  
  // Private variables
  let phpLoaded = false;
  let phpModule = null;
  let fileSystem = null;
  let phpVersion = '8.2';
  let enabledExtensions = ['core', 'date', 'json', 'sqlite3'];
  let phpIniSettings = {};
  
  // Event listeners
  const listeners = {
    'ready': [],
    'error': [],
    'output': []
  };
  
  /**
   * Initialize PHP-WASM environment
   * @param {Object} config - Configuration options
   * @returns {Promise} - Promise that resolves when PHP is ready
   */
  function initialize(config = {}) {
    // Merge config with defaults
    phpVersion = config.phpVersion || phpVersion;
    enabledExtensions = config.extensions || enabledExtensions;
    phpIniSettings = config.phpIniSettings || phpIniSettings;
    
    // Create a promise that resolves when PHP-WASM is ready
    return new Promise((resolve, reject) => {
      if (typeof window.PHP === 'undefined') {
        // If PHP-WASM hasn't been loaded yet, load it
        loadScript('https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs', 'module')
          .then(() => {
            console.log('PHP-WASM script loaded, initializing...');
            // Script loaded, but we need to wait for PHP to be initialized
            checkPHPReady(resolve, reject);
          })
          .catch(error => {
            console.error('Failed to load PHP-WASM script:', error);
            reject(error);
          });
      } else {
        // PHP-WASM is already loaded, initialize PHP
        initializePhp(resolve, reject);
      }
    });
  }
  
  /**
   * Load a script dynamically
   * @param {string} src - Script URL
   * @param {string} type - Script type (default or module)
   * @returns {Promise} - Promise that resolves when script is loaded
   */
  function loadScript(src, type = 'text/javascript') {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = type;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Check if PHP is ready, with timeout
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @param {number} attempts - Number of attempts made
   */
  function checkPHPReady(resolve, reject, attempts = 0) {
    // If we've waited too long, reject
    if (attempts > 50) { // 5 seconds (100ms * 50)
      reject(new Error('Timeout waiting for PHP-WASM to initialize'));
      return;
    }
    
    // Check if PHP object exists
    if (typeof window.PHP !== 'undefined') {
      initializePhp(resolve, reject);
    } else {
      // Wait and try again
      setTimeout(() => checkPHPReady(resolve, reject, attempts + 1), 100);
    }
  }
  
  /**
   * Initialize PHP environment
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  function initializePhp(resolve, reject) {
    console.log('Initializing PHP environment...');
    
    try {
      // Create PHP instance
      phpModule = new window.PHP({
        phpVersion: phpVersion,
        extensions: enabledExtensions,
        postInit: (php) => {
          console.log('PHP initialized successfully');
          
          // Apply PHP.ini settings
          applyPhpIniSettings(php);
          
          // Set up file system
          fileSystem = php.fileSystem;
          
          // Mark as loaded
          phpLoaded = true;
          
          // Notify listeners
          notifyListeners('ready', { php });
          
          // Resolve the promise
          resolve(php);
        },
        postRun: () => {
          console.log('PHP is ready to run code');
        },
        onError: (error) => {
          console.error('PHP error:', error);
          notifyListeners('error', { error });
        },
        print: (output) => {
          console.log('PHP output:', output);
          notifyListeners('output', { output });
        },
        printErr: (error) => {
          console.error('PHP stderr:', error);
          notifyListeners('error', { error });
        }
      });
    } catch (error) {
      console.error('Failed to initialize PHP:', error);
      reject(error);
    }
  }
  
  /**
   * Apply PHP.ini settings
   * @param {Object} php - PHP instance
   */
  function applyPhpIniSettings(php) {
    for (const [key, value] of Object.entries(phpIniSettings)) {
      try {
        php.ini_set(key, value);
        console.log(`PHP.ini setting applied: ${key}=${value}`);
      } catch (error) {
        console.warn(`Failed to set PHP.ini setting ${key}=${value}:`, error);
      }
    }
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  function addEventListener(event, callback) {
    if (listeners[event]) {
      listeners[event].push(callback);
    }
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  function removeEventListener(event, callback) {
    if (listeners[event]) {
      const index = listeners[event].indexOf(callback);
      if (index !== -1) {
        listeners[event].splice(index, 1);
      }
    }
  }
  
  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  function notifyListeners(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(callback => callback(data));
    }
  }
  
  /**
   * Execute PHP code
   * @param {string} code - PHP code to execute
   * @returns {Promise<string>} - Promise that resolves with the output
   */
  function executeCode(code) {
    return new Promise((resolve, reject) => {
      if (!phpLoaded || !phpModule) {
        reject(new Error('PHP is not initialized'));
        return;
      }
      
      try {
        const output = phpModule.run(code);
        resolve(output);
      } catch (error) {
        console.error('Failed to execute PHP code:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Create a PHP file in the virtual filesystem
   * @param {string} path - File path
   * @param {string} content - File content
   * @returns {Promise<boolean>} - Promise that resolves with success status
   */
  function createFile(path, content) {
    return new Promise((resolve, reject) => {
      if (!phpLoaded || !fileSystem) {
        reject(new Error('PHP filesystem is not initialized'));
        return;
      }
      
      try {
        // Ensure directory exists
        const directory = path.substring(0, path.lastIndexOf('/'));
        if (directory && !fileSystem.exists(directory)) {
          fileSystem.mkdir(directory, { recursive: true });
        }
        
        // Write file
        fileSystem.writeFile(path, content);
        resolve(true);
      } catch (error) {
        console.error(`Failed to create file ${path}:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Read a PHP file from the virtual filesystem
   * @param {string} path - File path
   * @returns {Promise<string>} - Promise that resolves with file content
   */
  function readFile(path) {
    return new Promise((resolve, reject) => {
      if (!phpLoaded || !fileSystem) {
        reject(new Error('PHP filesystem is not initialized'));
        return;
      }
      
      try {
        if (!fileSystem.exists(path)) {
          reject(new Error(`File ${path} does not exist`));
          return;
        }
        
        const content = fileSystem.readFile(path, { encoding: 'utf8' });
        resolve(content);
      } catch (error) {
        console.error(`Failed to read file ${path}:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Execute a PHP file from the virtual filesystem
   * @param {string} path - File path
   * @returns {Promise<string>} - Promise that resolves with the output
   */
  function executeFile(path) {
    return executeCode(`<?php include('${path}'); ?>`);
  }
  
  /**
   * Create a directory in the virtual filesystem
   * @param {string} path - Directory path
   * @param {boolean} recursive - Create parent directories if they don't exist
   * @returns {Promise<boolean>} - Promise that resolves with success status
   */
  function createDirectory(path, recursive = true) {
    return new Promise((resolve, reject) => {
      if (!phpLoaded || !fileSystem) {
        reject(new Error('PHP filesystem is not initialized'));
        return;
      }
      
      try {
        fileSystem.mkdir(path, { recursive });
        resolve(true);
      } catch (error) {
        console.error(`Failed to create directory ${path}:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array<string>>} - Promise that resolves with array of file names
   */
  function listFiles(path) {
    return new Promise((resolve, reject) => {
      if (!phpLoaded || !fileSystem) {
        reject(new Error('PHP filesystem is not initialized'));
        return;
      }
      
      try {
        if (!fileSystem.exists(path)) {
          reject(new Error(`Directory ${path} does not exist`));
          return;
        }
        
        const files = fileSystem.readdir(path);
        resolve(files);
      } catch (error) {
        console.error(`Failed to list files in ${path}:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Set PHP version
   * @param {string} version - PHP version (e.g., '8.2')
   */
  function setPhpVersion(version) {
    phpVersion = version;
    
    // If PHP is already loaded, warn that it requires reinitialization
    if (phpLoaded) {
      console.warn('PHP version changed. You need to reinitialize PHP for this to take effect.');
    }
  }
  
  /**
   * Set enabled PHP extensions
   * @param {Array<string>} extensions - Array of extension names
   */
  function setEnabledExtensions(extensions) {
    enabledExtensions = extensions;
    
    // If PHP is already loaded, warn that it requires reinitialization
    if (phpLoaded) {
      console.warn('PHP extensions changed. You need to reinitialize PHP for this to take effect.');
    }
  }
  
  /**
   * Set PHP.ini settings
   * @param {Object} settings - Object with key-value pairs of settings
   */
  function setPhpIniSettings(settings) {
    phpIniSettings = settings;
    
    // If PHP is already loaded, apply settings
    if (phpLoaded && phpModule) {
      applyPhpIniSettings(phpModule);
    }
  }
  
  /**
   * Check if PHP is initialized
   * @returns {boolean} - Whether PHP is initialized
   */
  function isInitialized() {
    return phpLoaded;
  }
  
  /**
   * Get PHP version
   * @returns {string} - PHP version
   */
  function getPhpVersion() {
    return phpVersion;
  }
  
  /**
   * Get enabled extensions
   * @returns {Array<string>} - Array of enabled extension names
   */
  function getEnabledExtensions() {
    return [...enabledExtensions];
  }
  
  /**
   * Get PHP.ini settings
   * @returns {Object} - Object with key-value pairs of settings
   */
  function getPhpIniSettings() {
    return { ...phpIniSettings };
  }
  
  /**
   * Reset PHP environment
   * @returns {Promise} - Promise that resolves when PHP is reset
   */
  function reset() {
    return new Promise((resolve, reject) => {
      // If PHP is not initialized, resolve immediately
      if (!phpLoaded) {
        resolve();
        return;
      }
      
      // Reset PHP
      try {
        phpLoaded = false;
        phpModule = null;
        fileSystem = null;
        
        // Reinitialize PHP
        initialize({
          phpVersion,
          extensions: enabledExtensions,
          phpIniSettings
        })
          .then(resolve)
          .catch(reject);
      } catch (error) {
        console.error('Failed to reset PHP:', error);
        reject(error);
      }
    });
  }
  
  // Public API
  return {
    initialize,
    executeCode,
    executeFile,
    createFile,
    readFile,
    createDirectory,
    listFiles,
    setPhpVersion,
    setEnabledExtensions,
    setPhpIniSettings,
    isInitialized,
    getPhpVersion,
    getEnabledExtensions,
    getPhpIniSettings,
    addEventListener,
    removeEventListener,
    reset
  };
})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHPWasmIntegration;
}
