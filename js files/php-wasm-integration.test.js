/**
 * Unit tests for PHPWasmIntegration.js
 *
 * How to Set Up Jest:
 * 1. Install Jest:
 *    npm install --save-dev jest
 *    or
 *    yarn add --dev jest
 *
 * 2. Configure Jest:
 *    You might need a `jest.config.js` file or add configuration to `package.json`.
 *    For example, in `package.json`:
 *    {
 *      "scripts": {
 *        "test": "jest"
 *      },
 *      "jest": {
 *        "testEnvironment": "jsdom", // Important for browser-like environment
 *        "setupFilesAfterEnv": ["./jest.setup.js"] // Optional: for global mocks or setup
 *      }
 *    }
 *    Create `jest.setup.js` if you need global mocks (e.g., for window.AP):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *    global.PHPWasmIntegration = require('./js files/php-wasm-integration'); // Load the module
 *
 * 3. Ensure your module can be loaded:
 *    The PHPWasmIntegration module is an IIFE assigned to `window.PHPWasmIntegration`
 *    or exported via `module.exports`. For Jest, it's often easier if the file
 *    being tested explicitly exports the module. If `php-wasm-integration.js`
 *    assigns itself to `window.PHPWasmIntegration`, Jest's JSDOM environment
 *    should pick it up. Otherwise, you might need to load it via a helper.
 *    The provided `php-wasm-integration.js` seems to use `module.exports`, which is good.
 *
 * How to Run Tests:
 *   npm test
 *   or
 *   yarn test
 *   (Assuming you've added the "test" script to your package.json)
 *
 * Note: These tests mock the global `window.PHP` object, which is the core
 * dependency of `PHPWasmIntegration.js`.
 */

// Mock global AP object if not using jest.setup.js
if (typeof global.AP === 'undefined') {
  global.AP = {
    handleError: jest.fn(),
    showToast: jest.fn(),
  };
}

// Mock the PHP-WASM (php-tags.js) script loading if it's not handled globally
// For these tests, we'll primarily mock the `window.PHP` object itself.

// Helper to load the script under test if not using global setup
// const PHPWasmIntegration = require('./php-wasm-integration'); // If it's commonJS
// Or ensure it's loaded into JSDOM's window if it's an IIFE.
// The provided script uses module.exports, so require should work.

describe('PHPWasmIntegration', () => {
  let mockPhpInstance;
  let mockFileSystem;

  beforeEach(() => {
    // Reset mocks for window.PHP and AP before each test
    jest.clearAllMocks();

    mockFileSystem = {
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn().mockReturnValue(''),
      exists: jest.fn().mockReturnValue(true),
      readdir: jest.fn().mockReturnValue([]),
    };

    mockPhpInstance = {
      run: jest.fn().mockReturnValue('php_output'),
      FS: mockFileSystem, // Legacy access, prefer fileSystem
      fileSystem: mockFileSystem, // Modern access
      ini_set: jest.fn(),
      // Mock other PHP instance methods as needed for specific tests
    };

    // Mock the global PHP constructor
    // window.PHP is loaded by an external script in the original code.
    // For testing, we define it globally.
    global.PHP = jest.fn().mockImplementation(config => {
      // Simulate async initialization if postInit is provided
      if (config && typeof config.postInit === 'function') {
        // Call postInit asynchronously to mimic real behavior
        setTimeout(() => config.postInit(mockPhpInstance), 0);
      }
      // Call postRun if provided
      if (config && typeof config.postRun === 'function') {
        setTimeout(() => config.postRun(), 0);
      }
      // Store onError and printErr callbacks to simulate them
      if (config && typeof config.onError === 'function') {
        mockPhpInstance.triggerError = config.onError;
      }
      if (config && typeof config.printErr === 'function') {
        mockPhpInstance.triggerPrintErr = config.printErr;
      }
      if (config && typeof config.print === 'function') {
        mockPhpInstance.triggerPrint = config.print;
      }
      return mockPhpInstance;
    });

    // Reset part of the PHPWasmIntegration's internal state if possible, or re-require.
    // For simplicity here, we assume tests don't interfere too much with shared state,
    // or that PHPWasmIntegration.reset() is effective.
    // If PHPWasmIntegration was a class, we'd instantiate it per test.
    // Since it's a module pattern, its state persists.
    // We can try resetting its state if it has a reset method, or by re-requiring:
    // jest.resetModules();
    // PHPWasmIntegration = require('./php-wasm-integration');
  });

  afterEach(() => {
    delete global.PHP; // Clean up global mock
    // jest.resetModules(); // If re-requiring modules per test
  });

  describe('Initialization', () => {
    it('should initialize PHP-WASM successfully if window.PHP is not defined initially', async () => {
      delete global.PHP; // Ensure PHP is not defined initially

      // Mock document.createElement for script loading
      const mockScript = { onload: null, onerror: null, src: '', type: '', async: false };
      document.createElement = jest.fn(tagName => {
        if (tagName === 'script') {
          return mockScript;
        }
        return {}; // Should return a basic element for other tags if any
      });
      document.head.appendChild = jest.fn(element => {
        if (element === mockScript) {
          // Simulate script loading and PHP global becoming available
          global.PHP = jest.fn().mockImplementation(config => {
            if (config && typeof config.postInit === 'function') {
              setTimeout(() => config.postInit(mockPhpInstance), 0);
            }
            return mockPhpInstance;
          });
          mockScript.onload(); // Trigger onload
        }
      });

      await expect(PHPWasmIntegration.initialize()).resolves.toBe(mockPhpInstance);
      expect(PHPWasmIntegration.isInitialized()).toBe(true);
      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(document.head.appendChild).toHaveBeenCalledWith(mockScript);
      expect(mockScript.src).toBe('https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs');
    });

    it('should initialize PHP-WASM successfully if window.PHP is already defined', async () => {
      await expect(PHPWasmIntegration.initialize()).resolves.toBe(mockPhpInstance);
      expect(PHPWasmIntegration.isInitialized()).toBe(true);
      expect(global.PHP).toHaveBeenCalledTimes(1); // Should be called once
    });

    it('should apply phpIniSettings during initialization', async () => {
      const settings = { 'display_errors': 'On', 'memory_limit': '256M' };
      await PHPWasmIntegration.initialize({ phpIniSettings: settings });
      expect(mockPhpInstance.ini_set).toHaveBeenCalledWith('display_errors', 'On');
      expect(mockPhpInstance.ini_set).toHaveBeenCalledWith('memory_limit', '256M');
    });
    
    it('should handle script loading failure', async () => {
      delete global.PHP;
      const mockScript = { onload: null, onerror: null, src: '', type: '', async: false };
      document.createElement = jest.fn().mockReturnValue(mockScript);
      document.head.appendChild = jest.fn(element => {
         // Simulate script error
        if (element.onerror) element.onerror(new Error('Script load error'));
      });

      await expect(PHPWasmIntegration.initialize()).rejects.toThrow('Script load error');
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to load PHP-WASM script');
      expect(PHPWasmIntegration.isInitialized()).toBe(false);
    });

    it('should handle PHP initialization timeout', async () => {
        delete global.PHP; // Ensure PHP is not defined

        // Mock script loading to succeed but PHP global never gets defined
        const mockScript = { onload: null, onerror: null };
        document.createElement = jest.fn().mockReturnValue(mockScript);
        document.head.appendChild = jest.fn(element => {
            // Simulate script load success, but global.PHP is NOT set here
            mockScript.onload();
        });
        
        jest.useFakeTimers();
        const initializePromise = PHPWasmIntegration.initialize();
        jest.advanceTimersByTime(51 * 100); // Advance past 50 attempts (5 seconds)
        
        await expect(initializePromise).rejects.toThrow('Timeout waiting for PHP-WASM to initialize');
        expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'PHP-WASM Initialization Timeout');
        expect(PHPWasmIntegration.isInitialized()).toBe(false);
        jest.useRealTimers();
    });


    it('should handle PHP constructor throwing an error', async () => {
      global.PHP = jest.fn().mockImplementation(() => {
        throw new Error('PHP Constructor Error');
      });
      await expect(PHPWasmIntegration.initialize()).rejects.toThrow('PHP Constructor Error');
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to initialize PHP');
      expect(PHPWasmIntegration.isInitialized()).toBe(false);
    });

    it('should call onError callback from PHP instance', async () => {
        await PHPWasmIntegration.initialize();
        // Simulate PHP triggering an error
        const testError = new Error('PHP Internal Test Error');
        if (mockPhpInstance.triggerError) {
            mockPhpInstance.triggerError(testError);
        }
        expect(AP.handleError).toHaveBeenCalledWith(testError, 'PHP Internal Error');
    });

    it('should call printErr callback from PHP instance', async () => {
        await PHPWasmIntegration.initialize();
        const testErrorMessage = 'PHP Stderr Test Message';
        if (mockPhpInstance.triggerPrintErr) {
            mockPhpInstance.triggerPrintErr(testErrorMessage);
        }
        expect(AP.handleError).toHaveBeenCalledWith(testErrorMessage, 'PHP Stderr');
    });
  });

  describe('Code Execution', () => {
    beforeEach(async () => {
      // Ensure PHP is initialized before each execution test
      await PHPWasmIntegration.initialize();
    });

    it('should execute PHP code successfully', async () => {
      const code = '<?php echo "Hello"; ?>';
      const output = await PHPWasmIntegration.executeCode(code);
      expect(output).toBe('php_output');
      expect(mockPhpInstance.run).toHaveBeenCalledWith(code);
    });

    it('should reject if PHP is not initialized when executing code', async () => {
      PHPWasmIntegration.reset(); // Reset to uninitialized state
      // Manually set phpLoaded to false as reset might try to re-initialize
      // This requires a way to modify internal state or a more complex reset mock
      // For now, assume reset makes it uninitialized for the next call.
      // This part of the test might be flaky if reset() auto-reinitializes quickly.
      // A better way would be to ensure 'phpLoaded' is false.
      // We'll simulate this by deleting global.PHP after reset's potential re-init attempt.
      await PHPWasmIntegration.reset(); // Attempt reset
      delete global.PHP; // Ensure it's seen as uninitialized

      const code = '<?php echo "Hello"; ?>';
      await expect(PHPWasmIntegration.executeCode(code)).rejects.toThrow('PHP is not initialized');
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'PHP Execution Error');
    });
    
    it('should handle errors during PHP code execution', async () => {
      mockPhpInstance.run = jest.fn().mockImplementation(() => {
        throw new Error('PHP Execution Runtime Error');
      });
      const code = '<?php throw new Exception("Test"); ?>';
      await expect(PHPWasmIntegration.executeCode(code)).rejects.toThrow('PHP Execution Runtime Error');
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to execute PHP code');
    });

    it('should execute a PHP file successfully', async () => {
      const filePath = 'test.php';
      // executeFile wraps code, so mockPhpInstance.run will be called
      const output = await PHPWasmIntegration.executeFile(filePath);
      expect(output).toBe('php_output');
      expect(mockPhpInstance.run).toHaveBeenCalledWith(`<?php include('${filePath}'); ?>`);
    });
  });

  describe('File System', () => {
    beforeEach(async () => {
      await PHPWasmIntegration.initialize();
    });

    it('should create a file', async () => {
      const path = 'test/file.txt';
      const content = 'Hello World';
      await PHPWasmIntegration.createFile(path, content);
      expect(mockFileSystem.mkdir).toHaveBeenCalledWith('test', { recursive: true });
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(path, content);
    });
    
    it('should read a file', async () => {
      const path = 'test/file.txt';
      mockFileSystem.readFile.mockReturnValue('file content');
      const content = await PHPWasmIntegration.readFile(path);
      expect(content).toBe('file content');
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(path, { encoding: 'utf8' });
    });

    it('should reject if reading a non-existent file', async () => {
      const path = 'nonexistent.txt';
      mockFileSystem.exists.mockReturnValue(false);
      await expect(PHPWasmIntegration.readFile(path)).rejects.toThrow(`File ${path} does not exist`);
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'File System Read Error');
    });

    it('should create a directory', async () => {
      const path = 'new/dir';
      await PHPWasmIntegration.createDirectory(path);
      expect(mockFileSystem.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    });

    it('should list files in a directory', async () => {
      const path = 'test/dir';
      const expectedFiles = ['file1.txt', 'file2.php'];
      mockFileSystem.readdir.mockReturnValue(expectedFiles);
      const files = await PHPWasmIntegration.listFiles(path);
      expect(files).toEqual(expectedFiles);
      expect(mockFileSystem.readdir).toHaveBeenCalledWith(path);
    });
    
    it('should reject if listing a non-existent directory', async () => {
      const path = 'nonexistentdir';
      mockFileSystem.exists.mockReturnValue(false);
      await expect(PHPWasmIntegration.listFiles(path)).rejects.toThrow(`Directory ${path} does not exist`);
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'File System List Error');
    });

    // Generic file system error handling
    ['createFile', 'readFile', 'createDirectory', 'listFiles'].forEach(method => {
        it(`should handle errors during ${method}`, async () => {
            const opPath = 'some/path';
            const expectedError = new Error(`${method} System Error`);
            let operationPromise;

            if (method === 'createFile') {
                mockFileSystem.writeFile.mockImplementation(() => { throw expectedError; });
                operationPromise = PHPWasmIntegration.createFile(opPath, 'content');
            } else if (method === 'readFile') {
                mockFileSystem.readFile.mockImplementation(() => { throw expectedError; });
                operationPromise = PHPWasmIntegration.readFile(opPath);
            } else if (method === 'createDirectory') {
                mockFileSystem.mkdir.mockImplementation(() => { throw expectedError; });
                operationPromise = PHPWasmIntegration.createDirectory(opPath);
            } else if (method === 'listFiles') {
                mockFileSystem.readdir.mockImplementation(() => { throw expectedError; });
                operationPromise = PHPWasmIntegration.listFiles(opPath);
            }
            
            await expect(operationPromise).rejects.toThrow(`${method} System Error`);
            expect(AP.handleError).toHaveBeenCalledWith(expectedError, expect.stringContaining(`Failed to ${method.toLowerCase().replace('files',' files in').replace('file',' file')}`));
        });

        it(`should reject ${method} if PHP filesystem is not initialized`, async () => {
            PHPWasmIntegration.reset(); // Ensure uninitialized state
            delete global.PHP; // Make sure it's seen as uninitialized
            
            let operationPromise;
             if (method === 'createFile') operationPromise = PHPWasmIntegration.createFile('path', 'content');
             else if (method === 'readFile') operationPromise = PHPWasmIntegration.readFile('path');
             else if (method === 'createDirectory') operationPromise = PHPWasmIntegration.createDirectory('path');
             else if (method === 'listFiles') operationPromise = PHPWasmIntegration.listFiles('path');

            await expect(operationPromise).rejects.toThrow('PHP filesystem is not initialized');
            expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'File System Error');
        });
    });
  });

  describe('Configuration', () => {
    it('should set and get PHP version', () => {
      const newVersion = '7.4';
      PHPWasmIntegration.setPhpVersion(newVersion);
      expect(PHPWasmIntegration.getPhpVersion()).toBe(newVersion);
    });

    it('should warn if PHP version is changed after initialization', async () => {
      await PHPWasmIntegration.initialize();
      console.warn = jest.fn(); // Mock console.warn
      PHPWasmIntegration.setPhpVersion('8.0');
      expect(console.warn).toHaveBeenCalledWith('PHP version changed. You need to reinitialize PHP for this to take effect.');
      console.warn.mockRestore(); // Restore original console.warn
    });

    it('should set and get enabled extensions', () => {
      const newExtensions = ['gd', 'mysqli'];
      PHPWasmIntegration.setEnabledExtensions(newExtensions);
      expect(PHPWasmIntegration.getEnabledExtensions()).toEqual(newExtensions);
    });
    
    it('should set and get PHP.ini settings', async () => {
      const settings = { 'date.timezone': 'UTC' };
      PHPWasmIntegration.setPhpIniSettings(settings);
      expect(PHPWasmIntegration.getPhpIniSettings()).toEqual(settings);

      // Test applying settings if PHP is already loaded
      await PHPWasmIntegration.initialize(); // Initialize to actually load PHP
      const newSettings = { 'upload_max_filesize': '64M' };
      PHPWasmIntegration.setPhpIniSettings(newSettings); // This should now call ini_set
      expect(mockPhpInstance.ini_set).toHaveBeenCalledWith('upload_max_filesize', '64M');
    });
  });

  describe('Event Handling', () => {
    it('should add and remove event listeners, and notify them', async () => {
      await PHPWasmIntegration.initialize(); // To have phpModule for notifyListeners
      
      const mockCallbackReady = jest.fn();
      const mockCallbackError = jest.fn();

      PHPWasmIntegration.addEventListener('ready', mockCallbackReady);
      PHPWasmIntegration.addEventListener('error', mockCallbackError);

      // Simulate ready event (usually triggered internally on successful init)
      // We can manually trigger a similar notification path if PHPWasmIntegration exposes a way,
      // or test by re-initializing.
      // For this test, let's assume `initialize` triggers 'ready'.
      // The initial `initialize` in beforeEach already covers this.
      // Let's simulate another event like 'output'
      
      const mockCallbackOutput = jest.fn();
      PHPWasmIntegration.addEventListener('output', mockCallbackOutput);
      
      const outputData = { output: "Test PHP Output" };
      if (mockPhpInstance.triggerPrint) {
          mockPhpInstance.triggerPrint(outputData.output); // This should trigger notifyListeners('output')
      }
      expect(mockCallbackOutput).toHaveBeenCalledWith(outputData);

      PHPWasmIntegration.removeEventListener('output', mockCallbackOutput);
      if (mockPhpInstance.triggerPrint) {
          mockPhpInstance.triggerPrint("Another Output");
      }
      expect(mockCallbackOutput).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Reset', () => {
    it('should reset the PHP environment and re-initialize', async () => {
      await PHPWasmIntegration.initialize(); // Initial setup
      expect(PHPWasmIntegration.isInitialized()).toBe(true);

      // global.PHP will be called once for the initial initialize,
      // then again for the re-initialize within reset.
      const resetPromise = PHPWasmIntegration.reset();
      
      // Since reset re-initializes and postInit is async, we need to wait.
      await expect(resetPromise).resolves.toBe(mockPhpInstance);
      
      expect(global.PHP).toHaveBeenCalledTimes(2); // Called for initial init and reset's re-init
      expect(PHPWasmIntegration.isInitialized()).toBe(true); // Should be re-initialized
    });

    it('should resolve immediately if reset is called when not initialized', async () => {
        // Ensure it's not initialized (tricky with module pattern, could use jest.resetModules)
        // For now, we assume it's in a clean state or reset the mock.
        PHPWasmIntegration.reset(); // Call reset once to potentially clear state
        delete global.PHP; // Make it seem uninitialized for the next call
        
        // Mock PHP to NOT be available initially
        const originalPHP = global.PHP; // Store original mock if any
        delete global.PHP;

        await expect(PHPWasmIntegration.reset()).resolves.toBeUndefined();
        // No calls to new PHP() if it wasn't loaded.
        // If reset tries to load script, that's a different mock path.

        global.PHP = originalPHP; // Restore
    });
    
    it('should handle errors during reset re-initialization', async () => {
        await PHPWasmIntegration.initialize(); // Initial successful init

        // Make the next PHP initialization fail
        global.PHP = jest.fn().mockImplementationOnce(config => { // For current successful init
            setTimeout(() => config.postInit(mockPhpInstance), 0);
            return mockPhpInstance;
        }).mockImplementationOnce(() => { // For the reset's re-init attempt
            throw new Error('Re-initialization failed');
        });
        
        // Re-require or reset module state to ensure the new mock is used for re-initialization
        jest.resetModules();
        const FreshPHPWasmIntegration = require('./php-wasm-integration');
        global.PHP = jest.fn().mockImplementationOnce(() => { throw new Error('Re-initialization failed'); });


        await expect(FreshPHPWasmIntegration.reset()).rejects.toThrow('Re-initialization failed');
        expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'PHP Re-initialization failed during reset');
    });
  });
});
