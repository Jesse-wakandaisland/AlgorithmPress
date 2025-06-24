/**
 * PHP-WASM Builder - Main Initialization Script
 * This script brings together all the modules and initializes the builder system
 */

// Main application
const PHPWasmBuilder = (function() {
  'use strict';
  
  // Application state
  let state = {
    initialized: false,
    currentProject: null,
    phpReady: false,
    storageReady: false,
    selectedComponent: null,
    componentsLoaded: false,
    exportTarget: 'standalone',
    showPreview: false,
    projectHistory: []
  };
  
  // Cached DOM elements
  const elements = {};
  
  // Available components
  let availableComponents = [];
  
  // Bootstrap modals
  let modals = {};
  
  /**
   * Initialize the builder application
   */
  function initialize() {
    console.log('Initializing PHP-WASM Builder...');
    
    // Cache DOM elements
    cacheElements();
    
    // Initialize components
    initializeComponents();
    
    // Set up event handlers
    bindEventHandlers();
    
    // Initialize PHP-WASM
    initPhpWasm()
      .then(() => {
        console.log('PHP-WASM initialized successfully');
        updateStatus('PHP-WASM', 'ready');
      })
      .catch(error => {
        console.error('Failed to initialize PHP-WASM:', error);
        updateStatus('PHP-WASM', 'error', error);
      });
    
    // Initialize storage
    initStorage()
      .then(() => {
        console.log('Storage initialized successfully');
        updateStatus('Storage', 'ready');
      })
      .catch(error => {
        console.error('Failed to initialize storage:', error);
        updateStatus('Storage', 'error', error);
      });
    
    // Initialize Bootstrap tooltips and popovers
    initBootstrapComponents();
    
    // Try to load most recent project
    loadLastProject();
    
    // Update status
    state.initialized = true;
    updateStatus('Builder', 'ready');
    console.log('PHP-WASM Builder initialized');
  }
  
  /**
   * Cache DOM elements for faster access
   */
  function cacheElements() {
    elements.builderSidebar = document.querySelector('.builder-sidebar');
    elements.componentsContainer = document.getElementById('components-container');
    elements.propertiesPanel = document.getElementById('properties-panel');
    elements.builderCanvas = document.querySelector('.builder-canvas');
    elements.dropZone = document.querySelector('.drop-zone');
    elements.previewFrame = document.getElementById('preview-frame');
    elements.codePanel = document.getElementById('code-panel');
    elements.phpEditor = document.getElementById('php-editor');
    elements.cssEditor = document.getElementById('css-editor');
    elements.jsEditor = document.getElementById('js-editor');
    elements.themeSelector = document.getElementById('theme-selector');
    elements.newProjectBtn = document.getElementById('new-project-btn');
    elements.openProjectBtn = document.getElementById('open-project-btn');
    elements.saveProjectBtn = document.getElementById('save-project-btn');
    elements.exportProjectBtn = document.getElementById('export-project-btn');
    elements.previewBtn = document.getElementById('preview-btn');
    elements.phpVersion = document.getElementById('php-version');
    elements.projectsList = document.getElementById('projects-list');
    elements.storageRadios = document.querySelectorAll('input[name="storage-method"]');
    elements.cubbitSettings = document.getElementById('cubbit-settings');
    elements.cubbitApiKey = document.getElementById('cubbit-api-key');
    elements.cubbitBucket = document.getElementById('cubbit-bucket');
    elements.configureStorageBtn = document.getElementById('configure-storage-btn');
  }
  
  /**
   * Initialize Bootstrap components
   */
  function initBootstrapComponents() {
    // Initialize modals
    modals.preview = new bootstrap.Modal(document.getElementById('preview-modal'));
    modals.openProject = new bootstrap.Modal(document.getElementById('open-project-modal'));
    modals.export = new bootstrap.Modal(document.getElementById('export-modal'));
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }
  
  /**
   * Initialize PHP-WASM
   */
  function initPhpWasm() {
    return PHPWasmIntegration.initialize({
      phpVersion: '8.2',
      extensions: ['core', 'date', 'json', 'sqlite3', 'pdo', 'pdo_sqlite'],
      phpIniSettings: {
        'display_errors': 'On',
        'error_reporting': 'E_ALL',
        'max_execution_time': '30',
        'memory_limit': '128M'
      }
    }).then(() => {
      state.phpReady = true;
      
      // Create initial PHP environment
      return createInitialPhpEnvironment();
    });
  }
  
  /**
   * Create initial PHP environment files
   */
  function createInitialPhpEnvironment() {
    // Create basic PHP files in the virtual filesystem
    return Promise.all([
      PHPWasmIntegration.createFile('index.php', '<?php\necho "Hello from PHP-WASM Builder!";\n?>'),
      PHPWasmIntegration.createDirectory('includes'),
      PHPWasmIntegration.createDirectory('css'),
      PHPWasmIntegration.createDirectory('js'),
      PHPWasmIntegration.createDirectory('uploads')
    ]);
  }
  
  /**
   * Initialize storage
   */
  function initStorage() {
    // First check for local storage availability
    const storageType = getStoragePreference();
    
    if (storageType === 'cubbitDS3') {
      // Initialize Cubbit DS3 storage
      const apiKey = localStorage.getItem('cubbit_api_key');
      const bucketName = localStorage.getItem('cubbit_bucket') || 'php-wasm-projects';
      
      if (!apiKey) {
        // No API key found, default to local storage
        console.warn('No Cubbit API key found, defaulting to local storage');
        setStoragePreference('localStorage');
        return Promise.resolve();
      }
      
      return CubbitStorage.initialize({
        apiKey: apiKey,
        bucketName: bucketName
      }).then(() => {
        state.storageReady = true;
        setStoragePreference('cubbitDS3');
      }).catch(error => {
        console.error('Failed to initialize Cubbit storage:', error);
        // Fall back to local storage
        setStoragePreference('localStorage');
        return Promise.resolve();
      });
    } else {
      // Use local storage
      setStoragePreference('localStorage');
      state.storageReady = true;
      return Promise.resolve();
    }
  }
  
  /**
   * Get storage preference
   */
  function getStoragePreference() {
    return localStorage.getItem('storage_preference') || 'localStorage';
  }
  
  /**
   * Set storage preference
   */
  function setStoragePreference(preference) {
    localStorage.setItem('storage_preference', preference);
    
    // Update radio buttons
    if (elements.storageRadios) {
      elements.storageRadios.forEach(radio => {
        radio.checked = radio.value === preference;
      });
    }
    
    // Show/hide Cubbit settings
    if (elements.cubbitSettings) {
      elements.cubbitSettings.style.display = preference === 'cubbitDS3' ? 'block' : 'none';
    }
  }
  
  /**
   * Configure storage settings
   */
  function configureStorage() {
    const preference = getStoragePreference();
    
    if (preference === 'cubbitDS3') {
      // Save Cubbit settings
      const apiKey = elements.cubbitApiKey.value;
      const bucketName = elements.cubbitBucket.value || 'php-wasm-projects';
      
      if (!apiKey) {
        showToast('error', 'Cubbit API key is required');
        return;
      }
      
      localStorage.setItem('cubbit_api_key', apiKey);
      localStorage.setItem('cubbit_bucket', bucketName);
      
      // Reinitialize storage
      initStorage()
        .then(() => {
          showToast('success', 'Cubbit storage configured successfully');
        })
        .catch(error => {
          showToast('error', 'Failed to configure Cubbit storage: ' + error.message);
        });
    } else {
      showToast('info', 'Local storage is active');
    }
  }
  
  /**
   * Initialize components library
   */
  function initializeComponents() {
    // Load component templates
    availableComponents = PHPComponentTemplates;
    
    // Render components in sidebar
    renderComponentsList();
    
    state.componentsLoaded = true;
  }
  
  /**
   * Render components list in sidebar
   */
  function renderComponentsList() {
    if (!elements.componentsContainer) return;
    
    // Group components by category
    const componentsByCategory = {};
    availableComponents.forEach(component => {
      if (!componentsByCategory[component.category]) {
        componentsByCategory[component.category] = [];
      }
      componentsByCategory[component.category].push(component);
    });
    
    // Clear container
    elements.componentsContainer.innerHTML = '';
    
    // Render components by category
    Object.entries(componentsByCategory).forEach(([category, components]) => {
      const categoryEl = document.createElement('div');
      categoryEl.className = 'component-category';
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'component-category-title';
      categoryTitle.textContent = category;
      categoryEl.appendChild(categoryTitle);
      
      const componentsEl = document.createElement('div');
      componentsEl.className = 'component-items';
      
      components.forEach(component => {
        const componentEl = document.createElement('div');
        componentEl.className = 'component-item';
        componentEl.setAttribute('data-component-id', component.id);
        componentEl.setAttribute('draggable', 'true');
        
        const componentIcon = document.createElement('div');
        componentIcon.className = 'component-item-icon';
        componentIcon.innerHTML = component.icon;
        
        const componentName = document.createElement('div');
        componentName.className = 'component-item-name';
        componentName.textContent = component.name;
        
        componentEl.appendChild(componentIcon);
        componentEl.appendChild(componentName);
        componentsEl.appendChild(componentEl);
      });
      
      categoryEl.appendChild(componentsEl);
      elements.componentsContainer.appendChild(categoryEl);
    });
  }
  
  /**
   * Bind event handlers
   */
  function bindEventHandlers() {
    // Drag and drop handlers
    bindDragAndDropHandlers();
    
    // Button click handlers
    bindButtonHandlers();
    
    // Storage preference change
    bindStorageHandlers();
    
    // Theme selector
    bindThemeSelector();
    
    // Tabs and code panel
    bindTabHandlers();
  }
  
  /**
   * Bind drag and drop handlers
   */
  function bindDragAndDropHandlers() {
    if (!elements.componentsContainer || !elements.dropZone) return;
    
    // Make components draggable
    elements.componentsContainer.addEventListener('dragstart', (e) => {
      const componentItem = e.target.closest('.component-item');
      if (!componentItem) return;
      
      const componentId = componentItem.getAttribute('data-component-id');
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'component',
        id: componentId
      }));
      
      e.dataTransfer.setDragImage(componentItem, 0, 0);
      componentItem.classList.add('dragging');
    });
    
    elements.componentsContainer.addEventListener('dragend', (e) => {
      const componentItem = e.target.closest('.component-item');
      if (componentItem) {
        componentItem.classList.remove('dragging');
      }
    });
    
    // Set up canvas as drop zone
    elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('drop-zone-active');
    });
    
    elements.dropZone.addEventListener('dragleave', (e) => {
      elements.dropZone.classList.remove('drop-zone-active');
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('drop-zone-active');
      
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.type === 'component') {
          addComponent(parsedData.id);
        }
      } catch (error) {
        console.error('Failed to parse drop data:', error);
      }
    });
  }
  
  /**
   * Bind button handlers
   */
  function bindButtonHandlers() {
    // New project button
    if (elements.newProjectBtn) {
      elements.newProjectBtn.addEventListener('click', createNewProject);
    }
    
    // Open project button
    if (elements.openProjectBtn) {
      elements.openProjectBtn.addEventListener('click', () => {
        populateProjectsList().then(() => {
          modals.openProject.show();
        });
      });
    }
    
    // Save project button
    if (elements.saveProjectBtn) {
      elements.saveProjectBtn.addEventListener('click', saveCurrentProject);
    }
    
    // Export project button
    if (elements.exportProjectBtn) {
      elements.exportProjectBtn.addEventListener('click', exportProject);
    }
    
    // Preview button
    if (elements.previewBtn) {
      elements.previewBtn.addEventListener('click', showPreview);
    }
    
    // Configure storage button
    if (elements.configureStorageBtn) {
      elements.configureStorageBtn.addEventListener('click', configureStorage);
    }
  }
  
  /**
   * Bind storage handlers
   */
  function bindStorageHandlers() {
    if (!elements.storageRadios) return;
    
    elements.storageRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          setStoragePreference(radio.value);
        }
      });
    });
  }
  
  /**
   * Bind theme selector
   */
  function bindThemeSelector() {
    if (!elements.themeSelector) return;
    
    elements.themeSelector.addEventListener('change', () => {
      if (!state.currentProject) return;
      
      state.currentProject.theme = elements.themeSelector.value;
      saveCurrentProject();
    });
  }
  
  /**
   * Bind tab handlers
   */
  function bindTabHandlers() {
    // Sidebar tabs
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    
    sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        sidebarTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const contentId = tab.getAttribute('data-tab');
        document.querySelectorAll('.sidebar-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(contentId).classList.add('active');
      });
    });
    
    // Code tabs
    const codeTabs = document.querySelectorAll('.code-tab');
    
    codeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        codeTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const codeType = tab.getAttribute('data-code');
        document.querySelectorAll('.code-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(codeType + '-code').classList.add('active');
      });
    });
  }
  
  /**
   * Create a new project
   */
  function createNewProject() {
    const projectName = prompt('Enter a name for your new project:');
    if (!projectName) return;
    
    // Generate unique ID
    const projectId = 'project-' + Date.now();
    
    // Create new project object
    const project = {
      id: projectId,
      name: projectName,
      description: '',
      components: [],
      theme: elements.themeSelector ? elements.themeSelector.value : 'bootstrap',
      customStyles: '',
      customScripts: '',
      phpVersion: elements.phpVersion ? elements.phpVersion.value : '8.2',
      phpExtensions: ['core', 'date', 'json', 'sqlite3'],
      phpSettings: {
        'display_errors': 'On',
        'error_reporting': 'E_ALL',
        'memory_limit': '128M'
      },
      storageMethod: getStoragePreference(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Set as current project
    state.currentProject = project;
    
    // Update UI
    updateProjectUI();
    
    // Save project
    saveCurrentProject();
    
    // Show toast
    showToast('success', 'New project created: ' + projectName);
  }
  
  /**
   * Save the current project
   */
  function saveCurrentProject() {
    if (!state.currentProject) {
      showToast('error', 'No active project to save');
      return;
    }
    
    // Update last modified date
    state.currentProject.lastModified = new Date().toISOString();
    
    // Get code from editors
    if (elements.phpEditor) {
      state.currentProject.customPhp = elements.phpEditor.value;
    }
    
    if (elements.cssEditor) {
      state.currentProject.customStyles = elements.cssEditor.value;
    }
    
    if (elements.jsEditor) {
      state.currentProject.customScripts = elements.jsEditor.value;
    }
    
    // Save to storage
    const storageType = getStoragePreference();
    
    if (storageType === 'cubbitDS3' && CubbitStorage.isInitialized()) {
      CubbitStorage.saveProject(state.currentProject, state.currentProject.id)
        .then(() => {
          // Save reference to local storage
          saveProjectReference(state.currentProject);
          showToast('success', 'Project saved to Cubbit DS3');
        })
        .catch(error => {
          console.error('Failed to save project to Cubbit:', error);
          showToast('error', 'Failed to save project: ' + error.message);
        });
    } else {
      // Save to local storage
      try {
        localStorage.setItem('project_' + state.currentProject.id, JSON.stringify(state.currentProject));
        saveProjectReference(state.currentProject);
        showToast('success', 'Project saved');
      } catch (error) {
        console.error('Failed to save project to local storage:', error);
        showToast('error', 'Failed to save project: ' + error.message);
      }
    }
  }
  
  /**
   * Save project reference to local storage
   */
  function saveProjectReference(project) {
    try {
      // Save last project ID
      localStorage.setItem('last_project_id', project.id);
      
      // Update project list
      const projectList = JSON.parse(localStorage.getItem('project_list') || '[]');
      
      // Check if project already exists in list
      const existingIndex = projectList.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        // Update existing project
        projectList[existingIndex] = {
          id: project.id,
          name: project.name,
          lastModified: project.lastModified,
          storageMethod: project.storageMethod
        };
      } else {
        // Add new project
        projectList.push({
          id: project.id,
          name: project.name,
          lastModified: project.lastModified,
          storageMethod: project.storageMethod
        });
      }
      
      // Save updated list
      localStorage.setItem('project_list', JSON.stringify(projectList));
    } catch (error) {
      console.error('Failed to save project reference:', error);
    }
  }
  
  /**
   * Load the last project
   */
  function loadLastProject() {
    const lastProjectId = localStorage.getItem('last_project_id');
    if (!lastProjectId) {
      // No last project, create a new one
      createNewProject();
      return;
    }
    
    // Load the project
    loadProject(lastProjectId)
      .then(project => {
        if (project) {
          state.currentProject = project;
          updateProjectUI();
          showToast('info', 'Project loaded: ' + project.name);
        } else {
          // Project not found, create a new one
          createNewProject();
        }
      })
      .catch(error => {
        console.error('Failed to load last project:', error);
        showToast('error', 'Failed to load last project: ' + error.message);
        createNewProject();
      });
  }
  
  /**
   * Populate the projects list for the open project modal
   */
  function populateProjectsList() {
    if (!elements.projectsList) return Promise.resolve();
    
    const projectList = JSON.parse(localStorage.getItem('project_list') || '[]');
    
    // Sort by last modified date (newest first)
    projectList.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    // Clear list
    elements.projectsList.innerHTML = '';
    
    // Add each project
    projectList.forEach(project => {
      const projectEl = document.createElement('a');
      projectEl.href = '#';
      projectEl.className = 'list-group-item list-group-item-action';
      projectEl.setAttribute('data-project-id', project.id);
      
      const lastModified = new Date(project.lastModified);
      
      projectEl.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${escapeHtml(project.name)}</h5>
          <small>${lastModified.toLocaleString()}</small>
        </div>
        <p class="mb-1">Storage: ${project.storageMethod === 'cubbitDS3' ? 'Cubbit DS3' : 'Browser Local Storage'}</p>
      `;
      
      projectEl.addEventListener('click', (e) => {
        e.preventDefault();
        loadProject(project.id).then(loadedProject => {
          if (loadedProject) {
            state.currentProject = loadedProject;
            updateProjectUI();
            modals.openProject.hide();
            showToast('info', 'Project loaded: ' + loadedProject.name);
          }
        });
      });
      
      elements.projectsList.appendChild(projectEl);
    });
    
    // If using Cubbit, also load projects from there
    if (getStoragePreference() === 'cubbitDS3' && CubbitStorage.isInitialized()) {
      return CubbitStorage.listProjects().then(cubbitProjects => {
        // Filter out projects that are already in the local list
        const localIds = projectList.map(p => p.id);
        const newCubbitProjects = cubbitProjects.filter(p => !localIds.includes(p.id));
        
        // Add Cubbit projects
        newCubbitProjects.forEach(project => {
          const projectEl = document.createElement('a');
          projectEl.href = '#';
          projectEl.className = 'list-group-item list-group-item-action';
          projectEl.setAttribute('data-project-id', project.id);
          
          const lastModified = new Date(project.lastModified);
          
          projectEl.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${escapeHtml(project.name)}</h5>
              <small>${lastModified.toLocaleString()}</small>
            </div>
            <p class="mb-1">Storage: Cubbit DS3</p>
          `;
          
          projectEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadProject(project.id, 'cubbitDS3').then(loadedProject => {
              if (loadedProject) {
                state.currentProject = loadedProject;
                updateProjectUI();
                modals.openProject.hide();
                showToast('info', 'Project loaded: ' + loadedProject.name);
              }
            });
          });
          
          elements.projectsList.appendChild(projectEl);
        });
      }).catch(error => {
        console.error('Failed to list Cubbit projects:', error);
        return Promise.resolve();
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Load a project
   */
  function loadProject(projectId, storageMethod) {
    storageMethod = storageMethod || getProjectStorageMethod(projectId);
    
    if (storageMethod === 'cubbitDS3' && CubbitStorage.isInitialized()) {
      return CubbitStorage.loadProject(projectId).catch(error => {
        console.error('Failed to load project from Cubbit:', error);
        // Try to load from local storage as fallback
        return loadProjectFromLocalStorage(projectId);
      });
    } else {
      return loadProjectFromLocalStorage(projectId);
    }
  }
  
  /**
   * Get the storage method for a project
   */
  function getProjectStorageMethod(projectId) {
    const projectList = JSON.parse(localStorage.getItem('project_list') || '[]');
    const project = projectList.find(p => p.id === projectId);
    
    return project ? project.storageMethod : 'localStorage';
  }
  
  /**
   * Load a project from local storage
   */
  function loadProjectFromLocalStorage(projectId) {
    try {
      const projectJson = localStorage.getItem('project_' + projectId);
      if (!projectJson) {
        console.warn('Project not found in local storage:', projectId);
        return Promise.resolve(null);
      }
      
      return Promise.resolve(JSON.parse(projectJson));
    } catch (error) {
      console.error('Failed to load project from local storage:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Update project UI
   */
  function updateProjectUI() {
    if (!state.currentProject) return;
    
    // Update theme selector
    if (elements.themeSelector) {
      elements.themeSelector.value = state.currentProject.theme || 'bootstrap';
    }
    
    // Update PHP version
    if (elements.phpVersion) {
      elements.phpVersion.value = state.currentProject.phpVersion || '8.2';
    }
    
    // Update code editors
    if (elements.phpEditor) {
      elements.phpEditor.value = state.currentProject.customPhp || '';
    }
    
    if (elements.cssEditor) {
      elements.cssEditor.value = state.currentProject.customStyles || '';
    }
    
    if (elements.jsEditor) {
      elements.jsEditor.value = state.currentProject.customScripts || '';
    }
    
    // Update canvas with components
    renderProjectComponents();
  }
  
  /**
   * Render project components
   */
  function renderProjectComponents() {
    if (!elements.dropZone || !state.currentProject) return;
    
    // Clear drop zone
    elements.dropZone.innerHTML = '';
    
    if (!state.currentProject.components || state.currentProject.components.length === 0) {
      elements.dropZone.innerHTML = `
        <h3>Drag components here</h3>
        <p class="text-muted">Drag and drop components from the sidebar to build your PHP application</p>
      `;
      return;
    }
    
    // Render each component
    state.currentProject.components.forEach(component => {
      const componentTemplate = availableComponents.find(c => c.id === component.componentId);
      if (!componentTemplate) return;
      
      const componentEl = document.createElement('div');
      componentEl.className = 'builder-component';
      componentEl.setAttribute('data-instance-id', component.id);
      
      // Controls
      const controlsEl = document.createElement('div');
      controlsEl.className = 'component-controls';
      
      const moveUpBtn = document.createElement('button');
      moveUpBtn.className = 'component-control-btn';
      moveUpBtn.innerHTML = '↑';
      moveUpBtn.title = 'Move Up';
      moveUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveComponentUp(component.id);
      });
      
      const moveDownBtn = document.createElement('button');
      moveDownBtn.className = 'component-control-btn';
      moveDownBtn.innerHTML = '↓';
      moveDownBtn.title = 'Move Down';
      moveDownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveComponentDown(component.id);
      });
      
      const editBtn = document.createElement('button');
      editBtn.className = 'component-control-btn';
      editBtn.innerHTML = '✎';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectComponent(component.id);
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'component-control-btn delete';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeComponent(component.id);
      });
      
      controlsEl.appendChild(moveUpBtn);
      controlsEl.appendChild(moveDownBtn);
      controlsEl.appendChild(editBtn);
      controlsEl.appendChild(deleteBtn);
      componentEl.appendChild(controlsEl);
      
      // Component content
      const contentEl = document.createElement('div');
      contentEl.className = 'component-content';
      
      // Render preview based on component type
      const templateContent = renderComponentPreview(componentTemplate, component.props);
      contentEl.innerHTML = templateContent;
      
      componentEl.appendChild(contentEl);
      
      // Make component selectable
      componentEl.addEventListener('click', () => {
        selectComponent(component.id);
      });
      
      elements.dropZone.appendChild(componentEl);
    });
  }
  
  /**
   * Render component preview
   */
  function renderComponentPreview(componentTemplate, props) {
    let preview = componentTemplate.template;
    
    // Replace placeholders with values
    Object.entries(props).forEach(([key, value]) => {
      const regex = new RegExp(`{{ ${key} }}`, 'g');
      preview = preview.replace(regex, value);
    });
    
    return preview;
  }
  
  /**
   * Add a component to the project
   */
  function addComponent(componentId) {
    if (!state.currentProject) {
      showToast('error', 'No active project');
      return;
    }
    
    const componentTemplate = availableComponents.find(c => c.id === componentId);
    if (!componentTemplate) {
      console.error('Component not found:', componentId);
      return;
    }
    
    // Create a new component instance
    const instanceId = componentId + '-' + Date.now();
    const component = {
      id: instanceId,
      componentId: componentId,
      props: { ...componentTemplate.defaultProps }
    };
    
    // Add to project
    if (!state.currentProject.components) {
      state.currentProject.components = [];
    }
    
    state.currentProject.components.push(component);
    
    // Update UI
    renderProjectComponents();
    
    // Select the new component
    selectComponent(instanceId);
    
    // Save project
    saveCurrentProject();
  }
  
  /**
   * Remove a component from the project
   */
  function removeComponent(instanceId) {
    if (!state.currentProject || !state.currentProject.components) return;
    
    // Find component index
    const index = state.currentProject.components.findIndex(c => c.id === instanceId);
    if (index === -1) return;
    
    // Remove component
    state.currentProject.components.splice(index, 1);
    
    // Update UI
    renderProjectComponents();
    
    // Clear properties panel if this was the selected component
    if (state.selectedComponent && state.selectedComponent.id === instanceId) {
      state.selectedComponent = null;
      renderPropertiesPanel(null);
    }
    
    // Save project
    saveCurrentProject();
  }
  
  /**
   * Move a component up
   */
  function moveComponentUp(instanceId) {
    if (!state.currentProject || !state.currentProject.components) return;
    
    // Find component index
    const index = state.currentProject.components.findIndex(c => c.id === instanceId);
    if (index <= 0) return;
    
    // Swap with previous component
    const temp = state.currentProject.components[index];
    state.currentProject.components[index] = state.currentProject.components[index - 1];
    state.currentProject.components[index - 1] = temp;
    
    // Update UI
    renderProjectComponents();
    
    // Save project
    saveCurrentProject();
  }
  
  /**
   * Move a component down
   */
  function moveComponentDown(instanceId) {
    if (!state.currentProject || !state.currentProject.components) return;
    
    // Find component index
    const index = state.currentProject.components.findIndex(c => c.id === instanceId);
    if (index === -1 || index >= state.currentProject.components.length - 1) return;
    
    // Swap with next component
    const temp = state.currentProject.components[index];
    state.currentProject.components[index] = state.currentProject.components[index + 1];
    state.currentProject.components[index + 1] = temp;
    
    // Update UI
    renderProjectComponents();
    
    // Save project
    saveCurrentProject();
  }
  
  /**
   * Select a component for editing
   */
  function selectComponent(instanceId) {
    if (!state.currentProject || !state.currentProject.components) return;
    
    // Find component
    const component = state.currentProject.components.find(c => c.id === instanceId);
    if (!component) return;
    
    // Set as selected component
    state.selectedComponent = component;
    
    // Highlight component in UI
    document.querySelectorAll('.builder-component').forEach(el => {
      el.classList.remove('selected');
      if (el.getAttribute('data-instance-id') === instanceId) {
        el.classList.add('selected');
      }
    });
    
    // Render properties panel
    const componentTemplate = availableComponents.find(c => c.id === component.componentId);
    renderPropertiesPanel(componentTemplate, component);
    
    // Switch to properties tab
    const propertiesTab = document.querySelector('.sidebar-tab[data-tab="properties-tab"]');
    if (propertiesTab) {
      propertiesTab.click();
    }
  }
  
  /**
   * Render properties panel for a component
   */
  function renderPropertiesPanel(componentTemplate, componentInstance) {
    if (!elements.propertiesPanel) return;
    
    // Clear panel
    elements.propertiesPanel.innerHTML = '';
    
    if (!componentTemplate || !componentInstance) {
      elements.propertiesPanel.innerHTML = '<p class="text-muted">Select a component to edit properties</p>';
      return;
    }
    
    // Component title
    const titleEl = document.createElement('h4');
    titleEl.textContent = componentTemplate.name;
    elements.propertiesPanel.appendChild(titleEl);
    
    // Component description
    if (componentTemplate.description) {
      const descEl = document.createElement('p');
      descEl.className = 'text-muted';
      descEl.textContent = componentTemplate.description;
      elements.propertiesPanel.appendChild(descEl);
    }
    
    // Properties form
    const formEl = document.createElement('form');
    formEl.id = 'properties-form';
    
    // Add fields for each property
    componentTemplate.properties.forEach(prop => {
      const groupEl = document.createElement('div');
      groupEl.className = 'mb-3';
      
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = prop.label;
      labelEl.setAttribute('for', `prop-${prop.name}`);
      
      let inputEl;
      
      switch(prop.type) {
        case 'text':
          inputEl = document.createElement('input');
          inputEl.type = 'text';
          inputEl.className = 'form-control';
          break;
          
        case 'textarea':
          inputEl = document.createElement('textarea');
          inputEl.className = 'form-control';
          inputEl.rows = 5;
          break;
          
        case 'code':
          inputEl = document.createElement('textarea');
          inputEl.className = 'form-control code-editor';
          inputEl.rows = 10;
          inputEl.setAttribute('data-language', prop.language || 'php');
          break;
          
        case 'select':
          inputEl = document.createElement('select');
          inputEl.className = 'form-select';
          
          // Add options
          if (prop.options) {
            prop.options.forEach(option => {
              const optionEl = document.createElement('option');
              optionEl.value = option.value;
              optionEl.textContent = option.label;
              inputEl.appendChild(optionEl);
            });
          }
          break;
          
        case 'color':
          inputEl = document.createElement('input');
          inputEl.type = 'color';
          inputEl.className = 'form-control form-control-color';
          break;
          
        case 'number':
          inputEl = document.createElement('input');
          inputEl.type = 'number';
          inputEl.className = 'form-control';
          break;
          
        case 'checkbox':
          inputEl = document.createElement('input');
          inputEl.type = 'checkbox';
          inputEl.className = 'form-check-input';
          labelEl.className = 'form-check-label';
          break;
          
        default:
          inputEl = document.createElement('input');
          inputEl.type = 'text';
          inputEl.className = 'form-control';
      }
      
      // Set attributes
      inputEl.id = `prop-${prop.name}`;
      inputEl.name = prop.name;
      inputEl.value = componentInstance.props[prop.name] || '';
      
      if (prop.type === 'checkbox') {
        inputEl.checked = componentInstance.props[prop.name] === true;
      }
      
      // Add description if available
      let descriptionEl = null;
      if (prop.description) {
        descriptionEl = document.createElement('div');
        descriptionEl.className = 'form-text';
        descriptionEl.textContent = prop.description;
      }
      
      // Handle change event
      inputEl.addEventListener('change', () => {
        let value = prop.type === 'checkbox' ? inputEl.checked : inputEl.value;
        
        // Update component property
        componentInstance.props[prop.name] = value;
        
        // Update UI
        renderProjectComponents();
        
        // Save project
        saveCurrentProject();
      });
      
      // Assemble property group
      if (prop.type === 'checkbox') {
        const checkWrapperEl = document.createElement('div');
        checkWrapperEl.className = 'form-check';
        checkWrapperEl.appendChild(inputEl);
        checkWrapperEl.appendChild(labelEl);
        groupEl.appendChild(checkWrapperEl);
      } else {
        groupEl.appendChild(labelEl);
        groupEl.appendChild(inputEl);
      }
      
      if (descriptionEl) {
        groupEl.appendChild(descriptionEl);
      }
      
      formEl.appendChild(groupEl);
    });
    
    elements.propertiesPanel.appendChild(formEl);
  }
  
  /**
   * Show preview of the current project
   */
  function showPreview() {
    if (!state.currentProject) {
      showToast('error', 'No active project to preview');
      return;
    }
    
    if (!elements.previewFrame) return;
    
    // Generate HTML
    const html = generateProjectHtml();
    
    // Load HTML into iframe
    const doc = elements.previewFrame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    
    // Set up PHP-WASM in the iframe
    setupPhpWasmInPreview(elements.previewFrame);
    
    // Show modal
    modals.preview.show();
  }
  
  /**
   * Generate HTML for the current project
   */
  function generateProjectHtml() {
    if (!state.currentProject) return '';
    
    // Generate components HTML
    let componentsHtml = '';
    
    if (state.currentProject.components && state.currentProject.components.length > 0) {
      componentsHtml = state.currentProject.components.map(component => {
        const componentTemplate = availableComponents.find(c => c.id === component.componentId);
        if (!componentTemplate) return '';
        
        let html = componentTemplate.template;
        
        // Replace placeholders with values
        Object.entries(component.props).forEach(([key, value]) => {
          const regex = new RegExp(`{{ ${key} }}`, 'g');
          html = html.replace(regex, value);
        });
        
        return html;
      }).join('\n');
    }
    
    // Get theme CSS link
    let themeCssLink = '';
    switch (state.currentProject.theme) {
      case 'bootstrap':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet">';
        break;
      case 'material':
        themeCssLink = '<link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">';
        break;
      case 'bulma':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css" rel="stylesheet">';
        break;
      case 'tailwind':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">';
        break;
    }
    
    // Generate full HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(state.currentProject.name)}</title>
  
  <!-- PHP-WASM Script -->
  <script async type="module" src="https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs"></script>
  
  <!-- Theme CSS -->
  ${themeCssLink}
  
  <!-- Custom Styles -->
  <style>
  ${state.currentProject.customStyles || ''}
  </style>
</head>
<body>
  <div class="container py-4">
    ${componentsHtml}
  </div>
  
  <!-- Custom Scripts -->
  <script>
  ${state.currentProject.customScripts || ''}
  </script>
</body>
</html>`;
  }
  
  /**
   * Set up PHP-WASM in the preview iframe
   */
  function setupPhpWasmInPreview(iframe) {
    // Wait for PHP-WASM to be loaded in the iframe
    const checkPhpWasm = () => {
      if (iframe.contentWindow.PHP) {
        // PHP-WASM is loaded
        console.log('PHP-WASM loaded in preview');
      } else {
        // Check again in 100ms
        setTimeout(checkPhpWasm, 100);
      }
    };
    
    checkPhpWasm();
  }
  
  /**
   * Export the current project
   */
  function exportProject() {
    if (!state.currentProject) {
      showToast('error', 'No active project to export');
      return;
    }
    
    const format = window.prompt('Choose export format:\n1 - Standalone HTML\n2 - PHP Files\n3 - WordPress Plugin', '1');
    
    switch (format) {
      case '1':
        exportStandaloneHtml();
        break;
      case '2':
        exportPhpFiles();
        break;
      case '3':
        exportWordPressPlugin();
        break;
      default:
        showToast('info', 'Export cancelled');
    }
  }
  
  /**
   * Export project as standalone HTML with PHP-WASM
   */
  function exportStandaloneHtml() {
    // Generate HTML
    const html = generateProjectHtml();
    
    // Create download link
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('success', 'Project exported as standalone HTML');
  }
  
  /**
   * Export project as PHP files
   */
  function exportPhpFiles() {
    // Create a zip file containing all project files
    // Would require a zip library like JSZip
    
    showToast('info', 'PHP files export coming soon');
  }
  
  /**
   * Export project as WordPress plugin
   */
  function exportWordPressPlugin() {
    // Create a WordPress plugin based on the project
    // Would require a zip library like JSZip
    
    showToast('info', 'WordPress plugin export coming soon');
  }
  
  /**
   * Update status display
   */
  function updateStatus(component, status, error = null) {
    console.log(`${component} status: ${status}`);
    
    // TODO: Implement status display in UI
  }
  
  /**
   * Show a toast notification
   */
  function showToast(type, message) {
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${escapeHtml(message)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add to document
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      // Create toast container
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
      container.appendChild(toastEl);
    } else {
      toastContainer.appendChild(toastEl);
    }
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
      delay: 5000
    });
    toast.show();
    
    // Remove after hiding
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
  
  /**
   * Helper function to escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Public API
  return {
    initialize,
    createNewProject,
    saveCurrentProject,
    loadProject,
    exportProject,
    showPreview,
    addComponent,
    removeComponent,
    moveComponentUp,
    moveComponentDown,
    selectComponent,
    getState: () => ({ ...state })
  };
})();

// Initialize the builder when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize PHP-WASM Builder
  PHPWasmBuilder.initialize();
});