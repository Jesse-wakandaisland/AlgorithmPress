/**
 * AlgorithmPress Dock System
 * Provides a unified interface for accessing various modules and systems
 */

const AlgorithmPressDock = (function() {
  'use strict';
  
  // Module state
  let state = {
    initialized: false,
    activeModules: new Set(),
    visiblePanels: new Set()
  };
  
  // Module registry for keeping track of module status
  const moduleRegistry = {
    'voice-control': {
      id: 'voice-control',
      name: 'Voice Control',
      initialized: false,
      panelVisible: false,
      initialize: initializeVoiceControl,
      togglePanel: toggleVoiceControlPanel
    },
    'nexus-grid': {
      id: 'nexus-grid',
      name: 'NexusGrid',
      initialized: false,
      panelVisible: false,
      initialize: initializeNexusGrid,
      togglePanel: toggleNexusGridPanel
    },
    'demo-system': {
      id: 'demo-system',
      name: 'Demonstration System',
      initialized: false,
      panelVisible: false,
      initialize: initializeDemoSystem,
      togglePanel: toggleDemoSystemPanel
    },
    'implementation': {
      id: 'implementation',
      name: 'Implementation Example',
      initialized: false,
      panelVisible: false,
      initialize: initializeImplementation,
      togglePanel: toggleImplementationPanel
    },
    'rainbow-indicator': {
      id: 'rainbow-indicator',
      name: 'Rainbow Indicator',
      initialized: false,
      panelVisible: false,
      initialize: initializeRainbowIndicator,
      togglePanel: toggleRainbowIndicatorPanel
    },
    'cubbit-storage': {
      id: 'cubbit-storage',
      name: 'Cubbit Storage',
      initialized: false,
      panelVisible: false,
      initialize: initializeCubbitStorage,
      togglePanel: toggleCubbitStoragePanel
    },
    'settings': {
      id: 'settings',
      name: 'Settings',
      initialized: false,
      panelVisible: false,
      initialize: initializeSettings,
      togglePanel: toggleSettingsPanel
    }
  };
  
  /**
   * Initialize the dock system
   */
  function initialize() {
    if (state.initialized) return;
    
    console.log('Initializing AlgorithmPress Dock...');
    
    // Create and inject the dock HTML
    createDockUI();
    
    // Bind event handlers to dock buttons
    bindDockEvents();
    
    // Set initialization flag
    state.initialized = true;
    
    console.log('AlgorithmPress Dock initialized');
    
    // Check if modules are already loaded and update status
    checkExistingModules();
  }
  
  /**
   * Create and inject the dock UI if not already present
   */
  function createDockUI() {
    // Check if dock already exists
    if (document.getElementById('algorithm-press-dock')) return;
    
    // Inject the dock element
    const dockHtml = document.querySelector('#algorithm-press-dock-template');
    
    if (dockHtml) {
      // Use template if available
      const clone = document.importNode(dockHtml.content, true);
      document.body.appendChild(clone);
    } else {
      // Create dock from scratch if template not available
      const dockElement = document.createElement('div');
      dockElement.id = 'algorithm-press-dock';
      dockElement.className = 'algorithm-press-dock';
      
      dockElement.innerHTML = `
        <div class="dock-container">
          <button class="dock-button" id="voice-control-dock-btn" title="Voice Control">
            <i class="fas fa-microphone"></i>
            <span class="dock-button-label">Voice</span>
          </button>
          <button class="dock-button" id="nexus-grid-dock-btn" title="NexusGrid">
            <i class="fas fa-th"></i>
            <span class="dock-button-label">NexusGrid</span>
          </button>
          <button class="dock-button" id="demo-system-dock-btn" title="Demonstration System">
            <i class="fas fa-laptop-code"></i>
            <span class="dock-button-label">Demos</span>
          </button>
          <button class="dock-button" id="implementation-dock-btn" title="Implementation Example">
            <i class="fas fa-code-branch"></i>
            <span class="dock-button-label">Impl</span>
          </button>
          <button class="dock-button" id="rainbow-indicator-dock-btn" title="Rainbow Indicator">
            <i class="fas fa-rainbow"></i>
            <span class="dock-button-label">Effects</span>
          </button>
          <button class="dock-button" id="cubbit-storage-dock-btn" title="Cubbit Storage">
            <i class="fas fa-cloud"></i>
            <span class="dock-button-label">Storage</span>
          </button>
          <button class="dock-button" id="settings-dock-btn" title="Settings">
            <i class="fas fa-cog"></i>
            <span class="dock-button-label">Settings</span>
          </button>
        </div>
      `;
      
      document.body.appendChild(dockElement);
    }
    
    // Inject styles if not already present
    if (!document.getElementById('algorithm-press-dock-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'algorithm-press-dock-styles';
      styleElement.textContent = `
        /* AlgorithmPress Dock Styles will be inserted here */
      `;
      document.head.appendChild(styleElement);
    }
  }
  
  /**
   * Bind event handlers to dock buttons
   */
  function bindDockEvents() {
    // Voice Control button
    const voiceControlBtn = document.getElementById('voice-control-dock-btn');
    if (voiceControlBtn) {
      voiceControlBtn.addEventListener('click', function() {
        toggleModule('voice-control');
      });
    }
    
    // NexusGrid button
    const nexusGridBtn = document.getElementById('nexus-grid-dock-btn');
    if (nexusGridBtn) {
      nexusGridBtn.addEventListener('click', function() {
        toggleModule('nexus-grid');
      });
    }
    
    // Demonstration System button
    const demoSystemBtn = document.getElementById('demo-system-dock-btn');
    if (demoSystemBtn) {
      demoSystemBtn.addEventListener('click', function() {
        toggleModule('demo-system');
      });
    }
    
    // Implementation Example button
    const implementationBtn = document.getElementById('implementation-dock-btn');
    if (implementationBtn) {
      implementationBtn.addEventListener('click', function() {
        toggleModule('implementation');
      });
    }
    
    // Rainbow Indicator button
    const rainbowIndicatorBtn = document.getElementById('rainbow-indicator-dock-btn');
    if (rainbowIndicatorBtn) {
      rainbowIndicatorBtn.addEventListener('click', function() {
        toggleModule('rainbow-indicator');
      });
    }
    
    // Cubbit Storage button
    const cubbitStorageBtn = document.getElementById('cubbit-storage-dock-btn');
    if (cubbitStorageBtn) {
      cubbitStorageBtn.addEventListener('click', function() {
        toggleModule('cubbit-storage');
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-dock-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        toggleModule('settings');
      });
    }
  }
  
  /**
   * Toggle a module's panel visibility
   * @param {string} moduleId - Module identifier
   */
  function toggleModule(moduleId) {
    const module = moduleRegistry[moduleId];
    
    if (!module) {
      console.error(`Module ${moduleId} not found in registry`);
      return;
    }
    
    // Initialize module if not already initialized
    if (!module.initialized) {
      module.initialize()
        .then(() => {
          module.initialized = true;
          state.activeModules.add(moduleId);
          updateDockButtonState(moduleId, true);
          module.togglePanel();
        })
        .catch(error => {
          console.error(`Failed to initialize ${module.name}:`, error);
          showToast('error', `Failed to initialize ${module.name}: ${error.message}`);
        });
    } else {
      // Toggle panel visibility
      module.togglePanel();
      updateDockButtonState(moduleId, module.panelVisible);
    }
  }
  
  /**
   * Update the visual state of a dock button
   * @param {string} moduleId - Module identifier
   * @param {boolean} active - Whether the module is active
   */
  function updateDockButtonState(moduleId, active) {
    const button = document.getElementById(`${moduleId}-dock-btn`);
    if (!button) return;
    
    if (active) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }
  
  /**
   * Check for existing module instances and update dock status
   */
  function checkExistingModules() {
    // Check for Voice Control
    if (window.VoiceControlSystem && typeof window.VoiceControlSystem.isInitialized === 'function') {
      if (window.VoiceControlSystem.isInitialized()) {
        moduleRegistry['voice-control'].initialized = true;
        state.activeModules.add('voice-control');
        updateDockButtonState('voice-control', true);
      }
    }
    
    // Check for NexusGrid
    if (window.NexusGrid) {
      moduleRegistry['nexus-grid'].initialized = true;
      state.activeModules.add('nexus-grid');
    }
    
    // Check for Demonstration System
    if (window.NexusGridDemoSystem) {
      moduleRegistry['demo-system'].initialized = true;
      state.activeModules.add('demo-system');
    }
    
    // Check for Rainbow Indicator
    if (window.RainbowIndicator) {
      moduleRegistry['rainbow-indicator'].initialized = true;
      state.activeModules.add('rainbow-indicator');
    }
    
    // Check for Cubbit Storage
    if (window.CubbitStorage && typeof window.CubbitStorage.isInitialized === 'function') {
      if (window.CubbitStorage.isInitialized()) {
        moduleRegistry['cubbit-storage'].initialized = true;
        state.activeModules.add('cubbit-storage');
      }
    }
  }
  
  /**
   * Initialize Voice Control System
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeVoiceControl() {
    return new Promise((resolve, reject) => {
      try {
        if (!window.VoiceControlSystem) {
          reject(new Error('Voice Control System not available'));
          return;
        }
        
        if (window.VoiceControlSystem.isInitialized && window.VoiceControlSystem.isInitialized()) {
          // Already initialized
          resolve();
          return;
        }
        
        window.VoiceControlSystem.initialize({
          autoStart: false,
          voiceFeedback: true,
          visualFeedbackElement: 'voice-feedback'
        }).then(() => {
          console.log('Voice Control System initialized');
          resolve();
        }).catch(error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Toggle Voice Control panel
   */
  function toggleVoiceControlPanel() {
    try {
      if (!window.VoiceControlSystem) return;
      
      if (window.VoiceControlSystem.isListening && window.VoiceControlSystem.isListening()) {
        window.VoiceControlSystem.stopListening();
        moduleRegistry['voice-control'].panelVisible = false;
      } else {
        window.VoiceControlSystem.startListening();
        moduleRegistry['voice-control'].panelVisible = true;
      }
    } catch (error) {
      console.error('Error toggling Voice Control panel:', error);
    }
  }
  
  /**
   * Initialize NexusGrid
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeNexusGrid() {
    return new Promise((resolve, reject) => {
      try {
        if (!window.NexusGrid) {
          reject(new Error('NexusGrid not available'));
          return;
        }
        
        // Create NexusGrid panel if not exists
        createNexusGridPanel();
        
        window.NexusGrid.initialize()
          .then(() => {
            console.log('NexusGrid initialized');
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create NexusGrid panel
   */
  function createNexusGridPanel() {
    if (document.getElementById('nexus-grid-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'nexus-grid-panel';
    panel.className = 'system-panel nexus-grid-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>NexusGrid</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="nexus-grid-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="nexus-grid-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading NexusGrid...</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('nexus-grid-close-btn').addEventListener('click', function() {
      toggleNexusGridPanel();
    });
  }
  
  /**
   * Toggle NexusGrid panel
   */
  function toggleNexusGridPanel() {
    const panel = document.getElementById('nexus-grid-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['nexus-grid'].panelVisible = true;
    } else {
      panel.classList.add('hidden');
      moduleRegistry['nexus-grid'].panelVisible = false;
    }
    
    updateDockButtonState('nexus-grid', moduleRegistry['nexus-grid'].panelVisible);
  }
  
  /**
   * Initialize Demonstration System
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeDemoSystem() {
    return new Promise((resolve, reject) => {
      try {
        if (!window.NexusGridDemoSystem) {
          reject(new Error('Demonstration System not available'));
          return;
        }
        
        // Create Demo System panel if not exists
        createDemoSystemPanel();
        
        if (typeof window.NexusGridDemoSystem.initialize === 'function') {
          window.NexusGridDemoSystem.initialize()
            .then(() => {
              console.log('Demonstration System initialized');
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        } else {
          console.log('Demonstration System initialized (no init function)');
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create Demonstration System panel
   */
  function createDemoSystemPanel() {
    if (document.getElementById('demo-system-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'demo-system-panel';
    panel.className = 'system-panel demo-system-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Demonstration System</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="demo-system-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="demo-system-content">
          <div class="demo-categories">
            <h3>Demo Categories</h3>
            <div class="demo-category-list">
              <button class="demo-category-btn active" data-category="web-app">Web Apps</button>
              <button class="demo-category-btn" data-category="business">Business</button>
              <button class="demo-category-btn" data-category="education">Education</button>
              <button class="demo-category-btn" data-category="productivity">Productivity</button>
              <button class="demo-category-btn" data-category="games">Games</button>
            </div>
          </div>
          <div class="demo-showcase">
            <h3>Available Demos</h3>
            <div class="demo-list">
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading demos...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('demo-system-close-btn').addEventListener('click', function() {
      toggleDemoSystemPanel();
    });
  }
  
  /**
   * Toggle Demonstration System panel
   */
  function toggleDemoSystemPanel() {
    const panel = document.getElementById('demo-system-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['demo-system'].panelVisible = true;
    } else {
      panel.classList.add('hidden');
      moduleRegistry['demo-system'].panelVisible = false;
    }
    
    updateDockButtonState('demo-system', moduleRegistry['demo-system'].panelVisible);
  }
  
  /**
   * Initialize Implementation Example
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeImplementation() {
    return new Promise((resolve, reject) => {
      try {
        // Create Implementation panel if not exists
        createImplementationPanel();
        
        console.log('Implementation Example initialized');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create Implementation Example panel
   */
  function createImplementationPanel() {
    if (document.getElementById('implementation-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'implementation-panel';
    panel.className = 'system-panel implementation-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Implementation Example</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="implementation-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="implementation-content">
          <h3>Rainbow Border Event Indicator</h3>
          <div class="implementation-demo">
            <div class="implementation-controls">
              <button class="demo-btn" id="start-indicator-btn">Start Indicator</button>
              <button class="demo-btn" id="stop-indicator-btn">Stop Indicator</button>
              <button class="demo-btn" id="toggle-indicator-btn">Toggle Indicator</button>
            </div>
            <div class="indicator-preview" id="indicator-preview">
              <div class="preview-content">
                <h4>Preview Area</h4>
                <p>This area will show the rainbow border effect when active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('implementation-close-btn').addEventListener('click', function() {
      toggleImplementationPanel();
    });
    
    // Add demo buttons event listeners
    document.getElementById('start-indicator-btn')?.addEventListener('click', function() {
      if (window.RainbowIndicator) {
        const previewEl = document.getElementById('indicator-preview');
        if (previewEl && !window.previewIndicator) {
          window.previewIndicator = RainbowIndicator.init(previewEl, {
            borderSize: 4,
            glowSize: 20,
            animationSpeed: 4
          });
        }
        if (window.previewIndicator) {
          window.previewIndicator.start();
        }
      }
    });
    
    document.getElementById('stop-indicator-btn')?.addEventListener('click', function() {
      if (window.previewIndicator) {
        window.previewIndicator.stop();
      }
    });
    
    document.getElementById('toggle-indicator-btn')?.addEventListener('click', function() {
      if (window.previewIndicator) {
        window.previewIndicator.toggle();
      }
    });
  }
  
  /**
   * Toggle Implementation Example panel
   */
  function toggleImplementationPanel() {
    const panel = document.getElementById('implementation-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['implementation'].panelVisible = true;
    } else {
      panel.classList.add('hidden');
      moduleRegistry['implementation'].panelVisible = false;
    }
    
    updateDockButtonState('implementation', moduleRegistry['implementation'].panelVisible);
  }
  
  /**
   * Initialize Rainbow Indicator
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeRainbowIndicator() {
    return new Promise((resolve, reject) => {
      try {
        if (!window.RainbowIndicator) {
          reject(new Error('Rainbow Indicator not available'));
          return;
        }
        
        // Create Rainbow Indicator panel if not exists
        createRainbowIndicatorPanel();
        
        console.log('Rainbow Indicator initialized');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create Rainbow Indicator panel
   */
  function createRainbowIndicatorPanel() {
    if (document.getElementById('rainbow-indicator-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'rainbow-indicator-panel';
    panel.className = 'system-panel rainbow-indicator-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Rainbow Indicator Settings</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="rainbow-indicator-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="rainbow-indicator-content">
          <h3>Configure Effects</h3>
          <div class="settings-form">
            <div class="form-group">
              <label for="border-size">Border Size</label>
              <input type="range" id="border-size" min="1" max="10" value="4" class="form-range">
              <span class="range-value">4px</span>
            </div>
            <div class="form-group">
              <label for="glow-size">Glow Size</label>
              <input type="range" id="glow-size" min="0" max="50" value="20" class="form-range">
              <span class="range-value">20px</span>
            </div>
            <div class="form-group">
              <label for="animation-speed">Animation Speed</label>
              <input type="range" id="animation-speed" min="1" max="10" value="4" class="form-range">
              <span class="range-value">4s</span>
            </div>
            <div class="form-group">
              <label for="auto-hooks">
                <input type="checkbox" id="auto-hooks" checked>
                Enable Auto Hooks
              </label>
            </div>
            <div class="color-presets">
              <h4>Color Presets</h4>
              <div class="preset-buttons">
                <button class="preset-btn" data-preset="rainbow">Rainbow</button>
                <button class="preset-btn" data-preset="ocean">Ocean</button>
                <button class="preset-btn" data-preset="sunset">Sunset</button>
                <button class="preset-btn" data-preset="forest">Forest</button>
              </div>
            </div>
            <div class="form-actions">
              <button id="apply-effects-btn" class="btn btn-primary">Apply Effects</button>
              <button id="preview-effects-btn" class="btn btn-secondary">Preview</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('rainbow-indicator-close-btn').addEventListener('click', function() {
      toggleRainbowIndicatorPanel();
    });
    
    // Add range input event listeners
    document.querySelectorAll('.form-range').forEach(range => {
      range.addEventListener('input', function() {
        this.nextElementSibling.textContent = this.value + (
          this.id === 'animation-speed' ? 's' : 'px'
        );
      });
    });
    
    // Apply button event listener
    document.getElementById('apply-effects-btn')?.addEventListener('click', function() {
      if (window.RainbowIndicator && window.appEventIndicator) {
        const borderSize = parseInt(document.getElementById('border-size').value);
        const glowSize = parseInt(document.getElementById('glow-size').value);
        const animationSpeed = parseInt(document.getElementById('animation-speed').value);
        const autoHooks = document.getElementById('auto-hooks').checked;
        
        // Update indicator settings
        window.appEventIndicator.updateSettings({
          borderSize,
          glowSize,
          animationSpeed,
          useAutoHooks: autoHooks
        });
        
        showToast('success', 'Rainbow indicator settings applied');
      }
    });
    
    // Preview button event listener
    document.getElementById('preview-effects-btn')?.addEventListener('click', function() {
      if (window.appEventIndicator) {
        window.appEventIndicator.start();
        
        setTimeout(() => {
          window.appEventIndicator.stop();
        }, 2000);
      }
    });
  }
  
  /**
   * Toggle Rainbow Indicator panel
   */
  function toggleRainbowIndicatorPanel() {
    const panel = document.getElementById('rainbow-indicator-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['rainbow-indicator'].panelVisible = true;
    } else {
      panel.classList.add('hidden');
      moduleRegistry['rainbow-indicator'].panelVisible = false;
    }
    
    updateDockButtonState('rainbow-indicator', moduleRegistry['rainbow-indicator'].panelVisible);
  }
  
  /**
   * Initialize Cubbit Storage
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeCubbitStorage() {
    return new Promise((resolve, reject) => {
      try {
        if (!window.CubbitStorage) {
          reject(new Error('Cubbit Storage not available'));
          return;
        }
        
        // Create Cubbit Storage panel if not exists
        createCubbitStoragePanel();
        
        console.log('Cubbit Storage initialized');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create Cubbit Storage panel
   */
  function createCubbitStoragePanel() {
    if (document.getElementById('cubbit-storage-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'cubbit-storage-panel';
    panel.className = 'system-panel cubbit-storage-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Cubbit Storage</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="cubbit-storage-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="cubbit-storage-content">
          <h3>Decentralized Storage</h3>
          <div class="cubbit-settings">
            <div class="form-group">
              <label for="cubbit-api-key-panel">Cubbit API Key</label>
              <input type="password" id="cubbit-api-key-panel" class="form-control" placeholder="Enter your Cubbit API key">
            </div>
            <div class="form-group">
              <label for="cubbit-bucket-panel">Bucket Name</label>
              <input type="text" id="cubbit-bucket-panel" class="form-control" placeholder="php-wasm-projects">
            </div>
            <div class="form-actions">
              <button id="cubbit-connect-btn" class="btn btn-primary">Connect</button>
              <button id="cubbit-disconnect-btn" class="btn btn-secondary">Disconnect</button>
            </div>
          </div>
          <div class="cubbit-status">
            <h4>Connection Status</h4>
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Not connected</span>
            </div>
          </div>
          <div class="cubbit-projects hidden">
            <h4>Your Projects</h4>
            <div class="project-list">
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading projects...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('cubbit-storage-close-btn').addEventListener('click', function() {
      toggleCubbitStoragePanel();
    });
    
    // Connect button event listener
    document.getElementById('cubbit-connect-btn')?.addEventListener('click', function() {
      const apiKey = document.getElementById('cubbit-api-key-panel').value;
      const bucketName = document.getElementById('cubbit-bucket-panel').value || 'php-wasm-projects';
      
      if (!apiKey) {
        showToast('error', 'API key is required');
        return;
      }
      
      if (window.CubbitStorage) {
        window.CubbitStorage.initialize({
          apiKey: apiKey,
          bucketName: bucketName
        }).then(() => {
          showToast('success', 'Connected to Cubbit DS3');
          updateCubbitStorageStatus(true);
        }).catch(error => {
          showToast('error', 'Connection failed: ' + error.message);
        });
      }
    });
  }
  
  /**
   * Update Cubbit Storage status
   * @param {boolean} connected - Whether Cubbit storage is connected
   */
  function updateCubbitStorageStatus(connected) {
    const statusDot = document.querySelector('.cubbit-status .status-dot');
    const statusText = document.querySelector('.cubbit-status .status-text');
    const projectsList = document.querySelector('.cubbit-projects');
    
    if (statusDot && statusText) {
      if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        
        if (projectsList) {
          projectsList.classList.remove('hidden');
        }
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Not connected';
        
        if (projectsList) {
          projectsList.classList.add('hidden');
        }
      }
    }
  }
  
  /**
   * Toggle Cubbit Storage panel
   */
  function toggleCubbitStoragePanel() {
    const panel = document.getElementById('cubbit-storage-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['cubbit-storage'].panelVisible = true;
      
      // Update connection status
      if (window.CubbitStorage && typeof window.CubbitStorage.isInitialized === 'function') {
        updateCubbitStorageStatus(window.CubbitStorage.isInitialized());
      }
    } else {
      panel.classList.add('hidden');
      moduleRegistry['cubbit-storage'].panelVisible = false;
    }
    
    updateDockButtonState('cubbit-storage', moduleRegistry['cubbit-storage'].panelVisible);
  }
  
  /**
   * Initialize Settings
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  function initializeSettings() {
    return new Promise((resolve, reject) => {
      try {
        // Create Settings panel if not exists
        createSettingsPanel();
        
        console.log('Settings initialized');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create Settings panel
   */
  function createSettingsPanel() {
    if (document.getElementById('settings-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'system-panel settings-panel hidden';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>AlgorithmPress Settings</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="settings-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="settings-content">
          <div class="settings-tabs">
            <button class="settings-tab active" data-tab="general">General</button>
            <button class="settings-tab" data-tab="appearance">Appearance</button>
            <button class="settings-tab" data-tab="modules">Modules</button>
            <button class="settings-tab" data-tab="notifications">Notifications</button>
          </div>
          <div class="settings-panels">
            <div class="settings-tab-panel active" id="general-panel">
              <h3>General Settings</h3>
              <div class="settings-group">
                <h4>Builder Preferences</h4>
                <div class="form-group">
                  <label for="auto-save">
                    <input type="checkbox" id="auto-save" checked>
                    Enable auto-save
                  </label>
                </div>
                <div class="form-group">
                  <label for="save-interval">Auto-save interval (seconds)</label>
                  <input type="number" id="save-interval" class="form-control" value="60" min="30" max="300">
                </div>
                <div class="form-group">
                  <label for="default-theme">Default theme</label>
                  <select id="default-theme" class="form-select">
                    <option value="bootstrap">Bootstrap</option>
                    <option value="material">Material Design</option>
                    <option value="bulma">Bulma</option>
                    <option value="tailwind">Tailwind</option>
                    <option value="none">No Framework</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="settings-tab-panel" id="appearance-panel">
              <h3>Appearance Settings</h3>
              <div class="settings-group">
                <h4>UI Preferences</h4>
                <div class="form-group">
                  <label for="ui-color-scheme">Color Scheme</label>
                  <select id="ui-color-scheme" class="form-select">
                    <option value="default">Default (Yellow/Blue)</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="sunset">Sunset</option>
                    <option value="forest">Forest</option>
                    <option value="ocean">Ocean</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="font-size">UI Font Size</label>
                  <select id="font-size" class="form-select">
                    <option value="small">Small</option>
                    <option value="medium" selected>Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="animation-speed">Animation Speed</label>
                  <select id="animation-speed" class="form-select">
                    <option value="fast">Fast</option>
                    <option value="normal" selected>Normal</option>
                    <option value="slow">Slow</option>
                    <option value="none">No Animations</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="settings-tab-panel" id="modules-panel">
              <h3>Module Settings</h3>
              <div class="settings-group">
                <h4>Module Management</h4>
                <div class="module-list">
                  <div class="module-item">
                    <div class="module-info">
                      <h5>Voice Control</h5>
                      <p>Enable voice commands for the builder</p>
                    </div>
                    <div class="module-toggle">
                      <label class="switch">
                        <input type="checkbox" checked data-module="voice-control">
                        <span class="slider round"></span>
                      </label>
                    </div>
                  </div>
                  <div class="module-item">
                    <div class="module-info">
                      <h5>NexusGrid</h5>
                      <p>Decentralized application platform</p>
                    </div>
                    <div class="module-toggle">
                      <label class="switch">
                        <input type="checkbox" checked data-module="nexus-grid">
                        <span class="slider round"></span>
                      </label>
                    </div>
                  </div>
                  <div class="module-item">
                    <div class="module-info">
                      <h5>Demonstration System</h5>
                      <p>Demo application generator</p>
                    </div>
                    <div class="module-toggle">
                      <label class="switch">
                        <input type="checkbox" checked data-module="demo-system">
                        <span class="slider round"></span>
                      </label>
                    </div>
                  </div>
                  <div class="module-item">
                    <div class="module-info">
                      <h5>Rainbow Indicator</h5>
                      <p>Visual feedback for operations</p>
                    </div>
                    <div class="module-toggle">
                      <label class="switch">
                        <input type="checkbox" checked data-module="rainbow-indicator">
                        <span class="slider round"></span>
                      </label>
                    </div>
                  </div>
                  <div class="module-item">
                    <div class="module-info">
                      <h5>Cubbit Storage</h5>
                      <p>Decentralized storage integration</p>
                    </div>
                    <div class="module-toggle">
                      <label class="switch">
                        <input type="checkbox" checked data-module="cubbit-storage">
                        <span class="slider round"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings-tab-panel" id="notifications-panel">
              <h3>Notification Settings</h3>
              <div class="settings-group">
                <h4>Notification Preferences</h4>
                <div class="form-group">
                  <label for="enable-notifications">
                    <input type="checkbox" id="enable-notifications" checked>
                    Enable notifications
                  </label>
                </div>
                <div class="form-group">
                  <label for="notification-sound">
                    <input type="checkbox" id="notification-sound" checked>
                    Play sound for notifications
                  </label>
                </div>
                <div class="form-group">
                  <label for="notification-position">Notification Position</label>
                  <select id="notification-position" class="form-select">
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right" selected>Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="settings-actions">
            <button id="save-settings-btn" class="btn btn-primary">Save Settings</button>
            <button id="reset-settings-btn" class="btn btn-secondary">Reset to Defaults</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button event listener
    document.getElementById('settings-close-btn').addEventListener('click', function() {
      toggleSettingsPanel();
    });
    
    // Add settings tabs functionality
    const settingsTabs = document.querySelectorAll('.settings-tab');
    settingsTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        settingsTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding panel
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.settings-tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-panel`).classList.add('active');
      });
    });
    
    // Save settings button event listener
    document.getElementById('save-settings-btn')?.addEventListener('click', function() {
      saveSettings();
      showToast('success', 'Settings saved successfully');
    });
  }
  
  /**
   * Save settings
   */
  function saveSettings() {
    // Get settings from form
    const settings = {
      general: {
        autoSave: document.getElementById('auto-save')?.checked || false,
        saveInterval: parseInt(document.getElementById('save-interval')?.value || '60'),
        defaultTheme: document.getElementById('default-theme')?.value || 'bootstrap'
      },
      appearance: {
        colorScheme: document.getElementById('ui-color-scheme')?.value || 'default',
        fontSize: document.getElementById('font-size')?.value || 'medium',
        animationSpeed: document.getElementById('animation-speed')?.value || 'normal'
      },
      modules: {
        enabledModules: Array.from(document.querySelectorAll('.module-toggle input[type="checkbox"]'))
          .filter(input => input.checked)
          .map(input => input.getAttribute('data-module'))
      },
      notifications: {
        enabled: document.getElementById('enable-notifications')?.checked || false,
        sound: document.getElementById('notification-sound')?.checked || false,
        position: document.getElementById('notification-position')?.value || 'bottom-right'
      }
    };
    
    // Save settings to local storage
    localStorage.setItem('algorithm_press_settings', JSON.stringify(settings));
    
    // Apply settings
    applySettings(settings);
  }
  
  /**
   * Apply settings
   * @param {Object} settings - Settings to apply
   */
  function applySettings(settings) {
    // Apply appearance settings
    if (settings.appearance) {
      document.documentElement.setAttribute('data-color-scheme', settings.appearance.colorScheme);
      document.documentElement.setAttribute('data-font-size', settings.appearance.fontSize);
      document.documentElement.setAttribute('data-animation-speed', settings.appearance.animationSpeed);
    }
    
    // Apply module settings
    if (settings.modules && settings.modules.enabledModules) {
      // Show/hide dock buttons based on enabled modules
      Object.keys(moduleRegistry).forEach(moduleId => {
        const enabled = settings.modules.enabledModules.includes(moduleId);
        const button = document.getElementById(`${moduleId}-dock-btn`);
        if (button) {
          button.style.display = enabled ? '' : 'none';
        }
      });
    }
    
    // Apply notification settings
    if (settings.notifications) {
      // Update toast container position if it exists
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        toastContainer.className = `toast-container position-fixed p-3 ${settings.notifications.position}`;
      }
    }
  }
  
  /**
   * Toggle Settings panel
   */
  function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      moduleRegistry['settings'].panelVisible = true;
    } else {
      panel.classList.add('hidden');
      moduleRegistry['settings'].panelVisible = false;
    }
    
    updateDockButtonState('settings', moduleRegistry['settings'].panelVisible);
  }
  
  /**
   * Show a toast notification
   * @param {string} type - Notification type (success, info, warning, error)
   * @param {string} message - Notification message
   */
  function showToast(type, message) {
    // Check if function exists in the global scope
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
      return;
    }
    
    // Fallback implementation
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Get settings for notification position
    const settings = JSON.parse(localStorage.getItem('algorithm_press_settings') || '{}');
    const position = settings.notifications?.position || 'bottom-right';
    
    // Add to document
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      // Create toast container
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = `toast-container position-fixed p-3 ${position}`;
      document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    if (window.bootstrap && window.bootstrap.Toast) {
      const toast = new window.bootstrap.Toast(toastEl, {
        delay: 5000
      });
      toast.show();
    } else {
      // Fallback if Bootstrap is not available
      toastEl.style.opacity = '1';
      setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
          toastEl.remove();
        }, 300);
      }, 5000);
    }
    
    // Remove after hiding
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
  
  /**
   * Inject system panel styles
   */
  function injectSystemPanelStyles() {
    if (document.getElementById('system-panel-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'system-panel-styles';
    styleElement.textContent = `
      /* System Panel Styles */
      .system-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 1000px;
        height: 80%;
        max-height: 700px;
        background-color: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 9500;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      
      .system-panel.hidden {
        opacity: 0;
        transform: translate(-50%, -60%);
        pointer-events: none;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .panel-header h2 {
        margin: 0;
        font-family: 'Alegreya Sans SC', sans-serif;
        font-size: 1.5rem;
        background-image: linear-gradient(to right, #ff9966, #ff5e62);
        color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
      }
      
      .panel-controls {
        display: flex;
        gap: 10px;
      }
      
      .panel-close-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .panel-close-btn:hover {
        background-color: rgba(255, 87, 34, 0.3);
        transform: rotate(90deg);
      }
      
      .panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }
      
      /* Loading spinner */
      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .loading-spinner i {
        font-size: 2rem;
        margin-bottom: 15px;
      }
      
      /* Settings panel styles */
      .settings-content {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .settings-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        margin-bottom: 20px;
      }
      
      .settings-tab {
        padding: 10px 20px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }
      
      .settings-tab:hover {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .settings-tab.active {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .settings-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background: rgba(255, 255, 255, 0.9);
      }
      
      .settings-panels {
        flex: 1;
        overflow-y: auto;
      }
      
      .settings-tab-panel {
        display: none;
      }
      
      .settings-tab-panel.active {
        display: block;
      }
      
      .settings-group {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .settings-group h4 {
        margin: 0 0 15px 0;
        font-family: 'Alegreya Sans SC', sans-serif;
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .settings-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      
      /* Module list styles */
      .module-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .module-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .module-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .module-info h5 {
        margin: 0 0 5px 0;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .module-info p {
        margin: 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
      }
      
      /* Switch styles */
      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.2);
        transition: .4s;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }
      
      input:checked + .slider {
        background-color: rgba(13, 110, 253, 0.5);
      }
      
      input:focus + .slider {
        box-shadow: 0 0 1px rgba(13, 110, 253, 0.5);
      }
      
      input:checked + .slider:before {
        transform: translateX(26px);
      }
      
      .slider.round {
        border-radius: 24px;
      }
      
      .slider.round:before {
        border-radius: 50%;
      }
      
      /* Demo system styles */
      .demo-system-content {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 20px;
        height: 100%;
      }
      
      .demo-categories {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 15px;
      }
      
      .demo-category-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .demo-category-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        padding: 10px 15px;
        text-align: left;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .demo-category-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.9);
      }
      
      .demo-category-btn.active {
        background: rgba(13, 110, 253, 0.2);
        color: rgba(255, 255, 255, 0.9);
      }
      
      /* Implementation demo styles */
      .implementation-demo {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .implementation-controls {
        display: flex;
        gap: 10px;
      }
      
      .indicator-preview {
        flex: 1;
        min-height: 300px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      
      .preview-content {
        text-align: center;
        padding: 20px;
      }
      
      .preview-content h4 {
        margin-bottom: 10px;
      }
      
      /* Rainbow indicator settings */
      .rainbow-indicator-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .color-presets {
        margin-top: 20px;
      }
      
      .preset-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-top: 10px;
      }
      
      .preset-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .preset-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
      }
      
      /* Cubbit storage panel styles */
      .cubbit-storage-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .cubbit-settings {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 20px;
      }
      
      .cubbit-status {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 15px;
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      
      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 0, 0, 0.5);
      }
      
      .status-dot.connected {
        background-color: rgba(46, 204, 113, 0.8);
      }
      
      /* Responsive styles */
      @media (max-width: 768px) {
        .system-panel {
          width: 95%;
          height: 90%;
        }
        
        .demo-system-content {
          grid-template-columns: 1fr;
        }
        
        .preset-buttons {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Inject styles
    injectSystemPanelStyles();
    
    // Initialize dock
    initialize();
  });
  
  // Public API
  return {
    initialize,
    toggleModule,
    showToast
  };
})();
