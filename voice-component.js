/**
 * PHP-WASM Voice Component
 * 
 * A reusable component that adds voice control functionality to PHP-WASM applications
 */

class VoiceComponent {
  /**
   * Create a new voice component
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      containerId: options.containerId || 'voice-component',
      language: options.language || 'en-US',
      continuous: options.continuous !== false,
      interimResults: options.interimResults === true,
      maxAlternatives: options.maxAlternatives || 1,
      autoStart: options.autoStart === true,
      commands: options.commands || {},
      customActions: options.customActions || {},
      customResponsePreProcessor: options.customResponsePreProcessor,
      customTriggerPhrase: options.customTriggerPhrase,
      showTranscript: options.showTranscript !== false,
      useAnimation: options.useAnimation !== false,
      displayMode: options.displayMode || 'button', // 'button', 'bar', 'icon'
      position: options.position || 'bottom-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'
      theme: options.theme || 'light', // 'light', 'dark', 'auto'
      iconMode: options.iconMode || 'microphone', // 'microphone', 'assistant', 'circle', 'custom'
      customIcon: options.customIcon,
      voiceFeedback: options.voiceFeedback !== false,
      confidenceThreshold: options.confidenceThreshold || 0.6,
      inactivityTimeout: options.inactivityTimeout || 10000, // ms
      // TTS options
      tts: {
        enabled: options.tts?.enabled !== false,
        voice: options.tts?.voice,
        rate: options.tts?.rate || 1.0,
        pitch: options.tts?.pitch || 1.0,
        volume: options.tts?.volume || 1.0
      },
      // Animation options
      animation: {
        type: options.animation?.type || 'wave', // 'wave', 'pulse', 'bars', 'circle'
        color: options.animation?.color || '#3498db',
        size: options.animation?.size || 'medium', // 'small', 'medium', 'large'
        speed: options.animation?.speed || 'normal' // 'slow', 'normal', 'fast'
      },
      // Appearance
      styles: options.styles || {},
      classes: options.classes || {},
      translations: options.translations || {}
    };

    // Internal state
    this.state = {
      isInitialized: false,
      isListening: false,
      isSpeaking: false,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      lastCommand: null,
      commandHistory: [],
      activeRequests: 0,
      processingCommand: false,
      supportsSpeechRecognition: false,
      supportsSpeechSynthesis: false
    };

    // Speech recognition
    this.recognition = null;
    
    // Speech synthesis
    this.speechSynthesis = window.speechSynthesis;
    this.speechUtterance = null;
    
    // DOM elements
    this.elements = {
      container: null,
      button: null,
      animationContainer: null,
      statusIndicator: null,
      transcriptDisplay: null
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the voice component
   */
  init() {
    // Check browser support
    this.checkBrowserSupport();
    
    if (!this.state.supportsSpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }
    
    // Initialize speech recognition
    this.initSpeechRecognition();
    
    // Initialize speech synthesis if supported
    if (this.state.supportsSpeechSynthesis) {
      this.initSpeechSynthesis();
    }
    
    // Create UI
    this.createUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Mark as initialized
    this.state.isInitialized = true;
    
    // Start automatically if configured
    if (this.options.autoStart) {
      this.start();
    }
  }
  
  /**
   * Check browser support for speech APIs
   */
  checkBrowserSupport() {
    // Check for speech recognition
    this.state.supportsSpeechRecognition = 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    
    // Check for speech synthesis
    this.state.supportsSpeechSynthesis = 'speechSynthesis' in window;
  }
  
  /**
   * Initialize speech recognition
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;
    
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;
    this.recognition.lang = this.options.language;
    
    // Set up recognition events
    this.recognition.onstart = () => {
      this.state.isListening = true;
      this.updateUI();
      
      // Dispatch event
      this.dispatchEvent('start');
    };
    
    this.recognition.onend = () => {
      this.state.isListening = false;
      this.updateUI();
      
      // Restart if continuous is enabled and not manually stopped
      if (this.options.continuous && this.state.isInitialized && !this.state.isManuallyStopped) {
        this.recognition.start();
      }
      
      // Dispatch event
      this.dispatchEvent('end');
    };
    
    this.recognition.onresult = (event) => {
      // Get the latest result
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      
      // Update state
      if (isFinal) {
        this.state.transcript = transcript;
        this.state.interimTranscript = '';
      } else {
        this.state.interimTranscript = transcript;
      }
      
      this.state.confidence = confidence;
      
      // Update UI
      this.updateTranscript();
      
      // Process command if final
      if (isFinal && confidence >= this.options.confidenceThreshold) {
        this.processVoiceInput(transcript, confidence);
      }
      
      // Dispatch event
      this.dispatchEvent('result', { 
        transcript, 
        confidence, 
        isFinal 
      });
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Update UI
      this.showStatus('error', `Error: ${event.error}`);
      
      // Dispatch event
      this.dispatchEvent('error', { error: event.error });
      
      // Restart if not aborted
      if (event.error !== 'aborted' && this.state.isListening) {
        setTimeout(() => {
          this.restart();
        }, 1000);
      }
    };
  }
  
  /**
   * Initialize speech synthesis
   */
  initSpeechSynthesis() {
    if (!this.state.supportsSpeechSynthesis) return;
    
    // Set up voice when voices are available
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        this.selectVoice();
      });
    } else {
      this.selectVoice();
    }
  }
  
  /**
   * Select a voice for speech synthesis
   */
  selectVoice() {
    const voices = speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      console.warn('No voices available for speech synthesis');
      return;
    }
    
    // If voice is specified by name, try to find it
    if (typeof this.options.tts.voice === 'string') {
      const matchingVoice = voices.find(v => 
        v.name.toLowerCase().includes(this.options.tts.voice.toLowerCase())
      );
      
      if (matchingVoice) {
        this.options.tts.voice = matchingVoice;
        return;
      }
    }
    
    // If voice is not found or not specified, use a default voice
    // Prefer a voice in the specified language
    const langVoices = voices.filter(v => v.lang.startsWith(this.options.language.split('-')[0]));
    
    if (langVoices.length > 0) {
      this.options.tts.voice = langVoices[0];
    } else {
      // Use the first available voice
      this.options.tts.voice = voices[0];
    }
  }
  
  /**
   * Create the UI elements
   */
  createUI() {
    // Find or create container
    let container = document.getElementById(this.options.containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this.options.containerId;
      document.body.appendChild(container);
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Set container styles based on position
    const positionStyles = {
      'top-right': 'position: fixed; top: 20px; right: 20px;',
      'top-left': 'position: fixed; top: 20px; left: 20px;',
      'bottom-right': 'position: fixed; bottom: 20px; right: 20px;',
      'bottom-left': 'position: fixed; bottom: 20px; left: 20px;',
      'center': 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);'
    };
    
    // Apply base styles
    container.style.cssText = `
      z-index: 9999;
      ${positionStyles[this.options.position] || positionStyles['bottom-right']}
      ${this.options.styles.container || ''}
    `;
    
    // Apply theme
    container.classList.add(`voice-component-${this.options.theme}`);
    
    if (this.options.classes.container) {
      container.classList.add(this.options.classes.container);
    }
    
    // Create UI based on display mode
    switch (this.options.displayMode) {
      case 'button':
        this.createButtonUI(container);
        break;
      case 'bar':
        this.createBarUI(container);
        break;
      case 'icon':
        this.createIconUI(container);
        break;
      default:
        this.createButtonUI(container);
    }
    
    // Store container reference
    this.elements.container = container;
    
    // Add styles
    this.addStyles();
  }
  
  /**
   * Create button UI
   * @param {HTMLElement} container - The container element
   */
  createButtonUI(container) {
    // Create button
    const button = document.createElement('button');
    button.className = 'voice-component-button';
    button.setAttribute('aria-label', this.translate('activateVoice'));
    
    // Add icon
    button.innerHTML = this.getIconSVG();
    
    // Add status indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'voice-component-status';
    button.appendChild(statusIndicator);
    
    // Add to container
    container.appendChild(button);
    
    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'voice-component-animation';
    container.appendChild(animationContainer);
    
    // Create transcript display if enabled
    if (this.options.showTranscript) {
      const transcriptDisplay = document.createElement('div');
      transcriptDisplay.className = 'voice-component-transcript';
      container.appendChild(transcriptDisplay);
      this.elements.transcriptDisplay = transcriptDisplay;
    }
    
    // Store element references
    this.elements.button = button;
    this.elements.statusIndicator = statusIndicator;
    this.elements.animationContainer = animationContainer;
  }
  
  /**
   * Create bar UI
   * @param {HTMLElement} container - The container element
   */
  createBarUI(container) {
    // Create bar container
    const bar = document.createElement('div');
    bar.className = 'voice-component-bar';
    
    // Create button
    const button = document.createElement('button');
    button.className = 'voice-component-bar-button';
    button.setAttribute('aria-label', this.translate('activateVoice'));
    
    // Add icon
    button.innerHTML = this.getIconSVG();
    
    // Add status indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'voice-component-status';
    button.appendChild(statusIndicator);
    
    // Add to bar
    bar.appendChild(button);
    
    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'voice-component-animation';
    bar.appendChild(animationContainer);
    
    // Create transcript display
    const transcriptDisplay = document.createElement('div');
    transcriptDisplay.className = 'voice-component-transcript';
    bar.appendChild(transcriptDisplay);
    
    // Add to container
    container.appendChild(bar);
    
    // Store element references
    this.elements.button = button;
    this.elements.statusIndicator = statusIndicator;
    this.elements.animationContainer = animationContainer;
    this.elements.transcriptDisplay = transcriptDisplay;
  }
  
  /**
   * Create icon UI
   * @param {HTMLElement} container - The container element
   */
  createIconUI(container) {
    // Create icon button
    const button = document.createElement('button');
    button.className = 'voice-component-icon';
    button.setAttribute('aria-label', this.translate('activateVoice'));
    
    // Add icon
    button.innerHTML = this.getIconSVG();
    
    // Add status indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'voice-component-status';
    button.appendChild(statusIndicator);
    
    // Add to container
    container.appendChild(button);
    
    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'voice-component-animation';
    container.appendChild(animationContainer);
    
    // Create transcript display if enabled
    if (this.options.showTranscript) {
      const transcriptDisplay = document.createElement('div');
      transcriptDisplay.className = 'voice-component-transcript voice-component-transcript-popup';
      container.appendChild(transcriptDisplay);
      this.elements.transcriptDisplay = transcriptDisplay;
    }
    
    // Store element references
    this.elements.button = button;
    this.elements.statusIndicator = statusIndicator;
    this.elements.animationContainer = animationContainer;
  }
  
  /**
   * Get the icon SVG based on the icon mode
   * @returns {string} - The icon SVG
   */
  getIconSVG() {
    switch (this.options.iconMode) {
      case 'microphone':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        `;
      case 'assistant':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
          </svg>
        `;
      case 'circle':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        `;
      case 'custom':
        return this.options.customIcon || this.getIconSVG('microphone');
      default:
        return this.getIconSVG('microphone');
    }
  }
  
  /**
   * Add CSS styles to the document
   */
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('voice-component-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'voice-component-styles';
    
    // Set animation speed
    let animationSpeed = '1s';
    switch (this.options.animation.speed) {
      case 'slow':
        animationSpeed = '2s';
        break;
      case 'fast':
        animationSpeed = '0.5s';
        break;
    }
    
    // Set animation size
    let animationSize = '50px';
    switch (this.options.animation.size) {
      case 'small':
        animationSize = '30px';
        break;
      case 'large':
        animationSize = '70px';
        break;
    }
    
    // Add base styles
    style.textContent = `
      /* Base styles */
      .voice-component-light {
        --voice-primary-color: ${this.options.animation.color};
        --voice-text-color: #333;
        --voice-bg-color: #fff;
        --voice-border-color: #ddd;
        --voice-shadow-color: rgba(0, 0, 0, 0.1);
      }
      
      .voice-component-dark {
        --voice-primary-color: ${this.options.animation.color};
        --voice-text-color: #fff;
        --voice-bg-color: #333;
        --voice-border-color: #555;
        --voice-shadow-color: rgba(0, 0, 0, 0.3);
      }
      
      @media (prefers-color-scheme: dark) {
        .voice-component-auto {
          --voice-primary-color: ${this.options.animation.color};
          --voice-text-color: #fff;
          --voice-bg-color: #333;
          --voice-border-color: #555;
          --voice-shadow-color: rgba(0, 0, 0, 0.3);
        }
      }
      
      @media (prefers-color-scheme: light) {
        .voice-component-auto {
          --voice-primary-color: ${this.options.animation.color};
          --voice-text-color: #333;
          --voice-bg-color: #fff;
          --voice-border-color: #ddd;
          --voice-shadow-color: rgba(0, 0, 0, 0.1);
        }
      }
      
      /* Button styles */
      .voice-component-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: var(--voice-bg-color);
        color: var(--voice-text-color);
        border: 1px solid var(--voice-border-color);
        box-shadow: 0 2px 5px var(--voice-shadow-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        padding: 0;
      }
      
      .voice-component-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px var(--voice-shadow-color);
      }
      
      .voice-component-button:active {
        transform: scale(0.95);
      }
      
      .voice-component-button svg {
        width: 24px;
        height: 24px;
        transition: all 0.3s ease;
      }
      
      .voice-component-button.listening {
        background-color: var(--voice-primary-color);
        color: white;
      }
      
      /* Icon styles */
      .voice-component-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--voice-bg-color);
        color: var(--voice-text-color);
        border: 1px solid var(--voice-border-color);
        box-shadow: 0 2px 5px var(--voice-shadow-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        padding: 0;
      }
      
      .voice-component-icon:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px var(--voice-shadow-color);
      }
      
      .voice-component-icon.listening {
        background-color: var(--voice-primary-color);
        color: white;
      }
      
      .voice-component-icon svg {
        width: 20px;
        height: 20px;
      }
      
      /* Bar styles */
      .voice-component-bar {
        display: flex;
        align-items: center;
        background-color: var(--voice-bg-color);
        border: 1px solid var(--voice-border-color);
        border-radius: 24px;
        box-shadow: 0 2px 5px var(--voice-shadow-color);
        padding: 6px;
        min-width: 200px;
        transition: all 0.3s ease;
      }
      
      .voice-component-bar-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--voice-bg-color);
        color: var(--voice-text-color);
        border: 1px solid var(--voice-border-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        padding: 0;
        flex-shrink: 0;
      }
      
      .voice-component-bar-button.listening {
        background-color: var(--voice-primary-color);
        color: white;
      }
      
      .voice-component-bar-button svg {
        width: 18px;
        height: 18px;
      }
      
      /* Status indicator */
      .voice-component-status {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ccc;
        transition: background-color 0.3s ease;
      }
      
      .listening .voice-component-status {
        background-color: #4CAF50;
      }
      
      .processing .voice-component-status {
        background-color: #FFC107;
      }
      
      .error .voice-component-status {
        background-color: #F44336;
      }
      
      /* Transcript display */
      .voice-component-transcript {
        margin-top: 10px;
        padding: 8px 12px;
        background-color: var(--voice-bg-color);
        color: var(--voice-text-color);
        border-radius: 8px;
        border: 1px solid var(--voice-border-color);
        box-shadow: 0 2px 5px var(--voice-shadow-color);
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        transition: all 0.3s ease;
        opacity: 0;
      }
      
      .voice-component-transcript.active {
        opacity: 1;
      }
      
      .voice-component-transcript-popup {
        position: absolute;
        bottom: 50px;
        right: 0;
        min-width: 200px;
      }
      
      /* Animation container */
      .voice-component-animation {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${animationSize};
        height: ${animationSize};
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .voice-component-animation.active {
        opacity: 1;
      }
      
      /* Wave animation */
      .voice-component-animation.wave .wave {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: var(--voice-primary-color);
        opacity: 0;
        animation: wave-animation ${animationSpeed} infinite ease-out;
      }
      
      .voice-component-animation.wave .wave:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .voice-component-animation.wave .wave:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes wave-animation {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        70% {
          opacity: 0.2;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }
      }
      
      /* Pulse animation */
      .voice-component-animation.pulse .pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid var(--voice-primary-color);
        opacity: 0;
        animation: pulse-animation ${animationSpeed} infinite ease-out;
      }
      
      @keyframes pulse-animation {
        0% {
          transform: translate(-50%, -50%) scale(0.3);
          opacity: 1;
        }
        70% {
          opacity: 0.3;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }
      }
      
      /* Bars animation */
      .voice-component-animation.bars {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2px;
      }
      
      .voice-component-animation.bars .bar {
        width: 3px;
        height: 16px;
        background-color: var(--voice-primary-color);
        border-radius: 3px;
        animation: bars-animation ${animationSpeed} infinite ease-in-out;
      }
      
      .voice-component-animation.bars .bar:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .voice-component-animation.bars .bar:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      .voice-component-animation.bars .bar:nth-child(4) {
        animation-delay: 0.6s;
      }
      
      .voice-component-animation.bars .bar:nth-child(5) {
        animation-delay: 0.8s;
      }
      
      @keyframes bars-animation {
        0%, 100% {
          height: 4px;
        }
        50% {
          height: 16px;
        }
      }
      
      /* Circle animation */
      .voice-component-animation.circle .circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50%;
        height: 50%;
        border-radius: 50%;
        background-color: var(--voice-primary-color);
        animation: circle-animation ${animationSpeed} infinite ease-in-out;
      }
      
      @keyframes circle-animation {
        0%, 100% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0.2;
        }
        50% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.8;
        }
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Button click event
    if (this.elements.button) {
      this.elements.button.addEventListener('click', () => {
        if (this.state.isListening) {
          this.stop();
        } else {
          this.start();
        }
      });
    }
    
    // Add global listener for custom trigger phrase if provided
    if (this.options.customTriggerPhrase && this.options.continuous) {
      this.recognition.addEventListener('result', (event) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript.trim().toLowerCase();
        
        if (transcript.includes(this.options.customTriggerPhrase.toLowerCase())) {
          // Highlight that the trigger was recognized
          this.showStatus('success', 'Trigger phrase recognized');
          
          // Dispatch trigger event
          this.dispatchEvent('trigger', { transcript });
        }
      });
    }
    
    // Set up inactivity timeout if specified
    if (this.options.inactivityTimeout > 0) {
      let inactivityTimer;
      
      // Reset timer on recognition result
      this.recognition.addEventListener('result', () => {
        clearTimeout(inactivityTimer);
        
        // Set new timer
        inactivityTimer = setTimeout(() => {
          if (this.state.isListening && !this.state.isSpeaking) {
            this.speak(this.translate('inactivityTimeout'));
            this.stop();
          }
        }, this.options.inactivityTimeout);
      });
      
      // Clear timer on stop
      this.recognition.addEventListener('end', () => {
        clearTimeout(inactivityTimer);
      });
    }
  }
  
  /**
   * Update the UI based on the current state
   */
  updateUI() {
    if (!this.elements.button) return;
    
    // Update button state
    if (this.state.isListening) {
      this.elements.button.classList.add('listening');
      this.elements.button.setAttribute('aria-label', this.translate('stopListening'));
      
      // Show animation if enabled
      if (this.options.useAnimation) {
        this.showAnimation();
      }
    } else {
      this.elements.button.classList.remove('listening');
      this.elements.button.setAttribute('aria-label', this.translate('startListening'));
      
      // Hide animation
      this.hideAnimation();
    }
    
    // Update status indicator
    if (this.state.processingCommand) {
      this.elements.button.classList.add('processing');
    } else {
      this.elements.button.classList.remove('processing');
    }
  }
  
  /**
   * Update the transcript display
   */
  updateTranscript() {
    if (!this.elements.transcriptDisplay || !this.options.showTranscript) return;
    
    const transcript = this.state.transcript || this.state.interimTranscript;
    
    if (transcript) {
      this.elements.transcriptDisplay.textContent = transcript;
      this.elements.transcriptDisplay.classList.add('active');
      
      // Hide transcript after a delay
      if (!this.state.isListening && !this.state.interimTranscript) {
        setTimeout(() => {
          this.elements.transcriptDisplay.classList.remove('active');
        }, 5000);
      }
    } else {
      this.elements.transcriptDisplay.classList.remove('active');
    }
  }
  
  /**
   * Show animation based on animation type
   */
  showAnimation() {
    if (!this.elements.animationContainer) return;
    
    // Clear existing animation
    this.elements.animationContainer.innerHTML = '';
    this.elements.animationContainer.className = 'voice-component-animation';
    
    // Add animation class
    this.elements.animationContainer.classList.add(this.options.animation.type);
    
    // Create animation elements based on type
    switch (this.options.animation.type) {
      case 'wave':
        for (let i = 0; i < 3; i++) {
          const wave = document.createElement('div');
          wave.className = 'wave';
          this.elements.animationContainer.appendChild(wave);
        }
        break;
      case 'pulse':
        const pulse = document.createElement('div');
        pulse.className = 'pulse';
        this.elements.animationContainer.appendChild(pulse);
        break;
      case 'bars':
        for (let i = 0; i < 5; i++) {
          const bar = document.createElement('div');
          bar.className = 'bar';
          this.elements.animationContainer.appendChild(bar);
        }
        break;
      case 'circle':
        const circle = document.createElement('div');
        circle.className = 'circle';
        this.elements.animationContainer.appendChild(circle);
        break;
    }
    
    // Show animation
    this.elements.animationContainer.classList.add('active');
  }
  
  /**
   * Hide animation
   */
  hideAnimation() {
    if (!this.elements.animationContainer) return;
    
    this.elements.animationContainer.classList.remove('active');
  }
  
  /**
   * Show status
   * @param {string} type - Status type (success, error, info)
   * @param {string} message - Status message
   */
  showStatus(type, message) {
    if (!this.elements.button) return;
    
    // Add status class
    this.elements.button.classList.remove('success', 'error', 'info');
    this.elements.button.classList.add(type);
    
    // Remove status class after a delay
    setTimeout(() => {
      this.elements.button.classList.remove(type);
    }, 2000);
    
    // Update transcript if available
    if (this.elements.transcriptDisplay && message) {
      this.elements.transcriptDisplay.textContent = message;
      this.elements.transcriptDisplay.classList.add('active');
      
      // Hide after delay
      setTimeout(() => {
        this.elements.transcriptDisplay.classList.remove('active');
      }, 3000);
    }
  }
  
  /**
   * Process voice input
   * @param {string} transcript - The voice transcript
   * @param {number} confidence - The confidence level
   */
  processVoiceInput(transcript, confidence) {
    // Skip processing if confidence is too low
    if (confidence < this.options.confidenceThreshold) {
      this.showStatus('error', this.translate('lowConfidence'));
      return;
    }
    
    // Add to command history
    this.state.commandHistory.push({
      transcript,
      confidence,
      timestamp: new Date()
    });
    
    // Limit history size
    if (this.state.commandHistory.length > 50) {
      this.state.commandHistory.shift();
    }
    
    // Pre-process the transcript if custom processor is provided
    if (typeof this.options.customResponsePreProcessor === 'function') {
      transcript = this.options.customResponsePreProcessor(transcript) || transcript;
    }
    
    // Mark as processing
    this.state.processingCommand = true;
    this.updateUI();
    
    // Check for built-in commands
    const isBuiltInCommand = this.processBuiltInCommands(transcript);
    
    if (!isBuiltInCommand) {
      // Check for custom commands
      const isCustomCommand = this.processCustomCommands(transcript);
      
      if (!isCustomCommand) {
        // No command matched
        this.showStatus('info', this.translate('noCommandMatch'));
        
        // Dispatch unrecognized event
        this.dispatchEvent('unrecognized', { transcript, confidence });
      }
    }
    
    // Mark as not processing
    this.state.processingCommand = false;
    this.updateUI();
  }
  
  /**
   * Process built-in commands
   * @param {string} transcript - The voice transcript
   * @returns {boolean} - Whether a built-in command was processed
   */
  processBuiltInCommands(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Stop command
    if (this.matchesCommand(lowerTranscript, ['stop', 'stop listening', 'exit', 'quit'])) {
      this.stop();
      return true;
    }
    
    // Help command
    if (this.matchesCommand(lowerTranscript, ['help', 'what can I say', 'commands'])) {
      this.speak(this.translate('helpMessage'));
      return true;
    }
    
    // No built-in command matched
    return false;
  }
  
  /**
   * Process custom commands
   * @param {string} transcript - The voice transcript
   * @returns {boolean} - Whether a custom command was processed
   */
  processCustomCommands(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for custom commands
    for (const commandPattern in this.options.commands) {
      // Convert command pattern to regex if it has placeholders
      if (commandPattern.includes('*')) {
        const regexPattern = '^' + 
          commandPattern.replace(/\*/g, '(.+)').replace(/\s+/g, '\\s+') + 
          '$';
        const regex = new RegExp(regexPattern, 'i');
        const match = lowerTranscript.match(regex);
        
        if (match) {
          // Extract parameters
          const params = match.slice(1);
          
          // Get command handler
          const handler = this.options.commands[commandPattern];
          
          if (typeof handler === 'function') {
            // Execute command with parameters
            handler(...params);
            
            // Update last command
            this.state.lastCommand = {
              pattern: commandPattern,
              params,
              transcript
            };
            
            // Dispatch command event
            this.dispatchEvent('command', {
              pattern: commandPattern,
              params,
              transcript
            });
            
            return true;
          }
        }
      } else if (this.matchesCommand(lowerTranscript, [commandPattern])) {
        // Simple command without placeholders
        const handler = this.options.commands[commandPattern];
        
        if (typeof handler === 'function') {
          // Execute command
          handler();
          
          // Update last command
          this.state.lastCommand = {
            pattern: commandPattern,
            transcript
          };
          
          // Dispatch command event
          this.dispatchEvent('command', {
            pattern: commandPattern,
            transcript
          });
          
          return true;
        }
      }
    }
    
    // No custom command matched
    return false;
  }
  
  /**
   * Check if transcript matches any of the command phrases
   * @param {string} transcript - The transcript to check
   * @param {Array<string>} phrases - The phrases to match
   * @returns {boolean} - Whether there's a match
   */
  matchesCommand(transcript, phrases) {
    return phrases.some(phrase => transcript.includes(phrase.toLowerCase()));
  }
  
  /**
   * Start listening for voice commands
   */
  start() {
    if (!this.state.supportsSpeechRecognition) {
      this.showStatus('error', this.translate('notSupported'));
      return;
    }
    
    if (this.state.isListening) {
      return;
    }
    
    try {
      this.recognition.start();
      this.state.isManuallyStopped = false;
      this.showStatus('success', this.translate('listening'));
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.showStatus('error', this.translate('startError'));
    }
  }
  
  /**
   * Stop listening for voice commands
   */
  stop() {
    if (!this.state.isListening) {
      return;
    }
    
    try {
      this.recognition.stop();
      this.state.isManuallyStopped = true;
      this.showStatus('info', this.translate('stopped'));
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }
  
  /**
   * Restart speech recognition
   */
  restart() {
    this.stop();
    setTimeout(() => {
      this.start();
    }, 200);
  }
  
  /**
   * Speak text using speech synthesis
   * @param {string} text - The text to speak
   * @returns {Promise} - Promise that resolves when speech is complete
   */
  speak(text) {
    if (!this.state.supportsSpeechSynthesis || !this.options.tts.enabled) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set utterance properties
      if (this.options.tts.voice) {
        utterance.voice = this.options.tts.voice;
      }
      
      utterance.volume = this.options.tts.volume;
      utterance.rate = this.options.tts.rate;
      utterance.pitch = this.options.tts.pitch;
      
      // Set up event listeners
      utterance.onstart = () => {
        this.state.isSpeaking = true;
        
        // Pause recognition while speaking
        if (this.state.isListening) {
          this.recognition.stop();
        }
      };
      
      utterance.onend = () => {
        this.state.isSpeaking = false;
        
        // Resume recognition if it was active
        if (this.state.isListening && !this.state.isManuallyStopped) {
          setTimeout(() => {
            this.recognition.start();
          }, 100);
        }
        
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        this.state.isSpeaking = false;
        
        // Resume recognition if it was active
        if (this.state.isListening && !this.state.isManuallyStopped) {
          setTimeout(() => {
            this.recognition.start();
          }, 100);
        }
        
        resolve();
      };
      
      // Speak the utterance
      speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Add a command
   * @param {string} pattern - The command pattern
   * @param {Function} handler - The command handler
   */
  addCommand(pattern, handler) {
    if (typeof pattern !== 'string' || typeof handler !== 'function') {
      console.error('Invalid command:', pattern);
      return;
    }
    
    this.options.commands[pattern] = handler;
  }
  
  /**
   * Remove a command
   * @param {string} pattern - The command pattern to remove
   * @returns {boolean} - Whether the command was removed
   */
  removeCommand(pattern) {
    if (this.options.commands.hasOwnProperty(pattern)) {
      delete this.options.commands[pattern];
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all commands
   * @returns {Object} - All registered commands
   */
  getCommands() {
    return { ...this.options.commands };
  }
  
  /**
   * Clear all commands
   */
  clearCommands() {
    this.options.commands = {};
  }
  
  /**
   * Translate a string using the translations object
   * @param {string} key - The translation key
   * @returns {string} - The translated string
   */
  translate(key) {
    // Default translations
    const defaultTranslations = {
      activateVoice: 'Activate voice control',
      startListening: 'Start listening',
      stopListening: 'Stop listening',
      listening: 'Listening...',
      stopped: 'Voice control stopped',
      notSupported: 'Speech recognition not supported in this browser',
      startError: 'Failed to start speech recognition',
      lowConfidence: 'Sorry, I didn\'t catch that',
      noCommandMatch: 'No command matched',
      inactivityTimeout: 'Voice control timed out due to inactivity',
      helpMessage: 'You can say commands like "help" or "stop listening".'
    };
    
    // Get translation or default
    return this.options.translations[key] || defaultTranslations[key] || key;
  }
  
  /**
   * Dispatch a custom event
   * @param {string} name - The event name
   * @param {Object} detail - The event detail
   */
  dispatchEvent(name, detail = {}) {
    const event = new CustomEvent(`voice:${name}`, {
      bubbles: true,
      detail: { ...detail, component: this }
    });
    
    this.elements.container.dispatchEvent(event);
  }
  
  /**
   * Get the current state
   * @returns {Object} - The current state
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Set TTS options
   * @param {Object} options - The TTS options
   */
  setTTSOptions(options) {
    this.options.tts = { ...this.options.tts, ...options };
    
    if (this.state.supportsSpeechSynthesis) {
      this.selectVoice();
    }
  }
  
  /**
   * Set animation options
   * @param {Object} options - The animation options
   */
  setAnimationOptions(options) {
    this.options.animation = { ...this.options.animation, ...options };
    
    // Update styles
    this.addStyles();
  }
  
  /**
   * Set language
   * @param {string} language - The language code (e.g., 'en-US')
   */
  setLanguage(language) {
    this.options.language = language;
    
    if (this.recognition) {
      this.recognition.lang = language;
    }
    
    if (this.state.supportsSpeechSynthesis) {
      this.selectVoice();
    }
  }
  
  /**
   * Set continuous mode
   * @param {boolean} continuous - Whether recognition should be continuous
   */
  setContinuous(continuous) {
    this.options.continuous = continuous;
    
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }
  
  /**
   * Enable or disable voice feedback
   * @param {boolean} enabled - Whether voice feedback should be enabled
   */
  enableVoiceFeedback(enabled) {
    this.options.tts.enabled = enabled;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Stop recognition
    if (this.state.isListening) {
      this.stop();
    }
    
    // Remove event listeners
    if (this.elements.button) {
      this.elements.button.removeEventListener('click', this.start);
    }
    
    // Remove container if it exists
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
    
    // Reset state
    this.state.isInitialized = false;
  }
}

/**
 * Check if speech recognition is supported
 * @returns {boolean} - Whether speech recognition is supported
 */
VoiceComponent.isSupported = function() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

/**
 * Check if speech synthesis is supported
 * @returns {boolean} - Whether speech synthesis is supported
 */
VoiceComponent.isTTSSupported = function() {
  return 'speechSynthesis' in window;
};

/**
 * Get available voices for speech synthesis
 * @returns {Array<SpeechSynthesisVoice>} - Available voices
 */
VoiceComponent.getVoices = function() {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  
  return window.speechSynthesis.getVoices();
};

// Export as a module if supported
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceComponent;
}

// Add the component to PHP component templates
if (typeof PHPComponentTemplates !== 'undefined') {
  PHPComponentTemplates.push({
    id: 'voice-assistant',
    name: 'Voice Assistant',
    description: 'Add voice control to your PHP application',
    category: 'Advanced',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`,
    template: `<div id="{{ containerId }}" class="voice-assistant-container">
  <!-- Voice assistant will be rendered here -->
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Check if VoiceComponent is loaded
    if (typeof VoiceComponent === 'undefined') {
      // Load VoiceComponent script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/voice-component/dist/voice-component.min.js';
      script.onload = initVoiceAssistant;
      document.head.appendChild(script);
    } else {
      initVoiceAssistant();
    }
    
    function initVoiceAssistant() {
      // Initialize voice assistant
      const voiceAssistant = new VoiceComponent({
        containerId: '{{ containerId }}',
        language: '{{ language }}',
        autoStart: {{ autoStart }},
        displayMode: '{{ displayMode }}',
        position: '{{ position }}',
        theme: '{{ theme }}',
        iconMode: '{{ iconMode }}',
        voiceFeedback: {{ voiceFeedback }},
        showTranscript: {{ showTranscript }},
        animation: {
          type: '{{ animationType }}',
          color: '{{ animationColor }}'
        },
        commands: {
          // Define custom commands
          {{ customCommands }}
        }
      });
      
      // Add event listeners
      document.getElementById('{{ containerId }}').addEventListener('voice:command', function(event) {
        console.log('Voice command received:', event.detail);
        
        {{ commandHandler }}
      });
    }
  });
</script>`,
    defaultProps: {
      containerId: 'voice-assistant',
      language: 'en-US',
      autoStart: 'false',
      displayMode: 'button',
      position: 'bottom-right',
      theme: 'light',
      iconMode: 'microphone',
      voiceFeedback: 'true',
      showTranscript: 'true',
      animationType: 'wave',
      animationColor: '#3498db',
      customCommands: '"help": function() { alert("Help requested"); },\n"go to *": function(page) { window.location.href = page + ".php"; }',
      commandHandler: '// Handle specific commands\nif (event.detail.pattern === "go to *") {\n  // Custom handler for navigation\n}'
    },
    properties: [
      {
        name: 'containerId',
        label: 'Container ID',
        type: 'text',
        description: 'ID for the voice assistant container'
      },
      {
        name: 'language',
        label: 'Language',
        type: 'select',
        options: [
          { value: 'en-US', label: 'English (US)' },
          { value: 'en-GB', label: 'English (UK)' },
          { value: 'fr-FR', label: 'French' },
          { value: 'de-DE', label: 'German' },
          { value: 'es-ES', label: 'Spanish' },
          { value: 'it-IT', label: 'Italian' },
          { value: 'ja-JP', label: 'Japanese' },
          { value: 'zh-CN', label: 'Chinese (Simplified)' }
        ],
        description: 'Recognition language'
      },
      {
        name: 'autoStart',
        label: 'Auto Start',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ],
        description: 'Start voice recognition automatically'
      },
      {
        name: 'displayMode',
        label: 'Display Mode',
        type: 'select',
        options: [
          { value: 'button', label: 'Button' },
          { value: 'icon', label: 'Icon' },
          { value: 'bar', label: 'Bar' }
        ],
        description: 'How the voice assistant is displayed'
      },
      {
        name: 'position',
        label: 'Position',
        type: 'select',
        options: [
          { value: 'bottom-right', label: 'Bottom Right' },
          { value: 'bottom-left', label: 'Bottom Left' },
          { value: 'top-right', label: 'Top Right' },
          { value: 'top-left', label: 'Top Left' },
          { value: 'center', label: 'Center' }
        ],
        description: 'Position on the screen'
      },
      {
        name: 'theme',
        label: 'Theme',
        type: 'select',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto (System)' }
        ],
        description: 'Color theme'
      },
      {
        name: 'iconMode',
        label: 'Icon Style',
        type: 'select',
        options: [
          { value: 'microphone', label: 'Microphone' },
          { value: 'assistant', label: 'Assistant' },
          { value: 'circle', label: 'Circle' }
        ],
        description: 'Icon style'
      },
      {
        name: 'voiceFeedback',
        label: 'Voice Feedback',
        type: 'select',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' }
        ],
        description: 'Enable voice responses'
      },
      {
        name: 'showTranscript',
        label: 'Show Transcript',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ],
        description: 'Show recognized speech'
      },
      {
        name: 'animationType',
        label: 'Animation Type',
        type: 'select',
        options: [
          { value: 'wave', label: 'Wave' },
          { value: 'pulse', label: 'Pulse' },
          { value: 'bars', label: 'Bars' },
          { value: 'circle', label: 'Circle' }
        ],
        description: 'Type of animation'
      },
      {
        name: 'animationColor',
        label: 'Animation Color',
        type: 'color',
        description: 'Color for the animation'
      },
      {
        name: 'customCommands',
        label: 'Custom Commands',
        type: 'code',
        language: 'javascript',
        description: 'JavaScript object with command patterns and handlers'
      },
      {
        name: 'commandHandler',
        label: 'Command Handler',
        type: 'code',
        language: 'javascript',
        description: 'JavaScript code to handle commands'
      }
    ]
  });
}
