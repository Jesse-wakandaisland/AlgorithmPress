/**
 * Nue.js Integration Module for PHP-WASM Builder
 * 
 * This module provides seamless integration between PHP-WASM and Nue.js,
 * allowing for automatic translation of PHP code to Nue.js compatible code.
 * 
 * Features:
 * - Toggle in navigation for enabling/disabling Nue.js integration
 * - Dropdown to select mode: PHP-WASM only, Nue.js only, or hybrid mode
 * - Automatic translation of PHP code to Nue.js
 * - Preservation of all PHP-WASM Builder functionality
 * - Maintains glassmorphic UI styling consistency
 */

const NueIntegration = (function() {
    // Private variables
    let _initialized = false;
    let _active = false;
    let _mode = 'php-wasm'; // 'php-wasm', 'nue', 'hybrid'
    let _originalCode = '';
    let _nueCode = '';
    let _settings = {
        autoTranslate: true,
        preserveComments: true,
        optimizeForPerformance: true,
        useHtmlFirst: true,
        generateWebComponents: true
    };
    
    // DOM Elements
    let _nueNavItem;
    let _nueToggle;
    let _modeSelector;
    let _settingsPanel;
    
    // Component translations mapping (PHP to Nue.js)
    const _componentTranslations = {
        // PHP component patterns to their Nue.js equivalents
        'form': {
            pattern: /<\?php\s+.*?<form(.*?)>([\s\S]*?)<\/form>/g,
            replacement: (match, attributes, content) => {
                return `<form${attributes} @submit="submitForm">
                    ${_translateFormContent(content)}
                </form>`;
            }
        },
        'foreach': {
            pattern: /<\?php\s+foreach\s*\(\s*\$([a-zA-Z0-9_]+)\s+as\s+\$([a-zA-Z0-9_]+)(?:\s*=>\s*\$([a-zA-Z0-9_]+))?\s*\)\s*:\s*\?>([\s\S]*?)<\?php\s+endforeach;\s*\?>/g,
            replacement: (match, array, key, value, content) => {
                if (value) {
                    return `{${array}.map((${value}, ${key}) => (
                        <div key={${key}}>
                            ${_translateContent(content, { [key]: key, [value]: value })}
                        </div>
                    ))}`;
                } else {
                    return `{${array}.map((${key}, index) => (
                        <div key={index}>
                            ${_translateContent(content, { [key]: key })}
                        </div>
                    ))}`;
                }
            }
        },
        'if': {
            pattern: /<\?php\s+if\s*\((.*?)\)\s*:\s*\?>([\s\S]*?)(?:<\?php\s+else\s*:\s*\?>([\s\S]*?))?<\?php\s+endif;\s*\?>/g,
            replacement: (match, condition, ifContent, elseContent) => {
                const translatedCondition = _translateCondition(condition);
                if (elseContent) {
                    return `{${translatedCondition} ? (
                        ${_translateContent(ifContent)}
                    ) : (
                        ${_translateContent(elseContent)}
                    )}`;
                } else {
                    return `{${translatedCondition} && (
                        ${_translateContent(ifContent)}
                    )}`;
                }
            }
        },
        'echo': {
            pattern: /<\?php\s+echo\s+(.*?);\s*\?>/g,
            replacement: (match, variable) => {
                return `{${_translateVariable(variable)}}`;
            }
        }
    };
    
    // Function translations (PHP to JavaScript)
    const _functionTranslations = {
        // PHP functions to their JavaScript equivalents
        'strlen': 'length',
        'substr': 'substring',
        'strtolower': 'toLowerCase',
        'strtoupper': 'toUpperCase',
        'trim': 'trim',
        'explode': 'split',
        'implode': 'join',
        'array_push': 'push',
        'array_pop': 'pop',
        'array_shift': 'shift',
        'array_unshift': 'unshift',
        'array_slice': 'slice',
        'array_splice': 'splice',
        'array_map': 'map',
        'array_filter': 'filter',
        'array_reduce': 'reduce',
        'array_merge': '(a, b) => [...a, ...b]',
        'count': 'length',
        'var_dump': 'console.log',
        'print_r': 'console.log',
        'json_encode': 'JSON.stringify',
        'json_decode': 'JSON.parse'
    };
    
    /**
     * Initialize the Nue.js integration module
     */
    function init() {
        if (_initialized) return;
        
        console.log('Initializing Nue.js Integration Module...');
        
        // Create the UI components
        _createUI();
        
        // Load saved settings
        _loadSettings();
        
        // Register event listeners
        _registerEventListeners();
        
        // Add the Nue.js script if not already added
        _addNueScript();
        
        _initialized = true;
        console.log('Nue.js Integration Module initialized successfully');
    }
    
    /**
     * Create the UI components for the Nue.js integration
     */
    function _createUI() {
        // Create the Nue.js nav item with toggle
        _createNavItem();
        
        // Create the mode selector dropdown
        _createModeSelector();
        
        // Create the settings panel
        _createSettingsPanel();
    }
    
    /**
     * Create the navigation item with toggle switch
     */
    function _createNavItem() {
        // Try to find the navigation container with fallbacks
        const navContainer = document.querySelector('.main-nav-container') || 
                            document.querySelector('.nav-container') ||
                            document.querySelector('nav') ||
                            document.querySelector('header');
        
        if (!navContainer) {
            console.error('Navigation container not found, creating one');
            // Create a navigation container if none exists
            const newNavContainer = document.createElement('div');
            newNavContainer.className = 'nue-nav-container';
            newNavContainer.style.position = 'fixed';
            newNavContainer.style.top = '10px';
            newNavContainer.style.right = '10px';
            newNavContainer.style.zIndex = '1000';
            document.body.appendChild(newNavContainer);
            return newNavContainer;
        }
        
        _nueNavItem = document.createElement('div');
        _nueNavItem.className = 'nav-item';
        _nueNavItem.id = 'nue-nav-item';
        
        // Create toggle switch
        _nueToggle = document.createElement('label');
        _nueToggle.className = 'toggle-switch';
        _nueToggle.innerHTML = `
            <input type="checkbox" id="nue-toggle">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Nue.js</span>
        `;
        
        _nueNavItem.appendChild(_nueToggle);
        navContainer.appendChild(_nueNavItem);
    }
    
    /**
     * Create the mode selector dropdown
     */
    function _createModeSelector() {
        // Try to find the navigation container with the same fallbacks as in _createNavItem
        const navContainer = document.querySelector('.main-nav-container') || 
                            document.querySelector('.nav-container') ||
                            document.querySelector('nav') ||
                            document.querySelector('header') ||
                            document.querySelector('.nue-nav-container');
        
        if (!navContainer) {
            console.error('Navigation container not found for mode selector');
            return;
        }
        
        const modeContainer = document.createElement('div');
        modeContainer.className = 'nav-item mode-selector-container';
        modeContainer.id = 'nue-mode-container';
        modeContainer.style.display = 'none'; // Hidden by default
        
        _modeSelector = document.createElement('select');
        _modeSelector.className = 'mode-selector glass-select';
        _modeSelector.id = 'nue-mode-selector';
        _modeSelector.innerHTML = `
            <option value="php-wasm">PHP-WASM Only</option>
            <option value="nue">Nue.js Only</option>
            <option value="hybrid">Hybrid Mode</option>
        `;
        
        modeContainer.appendChild(_modeSelector);
        navContainer.appendChild(modeContainer);
    }
    
    /**
     * Create the settings panel for Nue.js integration
     */
    function _createSettingsPanel() {
        // Try to find an appropriate container, with fallbacks
        let mainContainer = document.querySelector('.main-container') || 
                           document.querySelector('.php-wasm-builder') || 
                           document.querySelector('.builder-container') || 
                           document.querySelector('.app-container') || 
                           document.body;
        
        // Log which container we're using for debugging
        console.log('Using container:', mainContainer.tagName || mainContainer.className);
        
        _settingsPanel = document.createElement('div');
        _settingsPanel.className = 'panel nue-settings-panel glass-panel hidden';
        _settingsPanel.id = 'nue-settings-panel';
        _settingsPanel.innerHTML = `
            <div class="panel-header">
                <h2>Nue.js Integration Settings</h2>
                <div class="panel-controls">
                    <button id="nue-settings-close-btn" class="glass-button small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="panel-body">
                <div class="settings-group">
                    <h3>Translation Settings</h3>
                    <div class="setting-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="auto-translate-toggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Auto-translate on code change</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="preserve-comments-toggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Preserve comments</span>
                        </label>
                    </div>
                </div>
                <div class="settings-group">
                    <h3>Performance Settings</h3>
                    <div class="setting-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="optimize-performance-toggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Optimize for performance</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="html-first-toggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Use HTML-first approach</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="web-components-toggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Generate web components</span>
                        </label>
                    </div>
                </div>
                <div class="settings-group code-preview">
                    <h3>Code Preview</h3>
                    <div class="code-tabs">
                        <button id="php-tab" class="code-tab active">PHP-WASM</button>
                        <button id="nue-tab" class="code-tab">Nue.js</button>
                    </div>
                    <div class="code-panels">
                        <div id="php-panel" class="code-panel active">
                            <pre><code id="php-code"></code></pre>
                        </div>
                        <div id="nue-panel" class="code-panel">
                            <pre><code id="nue-code"></code></pre>
                        </div>
                    </div>
                </div>
                <div class="settings-actions">
                    <button id="translate-btn" class="glass-button primary">
                        <i class="fas fa-sync"></i> Translate Now
                    </button>
                    <button id="copy-nue-btn" class="glass-button">
                        <i class="fas fa-copy"></i> Copy Nue.js Code
                    </button>
                    <button id="reset-settings-btn" class="glass-button">
                        <i class="fas fa-undo"></i> Reset Settings
                    </button>
                </div>
            </div>
        `;
        
        mainContainer.appendChild(_settingsPanel);
    }
    
    /**
     * Register event listeners for the Nue.js integration UI
     */
    function _registerEventListeners() {
        // Nue.js toggle
        const nueToggle = document.getElementById('nue-toggle');
        if (nueToggle) {
            nueToggle.addEventListener('change', function() {
                toggleNueIntegration(this.checked);
            });
        }
        
        // Mode selector
        if (_modeSelector) {
            _modeSelector.addEventListener('change', function() {
                setMode(this.value);
            });
        }
        
        // Settings panel close button
        const closeBtn = document.getElementById('nue-settings-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toggleSettingsPanel(false);
            });
        }
        
        // Settings toggles
        const autoTranslateToggle = document.getElementById('auto-translate-toggle');
        if (autoTranslateToggle) {
            autoTranslateToggle.addEventListener('change', function() {
                _settings.autoTranslate = this.checked;
                _saveSettings();
            });
        }
        
        const preserveCommentsToggle = document.getElementById('preserve-comments-toggle');
        if (preserveCommentsToggle) {
            preserveCommentsToggle.addEventListener('change', function() {
                _settings.preserveComments = this.checked;
                _saveSettings();
            });
        }
        
        const optimizePerformanceToggle = document.getElementById('optimize-performance-toggle');
        if (optimizePerformanceToggle) {
            optimizePerformanceToggle.addEventListener('change', function() {
                _settings.optimizeForPerformance = this.checked;
                _saveSettings();
            });
        }
        
        const htmlFirstToggle = document.getElementById('html-first-toggle');
        if (htmlFirstToggle) {
            htmlFirstToggle.addEventListener('change', function() {
                _settings.useHtmlFirst = this.checked;
                _saveSettings();
            });
        }
        
        const webComponentsToggle = document.getElementById('web-components-toggle');
        if (webComponentsToggle) {
            webComponentsToggle.addEventListener('change', function() {
                _settings.generateWebComponents = this.checked;
                _saveSettings();
            });
        }
        
        // Code tabs
        const phpTab = document.getElementById('php-tab');
        const nueTab = document.getElementById('nue-tab');
        const phpPanel = document.getElementById('php-panel');
        const nuePanel = document.getElementById('nue-panel');
        
        if (phpTab && nueTab && phpPanel && nuePanel) {
            phpTab.addEventListener('click', function() {
                phpTab.classList.add('active');
                nueTab.classList.remove('active');
                phpPanel.classList.add('active');
                nuePanel.classList.remove('active');
            });
            
            nueTab.addEventListener('click', function() {
                nueTab.classList.add('active');
                phpTab.classList.remove('active');
                nuePanel.classList.add('active');
                phpPanel.classList.remove('active');
            });
        }
        
        // Action buttons
        const translateBtn = document.getElementById('translate-btn');
        if (translateBtn) {
            translateBtn.addEventListener('click', function() {
                translateCode();
            });
        }
        
        const copyNueBtn = document.getElementById('copy-nue-btn');
        if (copyNueBtn) {
            copyNueBtn.addEventListener('click', function() {
                copyNueCode();
            });
        }
        
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', function() {
                resetSettings();
            });
        }
        
        // Listen for code changes in the PHP-WASM editor
        document.addEventListener('php-wasm-code-change', function(e) {
            if (_active && _settings.autoTranslate) {
                _originalCode = e.detail.code;
                translateCode();
            }
        });
        
        // Add settings gear button to nav item
        const nueNavItem = document.getElementById('nue-nav-item');
        if (nueNavItem) {
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'nue-settings-btn glass-button small';
            settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
            settingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleSettingsPanel();
            });
            
            nueNavItem.appendChild(settingsBtn);
        }
    }
    
    /**
     * Add the Nue.js script to the document
     */
    function _addNueScript() {
        if (document.getElementById('nue-script')) return;
        
        const nueScript = document.createElement('script');
        nueScript.id = 'nue-script';
        nueScript.src = 'https://cdn.jsdelivr.net/npm/nuejs@latest/dist/nue.min.js';
        nueScript.defer = true;
        
        document.head.appendChild(nueScript);
    }
    
    /**
     * Toggle the Nue.js integration
     * @param {boolean} enable - Whether to enable or disable the integration
     */
    function toggleNueIntegration(enable) {
        _active = enable === undefined ? !_active : enable;
        
        // Update the toggle state
        const nueToggle = document.getElementById('nue-toggle');
        if (nueToggle) {
            nueToggle.checked = _active;
        }
        
        // Show/hide the mode selector
        const modeContainer = document.getElementById('nue-mode-container');
        if (modeContainer) {
            modeContainer.style.display = _active ? 'block' : 'none';
        }
        
        // If enabled, translate the current code
        if (_active) {
            // Get the current PHP code from the editor
            const editor = document.querySelector('.CodeMirror');
            if (editor && editor.CodeMirror) {
                _originalCode = editor.CodeMirror.getValue();
                translateCode();
            }
        }
        
        // Update UI based on active state
        _updateUI();
        
        // Save the active state
        _saveSettings();
    }
    
    /**
     * Set the integration mode
     * @param {string} mode - The mode to set ('php-wasm', 'nue', 'hybrid')
     */
    function setMode(mode) {
        if (['php-wasm', 'nue', 'hybrid'].includes(mode)) {
            _mode = mode;
            
            // Update the mode selector
            if (_modeSelector) {
                _modeSelector.value = mode;
            }
            
            // Update UI based on mode
            _updateUI();
            
            // Save the mode
            _saveSettings();
        }
    }
    
    /**
     * Toggle the settings panel
     * @param {boolean} show - Whether to show or hide the panel
     */
    function toggleSettingsPanel(show) {
        if (_settingsPanel) {
            if (show === undefined) {
                _settingsPanel.classList.toggle('hidden');
            } else if (show) {
                _settingsPanel.classList.remove('hidden');
            } else {
                _settingsPanel.classList.add('hidden');
            }
            
            // Update the code displays when showing
            if (!_settingsPanel.classList.contains('hidden')) {
                _updateCodeDisplays();
            }
        }
    }
    
    /**
     * Update the code displays in the settings panel
     */
    function _updateCodeDisplays() {
        const phpCode = document.getElementById('php-code');
        const nueCode = document.getElementById('nue-code');
        
        if (phpCode && nueCode) {
            phpCode.textContent = _originalCode || '';
            nueCode.textContent = _nueCode || '';
            
            // Apply syntax highlighting if available
            if (window.hljs) {
                window.hljs.highlightElement(phpCode);
                window.hljs.highlightElement(nueCode);
            }
        }
    }
    
    /**
     * Update the UI based on the active state and mode
     */
    function _updateUI() {
        // Try to find the relevant containers with multiple possible selectors
        const previewContainer = document.querySelector('.preview-container') || 
                                document.querySelector('.preview') ||
                                document.querySelector('[data-role="preview"]');
        
        const editorContainer = document.querySelector('.editor-container') || 
                               document.querySelector('.editor') ||
                               document.querySelector('[data-role="editor"]') ||
                               document.querySelector('.CodeMirror');
        
        // Create a status indicator if containers aren't found
        if (!previewContainer && !editorContainer) {
            const statusIndicator = document.getElementById('nue-status-indicator') || 
                                   document.createElement('div');
            
            statusIndicator.id = 'nue-status-indicator';
            statusIndicator.style.position = 'fixed';
            statusIndicator.style.bottom = '10px';
            statusIndicator.style.right = '10px';
            statusIndicator.style.padding = '8px 12px';
            statusIndicator.style.background = 'rgba(66, 139, 255, 0.2)';
            statusIndicator.style.borderRadius = '4px';
            statusIndicator.style.color = 'rgba(66, 139, 255, 0.9)';
            statusIndicator.style.fontSize = '0.9rem';
            statusIndicator.style.zIndex = '1000';
            
            statusIndicator.textContent = _active 
                ? `Nue.js Integration Active (${_mode} mode)` 
                : 'Nue.js Integration Inactive';
            
            if (!document.body.contains(statusIndicator)) {
                document.body.appendChild(statusIndicator);
            }
            
            return;
        }
        
        if (_active) {
            // Add a class to indicate Nue.js integration is active
            document.body.classList.add('nue-active');
            
            if (_mode === 'nue') {
                // Nue.js only mode
                previewContainer.classList.add('nue-preview');
                editorContainer.classList.add('nue-editor');
                
                // Change editor syntax highlighting if possible
                const editor = document.querySelector('.CodeMirror');
                if (editor && editor.CodeMirror) {
                    // Change mode to HTML/JS if possible
                    if (editor.CodeMirror.setOption) {
                        editor.CodeMirror.setOption('mode', 'htmlmixed');
                    }
                }
            } else if (_mode === 'hybrid') {
                // Hybrid mode
                previewContainer.classList.add('hybrid-preview');
                editorContainer.classList.add('hybrid-editor');
                
                // Split view for editor if possible
                // This would require more complex implementation
            } else {
                // PHP-WASM mode with Nue.js translation
                previewContainer.classList.add('php-nue-preview');
                editorContainer.classList.add('php-nue-editor');
            }
        } else {
            // Remove all Nue.js related classes
            document.body.classList.remove('nue-active');
            previewContainer.classList.remove('nue-preview', 'hybrid-preview', 'php-nue-preview');
            editorContainer.classList.remove('nue-editor', 'hybrid-editor', 'php-nue-editor');
            
            // Restore editor syntax highlighting
            const editor = document.querySelector('.CodeMirror');
            if (editor && editor.CodeMirror && editor.CodeMirror.setOption) {
                editor.CodeMirror.setOption('mode', 'php');
            }
        }
    }
    
    /**
     * Translate PHP code to Nue.js code
     * @param {string} code - The PHP code to translate (optional)
     * @returns {string} The translated Nue.js code
     */
    function translateCode(code) {
        if (code) {
            _originalCode = code;
        }
        
        if (!_originalCode) {
            console.error('No code to translate');
            return '';
        }
        
        let translatedCode = _originalCode;
        
        // Process PHP opening/closing tags
        translatedCode = _processPhpTags(translatedCode);
        
        // Process PHP components
        for (const component in _componentTranslations) {
            const translation = _componentTranslations[component];
            translatedCode = translatedCode.replace(translation.pattern, translation.replacement);
        }
        
        // Process PHP functions
        for (const func in _functionTranslations) {
            const jsFunc = _functionTranslations[func];
            const funcPattern = new RegExp(`${func}\\(`, 'g');
            translatedCode = translatedCode.replace(funcPattern, `${jsFunc}(`);
        }
        
        // Process PHP variables
        translatedCode = _processPhpVariables(translatedCode);
        
        // Add Nue.js specific structure if needed
        translatedCode = _addNueStructure(translatedCode);
        
        // Store the translated code
        _nueCode = translatedCode;
        
        // Update the code displays
        _updateCodeDisplays();
        
        // If in Nue.js only mode, update the editor
        if (_active && _mode === 'nue') {
            const editor = document.querySelector('.CodeMirror');
            if (editor && editor.CodeMirror) {
                editor.CodeMirror.setValue(_nueCode);
            }
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('nue-code-translated', {
            detail: {
                originalCode: _originalCode,
                nueCode: _nueCode
            }
        }));
        
        return _nueCode;
    }
    
    /**
     * Process PHP opening and closing tags
     * @param {string} code - The PHP code
     * @returns {string} Code with processed PHP tags
     */
    function _processPhpTags(code) {
        // Remove PHP opening/closing tags but keep the content
        return code
            // Handle PHP short echo tags
            .replace(/<\?=\s*(.*?)\s*\?>/g, '{$1}')
            // Handle standard PHP tags with content
            .replace(/<\?php\s*(.*?)\s*\?>/gs, (match, content) => {
                // Check if it's just an echo statement
                if (content.trim().startsWith('echo ')) {
                    return `{${content.trim().substring(5).replace(';', '')}}`;
                }
                // It's non-echo PHP code, convert to JS
                return `<script>${_phpToJs(content)}</script>`;
            });
    }
    
    /**
     * Process PHP variables in the code
     * @param {string} code - The code with PHP variables
     * @returns {string} Code with processed PHP variables
     */
    function _processPhpVariables(code) {
        // Replace PHP variables with JS variables
        return code
            // Replace $var with var
            .replace(/\$([a-zA-Z0-9_]+)/g, '$1')
            // Replace -> with .
            .replace(/->/g, '.')
            // Replace :: with .
            .replace(/::/g, '.');
    }
    
    /**
     * Add Nue.js specific structure to the code
     * @param {string} code - The translated code
     * @returns {string} Code with Nue.js structure
     */
    function _addNueStructure(code) {
        // Check if we need to add Nue.js component structure
        if (_settings.useHtmlFirst) {
            // Check if the code already has HTML structure
            if (!/<!DOCTYPE html>|<html[^>]*>/.test(code)) {
                // Simple component
                if (!/export default|createComponent/.test(code)) {
                    return `<template>
  ${code}
</template>

<script>
  export default {
    setup() {
      // Component state and methods go here
      return {
        // Return reactive state and methods
      }
    }
  }
</script>`;
                }
            }
        }
        
        return code;
    }
    
    /**
     * Translate PHP code to JavaScript
     * @param {string} php - The PHP code
     * @returns {string} The JavaScript code
     */
    function _phpToJs(php) {
        // Basic translation of PHP syntax to JS
        return php
            // Replace variable declarations
            .replace(/\$([a-zA-Z0-9_]+)\s*=\s*/g, 'let $1 = ')
            // Replace arrow functions
            .replace(/function\s*\((.*?)\)\s*use\s*\((.*?)\)\s*{/g, '($1) => {')
            // Replace regular functions
            .replace(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*{/g, 'function $1($2) {')
            // Replace PHP arrays with JS arrays/objects
            .replace(/array\s*\((.*?)\)/gs, (match, content) => {
                // Check if it's an associative array
                if (content.includes('=>')) {
                    // Convert to object
                    return `{${content.replace(/=>/g, ':')}}`;
                } else {
                    // Convert to array
                    return `[${content}]`;
                }
            })
            // Replace forEach
            .replace(/foreach\s*\(\s*\$([a-zA-Z0-9_]+)\s+as\s+\$([a-zA-Z0-9_]+)(?:\s*=>\s*\$([a-zA-Z0-9_]+))?\s*\)/g, (match, array, key, value) => {
                if (value) {
                    return `Object.entries(${array}).forEach(([${key}, ${value}])`;
                } else {
                    return `${array}.forEach((${key}, index)`;
                }
            })
            // Replace echo with console.log for debugging
            .replace(/echo\s+(.*);/g, 'console.log($1);')
            // Replace null with null
            .replace(/null/g, 'null')
            // Replace true/false
            .replace(/true/g, 'true')
            .replace(/false/g, 'false');
    }
    
    /**
     * Translate content inside a foreach loop
     * @param {string} content - The content
     * @param {object} variables - The variables mapping
     * @returns {string} Translated content
     */
    function _translateContent(content, variables = {}) {
        let result = content;
        
        // Replace PHP variables with their JS counterparts
        for (const phpVar in variables) {
            const jsVar = variables[phpVar];
            const pattern = new RegExp(`\\$${phpVar}\\b`, 'g');
            result = result.replace(pattern, jsVar);
        }
        
        // Process PHP echo statements
        result = result.replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, (match, expression) => {
            // Process the expression
            for (const phpVar in variables) {
                const jsVar = variables[phpVar];
                const pattern = new RegExp(`\\$${phpVar}\\b`, 'g');
                expression = expression.replace(pattern, jsVar);
            }
            return `{${expression}}`;
        });
        
        return result;
    }
    
    /**
     * Translate the content of a form
     * @param {string} content - The form content
     * @returns {string} Translated form content
     */
    function _translateFormContent(content) {
        return content
            // Translate input fields
            .replace(/<input([^>]*?)name=['"]([^'"]*?)['"]([^>]*?)>/g, (match, before, name, after) => {
                // Check if there's already a v-model
                if (/v-model/i.test(match)) {
                    return match;
                }
                return `<input${before}name="${name}"${after} v-model="${name}">`;
            })
            // Translate textarea
            .replace(/<textarea([^>]*?)name=['"]([^'"]*?)['"]([^>]*?)>/g, (match, before, name, after) => {
                // Check if there's already a v-model
                if (/v-model/i.test(match)) {
                    return match;
                }
                return `<textarea${before}name="${name}"${after} v-model="${name}">`;
            })
            // Translate select
            .replace(/<select([^>]*?)name=['"]([^'"]*?)['"]([^>]*?)>/g, (match, before, name, after) => {
                // Check if there's already a v-model
                if (/v-model/i.test(match)) {
                    return match;
                }
                return `<select${before}name="${name}"${after} v-model="${name}">`;
            });
    }
    
    /**
     * Translate a PHP condition to JavaScript
     * @param {string} condition - The PHP condition
     * @returns {string} The JavaScript condition
     */
    function _translateCondition(condition) {
        return condition
            // Replace PHP variables
            .replace(/\$([a-zA-Z0-9_]+)/g, '$1')
            // Replace === with ===
            .replace(/===/g, '===')
            // Replace == with ==
            .replace(/==/g, '==')
            // Replace || with ||
            .replace(/\|\|/g, '||')
            // Replace && with &&
            .replace(/&&/g, '&&')
            // Replace ! with !
            .replace(/!/g, '!')
            // Replace PHP functions with JS functions
            .replace(/empty\s*\(\s*([^)]+)\s*\)/g, '!$1 || $1.length === 0')
            .replace(/isset\s*\(\s*([^)]+)\s*\)/g, '$1 !== undefined && $1 !== null')
            .replace(/is_null\s*\(\s*([^)]+)\s*\)/g, '$1 === null')
            .replace(/is_array\s*\(\s*([^)]+)\s*\)/g, 'Array.isArray($1)')
            .replace(/is_string\s*\(\s*([^)]+)\s*\)/g, 'typeof $1 === "string"')
            .replace(/is_numeric\s*\(\s*([^)]+)\s*\)/g, '!isNaN(parseFloat($1)) && isFinite($1)')
            .replace(/is_int\s*\(\s*([^)]+)\s*\)/g, 'Number.isInteger($1)');
    }
    
    /**
     * Translate a PHP variable to JavaScript
     * @param {string} variable - The PHP variable
     * @returns {string} The JavaScript variable
     */
    function _translateVariable(variable) {
        return variable
            // Replace PHP variables
            .replace(/\$([a-zA-Z0-9_]+)/g, '$1')
            // Replace -> with .
            .replace(/->/g, '.')
            // Replace :: with .
            .replace(/::/g, '.')
            // Replace PHP functions with JS functions
            .replace(/htmlspecialchars\s*\(\s*([^)]+)\s*\)/g, '_escapeHtml($1)');
    }
    
    /**
     * Copy the Nue.js code to clipboard
     */
    function copyNueCode() {
        if (!_nueCode) {
            alert('No Nue.js code to copy');
            return;
        }
        
        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = _nueCode;
        document.body.appendChild(textarea);
        
        // Select and copy
        textarea.select();
        document.execCommand('copy');
        
        // Remove the textarea
        document.body.removeChild(textarea);
        
        // Show success message
        alert('Nue.js code copied to clipboard');
    }
    
    /**
     * Reset the integration settings to defaults
     */
    function resetSettings() {
        _settings = {
            autoTranslate: true,
            preserveComments: true,
            optimizeForPerformance: true,
            useHtmlFirst: true,
            generateWebComponents: true
        };
        
        // Update UI
        const autoTranslateToggle = document.getElementById('auto-translate-toggle');
        if (autoTranslateToggle) autoTranslateToggle.checked = _settings.autoTranslate;
        
        const preserveCommentsToggle = document.getElementById('preserve-comments-toggle');
        if (preserveCommentsToggle) preserveCommentsToggle.checked = _settings.preserveComments;
        
        const optimizePerformanceToggle = document.getElementById('optimize-performance-toggle');
        if (optimizePerformanceToggle) optimizePerformanceToggle.checked = _settings.optimizeForPerformance;
        
        const htmlFirstToggle = document.getElementById('html-first-toggle');
        if (htmlFirstToggle) htmlFirstToggle.checked = _settings.useHtmlFirst;
        
        const webComponentsToggle = document.getElementById('web-components-toggle');
        if (webComponentsToggle) webComponentsToggle.checked = _settings.generateWebComponents;
        
        // Save settings
        _saveSettings();
        
        // Re-translate code
        translateCode();
    }
    
    /**
     * Load settings from localStorage
     */
    function _loadSettings() {
        const savedSettings = localStorage.getItem('nue_integration_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                _active = parsed.active ?? false;
                _mode = parsed.mode ?? 'php-wasm';
                _settings = {
                    ...parsed.settings
                };
                
                // Update UI
                const nueToggle = document.getElementById('nue-toggle');
                if (nueToggle) nueToggle.checked = _active;
                
                if (_modeSelector) _modeSelector.value = _mode;
                
                const autoTranslateToggle = document.getElementById('auto-translate-toggle');
                if (autoTranslateToggle) autoTranslateToggle.checked = _settings.autoTranslate;
                
                const preserveCommentsToggle = document.getElementById('preserve-comments-toggle');
                if (preserveCommentsToggle) preserveCommentsToggle.checked = _settings.preserveComments;
                
                const optimizePerformanceToggle = document.getElementById('optimize-performance-toggle');
                if (optimizePerformanceToggle) optimizePerformanceToggle.checked = _settings.optimizeForPerformance;
                
                const htmlFirstToggle = document.getElementById('html-first-toggle');
                if (htmlFirstToggle) htmlFirstToggle.checked = _settings.useHtmlFirst;
                
                const webComponentsToggle = document.getElementById('web-components-toggle');
                if (webComponentsToggle) webComponentsToggle.checked = _settings.generateWebComponents;
                
                // Update UI based on active state
                if (_active) {
                    const modeContainer = document.getElementById('nue-mode-container');
                    if (modeContainer) modeContainer.style.display = 'block';
                    
                    _updateUI();
                }
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }
    
    /**
     * Save settings to localStorage
     */
    function _saveSettings() {
        const settings = {
            active: _active,
            mode: _mode,
            settings: _settings
        };
        
        localStorage.setItem('nue_integration_settings', JSON.stringify(settings));
    }
    
    // Public API
    return {
        init: init,
        toggleNueIntegration: toggleNueIntegration,
        setMode: setMode,
        translateCode: translateCode,
        toggleSettingsPanel: toggleSettingsPanel,
        copyNueCode: copyNueCode,
        resetSettings: resetSettings
    };
})();

// Add the CSS styles to the document
function addNueIntegrationStyles() {
    if (document.getElementById('nue-integration-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'nue-integration-styles';
    styleElement.textContent = `
        /* Toggle switch */
        .toggle-switch {
            position: relative;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            transition: all 0.3s ease;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 1px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            transition: all 0.3s ease;
        }

        .toggle-switch input:checked + .toggle-slider {
            background: rgba(66, 139, 255, 0.2);
            border-color: rgba(66, 139, 255, 0.4);
        }

        .toggle-switch input:checked + .toggle-slider:before {
            transform: translateX(16px);
            background: rgba(66, 139, 255, 0.9);
        }

        .toggle-label {
            margin-left: 10px;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.9);
        }

        /* Essential panel styles */
        .nue-settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 900px;
            height: 80%;
            max-height: 700px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            background: rgba(40, 40, 40, 0.85);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }

        .nue-settings-panel.hidden {
            display: none;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Initialize the Nue.js integration module when the DOM is ready
function initializeNueIntegration() {
    addNueIntegrationStyles();
    
    // Wait a bit to ensure the DOM is fully loaded and processed
    setTimeout(() => {
        try {
            NueIntegration.init();
            console.log('Nue.js Integration Module initialized successfully');
        } catch (error) {
            console.error('Error initializing Nue.js Integration Module:', error);
        }
    }, 500);
}

// Try to initialize right away if the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeNueIntegration();
} else {
    // Otherwise wait for the DOM to be ready
    document.addEventListener('DOMContentLoaded', initializeNueIntegration);
}

// Add to global window for access from the PHP-WASM Builder
window.NueIntegration = NueIntegration;
