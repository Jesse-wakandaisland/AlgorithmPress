/**
 * Implementation Example Module for AlgorithmPress
 * Shows practical implementation examples of various features
 */

const ImplementationExample = (function() {
  'use strict';
  
  // Module state
  let _initialized = false;
  let _panel = null;
  let _panelVisible = false;
  
  // Current active example
  let _activeExample = 'rainbow-border';
  
  // Rainbow indicator instance for preview
  let _previewIndicator = null;
  
  // Example implementations
  const _examples = [
    {
      id: 'rainbow-border',
      name: 'Rainbow Border Indicator',
      description: 'A customizable animated border effect for visual feedback on important events.',
      category: 'ui',
      complexity: 'intermediate',
      features: [
        'Configurable colors and animation speed',
        'Smooth animation transitions',
        'Event-based triggering',
        'Multiple animation styles'
      ]
    },
    {
      id: 'drag-drop',
      name: 'Drag and Drop Interface',
      description: 'A flexible drag and drop interface for element rearrangement.',
      category: 'interaction',
      complexity: 'advanced',
      features: [
        'Touch screen support',
        'Animated transitions',
        'Drop zone highlighting',
        'Reordering capabilities'
      ]
    },
    {
      id: 'theme-switcher',
      name: 'Dynamic Theme Switcher',
      description: 'A system for switching between multiple theme styles dynamically.',
      category: 'ui',
      complexity: 'intermediate',
      features: [
        'Light and dark mode',
        'Custom color schemes',
        'Transitions between themes',
        'Local storage persistence'
      ]
    },
    {
      id: 'form-validation',
      name: 'Advanced Form Validation',
      description: 'A comprehensive form validation system with inline feedback.',
      category: 'forms',
      complexity: 'intermediate',
      features: [
        'Real-time validation',
        'Custom validation rules',
        'Inline error messages',
        'Field dependency handling'
      ]
    },
    {
      id: 'data-visualization',
      name: 'Interactive Data Visualization',
      description: 'Interactive charts and graphs for data representation.',
      category: 'data',
      complexity: 'advanced',
      features: [
        'Multiple chart types',
        'Animated transitions',
        'Interactive tooltips',
        'Data filtering capabilities'
      ]
    }
  ];
  
  /**
   * Initialize the implementation example module
   * @param {Object} options - Initialization options
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  function initialize(options = {}) {
    return new Promise((resolve) => {
      if (_initialized) {
        console.warn('Implementation Example module already initialized');
        resolve();
        return;
      }
      
      console.log('Initializing Implementation Example module...');
      
      // Create panel
      createPanel();
      
      // Register with module framework if available
      if (window.ModuleFramework) {
        window.ModuleFramework.registerModule({
          id: 'implementation',
          name: 'Implementation Example',
          version: '1.0.0',
          instance: ImplementationExample,
          status: window.ModuleFramework.MODULE_STATUS.ACTIVE
        });
      }
      
      // Register Implementation Example API if API Gateway is available
      if (window.ApiGateway) {
        window.ApiGateway.registerApi({
          namespace: 'implementation',
          provider: 'implementation',
          version: '1.0.0',
          description: 'Implementation Example API',
          methods: {
            getExamples: {
              handler: function() {
                return _examples;
              },
              permissions: ['*'],
              description: 'Get all implementation examples'
            },
            getExampleById: {
              handler: function(params) {
                return getExampleById(params.id);
              },
              permissions: ['*'],
              description: 'Get example by ID',
              schema: {
                required: ['id'],
                properties: {
                  id: { type: 'string' }
                }
              }
            }
          }
        });
      }
      
      _initialized = true;
      console.log('Implementation Example module initialized');
      
      resolve();
    });
  }
  
  /**
   * Create the implementation example panel
   */
  function createPanel() {
    // Check if panel already exists
    if (_panel) return;
    
    // Create panel element
    _panel = document.createElement('div');
    _panel.id = 'implementation-panel';
    _panel.className = 'system-panel implementation-panel hidden';
    
    _panel.innerHTML = `
      <div class="panel-header">
        <h2>Implementation Examples</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="implementation-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="implementation-container">
          <div class="implementation-sidebar">
            <div class="examples-list">
              <h3>Available Examples</h3>
              ${_examples.map(example => `
                <div class="example-item ${example.id === _activeExample ? 'active' : ''}" data-example-id="${example.id}">
                  <div class="example-name">${example.name}</div>
                  <div class="example-complexity ${example.complexity}">${capitalize(example.complexity)}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="implementation-content">
            <div class="example-details" id="example-details">
              <!-- Example details will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(_panel);
    
    // Add close button event listener
    document.getElementById('implementation-close-btn')?.addEventListener('click', function() {
      togglePanel();
    });
    
    // Add example item click events
    document.querySelectorAll('.example-item').forEach(item => {
      item.addEventListener('click', function() {
        const exampleId = this.getAttribute('data-example-id');
        _activeExample = exampleId;
        
        // Update active state
        document.querySelectorAll('.example-item').forEach(item => {
          item.classList.remove('active');
        });
        this.classList.add('active');
        
        // Load example details
        loadExampleDetails(exampleId);
      });
    });
    
    // Load initial example
    loadExampleDetails(_activeExample);
  }
  
  /**
   * Load example details
   * @param {string} exampleId - Example ID
   */
  function loadExampleDetails(exampleId) {
    const exampleDetails = document.getElementById('example-details');
    if (!exampleDetails) return;
    
    const example = getExampleById(exampleId);
    if (!example) {
      exampleDetails.innerHTML = `
        <div class="no-example">
          <p>Example not found</p>
        </div>
      `;
      return;
    }
    
    // Generate example-specific content
    let implementationHtml = '';
    let codeExamples = [];
    
    switch (exampleId) {
      case 'rainbow-border':
        implementationHtml = getRainbowBorderImpl();
        codeExamples = getRainbowBorderCodeExamples();
        break;
      case 'drag-drop':
        implementationHtml = getDragDropImpl();
        codeExamples = getDragDropCodeExamples();
        break;
      case 'theme-switcher':
        implementationHtml = getThemeSwitcherImpl();
        codeExamples = getThemeSwitcherCodeExamples();
        break;
      case 'form-validation':
        implementationHtml = getFormValidationImpl();
        codeExamples = getFormValidationCodeExamples();
        break;
      case 'data-visualization':
        implementationHtml = getDataVisualizationImpl();
        codeExamples = getDataVisualizationCodeExamples();
        break;
      default:
        implementationHtml = `<p>No implementation available for this example.</p>`;
        break;
    }
    
    exampleDetails.innerHTML = `
      <div class="example-header">
        <h2>${example.name}</h2>
        <span class="example-tag">${example.category}</span>
      </div>
      <div class="example-description">
        <p>${example.description}</p>
        <div class="features-list">
          <h4>Features</h4>
          <ul>
            ${example.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="implementation-section">
        <h3>Implementation</h3>
        ${implementationHtml}
      </div>
      <div class="code-examples-section">
        <h3>Code Examples</h3>
        <div class="code-tabs">
          ${codeExamples.map((code, index) => `
            <button class="code-tab ${index === 0 ? 'active' : ''}" data-tab="${code.id}">${code.label}</button>
          `).join('')}
        </div>
        <div class="code-panels">
          ${codeExamples.map((code, index) => `
            <div class="code-panel ${index === 0 ? 'active' : ''}" id="${code.id}-panel">
              <pre><code class="language-${code.language}">${escapeHtml(code.code)}</code></pre>
              <button class="copy-code-btn" data-code-id="${code.id}">
                <i class="fas fa-copy"></i> Copy Code
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add tab switching
    exampleDetails.querySelectorAll('.code-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Update active tab
        exampleDetails.querySelectorAll('.code-tab').forEach(t => {
          t.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show selected panel
        exampleDetails.querySelectorAll('.code-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        exampleDetails.querySelector(`#${tabId}-panel`).classList.add('active');
      });
    });
    
    // Add copy code buttons
    exampleDetails.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const codeId = this.getAttribute('data-code-id');
        const codePanel = exampleDetails.querySelector(`#${codeId}-panel`);
        const codeText = codePanel.querySelector('code').textContent;
        
        // Copy to clipboard
        navigator.clipboard.writeText(codeText)
          .then(() => {
            // Show success indicator
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.classList.add('success');
            
            // Reset after 2 seconds
            setTimeout(() => {
              this.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
              this.classList.remove('success');
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy code:', err);
            
            // Show error indicator
            this.innerHTML = '<i class="fas fa-times"></i> Error!';
            this.classList.add('error');
            
            // Reset after 2 seconds
            setTimeout(() => {
              this.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
              this.classList.remove('error');
            }, 2000);
          });
      });
    });
    
    // Initialize example-specific functionality
    if (exampleId === 'rainbow-border') {
      initRainbowBorderExample();
    } else if (exampleId === 'drag-drop') {
      initDragDropExample();
    } else if (exampleId === 'theme-switcher') {
      initThemeSwitcherExample();
    } else if (exampleId === 'form-validation') {
      initFormValidationExample();
    } else if (exampleId === 'data-visualization') {
      initDataVisualizationExample();
    }
  }
  
  /**
   * Get Rainbow Border implementation HTML
   * @returns {string} Implementation HTML
   */
  function getRainbowBorderImpl() {
    return `
      <div class="rainbow-border-demo">
        <div class="demo-controls">
          <div class="control-group">
            <label for="border-size">Border Size</label>
            <input type="range" id="border-size" min="1" max="10" value="4" class="form-range">
            <span class="range-value">4px</span>
          </div>
          <div class="control-group">
            <label for="glow-size">Glow Size</label>
            <input type="range" id="glow-size" min="0" max="30" value="10" class="form-range">
            <span class="range-value">10px</span>
          </div>
          <div class="control-group">
            <label for="animation-speed">Animation Speed</label>
            <input type="range" id="animation-speed" min="1" max="10" value="4" class="form-range">
            <span class="range-value">4s</span>
          </div>
          <div class="control-group">
            <label for="animation-style">Animation Style</label>
            <select id="animation-style" class="form-select">
              <option value="rainbow">Rainbow</option>
              <option value="pulse">Pulse</option>
              <option value="rotating">Rotating</option>
            </select>
          </div>
          <div class="control-actions">
            <button id="start-indicator-btn" class="btn btn-primary">Start Animation</button>
            <button id="stop-indicator-btn" class="btn btn-secondary">Stop Animation</button>
          </div>
        </div>
        <div class="demo-preview">
          <div class="preview-container" id="indicator-preview">
            <div class="preview-content">
              <h3>Rainbow Border Preview</h3>
              <p>This element demonstrates the rainbow border effect. Use the controls to customize the animation.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get Rainbow Border code examples
   * @returns {Array} Code examples
   */
  function getRainbowBorderCodeExamples() {
    return [
      {
        id: 'rainbow-html',
        label: 'HTML',
        language: 'html',
        code: `<!-- Element that will have the rainbow border effect -->
<div id="myElement" class="rainbow-element">
  <h3>Important Content</h3>
  <p>This content has a rainbow border effect for emphasis.</p>
</div>

<!-- Include the RainbowIndicator script -->
<script src="rainbow-indicator.js"></script>

<!-- Initialize and control the indicator -->
<script>
  // Get the element
  const element = document.getElementById('myElement');
  
  // Initialize the rainbow indicator
  const indicator = RainbowIndicator.init(element, {
    borderSize: 4,
    glowSize: 10,
    animationSpeed: 4,
    style: 'rainbow'
  });
  
  // Start the animation
  indicator.start();
  
  // Later, you can stop the animation
  // indicator.stop();
  
  // Or toggle the animation
  // indicator.toggle();
</script>`
      },
      {
        id: 'rainbow-js',
        label: 'JavaScript',
        language: 'javascript',
        code: `/**
 * Rainbow Border Indicator
 * A module for adding animated rainbow borders to elements
 */
const RainbowIndicator = (function() {
  'use strict';
  
  // Store all created indicators
  const indicators = new Map();
  
  /**
   * Initialize a new rainbow indicator
   * @param {HTMLElement|string} element - Element or element selector
   * @param {Object} options - Configuration options
   * @returns {Object} Indicator control object
   */
  function init(element, options = {}) {
    // Get the element if selector was provided
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    // Return null if element not found
    if (!element) {
      console.error('Rainbow Indicator: Element not found');
      return null;
    }
    
    // Generate unique ID for this instance
    const id = 'rainbow-' + Date.now().toString(36);
    
    // Default options
    const defaults = {
      borderSize: 4,
      glowSize: 10,
      animationSpeed: 4,
      style: 'rainbow'  // rainbow, pulse, or rotating
    };
    
    // Merge options with defaults
    const config = { ...defaults, ...options };
    
    // Create indicator object
    const indicator = {
      id,
      element,
      config,
      active: false,
      start: () => startAnimation(id),
      stop: () => stopAnimation(id),
      toggle: () => toggleAnimation(id),
      updateSettings: (newSettings) => updateSettings(id, newSettings)
    };
    
    // Add to indicators collection
    indicators.set(id, indicator);
    
    // Add necessary styles
    addStyles(element, config);
    
    return indicator;
  }
  
  /**
   * Add necessary styles to the element
   * @param {HTMLElement} element - Target element
   * @param {Object} config - Indicator configuration
   */
  function addStyles(element, config) {
    // Add position relative if not already set
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
      element.style.position = 'relative';
    }
    
    // Add overflow hidden to the element
    if (computedStyle.overflow === 'visible') {
      element.style.overflow = 'hidden';
    }
    
    // Add border radius if not already set
    if (parseInt(computedStyle.borderRadius) === 0) {
      element.style.borderRadius = '8px';
    }
  }
  
  /**
   * Start the rainbow animation
   * @param {string} id - Indicator ID
   */
  function startAnimation(id) {
    const indicator = indicators.get(id);
    if (!indicator) return;
    
    // If already active, do nothing
    if (indicator.active) return;
    
    // Set active state
    indicator.active = true;
    
    // Create the border element if not exists
    let borderElement = indicator.element.querySelector('.rainbow-border');
    if (!borderElement) {
      borderElement = document.createElement('div');
      borderElement.className = 'rainbow-border';
      indicator.element.appendChild(borderElement);
    }
    
    // Apply styles to the border element
    const { borderSize, glowSize, animationSpeed, style } = indicator.config;
    
    borderElement.style.position = 'absolute';
    borderElement.style.top = '0';
    borderElement.style.left = '0';
    borderElement.style.right = '0';
    borderElement.style.bottom = '0';
    borderElement.style.pointerEvents = 'none';
    borderElement.style.borderRadius = 'inherit';
    
    // Set border style based on animation style
    if (style === 'rainbow') {
      borderElement.style.border = \`\${borderSize}px solid transparent\`;
      borderElement.style.background = \`
        linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet, red) border-box\
      \`;
      borderElement.style.WebkitMask = 
        'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)';
      borderElement.style.WebkitMaskComposite = 'xor';
      borderElement.style.maskComposite = 'exclude';
      borderElement.style.animation = \`rainbowRotate \${animationSpeed}s linear infinite\`;
    } else if (style === 'pulse') {
      borderElement.style.border = \`\${borderSize}px solid rgba(13, 110, 253, 0.8)\`;
      borderElement.style.boxShadow = \`0 0 \${glowSize}px rgba(13, 110, 253, 0.8)\`;
      borderElement.style.animation = \`pulseBorder \${animationSpeed / 2}s ease-in-out infinite\`;
    } else if (style === 'rotating') {
      borderElement.style.border = \`\${borderSize}px solid transparent\`;
      borderElement.style.background = \`
        linear-gradient(135deg, rgba(13, 110, 253, 0.8), rgba(255, 193, 7, 0.8)) border-box\
      \`;
      borderElement.style.WebkitMask = 
        'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)';
      borderElement.style.WebkitMaskComposite = 'xor';
      borderElement.style.maskComposite = 'exclude';
      borderElement.style.animation = \`rotatingBorder \${animationSpeed}s linear infinite\`;
    }
    
    // Add necessary keyframes if not already added
    addKeyframes();
  }
  
  /**
   * Stop the rainbow animation
   * @param {string} id - Indicator ID
   */
  function stopAnimation(id) {
    const indicator = indicators.get(id);
    if (!indicator) return;
    
    // If not active, do nothing
    if (!indicator.active) return;
    
    // Set inactive state
    indicator.active = false;
    
    // Remove the border element
    const borderElement = indicator.element.querySelector('.rainbow-border');
    if (borderElement) {
      borderElement.remove();
    }
  }
  
  /**
   * Toggle the rainbow animation
   * @param {string} id - Indicator ID
   */
  function toggleAnimation(id) {
    const indicator = indicators.get(id);
    if (!indicator) return;
    
    if (indicator.active) {
      stopAnimation(id);
    } else {
      startAnimation(id);
    }
  }
  
  /**
   * Update indicator settings
   * @param {string} id - Indicator ID
   * @param {Object} newSettings - New settings
   */
  function updateSettings(id, newSettings) {
    const indicator = indicators.get(id);
    if (!indicator) return;
    
    // Update config
    Object.assign(indicator.config, newSettings);
    
    // If active, restart animation
    if (indicator.active) {
      stopAnimation(id);
      startAnimation(id);
    }
  }
  
  /**
   * Add necessary keyframes for the animations
   */
  function addKeyframes() {
    // Check if keyframes already added
    if (document.getElementById('rainbow-indicator-keyframes')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'rainbow-indicator-keyframes';
    
    // Add keyframes
    style.textContent = \`
      @keyframes rainbowRotate {
        0% {
          background-position: 0% 0%;
        }
        100% {
          background-position: 100% 0%;
        }
      }
      
      @keyframes pulseBorder {
        0% {
          opacity: 0.4;
          transform: scale(0.98);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0.4;
          transform: scale(0.98);
        }
      }
      
      @keyframes rotatingBorder {
        0% {
          background-position: 0% 0%;
          transform: rotate(0deg);
        }
        100% {
          background-position: 100% 0%;
          transform: rotate(360deg);
        }
      }
    \`;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  // Public API
  return {
    init,
    getIndicator: (id) => indicators.get(id) || null,
    getAllIndicators: () => Array.from(indicators.values()),
    removeIndicator: (id) => {
      const indicator = indicators.get(id);
      if (indicator) {
        stopAnimation(id);
        indicators.delete(id);
        return true;
      }
      return false;
    }
  };
})();`
      },
      {
        id: 'rainbow-css',
        label: 'CSS',
        language: 'css',
        code: `/* Rainbow Border Indicator Styles */

/* Animation keyframes */
@keyframes rainbowRotate {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}

@keyframes pulseBorder {
  0% {
    opacity: 0.4;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.98);
  }
}

@keyframes rotatingBorder {
  0% {
    background-position: 0% 0%;
    transform: rotate(0deg);
  }
  100% {
    background-position: 100% 0%;
    transform: rotate(360deg);
  }
}

/* Element that will have the rainbow border */
.rainbow-element {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Rainbow border */
.rainbow-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: inherit;
  /* Style will be set by JavaScript */
}`
      },
      {
        id: 'rainbow-usage',
        label: 'Usage',
        language: 'javascript',
        code: `// Example 1: Basic Usage
const element = document.getElementById('myElement');
const indicator = RainbowIndicator.init(element);

// Start the animation
indicator.start();

// Stop the animation
indicator.stop();

// Toggle the animation
indicator.toggle();

// Example 2: Custom Configuration
const customIndicator = RainbowIndicator.init(element, {
  borderSize: 6,       // Border width in pixels
  glowSize: 15,        // Glow effect size in pixels
  animationSpeed: 3,   // Animation speed in seconds
  style: 'pulse'       // Animation style: 'rainbow', 'pulse', or 'rotating'
});

// Example 3: Update Settings
customIndicator.updateSettings({
  borderSize: 8,
  animationSpeed: 5
});

// Example 4: Multiple Indicators
const elements = document.querySelectorAll('.highlight-element');
const indicators = [];

elements.forEach(element => {
  indicators.push(RainbowIndicator.init(element));
});

// Start all indicators
indicators.forEach(indicator => indicator.start());

// Example 5: Event-Based Triggering
document.getElementById('importantButton').addEventListener('click', function() {
  const messageBox = document.getElementById('messageBox');
  const messageIndicator = RainbowIndicator.init(messageBox, {
    style: 'pulse',
    animationSpeed: 2
  });
  
  // Start animation
  messageIndicator.start();
  
  // Stop after 5 seconds
  setTimeout(() => {
    messageIndicator.stop();
  }, 5000);
});`
      }
    ];
  }
  
  /**
   * Initialize Rainbow Border example
   */
  function initRainbowBorderExample() {
    // Add range input event listeners
    document.querySelectorAll('.form-range').forEach(range => {
      range.addEventListener('input', function() {
        const valueDisplay = this.nextElementSibling;
        valueDisplay.textContent = this.value + (this.id === 'animation-speed' ? 's' : 'px');
        
        // Update preview if active
        updateRainbowPreview();
      });
    });
    
    // Add animation style change listener
    document.getElementById('animation-style')?.addEventListener('change', function() {
      updateRainbowPreview();
    });
    
    // Add start button event listener
    document.getElementById('start-indicator-btn')?.addEventListener('click', function() {
      startRainbowPreview();
    });
    
    // Add stop button event listener
    document.getElementById('stop-indicator-btn')?.addEventListener('click', function() {
      stopRainbowPreview();
    });
    
    // Initialize preview with static settings
    initRainbowPreview();
  }
  
  /**
   * Initialize Rainbow Border preview
   */
  function initRainbowPreview() {
    const previewElement = document.getElementById('indicator-preview');
    if (!previewElement) return;
    
    // Check if we have the rainbow indicator module
    if (typeof window.RainbowIndicator === 'undefined') {
      // Create a simple implementation for preview
      window.RainbowIndicator = {
        init: function(element, options) {
          return {
            element,
            options,
            start: function() {
              const borderSize = options.borderSize || 4;
              const glowSize = options.glowSize || 10;
              const animationSpeed = options.animationSpeed || 4;
              const style = options.style || 'rainbow';
              
              element.style.position = 'relative';
              element.style.overflow = 'hidden';
              element.style.borderRadius = '8px';
              
              let borderElement = element.querySelector('.rainbow-border');
              if (!borderElement) {
                borderElement = document.createElement('div');
                borderElement.className = 'rainbow-border';
                element.appendChild(borderElement);
              }
              
              borderElement.style.position = 'absolute';
              borderElement.style.top = '0';
              borderElement.style.left = '0';
              borderElement.style.right = '0';
              borderElement.style.bottom = '0';
              borderElement.style.pointerEvents = 'none';
              borderElement.style.borderRadius = 'inherit';
              
              if (style === 'rainbow') {
                borderElement.style.border = `${borderSize}px solid transparent`;
                borderElement.style.backgroundImage = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet, red)';
                borderElement.style.backgroundOrigin = 'border-box';
                borderElement.style.backgroundClip = 'border-box';
                borderElement.style.WebkitMask = 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)';
                borderElement.style.WebkitMaskComposite = 'xor';
                borderElement.style.maskComposite = 'exclude';
                borderElement.style.animation = `rainbowRotate ${animationSpeed}s linear infinite`;
              } else if (style === 'pulse') {
                borderElement.style.border = `${borderSize}px solid rgba(13, 110, 253, 0.8)`;
                borderElement.style.boxShadow = `0 0 ${glowSize}px rgba(13, 110, 253, 0.8)`;
                borderElement.style.animation = `pulseBorder ${animationSpeed / 2}s ease-in-out infinite`;
              } else if (style === 'rotating') {
                borderElement.style.border = `${borderSize}px solid transparent`;
                borderElement.style.backgroundImage = 'linear-gradient(135deg, rgba(13, 110, 253, 0.8), rgba(255, 193, 7, 0.8))';
                borderElement.style.backgroundOrigin = 'border-box';
                borderElement.style.backgroundClip = 'border-box';
                borderElement.style.WebkitMask = 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)';
                borderElement.style.WebkitMaskComposite = 'xor';
                borderElement.style.maskComposite = 'exclude';
                borderElement.style.animation = `rotatingBorder ${animationSpeed}s linear infinite`;
              }
              
              // Add keyframes if not exists
              if (!document.getElementById('rainbow-indicator-keyframes')) {
                const style = document.createElement('style');
                style.id = 'rainbow-indicator-keyframes';
                style.textContent = `
                  @keyframes rainbowRotate {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 0%; }
                  }
                  
                  @keyframes pulseBorder {
                    0% { opacity: 0.4; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0.4; transform: scale(0.98); }
                  }
                  
                  @keyframes rotatingBorder {
                    0% { background-position: 0% 0%; transform: rotate(0deg); }
                    100% { background-position: 100% 0%; transform: rotate(360deg); }
                  }
                `;
                document.head.appendChild(style);
              }
              
              return true;
            },
            stop: function() {
              const borderElement = element.querySelector('.rainbow-border');
              if (borderElement) {
                borderElement.remove();
              }
              return true;
            },
            toggle: function() {
              const borderElement = element.querySelector('.rainbow-border');
              if (borderElement) {
                this.stop();
              } else {
                this.start();
              }
            },
            updateSettings: function(newSettings) {
              Object.assign(this.options, newSettings);
              const borderElement = element.querySelector('.rainbow-border');
              if (borderElement) {
                this.stop();
                this.start();
              }
            }
          };
        }
      };
    }
  }
  
  /**
   * Start Rainbow Border preview
   */
  function startRainbowPreview() {
    const previewElement = document.getElementById('indicator-preview');
    if (!previewElement) return;
    
    // Get current settings
    const borderSize = parseInt(document.getElementById('border-size').value) || 4;
    const glowSize = parseInt(document.getElementById('glow-size').value) || 10;
    const animationSpeed = parseInt(document.getElementById('animation-speed').value) || 4;
    const style = document.getElementById('animation-style').value || 'rainbow';
    
    // Create or update preview indicator
    if (!_previewIndicator) {
      _previewIndicator = window.RainbowIndicator.init(previewElement, {
        borderSize,
        glowSize,
        animationSpeed,
        style
      });
    } else {
      _previewIndicator.updateSettings({
        borderSize,
        glowSize,
        animationSpeed,
        style
      });
    }
    
    // Start animation
    _previewIndicator.start();
    
    // Update button states
    document.getElementById('start-indicator-btn').disabled = true;
    document.getElementById('stop-indicator-btn').disabled = false;
  }
  
  /**
   * Stop Rainbow Border preview
   */
  function stopRainbowPreview() {
    if (!_previewIndicator) return;
    
    // Stop animation
    _previewIndicator.stop();
    
    // Update button states
    document.getElementById('start-indicator-btn').disabled = false;
    document.getElementById('stop-indicator-btn').disabled = true;
  }
  
  /**
   * Update Rainbow Border preview
   */
  function updateRainbowPreview() {
    const previewElement = document.getElementById('indicator-preview');
    if (!previewElement) return;
    
    // Check if preview is active
    const borderElement = previewElement.querySelector('.rainbow-border');
    if (!borderElement) return;
    
    // Get current settings
    const borderSize = parseInt(document.getElementById('border-size').value) || 4;
    const glowSize = parseInt(document.getElementById('glow-size').value) || 10;
    const animationSpeed = parseInt(document.getElementById('animation-speed').value) || 4;
    const style = document.getElementById('animation-style').value || 'rainbow';
    
    // Update preview indicator
    if (_previewIndicator) {
      _previewIndicator.updateSettings({
        borderSize,
        glowSize,
        animationSpeed,
        style
      });
    }
  }
  
  /**
   * Get Drag and Drop implementation HTML
   * @returns {string} Implementation HTML
   */
  function getDragDropImpl() {
    return `
      <div class="drag-drop-demo">
        <p>This example demonstrates a simple drag and drop interface.</p>
        <p>You can create your own drag and drop interfaces using the code examples provided.</p>
      </div>
    `;
  }
  
  /**
   * Get Drag and Drop code examples
   * @returns {Array} Code examples
   */
  function getDragDropCodeExamples() {
    return [
      {
        id: 'dragdrop-html',
        label: 'HTML',
        language: 'html',
        code: `<!-- Drag and Drop Container -->
<div class="drag-drop-container">
  <div class="drag-item-list">
    <!-- Draggable items -->
    <div class="drag-item" draggable="true" data-id="item1">Item 1</div>
    <div class="drag-item" draggable="true" data-id="item2">Item 2</div>
    <div class="drag-item" draggable="true" data-id="item3">Item 3</div>
    <div class="drag-item" draggable="true" data-id="item4">Item 4</div>
  </div>
  
  <div class="drop-zones">
    <!-- Drop zones -->
    <div class="drop-zone" data-zone="zone1">
      <h3>Zone 1</h3>
      <div class="drop-area" data-zone="zone1"></div>
    </div>
    
    <div class="drop-zone" data-zone="zone2">
      <h3>Zone 2</h3>
      <div class="drop-area" data-zone="zone2"></div>
    </div>
  </div>
</div>`
      },
      {
        id: 'dragdrop-js',
        label: 'JavaScript',
        language: 'javascript',
        code: `/**
 * Drag and Drop Interface
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get all draggable items
  const dragItems = document.querySelectorAll('.drag-item');
  
  // Get all drop areas
  const dropAreas = document.querySelectorAll('.drop-area');
  
  // Initialize drag items
  dragItems.forEach(item => {
    // Add dragstart event
    item.addEventListener('dragstart', handleDragStart);
    
    // Add dragend event
    item.addEventListener('dragend', handleDragEnd);
  });
  
  // Initialize drop areas
  dropAreas.forEach(area => {
    // Add dragover event
    area.addEventListener('dragover', handleDragOver);
    
    // Add dragenter event
    area.addEventListener('dragenter', handleDragEnter);
    
    // Add dragleave event
    area.addEventListener('dragleave', handleDragLeave);
    
    // Add drop event
    area.addEventListener('drop', handleDrop);
  });
  
  /**
   * Handle drag start event
   * @param {DragEvent} e - Drag event
   */
  function handleDragStart(e) {
    // Add dragging class
    this.classList.add('dragging');
    
    // Set drag data
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
    
    // Set drag image (optional)
    // e.dataTransfer.setDragImage(this, 0, 0);
  }
  
  /**
   * Handle drag end event
   * @param {DragEvent} e - Drag event
   */
  function handleDragEnd(e) {
    // Remove dragging class
    this.classList.remove('dragging');
    
    // Remove drag effects from all drop areas
    document.querySelectorAll('.drop-area').forEach(area => {
      area.classList.remove('drag-over');
    });
  }
  
  /**
   * Handle drag over event
   * @param {DragEvent} e - Drag event
   */
  function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    
    // Set drop effect
    e.dataTransfer.dropEffect = 'move';
  }
  
  /**
   * Handle drag enter event
   * @param {DragEvent} e - Drag event
   */
  function handleDragEnter(e) {
    // Prevent default
    e.preventDefault();
    
    // Add drag-over class
    this.classList.add('drag-over');
  }
  
  /**
   * Handle drag leave event
   * @param {DragEvent} e - Drag event
   */
  function handleDragLeave(e) {
    // Remove drag-over class
    this.classList.remove('drag-over');
  }
  
  /**
   * Handle drop event
   * @param {DragEvent} e - Drag event
   */
  function handleDrop(e) {
    // Prevent default action
    e.preventDefault();
    
    // Remove drag-over class
    this.classList.remove('drag-over');
    
    // Get the dragged item ID
    const itemId = e.dataTransfer.getData('text/plain');
    
    // Get the original item
    const draggedItem = document.querySelector(\`.drag-item[data-id="\${itemId}"]\`);
    
    // Check if the item exists
    if (!draggedItem) return;
    
    // Create a clone of the dragged item
    const itemClone = draggedItem.cloneNode(true);
    
    // Add drop-item class
    itemClone.classList.add('drop-item');
    
    // Remove draggable attribute
    itemClone.removeAttribute('draggable');
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', function() {
      itemClone.remove();
    });
    
    itemClone.appendChild(removeBtn);
    
    // Add to drop area
    this.appendChild(itemClone);
    
    // Fire drop event
    const dropEvent = new CustomEvent('item:dropped', {
      detail: {
        itemId: itemId,
        zoneId: this.getAttribute('data-zone')
      }
    });
    
    document.dispatchEvent(dropEvent);
  }
});`
      },
      {
        id: 'dragdrop-css',
        label: 'CSS',
        language: 'css',
        code: `/* Drag and Drop styles */
.drag-drop-container {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.drag-item-list {
  width: 200px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.drag-item {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 10px;
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
}

.drag-item:hover {
  background-color: #f1f3f5;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.drag-item.dragging {
  opacity: 0.6;
  border: 1px dashed #adb5bd;
}

.drop-zones {
  display: flex;
  gap: 20px;
  flex: 1;
}

.drop-zone {
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.drop-zone h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
  text-align: center;
  color: #495057;
}

.drop-area {
  min-height: 150px;
  border: 2px dashed #ced4da;
  border-radius: 6px;
  padding: 10px;
  transition: all 0.2s ease;
}

.drop-area.drag-over {
  background-color: rgba(13, 110, 253, 0.1);
  border-color: #0d6efd;
}

.drop-item {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 10px;
  user-select: none;
  position: relative;
  animation: dropIn 0.3s forwards;
}

.remove-item {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff5b5b;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.drop-item:hover .remove-item {
  opacity: 1;
}

@keyframes dropIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`
      }
    ];
  }
  
  /**
   * Initialize Drag and Drop example
   */
  function initDragDropExample() {
    // Not implemented for this demo
  }
  
  /**
   * Get Theme Switcher implementation HTML
   * @returns {string} Implementation HTML
   */
  function getThemeSwitcherImpl() {
    return `
      <div class="theme-switcher-demo">
        <p>This example demonstrates a dynamic theme switcher implementation.</p>
        <p>You can create your own theme switcher using the code examples provided.</p>
      </div>
    `;
  }
  
  /**
   * Get Theme Switcher code examples
   * @returns {Array} Code examples
   */
  function getThemeSwitcherCodeExamples() {
    return [
      {
        id: 'theme-html',
        label: 'HTML',
        language: 'html',
        code: `<!-- Theme Switcher UI -->
<div class="theme-switcher">
  <div class="theme-option" data-theme="light">
    <div class="theme-preview light-theme"></div>
    <span>Light</span>
  </div>
  
  <div class="theme-option" data-theme="dark">
    <div class="theme-preview dark-theme"></div>
    <span>Dark</span>
  </div>
  
  <div class="theme-option" data-theme="blue">
    <div class="theme-preview blue-theme"></div>
    <span>Blue</span>
  </div>
  
  <div class="theme-option" data-theme="green">
    <div class="theme-preview green-theme"></div>
    <span>Green</span>
  </div>
</div>

<!-- Toggle Switch -->
<div class="theme-mode-toggle">
  <span class="toggle-label">Light</span>
  <label class="toggle-switch">
    <input type="checkbox" id="dark-mode-toggle">
    <span class="toggle-slider"></span>
  </label>
  <span class="toggle-label">Dark</span>
</div>`
      },
      {
        id: 'theme-js',
        label: 'JavaScript',
        language: 'javascript',
        code: `/**
 * Theme Switcher
 * A module for switching between multiple theme styles
 */
const ThemeSwitcher = (function() {
  'use strict';
  
  // Available themes
  const themes = {
    light: {
      name: 'Light',
      colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        border: '#dee2e6'
      }
    },
    dark: {
      name: 'Dark',
      colors: {
        primary: '#3d8bfd',
        secondary: '#6c757d',
        background: '#212529',
        surface: '#343a40',
        text: '#f8f9fa',
        border: '#495057'
      }
    },
    blue: {
      name: 'Blue',
      colors: {
        primary: '#0dcaf0',
        secondary: '#6610f2',
        background: '#f0f8ff',
        surface: '#e6f2ff',
        text: '#0a2463',
        border: '#b8d3ff'
      }
    },
    green: {
      name: 'Green',
      colors: {
        primary: '#198754',
        secondary: '#0dcaf0',
        background: '#f0fff4',
        surface: '#e6ffee',
        text: '#1b5e20',
        border: '#c8e6c9'
      }
    }
  };
  
  // Current theme
  let currentTheme = 'light';
  
  // Dark mode state
  let darkMode = false;
  
  /**
   * Initialize the theme switcher
   * @param {Object} options - Initialization options
   */
  function init(options = {}) {
    // Set initial theme from options or localStorage
    const savedTheme = localStorage.getItem('app-theme');
    const savedDarkMode = localStorage.getItem('app-dark-mode') === 'true';
    
    // Set initial states
    currentTheme = savedTheme || options.defaultTheme || 'light';
    darkMode = savedDarkMode || options.defaultDarkMode || false;
    
    // Apply theme
    applyTheme(currentTheme, darkMode);
    
    // Add theme option click handlers
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', function() {
        const theme = this.getAttribute('data-theme');
        setTheme(theme, darkMode);
      });
    });
    
    // Add dark mode toggle handler
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.checked = darkMode;
      
      darkModeToggle.addEventListener('change', function() {
        setDarkMode(this.checked);
      });
    }
  }
  
  /**
   * Apply a theme to the document
   * @param {string} theme - Theme name
   * @param {boolean} isDark - Whether to apply dark mode
   */
  function applyTheme(theme, isDark) {
    // Get theme configuration
    const themeConfig = themes[theme];
    if (!themeConfig) return;
    
    // Get the root element
    const root = document.documentElement;
    
    // Apply theme colors
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      // Modify colors for dark mode if needed
      let colorValue = value;
      
      if (isDark && theme !== 'dark') {
        // Darken colors for non-dark themes in dark mode
        switch (key) {
          case 'background':
            colorValue = '#212529';
            break;
          case 'surface':
            colorValue = '#343a40';
            break;
          case 'text':
            colorValue = '#f8f9fa';
            break;
          case 'border':
            colorValue = '#495057';
            break;
          default:
            // Keep accent colors as is
            break;
        }
      }
      
      // Set CSS variable
      root.style.setProperty(\`--color-\${key}\`, colorValue);
    });
    
    // Add theme and mode classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green');
    root.classList.add(\`theme-\${theme}\`);
    
    if (isDark) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    
    // Update theme options UI
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
      
      if (option.getAttribute('data-theme') === theme) {
        option.classList.add('active');
      }
    });
    
    // Update toggle UI
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.checked = isDark;
    }
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-dark-mode', isDark);
    
    // Fire theme change event
    document.dispatchEvent(new CustomEvent('theme:changed', {
      detail: {
        theme,
        darkMode: isDark,
        colors: getComputedThemeColors()
      }
    }));
  }
  
  /**
   * Set the current theme
   * @param {string} theme - Theme name
   * @param {boolean} isDark - Whether to apply dark mode
   */
  function setTheme(theme, isDark = darkMode) {
    if (themes[theme]) {
      currentTheme = theme;
      darkMode = isDark;
      applyTheme(theme, isDark);
    }
  }
  
  /**
   * Set dark mode
   * @param {boolean} enabled - Whether dark mode is enabled
   */
  function setDarkMode(enabled) {
    darkMode = enabled;
    applyTheme(currentTheme, enabled);
  }
  
  /**
   * Get computed theme colors
   * @returns {Object} Computed theme colors
   */
  function getComputedThemeColors() {
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      primary: computedStyle.getPropertyValue('--color-primary').trim(),
      secondary: computedStyle.getPropertyValue('--color-secondary').trim(),
      background: computedStyle.getPropertyValue('--color-background').trim(),
      surface: computedStyle.getPropertyValue('--color-surface').trim(),
      text: computedStyle.getPropertyValue('--color-text').trim(),
      border: computedStyle.getPropertyValue('--color-border').trim()
    };
  }
  
  /**
   * Get current theme
   * @returns {Object} Current theme and dark mode status
   */
  function getCurrentTheme() {
    return {
      theme: currentTheme,
      darkMode,
      name: themes[currentTheme].name,
      colors: getComputedThemeColors()
    };
  }
  
  /**
   * Get all available themes
   * @returns {Object} Available themes
   */
  function getAvailableThemes() {
    return { ...themes };
  }
  
  // Public API
  return {
    init,
    setTheme,
    setDarkMode,
    getCurrentTheme,
    getAvailableThemes
  };
})();

// Initialize theme switcher
document.addEventListener('DOMContentLoaded', function() {
  ThemeSwitcher.init({
    defaultTheme: 'light',
    defaultDarkMode: false
  });
});`
      },
      {
        id: 'theme-css',
        label: 'CSS',
        language: 'css',
        code: `/* Theme Switcher Styles */

/* Theme variables */
:root {
  /* Default light theme */
  --color-primary: #0d6efd;
  --color-secondary: #6c757d;
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  --color-text: #212529;
  --color-border: #dee2e6;
  
  /* Transition for smooth theme changes */
  --theme-transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* Apply transitions to elements */
body, button, input, select, textarea, .card, .modal, .navbar, .sidebar, .panel {
  transition: var(--theme-transition);
}

/* Theme application */
body {
  background-color: var(--color-background);
  color: var(--color-text);
}

.card, .panel {
  background-color: var(--color-surface);
  border-color: var(--color-border);
}

button, .btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

button.secondary, .btn-secondary {
  background-color: var(--color-secondary);
}

/* Theme switcher UI */
.theme-switcher {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.theme-preview {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  margin-bottom: 8px;
  border: 2px solid var(--color-border);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.theme-option:hover .theme-preview {
  transform: translateY(-3px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.theme-option.active .theme-preview {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* Theme preview styles */
.light-theme {
  background-color: #ffffff;
}

.light-theme::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 15px;
  background-color: #0d6efd;
}

.dark-theme {
  background-color: #212529;
}

.dark-theme::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 15px;
  background-color: #3d8bfd;
}

.blue-theme {
  background-color: #f0f8ff;
}

.blue-theme::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 15px;
  background-color: #0dcaf0;
}

.green-theme {
  background-color: #f0fff4;
}

.green-theme::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 15px;
  background-color: #198754;
}

/* Toggle switch */
.theme-mode-toggle {
  display: flex;
  align-items: center;
  margin-top: 20px;
}

.toggle-label {
  margin: 0 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 34px;
  transition: .4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px var(--color-primary);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}`
      }
    ];
  }
  
  /**
   * Initialize Theme Switcher example
   */
  function initThemeSwitcherExample() {
    // Not implemented for this demo
  }
  
  /**
   * Get Form Validation implementation HTML
   * @returns {string} Implementation HTML
   */
  function getFormValidationImpl() {
    return `
      <div class="form-validation-demo">
        <p>This example demonstrates an advanced form validation system.</p>
        <p>You can create your own form validation using the code examples provided.</p>
      </div>
    `;
  }
  
  /**
   * Get Form Validation code examples
   * @returns {Array} Code examples
   */
  function getFormValidationCodeExamples() {
    return [
      {
        id: 'form-html',
        label: 'HTML',
        language: 'html',
        code: `<!-- Form with validation -->
<form id="registration-form" class="validated-form" novalidate>
  <div class="form-group">
    <label for="username">Username</label>
    <input 
      type="text" 
      id="username" 
      name="username" 
      class="form-control" 
      required
      data-validation="username"
      data-validation-message="Username must be 4-20 characters and contain only letters, numbers, and underscores"
      data-validation-pattern="^[a-zA-Z0-9_]{4,20}$"
    >
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <label for="email">Email</label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      class="form-control" 
      required
      data-validation="email"
      data-validation-message="Please enter a valid email address"
    >
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <label for="password">Password</label>
    <input 
      type="password" 
      id="password" 
      name="password" 
      class="form-control" 
      required
      data-validation="password"
      data-validation-message="Password must be at least 8 characters with at least one letter and one number"
      data-validation-pattern="^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"
    >
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <label for="confirm-password">Confirm Password</label>
    <input 
      type="password" 
      id="confirm-password" 
      name="confirmPassword" 
      class="form-control" 
      required
      data-validation="match"
      data-validation-match="password"
      data-validation-message="Passwords do not match"
    >
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <label for="age">Age</label>
    <input 
      type="number" 
      id="age" 
      name="age" 
      class="form-control" 
      required
      min="18"
      max="120"
      data-validation="range"
      data-validation-min="18"
      data-validation-max="120"
      data-validation-message="Age must be between 18 and 120"
    >
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <label for="country">Country</label>
    <select 
      id="country" 
      name="country" 
      class="form-select" 
      required
      data-validation="required"
      data-validation-message="Please select your country"
    >
      <option value="">Select Country</option>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="uk">United Kingdom</option>
      <option value="au">Australia</option>
      <option value="other">Other</option>
    </select>
    <div class="validation-feedback"></div>
  </div>
  
  <div class="form-group">
    <div class="form-check">
      <input 
        type="checkbox" 
        id="terms" 
        name="terms" 
        class="form-check-input" 
        required
        data-validation="checked"
        data-validation-message="You must agree to the terms and conditions"
      >
      <label class="form-check-label" for="terms">
        I agree to the <a href="#">terms and conditions</a>
      </label>
      <div class="validation-feedback"></div>
    </div>
  </div>
  
  <button type="submit" class="btn btn-primary">Register</button>
</form>`
      },
      {
        id: 'form-js',
        label: 'JavaScript',
        language: 'javascript',
        code: `/**
 * Form Validator
 * A module for validating form inputs with real-time feedback
 */
const FormValidator = (function() {
  'use strict';
  
  // Form registry
  const forms = new Map();
  
  // Available validators
  const validators = {
    /**
     * Required field validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    required: function(field) {
      return field.value.trim() !== '';
    },
    
    /**
     * Email validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    email: function(field) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
      return emailRegex.test(field.value.trim());
    },
    
    /**
     * Username validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    username: function(field) {
      const pattern = field.getAttribute('data-validation-pattern');
      const regex = new RegExp(pattern);
      return regex.test(field.value.trim());
    },
    
    /**
     * Password validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    password: function(field) {
      const pattern = field.getAttribute('data-validation-pattern');
      const regex = new RegExp(pattern);
      return regex.test(field.value);
    },
    
    /**
     * Field matching validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    match: function(field) {
      const matchField = field.getAttribute('data-validation-match');
      const matchElement = document.getElementById(matchField);
      
      if (!matchElement) return false;
      
      return field.value === matchElement.value;
    },
    
    /**
     * Range validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    range: function(field) {
      const min = parseInt(field.getAttribute('data-validation-min'));
      const max = parseInt(field.getAttribute('data-validation-max'));
      const value = parseInt(field.value);
      
      return !isNaN(value) && value >= min && value <= max;
    },
    
    /**
     * Checkbox checked validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    checked: function(field) {
      return field.checked;
    },
    
    /**
     * Pattern validator
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean} Whether the field is valid
     */
    pattern: function(field) {
      const pattern = field.getAttribute('data-validation-pattern');
      const regex = new RegExp(pattern);
      return regex.test(field.value);
    }
  };
  
  /**
   * Initialize form validation
   * @param {string|HTMLElement} form - Form selector or element
   * @param {Object} options - Options for form validation
   */
  function init(form, options = {}) {
    // Get form element if string was provided
    if (typeof form === 'string') {
      form = document.querySelector(form);
    }
    
    // Return null if form not found
    if (!form) {
      console.error('Form Validator: Form not found');
      return null;
    }
    
    // Generate unique ID for this form
    const formId = 'form-' + Date.now().toString(36);
    
    // Default options
    const defaults = {
      validateOnInput: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      showValidFeedback: true,
      onValid: null,
      onInvalid: null,
      onSubmit: null
    };
    
    // Merge options with defaults
    const config = { ...defaults, ...options };
    
    // Create form object
    const formObj = {
      id: formId,
      element: form,
      config,
      fields: []
    };
    
    // Find all inputs and select elements
    const fields = form.querySelectorAll('input, select, textarea');
    
    // Initialize each field
    fields.forEach(field => {
      // Skip fields without validation
      if (!field.hasAttribute('data-validation') && !field.hasAttribute('required')) {
        return;
      }
      
      // Get validation type
      const validationType = field.getAttribute('data-validation') || 
                            (field.hasAttribute('required') ? 'required' : null);
      
      // Skip if no validation type
      if (!validationType) return;
      
      // Store field data
      formObj.fields.push({
        element: field,
        type: validationType,
        feedbackElement: field.parentNode.querySelector('.validation-feedback')
      });
      
      // Add input event listener
      if (config.validateOnInput) {
        field.addEventListener('input', function() {
          validateField(formObj, field);
        });
      }
      
      // Add blur event listener
      if (config.validateOnBlur) {
        field.addEventListener('blur', function() {
          validateField(formObj, field);
        });
      }
    });
    
    // Add submit event listener
    if (config.validateOnSubmit) {
      form.addEventListener('submit', function(e) {
        // Prevent default form submission
        e.preventDefault();
        
        // Validate form
        const isValid = validateForm(formObj);
        
        // Call onSubmit callback
        if (typeof config.onSubmit === 'function') {
          config.onSubmit(isValid, formObj);
        }
        
        // Submit form if valid
        if (isValid && !options.preventSubmit) {
          form.submit();
        }
      });
    }
    
    // Add to forms registry
    forms.set(formId, formObj);
    
    // Return form object
    return {
      id: formId,
      validate: () => validateForm(formObj),
      reset: () => resetForm(formObj),
      getData: () => getFormData(formObj)
    };
  }
  
  /**
   * Validate a specific field
   * @param {Object} form - Form object
   * @param {HTMLElement} fieldElement - Field element to validate
   * @returns {boolean} Whether the field is valid
   */
  function validateField(form, fieldElement) {
    // Find field data
    const field = form.fields.find(f => f.element === fieldElement);
    if (!field) return false;
    
    // Skip disabled fields
    if (field.element.disabled) return true;
    
    // Get validation type
    const validationType = field.type;
    
    // Get validator function
    const validator = validators[validationType];
    
    // Return true if no validator found
    if (!validator) return true;
    
    // Get validation message
    const validationMessage = field.element.getAttribute('data-validation-message') || 'Invalid value';
    
    // Validate field
    const isValid = validator(field.element);
    
    // Update field state
    updateFieldState(field, isValid, validationMessage);
    
    // Call callback
    if (isValid && typeof form.config.onValid === 'function') {
      form.config.onValid(field.element);
    } else if (!isValid && typeof form.config.onInvalid === 'function') {
      form.config.onInvalid(field.element, validationMessage);
    }
    
    return isValid;
  }
  
  /**
   * Update field state
   * @param {Object} field - Field object
   * @param {boolean} isValid - Whether the field is valid
   * @param {string} message - Validation message
   */
  function updateFieldState(field, isValid, message) {
    // Remove existing classes
    field.element.classList.remove('is-valid', 'is-invalid');
    
    // Add appropriate class
    if (field.element.value.trim() !== '') {
      field.element.classList.add(isValid ? 'is-valid' : 'is-invalid');
    }
    
    // Update feedback message
    if (field.feedbackElement) {
      if (!isValid) {
        field.feedbackElement.textContent = message;
        field.feedbackElement.classList.add('invalid-feedback');
        field.feedbackElement.classList.remove('valid-feedback');
      } else {
        field.feedbackElement.textContent = '';
        if (field.element.form.config.showValidFeedback) {
          field.feedbackElement.textContent = 'Looks good!';
          field.feedbackElement.classList.add('valid-feedback');
          field.feedbackElement.classList.remove('invalid-feedback');
        }
      }
    }
  }
  
  /**
   * Validate an entire form
   * @param {Object} form - Form object
   * @returns {boolean} Whether the form is valid
   */
  function validateForm(form) {
    let isValid = true;
    
    // Validate each field
    form.fields.forEach(field => {
      const fieldValid = validateField(form, field.element);
      if (!fieldValid) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  /**
   * Reset form validation
   * @param {Object} form - Form object
   */
  function resetForm(form) {
    // Reset each field
    form.fields.forEach(field => {
      // Remove classes
      field.element.classList.remove('is-valid', 'is-invalid');
      
      // Clear feedback
      if (field.feedbackElement) {
        field.feedbackElement.textContent = '';
      }
    });
    
    // Reset form element
    form.element.reset();
  }
  
  /**
   * Get form data
   * @param {Object} form - Form object
   * @returns {Object} Form data as object
   */
  function getFormData(form) {
    const formData = new FormData(form.element);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }
  
  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  function addValidator(name, validator) {
    if (typeof validator !== 'function') {
      console.error('Form Validator: Validator must be a function');
      return;
    }
    
    validators[name] = validator;
  }
  
  // Public API
  return {
    init,
    validateForm: (formId) => {
      const form = forms.get(formId);
      return form ? validateForm(form) : false;
    },
    resetForm: (formId) => {
      const form = forms.get(formId);
      if (form) resetForm(form);
    },
    getFormData: (formId) => {
      const form = forms.get(formId);
      return form ? getFormData(form) : {};
    },
    addValidator
  };
})();

// Initialize form validation
document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = FormValidator.init('#registration-form', {
    onSubmit: function(isValid, form) {
      if (isValid) {
        console.log('Form is valid!', FormValidator.getFormData(form.id));
        alert('Form submitted successfully!');
      } else {
        console.log('Form is invalid');
      }
    }
  });
});`
      },
      {
        id: 'form-css',
        label: 'CSS',
        language: 'css',
        code: `/* Form Validation Styles */
.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-control, .form-select {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: 100%;
  font-size: 16px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus, .form-select:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-control.is-valid, .form-select.is-valid {
  border-color: #198754;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-invalid, .form-select.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-select.is-valid, .form-select.is-invalid {
  background-position: right 0.75rem center, center right 2.25rem;
  background-size: 16px 12px, calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-select.is-valid {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
}

.form-select.is-invalid {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
}

.form-check {
  display: flex;
  min-height: 1.5rem;
  margin-bottom: 0.125rem;
  align-items: center;
}

.form-check-input {
  width: 1em;
  height: 1em;
  margin-top: 0.25em;
  margin-right: 0.5rem;
  vertical-align: top;
  background-color: #fff;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: 1px solid rgba(0, 0, 0, 0.25);
  appearance: none;
}

.form-check-input[type="checkbox"] {
  border-radius: 0.25em;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input:checked[type="checkbox"] {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.form-check-input.is-valid {
  border-color: #198754;
}

.form-check-input.is-valid:checked {
  background-color: #198754;
}

.form-check-input.is-invalid {
  border-color: #dc3545;
}

.valid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #198754;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.btn {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  color: #fff;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: #0d6efd;
  border: 1px solid #0d6efd;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
              border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.validated-form {
  max-width: 500px;
  margin: 0 auto;
}`
      }
    ];
  }
  
  /**
   * Initialize Form Validation example
   */
  function initFormValidationExample() {
    // Not implemented for this demo
  }
  
  /**
   * Get Data Visualization implementation HTML
   * @returns {string} Implementation HTML
   */
  function getDataVisualizationImpl() {
    return `
      <div class="data-visualization-demo">
        <p>This example demonstrates interactive data visualization.</p>
        <p>You can create your own data visualizations using the code examples provided.</p>
      </div>
    `;
  }
  
  /**
   * Get Data Visualization code examples
   * @returns {Array} Code examples
   */
  function getDataVisualizationCodeExamples() {
    return [
      {
        id: 'dataviz-html',
        label: 'HTML',
        language: 'html',
        code: `<!-- Data Visualization Container -->
<div class="data-viz-container">
  <div class="viz-toolbar">
    <div class="viz-options">
      <label for="chart-type">Chart Type:</label>
      <select id="chart-type" class="chart-select">
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
        <option value="pie">Pie Chart</option>
        <option value="doughnut">Doughnut Chart</option>
      </select>
      
      <label for="data-filter">Filter:</label>
      <select id="data-filter" class="filter-select">
        <option value="all">All Data</option>
        <option value="year">Last Year</option>
        <option value="quarter">Last Quarter</option>
        <option value="month">Last Month</option>
      </select>
    </div>
    
    <div class="viz-actions">
      <button id="refresh-data-btn" class="btn btn-primary">
        <i class="fas fa-sync-alt"></i> Refresh Data
      </button>
    </div>
  </div>
  
  <div class="chart-container">
    <canvas id="data-chart"></canvas>
  </div>
  
  <div class="viz-insights">
    <h3>Insights</h3>
    <ul id="data-insights" class="insights-list">
      <!-- Insights will be added here -->
    </ul>
  </div>
</div>`
      },
      {
        id: 'dataviz-js',
        label: 'JavaScript',
        language: 'javascript',
        code: `/**
 * Data Visualization Module
 * A module for creating interactive data visualizations
 */
const DataVisualizer = (function() {
  'use strict';
  
  // Chart instances
  const charts = new Map();
  
  // Sample data (replace with your own data)
  const sampleData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 18000, 21000, 23000, 25000, 24000, 27000, 29000, 32000, 35000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: [10000, 12000, 11000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2
      },
      {
        label: 'Profit',
        data: [2000, 7000, 4000, 5000, 7000, 8000, 9000, 7000, 9000, 10000, 12000, 14000],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      }
    ]
  };
  
  /**
 * Initialize a chart
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Object} options - Chart options
 * @returns {Object} Chart controller
 */
function initChart(container, options = {}) {
  // Get container element if string was provided
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  // Return null if container not found
  if (!container) {
    console.error('Data Visualizer: Container not found');
    return null;
  }
  
  // Generate unique ID for this chart
  const chartId = 'chart-' + Date.now().toString(36);
  
  // Default options
  const defaults = {
    type: 'bar',
    data: { ...sampleData }, // Create a deep copy
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      },
      legend: {
        position: 'top'
      }
    }
  };
  
  // Merge options with defaults
  const chartOptions = mergeDeep(defaults, options);
  
  // Create chart instance
  const chartInstance = new Chart(container, chartOptions);
  
  // Create chart controller
  const controller = {
    id: chartId,
    instance: chartInstance,
    options: chartOptions,
    update: (data) => updateChart(chartId, data),
    changeType: (type) => changeChartType(chartId, type),
    destroy: () => destroyChart(chartId),
    generateInsights: () => generateInsights(chartId)
  };
  
  // Add to charts registry
  charts.set(chartId, controller);
  
  return controller;
}

/**
 * Update chart data
 * @param {string} chartId - Chart ID
 * @param {Object} data - New data
 */
function updateChart(chartId, data) {
  const chart = charts.get(chartId);
  if (!chart) return;
  
  // Update chart data
  chart.instance.data = data;
  
  // Update chart
  chart.instance.update();
}

/**
 * Change chart type
 * @param {string} chartId - Chart ID
 * @param {string} type - New chart type
 */
function changeChartType(chartId, type) {
  const chart = charts.get(chartId);
  if (!chart) return;
  
  // Update chart type
  chart.instance.config.type = type;
  
  // Update chart
  chart.instance.update();
}

/**
 * Destroy a chart
 * @param {string} chartId - Chart ID
 */
function destroyChart(chartId) {
  const chart = charts.get(chartId);
  if (!chart) return;
  
  // Destroy chart instance
  chart.instance.destroy();
  
  // Remove from registry
  charts.delete(chartId);
}

/**
 * Generate insights from chart data
 * @param {string} chartId - Chart ID
 * @returns {Array} Array of insight objects
 */
function generateInsights(chartId) {
  const chart = charts.get(chartId);
  if (!chart) return [];
  
  const data = chart.instance.data;
  const insights = [];
  
  // Calculate max value and its position
  const maxValues = data.datasets.map(dataset => {
    const max = Math.max(...dataset.data);
    const maxIndex = dataset.data.indexOf(max);
    
    return {
      label: dataset.label,
      value: max,
      period: data.labels[maxIndex],
      color: dataset.borderColor
    };
  });
  
  // Add max value insights
  maxValues.forEach(maxVal => {
    insights.push({
      type: 'max',
      text: \`${maxVal.label} peaked at $\${maxVal.value.toLocaleString()} in ${maxVal.period}\`,
      color: maxVal.color
    });
  });
  
  // Calculate growth rates
  data.datasets.forEach(dataset => {
    const firstValue = dataset.data[0];
    const lastValue = dataset.data[dataset.data.length - 1];
    
    if (firstValue > 0) {
      const growthRate = ((lastValue - firstValue) / firstValue) * 100;
      
      insights.push({
        type: 'growth',
        text: \`${dataset.label} ${growthRate >= 0 ? 'grew' : 'declined'} by \${Math.abs(growthRate).toFixed(1)}% from ${data.labels[0]} to ${data.labels[dataset.data.length - 1]}\`,
        color: dataset.borderColor
      });
    }
  });
  
  // Calculate correlations between datasets
  if (data.datasets.length >= 2) {
    for (let i = 0; i < data.datasets.length - 1; i++) {
      for (let j = i + 1; j < data.datasets.length; j++) {
        const correlation = calculateCorrelation(
          data.datasets[i].data,
          data.datasets[j].data
        );
        
        const correlationStrength = getCorrelationStrength(correlation);
        
        if (correlationStrength !== 'weak') {
          insights.push({
            type: 'correlation',
            text: \`${data.datasets[i].label} and ${data.datasets[j].label} have a ${correlationStrength} ${correlation > 0 ? 'positive' : 'negative'} correlation\`,
            color: '#6c757d'
          });
        }
      }
    }
  }
  
  return insights;
}

/**
 * Calculate Pearson correlation coefficient
 * @param {Array} data1 - First dataset
 * @param {Array} data2 - Second dataset
 * @returns {number} Correlation coefficient
 */
function calculateCorrelation(data1, data2) {
  // Check if arrays have same length
  if (data1.length !== data2.length) {
    return 0;
  }
  
  // Calculate means
  const mean1 = data1.reduce((a, b) => a + b, 0) / data1.length;
  const mean2 = data2.reduce((a, b) => a + b, 0) / data2.length;
  
  // Calculate numerator and denominators
  let num = 0;
  let den1 = 0;
  let den2 = 0;
  
  for (let i = 0; i < data1.length; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    
    num += diff1 * diff2;
    den1 += diff1 * diff1;
    den2 += diff2 * diff2;
  }
  
  // Calculate correlation
  if (den1 === 0 || den2 === 0) {
    return 0;
  }
  
  return num / Math.sqrt(den1 * den2);
}

/**
 * Get correlation strength
 * @param {number} correlation - Correlation coefficient
 * @returns {string} Correlation strength
 */
function getCorrelationStrength(correlation) {
  const absCorr = Math.abs(correlation);
  
  if (absCorr >= 0.7) {
    return 'strong';
  } else if (absCorr >= 0.5) {
    return 'moderate';
  } else {
    return 'weak';
  }
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} Whether the value is an object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Public API
return {
  initChart,
  updateChart,
  changeChartType,
  destroyChart,
  generateInsights,
  getAllCharts: () => Array.from(charts.values())
};
})();

// Initialize data visualization
document.addEventListener('DOMContentLoaded', function() {
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Data Visualizer: Chart.js is required');
    return;
  }
  
  // Get chart container
  const chartContainer = document.getElementById('data-chart');
  if (!chartContainer) return;
  
  // Initialize chart
  const chart = DataVisualizer.initChart(chartContainer);
  
  // Add chart type change handler
  const chartTypeSelect = document.getElementById('chart-type');
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', function() {
      chart.changeType(this.value);
      
      // Update insights
      updateInsights(chart);
    });
  }
  
  // Add data filter handler
  const dataFilterSelect = document.getElementById('data-filter');
  if (dataFilterSelect) {
    dataFilterSelect.addEventListener('change', function() {
      const filter = this.value;
      const filteredData = filterData(filter);
      
      chart.update(filteredData);
      
      // Update insights
      updateInsights(chart);
    });
  }
  
  // Add refresh data handler
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      const randomizedData = randomizeData();
      
      chart.update(randomizedData);
      
      // Update insights
      updateInsights(chart);
    });
  }
  
  // Initialize insights
  updateInsights(chart);
  
  /**
   * Update insights
   * @param {Object} chart - Chart controller
   */
  function updateInsights(chart) {
    const insights = chart.generateInsights();
    const insightsList = document.getElementById('data-insights');
    
    if (!insightsList) return;
    
    // Clear insights list
    insightsList.innerHTML = '';
    
    // Add insights
    insights.forEach(insight => {
      const insightItem = document.createElement('li');
      insightItem.className = 'insight-item';
      insightItem.style.borderLeftColor = insight.color;
      insightItem.textContent = insight.text;
      
      insightsList.appendChild(insightItem);
    });
  }
  
  /**
   * Filter data
   * @param {string} filter - Filter type
   * @returns {Object} Filtered data
   */
  function filterData(filter) {
    const data = chart.instance.data;
    const filteredData = JSON.parse(JSON.stringify(data)); // Deep clone
    
    switch (filter) {
      case 'year':
        // Use all data
        break;
      case 'quarter':
        // Use last quarter (3 months)
        filteredData.labels = filteredData.labels.slice(-3);
        filteredData.datasets.forEach(dataset => {
          dataset.data = dataset.data.slice(-3);
        });
        break;
      case 'month':
        // Use last month
        filteredData.labels = filteredData.labels.slice(-1);
        filteredData.datasets.forEach(dataset => {
          dataset.data = dataset.data.slice(-1);
        });
        break;
      default:
        // Use all data
        break;
    }
    
    return filteredData;
  }
  
  /**
   * Randomize data
   * @returns {Object} Randomized data
   */
  function randomizeData() {
    const data = chart.instance.data;
    const randomizedData = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Randomize data
    randomizedData.datasets.forEach(dataset => {
      dataset.data = dataset.data.map(value => {
        // Randomize by +/- 20%
        const change = value * (0.8 + Math.random() * 0.4);
        return Math.round(change);
      });
    });
    
    return randomizedData;
  }
});`
      },
      {
        id: 'dataviz-css',
        label: 'CSS',
        language: 'css',
        code: `/* Data Visualization Styles */
.data-viz-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.viz-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.viz-options {
  display: flex;
  align-items: center;
  gap: 15px;
}

.viz-options label {
  margin: 0;
  font-size: 0.9rem;
}

.chart-select, .filter-select {
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.9rem;
}

.chart-container {
  height: 400px;
  position: relative;
  margin-bottom: 20px;
}

.viz-insights {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px 20px;
}

.viz-insights h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-item {
  margin-bottom: 10px;
  padding-left: 15px;
  border-left: 3px solid #6c757d;
  line-height: 1.5;
  font-size: 0.95rem;
}

.insight-item:last-child {
  margin-bottom: 0;
}`
      }
    ];
  }
  
  /**
   * Initialize Data Visualization example
   */
  function initDataVisualizationExample() {
    // Not implemented for this demo
  }
  
  /**
   * Get example by ID
   * @param {string} id - Example ID
   * @returns {Object|null} Example object or null if not found
   */
  function getExampleById(id) {
    return _examples.find(example => example.id === id) || null;
  }
  
  /**
   * Escape HTML special characters
   * @param {string} html - HTML string to escape
   * @returns {string} Escaped HTML string
   */
  function escapeHtml(html) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return String(html).replace(/[&<>"'`=\/]/g, s => entityMap[s]);
  }
  
  /**
   * Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Toggle panel visibility
   */
  function togglePanel() {
    if (!_panel) {
      createPanel();
    }
    
    _panelVisible = !_panelVisible;
    
    if (_panelVisible) {
      _panel.classList.remove('hidden');
    } else {
      _panel.classList.add('hidden');
      
      // Stop rainbow preview if active
      stopRainbowPreview();
    }
    
    return _panelVisible;
  }
  
  // Public API
  return {
    initialize,
    togglePanel,
    getExamples: () => _examples,
    getExample: getExampleById,
    isInitialized: () => _initialized,
    isPanelVisible: () => _panelVisible
  };
})();

// Auto-initialize on DOM ready if not using module framework
document.addEventListener('DOMContentLoaded', function() {
  if (!window.ModuleFramework) {
    ImplementationExample.initialize();
  }
});

// Add ImplementationExample to global scope
window.ImplementationExample = ImplementationExample;

// Add implementation example styles
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Implementation Example Styles */
    .implementation-panel {
      width: 90% !important;
      height: 90% !important;
      max-width: 1400px !important;
    }
    
    .implementation-container {
      display: flex;
      width: 100%;
      height: 100%;
    }
    
    .implementation-sidebar {
      width: 260px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      overflow-y: auto;
      padding-right: 15px;
    }
    
    .implementation-content {
      flex: 1;
      overflow: auto;
      padding-left: 15px;
    }
    
    .examples-list {
      margin-bottom: 20px;
    }
    
    .examples-list h3 {
      font-size: 1.1rem;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .example-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .example-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }
    
    .example-item.active {
      background-color: rgba(13, 110, 253, 0.15);
      border-left: 3px solid rgba(13, 110, 253, 0.8);
    }
    
    .example-name {
      font-size: 0.95rem;
      font-weight: 500;
    }
    
    .example-complexity {
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 12px;
    }
    
    .example-complexity.beginner {
      background-color: rgba(25, 135, 84, 0.2);
      color: rgba(25, 135, 84, 0.9);
    }
    
    .example-complexity.intermediate {
      background-color: rgba(255, 193, 7, 0.2);
      color: rgba(255, 193, 7, 0.9);
    }
    
    .example-complexity.advanced {
      background-color: rgba(220, 53, 69, 0.2);
      color: rgba(220, 53, 69, 0.9);
    }
    
    .example-details {
      padding: 10px 0;
    }
    
    .example-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .example-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .example-tag {
      font-size: 0.8rem;
      padding: 4px 10px;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .example-description {
      margin-bottom: 25px;
    }
    
    .features-list {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 15px 20px;
      margin-top: 15px;
    }
    
    .features-list h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1rem;
    }
    
    .features-list ul {
      padding-left: 20px;
      margin: 0;
    }
    
    .features-list li {
      margin-bottom: 5px;
    }
    
    .implementation-section, .code-examples-section {
      margin-bottom: 30px;
    }
    
    .implementation-section h3, .code-examples-section h3 {
      font-size: 1.2rem;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .code-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 15px;
    }
    
    .code-tab {
      background: rgba(255, 255, 255, 0.05);
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .code-tab:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .code-tab.active {
      background: rgba(13, 110, 253, 0.3);
      color: rgba(255, 255, 255, 1);
    }
    
    .code-panels {
      position: relative;
    }
    
    .code-panel {
      display: none;
      position: relative;
    }
    
    .code-panel.active {
      display: block;
    }
    
    .code-panel pre {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 15px;
      margin: 0;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .copy-code-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .copy-code-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .copy-code-btn.success {
      background-color: rgba(25, 135, 84, 0.5);
    }
    
    .copy-code-btn.error {
      background-color: rgba(220, 53, 69, 0.5);
    }
    
    /* Rainbow Border Demo */
    .rainbow-border-demo {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .demo-controls {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .control-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .control-group label {
      width: 120px;
      font-size: 0.9rem;
    }
    
    .control-group .form-range {
      flex: 1;
    }
    
    .control-group .form-select {
      flex: 1;
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 10px;
      border-radius: 4px;
    }
    
    .range-value {
      width: 40px;
      text-align: right;
      font-size: 0.9rem;
    }
    
    .control-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    .demo-preview {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .preview-container {
      width: 80%;
      height: 200px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .preview-content {
      text-align: center;
    }
    
    .preview-content h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }
    
    /* Drag and Drop Demo */
    .drag-drop-demo {
      padding: 20px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    /* Theme Switcher Demo */
    .theme-switcher-demo {
      padding: 20px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    /* Form Validation Demo */
    .form-validation-demo {
      padding: 20px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    /* Data Visualization Demo */
    .data-visualization-demo {
      padding: 20px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    /* Bootstrap-like classes */
    .btn {
      display: inline-block;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      border-radius: 0.25rem;
      transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
                border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .btn-primary {
      color: #fff;
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    
    .btn-primary:hover {
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }
    
    .btn-secondary {
      color: #fff;
      background-color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-secondary:hover {
      background-color: #5c636a;
      border-color: #565e64;
    }
    
    .btn:disabled {
      opacity: 0.65;
      pointer-events: none;
    }
    
    .form-range {
      width: 100%;
      height: 1.5rem;
      padding: 0;
      background-color: transparent;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    
    .form-range:focus {
      outline: 0;
    }
    
    .form-range::-webkit-slider-thumb {
      width: 1rem;
      height: 1rem;
      margin-top: -0.25rem;
      background-color: #0d6efd;
      border: 0;
      border-radius: 1rem;
      -webkit-appearance: none;
      appearance: none;
    }
    
    .form-range::-webkit-slider-runnable-track {
      width: 100%;
      height: 0.5rem;
      color: transparent;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.1);
      border-color: transparent;
      border-radius: 1rem;
    }
    
    .hidden {
      display: none !important;
    }
  `;
  
  document.head.appendChild(style);
})();