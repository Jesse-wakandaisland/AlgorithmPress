/**
 * PHP-WASM Builder - Plugin Manager UI
 * UI components for the plugin manager system
 */

const PluginManagerUI = (function() {
  'use strict';
  
  // Cache DOM elements
  let elements = {};
  
  // Plugin manager state
  let currentView = 'store';
  let currentCategory = 'all';
  let searchQuery = '';
  let installedPluginsData = [];
  
  /**
   * Initialize the plugin manager UI
   * @returns {Promise} Promise that resolves when UI is initialized
   */
  function initialize() {
    return new Promise((resolve) => {
      // Create UI container
      createUIContainer();
      
      // Cache DOM elements
      cacheElements();
      
      // Set up event listeners
      setupEventListeners();
      
      // Initial render
      renderView(currentView);
      
      resolve();
    });
  }
  
  /**
   * Create the plugin manager UI container
   */
  function createUIContainer() {
    // Create main plugin manager container
    const container = document.createElement('div');
    container.id = 'plugin-manager-container';
    container.className = 'plugin-manager-container';
    container.style.display = 'none';
    
    // Add glassmorphism styling
    container.innerHTML = `
      <div class="plugin-manager-header">
        <h2>Plugin Manager</h2>
        <div class="plugin-manager-tabs">
          <button class="tab-button active" data-view="store">Store</button>
          <button class="tab-button" data-view="installed">Installed</button>
        </div>
        <button class="close-button">&times;</button>
      </div>
      
      <div class="plugin-manager-search">
        <div class="search-container">
          <input type="text" placeholder="Search plugins..." class="search-input">
          <button class="search-button">
            <i class="fas fa-search"></i>
          </button>
        </div>
        
        <div class="category-filter">
          <select class="category-select">
            <option value="all">All Categories</option>
            <!-- Categories will be populated dynamically -->
          </select>
        </div>
      </div>
      
      <div class="plugin-manager-content">
        <!-- Content will be loaded dynamically -->
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading plugins...</p>
        </div>
      </div>
    `;
    
    // Add CSS styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .plugin-manager-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .plugin-manager-header {
        display: flex;
        align-items: center;
        padding: 1rem 2rem;
        background-color: rgba(62, 100, 255, 0.1);
        border-bottom: 1px solid rgba(62, 100, 255, 0.2);
      }
      
      .plugin-manager-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
      }
      
      .plugin-manager-tabs {
        display: flex;
        margin-left: 2rem;
      }
      
      .tab-button {
        background: none;
        border: none;
        padding: 0.5rem 1rem;
        margin-right: 0.5rem;
        font-size: 1rem;
        cursor: pointer;
        border-radius: 4px;
        color: #666;
      }
      
      .tab-button.active {
        background-color: rgba(62, 100, 255, 0.2);
        color: #3e64ff;
        font-weight: 500;
      }
      
      .close-button {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .close-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .plugin-manager-search {
        display: flex;
        padding: 1rem 2rem;
        background-color: rgba(250, 250, 250, 0.5);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .search-container {
        display: flex;
        flex: 1;
        max-width: 500px;
        margin-right: 1rem;
      }
      
      .search-input {
        flex: 1;
        padding: 0.5rem 1rem;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px 0 0 4px;
        font-size: 0.9rem;
      }
      
      .search-button {
        background-color: #3e64ff;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        padding: 0 1rem;
        cursor: pointer;
      }
      
      .category-select {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        font-size: 0.9rem;
        background-color: white;
      }
      
      .plugin-manager-content {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
      }
      
      /* Plugin cards */
      .plugin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .plugin-card {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
      }
      
      .plugin-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
      
      .plugin-thumbnail {
        width: 100%;
        height: 160px;
        object-fit: cover;
        background-color: #f5f5f5;
      }
      
      .plugin-info {
        padding: 1.25rem;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      
      .plugin-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }
      
      .plugin-description {
        font-size: 0.9rem;
        color: #666;
        margin: 0 0 1rem 0;
        flex-grow: 1;
      }
      
      .plugin-meta {
        display: flex;
        font-size: 0.8rem;
        color: #999;
        margin-bottom: 0.5rem;
      }
      
      .plugin-author {
        margin-right: auto;
      }
      
      .plugin-downloads, .plugin-rating {
        margin-left: 1rem;
        display: flex;
        align-items: center;
      }
      
      .plugin-downloads i, .plugin-rating i {
        margin-right: 0.25rem;
      }
      
      .plugin-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      
      .plugin-actions button {
        flex: 1;
        padding: 0.5rem;
        border-radius: 4px;
        border: none;
        font-size: 0.9rem;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .install-button {
        background-color: #3e64ff;
        color: white;
      }
      
      .install-button:hover {
        background-color: #2a4bca;
      }
      
      .details-button {
        background-color: rgba(0, 0, 0, 0.05);
        color: #666;
      }
      
      .details-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(62, 100, 255, 0.2);
        border-top-color: #3e64ff;
        border-radius: 50%;
        animation: spinner 1s linear infinite;
        margin-bottom: 1rem;
      }
      
      @keyframes spinner {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Plugin details modal */
      .plugin-details-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 90%;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 10000;
      }
      
      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        background-color: rgba(62, 100, 255, 0.05);
      }
      
      .modal-title {
        margin: 0;
        font-size: 1.3rem;
      }
      
      .modal-close {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-content {
        padding: 1.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      
      .modal-info {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      .modal-thumbnail {
        width: 250px;
        height: 180px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
      }
      
      .modal-details {
        flex: 1;
      }
      
      .modal-description {
        margin-bottom: 1rem;
      }
      
      .modal-meta {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      
      .meta-item {
        display: flex;
        align-items: center;
      }
      
      .meta-label {
        font-weight: 500;
        margin-right: 0.5rem;
      }
      
      .meta-value {
        color: #666;
      }
      
      .modal-actions {
        margin-top: auto;
        padding: 1.5rem;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
      
      .modal-actions button {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        font-weight: 500;
      }
      
      .modal-install {
        background-color: #3e64ff;
        color: white;
      }
      
      .modal-cancel {
        background-color: rgba(0, 0, 0, 0.05);
        color: #666;
      }
      
      /* Installation progress overlay */
      .installation-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        color: white;
      }
      
      .installation-title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .installation-progress {
        width: 80%;
        max-width: 500px;
        height: 10px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        margin-bottom: 1rem;
        position: relative;
        overflow: hidden;
      }
      
      .progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background-color: #3e64ff;
        border-radius: 5px;
        transition: width 0.3s;
      }
      
      .installation-status {
        font-size: 1rem;
        margin-bottom: 2rem;
      }
      
      /* Installed plugins view */
      .installed-plugin-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .installed-plugin-item {
        display: flex;
        padding: 1rem;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      
      .installed-plugin-icon {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 1rem;
      }
      
      .installed-plugin-info {
        flex: 1;
      }
      
      .installed-plugin-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }
      
      .installed-plugin-description {
        font-size: 0.9rem;
        color: #666;
        margin: 0 0 0.5rem 0;
      }
      
      .installed-plugin-meta {
        font-size: 0.8rem;
        color: #999;
      }
      
      .installed-plugin-version {
        margin-right: 1rem;
      }
      
      .installed-plugin-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      
      .plugin-toggle {
        display: flex;
        align-items: center;
      }
      
      .toggle-label {
        margin-right: 0.5rem;
        font-size: 0.9rem;
        color: #666;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 40px;
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
        transition: .4s;
        border-radius: 34px;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .toggle-slider {
        background-color: #3e64ff;
      }
      
      input:focus + .toggle-slider {
        box-shadow: 0 0 1px #3e64ff;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(16px);
      }
      
      .uninstall-button {
        background-color: rgba(255, 0, 0, 0.1);
        color: #ff3b30;
        border: none;
        border-radius: 4px;
        padding: 0.5rem;
        cursor: pointer;
        font-size: 0.85rem;
      }
      
      .uninstall-button:hover {
        background-color: rgba(255, 0, 0, 0.2);
      }
      
      /* Featured section */
      .featured-section {
        margin-bottom: 2rem;
      }
      
      .featured-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #333;
      }
      
      .featured-carousel {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 350px;
        gap: 1.5rem;
        overflow-x: auto;
        padding-bottom: 1rem;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
      }
      
      .featured-carousel::-webkit-scrollbar {
        height: 8px;
      }
      
      .featured-carousel::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      
      .featured-carousel::-webkit-scrollbar-thumb {
        background: #d1d1d1;
        border-radius: 10px;
      }
      
      .featured-carousel::-webkit-scrollbar-thumb:hover {
        background: #b1b1b1;
      }
      
      .featured-carousel .plugin-card {
        scroll-snap-align: start;
      }
      
      /* Empty states */
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: #666;
      }
      
      .empty-state-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #ddd;
      }
      
      .empty-state-title {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      .empty-state-text {
        margin-bottom: 1.5rem;
      }
    `;
    
    // Add container and styles to document
    document.body.appendChild(container);
    document.head.appendChild(styleElement);
  }
  
  /**
   * Cache DOM elements for later use
   */
  function cacheElements() {
    elements = {
      container: document.getElementById('plugin-manager-container'),
      tabButtons: document.querySelectorAll('.tab-button'),
      closeButton: document.querySelector('.close-button'),
      searchInput: document.querySelector('.search-input'),
      searchButton: document.querySelector('.search-button'),
      categorySelect: document.querySelector('.category-select'),
      content: document.querySelector('.plugin-manager-content')
    };
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Tab switching
    elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const view = button.dataset.view;
        
        // Update active tab
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Render the selected view
        renderView(view);
      });
    });
    
    // Close button
    elements.closeButton.addEventListener('click', hide);
    
    // Search functionality
    elements.searchInput.addEventListener('keyup', event => {
      if (event.key === 'Enter') {
        searchQuery = elements.searchInput.value.trim();
        renderView(currentView);
      }
    });
    
    elements.searchButton.addEventListener('click', () => {
      searchQuery = elements.searchInput.value.trim();
      renderView(currentView);
    });
    
    // Category filter
    elements.categorySelect.addEventListener('change', () => {
      currentCategory = elements.categorySelect.value;
      renderView(currentView);
    });
  }
  
  /**
   * Render the current view (store or installed)
   * @param {string} view - View to render ('store' or 'installed')
   */
  function renderView(view) {
    currentView = view;
    
    // Clear content
    elements.content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading plugins...</p></div>';
    
    // Render appropriate view
    if (view === 'store') {
      renderStoreView();
    } else if (view === 'installed') {
      renderInstalledView();
    }
  }
  
  /**
   * Render the store view
   */
  function renderStoreView() {
    // Fetch store data from the plugin system
    PluginSystem.getStoreData()
      .then(storeData => {
        if (!storeData) {
          elements.content.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-store-slash"></i>
              </div>
              <h3 class="empty-state-title">Store Unavailable</h3>
              <p class="empty-state-text">Unable to connect to the plugin store. Please try again later.</p>
              <button class="install-button" onclick="PluginManagerUI.refreshStore()">
                <i class="fas fa-sync-alt"></i> Refresh Store
              </button>
            </div>
          `;
          return;
        }
        
        // Populate categories
        populateCategories(storeData.categories);
        
        // Build content HTML
        let contentHTML = '';
        
        // Add featured section if on 'all' category and no search query
        if (currentCategory === 'all' && !searchQuery && storeData.featured && storeData.featured.length > 0) {
          contentHTML += `
            <div class="featured-section">
              <h3 class="featured-title">Featured Apps</h3>
              <div class="featured-carousel">
                ${storeData.featured.map(plugin => renderPluginCard(plugin)).join('')}
              </div>
            </div>
          `;
        }
        
        // Filter plugins based on category and search query
        let filteredPlugins = storeData.plugins;
        
        if (currentCategory !== 'all') {
          filteredPlugins = filteredPlugins.filter(plugin => plugin.category === currentCategory);
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredPlugins = filteredPlugins.filter(plugin => 
            plugin.name.toLowerCase().includes(query) || 
            plugin.description.toLowerCase().includes(query) ||
            (plugin.tags && plugin.tags.some(tag => tag.toLowerCase().includes(query)))
          );
        }
        
        // If no plugins match the filters
        if (filteredPlugins.length === 0) {
          contentHTML += `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-search"></i>
              </div>
              <h3 class="empty-state-title">No plugins found</h3>
              <p class="empty-state-text">Try adjusting your search or category filters.</p>
            </div>
          `;
        } else {
          // Render grid of plugin cards
          contentHTML += `
            <div class="plugin-grid">
              ${filteredPlugins.map(plugin => renderPluginCard(plugin)).join('')}
            </div>
          `;
        }
        
        // Update content
        elements.content.innerHTML = contentHTML;
        
        // Add event listeners to plugin cards
        attachPluginCardListeners();
      })
      .catch(error => {
        console.error('Error rendering store view:', error);
        elements.content.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3 class="empty-state-title">Error Loading Store</h3>
            <p class="empty-state-text">Something went wrong when loading the plugin store.</p>
            <button class="install-button" onclick="PluginManagerUI.refreshStore()">
              <i class="fas fa-sync-alt"></i> Try Again
            </button>
          </div>
        `;
      });
  }
  
  /**
   * Render the installed plugins view
   */
  function renderInstalledView() {
    // Get installed plugins
    PluginSystem.getInstalledPlugins()
      .then(plugins => {
        installedPluginsData = plugins;
        
        // Filter plugins based on search query
        let filteredPlugins = plugins;
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredPlugins = filteredPlugins.filter(plugin => 
            plugin.name.toLowerCase().includes(query) || 
            plugin.description.toLowerCase().includes(query)
          );
        }
        
        // If no plugins are installed
        if (plugins.length === 0) {
          elements.content.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-puzzle-piece"></i>
              </div>
              <h3 class="empty-state-title">No Plugins Installed</h3>
              <p class="empty-state-text">Visit the plugin store to discover and install plugins.</p>
              <button class="install-button" onclick="PluginManagerUI.switchToStore()">
                <i class="fas fa-store"></i> Go to Store
              </button>
            </div>
          `;
          return;
        }
        
        // If no plugins match the search query
        if (filteredPlugins.length === 0) {
          elements.content.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-search"></i>
              </div>
              <h3 class="empty-state-title">No plugins found</h3>
              <p class="empty-state-text">Try adjusting your search.</p>
            </div>
          `;
          return;
        }
        
        // Create installed plugins list
        const contentHTML = `
          <div class="installed-plugin-list">
            ${filteredPlugins.map(plugin => renderInstalledPluginItem(plugin)).join('')}
          </div>
        `;
        
        // Update content
        elements.content.innerHTML = contentHTML;
        
        // Add event listeners to installed plugin items
        attachInstalledPluginListeners();
      })
      .catch(error => {
        console.error('Error rendering installed plugins view:', error);
        elements.content.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3 class="empty-state-title">Error Loading Plugins</h3>
            <p class="empty-state-text">Something went wrong when loading your installed plugins.</p>
            <button class="install-button" onclick="PluginManagerUI.renderView('installed')">
              <i class="fas fa-sync-alt"></i> Try Again
            </button>
          </div>
        `;
      });
  }
  
  /**
   * Populate category select dropdown
   * @param {Array} categories - Array of category objects
   */
  function populateCategories(categories) {
    if (!categories || categories.length === 0) {
      return;
    }
    
    // Clear current options (except 'All')
    while (elements.categorySelect.options.length > 1) {
      elements.categorySelect.remove(1);
    }
    
    // Add category options
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.name} (${category.count})`;
      elements.categorySelect.appendChild(option);
    });
    
    // Set current selected category
    elements.categorySelect.value = currentCategory;
  }
  
  /**
   * Render a plugin card HTML
   * @param {Object} plugin - Plugin data object
   * @returns {string} HTML string for the plugin card
   */
  function renderPluginCard(plugin) {
    // Check if plugin is already installed
    const isInstalled = PluginSystem.isPluginInstalled(plugin.id);
    
    return `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <img src="${plugin.thumbnail}" alt="${plugin.name}" class="plugin-thumbnail">
        <div class="plugin-info">
          <h3 class="plugin-title">${plugin.name}</h3>
          <p class="plugin-description">${plugin.description}</p>
          <div class="plugin-meta">
            <span class="plugin-author">By ${plugin.author}</span>
            <span class="plugin-downloads"><i class="fas fa-download"></i> ${formatNumber(plugin.downloads)}</span>
            <span class="plugin-rating"><i class="fas fa-star"></i> ${plugin.rating.toFixed(1)}</span>
          </div>
          <div class="plugin-actions">
            <button class="install-button" ${isInstalled ? 'disabled' : ''}>
              <i class="fas ${isInstalled ? 'fa-check' : 'fa-download'}"></i>
              ${isInstalled ? 'Installed' : 'Install'}
            </button>
            <button class="details-button">
              <i class="fas fa-info-circle"></i>
              Details
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render an installed plugin item HTML
   * @param {Object} plugin - Plugin data object
   * @returns {string} HTML string for the installed plugin item
   */
  function renderInstalledPluginItem(plugin) {
    const isActive = plugin.active === true;
    
    return `
      <div class="installed-plugin-item" data-plugin-id="${plugin.id}">
        <img src="${plugin.thumbnail || 'https://via.placeholder.com/80?text=Plugin'}" alt="${plugin.name}" class="installed-plugin-icon">
        <div class="installed-plugin-info">
          <h3 class="installed-plugin-title">${plugin.name}</h3>
          <p class="installed-plugin-description">${plugin.description}</p>
          <div class="installed-plugin-meta">
            <span class="installed-plugin-version">Version ${plugin.version}</span>
            <span class="installed-plugin-author">By ${plugin.author}</span>
          </div>
        </div>
        <div class="installed-plugin-actions">
          <div class="plugin-toggle">
            <span class="toggle-label">Activate</span>
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" ${isActive ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="uninstall-button">
            <i class="fas fa-trash-alt"></i> Uninstall
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Attach event listeners to plugin cards
   */
  function attachPluginCardListeners() {
    // Get all plugin cards
    const pluginCards = document.querySelectorAll('.plugin-card');
    
    pluginCards.forEach(card => {
      const pluginId = card.dataset.pluginId;
      const installButton = card.querySelector('.install-button');
      const detailsButton = card.querySelector('.details-button');
      
      // Install button click
      if (installButton && !installButton.disabled) {
        installButton.addEventListener('click', () => {
          installPlugin(pluginId);
        });
      }
      
      // Details button click
      if (detailsButton) {
        detailsButton.addEventListener('click', () => {
          showPluginDetails(pluginId);
        });
      }
    });
  }
  
  /**
   * Attach event listeners to installed plugin items
   */
  function attachInstalledPluginListeners() {
    // Get all installed plugin items
    const pluginItems = document.querySelectorAll('.installed-plugin-item');
    
    pluginItems.forEach(item => {
      const pluginId = item.dataset.pluginId;
      const toggleInput = item.querySelector('.toggle-input');
      const uninstallButton = item.querySelector('.uninstall-button');
      
      // Toggle switch change
      if (toggleInput) {
        toggleInput.addEventListener('change', () => {
          const isActive = toggleInput.checked;
          togglePlugin(pluginId, isActive);
        });
      }
      
      // Uninstall button click
      if (uninstallButton) {
        uninstallButton.addEventListener('click', () => {
          confirmUninstall(pluginId);
        });
      }
    });
  }
  
  /**
   * Show plugin details modal
   * @param {string} pluginId - Plugin ID
   */
  function showPluginDetails(pluginId) {
    // Get plugin data
    PluginSystem.getStoreData()
      .then(storeData => {
        const plugin = storeData.plugins.find(p => p.id === pluginId);
        
        if (!plugin) {
          console.error('Plugin not found:', pluginId);
          return;
        }
        
        // Check if plugin is already installed
        const isInstalled = PluginSystem.isPluginInstalled(plugin.id);
        
        // Create modal HTML
        const modalHTML = `
          <div class="plugin-details-modal" id="plugin-details-modal">
            <div class="modal-header">
              <h3 class="modal-title">${plugin.name}</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
              <div class="modal-info">
                <img src="${plugin.thumbnail}" alt="${plugin.name}" class="modal-thumbnail">
                <div class="modal-details">
                  <p class="modal-description">${plugin.description}</p>
                  <div class="modal-meta">
                    <div class="meta-item">
                      <span class="meta-label">Version:</span>
                      <span class="meta-value">${plugin.version}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">Author:</span>
                      <span class="meta-value">${plugin.author}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">Category:</span>
                      <span class="meta-value">${getCategoryName(plugin.category, storeData.categories)}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">Downloads:</span>
                      <span class="meta-value">${formatNumber(plugin.downloads)}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">Rating:</span>
                      <span class="meta-value">${plugin.rating.toFixed(1)} / 5.0</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">Updated:</span>
                      <span class="meta-value">${formatDate(plugin.updated)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              ${plugin.tags && plugin.tags.length > 0 ? `
                <div class="modal-tags" style="margin-top: 1rem;">
                  <span class="meta-label">Tags:</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${plugin.tags.map(tag => `
                      <span style="background-color: rgba(62, 100, 255, 0.1); color: #3e64ff; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                        ${tag}
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="modal-actions">
              <button class="modal-cancel">Cancel</button>
              <button class="modal-install ${isInstalled ? 'disabled' : ''}" ${isInstalled ? 'disabled' : ''}>
                ${isInstalled ? 'Already Installed' : 'Install Plugin'}
              </button>
            </div>
          </div>
        `;
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.backdropFilter = 'blur(3px)';
        overlay.style.zIndex = '9999';
        overlay.id = 'plugin-details-overlay';
        
        // Add modal to overlay
        overlay.innerHTML = modalHTML;
        
        // Add overlay to document
        document.body.appendChild(overlay);
        
        // Add event listeners
        const modal = document.getElementById('plugin-details-modal');
        const closeButton = modal.querySelector('.modal-close');
        const cancelButton = modal.querySelector('.modal-cancel');
        const installButton = modal.querySelector('.modal-install');
        
        // Close modal on close button click
        closeButton.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        
        // Close modal on cancel button click
        cancelButton.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        
        // Close modal on outside click
        overlay.addEventListener('click', event => {
          if (event.target === overlay) {
            document.body.removeChild(overlay);
          }
        });
        
        // Install plugin on install button click
        if (installButton && !installButton.classList.contains('disabled')) {
          installButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            installPlugin(pluginId);
          });
        }
      })
      .catch(error => {
        console.error('Error showing plugin details:', error);
      });
  }
  
  /**
   * Install a plugin
   * @param {string} pluginId - Plugin ID
   */
  function installPlugin(pluginId) {
    // Create installation overlay
    const overlay = document.createElement('div');
    overlay.className = 'installation-overlay';
    overlay.innerHTML = `
      <h2 class="installation-title">Installing Plugin</h2>
      <div class="installation-progress">
        <div class="progress-bar" style="width: 0%"></div>
      </div>
      <div class="installation-status">Preparing installation...</div>
    `;
    
    // Add overlay to document
    document.body.appendChild(overlay);
    
    // Get progress bar and status elements
    const progressBar = overlay.querySelector('.progress-bar');
    const statusElement = overlay.querySelector('.installation-status');
    
    // Track installation progress
    let progressInterval;
    let progress = 0;
    
    // Update progress function
    const updateProgress = (value, status) => {
      // Update progress bar
      progress = value;
      progressBar.style.width = `${progress}%`;
      
      // Update status if provided
      if (status) {
        statusElement.textContent = status;
      }
      
      // If installation complete, clear interval
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    };
    
    // Start progress animation
    progressInterval = setInterval(() => {
      // Simulate progress until 90%
      if (progress < 90) {
        updateProgress(progress + Math.random() * 5);
      }
    }, 300);
    
    // Install plugin
    PluginSystem.installPlugin(pluginId, {
      onStart: () => {
        updateProgress(10, 'Downloading plugin...');
      },
      onProgress: (percent, message) => {
        updateProgress(percent, message);
      },
      onComplete: () => {
        updateProgress(100, 'Installation complete!');
        
        // Remove overlay after a short delay
        setTimeout(() => {
          document.body.removeChild(overlay);
          
          // Show success message
          showNotification('Plugin installed successfully', 'success');
          
          // Refresh the current view
          renderView(currentView);
        }, 1000);
      },
      onError: (error) => {
        clearInterval(progressInterval);
        
        // Update overlay to show error
        overlay.innerHTML = `
          <div class="installation-error" style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ff3b30; margin-bottom: 1rem;"></i>
            <h2 class="installation-title">Installation Failed</h2>
            <p class="installation-status">${error}</p>
            <button class="modal-cancel" style="background-color: rgba(255, 255, 255, 0.2); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; margin-top: 1.5rem; cursor: pointer;">Close</button>
          </div>
        `;
        
        // Add close button listener
        const closeButton = overlay.querySelector('.modal-cancel');
        closeButton.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        
        // Show error notification
        showNotification('Plugin installation failed', 'error');
      }
    });
  }
  
  /**
   * Toggle plugin activation status
   * @param {string} pluginId - Plugin ID
   * @param {boolean} activate - Whether to activate or deactivate
   */
  function togglePlugin(pluginId, activate) {
    // Find the plugin
    const plugin = installedPluginsData.find(p => p.id === pluginId);
    
    if (!plugin) {
      console.error('Plugin not found:', pluginId);
      return;
    }
    
    // Activate or deactivate plugin
    const promise = activate ? 
      PluginSystem.activatePlugin(pluginId) : 
      PluginSystem.deactivatePlugin(pluginId);
    
    promise
      .then(() => {
        // Show success notification
        showNotification(
          `Plugin ${activate ? 'activated' : 'deactivated'} successfully`, 
          'success'
        );
        
        // Update plugin data
        plugin.active = activate;
      })
      .catch(error => {
        console.error(`Error ${activate ? 'activating' : 'deactivating'} plugin:`, error);
        
        // Reset toggle state
        const pluginItem = document.querySelector(`.installed-plugin-item[data-plugin-id="${pluginId}"]`);
        if (pluginItem) {
          const toggleInput = pluginItem.querySelector('.toggle-input');
          if (toggleInput) {
            toggleInput.checked = !activate;
          }
        }
        
        // Show error notification
        showNotification(
          `Failed to ${activate ? 'activate' : 'deactivate'} plugin`, 
          'error'
        );
      });
  }
  
  /**
   * Confirm plugin uninstallation
   * @param {string} pluginId - Plugin ID
   */
  function confirmUninstall(pluginId) {
    // Find the plugin
    const plugin = installedPluginsData.find(p => p.id === pluginId);
    
    if (!plugin) {
      console.error('Plugin not found:', pluginId);
      return;
    }
    
    // Create confirmation modal
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.backdropFilter = 'blur(3px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    modal.style.width = '90%';
    modal.style.maxWidth = '500px';
    modal.style.padding = '2rem';
    
    modal.innerHTML = `
      <h3 style="margin-top: 0; font-size: 1.3rem;">Uninstall Plugin</h3>
      <p>Are you sure you want to uninstall <strong>${plugin.name}</strong>?</p>
      <p style="color: #666; font-size: 0.9rem;">This will remove the plugin and all its data.</p>
      
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
        <button id="cancel-uninstall" style="padding: 0.75rem 1.5rem; border-radius: 4px; border: none; background-color: rgba(0, 0, 0, 0.05); color: #666; cursor: pointer;">Cancel</button>
        <button id="confirm-uninstall" style="padding: 0.75rem 1.5rem; border-radius: 4px; border: none; background-color: #ff3b30; color: white; cursor: pointer;">Uninstall</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const cancelButton = document.getElementById('cancel-uninstall');
    const confirmButton = document.getElementById('confirm-uninstall');
    
    // Cancel button click
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Confirm button click
    confirmButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      uninstallPlugin(pluginId);
    });
    
    // Close on outside click
    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
  
  /**
   * Uninstall a plugin
   * @param {string} pluginId - Plugin ID
   */
  function uninstallPlugin(pluginId) {
    // Create uninstallation overlay
    const overlay = document.createElement('div');
    overlay.className = 'installation-overlay';
    overlay.innerHTML = `
      <h2 class="installation-title">Uninstalling Plugin</h2>
      <div class="installation-status">Please wait...</div>
    `;
    
    // Add overlay to document
    document.body.appendChild(overlay);
    
    // Uninstall plugin
    PluginSystem.uninstallPlugin(pluginId)
      .then(() => {
        // Remove overlay after a short delay
        setTimeout(() => {
          document.body.removeChild(overlay);
          
          // Show success notification
          showNotification('Plugin uninstalled successfully', 'success');
          
          // Refresh the installed view
          renderView('installed');
        }, 1000);
      })
      .catch(error => {
        console.error('Error uninstalling plugin:', error);
        
        // Update overlay to show error
        overlay.innerHTML = `
          <div class="installation-error" style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ff3b30; margin-bottom: 1rem;"></i>
            <h2 class="installation-title">Uninstallation Failed</h2>
            <p class="installation-status">${error.message || 'An error occurred during uninstallation.'}</p>
            <button class="modal-cancel" style="background-color: rgba(255, 255, 255, 0.2); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; margin-top: 1.5rem; cursor: pointer;">Close</button>
          </div>
        `;
        
        // Add close button listener
        const closeButton = overlay.querySelector('.modal-cancel');
        closeButton.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        
        // Show error notification
        showNotification('Plugin uninstallation failed', 'error');
      });
  }
  
  /**
   * Show a notification toast
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'info')
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '10000';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.transition = 'transform 0.3s, opacity 0.3s';
    notification.style.transform = 'translateY(20px)';
    notification.style.opacity = '0';
    
    // Set notification color based on type
    if (type === 'success') {
      notification.style.backgroundColor = '#34c759';
      notification.style.color = 'white';
    } else if (type === 'error') {
      notification.style.backgroundColor = '#ff3b30';
      notification.style.color = 'white';
    } else {
      notification.style.backgroundColor = '#007aff';
      notification.style.color = 'white';
    }
    
    // Add icon based on type
    let icon;
    if (type === 'success') {
      icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
      icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
      icon = '<i class="fas fa-info-circle"></i>';
    }
    
    // Set notification content
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
    `;
    
    // Add notification to document
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateY(20px)';
      notification.style.opacity = '0';
      
      // Remove notification from document after animation
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  /**
   * Format a number with commas
   * @param {number} number - Number to format
   * @returns {string} Formatted number
   */
  function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  /**
   * Format a date string
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Get category name from ID
   * @param {string} categoryId - Category ID
   * @param {Array} categories - Categories array
   * @returns {string} Category name
   */
  function getCategoryName(categoryId, categories) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }
  
  /**
   * Switch to store view
   */
  function switchToStore() {
    // Update tab buttons
    elements.tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === 'store') {
        btn.classList.add('active');
      }
    });
    
    // Render store view
    renderView('store');
  }
  
  /**
   * Refresh store data
   */
  function refreshStore() {
    // Clear store cache
    PluginSystem.clearStoreCache();
    
    // Render store view
    renderView('store');
  }
  
  /**
   * Show the plugin manager
   */
  function show() {
    // Show container
    elements.container.style.display = 'flex';
    
    // Render current view
    renderView(currentView);
  }
  
  /**
   * Hide the plugin manager
   */
  function hide() {
    elements.container.style.display = 'none';
  }
  
  /**
   * Toggle plugin manager visibility
   */
  function toggle() {
    if (elements.container.style.display === 'none') {
      show();
    } else {
      hide();
    }
  }
  
  // Public API
  return {
    initialize,
    show,
    hide,
    toggle,
    renderView,
    switchToStore,
    refreshStore
  };
})();

// Add to global scope
window.PluginManagerUI = PluginManagerUI;
