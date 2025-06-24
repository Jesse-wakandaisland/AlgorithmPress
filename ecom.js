/**
 * E-Commerce and IDE Integration Module
 * A comprehensive e-commerce system with multi-language IDE integration
 * for the PHP-WASM Builder platform
 */
const EcommerceSystem = (function() {
    // Private variables for system state
    let _initialized = false;
    let _currentStore = null;
    let _stores = [];
    let _products = [];
    let _orders = [];
    let _customers = [];

    // Configuration and settings
    let _settings = {
        storeName: 'My E-Commerce Store',
        currency: 'USD',
        taxRate: 0.07,
        shippingEnabled: true,
        paymentGateways: ['stripe', 'paypal'],
        emailNotifications: true,
        inventoryManagement: true
    };

    // IDE integration settings
    let _ideSettings = {
        fontSize: 14,
        tabSize: 4,
        autoSave: true,
        livePreview: true,
        formatOnSave: true,
        theme: 'dark'
    };

    // Supported programming languages
    const _supportedLanguages = [
        {
            name: 'PHP',
            extension: '.php',
            icon: 'fab fa-php',
            defaultTemplate: `<?php
/**
 * E-Commerce Module
 * Custom PHP logic for store functionality
 */
class EcommerceModule {
    public function processOrder($orderData) {
        // Order processing logic
    }
}
?>`
        },
        {
            name: 'JavaScript',
            extension: '.js',
            icon: 'fab fa-js',
            defaultTemplate: `/**
 * E-Commerce Client-Side Logic
 */
class EcommerceClient {
    constructor() {
        this.cart = [];
    }

    addToCart(product) {
        this.cart.push(product);
    }
}
`
        },
        {
            name: 'SQL',
            extension: '.sql',
            icon: 'fas fa-database',
            defaultTemplate: `-- E-Commerce Database Schema
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock INTEGER
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    total DECIMAL(10,2),
    status VARCHAR(50)
);`
        }
    ];

    // DOM Elements
    let _navItem = null;
    let _mainPanel = null;
    let _sidePanel = null;
    let _contentPanel = null;

    /**
     * Initialize the E-Commerce System
     */
    function init() {
        if (_initialized) return;

        console.log('Initializing E-Commerce System...');

        // Load saved data
        _loadFromStorage();

        // Create UI components
        _createUI();

        // Register event listeners
        _registerEventListeners();

        // Initialize first store if none exists
        if (_stores.length === 0) {
            _createDefaultStore();
        }

        // Set current store to first store if not set
        if (!_currentStore && _stores.length > 0) {
            _currentStore = _stores[0].id;
        }

        _initialized = true;
        console.log('E-Commerce System initialized successfully');
    }

    /**
     * Create the UI components
     */
    function _createUI() {
        _createNavigationItem();
        _createMainPanel();
        _createSidePanel();
        _createContentPanel();
    }

    /**
     * Create navigation item for E-Commerce system
     */
    function _createNavigationItem() {
        const navContainer = document.querySelector('.nav-menu') ||
                             document.querySelector('nav') ||
                             document.body;

        _navItem = document.createElement('div');
        _navItem.className = 'nav-item ecommerce-nav-item';
        _navItem.innerHTML = `
            <a href="#" class="nav-link">
                <i class="fas fa-shopping-cart"></i> E-Commerce
            </a>
        `;

        _navItem.addEventListener('click', function(e) {
            e.preventDefault();
            toggleEcommercePanel();
        });

        navContainer.appendChild(_navItem);
    }

    /**
     * Create the main panel for E-Commerce system
     */
    function _createMainPanel() {
        const mainContainer = document.querySelector('.php-wasm-builder') ||
                              document.querySelector('.builder') ||
                              document.body;

        _mainPanel = document.createElement('div');
        _mainPanel.className = 'ecommerce-panel glass-panel hidden';
        _mainPanel.innerHTML = `
            <div class="panel-header">
                <h2>E-Commerce Management</h2>
                <div class="panel-controls">
                    <button id="ecommerce-settings-btn" class="glass-button small">
                        <i class="fas fa-cog"></i> Settings
                    </button>
                    <button id="ecommerce-close-btn" class="glass-button small">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            <div class="panel-body">
                <!-- Sidebar and content will be added here -->
            </div>
        `;

        mainContainer.appendChild(_mainPanel);
    }

    /**
     * Create the side panel for E-Commerce system
     */
    function _createSidePanel() {
        const panelBody = _mainPanel.querySelector('.panel-body');

        _sidePanel = document.createElement('div');
        _sidePanel.className = 'ecommerce-sidebar glass-panel';
        _sidePanel.innerHTML = `
            <div class="sidebar-tabs">
                <button class="sidebar-tab active" data-view="store">
                    <i class="fas fa-shopping-cart"></i> Store
                </button>
                <button class="sidebar-tab" data-view="ide">
                    <i class="fas fa-code"></i> IDE
                </button>
            </div>
            <div class="sidebar-content">
                <div class="store-nav">
                    <ul>
                        <li data-view="products" class="active">
                            <i class="fas fa-box"></i> Products
                        </li>
                        <li data-view="orders">
                            <i class="fas fa-shopping-bag"></i> Orders
                        </li>
                        <li data-view="customers">
                            <i class="fas fa-users"></i> Customers
                        </li>
                        <li data-view="settings">
                            <i class="fas fa-cog"></i> Store Settings
                        </li>
                    </ul>
                </div>
                <div class="ide-nav" style="display:none;">
                    <div class="language-selector">
                        <h3>Languages</h3>
                        <div class="language-list">
                            ${_supportedLanguages.map(lang => `
                                <div class="language-item" data-language="${lang.name.toLowerCase()}">
                                    <i class="${lang.icon}"></i>
                                    <span>${lang.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        panelBody.appendChild(_sidePanel);
    }

    /**
     * Create the content panel for E-Commerce system
     */
    function _createContentPanel() {
        const panelBody = _mainPanel.querySelector('.panel-body');

        _contentPanel = document.createElement('div');
        _contentPanel.className = 'ecommerce-content glass-panel';
        _contentPanel.innerHTML = `
            <div class="content-view products-view active">
                <div class="view-header">
                    <h2>Products</h2>
                    <div class="view-actions">
                        <button id="add-product-btn" class="glass-button">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                    </div>
                </div>
                <div class="view-body">
                    <table id="products-table" class="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Products will be dynamically added -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="content-view orders-view" style="display:none;">
                <div class="view-header">
                    <h2>Orders</h2>
                </div>
                <div class="view-body">
                    <table id="orders-table" class="glass-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Orders will be dynamically added -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="content-view customers-view" style="display:none;">
                <div class="view-header">
                    <h2>Customers</h2>
                </div>
                <div class="view-body">
                    <table id="customers-table" class="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Total Orders</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Customers will be dynamically added -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="content-view settings-view" style="display:none;">
                <div class="view-header">
                    <h2>Store Settings</h2>
                    <div class="view-actions">
                        <button id="save-store-settings-btn" class="glass-button">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                    </div>
                </div>
                <div class="view-body">
                    <form id="store-settings-form">
                        <div class="form-group">
                            <label>Store Name</label>
                            <input type="text" name="storeName" value="${_settings.storeName}">
                        </div>
                        <div class="form-group">
                            <label>Currency</label>
                            <select name="currency">
                                <option value="USD" ${_settings.currency === 'USD' ? 'selected' : ''}>USD</option>
                                <option value="EUR" ${_settings.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="GBP" ${_settings.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                            </select>
                        </div>
                        <!-- More settings fields -->
                    </form>
                </div>
            </div>

            <div class="content-view ide-view" style="display:none;">
                <div class="view-header">
                    <h2>E-Commerce IDE</h2>
                    <div class="view-actions">
                        <button id="new-file-btn" class="glass-button">
                            <i class="fas fa-file-plus"></i> New File
                        </button>
                    </div>
                </div>
                <div class="view-body">
                    <div id="code-editor" class="code-editor">
                        <!-- Code editor will be initialized here -->
                    </div>
                </div>
            </div>
        `;

        panelBody.appendChild(_contentPanel);
    }

    /**
     * Register event listeners for the E-Commerce system
     */
    function _registerEventListeners() {
        // Sidebar tab switching
        const sidebarTabs = _sidePanel.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                sidebarTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                const view = this.dataset.view;
                const storeNav = _sidePanel.querySelector('.store-nav');
                const ideNav = _sidePanel.querySelector('.ide-nav');

                if (view === 'store') {
                    storeNav.style.display = 'block';
                    ideNav.style.display = 'none';
                } else {
                    storeNav.style.display = 'none';
                    ideNav.style.display = 'block';
                }
            });
        });

        // Store navigation
        const storeNavItems = _sidePanel.querySelectorAll('.store-nav li');
        storeNavItems.forEach(item => {
            item.addEventListener('click', function() {
                storeNavItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                const view = this.dataset.view;
                const contentViews = _contentPanel.querySelectorAll('.content-view');

                contentViews.forEach(contentView => {
                    contentView.style.display =
                        contentView.classList.contains(`${view}-view`) ? 'block' : 'none';
                });
            });
        });

        // Language selection for IDE
        const languageItems = _sidePanel.querySelectorAll('.language-item');
        languageItems.forEach(item => {
            item.addEventListener('click', function() {
                const language = this.dataset.language;
                _initializeCodeEditor(language);
            });
        });

        // Close button
        const closeBtn = document.getElementById('ecommerce-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => toggleEcommercePanel(false));
        }

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', _openProductModal);
        }
    }

    /**
     * Toggle the E-Commerce panel visibility
     * @param {boolean} [show] - Optional flag to force show/hide
     */
    function toggleEcommercePanel(show) {
        if (_mainPanel) {
            if (show === undefined) {
                _mainPanel.classList.toggle('hidden');
            } else if (show) {
                _mainPanel.classList.remove('hidden');
            } else {
                _mainPanel.classList.add('hidden');
            }
        }
    }

    /**
     * Initialize code editor for a specific language
     * @param {string} language - Programming language
     */
    function _initializeCodeEditor(language) {
        const languageConfig = _supportedLanguages.find(
            lang => lang.name.toLowerCase() === language
        );

        if (languageConfig) {
            const codeEditor = document.getElementById('code-editor');
            codeEditor.innerHTML = ''; // Clear previous content

            // Create textarea for code editing
            const textarea = document.createElement('textarea');
            textarea.value = languageConfig.defaultTemplate;
            textarea.className = 'code-editor-textarea';
            textarea.setAttribute('data-language', language);

            codeEditor.appendChild(textarea);
        }
    }

    /**
     * Create a default store if no stores exist
     */
    function _createDefaultStore() {
        const defaultStore = {
            id: _generateId(),
            name: 'My First Store',
            currency: 'USD',
            createdAt: new Date().toISOString(),
            products: [],
            orders: [],
            customers: []
        };

        _stores.push(defaultStore);
        _currentStore = defaultStore.id;

        _saveToStorage();
    }

    /**
     * Open product modal for adding/editing products
     */
  function _openProductModal() {
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.className = 'glass-modal product-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Product</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="product-form">
                        <div class="form-group">
                            <label>Product Name</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Price</label>
                            <input type="number" name="price" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Stock Quantity</label>
                            <input type="number" name="stock" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <select name="category">
                                <option value="">Select Category</option>
                                <option value="electronics">Electronics</option>
                                <option value="clothing">Clothing</option>
                                <option value="books">Books</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Image URL</label>
                            <input type="url" name="imageUrl" placeholder="Optional product image URL">
                        </div>
                        <div class="form-group">
                            <label>Product Status</label>
                            <select name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="glass-button primary">Save Product</button>
                            <button type="button" class="glass-button cancel-modal-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(modal);

        // Event listeners
        const closeButtons = modal.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        // Form submission
        const productForm = modal.querySelector('#product-form');
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(this);
            const productData = {
                id: _generateId(),
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')),
                description: formData.get('description') || '',
                category: formData.get('category') || 'other',
                imageUrl: formData.get('imageUrl') || '',
                status: formData.get('status') || 'active',
                createdAt: new Date().toISOString()
            };

            // Validate price and stock
            if (isNaN(productData.price) || productData.price <= 0) {
                alert('Please enter a valid price');
                return;
            }

            if (isNaN(productData.stock) || productData.stock < 0) {
                alert('Please enter a valid stock quantity');
                return;
            }

            // Add product to current store
            _addProduct(productData);

            // Close modal
            document.body.removeChild(modal);

            // Refresh products view
            _refreshProductsView();
        });
    }

    /**
     * Add a product to the current store
     * @param {Object} productData - Product information
     */
    function _addProduct(productData) {
        const currentStore = _stores.find(store => store.id === _currentStore);
        if (currentStore) {
            currentStore.products.push(productData);
            _products.push(productData);
            _saveToStorage();

            // Show success message
            if (typeof showToast === 'function') {
                showToast('success', 'Product added successfully');
            }
        }
    }

    /**
     * Refresh the products view
     */
    function _refreshProductsView() {
        const productsTable = document.getElementById('products-table');
        if (!productsTable) return;

        const tbody = productsTable.querySelector('tbody');
        tbody.innerHTML = '';

        const currentStore = _stores.find(store => store.id === _currentStore);
        if (!currentStore || !currentStore.products) return;

        currentStore.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="glass-button small edit-product-btn" data-product-id="${product.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="glass-button small delete-product-btn" data-product-id="${product.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for edit and delete buttons
        tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                _editProduct(productId);
            });
        });

        tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                _deleteProduct(productId);
            });
        });
    }

    /**
     * Edit a product
     * @param {string} productId - Product ID
     */
    function _editProduct(productId) {
        const product = _products.find(p => p.id === productId);
        if (!product) return;

        // For now, just show an alert - could be expanded to open edit modal
        if (typeof showToast === 'function') {
            showToast('info', `Edit product: ${product.name}`);
        }
    }

    /**
     * Delete a product
     * @param {string} productId - Product ID
     */
    function _deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            const currentStore = _stores.find(store => store.id === _currentStore);
            if (currentStore) {
                currentStore.products = currentStore.products.filter(p => p.id !== productId);
                _products = _products.filter(p => p.id !== productId);
                _saveToStorage();
                _refreshProductsView();

                if (typeof showToast === 'function') {
                    showToast('success', 'Product deleted successfully');
                }
            }
        }
    }

    /**
     * Generate a unique ID
     * @returns {string} - Unique identifier
     */
    function _generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Load data from storage
     */
    function _loadFromStorage() {
        try {
            const storedData = localStorage.getItem('ecommerce_data');
            if (storedData) {
                const data = JSON.parse(storedData);
                _stores = data.stores || [];
                _products = data.products || [];
                _orders = data.orders || [];
                _customers = data.customers || [];
                _currentStore = data.currentStore || null;
                _settings = { ..._settings, ...(data.settings || {}) };
            }
        } catch (error) {
            console.error('Error loading e-commerce data from storage:', error);
        }
    }

    /**
     * Save data to storage
     */
    function _saveToStorage() {
        try {
            const data = {
                stores: _stores,
                products: _products,
                orders: _orders,
                customers: _customers,
                currentStore: _currentStore,
                settings: _settings
            };
            localStorage.setItem('ecommerce_data', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving e-commerce data to storage:', error);
        }
    }

    /**
     * Initialize the E-Commerce system when DOM is ready
     */
    function initializeEcommerceSystem() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // Public API - expose functions for external access
    return {
        initialize: initializeEcommerceSystem,
        togglePanel: toggleEcommercePanel,
        showPanel: () => toggleEcommercePanel(true),
        hidePanel: () => toggleEcommercePanel(false),
        isInitialized: () => _initialized,
        getSettings: () => ({ ..._settings }),
        updateSettings: (newSettings) => Object.assign(_settings, newSettings),
        addProduct: _addProduct,
        refreshProductsView: _refreshProductsView
    };

})(); // End of IIFE

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EcommerceSystem;
} else if (typeof window !== 'undefined') {
    window.EcommerceSystem = EcommerceSystem;
}