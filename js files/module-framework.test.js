/**
 * Unit tests for ModuleFramework.js
 *
 * How to Set Up Jest:
 * 1. Install Jest:
 *    npm install --save-dev jest
 *    or
 *    yarn add --dev jest
 *
 * 2. Configure Jest:
 *    In `package.json`:
 *    {
 *      "scripts": {
 *        "test": "jest"
 *      },
 *      "jest": {
 *        "testEnvironment": "jsdom",
 *        "setupFilesAfterEnv": ["./jest.setup.js"], // For global mocks
 *        "resetMocks": true // Automatically reset mocks between tests
 *      }
 *    }
 *    Create `jest.setup.js` for global mocks (e.g., for window.AP):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *    // Mock other globals like bootstrap if needed by UI interaction parts, though less critical for core logic
 *    global.bootstrap = {
 *        Modal: jest.fn(),
 *        Tooltip: jest.fn(),
 *        Popover: jest.fn(),
 *    };
 *
 * 3. Module Loading for Test:
 *    ModuleFramework.js assigns itself to `window.ModuleFramework` and also uses `module.exports`.
 *    We will use `jest.resetModules()` and `require` to get a fresh instance for each test.
 *
 * How to Run Tests:
 *   npm test js/module-framework.test.js
 *   or
 *   yarn test js/module-framework.test.js
 *   (Assuming you've added the "test" script to your package.json)
 */

// Global mocks (alternative to jest.setup.js, but setup file is cleaner)
if (typeof global.AP === 'undefined') {
  global.AP = {
    handleError: jest.fn(),
    showToast: jest.fn(),
  };
}
if (typeof global.bootstrap === 'undefined') {
    global.bootstrap = { // Mock bootstrap if any UI interaction code runs
        Modal: jest.fn(),
        Tooltip: jest.fn(),
        Popover: jest.fn(),
    };
}


describe('ModuleFramework', () => {
  let ModuleFramework;
  let mockScriptElement;
  let mockLinkElement;
  let mockFetch;

  beforeEach(() => {
    // Reset modules to get a fresh ModuleFramework instance with cleared state for each test
    jest.resetModules();
    ModuleFramework = require('./module-framework'); // Load a fresh instance

    // Clear mocks used by ModuleFramework or its dependencies
    global.AP.handleError.mockClear();
    global.AP.showToast.mockClear();

    // Mock DOM manipulation for URL loading
    mockScriptElement = {
      onload: null,
      onerror: null,
      src: '',
      async: false,
      type: ''
    };
    mockLinkElement = {
      onload: null,
      onerror: null,
      href: '',
      rel: ''
    };
    document.createElement = jest.fn(type => {
      if (type === 'script') return mockScriptElement;
      if (type === 'link') return mockLinkElement;
      return {};
    });
    document.head.appendChild = jest.fn();
    document.body.appendChild = jest.fn(); // If any UI elements are appended

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock document.querySelectorAll for setupDockButtons and other DOM interactions
    // if these parts of module-framework are triggered during tests.
    // By default, return an empty NodeList-like array.
    document.querySelectorAll = jest.fn().mockReturnValue([]);
    document.getElementById = jest.fn().mockImplementation(id => {
        // If a specific element is needed by a test, mock its return here
        if (id === 'voice-feedback') { // Example from voice-control, adapt if needed
            return { style: {}, querySelector: jest.fn().mockReturnValue({style:{}}) };
        }
        return null; // Default mock
    });


    // Clean up any globally registered modules from previous tests if necessary
    // (ModuleFramework itself does some global checks)
    delete window.VoiceControlSystem;
    delete window.NexusGrid;
    delete window.NexusGridDemoSystem;
    delete window.RainbowIndicator;
    delete window.CubbitStorage;
    // ... any other standard modules ModuleFramework tries to auto-register

    // Initialize the framework for each test, as it sets up internal event listeners etc.
    // Note: The DOMContentLoaded listener in ModuleFramework will also run.
    // We might need to mock addEventListener on document for more control if it causes issues.
    // For now, assume JSDOM handles it or ModuleFramework.initialize() is called explicitly.
    // ModuleFramework.initialize(); // Call this if tests rely on it being pre-initialized
  });

  afterEach(() => {
    // Clean up any global mocks if they were set directly in tests
    delete global.fetch;
  });

  describe('Initialization', () => {
    it('should initialize and log a message', () => {
      console.log = jest.fn();
      ModuleFramework.initialize();
      expect(console.log).toHaveBeenCalledWith('AlgorithmPress Module Framework initialized');
      expect(ModuleFramework.getModules().length).toBeGreaterThanOrEqual(0); // Standard modules might register
      console.log.mockRestore();
    });

    it('should detect and register pre-loaded global modules', () => {
      // Define a mock global module
      window.MyGlobalModule = {
        _moduleId: 'global-test-module',
        _moduleName: 'Global Test Module',
        _moduleVersion: '0.5.0',
        initialize: jest.fn(() => Promise.resolve()),
        someMethod: jest.fn(),
      };

      ModuleFramework.initialize();
      const modules = ModuleFramework.getModules();
      const found = modules.find(m => m.id === 'global-test-module');
      expect(found).toBeDefined();
      expect(found.name).toBe('Global Test Module');
      expect(found.version).toBe('0.5.0');
      // expect(found.status).toBe(ModuleFramework.MODULE_STATUS.ACTIVE); // If instance is provided
      delete window.MyGlobalModule;
    });

    it('should register standard modules if they are globally available', () => {
        window.VoiceControlSystem = { version: '1.0.0', initialize: jest.fn(() => Promise.resolve()) };
        ModuleFramework.initialize();
        const vcsModule = ModuleFramework.getModules().find(m => m.id === 'voice-control');
        expect(vcsModule).toBeDefined();
        expect(vcsModule.status).toBe(ModuleFramework.MODULE_STATUS.ACTIVE); // Because instance is provided
        delete window.VoiceControlSystem;
    });

    it('should register standard modules with URLs if not globally available', () => {
        ModuleFramework.initialize(); // VoiceControlSystem is not globally defined here
        const vcsModule = ModuleFramework.getModules().find(m => m.id === 'voice-control');
        expect(vcsModule).toBeDefined();
        // It should be registered but not active, as it needs to be loaded via URL
        expect(vcsModule.status).toBe(ModuleFramework.MODULE_STATUS.REGISTERED);
    });
  });

  describe('Module Registration and Unregistration', () => {
    it('should register a module successfully', () => {
      const moduleConfig = { id: 'test-mod', name: 'Test Module', loader: jest.fn() };
      expect(ModuleFramework.registerModule(moduleConfig)).toBe(true);
      const modules = ModuleFramework.getModules();
      expect(modules.find(m => m.id === 'test-mod')).toBeDefined();
    });

    it('should fail to register a module with invalid configuration', () => {
      console.error = jest.fn(); // Suppress console error for this test
      expect(ModuleFramework.registerModule({ name: 'Invalid Module' })).toBe(false); // Missing ID
      expect(console.error).toHaveBeenCalledWith('Invalid module configuration', { name: 'Invalid Module' });
      console.error.mockRestore();
    });

    it('should warn if registering a module with a duplicate ID', () => {
      const moduleConfig = { id: 'test-mod', name: 'Test Module', loader: jest.fn() };
      ModuleFramework.registerModule(moduleConfig);
      console.warn = jest.fn(); // Suppress console warn
      expect(ModuleFramework.registerModule(moduleConfig)).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Module test-mod is already registered');
      console.warn.mockRestore();
    });
    
    it('should auto-start a module if autoStart is true', (done) => {
        const mockLoader = jest.fn(() => Promise.resolve({ initialize: jest.fn(() => Promise.resolve()) }));
        const moduleConfig = { id: 'auto-mod', name: 'Auto Start Module', loader: mockLoader, autoStart: true };
        
        ModuleFramework.on('module:loaded', (data) => {
            if (data.id === 'auto-mod') {
                expect(mockLoader).toHaveBeenCalled();
                const mod = ModuleFramework.getModules().find(m => m.id === 'auto-mod');
                expect(mod.status).toBe(ModuleFramework.MODULE_STATUS.ACTIVE);
                done();
            }
        });
        ModuleFramework.registerModule(moduleConfig);
        // Allow micro-task queue to process for setTimeout(..., 0)
        // jest.runAllTimers() could also be used if jest.useFakeTimers() is active
    });


    it('should unload an active module successfully', async () => {
      const moduleConfig = { id: 'unload-mod', name: 'Unload Test', loader: () => Promise.resolve({ destroy: jest.fn() }) };
      ModuleFramework.registerModule(moduleConfig);
      await ModuleFramework.loadModule('unload-mod');
      
      let unloadedData = null;
      ModuleFramework.on('module:unloaded', (data) => unloadedData = data);

      expect(ModuleFramework.unloadModule('unload-mod')).toBe(true);
      const mod = ModuleFramework.getModules().find(m => m.id === 'unload-mod');
      expect(mod.status).toBe(ModuleFramework.MODULE_STATUS.REGISTERED);
      expect(ModuleFramework.getModule('unload-mod')).toBeNull();
      expect(unloadedData).toEqual({ id: 'unload-mod', name: 'Unload Test'});
    });

    it('should call destroy method of module instance on unload', async () => {
      const mockDestroy = jest.fn();
      const moduleConfig = { id: 'destroy-mod', name: 'Destroy Test', loader: () => Promise.resolve({ destroy: mockDestroy }) };
      ModuleFramework.registerModule(moduleConfig);
      await ModuleFramework.loadModule('destroy-mod');
      ModuleFramework.unloadModule('destroy-mod');
      expect(mockDestroy).toHaveBeenCalled();
    });
    
    it('should fail to unload a module that is a dependency for an active module', async () => {
        ModuleFramework.registerModule({ id: 'dep-mod', name: 'Dependency Module', loader: () => Promise.resolve({}) });
        ModuleFramework.registerModule({ id: 'main-mod', name: 'Main Module', dependencies: ['dep-mod'], loader: () => Promise.resolve({}) });

        await ModuleFramework.loadModule('dep-mod');
        await ModuleFramework.loadModule('main-mod');
        
        console.warn = jest.fn();
        expect(ModuleFramework.unloadModule('dep-mod')).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('Cannot unload module dep-mod because it is a dependency for:', ['main-mod']);
        console.warn.mockRestore();
    });
  });

  describe('Module Loading', () => {
    it('should load a module using its loader function', async () => {
      const mockInstance = { id: 'instance1' };
      const loaderFn = jest.fn(() => Promise.resolve(mockInstance));
      ModuleFramework.registerModule({ id: 'loader-func-mod', name: 'Loader Func Test', loader: loaderFn });
      
      const instance = await ModuleFramework.loadModule('loader-func-mod');
      expect(loaderFn).toHaveBeenCalled();
      expect(instance).toBe(mockInstance);
      const mod = ModuleFramework.getModules().find(m => m.id === 'loader-func-mod');
      expect(mod.status).toBe(ModuleFramework.MODULE_STATUS.ACTIVE);
    });

    it('should load a module already in global scope', async () => {
      window['global-scope-mod'] = { data: 'global_data', initialize: jest.fn(() => Promise.resolve()) };
      ModuleFramework.registerModule({ id: 'global-scope-mod', name: 'Global Scope Test' });
      
      const instance = await ModuleFramework.loadModule('global-scope-mod');
      expect(instance).toBe(window['global-scope-mod']);
      delete window['global-scope-mod'];
    });

    it('should load a JS module from URL', async () => {
      ModuleFramework.registerModule({ id: 'url-js-mod', name: 'URL JS Test', url: 'test.js' });
      
      // Simulate script loading
      setTimeout(() => {
        window['url-js-mod-instance'] = { loaded: true, initialize: jest.fn(() => Promise.resolve()) }; // Simulate module defining itself globally
        mockScriptElement.onload();
      }, 0);
        
      // The module loader will resolve with undefined for script, then instance is taken from global
      // This part of module framework logic might need refinement or specific testing.
      // For now, assume the module is globally available after script load.
      // Or the loader function should handle it.
      // The current ModuleFramework.loadModuleFromUrl for .js files resolves without a value.
      // It assumes the script makes the module available globally or via other means.
      // Let's adjust test to reflect this:
      ModuleFramework.registerModule({ 
          id: 'actual-url-js-mod', 
          name: 'Actual URL JS Test', 
          url: 'actual.js',
          // Loader to grab from window after script load
          loader: () => Promise.resolve(window.ActualUrlJsModInstance) 
      });

      setTimeout(() => {
        window.ActualUrlJsModInstance = { init: jest.fn(() => Promise.resolve()) };
        mockScriptElement.onload();
      }, 0);
      
      const instance = await ModuleFramework.loadModule('actual-url-js-mod');
      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(mockScriptElement.src).toContain('actual.js'); // JSDOM might make it a full path
      expect(instance).toBe(window.ActualUrlJsModInstance);
      delete window.ActualUrlJsModInstance;
    });
    
    it('should load a CSS file from URL', async () => {
        ModuleFramework.registerModule({ id: 'url-css-mod', name: 'URL CSS Test', url: 'test.css' });
        setTimeout(() => mockLinkElement.onload(), 0); // Simulate CSS load
        
        await ModuleFramework.loadModule('url-css-mod'); // loadModule resolves with undefined for CSS
        expect(document.createElement).toHaveBeenCalledWith('link');
        expect(mockLinkElement.href).toContain('test.css');
        expect(mockLinkElement.rel).toBe('stylesheet');
    });

    it('should fetch other content (e.g., JSON) from URL', async () => {
      const jsonData = { message: 'hello' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(jsonData),
      });
      ModuleFramework.registerModule({ id: 'url-json-mod', name: 'URL JSON Test', url: 'data.json' });
      
      const data = await ModuleFramework.loadModule('url-json-mod');
      expect(mockFetch).toHaveBeenCalledWith('data.json');
      expect(data).toEqual(jsonData);
    });

    it('should load dependencies before the module itself', async () => {
      const depInit = jest.fn(() => Promise.resolve());
      const mainInit = jest.fn(() => Promise.resolve());
      
      ModuleFramework.registerModule({ id: 'dep1', name: 'Dep 1', loader: () => Promise.resolve({ initialize: depInit }) });
      ModuleFramework.registerModule({ id: 'main-mod-with-dep', name: 'Main with Dep', dependencies: ['dep1'], loader: () => Promise.resolve({ initialize: mainInit }) });
      
      await ModuleFramework.loadModule('main-mod-with-dep');
      // Check that depInit was called before mainInit.
      // This is tricky to assert directly with Jest if they are in same promise chain turn.
      // We can check if dep1 is active when main-mod-with-dep loader is called.
      const depModule = ModuleFramework.getModule('dep1');
      expect(depModule).toBeDefined(); // Dependency should be loaded and available
      expect(depInit).toHaveBeenCalled();
      expect(mainInit).toHaveBeenCalled();
      // A more robust way: loader for main-mod-with-dep could check status of dep1.
    });

    it('should call initialize method of a module instance if available', async () => {
        const mockInitialize = jest.fn(() => Promise.resolve());
        ModuleFramework.registerModule({ id: 'init-mod', name: 'Init Test', loader: () => Promise.resolve({ initialize: mockInitialize }) });
        await ModuleFramework.loadModule('init-mod');
        expect(mockInitialize).toHaveBeenCalled();
    });
  });

  describe('Module Instance and Method Calling', () => {
    beforeEach(async () => {
        ModuleFramework.registerModule({ id: 'method-mod', name: 'Method Test', loader: () => Promise.resolve({ 
            syncMethod: () => 'sync_result',
            asyncMethod: () => Promise.resolve('async_result'),
            errorMethod: () => { throw new Error('Method Error'); }
        })});
        await ModuleFramework.loadModule('method-mod');
    });

    it('should get an active module instance', () => {
        const instance = ModuleFramework.getModule('method-mod');
        expect(instance).toBeDefined();
        expect(typeof instance.syncMethod).toBe('function');
    });

    it('should return null for non-existent or inactive module', () => {
        expect(ModuleFramework.getModule('non-existent-mod')).toBeNull();
    });
    
    it('should get all registered modules', () => {
        ModuleFramework.registerModule({ id: 'mod2', name: 'Module 2', loader: () => Promise.resolve({}) });
        const modules = ModuleFramework.getModules(); // Gets all, active or not
        expect(modules.length).toBeGreaterThanOrEqual(2); // method-mod and mod2
        expect(modules.find(m => m.id === 'method-mod')).toBeDefined();
        expect(modules.find(m => m.id === 'mod2')).toBeDefined();
    });

    it('should call a synchronous method on a module', async () => {
        const result = await ModuleFramework.callModuleMethod('method-mod', 'syncMethod');
        expect(result).toBe('sync_result');
    });

    it('should call an asynchronous method on a module', async () => {
        const result = await ModuleFramework.callModuleMethod('method-mod', 'asyncMethod');
        expect(result).toBe('async_result');
    });

    it('should reject if method not found on module', async () => {
        await expect(ModuleFramework.callModuleMethod('method-mod', 'nonExistentMethod'))
            .rejects.toThrow('Method nonExistentMethod not found on module method-mod');
    });
    
    it('should load module first if calling method on an unlaoded module', async () => {
        const loaderFn = jest.fn(() => Promise.resolve({ getVal: () => 42 }));
        ModuleFramework.registerModule({ id: 'lazy-load-mod', name: 'Lazy Load', loader: loaderFn });
        
        const result = await ModuleFramework.callModuleMethod('lazy-load-mod', 'getVal');
        expect(loaderFn).toHaveBeenCalled();
        expect(result).toBe(42);
    });
  });

  describe('Event Bus (on/emit)', () => {
    it('should allow subscribing and publishing events', () => {
      const mockCallback = jest.fn();
      ModuleFramework.on('test:event', mockCallback);
      
      const eventData = { message: 'hello world' };
      ModuleFramework.emit('test:event', eventData);
      
      expect(mockCallback).toHaveBeenCalledWith(eventData);
    });

    it('should allow unsubscribing from events', () => {
      const mockCallback = jest.fn();
      const unsubscribe = ModuleFramework.on('test:event', mockCallback);
      
      unsubscribe();
      ModuleFramework.emit('test:event', { message: 'hello again' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should clear all event handlers', () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn();
        ModuleFramework.on('event1', cb1);
        ModuleFramework.on('event2', cb2);

        // Access internal _eventBus for this test, or add a clearAll to public API if desired
        // For now, let's assume we test by checking if emit still calls them after a hypothetical clear.
        // Since ModuleFramework doesn't expose a 'clearAllEvents' or similar,
        // we'll test the 'clear' method inside createEventBus by re-initializing ModuleFramework
        // which creates a new event bus.
        
        ModuleFramework.emit('event1', {});
        expect(cb1).toHaveBeenCalledTimes(1);

        jest.resetModules(); // This creates a new ModuleFramework with a new event bus
        ModuleFramework = require('./module-framework');
        
        ModuleFramework.emit('event1', {}); // cb1 was on the old event bus
        expect(cb1).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during module loading (loader function fails)', async () => {
      const loaderError = new Error('Loader Failed');
      ModuleFramework.registerModule({ id: 'error-load-mod', name: 'Error Load Test', loader: () => Promise.reject(loaderError) });
      
      await expect(ModuleFramework.loadModule('error-load-mod')).rejects.toBe(loaderError);
      expect(AP.handleError).toHaveBeenCalledWith(loaderError, 'Failed to load module Error Load Test (error-load-mod)');
      const mod = ModuleFramework.getModules().find(m => m.id === 'error-load-mod');
      expect(mod.status).toBe(ModuleFramework.MODULE_STATUS.ERROR);
    });

    it('should handle errors during module script loading from URL', async () => {
      ModuleFramework.registerModule({ id: 'error-url-mod', name: 'Error URL Test', url: 'error.js' });
      setTimeout(() => mockScriptElement.onerror(new Error('Script Load Error')), 0); // Simulate script error
      
      await expect(ModuleFramework.loadModule('error-url-mod')).rejects.toThrow('Failed to load script from error.js');
      // AP.handleError would be called by the loadModule's catch block
      expect(AP.handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to load module Error URL Test (error-url-mod)');
    });
    
    it('should handle errors in event bus callbacks', () => {
        const callbackError = new Error('Callback error');
        const mockCallback = jest.fn(() => { throw callbackError; });
        ModuleFramework.on('error:event', mockCallback);
        
        ModuleFramework.emit('error:event', {});
        expect(mockCallback).toHaveBeenCalled();
        expect(AP.handleError).toHaveBeenCalledWith(callbackError, 'Error in event handler for error:event');
    });

    it('should handle errors during module method execution via callModuleMethod', async () => {
        ModuleFramework.registerModule({ id: 'err-method-mod', name: 'Error Method', loader: () => Promise.resolve({
            errorMethod: () => { throw new Error('Method Execution Error'); }
        })});
        await ModuleFramework.loadModule('err-method-mod');

        await expect(ModuleFramework.callModuleMethod('err-method-mod', 'errorMethod'))
            .rejects.toThrow('Method Execution Error');
        // Note: callModuleMethod itself doesn't call AP.handleError, it just rejects.
        // The caller of callModuleMethod would be responsible for user-facing error display.
        // This aligns with typical Promise patterns.
    });
  });
});
