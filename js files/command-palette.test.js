/**
 * Unit tests for CommandPalette.js
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
 *    Create `jest.setup.js` for global mocks (e.g., for window.AP and localStorage):
 *    // jest.setup.js
 *    global.AP = {
 *      handleError: jest.fn(),
 *      showToast: jest.fn(),
 *    };
 *    // Mock localStorage
 *    const localStorageMock = (function() {
 *      let store = {};
 *      return {
 *        getItem: function(key) { return store[key] || null; },
 *        setItem: function(key, value) { store[key] = value.toString(); },
 *        removeItem: function(key) { delete store[key]; },
 *        clear: function() { store = {}; }
 *      };
 *    })();
 *    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
 *
 * How to Run Tests:
 *   npm test js/command-palette.test.js
 *   or
 *   yarn test js/command-palette.test.js
 */

// Global mocks (alternative to jest.setup.js)
if (typeof global.AP === 'undefined') {
  global.AP = {
    handleError: jest.fn(),
    showToast: jest.fn(),
  };
}
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = (function() {
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


describe('CommandPalette', () => {
  let CommandPalette;
  let commandPaletteContainer;

  // Helper to simulate keyboard events
  const simulateKeydown = (element, key, ctrlKey = false, metaKey = false, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey,
      metaKey,
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
    return event;
  };


  beforeEach(() => {
    jest.resetModules();
    CommandPalette = require('./command-palette'); // Assuming command-palette.js exports the module

    // Clear global mocks
    global.AP.handleError.mockClear();
    global.AP.showToast.mockClear();
    global.localStorage.clear(); // Clear localStorage mock store
    jest.clearAllMocks(); // Clears all jest.fn() calls and instances

    // Create a fresh palette container for each test
    if (commandPaletteContainer) {
      commandPaletteContainer.remove();
    }
    document.body.innerHTML = ''; // Clean up body
    
    // CommandPalette.initialize() typically creates its own UI.
    // We'll let it do that, then query for the elements.
  });

  afterEach(() => {
    CommandPalette.hidePalette(); // Ensure palette is hidden to remove event listeners etc.
    const paletteEl = document.getElementById('command-palette-container');
    if (paletteEl) {
      paletteEl.remove();
    }
    document.body.innerHTML = ''; 
  });

  describe('Initialization & UI', () => {
    it('should initialize and create the palette UI, initially hidden', () => {
      CommandPalette.initialize();
      const paletteEl = document.getElementById('command-palette-container');
      expect(paletteEl).not.toBeNull();
      expect(paletteEl.classList.contains('hidden')).toBe(true);
      expect(paletteEl.querySelector('#command-palette-input')).not.toBeNull();
      expect(paletteEl.querySelector('#command-palette-list')).not.toBeNull();
    });

    it('should show and hide the palette', () => {
      CommandPalette.initialize();
      const paletteEl = document.getElementById('command-palette-container');
      
      CommandPalette.showPalette();
      expect(paletteEl.classList.contains('hidden')).toBe(false);
      expect(document.activeElement).toBe(paletteEl.querySelector('#command-palette-input'));

      CommandPalette.hidePalette();
      expect(paletteEl.classList.contains('hidden')).toBe(true);
    });
    
    it('should toggle the palette with Ctrl+Shift+P or Cmd+Shift+P', () => {
        CommandPalette.initialize();
        const paletteEl = document.getElementById('command-palette-container');
        
        // Test showing with Ctrl+Shift+P
        simulateKeydown(document.documentElement, 'P', true, false, true);
        expect(paletteEl.classList.contains('hidden')).toBe(false);

        // Test hiding with Escape
        simulateKeydown(paletteEl.querySelector('#command-palette-input'), 'Escape');
        expect(paletteEl.classList.contains('hidden')).toBe(true);

        // Test showing with Cmd+Shift+P
        simulateKeydown(document.documentElement, 'P', false, true, true);
        expect(paletteEl.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Command Registration', () => {
    beforeEach(() => {
      CommandPalette.initialize();
    });

    it('should register an individual command', () => {
      const mockAction = jest.fn();
      CommandPalette.registerCommand({ id: 'test.cmd1', title: 'Test Command 1', action: mockAction, category: 'Test' });
      
      CommandPalette.showPalette();
      const input = document.getElementById('command-palette-input');
      input.value = 'Test Command 1';
      input.dispatchEvent(new Event('input')); // Trigger update

      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBeGreaterThan(0);
      expect(list.children[0].textContent).toContain('Test Command 1');
    });

    it('should register a command provider', () => {
      const mockProvider = {
        id: 'testProvider',
        name: 'Test Provider',
        getCommands: jest.fn(query => {
          if (query === '' || 'provided'.includes(query.toLowerCase())) {
            return [{ id: 'prov.cmd1', title: 'Provided Command 1', action: jest.fn(), category: 'Provided' }];
          }
          return [];
        })
      };
      CommandPalette.registerCommandProvider(mockProvider);
      
      CommandPalette.showPalette();
      const input = document.getElementById('command-palette-input');
      input.value = 'Provided'; // Should trigger the provider
      input.dispatchEvent(new Event('input'));

      expect(mockProvider.getCommands).toHaveBeenCalledWith('Provided');
      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBeGreaterThan(0);
      expect(list.children[0].textContent).toContain('Provided Command 1');
    });
    
    it('should not allow registering a command with a duplicate ID', () => {
        const cmd = { id: 'dup.cmd', title: 'Duplicate Command', action: jest.fn(), category: 'Test' };
        CommandPalette.registerCommand(cmd);
        console.warn = jest.fn(); // Suppress console warning for test
        CommandPalette.registerCommand(cmd); // Try registering again
        expect(console.warn).toHaveBeenCalledWith("Command 'dup.cmd' is already registered. Skipping.");
        console.warn.mockRestore();
    });
  });

  describe('Command Filtering & Display', () => {
    const cmd1 = { id: 'filter.cmd1', title: 'Filter Test One', action: jest.fn(), category: 'FilterCat' };
    const cmd2 = { id: 'filter.cmd2', title: 'Filter Test Two', action: jest.fn(), category: 'FilterCat' };
    const cmd3 = { id: 'another.cmd', title: 'Another Command', action: jest.fn(), category: 'AnotherCat' };

    beforeEach(() => {
      CommandPalette.initialize();
      CommandPalette.registerCommand(cmd1);
      CommandPalette.registerCommand(cmd2);
      CommandPalette.registerCommand(cmd3);
      CommandPalette.showPalette();
    });

    it('should filter commands by title query', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'One';
      input.dispatchEvent(new Event('input'));
      
      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBe(1);
      expect(list.children[0].textContent).toContain('Filter Test One');
    });

    it('should filter commands by category prefix', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'category:FilterCat Two';
      input.dispatchEvent(new Event('input'));
      
      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBe(1);
      expect(list.children[0].textContent).toContain('Filter Test Two');
    });
    
    it('should filter commands by category prefix (case-insensitive)', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'category:filtercat'; // Lowercase category
      input.dispatchEvent(new Event('input'));
      
      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBe(2); // Both cmd1 and cmd2
    });

    it('should show "No results found" if query matches nothing', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'NonExistentCommandXYZ';
      input.dispatchEvent(new Event('input'));
      
      const list = document.getElementById('command-palette-list');
      expect(list.children.length).toBe(1); // The "No results" item
      expect(list.children[0].textContent).toContain('No results found');
    });
  });

  describe('Command Execution', () => {
    const mockActionCmd1 = jest.fn();
    const cmd1 = { id: 'exec.cmd1', title: 'Execute Me', action: mockActionCmd1, category: 'Execution' };

    beforeEach(() => {
      CommandPalette.initialize();
      CommandPalette.registerCommand(cmd1);
      CommandPalette.showPalette();
    });

    it('should execute a selected command on Enter', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'Execute Me';
      input.dispatchEvent(new Event('input')); // Populate list

      const paletteEl = document.getElementById('command-palette-container');
      simulateKeydown(input, 'Enter');
      
      expect(mockActionCmd1).toHaveBeenCalled();
      expect(paletteEl.classList.contains('hidden')).toBe(true); // Palette should hide
    });
    
    it('should execute a selected command on click', () => {
      const input = document.getElementById('command-palette-input');
      input.value = 'Execute Me';
      input.dispatchEvent(new Event('input'));

      const list = document.getElementById('command-palette-list');
      const firstItem = list.children[0]; // Assuming it's the one we want
      firstItem.click();
      
      expect(mockActionCmd1).toHaveBeenCalled();
      const paletteEl = document.getElementById('command-palette-container');
      expect(paletteEl.classList.contains('hidden')).toBe(true);
    });

    it('should handle errors during command execution using AP.handleError', () => {
      const errorAction = jest.fn(() => { throw new Error('Execution Failed'); });
      CommandPalette.registerCommand({ id: 'err.cmd', title: 'Error Command', action: errorAction, category: 'ErrorTest' });
      
      const input = document.getElementById('command-palette-input');
      input.value = 'Error Command';
      input.dispatchEvent(new Event('input'));
      simulateKeydown(input, 'Enter');
      
      expect(errorAction).toHaveBeenCalled();
      expect(global.AP.handleError).toHaveBeenCalledWith(expect.any(Error), "Error executing command 'Error Command'");
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      CommandPalette.initialize();
      CommandPalette.registerCommand({ id: 'nav.cmd1', title: 'Nav One', action: jest.fn(), category: 'Nav' });
      CommandPalette.registerCommand({ id: 'nav.cmd2', title: 'Nav Two', action: jest.fn(), category: 'Nav' });
      CommandPalette.registerCommand({ id: 'nav.cmd3', title: 'Nav Three', action: jest.fn(), category: 'Nav' });
      CommandPalette.showPalette();
      const input = document.getElementById('command-palette-input');
      input.value = 'Nav'; // Show all 3 nav commands
      input.dispatchEvent(new Event('input'));
    });

    it('should navigate down with ArrowDown key', () => {
      const input = document.getElementById('command-palette-input');
      const list = document.getElementById('command-palette-list');
      
      simulateKeydown(input, 'ArrowDown'); // First item selected (index 0)
      expect(list.children[0].classList.contains('selected')).toBe(true);
      
      simulateKeydown(input, 'ArrowDown'); // Second item selected (index 1)
      expect(list.children[0].classList.contains('selected')).toBe(false);
      expect(list.children[1].classList.contains('selected')).toBe(true);
    });

    it('should navigate up with ArrowUp key', () => {
      const input = document.getElementById('command-palette-input');
      const list = document.getElementById('command-palette-list');

      // Go down twice
      simulateKeydown(input, 'ArrowDown');
      simulateKeydown(input, 'ArrowDown'); 
      expect(list.children[1].classList.contains('selected')).toBe(true);

      simulateKeydown(input, 'ArrowUp'); // Move up to first item
      expect(list.children[1].classList.contains('selected')).toBe(false);
      expect(list.children[0].classList.contains('selected')).toBe(true);
    });

    it('should wrap navigation around the list', () => {
      const input = document.getElementById('command-palette-input');
      const list = document.getElementById('command-palette-list');

      simulateKeydown(input, 'ArrowUp'); // From no selection, should go to last item (index 2)
      expect(list.children[2].classList.contains('selected')).toBe(true);

      simulateKeydown(input, 'ArrowDown'); // From last, should go to first item (index 0)
      expect(list.children[2].classList.contains('selected')).toBe(false);
      expect(list.children[0].classList.contains('selected')).toBe(true);
    });
  });

  describe('History & Favorites', () => {
    const cmdHistory = { id: 'hist.cmd', title: 'History Command', action: jest.fn(), category: 'History' };
    
    beforeEach(() => {
      CommandPalette.initialize();
      CommandPalette.registerCommand(cmdHistory);
      CommandPalette.showPalette();
    });

    it('should add executed command to history in localStorage', () => {
      const input = document.getElementById('command-palette-input');
      input.value = cmdHistory.title;
      input.dispatchEvent(new Event('input'));
      simulateKeydown(input, 'Enter'); // Execute the command

      expect(cmdHistory.action).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('commandPaletteHistory', expect.stringContaining(cmdHistory.id));
      const history = JSON.parse(localStorage.getItem('commandPaletteHistory'));
      expect(history[0].id).toBe(cmdHistory.id);
    });
    
    it('should prioritize history items when input is empty', () => {
        // First, execute a command to get it into history
        const input = document.getElementById('command-palette-input');
        input.value = cmdHistory.title;
        input.dispatchEvent(new Event('input'));
        simulateKeydown(input, 'Enter'); // Execute and add to history
        CommandPalette.showPalette(); // Re-show

        input.value = ''; // Empty query
        input.dispatchEvent(new Event('input'));

        const list = document.getElementById('command-palette-list');
        // Expect cmdHistory to be at the top or very near the top
        expect(list.children[0].textContent).toContain(cmdHistory.title);
    });

    // Favorites tests would be similar, checking localStorage for 'commandPaletteFavorites'
    // and verifying their prioritized display. This requires UI elements for favoriting,
    // which might be out of scope for basic unit tests if not easily mockable.
  });
  
  describe('Contextual Commands', () => {
    const ctxCmd = { id: 'ctx.cmd', title: 'Contextual Command', action: jest.fn(), category: 'Context', context: ['testContext'] };
    const generalCmd = { id: 'gen.cmd', title: 'General Command', action: jest.fn(), category: 'General' };

    beforeEach(() => {
      CommandPalette.initialize();
      CommandPalette.registerCommand(ctxCmd);
      CommandPalette.registerCommand(generalCmd);
      CommandPalette.showPalette();
    });

    it('should only show contextual command when context is active', () => {
      const input = document.getElementById('command-palette-input');
      const list = document.getElementById('command-palette-list');

      // No context set
      input.value = 'Command'; // Search for both
      input.dispatchEvent(new Event('input'));
      expect(list.textContent).toContain('General Command');
      expect(list.textContent).not.toContain('Contextual Command');
      
      // Set context
      CommandPalette.setContext(['testContext']);
      input.value = 'Command'; // Search again
      input.dispatchEvent(new Event('input'));
      expect(list.textContent).toContain('General Command');
      expect(list.textContent).toContain('Contextual Command');
    });

    it('should hide contextual command when context is cleared', () => {
      CommandPalette.setContext(['testContext']);
      const input = document.getElementById('command-palette-input');
      const list = document.getElementById('command-palette-list');
      
      input.value = 'Contextual Command';
      input.dispatchEvent(new Event('input'));
      expect(list.textContent).toContain('Contextual Command');

      CommandPalette.clearContext();
      input.dispatchEvent(new Event('input')); // Re-filter
      expect(list.textContent).not.toContain('Contextual Command');
      expect(list.textContent).toContain('No results found'); // Assuming it's the only match
    });
  });
});
