/**
 * AlgorithmPress Command Palette
 * A comprehensive textual input system for controlling the entire AlgorithmPress system
 */

const CommandPalette = (function() {
    // Private state
    const state = {
        initialized: false,
        active: false,
        commands: [],        // All registered commands
        history: [],         // Command execution history
        favorites: {},       // Frequently used commands
        providers: [],       // Command providers
        commandGroups: {},   // Grouped commands by category
        contextFilters: {},  // Context-specific filters
        inputValue: '',      // Current input text
        selectedIndex: 0,    // Currently selected result
        maxResults: 10,      // Maximum number of results to show
        ui: {
            container: null,
            overlay: null,
            inputBar: null,
            resultsContainer: null,
            hintContainer: null
        }
    };
    
    // Command data structure
    /*
    Command structure:
    {
        id: 'unique-command-id',         // Unique identifier
        name: 'Human Readable Name',     // Display name
        description: 'What the command does',
        category: 'category-name',       // For grouping
        keywords: ['keyword1', 'keyword2'], // Alternative search terms
        context: ['desktop', 'editor'],  // Contexts where this command is relevant
        params: [                        // Optional parameters
            { 
                name: 'paramName',
                type: 'string|number|boolean',
                required: true|false,
                description: 'Description of parameter'
            }
        ],
        execute: function(params) { },   // Function to execute the command
        shortcut: 'Ctrl+S',              // Optional keyboard shortcut
        icon: 'fas fa-save',             // Optional icon class (FontAwesome)
        provider: 'core'                 // Who provided this command
    }
    */
    
    // Command providers - modules that provide commands
    const coreProvider = {
        id: 'core',
        name: 'Core System',
        getCommands: function() {
            return [
                {
                    id: 'toggle-desktop-mode',
                    name: 'Toggle Desktop Mode',
                    description: 'Switch between desktop and normal modes',
                    category: 'system',
                    keywords: ['desktop', 'mode', 'switch', 'toggle'],
                    context: ['always'],
                    execute: function() {
                        if (window.DesktopIntegration) {
                            window.DesktopIntegration.toggleDesktopMode();
                            return true;
                        }
                        return false;
                    },
                    shortcut: 'Alt+D',
                    icon: 'fas fa-desktop'
                },
                {
                    id: 'cycle-background-theme',
                    name: 'Cycle Background Theme',
                    description: 'Change to the next background color theme',
                    category: 'appearance',
                    keywords: ['background', 'theme', 'color', 'change'],
                    context: ['desktop'],
                    execute: function() {
                        if (window.DesktopIntegration) {
                            window.DesktopIntegration.cycleBackgroundTheme();
                            return true;
                        }
                        return false;
                    },
                    icon: 'fas fa-palette'
                },
                {
                    id: 'create-new-file',
                    name: 'Create New File',
                    description: 'Create a new PHP file',
                    category: 'file',
                    keywords: ['create', 'new', 'file', 'php'],
                    context: ['always'],
                    params: [
                        {
                            name: 'filename',
                            type: 'string',
                            required: false,
                            description: 'Name of the file to create'
                        }
                    ],
                    execute: function(params) {
                        // Implementation depends on file system integration
                        console.log('Creating new file:', params.filename);
                        // Placeholder for actual implementation
                        return true;
                    },
                    shortcut: 'Ctrl+N',
                    icon: 'fas fa-file'
                },
                {
                    id: 'open-settings',
                    name: 'Open Settings',
                    description: 'Open the settings panel',
                    category: 'system',
                    keywords: ['settings', 'preferences', 'config', 'options'],
                    context: ['always'],
                    execute: function() {
                        if (window.togglePanel) {
                            window.togglePanel('settings');
                            return true;
                        }
                        return false;
                    },
                    icon: 'fas fa-cog'
                },
                {
                    id: 'save-file',
                    name: 'Save Current File',
                    description: 'Save the currently open file',
                    category: 'file',
                    keywords: ['save', 'file', 'store'],
                    context: ['editor'],
                    execute: function() {
                        // Implementation depends on editor integration
                        console.log('Saving current file');
                        // Placeholder for actual implementation
                        return true;
                    },
                    shortcut: 'Ctrl+S',
                    icon: 'fas fa-save'
                },
                {
                    id: 'run-php-code',
                    name: 'Run PHP Code',
                    description: 'Execute the current PHP code',
                    category: 'php',
                    keywords: ['run', 'execute', 'php', 'code'],
                    context: ['editor'],
                    execute: function() {
                        // Implementation depends on PHP-WASM integration
                        console.log('Running PHP code');
                        // Placeholder for actual implementation
                        return true;
                    },
                    shortcut: 'F5',
                    icon: 'fas fa-play'
                },
                {
                    id: 'open-wp-connector',
                    name: 'Open WordPress Connector',
                    description: 'Open the WordPress Connector panel/window',
                    category: 'wordpress',
                    keywords: ['wordpress', 'wp', 'connector', 'open'],
                    context: ['always'],
                    execute: function() {
                        if (window.togglePanel) {
                            window.togglePanel('wordpress-connector');
                            return true;
                        } else if (window.DockDesktopIntegration) {
                            window.DockDesktopIntegration.openModule('wordpress-connector');
                            return true;
                        }
                        return false;
                    },
                    icon: 'fab fa-wordpress'
                }
            ];
        }
    };
    
    // Helper utilities
    const utils = {
        // Score a command based on query
        scoreCommand: function(command, query) {
            if (!query) return 1; // Empty query matches everything
            
            // Convert to lowercase for case-insensitive matching
            query = query.toLowerCase();
            const name = command.name.toLowerCase();
            const desc = command.description.toLowerCase();
            
            // Direct matches in name
            if (name === query) return 100;
            if (name.startsWith(query)) return 90;
            
            // Check keywords
            if (command.keywords && command.keywords.some(k => k.toLowerCase() === query)) {
                return 85;
            }
            
            // Substring matches
            if (name.includes(query)) return 80;
            if (desc.includes(query)) return 70;
            
            // Check if query words match parts of the command name or keywords
            const queryWords = query.split(/\s+/);
            let matchCount = 0;
            
            for (const word of queryWords) {
                if (word.length < 2) continue; // Skip very short words
                
                if (name.includes(word)) {
                    matchCount++;
                } else if (desc.includes(word)) {
                    matchCount += 0.5;
                } else if (command.keywords && command.keywords.some(k => k.toLowerCase().includes(word))) {
                    matchCount += 0.7;
                }
            }
            
            // Score based on how many words matched
            if (matchCount > 0) {
                return 60 * (matchCount / queryWords.length);
            }
            
            // Fuzzy matching
            let fuzzyScore = 0;
            const nameChars = name.split('');
            const queryChars = query.split('');
            let lastFoundIndex = -1;
            
            for (const char of queryChars) {
                const foundIndex = nameChars.findIndex((c, i) => i > lastFoundIndex && c === char);
                if (foundIndex !== -1) {
                    fuzzyScore += 1;
                    lastFoundIndex = foundIndex;
                }
            }
            
            return fuzzyScore > 0 ? 30 * (fuzzyScore / query.length) : 0;
        },
        
        // Determine current context
        getCurrentContext: function() {
            const contexts = ['always']; // Always available context
            
            // Desktop mode context
            if (document.getElementById('desktop-container')) {
                contexts.push('desktop');
            } else {
                contexts.push('normal');
            }
            
            // Editor context - check if editor is active
            const editorElement = document.querySelector('.php-editor, .code-container, .editor-panel');
            if (editorElement) {
                contexts.push('editor');
            }
            
            // WordPress context - check if WP connector is open
            const wpElement = document.querySelector('.wp-connector-panel, .wp-connector-container');
            if (wpElement) {
                contexts.push('wordpress');
            }
            
            return contexts;
        },
        
        // Format keyboard shortcut for display
        formatShortcut: function(shortcut) {
            if (!shortcut) return '';
            
            // Replace platform-specific keys
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if (isMac) {
                return shortcut
                    .replace('Ctrl+', '⌘')
                    .replace('Alt+', '⌥')
                    .replace('Shift+', '⇧');
            }
            
            return shortcut;
        },
        
        // Check if command should be shown in current context
        isCommandAvailableInContext: function(command) {
            if (!command.context || command.context.includes('always')) {
                return true;
            }
            
            const currentContext = this.getCurrentContext();
            return command.context.some(ctx => currentContext.includes(ctx));
        },
        
        // Create a throttled function
        throttle: function(func, delay) {
            let lastCall = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    return func.apply(this, args);
                }
            };
        }
    };
    
    // UI management
    const ui = {
        // Create the UI elements
        create: function() {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'command-palette-overlay';
            
            // Create container
            const container = document.createElement('div');
            container.className = 'command-palette-container';
            overlay.appendChild(container);
            
            // Create input bar
            const inputBar = document.createElement('div');
            inputBar.className = 'command-palette-input-bar';
            container.appendChild(inputBar);
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'command-palette-input';
            input.placeholder = 'Type a command or search...';
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
            inputBar.appendChild(input);
            
            // Create clear button
            const clearBtn = document.createElement('button');
            clearBtn.className = 'command-palette-clear-btn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearBtn.title = 'Clear';
            clearBtn.addEventListener('click', function() {
                input.value = '';
                input.focus();
                events.onInputChange('');
            });
            inputBar.appendChild(clearBtn);
            
            // Create results container
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'command-palette-results';
            container.appendChild(resultsContainer);
            
            // Create hint container
            const hintContainer = document.createElement('div');
            hintContainer.className = 'command-palette-hint';
            container.appendChild(hintContainer);
            
            // Store references
            state.ui.overlay = overlay;
            state.ui.container = container;
            state.ui.inputBar = inputBar;
            state.ui.input = input;
            state.ui.resultsContainer = resultsContainer;
            state.ui.hintContainer = hintContainer;
            
            // Add event listeners
            input.addEventListener('input', utils.throttle(function() {
                events.onInputChange(this.value);
            }, 100));
            
            input.addEventListener('keydown', function(e) {
                events.onInputKeyDown(e);
            });
            
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    ui.hide();
                }
            });
            
            // Add to body
            document.body.appendChild(overlay);
            
            // Hide initially
            this.hide();
        },
        
        // Show the command palette
        show: function() {
            if (!state.ui.overlay) {
                this.create();
            }
            
            state.ui.overlay.classList.add('active');
            state.ui.input.value = '';
            state.ui.input.focus();
            state.active = true;
            
            // Initialize with empty results
            this.updateResults([]);
            
            // Show hints
            this.updateHints();
            
            // Apply glass effect if NaraUI is available
            if (window.NaraUI) {
                window.NaraUI.register('.command-palette-container', {
                    glassStrength: 1.0,
                    reflectionStrength: 0.7,
                    dynamicTextColor: false,
                    priority: 30
                });
            }
            
            // Dispatch event that palette is open
            document.dispatchEvent(new CustomEvent('command-palette-opened'));
        },
        
        // Hide the command palette
        hide: function() {
            if (state.ui.overlay) {
                state.ui.overlay.classList.remove('active');
                state.active = false;
                
                // Dispatch event that palette is closed
                document.dispatchEvent(new CustomEvent('command-palette-closed'));
            }
        },
        
        // Toggle the command palette
        toggle: function() {
            if (state.active) {
                this.hide();
            } else {
                this.show();
            }
        },
        
        // Update results based on filtered commands
        updateResults: function(filteredCommands) {
            const container = state.ui.resultsContainer;
            if (!container) return;
            
            container.innerHTML = '';
            state.selectedIndex = 0;
            
            if (filteredCommands.length === 0) {
                // Show no results message
                const noResults = document.createElement('div');
                noResults.className = 'command-palette-no-results';
                noResults.innerHTML = `
                    <i class="fas fa-search"></i>
                    <span>No commands found. Try a different search.</span>
                `;
                container.appendChild(noResults);
                
                // If input has content, suggest creating custom command
                if (state.inputValue.trim()) {
                    const customCommandHint = document.createElement('div');
                    customCommandHint.className = 'command-palette-custom-hint';
                    customCommandHint.textContent = `Tip: Type ">" to create a custom command`;
                    container.appendChild(customCommandHint);
                }
                
                return;
            }
            
            // Limit number of results
            const commands = filteredCommands.slice(0, state.maxResults);
            
            // Group commands by category if results are many
            let lastCategory = null;
            
            commands.forEach((command, index) => {
                // Create category separator if changed
                if (command.category && command.category !== lastCategory) {
                    lastCategory = command.category;
                    
                    // Create category heading
                    const categoryHeading = document.createElement('div');
                    categoryHeading.className = 'command-palette-category';
                    categoryHeading.textContent = command.category.charAt(0).toUpperCase() + command.category.slice(1);
                    container.appendChild(categoryHeading);
                }
                
                // Create result item
                const item = document.createElement('div');
                item.className = 'command-palette-result';
                item.setAttribute('data-command-id', command.id);
                
                if (index === state.selectedIndex) {
                    item.classList.add('selected');
                }
                
                // Add icon if available
                let iconHtml = '';
                if (command.icon) {
                    iconHtml = `<i class="${command.icon}"></i>`;
                }
                
                // Format shortcut if available
                let shortcutHtml = '';
                if (command.shortcut) {
                    const formattedShortcut = utils.formatShortcut(command.shortcut);
                    shortcutHtml = `<span class="command-palette-shortcut">${formattedShortcut}</span>`;
                }
                
                // Create content
                item.innerHTML = `
                    <div class="command-palette-result-icon">${iconHtml}</div>
                    <div class="command-palette-result-content">
                        <div class="command-palette-result-name">${command.name}</div>
                        <div class="command-palette-result-description">${command.description}</div>
                    </div>
                    ${shortcutHtml}
                `;
                
                // Add click handler
                item.addEventListener('click', function() {
                    const commandId = this.getAttribute('data-command-id');
                    events.onResultSelected(commandId);
                });
                
                // Add mouseover handler
                item.addEventListener('mouseover', function() {
                    const items = container.querySelectorAll('.command-palette-result');
                    items.forEach(i => i.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    // Update selected index
                    const newIndex = Array.from(items).indexOf(this);
                    if (newIndex !== -1) {
                        state.selectedIndex = newIndex;
                    }
                });
                
                container.appendChild(item);
            });
        },
        
        // Update hints container
        updateHints: function() {
            const container = state.ui.hintContainer;
            if (!container) return;
            
            // Clear current hints
            container.innerHTML = '';
            
            // Create basic hints
            const hints = [
                { key: '↑/↓', description: 'Navigate' },
                { key: 'Enter', description: 'Execute command' },
                { key: 'Esc', description: 'Close' },
                { key: 'Tab', description: 'Autocomplete' }
            ];
            
            // Create hint elements
            hints.forEach(hint => {
                const hintElement = document.createElement('div');
                hintElement.className = 'command-palette-hint-item';
                hintElement.innerHTML = `
                    <span class="command-palette-hint-key">${hint.key}</span>
                    <span class="command-palette-hint-description">${hint.description}</span>
                `;
                container.appendChild(hintElement);
            });
        },
        
        // Move selection up/down
        moveSelection: function(direction) {
            const items = state.ui.resultsContainer.querySelectorAll('.command-palette-result');
            if (items.length === 0) return;
            
            // Update selected index
            if (direction === 'up') {
                state.selectedIndex = (state.selectedIndex - 1 + items.length) % items.length;
            } else {
                state.selectedIndex = (state.selectedIndex + 1) % items.length;
            }
            
            // Update UI
            items.forEach((item, index) => {
                if (index === state.selectedIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        }
    };
    
    // Command management
    const commandManager = {
        // Register a new command provider
        registerProvider: function(provider) {
            if (!provider.id || !provider.getCommands) {
                console.error('Invalid command provider', provider);
                return false;
            }
            
            // Replace if provider with same ID already exists
            const existingIndex = state.providers.findIndex(p => p.id === provider.id);
            if (existingIndex !== -1) {
                state.providers[existingIndex] = provider;
            } else {
                state.providers.push(provider);
            }
            
            // Refresh commands
            this.refreshCommands();
            return true;
        },
        
        // Refresh commands from all providers
        refreshCommands: function() {
            state.commands = [];
            state.commandGroups = {};
            
            // Get commands from all providers
            state.providers.forEach(provider => {
                try {
                    const providerCommands = provider.getCommands();
                    
                    if (Array.isArray(providerCommands)) {
                        // Add provider ID to each command
                        providerCommands.forEach(command => {
                            if (!command.provider) {
                                command.provider = provider.id;
                            }
                        });
                        
                        // Add to command list
                        state.commands = state.commands.concat(providerCommands);
                        
                        // Group by category
                        providerCommands.forEach(command => {
                            if (command.category) {
                                if (!state.commandGroups[command.category]) {
                                    state.commandGroups[command.category] = [];
                                }
                                state.commandGroups[command.category].push(command);
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error getting commands from provider ${provider.id}:`, error);
                }
            });
        },
        
        // Register a single command
        registerCommand: function(command) {
            if (!command.id || !command.name || !command.execute) {
                console.error('Invalid command', command);
                return false;
            }
            
            // Replace if command with same ID already exists
            const existingIndex = state.commands.findIndex(c => c.id === command.id);
            if (existingIndex !== -1) {
                state.commands[existingIndex] = command;
            } else {
                state.commands.push(command);
            }
            
            // Add to category group
            if (command.category) {
                if (!state.commandGroups[command.category]) {
                    state.commandGroups[command.category] = [];
                }
                
                const categoryIndex = state.commandGroups[command.category].findIndex(c => c.id === command.id);
                if (categoryIndex !== -1) {
                    state.commandGroups[command.category][categoryIndex] = command;
                } else {
                    state.commandGroups[command.category].push(command);
                }
            }
            
            return true;
        },
        
        // Find command by ID
        getCommandById: function(id) {
            return state.commands.find(c => c.id === id);
        },
        
        // Filter commands by query
        filterCommands: function(query) {
            if (!query) {
                // If no query, return recent and popular commands
                return this.getTopCommands();
            }
            
            // Check if it's a category filter
            if (query.startsWith('#')) {
                const category = query.substring(1).toLowerCase();
                if (category && state.commandGroups[category]) {
                    return state.commandGroups[category].filter(command => 
                        utils.isCommandAvailableInContext(command)
                    );
                }
            }
            
            // Check if it's a module/provider filter
            if (query.startsWith('@')) {
                const provider = query.substring(1).toLowerCase();
                return state.commands.filter(command => 
                    command.provider && command.provider.toLowerCase() === provider &&
                    utils.isCommandAvailableInContext(command)
                );
            }
            
            // Regular search - score and filter commands
            return state.commands
                .filter(command => utils.isCommandAvailableInContext(command))
                .map(command => ({
                    command,
                    score: utils.scoreCommand(command, query)
                }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(item => item.command);
        },
        
        // Get top/recent commands for empty query
        getTopCommands: function() {
            // Mix of favorite, recent, and contextually relevant commands
            const result = [];
            const context = utils.getCurrentContext();
            
            // Add favorite commands first
            const favoriteIds = Object.keys(state.favorites)
                .sort((a, b) => state.favorites[b] - state.favorites[a])
                .slice(0, 5);
                
            favoriteIds.forEach(id => {
                const command = this.getCommandById(id);
                if (command && utils.isCommandAvailableInContext(command)) {
                    result.push(command);
                }
            });
            
            // Add recent commands
            state.history.slice(0, 5).forEach(id => {
                // Don't add duplicates from favorites
                if (!result.some(cmd => cmd.id === id)) {
                    const command = this.getCommandById(id);
                    if (command && utils.isCommandAvailableInContext(command)) {
                        result.push(command);
                    }
                }
            });
            
            // Add context-specific commands
            context.forEach(ctx => {
                if (ctx === 'always') return; // Skip the 'always' context
                
                state.commands.forEach(command => {
                    if (command.context && command.context.includes(ctx) &&
                        !result.some(cmd => cmd.id === command.id)) {
                        result.push(command);
                    }
                });
            });
            
            // Add some general commands if we don't have enough
            if (result.length < 7) {
                state.commands.forEach(command => {
                    if (!result.some(cmd => cmd.id === command.id) &&
                        utils.isCommandAvailableInContext(command)) {
                        result.push(command);
                        if (result.length >= 10) return;
                    }
                });
            }
            
            return result.slice(0, state.maxResults);
        },
        
        // Execute a command by ID
        executeCommand: function(id) {
            const command = this.getCommandById(id);
            if (!command) {
                console.error(`Command not found: ${id}`);
                return false;
            }
            
            try {
                // Check if command needs parameters
                if (command.params && command.params.some(p => p.required)) {
                    // Handle required parameters - not implemented yet
                    console.log('Command requires parameters:', command.params);
                    return false;
                }
                
                // Execute the command
                const result = command.execute({});
                
                // Update history and favorites on successful execution
                if (result !== false) {
                    this.recordCommandExecution(id);
                }
                
                return result;
            } catch (error) {
                console.error(`Error executing command ${id}:`, error);
                return false;
            }
        },
        
        // Record command execution for history and favorites
        recordCommandExecution: function(id) {
            // Update history - add to beginning, remove duplicates
            state.history = [id, ...state.history.filter(cmd => cmd !== id)].slice(0, 20);
            
            // Update favorites (frequency counter)
            state.favorites[id] = (state.favorites[id] || 0) + 1;
            
            // Store in localStorage if available
            try {
                localStorage.setItem('cmdPalette_history', JSON.stringify(state.history));
                localStorage.setItem('cmdPalette_favorites', JSON.stringify(state.favorites));
            } catch (e) {
                // Ignore storage errors
            }
        },
        
        // Load history and favorites from localStorage
        loadUserData: function() {
            try {
                const history = localStorage.getItem('cmdPalette_history');
                if (history) {
                    state.history = JSON.parse(history);
                }
                
                const favorites = localStorage.getItem('cmdPalette_favorites');
                if (favorites) {
                    state.favorites = JSON.parse(favorites);
                }
            } catch (e) {
                // Ignore storage errors
                console.warn('Error loading command palette user data', e);
            }
        }
    };
    
    // Event handlers
    const events = {
        // Handle input change
        onInputChange: function(value) {
            state.inputValue = value;
            
            // Filter commands based on input
            const filtered = commandManager.filterCommands(value);
            
            // Update results UI
            ui.updateResults(filtered);
        },
        
        // Handle input keydown
        onInputKeyDown: function(e) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    ui.moveSelection('up');
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    ui.moveSelection('down');
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    this.onExecuteCurrent();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    ui.hide();
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    this.onAutocomplete();
                    break;
            }
        },
        
        // Execute the currently selected command
        onExecuteCurrent: function() {
            const selected = state.ui.resultsContainer.querySelector('.command-palette-result.selected');
            if (selected) {
                const commandId = selected.getAttribute('data-command-id');
                this.onResultSelected(commandId);
            }
        },
        
        // Handle result selection
        onResultSelected: function(commandId) {
            // Hide palette first
            ui.hide();
            
            // Execute command
            setTimeout(() => {
                commandManager.executeCommand(commandId);
            }, 50);
        },
        
        // Handle autocomplete
        onAutocomplete: function() {
            const selected = state.ui.resultsContainer.querySelector('.command-palette-result.selected');
            if (selected) {
                const commandId = selected.getAttribute('data-command-id');
                const command = commandManager.getCommandById(commandId);
                if (command) {
                    state.ui.input.value = command.name;
                    state.inputValue = command.name;
                    events.onInputChange(command.name);
                }
            }
        },
        
        // Global key handler for showing palette
        globalKeyHandler: function(e) {
            // Check for Ctrl+P / Cmd+P
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                ui.toggle();
                return;
            }
            
            // Check for Ctrl+K / Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                ui.toggle();
                return;
            }
            
            // Check for F1
            if (e.key === 'F1') {
                e.preventDefault();
                ui.toggle();
                return;
            }
        }
    };
    
    // Initialize the system
    const initialize = function() {
        if (state.initialized) return;
        
        // Register core provider
        state.providers.push(coreProvider);
        
        // Load commands from all providers
        commandManager.refreshCommands();
        
        // Load user data
        commandManager.loadUserData();
        
        // Register global key handler
        document.addEventListener('keydown', events.globalKeyHandler);
        
        // Create UI
        ui.create();
        
        state.initialized = true;
        
        // Dispatch initialization event
        document.dispatchEvent(new CustomEvent('command-palette-initialized'));
    };
    
    // Public API
    return {
        // Initialize the command palette
        init: function() {
            initialize();
            return this;
        },
        
        // Show the command palette
        show: function() {
            if (!state.initialized) {
                initialize();
            }
            ui.show();
            return this;
        },
        
        // Hide the command palette
        hide: function() {
            ui.hide();
            return this;
        },
        
        // Register a new command
        registerCommand: function(command) {
            if (!state.initialized) {
                initialize();
            }
            return commandManager.registerCommand(command);
        },
        
        // Register a new command provider
        registerProvider: function(provider) {
            if (!state.initialized) {
                initialize();
            }
            return commandManager.registerProvider(provider);
        },
        
        // Execute a command by ID
        executeCommand: function(id) {
            if (!state.initialized) {
                initialize();
            }
            return commandManager.executeCommand(id);
        },
        
        // Get all registered commands
        getCommands: function() {
            return [...state.commands];
        },
        
        // Force refresh commands from all providers
        refreshCommands: function() {
            commandManager.refreshCommands();
            return this;
        }
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        CommandPalette.init();
    }, 1000);
});

// Export for global access
window.CommandPalette = CommandPalette;
