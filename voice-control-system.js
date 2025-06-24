/**
 * AlgorithmPress PHP-WASM Builder - Voice Control System
 * 
 * Provides voice command recognition and execution for the PHP-WASM Builder interface
 */

const VoiceControlSystem = (function() {
  'use strict';
  
  // Private variables
  let isInitialized = false;
  let isListening = false;
  let recognition = null;
  let commandProcessor = null;
  let voiceFeedback = null;
  let commandVocabulary = null;
  let commandHistory = [];
  let lastCommand = null;
  let confidenceThreshold = 0.7;
  let language = 'en-US';
  let visualFeedbackElement = null;
  
  // Available voice commands organized by category
  const commands = {
    navigation: {
      'go to components': () => navigateTo('components-tab'),
      'show components': () => navigateTo('components-tab'),
      'go to properties': () => navigateTo('properties-tab'),
      'show properties': () => navigateTo('properties-tab'),
      'go to php settings': () => navigateTo('php-settings-tab'),
      'show php settings': () => navigateTo('php-settings-tab'),
      'go to storage': () => navigateTo('storage-tab'),
      'show storage': () => navigateTo('storage-tab'),
      'go to preview': () => showPreview(),
      'show preview': () => showPreview()
    },
    
    project: {
      'new project': () => createNewProject(),
      'open project': () => openProject(),
      'save project': () => saveProject(),
      'export project': () => exportProject(),
      'export as html': () => exportAsFormat('html'),
      'export as php': () => exportAsFormat('php'),
      'export as plugin': () => exportAsFormat('plugin')
    },
    
    components: {
      'add component $name': (name) => addComponent(name),
      'select component $number': (number) => selectComponent(Number(number)),
      'delete component': () => deleteSelectedComponent(),
      'delete component $number': (number) => deleteComponent(Number(number)),
      'move component up': () => moveComponentUp(),
      'move component down': () => moveComponentDown()
    },
    
    properties: {
      'set property $name to $value': (name, value) => setProperty(name, value),
      'change property $name to $value': (name, value) => setProperty(name, value),
      'update property $name to $value': (name, value) => setProperty(name, value)
    },
    
    code: {
      'switch to php': () => switchCodeTab('php'),
      'switch to css': () => switchCodeTab('css'),
      'switch to javascript': () => switchCodeTab('js'),
      'add php code': () => focusCodeEditor('php'),
      'add css code': () => focusCodeEditor('css'),
      'add javascript code': () => focusCodeEditor('js')
    },
    
    system: {
      'start listening': () => startListening(),
      'stop listening': () => stopListening(),
      'pause listening': () => pauseListening(),
      'resume listening': () => resumeListening(),
      'help': () => showHelp(),
      'show commands': () => showCommands(),
      'undo': () => undo(),
      'redo': () => redo()
    }
  };
  
  /**
   * Initialize the voice control system
   * @param {Object} options - Configuration options
   * @returns {Promise} - Promise that resolves when initialized
   */
  function initialize(options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          const error = new Error('Speech recognition not supported in this browser');
          showFeedback('error', 'Speech recognition not supported in this browser');
          reject(error);
          return;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // Set recognition options
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;
        recognition.lang = options.language || language;
        
        // Set up command processor
        commandProcessor = new CommandProcessor();
        
        // Set up voice feedback
        voiceFeedback = new VoiceFeedback({
          enabled: options.voiceFeedback !== false,
          voice: options.voice,
          volume: options.volume || 1.0,
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0
        });
        
        // Set up command vocabulary
        commandVocabulary = new CommandVocabulary(commands);
        
        // Set confidence threshold
        confidenceThreshold = options.confidenceThreshold || confidenceThreshold;
        
        // Set up visual feedback element
        setupVisualFeedback(options.visualFeedbackElement);
        
        // Set up recognition event handlers
        setupRecognitionEvents();
        
        // Mark as initialized
        isInitialized = true;
        showFeedback('info', 'Voice control system initialized');
        
        // Start listening if autoStart is enabled
        if (options.autoStart) {
          startListening();
        }
        
        resolve();
      } catch (error) {
        console.error('Failed to initialize voice control system:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Set up speech recognition event handlers
   */
  function setupRecognitionEvents() {
    recognition.onstart = function() {
      isListening = true;
      showFeedback('info', 'Voice recognition started');
    };
    
    recognition.onend = function() {
      isListening = false;
      showFeedback('info', 'Voice recognition ended');
    };
    
    recognition.onerror = function(event) {
      showFeedback('error', 'Error: ' + event.error);
      
      // Restart if error is not fatal
      if (event.error !== 'aborted' && event.error !== 'no-speech' && isListening) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };
    
    recognition.onresult = function(event) {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.trim().toLowerCase();
      const confidence = result[0].confidence;
      
      // Check if result meets confidence threshold
      if (confidence >= confidenceThreshold) {
        showFeedback('info', `Heard: "${transcript}" (${Math.round(confidence * 100)}%)`);
        processCommand(transcript, confidence);
      } else {
        showFeedback('warning', `Low confidence: "${transcript}" (${Math.round(confidence * 100)}%)`);
      }
    };
  }
  
  /**
   * Set up visual feedback element
   * @param {HTMLElement|string} element - The element or element ID for visual feedback
   */
  function setupVisualFeedback(element) {
    // Try to find or create a feedback element
    if (element) {
      if (typeof element === 'string') {
        visualFeedbackElement = document.getElementById(element);
      } else {
        visualFeedbackElement = element;
      }
    }
    
    if (!visualFeedbackElement) {
      // Create a new feedback element
      visualFeedbackElement = document.createElement('div');
      visualFeedbackElement.id = 'voice-feedback';
      visualFeedbackElement.className = 'voice-feedback-container';
      
      // Style the feedback element
      Object.assign(visualFeedbackElement.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '14px',
        maxWidth: '300px',
        transition: 'opacity 0.3s ease',
        opacity: '0.8',
        pointerEvents: 'none'
      });
      
      // Add status indicator
      const statusIndicator = document.createElement('div');
      statusIndicator.className = 'voice-status-indicator';
      
      Object.assign(statusIndicator.style, {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#ccc',
        display: 'inline-block',
        marginRight: '10px'
      });
      
      visualFeedbackElement.appendChild(statusIndicator);
      
      // Add feedback text element
      const feedbackText = document.createElement('span');
      feedbackText.className = 'voice-feedback-text';
      visualFeedbackElement.appendChild(feedbackText);
      
      // Add to document body
      document.body.appendChild(visualFeedbackElement);
    }
  }
  
  /**
   * Show visual feedback
   * @param {string} type - Feedback type (info, warning, error, success)
   * @param {string} message - Feedback message
   */
  function showFeedback(type, message) {
    if (!visualFeedbackElement) return;
    
    const statusIndicator = visualFeedbackElement.querySelector('.voice-status-indicator');
    const feedbackText = visualFeedbackElement.querySelector('.voice-feedback-text');
    
    if (statusIndicator) {
      // Set indicator color based on type
      let color = '#ccc';
      
      switch (type) {
        case 'info':
          color = '#3498db';
          break;
        case 'warning':
          color = '#f39c12';
          break;
        case 'error':
          color = '#e74c3c';
          break;
        case 'success':
          color = '#2ecc71';
          break;
      }
      
      statusIndicator.style.backgroundColor = color;
      
      // Pulse animation for activity
      statusIndicator.style.animation = 'none';
      setTimeout(() => {
        statusIndicator.style.animation = 'pulse 1s infinite';
      }, 10);
    }
    
    if (feedbackText) {
      feedbackText.textContent = message;
    }
    
    // Show feedback element
    visualFeedbackElement.style.opacity = '1';
    
    // Hide after timeout for info/success messages
    if (type === 'info' || type === 'success') {
      setTimeout(() => {
        visualFeedbackElement.style.opacity = '0.8';
        
        if (statusIndicator) {
          statusIndicator.style.animation = 'none';
          
          if (isListening) {
            statusIndicator.style.backgroundColor = '#3498db';
          } else {
            statusIndicator.style.backgroundColor = '#ccc';
          }
        }
      }, 3000);
    }
    
    // Also provide voice feedback for important messages
    if (type === 'success' || type === 'error') {
      provideVoiceFeedback(message);
    }
  }
  
  /**
   * Provide voice feedback
   * @param {string} message - The message to speak
   */
  function provideVoiceFeedback(message) {
    if (voiceFeedback && voiceFeedback.isEnabled()) {
      voiceFeedback.speak(message);
    }
  }
  
  /**
   * Process a voice command
   * @param {string} transcript - The transcript to process
   * @param {number} confidence - The confidence level (0-1)
   */
  function processCommand(transcript, confidence) {
    // Add to command history
    commandHistory.push({
      transcript,
      confidence,
      timestamp: new Date()
    });
    
    // If too many items in history, remove oldest
    if (commandHistory.length > 100) {
      commandHistory.shift();
    }
    
    // Try to match and execute command
    const commandResult = commandProcessor.processCommand(transcript);
    
    if (commandResult.command) {
      lastCommand = commandResult;
      showFeedback('success', `Executing: ${commandResult.command}`);
      
      try {
        // Execute the command
        commandResult.execute();
      } catch (error) {
        showFeedback('error', `Error executing command: ${error.message}`);
      }
    } else {
      showFeedback('warning', 'Command not recognized');
      provideVoiceFeedback('Command not recognized. Try saying "show commands" for help.');
    }
  }
  
  /**
   * Start listening for voice commands
   */
  function startListening() {
    if (!isInitialized) {
      showFeedback('error', 'Voice control system not initialized');
      return;
    }
    
    if (isListening) {
      showFeedback('info', 'Already listening');
      return;
    }
    
    try {
      recognition.start();
      showFeedback('success', 'Voice recognition started');
      provideVoiceFeedback('Voice control activated');
    } catch (error) {
      showFeedback('error', `Failed to start voice recognition: ${error.message}`);
    }
  }
  
  /**
   * Stop listening for voice commands
   */
  function stopListening() {
    if (!isInitialized || !isListening) {
      return;
    }
    
    try {
      recognition.stop();
      showFeedback('info', 'Voice recognition stopped');
      provideVoiceFeedback('Voice control deactivated');
    } catch (error) {
      showFeedback('error', `Failed to stop voice recognition: ${error.message}`);
    }
  }
  
  /**
   * Pause listening temporarily
   */
  function pauseListening() {
    if (!isInitialized || !isListening) {
      return;
    }
    
    try {
      recognition.stop();
      showFeedback('info', 'Voice recognition paused');
      provideVoiceFeedback('Voice control paused');
    } catch (error) {
      showFeedback('error', `Failed to pause voice recognition: ${error.message}`);
    }
  }
  
  /**
   * Resume listening after pause
   */
  function resumeListening() {
    if (!isInitialized) {
      showFeedback('error', 'Voice control system not initialized');
      return;
    }
    
    try {
      recognition.start();
      showFeedback('success', 'Voice recognition resumed');
      provideVoiceFeedback('Voice control resumed');
    } catch (error) {
      showFeedback('error', `Failed to resume voice recognition: ${error.message}`);
    }
  }
  
  /**
   * Navigate to a specific tab
   * @param {string} tabId - The ID of the tab to navigate to
   */
  function navigateTo(tabId) {
    const tab = document.querySelector(`.sidebar-tab[data-tab="${tabId}"]`);
    if (tab) {
      tab.click();
      showFeedback('success', `Navigated to ${tabId.replace('-tab', '')}`);
    } else {
      showFeedback('error', `Tab ${tabId} not found`);
    }
  }
  
  /**
   * Show preview
   */
  function showPreview() {
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
      previewBtn.click();
      showFeedback('success', 'Showing preview');
    } else {
      showFeedback('error', 'Preview button not found');
    }
  }
  
  /**
   * Create a new project
   */
  function createNewProject() {
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
      newProjectBtn.click();
      showFeedback('success', 'Creating new project');
    } else {
      showFeedback('error', 'New project button not found');
    }
  }
  
  /**
   * Open a project
   */
  function openProject() {
    const openProjectBtn = document.getElementById('open-project-btn');
    if (openProjectBtn) {
      openProjectBtn.click();
      showFeedback('success', 'Opening project dialog');
    } else {
      showFeedback('error', 'Open project button not found');
    }
  }
  
  /**
   * Save the current project
   */
  function saveProject() {
    const saveProjectBtn = document.getElementById('save-project-btn');
    if (saveProjectBtn) {
      saveProjectBtn.click();
      showFeedback('success', 'Saving project');
    } else {
      showFeedback('error', 'Save project button not found');
    }
  }
  
  /**
   * Export the current project
   */
  function exportProject() {
    const exportProjectBtn = document.getElementById('export-project-btn');
    if (exportProjectBtn) {
      exportProjectBtn.click();
      showFeedback('success', 'Exporting project');
    } else {
      showFeedback('error', 'Export project button not found');
    }
  }
  
  /**
   * Export as a specific format
   * @param {string} format - The format to export as
   */
  function exportAsFormat(format) {
    // This would need to be integrated with the export system
    showFeedback('info', `Exporting as ${format} format`);
    
    // For now, just open the export dialog
    exportProject();
  }
  
  /**
   * Add a component
   * @param {string} name - The name of the component to add
   */
  function addComponent(name) {
    // Find component by name
    const componentEls = document.querySelectorAll('.component-item');
    let componentFound = false;
    
    for (const el of componentEls) {
      const componentName = el.querySelector('.component-item-name')?.textContent.toLowerCase();
      
      if (componentName && componentName.includes(name.toLowerCase())) {
        // Simulate drag and drop
        componentFound = true;
        
        // Click on the component to select it
        el.click();
        
        // Get component ID
        const componentId = el.getAttribute('data-component-id');
        
        // Add component to canvas
        if (window.PHPWasmBuilder && window.PHPWasmBuilder.addComponent) {
          window.PHPWasmBuilder.addComponent(componentId);
          showFeedback('success', `Added component: ${componentName}`);
        } else {
          showFeedback('error', 'PHPWasmBuilder not available');
        }
        
        break;
      }
    }
    
    if (!componentFound) {
      showFeedback('error', `Component "${name}" not found`);
      
      // Suggest similar components
      const suggestions = findSimilarComponents(name);
      if (suggestions.length > 0) {
        const suggestionText = `Did you mean: ${suggestions.join(', ')}?`;
        showFeedback('info', suggestionText);
        provideVoiceFeedback(suggestionText);
      }
    }
  }
  
  /**
   * Find similar component names
   * @param {string} name - The name to find similar components for
   * @returns {Array<string>} - Array of similar component names
   */
  function findSimilarComponents(name) {
    const componentEls = document.querySelectorAll('.component-item');
    const allComponents = [];
    const similar = [];
    
    // Get all component names
    for (const el of componentEls) {
      const componentName = el.querySelector('.component-item-name')?.textContent;
      if (componentName) {
        allComponents.push(componentName);
      }
    }
    
    // Find similar names
    const searchName = name.toLowerCase();
    for (const componentName of allComponents) {
      if (componentName.toLowerCase().includes(searchName) || 
          levenshteinDistance(searchName, componentName.toLowerCase()) <= 3) {
        similar.push(componentName);
      }
      
      if (similar.length >= 3) break;
    }
    
    return similar;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - The Levenshtein distance
   */
  function levenshteinDistance(a, b) {
    const matrix = [];
    
    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1,     // Insertion
            matrix[i - 1][j] + 1      // Deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  /**
   * Select a component by index
   * @param {number} index - The index of the component to select
   */
  function selectComponent(index) {
    const componentEls = document.querySelectorAll('.builder-component');
    
    if (index <= 0 || index > componentEls.length) {
      showFeedback('error', `Invalid component number. There are ${componentEls.length} components.`);
      return;
    }
    
    // Convert to zero-based index
    const componentEl = componentEls[index - 1];
    
    if (componentEl) {
      componentEl.click();
      showFeedback('success', `Selected component ${index}`);
    } else {
      showFeedback('error', `Component ${index} not found`);
    }
  }
  
  /**
   * Delete the selected component
   */
  function deleteSelectedComponent() {
    const selectedComponent = document.querySelector('.builder-component.selected');
    
    if (!selectedComponent) {
      showFeedback('error', 'No component selected');
      return;
    }
    
    // Find and click the delete button
    const deleteBtn = selectedComponent.querySelector('.component-control-btn.delete');
    
    if (deleteBtn) {
      deleteBtn.click();
      showFeedback('success', 'Component deleted');
    } else {
      showFeedback('error', 'Delete button not found');
    }
  }
  
  /**
   * Delete a component by index
   * @param {number} index - The index of the component to delete
   */
  function deleteComponent(index) {
    const componentEls = document.querySelectorAll('.builder-component');
    
    if (index <= 0 || index > componentEls.length) {
      showFeedback('error', `Invalid component number. There are ${componentEls.length} components.`);
      return;
    }
    
    // Convert to zero-based index
    const componentEl = componentEls[index - 1];
    
    if (componentEl) {
      const deleteBtn = componentEl.querySelector('.component-control-btn.delete');
      
      if (deleteBtn) {
        deleteBtn.click();
        showFeedback('success', `Deleted component ${index}`);
      } else {
        showFeedback('error', 'Delete button not found');
      }
    } else {
      showFeedback('error', `Component ${index} not found`);
    }
  }
  
  /**
   * Move the selected component up
   */
  function moveComponentUp() {
    const selectedComponent = document.querySelector('.builder-component.selected');
    
    if (!selectedComponent) {
      showFeedback('error', 'No component selected');
      return;
    }
    
    // Find and click the move up button
    const moveUpBtn = selectedComponent.querySelector('.component-control-btn:first-child');
    
    if (moveUpBtn) {
      moveUpBtn.click();
      showFeedback('success', 'Component moved up');
    } else {
      showFeedback('error', 'Move up button not found');
    }
  }
  
  /**
   * Move the selected component down
   */
  function moveComponentDown() {
    const selectedComponent = document.querySelector('.builder-component.selected');
    
    if (!selectedComponent) {
      showFeedback('error', 'No component selected');
      return;
    }
    
    // Find and click the move down button
    const moveDownBtn = selectedComponent.querySelector('.component-control-btn:nth-child(2)');
    
    if (moveDownBtn) {
      moveDownBtn.click();
      showFeedback('success', 'Component moved down');
    } else {
      showFeedback('error', 'Move down button not found');
    }
  }
  
  /**
   * Set a property value
   * @param {string} name - The name of the property
   * @param {string} value - The value to set
   */
  function setProperty(name, value) {
    // Find property input by name
    const propertyInputs = document.querySelectorAll('#properties-form [data-property]');
    let propertyFound = false;
    
    for (const input of propertyInputs) {
      const propertyName = input.getAttribute('data-property').toLowerCase();
      
      if (propertyName.includes(name.toLowerCase())) {
        propertyFound = true;
        
        // Set value based on input type
        if (input.type === 'checkbox') {
          input.checked = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
        } else {
          input.value = value;
        }
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
        
        showFeedback('success', `Set property "${propertyName}" to "${value}"`);
        break;
      }
    }
    
    if (!propertyFound) {
      showFeedback('error', `Property "${name}" not found`);
    }
  }
  
  /**
   * Switch to a code tab
   * @param {string} tabName - The name of the tab to switch to
   */
  function switchCodeTab(tabName) {
    const tab = document.querySelector(`.code-tab[data-code="${tabName}"]`);
    
    if (tab) {
      tab.click();
      showFeedback('success', `Switched to ${tabName} tab`);
    } else {
      showFeedback('error', `Tab ${tabName} not found`);
    }
  }
  
  /**
   * Focus a code editor
   * @param {string} editor - The editor to focus
   */
  function focusCodeEditor(editor) {
    // First switch to the tab
    switchCodeTab(editor);
    
    // Then focus the editor
    const editorEl = document.getElementById(`${editor}-editor`);
    
    if (editorEl) {
      editorEl.focus();
      showFeedback('success', `Focused ${editor} editor`);
    } else {
      showFeedback('error', `${editor} editor not found`);
    }
  }
  
  /**
   * Show help for voice commands
   */
  function showHelp() {
    // Create a help modal
    showCommandsModal();
  }
  
  /**
   * Show available commands
   */
  function showCommands() {
    // Create a commands modal
    showCommandsModal();
  }
  
  /**
   * Show a modal with available commands
   */
  function showCommandsModal() {
    // Check if modal already exists
    let modal = document.getElementById('voice-commands-modal');
    
    if (!modal) {
      // Create modal
      modal = document.createElement('div');
      modal.id = 'voice-commands-modal';
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.setAttribute('aria-labelledby', 'voice-commands-modal-label');
      modal.setAttribute('aria-hidden', 'true');
      
      // Create modal dialog
      const modalDialog = document.createElement('div');
      modalDialog.className = 'modal-dialog modal-lg';
      modal.appendChild(modalDialog);
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalDialog.appendChild(modalContent);
      
      // Create modal header
      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      modalContent.appendChild(modalHeader);
      
      const modalTitle = document.createElement('h5');
      modalTitle.className = 'modal-title';
      modalTitle.id = 'voice-commands-modal-label';
      modalTitle.textContent = 'Available Voice Commands';
      modalHeader.appendChild(modalTitle);
      
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'btn-close';
      closeButton.setAttribute('data-bs-dismiss', 'modal');
      closeButton.setAttribute('aria-label', 'Close');
      modalHeader.appendChild(closeButton);
      
      // Create modal body
      const modalBody = document.createElement('div');
      modalBody.className = 'modal-body';
      modalContent.appendChild(modalBody);
      
      // Add commands to modal body
      const categoriesList = document.createElement('div');
      categoriesList.className = 'list-group mb-3';
      modalBody.appendChild(categoriesList);
      
      // Create a button for each category
      Object.keys(commands).forEach((category, index) => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        categoryButton.setAttribute('data-bs-toggle', 'collapse');
        categoryButton.setAttribute('data-bs-target', `#category-${category}`);
        categoryButton.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        const commandCount = Object.keys(commands[category]).length;
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary rounded-pill';
        badge.textContent = commandCount;
        categoryButton.appendChild(badge);
        
        categoriesList.appendChild(categoryButton);
        
        // Create collapse container for commands
        const commandsContainer = document.createElement('div');
        commandsContainer.className = 'collapse';
        commandsContainer.id = `category-${category}`;
        if (index === 0) {
          commandsContainer.classList.add('show');
          categoryButton.classList.add('active');
        }
        
        const commandsList = document.createElement('div');
        commandsList.className = 'list-group list-group-flush mb-3';
        
        // Add commands to list
        Object.keys(commands[category]).forEach(command => {
          const commandItem = document.createElement('div');
          commandItem.className = 'list-group-item';
          commandItem.textContent = `"${command}"`;
          commandsList.appendChild(commandItem);
        });
        
        commandsContainer.appendChild(commandsList);
        modalBody.appendChild(commandsContainer);
      });
      
      // Create modal footer
      const modalFooter = document.createElement('div');
      modalFooter.className = 'modal-footer';
      modalContent.appendChild(modalFooter);
      
      const closeFooterButton = document.createElement('button');
      closeFooterButton.type = 'button';
      closeFooterButton.className = 'btn btn-secondary';
      closeFooterButton.setAttribute('data-bs-dismiss', 'modal');
      closeFooterButton.textContent = 'Close';
      modalFooter.appendChild(closeFooterButton);
      
      // Add modal to document
      document.body.appendChild(modal);
    }
    
    // Show the modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Provide voice feedback
    provideVoiceFeedback('Showing available voice commands');
  }
  
  /**
   * Undo the last action
   */
  function undo() {
    if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
      // If focus is in a form field, use browser's undo
      document.execCommand('undo');
      showFeedback('success', 'Undo in form field');
    } else {
      // Otherwise, use application undo if available
      if (window.PHPWasmBuilder && window.PHPWasmBuilder.undo) {
        window.PHPWasmBuilder.undo();
        showFeedback('success', 'Undo');
      } else {
        showFeedback('error', 'Undo not available');
      }
    }
  }
  
  /**
   * Redo the last undone action
   */
  function redo() {
    if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
      // If focus is in a form field, use browser's redo
      document.execCommand('redo');
      showFeedback('success', 'Redo in form field');
    } else {
      // Otherwise, use application redo if available
      if (window.PHPWasmBuilder && window.PHPWasmBuilder.redo) {
        window.PHPWasmBuilder.redo();
        showFeedback('success', 'Redo');
      } else {
        showFeedback('error', 'Redo not available');
      }
    }
  }
  
  /**
   * Command Processor class
   * Handles matching and executing voice commands
   */
  class CommandProcessor {
    constructor() {
      this.commandPatterns = [];
      this.buildCommandPatterns();
    }
    
    /**
     * Build command patterns from the commands object
     */
    buildCommandPatterns() {
      // Clear existing patterns
      this.commandPatterns = [];
      
      // Process each category
      Object.keys(commands).forEach(category => {
        Object.keys(commands[category]).forEach(pattern => {
          const commandFunction = commands[category][pattern];
          
          // Check if pattern has parameters
          if (pattern.includes('$')) {
            // Convert to regex pattern
            const regexPattern = pattern.replace(/\$(\w+)/g, '([\\w\\s]+)');
            const paramNames = [];
            let match;
            const paramRegex = /\$(\w+)/g;
            
            while ((match = paramRegex.exec(pattern)) !== null) {
              paramNames.push(match[1]);
            }
            
            this.commandPatterns.push({
              category,
              pattern,
              regex: new RegExp(`^${regexPattern}$`, 'i'),
              paramNames,
              execute: (...args) => commandFunction(...args),
              isParameterized: true
            });
          } else {
            // Simple command without parameters
            this.commandPatterns.push({
              category,
              pattern,
              execute: () => commandFunction(),
              isParameterized: false
            });
          }
        });
      });
    }
    
    /**
     * Process a command
     * @param {string} text - The command text to process
     * @returns {Object} - The matched command or null
     */
    processCommand(text) {
      // Try exact match first
      for (const command of this.commandPatterns) {
        if (!command.isParameterized && text.toLowerCase() === command.pattern.toLowerCase()) {
          return {
            command: command.pattern,
            category: command.category,
            execute: command.execute,
            isParameterized: false
          };
        }
      }
      
      // Try parameterized commands
      for (const command of this.commandPatterns) {
        if (command.isParameterized) {
          const match = text.match(command.regex);
          
          if (match) {
            const params = match.slice(1);
            
            return {
              command: command.pattern,
              category: command.category,
              params: params,
              paramNames: command.paramNames,
              execute: () => command.execute(...params),
              isParameterized: true
            };
          }
        }
      }
      
      // No match found
      return { command: null };
    }
  }
  
  /**
   * Command Vocabulary class
   * Manages available commands
   */
  class CommandVocabulary {
    constructor(initialCommands) {
      this.commands = initialCommands || {};
    }
    
    /**
     * Add a command category
     * @param {string} category - The category name
     * @param {Object} commands - The commands to add
     */
    addCategory(category, commands) {
      this.commands[category] = commands;
    }
    
    /**
     * Add a command to a category
     * @param {string} category - The category name
     * @param {string} pattern - The command pattern
     * @param {Function} command - The command function
     */
    addCommand(category, pattern, command) {
      if (!this.commands[category]) {
        this.commands[category] = {};
      }
      
      this.commands[category][pattern] = command;
    }
    
    /**
     * Remove a command
     * @param {string} category - The category name
     * @param {string} pattern - The command pattern
     */
    removeCommand(category, pattern) {
      if (this.commands[category] && this.commands[category][pattern]) {
        delete this.commands[category][pattern];
      }
    }
    
    /**
     * Get all commands
     * @returns {Object} - All commands by category
     */
    getAllCommands() {
      return this.commands;
    }
    
    /**
     * Get all command patterns
     * @returns {Array<string>} - Array of command patterns
     */
    getAllPatterns() {
      const patterns = [];
      
      Object.keys(this.commands).forEach(category => {
        Object.keys(this.commands[category]).forEach(pattern => {
          patterns.push(pattern);
        });
      });
      
      return patterns;
    }
  }
  
  /**
   * Voice Feedback class
   * Provides spoken feedback using Speech Synthesis
   */
  class VoiceFeedback {
    constructor(options = {}) {
      this.enabled = options.enabled !== false;
      this.voice = options.voice;
      this.volume = options.volume || 1.0;
      this.rate = options.rate || 1.0;
      this.pitch = options.pitch || 1.0;
      
      // Check for browser support
      this.supported = 'speechSynthesis' in window;
      
      if (this.supported && this.enabled) {
        this.initialize();
      }
    }
    
    /**
     * Initialize speech synthesis
     */
    initialize() {
      // Wait for voices to be loaded
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
      if (typeof this.voice === 'string') {
        const matchingVoice = voices.find(v => 
          v.name.toLowerCase().includes(this.voice.toLowerCase())
        );
        
        if (matchingVoice) {
          this.voice = matchingVoice;
          return;
        }
      }
      
      // If voice is not found or not specified, use a default voice
      // Prefer a female English voice if available
      const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
      
      if (englishVoices.length > 0) {
        // Try to find a female voice
        const femaleVoice = englishVoices.find(v => v.name.includes('Female') || v.name.includes('girl'));
        
        if (femaleVoice) {
          this.voice = femaleVoice;
        } else {
          // Use the first English voice
          this.voice = englishVoices[0];
        }
      } else {
        // Use the first available voice
        this.voice = voices[0];
      }
    }
    
    /**
     * Speak a message
     * @param {string} message - The message to speak
     */
    speak(message) {
      if (!this.supported || !this.enabled) return;
      
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(message);
      
      // Set utterance properties
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      utterance.volume = this.volume;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      
      // Speak the utterance
      speechSynthesis.speak(utterance);
    }
    
    /**
     * Check if voice feedback is enabled
     * @returns {boolean} - Whether voice feedback is enabled
     */
    isEnabled() {
      return this.supported && this.enabled;
    }
    
    /**
     * Enable voice feedback
     */
    enable() {
      this.enabled = true;
    }
    
    /**
     * Disable voice feedback
     */
    disable() {
      this.enabled = false;
      
      // Cancel any ongoing speech
      if (this.supported) {
        speechSynthesis.cancel();
      }
    }
    
    /**
     * Toggle voice feedback
     * @returns {boolean} - New enabled state
     */
    toggle() {
      this.enabled = !this.enabled;
      
      if (!this.enabled && this.supported) {
        speechSynthesis.cancel();
      }
      
      return this.enabled;
    }
  }
  
  // Add CSS for voice control UI
  function addVoiceControlStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      .voice-feedback-container {
        z-index: 9999;
        pointer-events: none;
      }
      
      .voice-control-button {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #3498db;
        color: white;
        border: none;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .voice-control-button:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      }
      
      .voice-control-button.active {
        background-color: #e74c3c;
        animation: pulse 1.5s infinite;
      }
      
      .voice-control-icon {
        width: 24px;
        height: 24px;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  // Add voice control button to UI
  function addVoiceControlButton() {
    const button = document.createElement('button');
    button.className = 'voice-control-button';
    button.title = 'Voice Control';
    button.innerHTML = '<svg class="voice-control-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
    
    button.addEventListener('click', () => {
      if (isListening) {
        stopListening();
        button.classList.remove('active');
      } else {
        startListening();
        button.classList.add('active');
      }
    });
    
    document.body.appendChild(button);
    
    // Update button state when listening state changes
    const originalStartListening = startListening;
    startListening = function() {
      originalStartListening();
      button.classList.add('active');
    };
    
    const originalStopListening = stopListening;
    stopListening = function() {
      originalStopListening();
      button.classList.remove('active');
    };
  }
  
  // Set up UI elements
  function setupUI() {
    addVoiceControlStyles();
    addVoiceControlButton();
  }
  
  // Public API
  return {
    initialize,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    isListening: () => isListening,
    isInitialized: () => isInitialized,
    getCommandHistory: () => [...commandHistory],
    getLastCommand: () => lastCommand,
    setLanguage: (lang) => {
      language = lang;
      if (recognition) {
        recognition.lang = lang;
      }
    },
    setConfidenceThreshold: (threshold) => {
      confidenceThreshold = threshold;
    },
    addCommand: (category, pattern, command) => {
      if (commandVocabulary) {
        commandVocabulary.addCommand(category, pattern, command);
        commandProcessor.buildCommandPatterns();
      }
    },
    removeCommand: (category, pattern) => {
      if (commandVocabulary) {
        commandVocabulary.removeCommand(category, pattern);
        commandProcessor.buildCommandPatterns();
      }
    },
    setupUI,
    showCommands,
    toggleVoiceFeedback: () => {
      if (voiceFeedback) {
        return voiceFeedback.toggle();
      }
      return false;
    }
  };
})();

// Auto-initialize voice control when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add UI elements
  VoiceControlSystem.setupUI();
  
  // Initialize if autoStart is enabled in local storage
  const autoStart = localStorage.getItem('voice_control_autostart') === 'true';
  
  VoiceControlSystem.initialize({
    autoStart,
    voiceFeedback: true,
    visualFeedbackElement: 'voice-feedback'
  }).catch(error => {
    console.error('Failed to initialize voice control:', error);
  });
});
