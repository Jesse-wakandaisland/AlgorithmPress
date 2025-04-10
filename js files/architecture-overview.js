/**
 * AlgorithmPress PHP-WASM Builder - Architecture Overview
 * 
 * This document outlines the core architecture of the PHP-WASM Builder,
 * a drag-and-drop CMS builder that creates PHP-based web applications
 * that run entirely in the browser using PHP-WASM and store data on Cubbit.
 */

// Main application structure using IIFE for encapsulation
(function(window, document) {
  'use strict';
  
  // Core modules
  const PHPWASM_BUILDER = {
    // Application configuration
    config: {
      version: '1.0.0',
      defaultTheme: 'bootstrap',
      phpVersion: '8.2',
      availableExtensions: [
        'core', 'date', 'libxml', 'openssl', 'pcre', 'sqlite3', 
        'zlib', 'ctype', 'curl', 'dom', 'fileinfo', 'filter', 
        'iconv', 'pdo', 'pdo_sqlite', 'phar', 'simplexml', 'tokenizer'
      ],
      storageMethods: {
        localStorage: true,
        cubbitDS3: true,
        fileSystem: true
      }
    },
    
    // Application state management
    state: {
      // State variables
      currentProject: null,
      currentTheme: null,
      isDragging: false,
      selectedComponent: null,
      phpEnvironment: null,
      fileSystem: {},
      
      // Observable pattern implementation
      observers: {},
      
      // Subscribe to state changes
      subscribe: function(event, callback) {
        if (!this.observers[event]) {
          this.observers[event] = [];
        }
        this.observers[event].push(callback);
      },
      
      // Notify observers of state changes
      notify: function(event, data) {
        if (this.observers[event]) {
          this.observers[event].forEach(callback => callback(data));
        }
      },
      
      // Update state and notify observers
      update: function(key, value) {
        this[key] = value;
        this.notify(key + 'Changed', value);
        this.notify('stateChanged', { key, value });
      }
    },
    
    // Initialize the application
    init: function() {
      this.UI.init();
      this.ComponentsLibrary.init();
      this.DragDrop.init();
      this.PHP.init();
      this.Storage.init();
      this.EventHandlers.bindEvents();
      
      // Load last project if available
      this.ProjectManager.loadLastProject();
      
      console.log('PHP-WASM Builder initialized');
    },
    
    // UI module for rendering and managing the user interface
    UI: {
      elements: {},
      
      init: function() {
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize UI components
        this.setupTabs();
        this.setupThemeSelector();
        this.setupResizers();
        this.renderComponentsLibrary();
        
        // Initialize code editors
        this.initCodeEditors();
      },
      
      cacheElements: function() {
        // Cache all important DOM elements for performance
        this.elements = {
          sidebar: document.getElementById('builder-sidebar'),
          canvas: document.getElementById('builder-canvas'),
          componentsContainer: document.getElementById('components-container'),
          propertiesPanel: document.getElementById('properties-panel'),
          codePanel: document.getElementById('code-panel'),
          phpEditor: document.getElementById('php-editor'),
          cssEditor: document.getElementById('css-editor'),
          jsEditor: document.getElementById('js-editor'),
          previewFrame: document.getElementById('preview-frame'),
          saveButton: document.getElementById('save-project-btn'),
          exportButton: document.getElementById('export-project-btn'),
          themeSelector: document.getElementById('theme-selector'),
          tabs: document.querySelectorAll('.sidebar-tab')
        };
      },
      
      setupTabs: function() {
        const tabs = this.elements.tabs;
        
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const contentId = tab.getAttribute('data-tab');
            document.querySelectorAll('.sidebar-content').forEach(content => {
              content.style.display = 'none';
            });
            document.getElementById(contentId).style.display = 'block';
          });
        });
      },
      
      setupThemeSelector: function() {
        const selector = this.elements.themeSelector;
        
        if (selector) {
          selector.addEventListener('change', (e) => {
            PHPWASM_BUILDER.ThemeManager.setTheme(e.target.value);
          });
        }
      },
      
      setupResizers: function() {
        // Implement resizable panels
        // ...
      },
      
      renderComponentsLibrary: function() {
        const container = this.elements.componentsContainer;
        const components = PHPWASM_BUILDER.ComponentsLibrary.getComponents();
        
        // Group components by category
        const categories = {};
        components.forEach(component => {
          if (!categories[component.category]) {
            categories[component.category] = [];
          }
          categories[component.category].push(component);
        });
        
        // Clear container
        container.innerHTML = '';
        
        // Render components by category
        Object.keys(categories).forEach(category => {
          const categoryEl = document.createElement('div');
          categoryEl.className = 'component-category';
          
          const categoryTitle = document.createElement('h3');
          categoryTitle.className = 'component-category-title';
          categoryTitle.textContent = category;
          categoryEl.appendChild(categoryTitle);
          
          const componentsEl = document.createElement('div');
          componentsEl.className = 'component-items';
          
          categories[category].forEach(component => {
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
          container.appendChild(categoryEl);
        });
      },
      
      initCodeEditors: function() {
        // Initialize code editors with syntax highlighting
        // ...
      },
      
      updatePropertiesPanel: function(component) {
        const panel = this.elements.propertiesPanel;
        panel.innerHTML = '';
        
        if (!component) return;
        
        // Create properties form based on component definition
        const form = document.createElement('form');
        
        // Add component title
        const title = document.createElement('h3');
        title.textContent = component.name + ' Properties';
        form.appendChild(title);
        
        // Add properties fields
        component.properties.forEach(prop => {
          const group = document.createElement('div');
          group.className = 'property-group';
          
          const label = document.createElement('label');
          label.textContent = prop.label;
          label.className = 'property-label';
          
          const input = this.createPropertyInput(prop);
          input.className = 'property-control';
          
          group.appendChild(label);
          group.appendChild(input);
          form.appendChild(group);
        });
        
        panel.appendChild(form);
      },
      
      createPropertyInput: function(prop) {
        let input;
        
        switch (prop.type) {
          case 'text':
            input = document.createElement('input');
            input.type = 'text';
            break;
          case 'number':
            input = document.createElement('input');
            input.type = 'number';
            break;
          case 'color':
            input = document.createElement('input');
            input.type = 'color';
            break;
          case 'select':
            input = document.createElement('select');
            prop.options.forEach(option => {
              const opt = document.createElement('option');
              opt.value = option.value;
              opt.textContent = option.label;
              input.appendChild(opt);
            });
            break;
          case 'textarea':
            input = document.createElement('textarea');
            break;
          case 'checkbox':
            input = document.createElement('input');
            input.type = 'checkbox';
            break;
          default:
            input = document.createElement('input');
            input.type = 'text';
        }
        
        // Set common attributes
        input.name = prop.name;
        input.id = 'prop-' + prop.name;
        input.value = prop.default || '';
        input.setAttribute('data-property', prop.name);
        
        // Add change event
        input.addEventListener('change', () => {
          const value = input.type === 'checkbox' ? input.checked : input.value;
          PHPWASM_BUILDER.ComponentsLibrary.updateSelectedComponentProperty(prop.name, value);
        });
        
        return input;
      },
      
      showPreview: function() {
        // Update the preview iframe with the current project
        const preview = this.elements.previewFrame;
        const project = PHPWASM_BUILDER.state.currentProject;
        
        if (!project) return;
        
        // Generate HTML with PHP tags
        const html = PHPWASM_BUILDER.ProjectManager.generateProjectHtml();
        
        // Set up preview with PHP-WASM
        const doc = preview.contentDocument;
        doc.open();
        doc.write(html);
        doc.close();
        
        // Initialize PHP-WASM in the iframe
        PHPWASM_BUILDER.PHP.initInFrame(preview);
      }
    },
    
    // ComponentsLibrary module for managing available components
    ComponentsLibrary: {
      components: [],
      
      init: function() {
        this.registerCoreComponents();
      },
      
      registerCoreComponents: function() {
        // Register basic components
        this.registerComponent({
          id: 'text',
          name: 'Text Block',
          category: 'Basic',
          icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>',
          template: '<div class="text-component"><?php echo "{{ content }}"; ?></div>',
          properties: [
            {
              name: 'content',
              label: 'Content',
              type: 'textarea',
              default: 'Text content here'
            },
            {
              name: 'className',
              label: 'CSS Class',
              type: 'text',
              default: ''
            }
          ],
          render: function(props) {
            return this.template.replace('{{ content }}', props.content);
          }
        });
        
        // Register more core components...
        this.registerComponent({
          id: 'heading',
          name: 'Heading',
          category: 'Basic',
          icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 5h12v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z"/></svg>',
          template: '<{{ tag }} class="heading-component"><?php echo "{{ content }}"; ?></{{ tag }}>',
          properties: [
            {
              name: 'tag',
              label: 'Heading Level',
              type: 'select',
              options: [
                { value: 'h1', label: 'H1' },
                { value: 'h2', label: 'H2' },
                { value: 'h3', label: 'H3' },
                { value: 'h4', label: 'H4' },
                { value: 'h5', label: 'H5' },
                { value: 'h6', label: 'H6' }
              ],
              default: 'h2'
            },
            {
              name: 'content',
              label: 'Content',
              type: 'text',
              default: 'Heading'
            },
            {
              name: 'className',
              label: 'CSS Class',
              type: 'text',
              default: ''
            }
          ],
          render: function(props) {
            let html = this.template.replace(/{{ tag }}/g, props.tag);
            html = html.replace('{{ content }}', props.content);
            return html;
          }
        });
        
        // PHP specific components
        this.registerComponent({
          id: 'php-code',
          name: 'PHP Code',
          category: 'PHP',
          icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>',
          template: '<?php\n{{ code }}\n?>',
          properties: [
            {
              name: 'code',
              label: 'PHP Code',
              type: 'textarea',
              default: '// Your PHP code here\n$greeting = "Hello World!";\necho $greeting;'
            }
          ],
          render: function(props) {
            return this.template.replace('{{ code }}', props.code);
          }
        });
        
        // Form component with PHP processing
        this.registerComponent({
          id: 'php-form',
          name: 'PHP Form',
          category: 'PHP',
          icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H7c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z"/></svg>',
          template: `
<form method="post" action="">
  <div class="form-group">
    <label for="{{ id }}-name">Name</label>
    <input type="text" class="form-control" id="{{ id }}-name" name="name">
  </div>
  <div class="form-group">
    <label for="{{ id }}-email">Email</label>
    <input type="email" class="form-control" id="{{ id }}-email" name="email">
  </div>
  <div class="form-group">
    <label for="{{ id }}-message">Message</label>
    <textarea class="form-control" id="{{ id }}-message" name="message" rows="3"></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>

<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $name = $_POST['name'] ?? '';
  $email = $_POST['email'] ?? '';
  $message = $_POST['message'] ?? '';
  
  // Process form data
  echo '<div class="alert alert-success mt-3">Form submitted! Thank you, ' . htmlspecialchars($name) . '!</div>';
  
  // Here you could save to a database, send email, etc.
}
?>
          `,
          properties: [
            {
              name: 'id',
              label: 'Form ID',
              type: 'text',
              default: 'form' + Math.floor(Math.random() * 10000)
            },
            {
              name: 'processingCode',
              label: 'PHP Processing Code',
              type: 'textarea',
              default: '// Additional processing code here'
            }
          ],
          render: function(props) {
            let html = this.template.replace(/{{ id }}/g, props.id);
            // Insert additional processing code
            html = html.replace('// Here you could save to a database, send email, etc.', props.processingCode);
            return html;
          }
        });
        
        // Database component
        this.registerComponent({
          id: 'php-database',
          name: 'SQLite Database',
          category: 'PHP',
          icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M7 17.013l4.413-.015 9.632-9.54c.378-.378.586-.88.586-1.414s-.208-1.036-.586-1.414l-1.586-1.586c-.756-.756-2.075-.752-2.825-.003L7 12.583v4.43zM18.045 4.458l1.589 1.583-1.597 1.582-1.586-1.585 1.594-1.58zM9 13.417l6.03-5.973 1.586 1.586-6.029 5.971L9 15.006v-1.589z"/></svg>',
          template: `
<?php
// Initialize SQLite database
$dbPath = '{{ dbName }}.sqlite';
$db = new SQLite3($dbPath);

// Create table if it doesn't exist
$db->exec('
  CREATE TABLE IF NOT EXISTS {{ tableName }} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    {{ tableColumns }}
  )
');

// Sample query
$results = $db->query('SELECT * FROM {{ tableName }} LIMIT 10');

// Display results
echo '<div class="database-results">';
echo '<h3>{{ tableName }} Data</h3>';
echo '<table class="table table-striped">';
echo '<thead><tr>';
echo '<th>ID</th>';
{{ tableHeaders }}
echo '</tr></thead>';
echo '<tbody>';

while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
  echo '<tr>';
  echo '<td>' . $row['id'] . '</td>';
  {{ tableRows }}
  echo '</tr>';
}

echo '</tbody>';
echo '</table>';
echo '</div>';
?>
          `,
          properties: [
            {
              name: 'dbName',
              label: 'Database Name',
              type: 'text',
              default: 'myapp'
            },
            {
              name: 'tableName',
              label: 'Table Name',
              type: 'text',
              default: 'users'
            },
            {
              name: 'columns',
              label: 'Columns (name:type, one per line)',
              type: 'textarea',
              default: 'name:TEXT\nemail:TEXT\ncreated_at:DATETIME'
            }
          ],
          render: function(props) {
            let html = this.template.replace(/{{ dbName }}/g, props.dbName);
            html = html.replace(/{{ tableName }}/g, props.tableName);
            
            // Process columns
            const columns = props.columns.split('\n')
              .map(col => col.trim())
              .filter(col => col.length > 0);
            
            const tableColumns = columns
              .map(col => {
                const [name, type] = col.split(':');
                return `${name} ${type}`;
              })
              .join(',\n    ');
            
            // Generate table headers
            const tableHeaders = columns
              .map(col => {
                const [name] = col.split(':');
                return `echo '<th>${name}</th>';`;
              })
              .join('\n');
            
            // Generate table rows
            const tableRows = columns
              .map(col => {
                const [name] = col.split(':');
                return `echo '<td>' . $row['${name}'] . '</td>';`;
              })
              .join('\n  ');
            
            html = html.replace('{{ tableColumns }}', tableColumns);
            html = html.replace('{{ tableHeaders }}', tableHeaders);
            html = html.replace('{{ tableRows }}', tableRows);
            
            return html;
          }
        });

        // Many more components would be registered here...
      },
      
      registerComponent: function(component) {
        this.components.push(component);
      },
      
      getComponents: function() {
        return this.components;
      },
      
      getComponentById: function(id) {
        return this.components.find(comp => comp.id === id);
      },
      
      updateSelectedComponentProperty: function(propName, value) {
        const selectedComponent = PHPWASM_BUILDER.state.selectedComponent;
        if (!selectedComponent) return;
        
        selectedComponent.props[propName] = value;
        PHPWASM_BUILDER.state.notify('componentUpdated', selectedComponent);
        
        // Re-render the component in the canvas
        PHPWASM_BUILDER.DragDrop.renderCanvas();
      }
    },
    
    // DragDrop module for handling drag and drop functionality
    DragDrop: {
      init: function() {
        this.bindEvents();
      },
      
      bindEvents: function() {
        const componentsContainer = PHPWASM_BUILDER.UI.elements.componentsContainer;
        const canvas = PHPWASM_BUILDER.UI.elements.canvas;
        
        // Make components draggable
        componentsContainer.addEventListener('dragstart', this.handleDragStart.bind(this));
        componentsContainer.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Set up canvas as drop target
        canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        canvas.addEventListener('dragleave', this.handleDragLeave.bind(this));
        canvas.addEventListener('drop', this.handleDrop.bind(this));
        
        // Set up component selection
        canvas.addEventListener('click', this.handleCanvasClick.bind(this));
      },
      
      handleDragStart: function(e) {
        const componentItem = e.target.closest('.component-item');
        if (!componentItem) return;
        
        const componentId = componentItem.getAttribute('data-component-id');
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'component',
          id: componentId
        }));
        
        PHPWASM_BUILDER.state.update('isDragging', true);
      },
      
      handleDragEnd: function() {
        PHPWASM_BUILDER.state.update('isDragging', false);
      },
      
      handleDragOver: function(e) {
        e.preventDefault();
        const dropZone = e.target.closest('.drop-zone') || e.target;
        dropZone.classList.add('drop-zone-active');
      },
      
      handleDragLeave: function(e) {
        const dropZone = e.target.closest('.drop-zone') || e.target;
        dropZone.classList.remove('drop-zone-active');
      },
      
      handleDrop: function(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest('.drop-zone') || e.target;
        dropZone.classList.remove('drop-zone-active');
        
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        
        const parsedData = JSON.parse(data);
        if (parsedData.type === 'component') {
          this.addComponent(parsedData.id, dropZone);
        }
      },
      
      addComponent: function(componentId, dropZone) {
        const component = PHPWASM_BUILDER.ComponentsLibrary.getComponentById(componentId);
        if (!component) return;
        
        // Create instance of component
        const instance = {
          id: component.id + '-' + Math.random().toString(36).substr(2, 9),
          componentId: component.id,
          props: {}
        };
        
        // Set default props
        component.properties.forEach(prop => {
          instance.props[prop.name] = prop.default || '';
        });
        
        // Add to project
        if (!PHPWASM_BUILDER.state.currentProject.components) {
          PHPWASM_BUILDER.state.currentProject.components = [];
        }
        PHPWASM_BUILDER.state.currentProject.components.push(instance);
        
        // Render canvas
        this.renderCanvas();
        
        // Select the new component
        PHPWASM_BUILDER.state.update('selectedComponent', instance);
      },
      
      handleCanvasClick: function(e) {
        const componentEl = e.target.closest('.builder-component');
        if (!componentEl) {
          // Clicked outside of components, deselect
          PHPWASM_BUILDER.state.update('selectedComponent', null);
          return;
        }
        
        const componentId = componentEl.getAttribute('data-component-id');
        const component = PHPWASM_BUILDER.state.currentProject.components.find(c => c.id === componentId);
        
        if (component) {
          // Select this component
          PHPWASM_BUILDER.state.update('selectedComponent', component);
          
          // Update properties panel
          const componentDef = PHPWASM_BUILDER.ComponentsLibrary.getComponentById(component.componentId);
          PHPWASM_BUILDER.UI.updatePropertiesPanel(componentDef);
        }
      },
      
      renderCanvas: function() {
        const canvas = PHPWASM_BUILDER.UI.elements.canvas;
        const project = PHPWASM_BUILDER.state.currentProject;
        
        if (!project || !project.components) {
          canvas.innerHTML = '<div class="drop-zone">Drop components here</div>';
          return;
        }
        
        // Clear canvas
        canvas.innerHTML = '';
        
        // Create main drop zone
        const mainDropZone = document.createElement('div');
        mainDropZone.className = 'drop-zone';
        
        // Render each component
        project.components.forEach(instance => {
          const componentDef = PHPWASM_BUILDER.ComponentsLibrary.getComponentById(instance.componentId);
          if (!componentDef) return;
          
          const componentEl = document.createElement('div');
          componentEl.className = 'builder-component';
          componentEl.setAttribute('data-component-id', instance.id);
          
          // Check if this is the selected component
          const selectedComponent = PHPWASM_BUILDER.state.selectedComponent;
          if (selectedComponent && selectedComponent.id === instance.id) {
            componentEl.classList.add('selected');
          }
          
          // Add component controls
          const controls = document.createElement('div');
          controls.className = 'component-controls';
          
          const moveUpBtn = document.createElement('button');
          moveUpBtn.className = 'component-control-btn';
          moveUpBtn.innerHTML = '↑';
          moveUpBtn.title = 'Move Up';
          moveUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveComponentUp(instance.id);
          });
          
          const moveDownBtn = document.createElement('button');
          moveDownBtn.className = 'component-control-btn';
          moveDownBtn.innerHTML = '↓';
          moveDownBtn.title = 'Move Down';
          moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveComponentDown(instance.id);
          });
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'component-control-btn delete';
          deleteBtn.innerHTML = '×';
          deleteBtn.title = 'Delete';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteComponent(instance.id);
          });
          
          controls.appendChild(moveUpBtn);
          controls.appendChild(moveDownBtn);
          controls.appendChild(deleteBtn);
          componentEl.appendChild(controls);
          
          // Render component content
          const contentEl = document.createElement('div');
          contentEl.className = 'component-content';
          contentEl.innerHTML = componentDef.render(instance.props);
          componentEl.appendChild(contentEl);
          
          // Add component to canvas
          mainDropZone.appendChild(componentEl);
        });
        
        canvas.appendChild(mainDropZone);
      },
      
      moveComponentUp: function(componentId) {
        const components = PHPWASM_BUILDER.state.currentProject.components;
        const index = components.findIndex(c => c.id === componentId);
        if (index <= 0) return;
        
        // Swap with previous component
        [components[index], components[index - 1]] = [components[index - 1], components[index]];
        
        // Re-render
        this.renderCanvas();
      },
      
      moveComponentDown: function(componentId) {
        const components = PHPWASM_BUILDER.state.currentProject.components;
        const index = components.findIndex(c => c.id === componentId);
        if (index < 0 || index >= components.length - 1) return;
        
        // Swap with next component
        [components[index], components[index + 1]] = [components[index + 1], components[index]];
        
        // Re-render
        this.renderCanvas();
      },
      
      deleteComponent: function(componentId) {
        const components = PHPWASM_BUILDER.state.currentProject.components;
        const index = components.findIndex(c => c.id === componentId);
        if (index < 0) return;
        
        // Remove component
        components.splice(index, 1);
        
        // Deselect if this was the selected component
        const selectedComponent = PHPWASM_BUILDER.state.selectedComponent;
        if (selectedComponent && selectedComponent.id === componentId) {
          PHPWASM_BUILDER.state.update('selectedComponent', null);
        }
        
        // Re-render
        this.renderCanvas();
      }
    },
    
    // PHP module for managing PHP-WASM integration
    PHP: {
      instance: null,
      filesystems: {},
      
      init: function() {
        // Load PHP-WASM
        this.loadPhpWasm();
      },
      
      loadPhpWasm: function() {
        // Load PHP-WASM script
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs';
        script.async = true;
        
        script.onload = () => {
          console.log('PHP-WASM loaded');
          PHPWASM_BUILDER.state.update('phpLoaded', true);
        };
        
        script.onerror = (error) => {
          console.error('Failed to load PHP-WASM:', error);
        };
        
        document.head.appendChild(script);
      },
      
      initInFrame: function(iframe) {
        const doc = iframe.contentDocument;
        
        // Inject PHP-WASM script
        const script = doc.createElement('script');
        script.type = 'module';
        script.src = 'https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs';
        script.async = true;
        
        doc.head.appendChild(script);
      },
      
      createPhpFile: function(filename, content) {
        // Create a PHP file in the virtual filesystem
        if (!this.instance) return Promise.reject('PHP not initialized');
        
        return this.instance.writeFile(filename, content);
      },
      
      executePhp: function(code) {
        if (!this.instance) return Promise.reject('PHP not initialized');
        
        return this.instance.run(code);
      },
      
      executePhpFile: function(filename) {
        if (!this.instance) return Promise.reject('PHP not initialized');
        
        return this.instance.run(`<?php include("${filename}"); ?>`);
      }
    },
    
    // Storage module for managing project storage
    Storage: {
      init: function() {
        // Initialize storage providers
        this.initLocalStorage();
        this.initCubbitStorage();
      },
      
      initLocalStorage: function() {
        // Local storage implementation
        // ...
      },
      
      initCubbitStorage: function() {
        // Cubbit DS3 storage implementation
        // ...
      },
      
      saveProject: function(project) {
        // Save project to selected storage
        const storage = project.storageMethod || 'localStorage';
        
        switch (storage) {
          case 'localStorage':
            return this.saveToLocalStorage(project);
          case 'cubbitDS3':
            return this.saveToCubbit(project);
          default:
            return Promise.reject('Unknown storage method');
        }
      },
      
      loadProject: function(id, storageMethod = 'localStorage') {
        // Load project from selected storage
        switch (storageMethod) {
          case 'localStorage':
            return this.loadFromLocalStorage(id);
          case 'cubbitDS3':
            return this.loadFromCubbit(id);
          default:
            return Promise.reject('Unknown storage method');
        }
      },
      
      saveToLocalStorage: function(project) {
        // Save project to local storage
        try {
          localStorage.setItem('phpwasm_project_' + project.id, JSON.stringify(project));
          localStorage.setItem('phpwasm_last_project', project.id);
          return Promise.resolve(project);
        } catch (error) {
          return Promise.reject(error);
        }
      },
      
      loadFromLocalStorage: function(id) {
        // Load project from local storage
        try {
          const project = JSON.parse(localStorage.getItem('phpwasm_project_' + id));
          return Promise.resolve(project);
        } catch (error) {
          return Promise.reject(error);
        }
      },
      
      saveToCubbit: function(project) {
        // Save project to Cubbit DS3
        // Implementation would use Cubbit's API
        // ...
        return Promise.resolve(project);
      },
      
      loadFromCubbit: function(id) {
        // Load project from Cubbit DS3
        // Implementation would use Cubbit's API
        // ...
        return Promise.resolve({});
      },
      
      listProjects: function(storageMethod = 'localStorage') {
        // List all projects in the selected storage
        switch (storageMethod) {
          case 'localStorage':
            return this.listFromLocalStorage();
          case 'cubbitDS3':
            return this.listFromCubbit();
          default:
            return Promise.reject('Unknown storage method');
        }
      },
      
      listFromLocalStorage: function() {
        // List all projects in local storage
        const projects = [];
        const keys = Object.keys(localStorage);
        
        for (const key of keys) {
          if (key.startsWith('phpwasm_project_')) {
            try {
              const project = JSON.parse(localStorage.getItem(key));
              projects.push({
                id: project.id,
                name: project.name,
                lastModified: project.lastModified
              });
            } catch (error) {
              console.error('Failed to parse project:', error);
            }
          }
        }
        
        return Promise.resolve(projects);
      },
      
      listFromCubbit: function() {
        // List all projects in Cubbit DS3
        // Implementation would use Cubbit's API
        // ...
        return Promise.resolve([]);
      }
    },
    
    // ProjectManager module for managing projects
    ProjectManager: {
      createNewProject: function(name) {
        const id = 'project-' + Date.now();
        const project = {
          id,
          name,
          components: [],
          theme: PHPWASM_BUILDER.config.defaultTheme,
          customCSS: '',
          customJS: '',
          phpSettings: {
            extensions: ['core', 'date', 'sqlite3']
          },
          storageMethod: 'localStorage',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        
        PHPWASM_BUILDER.state.update('currentProject', project);
        PHPWASM_BUILDER.Storage.saveProject(project);
        
        return project;
      },
      
      loadProject: function(id, storageMethod) {
        return PHPWASM_BUILDER.Storage.loadProject(id, storageMethod)
          .then(project => {
            PHPWASM_BUILDER.state.update('currentProject', project);
            return project;
          });
      },
      
      saveCurrentProject: function() {
        const project = PHPWASM_BUILDER.state.currentProject;
        if (!project) return Promise.reject('No project to save');
        
        // Update last modified date
        project.lastModified = new Date().toISOString();
        
        return PHPWASM_BUILDER.Storage.saveProject(project);
      },
      
      loadLastProject: function() {
        const lastProjectId = localStorage.getItem('phpwasm_last_project');
        if (lastProjectId) {
          return this.loadProject(lastProjectId);
        } else {
          // Create a default project
          return Promise.resolve(this.createNewProject('My First PHP-WASM Project'));
        }
      },
      
      exportProject: function(format = 'html') {
        const project = PHPWASM_BUILDER.state.currentProject;
        if (!project) return Promise.reject('No project to export');
        
        switch (format) {
          case 'html':
            return this.exportAsHtml(project);
          case 'zip':
            return this.exportAsZip(project);
          default:
            return Promise.reject('Unknown export format');
        }
      },
      
      exportAsHtml: function(project) {
        // Generate complete HTML with embedded PHP-WASM
        const html = this.generateProjectHtml(true);
        
        // Create download link
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.html`;
        a.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return Promise.resolve();
      },
      
      exportAsZip: function(project) {
        // Export as a ZIP file with separate PHP files
        // Would require a ZIP library like JSZip
        // ...
        return Promise.resolve();
      },
      
      generateProjectHtml: function(forExport = false) {
        const project = PHPWASM_BUILDER.state.currentProject;
        if (!project) return '';
        
        // Generate HTML for each component
        const componentsHtml = project.components.map(instance => {
          const componentDef = PHPWASM_BUILDER.ComponentsLibrary.getComponentById(instance.componentId);
          if (!componentDef) return '';
          return componentDef.render(instance.props);
        }).join('\n');
        
        // Include PHP-WASM script
        const phpWasmScript = `<script async type="module" src="https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs"></script>`;
        
        // Include custom CSS
        const customCSS = project.customCSS ? `<style>${project.customCSS}</style>` : '';
        
        // Include custom JavaScript
        const customJS = project.customJS ? `<script>${project.customJS}</script>` : '';
        
        // Generate theme CSS
        const themeCSS = PHPWASM_BUILDER.ThemeManager.getThemeCSS(project.theme);
        
        // Generate complete HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  ${themeCSS}
  ${customCSS}
  ${phpWasmScript}
</head>
<body>
  <div id="app">
    ${componentsHtml}
  </div>
  ${customJS}
</body>
</html>
        `;
        
        return html;
      }
    },
    
    // ThemeManager module for managing themes
    ThemeManager: {
      themes: {
        'bootstrap': {
          name: 'Bootstrap',
          css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css',
          js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js'
        },
        'material': {
          name: 'Material Design',
          css: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
          js: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'
        },
        'bulma': {
          name: 'Bulma',
          css: 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css',
          js: null
        },
        'tailwind': {
          name: 'Tailwind',
          css: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
          js: null
        },
        'none': {
          name: 'None (Plain HTML)',
          css: null,
          js: null
        }
      },
      
      getThemes: function() {
        return Object.entries(this.themes).map(([id, theme]) => ({
          id,
          name: theme.name
        }));
      },
      
      getTheme: function(themeId) {
        return this.themes[themeId] || this.themes.bootstrap;
      },
      
      setTheme: function(themeId) {
        const project = PHPWASM_BUILDER.state.currentProject;
        if (!project) return;
        
        project.theme = themeId;
        PHPWASM_BUILDER.state.update('currentProject', project);
        
        // Update theme in UI
        this.applyTheme(themeId);
      },
      
      applyTheme: function(themeId) {
        const theme = this.getTheme(themeId);
        
        // Update theme CSS link
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
          themeLink = document.createElement('link');
          themeLink.id = 'theme-css';
          themeLink.rel = 'stylesheet';
          document.head.appendChild(themeLink);
        }
        
        themeLink.href = theme.css || '';
        
        // Update preview
        PHPWASM_BUILDER.UI.showPreview();
      },
      
      getThemeCSS: function(themeId) {
        const theme = this.getTheme(themeId);
        
        let cssLink = '';
        let jsScript = '';
        
        if (theme.css) {
          cssLink = `<link rel="stylesheet" href="${theme.css}">`;
        }
        
        if (theme.js) {
          jsScript = `<script src="${theme.js}"></script>`;
        }
        
        return cssLink + jsScript;
      }
    },
    
    // EventHandlers module for binding global events
    EventHandlers: {
      bindEvents: function() {
        // Bind global event handlers
        const saveBtn = document.getElementById('save-project-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            PHPWASM_BUILDER.ProjectManager.saveCurrentProject()
              .then(() => {
                alert('Project saved successfully!');
              })
              .catch(error => {
                alert('Failed to save project: ' + error);
              });
          });
        }
        
        const exportBtn = document.getElementById('export-project-btn');
        if (exportBtn) {
          exportBtn.addEventListener('click', () => {
            PHPWASM_BUILDER.ProjectManager.exportProject('html')
              .then(() => {
                alert('Project exported successfully!');
              })
              .catch(error => {
                alert('Failed to export project: ' + error);
              });
          });
        }
        
        const newProjectBtn = document.getElementById('new-project-btn');
        if (newProjectBtn) {
          newProjectBtn.addEventListener('click', () => {
            const name = prompt('Enter a name for the new project:', 'My AlgorithmPress PHP-WASM Project');
            if (name) {
              PHPWASM_BUILDER.ProjectManager.createNewProject(name);
              PHPWASM_BUILDER.DragDrop.renderCanvas();
            }
          });
        }
        
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
          previewBtn.addEventListener('click', () => {
            PHPWASM_BUILDER.UI.showPreview();
          });
        }
        
        // Subscribe to state changes
        PHPWASM_BUILDER.state.subscribe('currentProjectChanged', () => {
          PHPWASM_BUILDER.DragDrop.renderCanvas();
        });
        
        PHPWASM_BUILDER.state.subscribe('selectedComponentChanged', (component) => {
          if (component) {
            const componentDef = PHPWASM_BUILDER.ComponentsLibrary.getComponentById(component.componentId);
            PHPWASM_BUILDER.UI.updatePropertiesPanel(componentDef);
          } else {
            PHPWASM_BUILDER.UI.updatePropertiesPanel(null);
          }
        });
      }
    }
  };
  
  // Initialize the application when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    PHPWASM_BUILDER.init();
  });
  
  // Expose the API globally
  window.PHPWASM_BUILDER = PHPWASM_BUILDER;
  
})(window, document);