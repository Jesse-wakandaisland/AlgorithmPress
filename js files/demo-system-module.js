/**
 * Demonstration System Module for AlgorithmPress
 * A system for showcasing and generating demo applications
 */

const DemoSystem = (function() {
  'use strict';
  
  // Module state
  let _initialized = false;
  let _panel = null;
  let _panelVisible = false;
  
  // Demo categories
  const _categories = [
    {
      id: 'web-app',
      name: 'Web Applications',
      description: 'Web-based applications and demos',
      icon: 'globe'
    },
    {
      id: 'business',
      name: 'Business Applications',
      description: 'Business management and productivity tools',
      icon: 'briefcase'
    },
    {
      id: 'education',
      name: 'Educational Resources',
      description: 'Learning materials and interactive education tools',
      icon: 'graduation-cap'
    },
    {
      id: 'productivity',
      name: 'Productivity Tools',
      description: 'Tools to enhance productivity and workflow',
      icon: 'tasks'
    },
    {
      id: 'games',
      name: 'Games & Entertainment',
      description: 'Interactive games and entertainment applications',
      icon: 'gamepad'
    }
  ];
  
  // Demo templates
  const _templates = [
    {
      id: 'todo-app',
      name: 'Todo Application',
      description: 'A simple todo list application with CRUD operations',
      category: 'productivity',
      image: 'todo-app.jpg',
      difficulty: 'beginner',
      technologies: ['PHP', 'HTML', 'CSS', 'JavaScript'],
      features: [
        'Add, edit, and delete tasks',
        'Mark tasks as complete',
        'Filter tasks by status',
        'Local storage persistence'
      ]
    },
    {
      id: 'blog-system',
      name: 'Blog System',
      description: 'A functional blog system with posts and comments',
      category: 'web-app',
      image: 'blog-system.jpg',
      difficulty: 'intermediate',
      technologies: ['PHP', 'MySQL', 'Bootstrap', 'jQuery'],
      features: [
        'Create and manage blog posts',
        'Comment system',
        'Categories and tags',
        'User authentication'
      ]
    },
    {
      id: 'e-commerce',
      name: 'E-Commerce Store',
      description: 'A simple e-commerce store with product listings and cart',
      category: 'business',
      image: 'e-commerce.jpg',
      difficulty: 'advanced',
      technologies: ['PHP', 'MySQL', 'Bootstrap', 'JavaScript'],
      features: [
        'Product catalog',
        'Shopping cart',
        'Checkout process',
        'Order management'
      ]
    },
    {
      id: 'quiz-app',
      name: 'Interactive Quiz',
      description: 'An interactive quiz application with multiple choice questions',
      category: 'education',
      image: 'quiz-app.jpg',
      difficulty: 'beginner',
      technologies: ['PHP', 'HTML', 'CSS', 'JavaScript'],
      features: [
        'Multiple choice questions',
        'Score tracking',
        'Timer',
        'Results summary'
      ]
    },
    {
      id: 'memory-game',
      name: 'Memory Game',
      description: 'A card matching memory game',
      category: 'games',
      image: 'memory-game.jpg',
      difficulty: 'beginner',
      technologies: ['HTML', 'CSS', 'JavaScript'],
      features: [
        'Card matching gameplay',
        'Score tracking',
        'Timer',
        'Difficulty levels'
      ]
    },
    {
      id: 'inventory-system',
      name: 'Inventory Management',
      description: 'An inventory management system for small businesses',
      category: 'business',
      image: 'inventory-system.jpg',
      difficulty: 'intermediate',
      technologies: ['PHP', 'MySQL', 'Bootstrap', 'jQuery'],
      features: [
        'Product management',
        'Stock tracking',
        'Order processing',
        'Reports and analytics'
      ]
    },
    {
      id: 'weather-app',
      name: 'Weather Dashboard',
      description: 'A weather dashboard showing current conditions and forecast',
      category: 'web-app',
      image: 'weather-app.jpg',
      difficulty: 'intermediate',
      technologies: ['PHP', 'JavaScript', 'APIs', 'Chart.js'],
      features: [
        'Current weather conditions',
        '5-day forecast',
        'Location search',
        'Weather maps'
      ]
    },
    {
      id: 'chat-application',
      name: 'Chat Application',
      description: 'A real-time chat application',
      category: 'web-app',
      image: 'chat-application.jpg',
      difficulty: 'advanced',
      technologies: ['PHP', 'WebSockets', 'JavaScript', 'MySQL'],
      features: [
        'Real-time messaging',
        'User authentication',
        'Message history',
        'User presence indicators'
      ]
    },
    {
      id: 'flashcards',
      name: 'Flashcard Study App',
      description: 'A flashcard application for studying',
      category: 'education',
      image: 'flashcards.jpg',
      difficulty: 'beginner',
      technologies: ['PHP', 'HTML', 'CSS', 'JavaScript'],
      features: [
        'Create and manage flashcard decks',
        'Study mode with card flipping',
        'Progress tracking',
        'Spaced repetition algorithm'
      ]
    },
    {
      id: 'snake-game',
      name: 'Snake Game',
      description: 'A classic snake game implementation',
      category: 'games',
      image: 'snake-game.jpg',
      difficulty: 'intermediate',
      technologies: ['HTML', 'CSS', 'JavaScript'],
      features: [
        'Classic snake gameplay',
        'Score tracking',
        'Increasing difficulty',
        'Game over and restart'
      ]
    },
    {
      id: 'kanban-board',
      name: 'Kanban Board',
      description: 'A Kanban board for task management',
      category: 'productivity',
      image: 'kanban-board.jpg',
      difficulty: 'intermediate',
      technologies: ['PHP', 'MySQL', 'JavaScript', 'Drag & Drop API'],
      features: [
        'Customizable columns',
        'Drag and drop task cards',
        'Task details and comments',
        'Progress tracking'
      ]
    },
    {
      id: 'note-taking',
      name: 'Note Taking App',
      description: 'A simple note taking application',
      category: 'productivity',
      image: 'note-taking.jpg',
      difficulty: 'beginner',
      technologies: ['PHP', 'HTML', 'CSS', 'JavaScript'],
      features: [
        'Create, edit, and delete notes',
        'Rich text editor',
        'Tags and categories',
        'Search functionality'
      ]
    }
  ];
  
  // Current selected category
  let _selectedCategory = 'all';
  
  // Current selected template
  let _selectedTemplate = null;
  
  /**
   * Initialize the demo system
   * @param {Object} options - Initialization options
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  function initialize(options = {}) {
    return new Promise((resolve) => {
      if (_initialized) {
        console.warn('Demo system already initialized');
        resolve();
        return;
      }
      
      console.log('Initializing Demo System...');
      
      // Create panel
      createPanel();
      
      // Register with module framework if available
      if (window.ModuleFramework) {
        window.ModuleFramework.registerModule({
          id: 'demo-system',
          name: 'Demonstration System',
          version: '1.0.0',
          instance: DemoSystem,
          status: window.ModuleFramework.MODULE_STATUS.ACTIVE
        });
      }
      
      // Register Demo System API if API Gateway is available
      if (window.ApiGateway) {
        window.ApiGateway.registerApi({
          namespace: 'demo-system',
          provider: 'demo-system',
          version: '1.0.0',
          description: 'Demo System API for accessing demo templates',
          methods: {
            getCategories: {
              handler: function() {
                return _categories;
              },
              permissions: ['*'],
              description: 'Get all demo categories'
            },
            getTemplates: {
              handler: function(params) {
                const category = params.category || 'all';
                return getTemplatesByCategory(category);
              },
              permissions: ['*'],
              description: 'Get demo templates by category',
              schema: {
                properties: {
                  category: { type: 'string' }
                }
              }
            },
            getTemplate: {
              handler: function(params) {
                return getTemplateById(params.id);
              },
              permissions: ['*'],
              description: 'Get demo template by ID',
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
      console.log('Demo System initialized');
      
      resolve();
    });
  }
  
  /**
   * Create demo system panel
   */
  function createPanel() {
    // Check if panel already exists
    if (_panel) return;
    
    // Create panel element
    _panel = document.createElement('div');
    _panel.id = 'demo-system-panel';
    _panel.className = 'system-panel demo-system-panel hidden';
    
    _panel.innerHTML = `
      <div class="panel-header">
        <h2>Demonstration System</h2>
        <div class="panel-controls">
          <button class="panel-close-btn" id="demo-system-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="panel-body">
        <div class="demo-system-container">
          <div class="demo-sidebar">
            <div class="categories-section">
              <h3>Categories</h3>
              <div class="categories-list">
                <div class="category-item active" data-category="all">
                  <i class="fas fa-th-large"></i>
                  <span>All Categories</span>
                </div>
                ${_categories.map(category => `
                  <div class="category-item" data-category="${category.id}">
                    <i class="fas fa-${category.icon}"></i>
                    <span>${category.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="filters-section">
              <h3>Filters</h3>
              <div class="filter-group">
                <label>Difficulty</label>
                <div class="filter-options">
                  <label class="filter-option">
                    <input type="checkbox" value="beginner" checked> Beginner
                  </label>
                  <label class="filter-option">
                    <input type="checkbox" value="intermediate" checked> Intermediate
                  </label>
                  <label class="filter-option">
                    <input type="checkbox" value="advanced" checked> Advanced
                  </label>
                </div>
              </div>
              <div class="filter-group">
                <label>Technologies</label>
                <div class="filter-options">
                  <label class="filter-option">
                    <input type="checkbox" value="PHP" checked> PHP
                  </label>
                  <label class="filter-option">
                    <input type="checkbox" value="JavaScript" checked> JavaScript
                  </label>
                  <label class="filter-option">
                    <input type="checkbox" value="MySQL" checked> MySQL
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="demo-content">
            <div class="demo-search">
              <div class="search-box">
                <input type="text" id="demo-search-input" placeholder="Search demos...">
                <button id="demo-search-btn">
                  <i class="fas fa-search"></i>
                </button>
              </div>
              <div class="view-options">
                <button class="view-option active" data-view="grid">
                  <i class="fas fa-th-large"></i>
                </button>
                <button class="view-option" data-view="list">
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
            <div class="demo-templates view-grid" id="demo-templates">
              <!-- Templates will be loaded here -->
            </div>
          </div>
        </div>
        <div class="demo-details hidden" id="demo-details">
          <!-- Template details will be shown here -->
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(_panel);
    
    // Add close button event listener
    document.getElementById('demo-system-close-btn')?.addEventListener('click', function() {
      togglePanel();
    });
    
    // Add category selection
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', function() {
        // Update selected category
        _selectedCategory = this.getAttribute('data-category');
        
        // Update active class
        document.querySelectorAll('.category-item').forEach(cat => {
          cat.classList.remove('active');
        });
        this.classList.add('active');
        
        // Load templates for selected category
        loadTemplates();
      });
    });
    
    // Add view option selection
    document.querySelectorAll('.view-option').forEach(option => {
      option.addEventListener('click', function() {
        // Update active class
        document.querySelectorAll('.view-option').forEach(opt => {
          opt.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update view mode
        const viewMode = this.getAttribute('data-view');
        const templatesContainer = document.getElementById('demo-templates');
        
        if (viewMode === 'grid') {
          templatesContainer.classList.remove('view-list');
          templatesContainer.classList.add('view-grid');
        } else {
          templatesContainer.classList.remove('view-grid');
          templatesContainer.classList.add('view-list');
        }
      });
    });
    
    // Add search functionality
    document.getElementById('demo-search-btn')?.addEventListener('click', function() {
      const searchQuery = document.getElementById('demo-search-input').value.toLowerCase();
      searchTemplates(searchQuery);
    });
    
    document.getElementById('demo-search-input')?.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        const searchQuery = this.value.toLowerCase();
        searchTemplates(searchQuery);
      }
    });
    
    // Add filter functionality
    document.querySelectorAll('.filter-option input').forEach(filter => {
      filter.addEventListener('change', function() {
        loadTemplates();
      });
    });
    
    // Load initial templates
    loadTemplates();
  }
  
  /**
   * Load templates for the selected category
   */
  function loadTemplates() {
    const templatesContainer = document.getElementById('demo-templates');
    if (!templatesContainer) return;
    
    // Get templates for selected category
    let templates = getTemplatesByCategory(_selectedCategory);
    
    // Apply filters
    const selectedDifficulties = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"][value="beginner"], .filter-option input[type="checkbox"][value="intermediate"], .filter-option input[type="checkbox"][value="advanced"]'))
      .filter(input => input.checked)
      .map(input => input.value);
    
    const selectedTechnologies = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"][value="PHP"], .filter-option input[type="checkbox"][value="JavaScript"], .filter-option input[type="checkbox"][value="MySQL"]'))
      .filter(input => input.checked)
      .map(input => input.value);
    
    if (selectedDifficulties.length > 0) {
      templates = templates.filter(template => selectedDifficulties.includes(template.difficulty));
    }
    
    if (selectedTechnologies.length > 0) {
      templates = templates.filter(template => {
        return template.technologies.some(tech => selectedTechnologies.includes(tech));
      });
    }
    
    // Render templates
    if (templates.length === 0) {
      templatesContainer.innerHTML = `
        <div class="no-templates">
          <i class="fas fa-search"></i>
          <p>No templates found</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    templates.forEach(template => {
      html += `
        <div class="template-card" data-template-id="${template.id}">
          <div class="template-image">
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'><rect width='200' height='150' fill='%23282c34'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23abb2bf' font-family='Arial' font-size='18'>${template.name}</text></svg>" alt="${template.name}">
          </div>
          <div class="template-info">
            <h4 class="template-name">${template.name}</h4>
            <p class="template-description">${template.description}</p>
            <div class="template-meta">
              <span class="template-difficulty ${template.difficulty}">
                <i class="fas fa-${getDifficultyIcon(template.difficulty)}"></i> ${capitalize(template.difficulty)}
              </span>
              <span class="template-category">
                <i class="fas fa-${getCategoryIcon(template.category)}"></i> ${getCategoryName(template.category)}
              </span>
            </div>
          </div>
          <div class="template-actions">
            <button class="btn btn-primary template-preview-btn" data-template-id="${template.id}">
              Preview
            </button>
            <button class="btn btn-success template-create-btn" data-template-id="${template.id}">
              Create
            </button>
          </div>
        </div>
      `;
    });
    
    templatesContainer.innerHTML = html;
    
    // Add template card click events
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', function(e) {
        // Ignore clicks on buttons
        if (e.target.closest('.template-actions')) return;
        
        const templateId = this.getAttribute('data-template-id');
        showTemplateDetails(templateId);
      });
    });
    
    // Add preview button click events
    document.querySelectorAll('.template-preview-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const templateId = this.getAttribute('data-template-id');
        previewTemplate(templateId);
      });
    });
    
    // Add create button click events
    document.querySelectorAll('.template-create-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const templateId = this.getAttribute('data-template-id');
        createFromTemplate(templateId);
      });
    });
  }
  
  /**
   * Search templates by query
   * @param {string} query - Search query
   */
  function searchTemplates(query) {
    const templatesContainer = document.getElementById('demo-templates');
    if (!templatesContainer) return;
    
    if (!query) {
      loadTemplates();
      return;
    }
    
    // Filter templates by query
    const filteredTemplates = _templates.filter(template => {
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.technologies.some(tech => tech.toLowerCase().includes(query))
      );
    });
    
    // Update templates display
    if (filteredTemplates.length === 0) {
      templatesContainer.innerHTML = `
        <div class="no-templates">
          <i class="fas fa-search"></i>
          <p>No templates found for "${query}"</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    filteredTemplates.forEach(template => {
      html += `
        <div class="template-card" data-template-id="${template.id}">
          <div class="template-image">
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'><rect width='200' height='150' fill='%23282c34'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23abb2bf' font-family='Arial' font-size='18'>${template.name}</text></svg>" alt="${template.name}">
          </div>
          <div class="template-info">
            <h4 class="template-name">${template.name}</h4>
            <p class="template-description">${template.description}</p>
            <div class="template-meta">
              <span class="template-difficulty ${template.difficulty}">
                <i class="fas fa-${getDifficultyIcon(template.difficulty)}"></i> ${capitalize(template.difficulty)}
              </span>
              <span class="template-category">
                <i class="fas fa-${getCategoryIcon(template.category)}"></i> ${getCategoryName(template.category)}
              </span>
            </div>
          </div>
          <div class="template-actions">
            <button class="btn btn-primary template-preview-btn" data-template-id="${template.id}">
              Preview
            </button>
            <button class="btn btn-success template-create-btn" data-template-id="${template.id}">
              Create
            </button>
          </div>
        </div>
      `;
    });
    
    templatesContainer.innerHTML = html;
    
    // Add template card click events
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', function(e) {
        // Ignore clicks on buttons
        if (e.target.closest('.template-actions')) return;
        
        const templateId = this.getAttribute('data-template-id');
        showTemplateDetails(templateId);
      });
    });
    
    // Add preview button click events
    document.querySelectorAll('.template-preview-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const templateId = this.getAttribute('data-template-id');
        previewTemplate(templateId);
      });
    });
    
    // Add create button click events
    document.querySelectorAll('.template-create-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const templateId = this.getAttribute('data-template-id');
        createFromTemplate(templateId);
      });
    });
  }
  
  /**
   * Show template details
   * @param {string} templateId - Template ID
   */
  function showTemplateDetails(templateId) {
    const template = getTemplateById(templateId);
    if (!template) return;
    
    // Store selected template
    _selectedTemplate = template;
    
    // Update UI
    document.querySelector('.demo-system-container').classList.add('hidden');
    
    const detailsContainer = document.getElementById('demo-details');
    detailsContainer.classList.remove('hidden');
    
    detailsContainer.innerHTML = `
      <div class="details-header">
        <button class="btn btn-link back-btn">
          <i class="fas fa-arrow-left"></i> Back to Templates
        </button>
      </div>
      <div class="template-details">
        <div class="template-header">
          <h3>${template.name}</h3>
          <div class="template-badges">
            <span class="template-difficulty ${template.difficulty}">
              <i class="fas fa-${getDifficultyIcon(template.difficulty)}"></i> ${capitalize(template.difficulty)}
            </span>
            <span class="template-category">
              <i class="fas fa-${getCategoryIcon(template.category)}"></i> ${getCategoryName(template.category)}
            </span>
          </div>
        </div>
        <div class="template-content">
          <div class="template-preview">
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23282c34'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23abb2bf' font-family='Arial' font-size='24'>${template.name}</text></svg>" alt="${template.name}">
          </div>
          <div class="template-info-details">
            <div class="template-description-full">
              <h4>Description</h4>
              <p>${template.description}</p>
            </div>
            <div class="template-tech">
              <h4>Technologies</h4>
              <div class="tech-tags">
                ${template.technologies.map(tech => `
                  <span class="tech-tag">${tech}</span>
                `).join('')}
              </div>
            </div>
            <div class="template-features">
              <h4>Features</h4>
              <ul>
                ${template.features.map(feature => `
                  <li><i class="fas fa-check"></i> ${feature}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
        <div class="template-actions-full">
          <button class="btn btn-primary template-preview-btn-full" data-template-id="${template.id}">
            <i class="fas fa-eye"></i> Preview Demo
          </button>
          <button class="btn btn-success template-create-btn-full" data-template-id="${template.id}">
            <i class="fas fa-plus"></i> Create From Template
          </button>
        </div>
      </div>
    `;
    
    // Add back button event
    detailsContainer.querySelector('.back-btn')?.addEventListener('click', function() {
      document.querySelector('.demo-system-container').classList.remove('hidden');
      detailsContainer.classList.add('hidden');
      _selectedTemplate = null;
    });
    
    // Add preview button event
    detailsContainer.querySelector('.template-preview-btn-full')?.addEventListener('click', function() {
      previewTemplate(templateId);
    });
    
    // Add create button event
    detailsContainer.querySelector('.template-create-btn-full')?.addEventListener('click', function() {
      createFromTemplate(templateId);
    });
  }
  
  /**
   * Preview a template
   * @param {string} templateId - Template ID
   */
  function previewTemplate(templateId) {
    const template = getTemplateById(templateId);
    if (!template) return;
    
    // Create preview dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${template.name} Preview</h3>
            <button class="modal-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="preview-container">
              <iframe src="about:blank" frameborder="0" style="width: 100%; height: 600px; border: 1px solid #ccc;"></iframe>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success create-from-preview-btn" data-template-id="${template.id}">Create From Template</button>
            <button class="btn btn-secondary close-preview-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(dialog);
    
    // Simulate loading preview
    const iframe = dialog.querySelector('iframe');
    iframe.onload = function() {
      if (iframe.src === 'about:blank') {
        // Generate preview HTML based on template
        let previewHtml = '';
        
        switch (template.id) {
          case 'todo-app':
            previewHtml = generateTodoAppPreview();
            break;
            
          case 'blog-system':
            previewHtml = generateBlogSystemPreview();
            break;
            
          default:
            previewHtml = generateGenericPreview(template);
            break;
        }
        
        // Set preview content
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    };
    
    // Set initial src to trigger onload
    iframe.src = 'about:blank';
    
    // Add close button event
    dialog.querySelector('.modal-close-btn')?.addEventListener('click', function() {
      dialog.remove();
    });
    
    dialog.querySelector('.close-preview-btn')?.addEventListener('click', function() {
      dialog.remove();
    });
    
    // Add create button event
    dialog.querySelector('.create-from-preview-btn')?.addEventListener('click', function() {
      dialog.remove();
      createFromTemplate(templateId);
    });
  }
  
  /**
   * Create a project from template
   * @param {string} templateId - Template ID
   */
  function createFromTemplate(templateId) {
    const template = getTemplateById(templateId);
    if (!template) return;
    
    // Create configuration dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Create ${template.name}</h3>
            <button class="modal-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="config-form">
              <div class="form-group">
                <label for="project-name">Project Name</label>
                <input type="text" id="project-name" class="form-control" value="${template.name}">
              </div>
              <div class="form-group">
                <label for="project-description">Description</label>
                <textarea id="project-description" class="form-control" rows="3">${template.description}</textarea>
              </div>
              <div class="form-check">
                <input type="checkbox" id="include-demo-data" class="form-check-input" checked>
                <label for="include-demo-data" class="form-check-label">Include Demo Data</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="include-documentation" class="form-check-input" checked>
                <label for="include-documentation" class="form-check-label">Include Documentation</label>
              </div>
            </div>
            <div class="creation-progress hidden">
              <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <p class="progress-status">Preparing project...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary create-project-btn">Create Project</button>
            <button class="btn btn-secondary cancel-create-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(dialog);
    
    // Add close button event
    dialog.querySelector('.modal-close-btn')?.addEventListener('click', function() {
      dialog.remove();
    });
    
    dialog.querySelector('.cancel-create-btn')?.addEventListener('click', function() {
      dialog.remove();
    });
    
    // Add create button event
    dialog.querySelector('.create-project-btn')?.addEventListener('click', function() {
      // Get configuration
      const config = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        includeDemoData: document.getElementById('include-demo-data').checked,
        includeDocumentation: document.getElementById('include-documentation').checked
      };
      
      // Show progress
      dialog.querySelector('.config-form').classList.add('hidden');
      dialog.querySelector('.creation-progress').classList.remove('hidden');
      dialog.querySelector('.create-project-btn').disabled = true;
      dialog.querySelector('.cancel-create-btn').disabled = true;
      
      // Simulate project creation
      let progress = 0;
      const progressBar = dialog.querySelector('.progress-bar');
      const progressStatus = dialog.querySelector('.progress-status');
      
      const progressInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        
        if (progress === 25) {
          progressStatus.textContent = 'Generating project files...';
        } else if (progress === 50) {
          progressStatus.textContent = 'Adding template code...';
        } else if (progress === 75) {
          progressStatus.textContent = 'Finalizing project...';
        }
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          progressStatus.textContent = 'Project created successfully!';
          
          // Enable close button
          dialog.querySelector('.cancel-create-btn').disabled = false;
          dialog.querySelector('.cancel-create-btn').textContent = 'Close';
          
          // Add open project button
          const openProjectBtn = document.createElement('button');
          openProjectBtn.className = 'btn btn-success open-project-btn';
          openProjectBtn.textContent = 'Open Project';
          
          dialog.querySelector('.modal-footer').insertBefore(openProjectBtn, dialog.querySelector('.cancel-create-btn'));
          
          openProjectBtn.addEventListener('click', function() {
            // Simulate opening project
            showToast('success', `Project "${config.name}" opened`);
            dialog.remove();
          });
        }
      }, 200);
    });
  }
  
  /**
   * Generate Todo App preview HTML
   * @returns {string} Preview HTML
   */
  function generateTodoAppPreview() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Todo App</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .todo-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 20px;
          }
          .todo-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .todo-header h1 {
            color: #007bff;
            font-size: 1.8rem;
          }
          .todo-input-group {
            display: flex;
            margin-bottom: 20px;
          }
          .todo-input-group input {
            flex: 1;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
          }
          .todo-input-group button {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
          .todo-filters {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          .todo-item {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #e9ecef;
          }
          .todo-item:last-child {
            border-bottom: none;
          }
          .todo-check {
            margin-right: 10px;
          }
          .todo-text {
            flex: 1;
          }
          .todo-text.completed {
            text-decoration: line-through;
            color: #6c757d;
          }
          .todo-actions {
            display: flex;
            gap: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="todo-container">
            <div class="todo-header">
              <h1>Todo App</h1>
              <p>Keep track of your tasks easily</p>
            </div>
            
            <div class="todo-input-group">
              <input type="text" class="form-control" placeholder="Add a new task...">
              <button class="btn btn-primary">Add</button>
            </div>
            
            <div class="todo-filters">
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-primary active">All</button>
                <button type="button" class="btn btn-outline-primary">Active</button>
                <button type="button" class="btn btn-outline-primary">Completed</button>
              </div>
            </div>
            
            <div class="todo-list">
              <div class="todo-item">
                <input type="checkbox" class="todo-check form-check-input">
                <span class="todo-text">Complete the PHP project</span>
                <div class="todo-actions">
                  <button class="btn btn-sm btn-outline-primary">Edit</button>
                  <button class="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
              
              <div class="todo-item">
                <input type="checkbox" class="todo-check form-check-input" checked>
                <span class="todo-text completed">Read documentation</span>
                <div class="todo-actions">
                  <button class="btn btn-sm btn-outline-primary">Edit</button>
                  <button class="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
              
              <div class="todo-item">
                <input type="checkbox" class="todo-check form-check-input">
                <span class="todo-text">Prepare presentation</span>
                <div class="todo-actions">
                  <button class="btn btn-sm btn-outline-primary">Edit</button>
                  <button class="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
              
              <div class="todo-item">
                <input type="checkbox" class="todo-check form-check-input">
                <span class="todo-text">Meeting with team</span>
                <div class="todo-actions">
                  <button class="btn btn-sm btn-outline-primary">Edit</button>
                  <button class="btn btn-sm btn-outline-danger">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Simple interaction for the preview
          document.querySelectorAll('.todo-check').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
              const todoText = this.nextElementSibling;
              if (this.checked) {
                todoText.classList.add('completed');
              } else {
                todoText.classList.remove('completed');
              }
            });
          });
          
          document.querySelectorAll('.todo-filters .btn').forEach(btn => {
            btn.addEventListener('click', function() {
              document.querySelectorAll('.todo-filters .btn').forEach(b => b.classList.remove('active'));
              this.classList.add('active');
            });
          });
        </script>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate Blog System preview HTML
   * @returns {string} Preview HTML
   */
  function generateBlogSystemPreview() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blog System</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            padding-top: 20px;
          }
          .blog-header {
            padding: 20px 0;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 30px;
          }
          .blog-title {
            font-size: 2.5rem;
            color: #212529;
          }
          .blog-description {
            color: #6c757d;
          }
          .blog-post {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            padding: 20px;
            margin-bottom: 30px;
          }
          .blog-post-title {
            color: #343a40;
          }
          .blog-post-meta {
            color: #6c757d;
            margin-bottom: 20px;
            font-size: 0.9rem;
          }
          .blog-post-content {
            line-height: 1.6;
          }
          .blog-sidebar {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            padding: 20px;
            margin-bottom: 30px;
          }
          .blog-sidebar-title {
            font-size: 1.2rem;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
          }
          .blog-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .blog-tag {
            background-color: #e9ecef;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.85rem;
            color: #495057;
            text-decoration: none;
          }
          .blog-tag:hover {
            background-color: #dee2e6;
            color: #212529;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="blog-header text-center">
            <h1 class="blog-title">My Blog</h1>
            <p class="blog-description">A simple blog system built with PHP and Bootstrap</p>
          </div>
          
          <div class="row">
            <div class="col-md-8">
              <div class="blog-post">
                <h2 class="blog-post-title">Getting Started with PHP</h2>
                <div class="blog-post-meta">
                  <span><i class="fas fa-user"></i> Admin</span> &middot;
                  <span><i class="fas fa-calendar"></i> June 10, 2023</span> &middot;
                  <span><i class="fas fa-folder"></i> Tutorials</span> &middot;
                  <span><i class="fas fa-comments"></i> 5 Comments</span>
                </div>
                <div class="blog-post-content">
                  <p>PHP is a widely-used open-source general-purpose scripting language that is especially suited for web development and can be embedded into HTML.</p>
                  <p>This tutorial will guide you through the basics of PHP programming and help you understand its core concepts.</p>
                  <h3>What You'll Learn</h3>
                  <ul>
                    <li>Basic PHP syntax</li>
                    <li>Variables and data types</li>
                    <li>Control structures</li>
                    <li>Functions and classes</li>
                    <li>Connecting to databases</li>
                  </ul>
                  <p>By the end of this tutorial, you'll be able to create simple web applications using PHP.</p>
                  <div class="text-end">
                    <a href="#" class="btn btn-primary">Read More</a>
                  </div>
                </div>
              </div>
              
              <div class="blog-post">
                <h2 class="blog-post-title">Working with MySQL Databases</h2>
                <div class="blog-post-meta">
                  <span><i class="fas fa-user"></i> Admin</span> &middot;
                  <span><i class="fas fa-calendar"></i> June 8, 2023</span> &middot;
                  <span><i class="fas fa-folder"></i> Databases</span> &middot;
                  <span><i class="fas fa-comments"></i> 3 Comments</span>
                </div>
                <div class="blog-post-content">
                  <p>MySQL is one of the most popular database systems used with PHP. This post will cover how to integrate MySQL with your PHP applications.</p>
                  <div class="text-end">
                    <a href="#" class="btn btn-primary">Read More</a>
                  </div>
                </div>
              </div>
              
              <div class="blog-post">
                <h2 class="blog-post-title">Building a Simple Login System</h2>
                <div class="blog-post-meta">
                  <span><i class="fas fa-user"></i> Admin</span> &middot;
                  <span><i class="fas fa-calendar"></i> June 5, 2023</span> &middot;
                  <span><i class="fas fa-folder"></i> Security</span> &middot;
                  <span><i class="fas fa-comments"></i> 7 Comments</span>
                </div>
                <div class="blog-post-content">
                  <p>Authentication is a critical part of web applications. Learn how to create a secure login system using PHP and MySQL.</p>
                  <div class="text-end">
                    <a href="#" class="btn btn-primary">Read More</a>
                  </div>
                </div>
              </div>
              
              <nav aria-label="Blog pagination">
                <ul class="pagination justify-content-center">
                  <li class="page-item disabled">
                    <a class="page-link" href="#" tabindex="-1">Previous</a>
                  </li>
                  <li class="page-item active"><a class="page-link" href="#">1</a></li>
                  <li class="page-item"><a class="page-link" href="#">2</a></li>
                  <li class="page-item"><a class="page-link" href="#">3</a></li>
                  <li class="page-item">
                    <a class="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
            
            <div class="col-md-4">
              <div class="blog-sidebar">
                <h4 class="blog-sidebar-title">Search</h4>
                <div class="input-group mb-3">
                  <input type="text" class="form-control" placeholder="Search...">
                  <button class="btn btn-outline-secondary" type="button">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div class="blog-sidebar">
                <h4 class="blog-sidebar-title">Categories</h4>
                <ul class="list-unstyled">
                  <li><a href="#">Tutorials (5)</a></li>
                  <li><a href="#">Databases (3)</a></li>
                  <li><a href="#">Security (2)</a></li>
                  <li><a href="#">Web Design (4)</a></li>
                  <li><a href="#">Best Practices (6)</a></li>
                </ul>
              </div>
              
              <div class="blog-sidebar">
                <h4 class="blog-sidebar-title">Recent Posts</h4>
                <ul class="list-unstyled">
                  <li>
                    <a href="#">Getting Started with PHP</a>
                    <small class="text-muted d-block">June 10, 2023</small>
                  </li>
                  <li class="mt-2">
                    <a href="#">Working with MySQL Databases</a>
                    <small class="text-muted d-block">June 8, 2023</small>
                  </li>
                  <li class="mt-2">
                    <a href="#">Building a Simple Login System</a>
                    <small class="text-muted d-block">June 5, 2023</small>
                  </li>
                  <li class="mt-2">
                    <a href="#">CSS Tips and Tricks</a>
                    <small class="text-muted d-block">June 1, 2023</small>
                  </li>
                </ul>
              </div>
              
              <div class="blog-sidebar">
                <h4 class="blog-sidebar-title">Tags</h4>
                <div class="blog-tags">
                  <a href="#" class="blog-tag">PHP</a>
                  <a href="#" class="blog-tag">MySQL</a>
                  <a href="#" class="blog-tag">HTML</a>
                  <a href="#" class="blog-tag">CSS</a>
                  <a href="#" class="blog-tag">JavaScript</a>
                  <a href="#" class="blog-tag">Bootstrap</a>
                  <a href="#" class="blog-tag">Security</a>
                  <a href="#" class="blog-tag">API</a>
                  <a href="#" class="blog-tag">WebDev</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate generic preview HTML
   * @param {Object} template - Template object
   * @returns {string} Preview HTML
   */
  function generateGenericPreview(template) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
          }
          .preview-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .preview-title {
            color: #007bff;
            margin-bottom: 10px;
          }
          .preview-description {
            color: #6c757d;
            max-width: 800px;
            margin: 0 auto;
          }
          .preview-container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .preview-section {
            margin-bottom: 30px;
          }
          .preview-section-title {
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .tech-badge {
            background-color: #e9ecef;
            color: #495057;
            border-radius: 20px;
            padding: 5px 12px;
            margin-right: 5px;
            display: inline-block;
            margin-bottom: 5px;
            font-size: 0.9rem;
          }
          .feature-item {
            background-color: white;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
        </style>
      </head>
      <body>
        <div class="preview-header">
          <h1 class="preview-title">${template.name}</h1>
          <p class="preview-description">${template.description}</p>
        </div>
        
        <div class="preview-container">
          <div class="preview-section">
            <h2 class="preview-section-title">About This Template</h2>
            <p>This is a preview of the ${template.name} template. This template is designed to help you quickly build a functional application with all the basic features you need.</p>
            <p>It's a great starting point for your project and can be customized to suit your specific requirements.</p>
          </div>
          
          <div class="preview-section">
            <h2 class="preview-section-title">Technologies</h2>
            <div class="tech-badges">
              ${template.technologies.map(tech => `
                <span class="tech-badge">${tech}</span>
              `).join('')}
            </div>
          </div>
          
          <div class="preview-section">
            <h2 class="preview-section-title">Features</h2>
            <div class="feature-list">
              ${template.features.map(feature => `
                <div class="feature-item">
                  <h4><i class="fas fa-check-circle text-success"></i> ${feature}</h4>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="preview-section">
            <h2 class="preview-section-title">Getting Started</h2>
            <p>To use this template, simply click the "Create From Template" button. This will generate a new project based on this template.</p>
            <p>You'll be able to customize the project name, description, and other options before creating the project.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get templates by category
   * @param {string} category - Category ID
   * @returns {Array} Filtered templates
   */
  function getTemplatesByCategory(category) {
    if (category === 'all') {
      return _templates;
    }
    
    return _templates.filter(template => template.category === category);
  }
  
  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Object|null} Template object or null if not found
   */
  function getTemplateById(id) {
    return _templates.find(template => template.id === id) || null;
  }
  
  /**
   * Get category name by ID
   * @param {string} categoryId - Category ID
   * @returns {string} Category name
   */
  function getCategoryName(categoryId) {
    const category = _categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  }
  
  /**
   * Get category icon by ID
   * @param {string} categoryId - Category ID
   * @returns {string} Category icon
   */
  function getCategoryIcon(categoryId) {
    const category = _categories.find(cat => cat.id === categoryId);
    return category ? category.icon : 'folder';
  }
  
  /**
   * Get difficulty icon
   * @param {string} difficulty - Difficulty level
   * @returns {string} Icon name
   */
  function getDifficultyIcon(difficulty) {
    switch (difficulty) {
      case 'beginner':
        return 'smile';
      case 'intermediate':
        return 'meh';
      case 'advanced':
        return 'graduation-cap';
      default:
        return 'info-circle';
    }
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
      
      // Reset to template list view if needed
      if (_selectedTemplate) {
        document.querySelector('.demo-system-container').classList.remove('hidden');
        document.getElementById('demo-details').classList.add('hidden');
        _selectedTemplate = null;
      }
    } else {
      _panel.classList.add('hidden');
    }
    
    return _panelVisible;
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
    
    console.log(`${type}: ${message}`);
  }
  
  // Public API
  return {
    initialize,
    togglePanel,
    getCategories: () => _categories,
    getTemplates: getTemplatesByCategory,
    getTemplate: getTemplateById,
    isInitialized: () => _initialized,
    isPanelVisible: () => _panelVisible
  };
})();

// Auto-initialize on DOM ready if not using module framework
document.addEventListener('DOMContentLoaded', function() {
  if (!window.ModuleFramework) {
    DemoSystem.initialize();
  }
});

// Add the module to the global scope
window.DemoSystem = DemoSystem;

// Add demo system styles
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Demo System Styles */
    .demo-system-panel {
      width: 90% !important;
      height: 90% !important;
      max-width: 1400px !important;
    }
    
    .demo-system-container {
      display: flex;
      width: 100%;
      height: 100%;
    }
    
    .demo-sidebar {
      width: 260px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      overflow-y: auto;
      padding-right: 15px;
    }
    
    .demo-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .demo-search {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 15px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 15px;
    }
    
    .search-box {
      display: flex;
      width: 300px;
    }
    
    .search-box input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right: none;
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .search-box button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .view-options {
      display: flex;
      gap: 5px;
    }
    
    .view-option {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .view-option:hover {
      background-color: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .view-option.active {
      background-color: rgba(13, 110, 253, 0.3);
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(13, 110, 253, 0.5);
    }
    
    .categories-section h3, .filters-section h3 {
      font-size: 1.1rem;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 25px;
    }
    
    .category-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 6px;
      background-color: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .category-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .category-item.active {
      background-color: rgba(13, 110, 253, 0.3);
    }
    
    .category-item i {
      width: 24px;
      text-align: center;
    }
    
    .filter-group {
      margin-bottom: 20px;
    }
    
    .filter-group label {
      display: block;
      margin-bottom: 10px;
      font-weight: 500;
    }
    
    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .filter-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }
    
    .demo-templates {
      padding: 15px;
      overflow-y: auto;
      flex: 1;
    }
    
    .demo-templates.view-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .demo-templates.view-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .template-card {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    
    .template-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      background-color: rgba(255, 255, 255, 0.08);
    }
    
    .view-list .template-card {
      flex-direction: row;
      height: 120px;
    }
    
    .template-image {
      height: 150px;
      width: 100%;
      overflow: hidden;
    }
    
    .view-list .template-image {
      height: 100%;
      width: 160px;
      flex-shrink: 0;
    }
    
    .template-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .template-info {
      padding: 15px;
      flex: 1;
    }
    
    .view-list .template-info {
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .template-name {
      font-size: 1.1rem;
      margin: 0 0 10px 0;
    }
    
    .view-list .template-name {
      margin-bottom: 5px;
    }
    
    .template-description {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 15px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .view-list .template-description {
      -webkit-line-clamp: 1;
      margin-bottom: 5px;
    }
    
    .template-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    
    .template-difficulty, .template-category {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    
    .template-difficulty.beginner {
      color: #28a745;
    }
    
    .template-difficulty.intermediate {
      color: #fd7e14;
    }
    
    .template-difficulty.advanced {
      color: #dc3545;
    }
    
    .template-actions {
      padding: 10px 15px;
      display: flex;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .view-list .template-actions {
      border-top: none;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      flex-direction: column;
      justify-content: center;
      padding: 10px;
    }
    
    .no-templates {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .no-templates i {
      font-size: 3rem;
      margin-bottom: 15px;
    }
    
    .demo-details {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      padding: 0 15px;
    }
    
    .details-header {
      padding: 15px 0;
      margin-bottom: 20px;
    }
    
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      padding: 5px 0;
    }
    
    .back-btn:hover {
      color: rgba(13, 110, 253, 0.9);
    }
    
    .template-details {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .template-header h3 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .template-badges {
      display: flex;
      gap: 10px;
    }
    
    .template-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }
    
    .template-preview {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    
    .template-preview img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .template-info-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .template-description-full h4, .template-tech h4, .template-features h4 {
      font-size: 1.1rem;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .tech-tag {
      display: inline-block;
      padding: 5px 12px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      font-size: 0.9rem;
    }
    
    .template-features ul {
      padding-left: 0;
      list-style: none;
    }
    
    .template-features li {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .template-features li i {
      color: #198754;
    }
    
    .template-actions-full {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 10px;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .modal-dialog {
      background-color: rgba(30, 30, 30, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 10px;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }
    
    .modal-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 1.3rem;
    }
    
    .modal-close-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .modal-close-btn:hover {
      background-color: rgba(255, 87, 34, 0.3);
      transform: rotate(90deg);
    }
    
    .modal-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 15px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .progress {
      height: 10px;
      margin-bottom: 15px;
      border-radius: 5px;
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .progress-bar {
      background-color: #0d6efd;
      border-radius: 5px;
      transition: width 0.2s ease;
    }
    
    .progress-status {
      text-align: center;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .creation-progress {
      margin-top: 20px;
    }
    
    .config-form {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
    }
    
    .form-check {
      margin-bottom: 15px;
    }
    
    .hidden {
      display: none !important;
    }
  `;
  
  document.head.appendChild(style);
})();
