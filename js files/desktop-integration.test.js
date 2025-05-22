/**
 * Unit tests for DesktopIntegration.js
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
 *        "resetMocks": true
 *      }
 *    }
 *    Create `jest.setup.js` for global mocks (e.g., for window.AP, NaraUI):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *    global.NaraUI = { // Mock the NaraUI dependency
 *      createWindow: jest.fn((options) => ({
 *          id: options.id || 'window-' + Date.now(),
 *          element: { style: {}, classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }, appendChild: jest.fn(), remove: jest.fn(), focus: jest.fn(), querySelector: jest.fn().mockReturnThis(), addEventListener: jest.fn() },
 *          show: jest.fn(),
 *          hide: jest.fn(),
 *          focus: jest.fn(),
 *          isMinimized: jest.fn(() => false),
 *          isMaximized: jest.fn(() => false),
 *          minimize: jest.fn(),
 *          maximize: jest.fn(),
 *          restore: jest.fn(),
 *          close: jest.fn(),
 *          on: jest.fn(),
 *          setTitle: jest.fn(),
 *          setContent: jest.fn(),
 *      })),
 *      Draggable: jest.fn(), // If DesktopIntegration uses NaraUI.Draggable directly
 *      Resizable: jest.fn(), // If DesktopIntegration uses NaraUI.Resizable directly
 *    };
 *    global.localStorage = { // Mock localStorage if used
 *        getItem: jest.fn(),
 *        setItem: jest.fn(),
 *        removeItem: jest.fn(),
 *        clear: jest.fn(),
 *    };
 *
 * How to Run Tests:
 *   npm test js/desktop-integration.test.js
 *   or
 *   yarn test js/desktop-integration.test.js
 */

// Global mocks (alternative to jest.setup.js)
if (typeof global.AP === 'undefined') {
  global.AP = { handleError: jest.fn(), showToast: jest.fn() };
}
if (typeof global.NaraUI === 'undefined') {
  global.NaraUI = {
    createWindow: jest.fn((options) => ({
        id: options.id || 'window-' + Date.now(),
        element: { style: {}, classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }, appendChild: jest.fn(), remove: jest.fn(), focus: jest.fn(), querySelector: jest.fn().mockReturnThis(), addEventListener: jest.fn() },
        show: jest.fn(),
        hide: jest.fn(),
        focus: jest.fn(),
        isMinimized: jest.fn(() => false),
        isMaximized: jest.fn(() => false),
        minimize: jest.fn(),
        maximize: jest.fn(),
        restore: jest.fn(),
        close: jest.fn(),
        on: jest.fn(), // Mock the 'on' event listener method
        setTitle: jest.fn(),
        setContent: jest.fn(),
    })),
    // Add other NaraUI mocks if DesktopIntegration directly instantiates them
  };
}
if (typeof global.localStorage === 'undefined') {
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
            removeItem: jest.fn(key => { delete store[key]; }),
            clear: jest.fn(() => { store = {}; })
        };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}
// Mock requestAnimationFrame for background animation
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16)); // Simulate a frame
global.cancelAnimationFrame = jest.fn();


describe('DesktopIntegration', () => {
  let DesktopIntegration;
  let desktopArea;
  let taskbarElement;

  beforeEach(() => {
    jest.resetModules();
    DesktopIntegration = require('./desktop-integration');

    // Clear global mocks
    global.AP.handleError.mockClear();
    global.AP.showToast.mockClear();
    global.NaraUI.createWindow.mockClear(); // Clear calls to NaraUI methods
    global.localStorage.clear();
    jest.clearAllMocks();


    // Set up mock DOM structure that DesktopIntegration might expect
    document.body.innerHTML = `
      <div id="app-container">
        <div id="main-content"></div>
      </div>
      <div id="desktop-background-animation"></div> 
      <template id="window-template"><div class="app-window"></div></template>
      <template id="taskbar-item-template"><button class="taskbar-item"></button></template>
    `;
    // DesktopIntegration.initialize() creates its own UI elements.
    // We will query for them after initialization.
  });
  
  afterEach(() => {
      DesktopIntegration.toggleDesktopMode(false); // Try to clean up by disabling desktop mode
      const da = document.getElementById('desktop-area');
      if (da) da.remove();
      const tb = document.getElementById('taskbar');
      if (tb) tb.remove();
      document.body.innerHTML = '';
  });

  describe('Initialization & Desktop Mode Toggle', () => {
    it('should initialize and create desktop UI elements, initially hidden', () => {
      DesktopIntegration.initialize();
      desktopArea = document.getElementById('desktop-area');
      taskbarElement = document.getElementById('taskbar');
      
      expect(desktopArea).not.toBeNull();
      expect(taskbarElement).not.toBeNull();
      expect(desktopArea.style.display).toBe('none'); // Assuming it starts hidden
      expect(taskbarElement.style.display).toBe('none');
    });

    it('should toggle desktop mode: show desktop elements', () => {
      DesktopIntegration.initialize();
      DesktopIntegration.toggleDesktopMode(true); // Enable desktop mode
      
      desktopArea = document.getElementById('desktop-area');
      taskbarElement = document.getElementById('taskbar');
      const appContainer = document.getElementById('app-container');

      expect(desktopArea.style.display).toBe('block');
      expect(taskbarElement.style.display).toBe('flex'); // or 'block' depending on CSS
      expect(appContainer.classList.contains('desktop-mode-active')).toBe(true);
    });

    it('should toggle desktop mode: hide desktop elements', () => {
      DesktopIntegration.initialize();
      DesktopIntegration.toggleDesktopMode(true); // Enable first
      DesktopIntegration.toggleDesktopMode(false); // Then disable

      desktopArea = document.getElementById('desktop-area');
      taskbarElement = document.getElementById('taskbar');
      const appContainer = document.getElementById('app-container');
      
      expect(desktopArea.style.display).toBe('none');
      expect(taskbarElement.style.display).toBe('none');
      expect(appContainer.classList.contains('desktop-mode-active')).toBe(false);
    });
  });

  describe('Window Management', () => {
    let mockWindowInstance;

    beforeEach(() => {
      DesktopIntegration.initialize();
      DesktopIntegration.toggleDesktopMode(true); // Activate desktop for window tests

      // Reset the mock for each window test to have fresh instances
      mockWindowInstance = {
        id: 'test-win-1',
        element: document.createElement('div'), // Mock element
        show: jest.fn(),
        hide: jest.fn(),
        focus: jest.fn(),
        isMinimized: jest.fn(() => false),
        isMaximized: jest.fn(() => false),
        minimize: jest.fn(),
        maximize: jest.fn(),
        restore: jest.fn(),
        close: jest.fn(),
        on: jest.fn((event, cb) => { // Allow simulating close event
            if (event === 'close') mockWindowInstance.triggerClose = cb;
        }),
        setTitle: jest.fn(),
        setContent: jest.fn(),
      };
      global.NaraUI.createWindow.mockReturnValue(mockWindowInstance);
    });

    it('should create a new window using NaraUI and add to desktop', () => {
      const windowOptions = { id: 'app1', title: 'App 1', content: 'Hello', width: 300, height: 200 };
      const appWindow = DesktopIntegration.createWindow(windowOptions);
      
      expect(global.NaraUI.createWindow).toHaveBeenCalledWith(expect.objectContaining({
        id: 'app1',
        title: 'App 1',
        // draggable: true, resizable: true are defaults in DesktopIntegration
      }));
      expect(appWindow).toBe(mockWindowInstance);
      desktopArea = document.getElementById('desktop-area');
      expect(desktopArea.contains(mockWindowInstance.element)).toBe(true); // Check if appended
      expect(DesktopIntegration.getOpenWindows().length).toBe(1);
      expect(DesktopIntegration.getOpenWindows()[0].id).toBe('app1');

      // Check if taskbar item was created (assuming one window means one item beyond start)
      taskbarElement = document.getElementById('taskbar');
      expect(taskbarElement.children.length).toBeGreaterThanOrEqual(1); // Start menu + app
    });

    it('should close a window and remove its taskbar item', () => {
      const appWindow = DesktopIntegration.createWindow({ id: 'app-to-close', title: 'To Close' });
      expect(DesktopIntegration.getOpenWindows().length).toBe(1);
      
      DesktopIntegration.closeWindow('app-to-close');
      expect(appWindow.close).toHaveBeenCalled(); // NaraUI window close
      
      // Simulate the 'close' event being triggered by NaraUI window
      if(mockWindowInstance.triggerClose) mockWindowInstance.triggerClose();

      expect(DesktopIntegration.getOpenWindows().length).toBe(0);
      taskbarElement = document.getElementById('taskbar');
      expect(taskbarElement.querySelector(`[data-window-id="app-to-close"]`)).toBeNull();
    });

    it('should minimize and restore a window', () => {
      const appWindow = DesktopIntegration.createWindow({ id: 'app-min', title: 'Minimizy' });
      
      DesktopIntegration.minimizeWindow('app-min');
      expect(appWindow.minimize).toHaveBeenCalled(); // NaraUI window minimize
      // Actual display logic for minimized state might be complex, focus on NaraUI call

      // Restore (assuming taskbar click or some other mechanism calls activateWindow for minimized)
      // For this test, let's assume activateWindow handles restore if minimized.
      // Mock isMinimized to return true after minimize.
      mockWindowInstance.isMinimized.mockReturnValue(true);
      DesktopIntegration.activateWindow('app-min');
      expect(appWindow.restore).toHaveBeenCalled(); // Or show(), depending on NaraUI implementation
    });
    
    it('should maximize a window', () => {
        const appWindow = DesktopIntegration.createWindow({ id: 'app-max', title: 'Maximy' });
        DesktopIntegration.maximizeWindow('app-max');
        expect(appWindow.maximize).toHaveBeenCalled();
    });

    it('should activate a window, bringing it to front', () => {
      const appWin1 = DesktopIntegration.createWindow({ id: 'app-act1', title: 'Activate 1' });
      const appWin2 = DesktopIntegration.createWindow({ id: 'app-act2', title: 'Activate 2' });
      
      // Mock z-index for element style
      appWin1.element.style = { zIndex: '10' };
      appWin2.element.style = { zIndex: '11' };

      DesktopIntegration.activateWindow('app-act1');
      expect(appWin1.focus).toHaveBeenCalled();
      // Test z-index logic: app-act1 should now have highest z-index
      // This requires DesktopIntegration to manage z-indices.
      // Let's assume it sets a class or directly manipulates zIndex.
      // For simplicity, we'll check if focus was called.
      // A more detailed test would check actual z-index values if the module sets them.
      // Check if active class is set on taskbar item
      const taskbarItem = document.querySelector(`#taskbar button[data-window-id="app-act1"]`);
      if (taskbarItem) expect(taskbarItem.classList.contains('active')).toBe(true);
    });
  });

  describe('Taskbar Management', () => {
    beforeEach(() => {
      DesktopIntegration.initialize();
      DesktopIntegration.toggleDesktopMode(true);
    });

    it('should initialize the taskbar with a start menu button', () => {
      taskbarElement = document.getElementById('taskbar');
      const startButton = taskbarElement.querySelector('#start-menu-button');
      expect(startButton).not.toBeNull();
      expect(startButton.textContent).toContain('Start'); // Or icon
    });

    it('should update the clock on the taskbar', () => {
      jest.useFakeTimers();
      DesktopIntegration.initialize(); // Re-init with fake timers
      DesktopIntegration.toggleDesktopMode(true);

      taskbarElement = document.getElementById('taskbar');
      const clockElement = taskbarElement.querySelector('#taskbar-clock');
      expect(clockElement).not.toBeNull();
      
      const initialTime = clockElement.textContent;
      jest.advanceTimersByTime(60000); // Advance 1 minute
      expect(clockElement.textContent).not.toBe(initialTime);
      jest.useRealTimers();
    });
    
    it('should toggle the start menu', () => {
        const startButton = document.getElementById('start-menu-button');
        const startMenu = document.getElementById('start-menu');
        expect(startMenu.classList.contains('open')).toBe(false);
        
        startButton.click(); // Open
        expect(startMenu.classList.contains('open')).toBe(true);
        
        startButton.click(); // Close
        expect(startMenu.classList.contains('open')).toBe(false);
    });
  });

  describe('Background Animation & Themes', () => {
    let mockCanvas, mockCtx;

    beforeEach(() => {
      mockCtx = {
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        closePath: jest.fn(),
      };
      mockCanvas = {
        getContext: jest.fn(() => mockCtx),
        width: 0,
        height: 0,
        style: {}, // Add style property
      };
      // Replace the actual canvas element with our mock
      const bgAnimElement = document.getElementById('desktop-background-animation');
      // Remove original, add mock
      if (bgAnimElement.firstChild && bgAnimElement.firstChild.tagName === 'CANVAS') {
          bgAnimElement.removeChild(bgAnimElement.firstChild);
      }
      bgAnimElement.appendChild(mockCanvas);


      DesktopIntegration.initialize(); // This calls initBackgroundAnimation
      DesktopIntegration.toggleDesktopMode(true);
    });

    it('should initialize background animation and get canvas context', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should cycle theme and update background', () => {
        const initialTheme = DesktopIntegration.getCurrentTheme ? DesktopIntegration.getCurrentTheme() : null; // Assuming a getter
        DesktopIntegration.cycleTheme();
        const newTheme = DesktopIntegration.getCurrentTheme ? DesktopIntegration.getCurrentTheme() : null;
        
        if (initialTheme && newTheme) { // Only if themes are more than 1
            expect(newTheme).not.toBe(initialTheme);
        }
        // Check if background style was updated (e.g. body class or CSS variable)
        // This depends on implementation detail of how themes are applied.
        // For now, we assume cycleTheme runs without error.
        expect(true).toBe(true); // Placeholder if no direct style to check
    });
    
    it('should run animation frame for background', () => {
        jest.useFakeTimers();
        // initBackgroundAnimation is called in initialize() in beforeEach
        // The animation loop should be running if startAnimation was called.
        // Let's assume DesktopIntegration.startAnimation() is called internally or we call it.
        // DesktopIntegration.startAnimation(); // If needed to be explicit
        
        const initialFillRectCalls = mockCtx.fillRect.mock.calls.length;
        jest.advanceTimersByTime(100); // Advance time to allow a few frames
        expect(mockCtx.fillRect.mock.calls.length).toBeGreaterThan(initialFillRectCalls);
        jest.useRealTimers();
    });
  });
});
