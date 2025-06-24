/**
 * NexusGrid Infinite Demo Generator System
 * 
 * A system that dynamically generates infinite demo applications,
 * samples, and templates for the NexusGrid marketplace.
 */

const NexusGridDemoSystem = (function() {
    // Private variables
    let _config = {
        demoCategories: [
            'web-app', 'business', 'education', 'entertainment',
            'productivity', 'utilities', 'games', 'social',
            'health', 'finance', 'multimedia', 'development'
        ],
        templateTypes: [
            'landing-page', 'portfolio', 'blog', 'e-commerce',
            'dashboard', 'admin-panel', 'documentation', 'social-network',
            'learning-management', 'forum', 'marketplace', 'media-gallery'
        ],
        techStacks: [
            'vanilla-js', 'react', 'vue', 'angular',
            'php', 'node', 'python', 'ruby'
        ],
        colorSchemes: [
            'blue-gradient', 'green-earth', 'purple-haze', 'sunset-orange',
            'midnight-black', 'arctic-white', 'teal-ocean', 'vibrant-rainbow'
        ],
        generationLimits: {
            maxDailyGenerations: 1000,
            maxConcurrentGenerations: 10,
            generationTimeout: 30000 // 30 seconds
        }
    };
    
    // Track demo generation data
    const _generatedDemos = new Map();
    const _activeGenerations = new Set();
    const _generationQueue = [];
    const _demoComponents = new Map();
    const _demoTemplates = new Map();
    const _demoAssets = new Map();
    const _eventSubscribers = new Map();
    const _generationHistory = [];
    const _dailyGenerationCount = 0;
    const _lastGenerationReset = Date.now();
    
    // Integration with NexusGrid
    let _nexusGrid = null;
    
    // Seed data for demo generation
    const _seedData = {
        businessNames: [
            'Horizon Ventures', 'Stellar Solutions', 'Emerald Innovations', 
            'Sapphire Systems', 'Pinnacle Tech', 'Crystal Dynamics',
            'Vertex Analytics', 'Nebula Networks', 'Quantum Computing',
            'Atlas Digital', 'Phoenix Software', 'Oasis Technologies'
        ],
        productNames: [
            'Fusion', 'Nexus', 'Pulse', 'Echo', 'Prism', 'Vortex',
            'Zenith', 'Spectrum', 'Catalyst', 'Apex', 'Horizon', 'Quantum'
        ],
        industries: [
            'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
            'Technology', 'Media', 'Transportation', 'Energy', 'Agriculture',
            'Construction', 'Hospitality'
        ],
        features: [
            'Analytics Dashboard', 'User Management', 'Data Visualization',
            'Real-time Reporting', 'Secure Authentication', 'API Integration',
            'Document Management', 'Workflow Automation', 'Calendar Scheduling',
            'Messaging System', 'Task Management', 'Payment Processing'
        ],
        slogans: [
            'Innovate. Transform. Succeed.',
            'Building the Future, Today',
            'Where Ideas Come to Life',
            'Reimagine What\'s Possible',
            'Excellence in Technology',
            'Solutions for Tomorrow',
            'Inspiring Innovation',
            'Powering Your Success',
            'Technology with Purpose',
            'Creating Value Through Innovation'
        ]
    };
    
    /**
     * Initialize the demo generator system
     * @param {Object} config - Configuration options
     * @param {Object} nexusGrid - Reference to NexusGrid instance
     * @returns {Promise<void>}
     */
    async function initialize(config = {}, nexusGrid = null) {
        console.log('Initializing NexusGrid Demo Generator System...');
        
        // Merge provided config with defaults
        _config = {..._config, ...config};
        
        // Set NexusGrid reference
        _nexusGrid = nexusGrid;
        
        try {
            // Load pre-existing demo components
            await loadDemoComponents();
            
            // Load demo templates
            await loadDemoTemplates();
            
            // Load demo assets
            await loadDemoAssets();
            
            // Set up daily generation counter reset
            setupDailyReset();
            
            console.log('NexusGrid Demo Generator initialized successfully');
            triggerEvent('system:initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Demo Generator:', error);
            triggerEvent('system:error', { error });
            return false;
        }
    }
    
    /**
     * Load demo components from storage
     * @returns {Promise<void>}
     */
    async function loadDemoComponents() {
        console.log('Loading demo components...');
        
        try {
            // In a real implementation, this would load components from Cubbit storage
            // For simplicity, we'll use predefined components

            // UI Components
            _demoComponents.set('header', loadHeaderComponents());
            _demoComponents.set('footer', loadFooterComponents());
            _demoComponents.set('navigation', loadNavigationComponents());
            _demoComponents.set('hero', loadHeroComponents());
            _demoComponents.set('features', loadFeatureComponents());
            _demoComponents.set('pricing', loadPricingComponents());
            _demoComponents.set('testimonials', loadTestimonialComponents());
            _demoComponents.set('contact', loadContactComponents());
            _demoComponents.set('authentication', loadAuthComponents());
            _demoComponents.set('dashboard', loadDashboardComponents());
            
            console.log(`Loaded ${_demoComponents.size} component categories`);
            
            return true;
        } catch (error) {
            console.error('Failed to load demo components:', error);
            throw error;
        }
    }
    
    /**
     * Load demo templates from storage
     * @returns {Promise<void>}
     */
    async function loadDemoTemplates() {
        console.log('Loading demo templates...');
        
        try {
            // In a real implementation, this would load templates from Cubbit storage
            // For simplicity, we'll use predefined templates
            
            _config.templateTypes.forEach(templateType => {
                _demoTemplates.set(templateType, {
                    name: formatTitle(templateType),
                    type: templateType,
                    structure: generateTemplateStructure(templateType),
                    defaultComponents: getDefaultComponentsForTemplate(templateType)
                });
            });
            
            console.log(`Loaded ${_demoTemplates.size} demo templates`);
            
            return true;
        } catch (error) {
            console.error('Failed to load demo templates:', error);
            throw error;
        }
    }
    
    /**
     * Load demo assets from storage
     * @returns {Promise<void>}
     */
    async function loadDemoAssets() {
        console.log('Loading demo assets...');
        
        try {
            // In a real implementation, this would load assets from Cubbit storage
            // For simplicity, we'll use predefined asset urls
            
            _demoAssets.set('images', {
                logos: generatePlaceholderImageUrls('logo', 10),
                heroes: generatePlaceholderImageUrls('hero', 10),
                features: generatePlaceholderImageUrls('feature', 20),
                backgrounds: generatePlaceholderImageUrls('background', 15),
                avatars: generatePlaceholderImageUrls('avatar', 20),
                products: generatePlaceholderImageUrls('product', 30),
                icons: generatePlaceholderImageUrls('icon', 50)
            });
            
            _demoAssets.set('fonts', [
                'Arial, sans-serif',
                'Helvetica, sans-serif',
                'Georgia, serif',
                'Tahoma, sans-serif',
                'Verdana, sans-serif',
                'Times New Roman, serif',
                'Courier New, monospace',
                'Trebuchet MS, sans-serif',
                'Impact, sans-serif',
                'Comic Sans MS, cursive'
            ]);
            
            _demoAssets.set('colors', {
                primary: generateColorPalettes(10),
                secondary: generateColorPalettes(10),
                accent: generateColorPalettes(10),
                neutral: generateGrayscalePalettes(10)
            });
            
            console.log('Demo assets loaded successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to load demo assets:', error);
            throw error;
        }
    }
    
    /**
     * Set up daily reset for generation counter
     */
    function setupDailyReset() {
        setInterval(() => {
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            if (now - _lastGenerationReset >= dayInMs) {
                _dailyGenerationCount = 0;
                _lastGenerationReset = now;
                console.log('Reset daily generation counter');
            }
        }, 60 * 60 * 1000); // Check every hour
    }
    
    /**
     * Generate a demo application
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated demo information
     */
    async function generateDemo(options = {}) {
        console.log('Generating demo application with options:', options);
        
        // Check daily generation limit
        if (_dailyGenerationCount >= _config.generationLimits.maxDailyGenerations) {
            throw new Error('Daily generation limit reached');
        }
        
        // Generate a unique ID for this demo
        const demoId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Add to generation queue if we have too many active generations
        if (_activeGenerations.size >= _config.generationLimits.maxConcurrentGenerations) {
            return new Promise((resolve, reject) => {
                console.log(`Adding ${demoId} to generation queue`);
                _generationQueue.push({
                    demoId,
                    options,
                    resolve,
                    reject
                });
            });
        }
        
        return processDemoGeneration(demoId, options);
    }
    
    /**
     * Process demo generation
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated demo information
     */
    async function processDemoGeneration(demoId, options) {
        console.log(`Processing generation for ${demoId}`);
        _activeGenerations.add(demoId);
        
        try {
            triggerEvent('demo:generating', { demoId, options });
            
            // Set default options
            const generationOptions = {
                category: options.category || getRandomItem(_config.demoCategories),
                templateType: options.templateType || getRandomItem(_config.templateTypes),
                techStack: options.techStack || getRandomItem(_config.techStacks),
                colorScheme: options.colorScheme || getRandomItem(_config.colorSchemes),
                name: options.name || generateDemoName(),
                description: options.description || generateDemoDescription(),
                features: options.features || generateFeaturesList(),
                complexity: options.complexity || Math.floor(Math.random() * 3) + 1, // 1-3
                includeData: options.includeData !== undefined ? options.includeData : true,
                ...options
            };
            
            // Start generation timer
            const startTime = Date.now();
            const generationTimeout = setTimeout(() => {
                if (_activeGenerations.has(demoId)) {
                    _activeGenerations.delete(demoId);
                    triggerEvent('demo:generation-timeout', { demoId });
                    
                    // Process next demo in queue if any
                    processNextInQueue();
                }
            }, _config.generationLimits.generationTimeout);
            
            // Generate demo files
            const demoFiles = await generateDemoFiles(demoId, generationOptions);
            
            // Clear timeout
            clearTimeout(generationTimeout);
            
            // Prepare demo metadata
            const demoInfo = {
                id: demoId,
                name: generationOptions.name,
                description: generationOptions.description,
                category: generationOptions.category,
                templateType: generationOptions.templateType,
                techStack: generationOptions.techStack,
                colorScheme: generationOptions.colorScheme,
                features: generationOptions.features,
                complexity: generationOptions.complexity,
                files: demoFiles.map(file => ({
                    path: file.path,
                    size: file.content.length,
                    contentType: file.contentType
                })),
                screenshot: generateScreenshotUrl(demoId),
                createdAt: Date.now(),
                generationTime: Date.now() - startTime
            };
            
            // Store demo information
            _generatedDemos.set(demoId, {
                ...demoInfo,
                files: demoFiles
            });
            
            // Track generation history
            _generationHistory.push({
                id: demoId,
                options: generationOptions,
                timestamp: Date.now(),
                success: true
            });
            
            // Increment daily generation count
            _dailyGenerationCount++;
            
            console.log(`Demo ${demoId} generated successfully in ${demoInfo.generationTime}ms`);
            triggerEvent('demo:generated', { demoId, demoInfo });
            
            // Deploy to NexusGrid if available
            if (_nexusGrid) {
                try {
                    const deploymentOptions = {
                        id: demoId,
                        name: demoInfo.name,
                        description: demoInfo.description,
                        version: '1.0.0',
                        author: 'NexusGrid Demo Generator',
                        license: 'MIT',
                        category: mapCategoryToNexusGrid(demoInfo.category),
                        tags: [
                            'demo',
                            demoInfo.templateType,
                            demoInfo.techStack,
                            demoInfo.colorScheme,
                            `complexity-${demoInfo.complexity}`
                        ],
                        files: demoFiles,
                        published: options.publish || false
                    };
                    
                    const deployedApp = await _nexusGrid.deployApplication(deploymentOptions);
                    demoInfo.deployedAppId = deployedApp.id;
                    
                    console.log(`Demo ${demoId} deployed to NexusGrid with appId ${deployedApp.id}`);
                } catch (error) {
                    console.error(`Failed to deploy demo ${demoId} to NexusGrid:`, error);
                }
            }
            
            return demoInfo;
        } catch (error) {
            console.error(`Demo generation failed for ${demoId}:`, error);
            
            // Track failed generation
            _generationHistory.push({
                id: demoId,
                options,
                timestamp: Date.now(),
                success: false,
                error: error.message
            });
            
            triggerEvent('demo:generation-failed', { demoId, error });
            throw error;
        } finally {
            _activeGenerations.delete(demoId);
            
            // Process next demo in queue if any
            processNextInQueue();
        }
    }
    
    /**
     * Process the next demo in the generation queue
     */
    function processNextInQueue() {
        if (_generationQueue.length > 0 && _activeGenerations.size < _config.generationLimits.maxConcurrentGenerations) {
            const nextGeneration = _generationQueue.shift();
            
            processDemoGeneration(nextGeneration.demoId, nextGeneration.options)
                .then(nextGeneration.resolve)
                .catch(nextGeneration.reject);
        }
    }
    
    /**
     * Generate files for a demo application
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {Promise<Array>} Generated files
     */
    async function generateDemoFiles(demoId, options) {
        console.log(`Generating files for demo ${demoId}`);
        
        // Get template structure
        const template = _demoTemplates.get(options.templateType);
        
        if (!template) {
            throw new Error(`Template type ${options.templateType} not found`);
        }
        
        const files = [];
        
        // Generate files based on template structure and tech stack
        switch (options.techStack) {
            case 'vanilla-js':
                files.push(...generateVanillaJSDemo(demoId, template, options));
                break;
            case 'react':
                files.push(...generateReactDemo(demoId, template, options));
                break;
            case 'vue':
                files.push(...generateVueDemo(demoId, template, options));
                break;
            case 'angular':
                files.push(...generateAngularDemo(demoId, template, options));
                break;
            case 'php':
                files.push(...generatePHPDemo(demoId, template, options));
                break;
            default:
                files.push(...generateVanillaJSDemo(demoId, template, options));
        }
        
        // Generate data files if needed
        if (options.includeData) {
            files.push(...generateDataFiles(demoId, options));
        }
        
        // Generate README
        files.push({
            path: 'README.md',
            content: generateReadme(demoId, options),
            contentType: 'text/markdown'
        });
        
        // Generate manifest file
        files.push({
            path: 'demo-manifest.json',
            content: JSON.stringify({
                id: demoId,
                name: options.name,
                description: options.description,
                category: options.category,
                templateType: options.templateType,
                techStack: options.techStack,
                colorScheme: options.colorScheme,
                features: options.features,
                complexity: options.complexity,
                generatedAt: Date.now()
            }, null, 2),
            contentType: 'application/json'
        });
        
        return files;
    }
    
    /**
     * Generate Vanilla JS demo files
     * @param {string} demoId - Demo ID
     * @param {Object} template - Template information
     * @param {Object} options - Generation options
     * @returns {Array} Generated files
     */
    function generateVanillaJSDemo(demoId, template, options) {
        console.log(`Generating Vanilla JS demo for ${demoId}`);
        
        const files = [];
        const colorPalette = generateColorPaletteFromScheme(options.colorScheme);
        const projectStructure = template.structure;
        
        // Generate index.html
        files.push({
            path: 'index.html',
            content: generateIndexHtml(demoId, options, colorPalette),
            contentType: 'text/html'
        });
        
        // Generate CSS
        files.push({
            path: 'css/styles.css',
            content: generateMainCss(demoId, options, colorPalette),
            contentType: 'text/css'
        });
        
        // Generate main JS
        files.push({
            path: 'js/main.js',
            content: generateMainJs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate component JS files
        template.defaultComponents.forEach(component => {
            files.push({
                path: `js/components/${component}.js`,
                content: generateComponentJs(demoId, component, options),
                contentType: 'text/javascript'
            });
        });
        
        // Generate utility JS
        files.push({
            path: 'js/utils.js',
            content: generateUtilsJs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate API JS if needed
        if (options.includeData) {
            files.push({
                path: 'js/api.js',
                content: generateApiJs(demoId, options),
                contentType: 'text/javascript'
            });
        }
        
        // Generate page files based on template
        if (projectStructure.pages) {
            projectStructure.pages.forEach(page => {
                files.push({
                    path: `${page.path}`,
                    content: generatePageHtml(demoId, page.name, options, colorPalette),
                    contentType: 'text/html'
                });
            });
        }
        
        return files;
    }
    
    /**
     * Generate React demo files
     * @param {string} demoId - Demo ID
     * @param {Object} template - Template information
     * @param {Object} options - Generation options
     * @returns {Array} Generated files
     */
    function generateReactDemo(demoId, template, options) {
        console.log(`Generating React demo for ${demoId}`);
        
        const files = [];
        const colorPalette = generateColorPaletteFromScheme(options.colorScheme);
        
        // Generate package.json
        files.push({
            path: 'package.json',
            content: generateReactPackageJson(demoId, options),
            contentType: 'application/json'
        });
        
        // Generate public/index.html
        files.push({
            path: 'public/index.html',
            content: generateReactIndexHtml(demoId, options),
            contentType: 'text/html'
        });
        
        // Generate src/index.js
        files.push({
            path: 'src/index.js',
            content: generateReactIndexJs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate src/App.js
        files.push({
            path: 'src/App.js',
            content: generateReactAppJs(demoId, options, template),
            contentType: 'text/javascript'
        });
        
        // Generate src/App.css
        files.push({
            path: 'src/App.css',
            content: generateReactAppCss(demoId, options, colorPalette),
            contentType: 'text/css'
        });
        
        // Generate component files
        template.defaultComponents.forEach(component => {
            files.push({
                path: `src/components/${formatComponentName(component)}.js`,
                content: generateReactComponentJs(demoId, component, options),
                contentType: 'text/javascript'
            });
            
            files.push({
                path: `src/components/${formatComponentName(component)}.css`,
                content: generateReactComponentCss(demoId, component, options, colorPalette),
                contentType: 'text/css'
            });
        });
        
        // Generate page components
        if (template.structure.pages) {
            template.structure.pages.forEach(page => {
                files.push({
                    path: `src/pages/${formatComponentName(page.name)}.js`,
                    content: generateReactPageJs(demoId, page.name, options, template),
                    contentType: 'text/javascript'
                });
                
                files.push({
                    path: `src/pages/${formatComponentName(page.name)}.css`,
                    content: generateReactPageCss(demoId, page.name, options, colorPalette),
                    contentType: 'text/css'
                });
            });
        }
        
        // Generate utils
        files.push({
            path: 'src/utils/helpers.js',
            content: generateReactHelpers(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate API services if needed
        if (options.includeData) {
            files.push({
                path: 'src/services/api.js',
                content: generateReactApiService(demoId, options),
                contentType: 'text/javascript'
            });
            
            // Add mock data file
            files.push({
                path: 'src/data/mockData.js',
                content: generateReactMockData(demoId, options),
                contentType: 'text/javascript'
            });
        }
        
        return files;
    }
    
    /**
     * Generate Vue demo files
     * @param {string} demoId - Demo ID
     * @param {Object} template - Template information
     * @param {Object} options - Generation options
     * @returns {Array} Generated files
     */
    function generateVueDemo(demoId, template, options) {
        console.log(`Generating Vue demo for ${demoId}`);
        
        const files = [];
        const colorPalette = generateColorPaletteFromScheme(options.colorScheme);
        
        // Similar implementation as React but adapted for Vue
        // For brevity, I'll include just a few key files
        
        // Generate package.json
        files.push({
            path: 'package.json',
            content: generateVuePackageJson(demoId, options),
            contentType: 'application/json'
        });
        
        // Generate public/index.html
        files.push({
            path: 'public/index.html',
            content: generateVueIndexHtml(demoId, options),
            contentType: 'text/html'
        });
        
        // Generate src/main.js
        files.push({
            path: 'src/main.js',
            content: generateVueMainJs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate src/App.vue
        files.push({
            path: 'src/App.vue',
            content: generateVueAppVue(demoId, options, template),
            contentType: 'text/plain'
        });
        
        // Generate component files
        template.defaultComponents.forEach(component => {
            files.push({
                path: `src/components/${formatComponentName(component)}.vue`,
                content: generateVueComponentVue(demoId, component, options, colorPalette),
                contentType: 'text/plain'
            });
        });
        
        return files;
    }
    
    /**
     * Generate Angular demo files
     * @param {string} demoId - Demo ID
     * @param {Object} template - Template information
     * @param {Object} options - Generation options
     * @returns {Array} Generated files
     */
    function generateAngularDemo(demoId, template, options) {
        console.log(`Generating Angular demo for ${demoId}`);
        
        const files = [];
        const colorPalette = generateColorPaletteFromScheme(options.colorScheme);
        
        // For brevity, I'll include just a few key files
        
        // Generate package.json
        files.push({
            path: 'package.json',
            content: generateAngularPackageJson(demoId, options),
            contentType: 'application/json'
        });
        
        // Generate src/index.html
        files.push({
            path: 'src/index.html',
            content: generateAngularIndexHtml(demoId, options),
            contentType: 'text/html'
        });
        
        // Generate src/main.ts
        files.push({
            path: 'src/main.ts',
            content: generateAngularMainTs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate src/app/app.module.ts
        files.push({
            path: 'src/app/app.module.ts',
            content: generateAngularAppModule(demoId, options, template),
            contentType: 'text/javascript'
        });
        
        // Generate src/app/app.component.ts
        files.push({
            path: 'src/app/app.component.ts',
            content: generateAngularAppComponent(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate src/app/app.component.html
        files.push({
            path: 'src/app/app.component.html',
            content: generateAngularAppTemplate(demoId, options, template),
            contentType: 'text/html'
        });
        
        return files;
    }
    
    /**
     * Generate PHP demo files
     * @param {string} demoId - Demo ID
     * @param {Object} template - Template information
     * @param {Object} options - Generation options
     * @returns {Array} Generated files
     */
    function generatePHPDemo(demoId, template, options) {
        console.log(`Generating PHP demo for ${demoId}`);
        
        const files = [];
        const colorPalette = generateColorPaletteFromScheme(options.colorScheme);
        
        // Generate index.php
        files.push({
            path: 'index.php',
            content: generatePHPIndex(demoId, options, template),
            contentType: 'application/x-php'
        });
        
        // Generate .htaccess
        files.push({
            path: '.htaccess',
            content: generateHtaccess(),
            contentType: 'text/plain'
        });
        
        // Generate CSS
        files.push({
            path: 'assets/css/styles.css',
            content: generateMainCss(demoId, options, colorPalette),
            contentType: 'text/css'
        });
        
        // Generate main JS
        files.push({
            path: 'assets/js/main.js',
            content: generateMainJs(demoId, options),
            contentType: 'text/javascript'
        });
        
        // Generate includes/header.php
        files.push({
            path: 'includes/header.php',
            content: generatePHPHeader(demoId, options, colorPalette),
            contentType: 'application/x-php'
        });
        
        // Generate includes/footer.php
        files.push({
            path: 'includes/footer.php',
            content: generatePHPFooter(demoId, options),
            contentType: 'application/x-php'
        });
        
        // Generate configuration file
        files.push({
            path: 'config/config.php',
            content: generatePHPConfig(demoId, options),
            contentType: 'application/x-php'
        });
        
        // Generate page files
        if (template.structure.pages) {
            template.structure.pages.forEach(page => {
                files.push({
                    path: `pages/${page.path.replace('.html', '.php')}`,
                    content: generatePHPPage(demoId, page.name, options, colorPalette),
                    contentType: 'application/x-php'
                });
            });
        }
        
        // Generate includes for components
        template.defaultComponents.forEach(component => {
            files.push({
                path: `includes/components/${component}.php`,
                content: generatePHPComponent(demoId, component, options),
                contentType: 'application/x-php'
            });
        });
        
        return files;
    }
    
    /**
     * Generate data files for a demo
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {Array} Generated data files
     */
    function generateDataFiles(demoId, options) {
        console.log(`Generating data files for demo ${demoId}`);
        
        const files = [];
        
        // Generate JSON data files based on category and template
        switch (options.category) {
            case 'business':
                files.push({
                    path: 'data/customers.json',
                    content: JSON.stringify(generateCustomersData(options), null, 2),
                    contentType: 'application/json'
                });
                files.push({
                    path: 'data/products.json',
                    content: JSON.stringify(generateProductsData(options), null, 2),
                    contentType: 'application/json'
                });
                files.push({
                    path: 'data/orders.json',
                    content: JSON.stringify(generateOrdersData(options), null, 2),
                    contentType: 'application/json'
                });
                break;
                
            case 'education':
                files.push({
                    path: 'data/courses.json',
                    content: JSON.stringify(generateCoursesData(options), null, 2),
                    contentType: 'application/json'
                });
                files.push({
                    path: 'data/students.json',
                    content: JSON.stringify(generateStudentsData(options), null, 2),
                    contentType: 'application/json'
                });
                break;
                
            case 'health':
                files.push({
                    path: 'data/patients.json',
                    content: JSON.stringify(generatePatientsData(options), null, 2),
                    contentType: 'application/json'
                });
                files.push({
                    path: 'data/appointments.json',
                    content: JSON.stringify(generateAppointmentsData(options), null, 2),
                    contentType: 'application/json'
                });
                break;
                
            default:
                // Generate generic data
                files.push({
                    path: 'data/users.json',
                    content: JSON.stringify(generateUsersData(options), null, 2),
                    contentType: 'application/json'
                });
                files.push({
                    path: 'data/items.json',
                    content: JSON.stringify(generateItemsData(options), null, 2),
                    contentType: 'application/json'
                });
        }
        
        return files;
    }
    
    /**
     * Generate a README file for the demo
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {string} README content
     */
    function generateReadme(demoId, options) {
        return `# ${options.name}

## Overview
${options.description}

## Features
${options.features.map(feature => `- ${feature}`).join('\n')}

## Technology Stack
- **Framework/Library**: ${formatTitle(options.techStack)}
- **Template Type**: ${formatTitle(options.templateType)}
- **Color Scheme**: ${formatTitle(options.colorScheme)}

## Getting Started

### Prerequisites
- Web browser
- ${options.techStack === 'vanilla-js' ? 'No additional requirements' : `${formatTitle(options.techStack)} development environment`}
${options.techStack === 'php' ? '- PHP server (e.g., Apache, Nginx)' : ''}

### Installation
${generateInstallationInstructions(options)}

## Demo Information
- **Demo ID**: ${demoId}
- **Category**: ${formatTitle(options.category)}
- **Complexity**: ${['Simple', 'Moderate', 'Complex'][options.complexity - 1]}
- **Generated**: ${new Date().toISOString()}

## License
This demo application is provided under the MIT License.

---

Generated by NexusGrid Demo Generator
`;
    }
    
    /**
     * Generate installation instructions based on tech stack
     * @param {Object} options - Generation options
     * @returns {string} Installation instructions
     */
    function generateInstallationInstructions(options) {
        switch (options.techStack) {
            case 'vanilla-js':
                return `1. Clone or download this repository
2. Open index.html in your browser`;
                
            case 'react':
                return `1. Clone or download this repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`
   npm start
   \`\`\`
4. Open your browser to http://localhost:3000`;
                
            case 'vue':
                return `1. Clone or download this repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`
   npm run serve
   \`\`\`
4. Open your browser to http://localhost:8080`;
                
            case 'angular':
                return `1. Clone or download this repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`
   ng serve
   \`\`\`
4. Open your browser to http://localhost:4200`;
                
            case 'php':
                return `1. Clone or download this repository
2. Place the files in your web server's document root directory
3. Configure your web server to serve the application
4. Access the application through your web browser`;
                
            default:
                return `1. Clone or download this repository
2. Follow standard ${formatTitle(options.techStack)} setup procedures`;
        }
    }
    
    /**
     * Get a demo by ID
     * @param {string} demoId - Demo ID
     * @returns {Object|null} Demo information
     */
    function getDemo(demoId) {
        if (_generatedDemos.has(demoId)) {
            const demo = _generatedDemos.get(demoId);
            
            // Don't include file contents in the returned info
            const { files, ...demoInfo } = demo;
            return {
                ...demoInfo,
                files: files.map(file => ({
                    path: file.path,
                    size: file.content.length,
                    contentType: file.contentType
                }))
            };
        }
        
        return null;
    }
    
    /**
     * Get a demo file by demo ID and file path
     * @param {string} demoId - Demo ID
     * @param {string} filePath - File path
     * @returns {Object|null} File information
     */
    function getDemoFile(demoId, filePath) {
        if (_generatedDemos.has(demoId)) {
            const demo = _generatedDemos.get(demoId);
            const file = demo.files.find(f => f.path === filePath);
            
            if (file) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Get recently generated demos
     * @param {number} limit - Maximum number of demos to return
     * @returns {Array} Recently generated demos
     */
    function getRecentDemos(limit = 10) {
        const demoEntries = Array.from(_generatedDemos.entries());
        
        // Sort by creation time, newest first
        demoEntries.sort((a, b) => b[1].createdAt - a[1].createdAt);
        
        // Return limited number of demos
        return demoEntries.slice(0, limit).map(([id, demo]) => {
            // Don't include file contents
            const { files, ...demoInfo } = demo;
            return {
                ...demoInfo,
                files: files.map(file => ({
                    path: file.path,
                    size: file.content.length,
                    contentType: file.contentType
                }))
            };
        });
    }
    
    /**
     * Subscribe to demo generator events
     * @param {string} eventType - Event type to subscribe to
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    function subscribeToEvent(eventType, callback) {
        if (!_eventSubscribers.has(eventType)) {
            _eventSubscribers.set(eventType, new Set());
        }
        
        _eventSubscribers.get(eventType).add(callback);
        
        // Return unsubscribe function
        return () => {
            if (_eventSubscribers.has(eventType)) {
                _eventSubscribers.get(eventType).delete(callback);
            }
        };
    }
    
    /**
     * Trigger an event
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    function triggerEvent(eventType, data) {
        console.log(`Event: ${eventType}`, data);
        
        if (_eventSubscribers.has(eventType)) {
            _eventSubscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event subscriber for ${eventType}:`, error);
                }
            });
        }
        
        // Also trigger 'all' events
        if (_eventSubscribers.has('all')) {
            _eventSubscribers.get('all').forEach(callback => {
                try {
                    callback({ type: eventType, data });
                } catch (error) {
                    console.error(`Error in 'all' event subscriber:`, error);
                }
            });
        }
    }
    
    /**
     * Format a string as a title
     * @param {string} str - Input string
     * @returns {string} Formatted title
     */
    function formatTitle(str) {
        return str
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Format a component name
     * @param {string} name - Component name
     * @returns {string} Formatted component name
     */
    function formatComponentName(name) {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    
    /**
     * Get a random item from an array
     * @param {Array} array - Array of items
     * @returns {*} Random item
     */
    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Generate a unique demo name
     * @returns {string} Generated name
     */
    function generateDemoName() {
        const adjective = getRandomAdjective();
        const noun = getRandomNoun();
        const product = getRandomItem(_seedData.productNames);
        
        return `${adjective} ${noun} ${product}`;
    }
    
    /**
     * Generate a demo description
     * @returns {string} Generated description
     */
    function generateDemoDescription() {
        const slogan = getRandomItem(_seedData.slogans);
        const industry = getRandomItem(_seedData.industries);
        const businessName = getRandomItem(_seedData.businessNames);
        
        return `A demo application for ${businessName}, showcasing solutions for the ${industry} industry. ${slogan}`;
    }
    
    /**
     * Generate a list of features
     * @returns {Array} Generated features
     */
    function generateFeaturesList() {
        const allFeatures = [..._seedData.features];
        const numFeatures = Math.floor(Math.random() * 5) + 3; // 3-7 features
        
        const features = [];
        
        for (let i = 0; i < numFeatures; i++) {
            if (allFeatures.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * allFeatures.length);
            features.push(allFeatures.splice(randomIndex, 1)[0]);
        }
        
        return features;
    }
    
    /**
     * Generate a color palette from a color scheme
     * @param {string} colorScheme - Color scheme name
     * @returns {Object} Color palette
     */
    function generateColorPaletteFromScheme(colorScheme) {
        // Predefined color palettes based on schemes
        const palettes = {
            'blue-gradient': {
                primary: '#2563eb',
                secondary: '#60a5fa',
                accent: '#3b82f6',
                text: '#1e3a8a',
                background: '#f0f9ff',
                surface: '#ffffff',
                border: '#bfdbfe'
            },
            'green-earth': {
                primary: '#10b981',
                secondary: '#6ee7b7',
                accent: '#34d399',
                text: '#064e3b',
                background: '#ecfdf5',
                surface: '#ffffff',
                border: '#a7f3d0'
            },
            'purple-haze': {
                primary: '#8b5cf6',
                secondary: '#c4b5fd',
                accent: '#a78bfa',
                text: '#5b21b6',
                background: '#f5f3ff',
                surface: '#ffffff',
                border: '#ddd6fe'
            },
            'sunset-orange': {
                primary: '#f97316',
                secondary: '#fdba74',
                accent: '#fb923c',
                text: '#9a3412',
                background: '#fff7ed',
                surface: '#ffffff',
                border: '#fed7aa'
            },
            'midnight-black': {
                primary: '#1f2937',
                secondary: '#4b5563',
                accent: '#374151',
                text: '#111827',
                background: '#f9fafb',
                surface: '#ffffff',
                border: '#e5e7eb'
            },
            'arctic-white': {
                primary: '#e5e7eb',
                secondary: '#f3f4f6',
                accent: '#d1d5db',
                text: '#1f2937',
                background: '#ffffff',
                surface: '#f9fafb',
                border: '#e5e7eb'
            },
            'teal-ocean': {
                primary: '#14b8a6',
                secondary: '#5eead4',
                accent: '#2dd4bf',
                text: '#134e4a',
                background: '#f0fdfa',
                surface: '#ffffff',
                border: '#99f6e4'
            },
            'vibrant-rainbow': {
                primary: '#8b5cf6',
                secondary: '#ec4899',
                accent: '#06b6d4',
                text: '#1f2937',
                background: '#f9fafb',
                surface: '#ffffff',
                border: '#e5e7eb'
            }
        };
        
        return palettes[colorScheme] || palettes['blue-gradient'];
    }
    
    /**
     * Generate a random adjective
     * @returns {string} Random adjective
     */
    function getRandomAdjective() {
        const adjectives = [
            'Advanced', 'Dynamic', 'Innovative', 'Smart', 'Modern',
            'Interactive', 'Responsive', 'Intelligent', 'Strategic', 'Efficient',
            'Powerful', 'Streamlined', 'Intuitive', 'Creative', 'Professional'
        ];
        
        return getRandomItem(adjectives);
    }
    
    /**
     * Generate a random noun
     * @returns {string} Random noun
     */
    function getRandomNoun() {
        const nouns = [
            'Business', 'Enterprise', 'Solutions', 'System', 'Platform',
            'Dashboard', 'Portal', 'Framework', 'Suite', 'Application',
            'Toolkit', 'Network', 'Manager', 'Interface', 'Studio'
        ];
        
        return getRandomItem(nouns);
    }
    
    /**
     * Generate placeholder image URLs
     * @param {string} category - Image category
     * @param {number} count - Number of images
     * @returns {Array} Image URLs
     */
    function generatePlaceholderImageUrls(category, count) {
        const urls = [];
        
        for (let i = 1; i <= count; i++) {
            urls.push(`https://placehold.co/600x400?text=${category}+${i}`);
        }
        
        return urls;
    }
    
    /**
     * Generate color palettes
     * @param {number} count - Number of palettes
     * @returns {Array} Color palettes
     */
    function generateColorPalettes(count) {
        const palettes = [];
        
        for (let i = 0; i < count; i++) {
            palettes.push({
                light: generateRandomColor(true),
                main: generateRandomColor(),
                dark: generateRandomColor(false, true)
            });
        }
        
        return palettes;
    }
    
    /**
     * Generate grayscale palettes
     * @param {number} count - Number of palettes
     * @returns {Array} Grayscale palettes
     */
    function generateGrayscalePalettes(count) {
        const palettes = [];
        
        for (let i = 0; i < count; i++) {
            palettes.push({
                light: generateRandomGrayscaleColor(true),
                main: generateRandomGrayscaleColor(),
                dark: generateRandomGrayscaleColor(false, true)
            });
        }
        
        return palettes;
    }
    
    /**
     * Generate a random color
     * @param {boolean} lighter - Whether to generate a lighter color
     * @param {boolean} darker - Whether to generate a darker color
     * @returns {string} Random color
     */
    function generateRandomColor(lighter = false, darker = false) {
        let r, g, b;
        
        if (lighter) {
            r = Math.floor(Math.random() * 55) + 200; // 200-255
            g = Math.floor(Math.random() * 55) + 200; // 200-255
            b = Math.floor(Math.random() * 55) + 200; // 200-255
        } else if (darker) {
            r = Math.floor(Math.random() * 100); // 0-100
            g = Math.floor(Math.random() * 100); // 0-100
            b = Math.floor(Math.random() * 100); // 0-100
        } else {
            r = Math.floor(Math.random() * 200) + 55; // 55-255
            g = Math.floor(Math.random() * 200) + 55; // 55-255
            b = Math.floor(Math.random() * 200) + 55; // 55-255
        }
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Generate a random grayscale color
     * @param {boolean} lighter - Whether to generate a lighter color
     * @param {boolean} darker - Whether to generate a darker color
     * @returns {string} Random grayscale color
     */
    function generateRandomGrayscaleColor(lighter = false, darker = false) {
        let value;
        
        if (lighter) {
            value = Math.floor(Math.random() * 55) + 200; // 200-255
        } else if (darker) {
            value = Math.floor(Math.random() * 100); // 0-100
        } else {
            value = Math.floor(Math.random() * 200) + 55; // 55-255
        }
        
        return `#${value.toString(16).padStart(2, '0').repeat(3)}`;
    }
    
    /**
     * Generate a screenshot URL for a demo
     * @param {string} demoId - Demo ID
     * @returns {string} Screenshot URL
     */
    function generateScreenshotUrl(demoId) {
        return `https://placehold.co/1200x800?text=Demo+${demoId}`;
    }
    
    /**
     * Map a category to a NexusGrid marketplace category
     * @param {string} category - Demo category
     * @returns {string} NexusGrid category
     */
    function mapCategoryToNexusGrid(category) {
        const categoryMap = {
            'web-app': 'web-applications',
            'business': 'business',
            'education': 'education',
            'entertainment': 'entertainment',
            'productivity': 'productivity',
            'utilities': 'utilities',
            'games': 'games',
            'social': 'social',
            'health': 'health-wellness',
            'finance': 'finance',
            'multimedia': 'media',
            'development': 'development-tools'
        };
        
        return categoryMap[category] || 'general';
    }
    
    /**
     * Generate template structure for a given template type
     * @param {string} templateType - Template type
     * @returns {Object} Template structure
     */
    function generateTemplateStructure(templateType) {
        // Default structure that most templates will use
        const defaultStructure = {
            pages: [
                { name: 'home', path: 'index.html' },
                { name: 'about', path: 'about.html' },
                { name: 'contact', path: 'contact.html' }
            ],
            components: [
                'header', 'footer', 'navigation', 'hero', 'features'
            ]
        };
        
        // Customize structure based on template type
        switch (templateType) {
            case 'landing-page':
                return {
                    pages: [
                        { name: 'home', path: 'index.html' }
                    ],
                    components: [
                        'header', 'hero', 'features', 'testimonials', 'pricing', 'contact', 'footer'
                    ]
                };
                
            case 'portfolio':
                return {
                    pages: [
                        { name: 'home', path: 'index.html' },
                        { name: 'projects', path: 'projects.html' },
                        { name: 'about', path: 'about.html' },
                        { name: 'contact', path: 'contact.html' }
                    ],
                    components: [
                        'header', 'navigation', 'hero', 'projects-grid', 'project-card', 'footer'
                    ]
                };
                
            case 'blog':
                return {
                    pages: [
                        { name: 'home', path: 'index.html' },
                        { name: 'posts', path: 'posts.html' },
                        { name: 'post', path: 'post.html' },
                        { name: 'about', path: 'about.html' },
                        { name: 'contact', path: 'contact.html' }
                    ],
                    components: [
                        'header', 'navigation', 'post-card', 'post-content', 'sidebar', 'footer'
                    ]
                };
                
            case 'e-commerce':
                return {
                    pages: [
                        { name: 'home', path: 'index.html' },
                        { name: 'products', path: 'products.html' },
                        { name: 'product', path: 'product.html' },
                        { name: 'cart', path: 'cart.html' },
                        { name: 'checkout', path: 'checkout.html' }
                    ],
                    components: [
                        'header', 'navigation', 'product-card', 'product-detail', 'cart', 'footer'
                    ]
                };
                
            case 'dashboard':
                return {
                    pages: [
                        { name: 'dashboard', path: 'index.html' },
                        { name: 'analytics', path: 'analytics.html' },
                        { name: 'settings', path: 'settings.html' },
                        { name: 'profile', path: 'profile.html' }
                    ],
                    components: [
                        'sidebar', 'navbar', 'stats-card', 'chart', 'data-table', 'form'
                    ]
                };
                
            default:
                return defaultStructure;
        }
    }
    
    /**
     * Get default components for a template type
     * @param {string} templateType - Template type
     * @returns {Array} Default components
     */
    function getDefaultComponentsForTemplate(templateType) {
        const structure = generateTemplateStructure(templateType);
        return structure.components;
    }
    
    /**
     * Load header components
     * @returns {Array} Header components
     */
    function loadHeaderComponents() {
        return [
            {
                name: 'simple-header',
                html: `<header class="header">
  <div class="container">
    <div class="logo">
      <a href="index.html">{{company-name}}</a>
    </div>
    <nav class="nav">
      <ul>
        {{#each nav-items}}
        <li><a href="{{link}}">{{label}}</a></li>
        {{/each}}
      </ul>
    </nav>
  </div>
</header>`
            },
            {
                name: 'complex-header',
                html: `<header class="header">
  <div class="header-top">
    <div class="container">
      <div class="contact-info">
        <a href="tel:{{phone}}">{{phone}}</a>
        <a href="mailto:{{email}}">{{email}}</a>
      </div>
      <div class="social-links">
        {{#each social-links}}
        <a href="{{link}}"><i class="{{icon}}"></i></a>
        {{/each}}
      </div>
    </div>
  </div>
  <div class="header-main">
    <div class="container">
      <div class="logo">
        <a href="index.html">{{company-name}}</a>
      </div>
      <nav class="nav">
        <ul>
          {{#each nav-items}}
          <li><a href="{{link}}">{{label}}</a></li>
          {{/each}}
        </ul>
      </nav>
      <div class="header-actions">
        <a href="{{cta-link}}" class="btn">{{cta-text}}</a>
      </div>
    </div>
  </div>
</header>`
            }
        ];
    }
    
    /**
     * Load footer components
     * @returns {Array} Footer components
     */
    function loadFooterComponents() {
        return [
            {
                name: 'simple-footer',
                html: `<footer class="footer">
  <div class="container">
    <div class="copyright">
      &copy; {{year}} {{company-name}}. All rights reserved.
    </div>
  </div>
</footer>`
            },
            {
                name: 'complex-footer',
                html: `<footer class="footer">
  <div class="footer-main">
    <div class="container">
      <div class="footer-widgets">
        <div class="widget">
          <h3>About Us</h3>
          <p>{{about-text}}</p>
        </div>
        <div class="widget">
          <h3>Quick Links</h3>
          <ul>
            {{#each footer-links}}
            <li><a href="{{link}}">{{label}}</a></li>
            {{/each}}
          </ul>
        </div>
        <div class="widget">
          <h3>Contact Us</h3>
          <address>
            {{address}}<br>
            <a href="tel:{{phone}}">{{phone}}</a><br>
            <a href="mailto:{{email}}">{{email}}</a>
          </address>
        </div>
        <div class="widget">
          <h3>Newsletter</h3>
          <form class="newsletter-form">
            <input type="email" placeholder="Your email address">
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container">
      <div class="copyright">
        &copy; {{year}} {{company-name}}. All rights reserved.
      </div>
      <div class="social-links">
        {{#each social-links}}
        <a href="{{link}}"><i class="{{icon}}"></i></a>
        {{/each}}
      </div>
    </div>
  </div>
</footer>`
            }
        ];
    }
    
    /**
     * Load navigation components
     * @returns {Array} Navigation components
     */
    function loadNavigationComponents() {
        return [
            {
                name: 'horizontal-navbar',
                html: `<nav class="navbar">
  <ul>
    {{#each nav-items}}
    <li><a href="{{link}}" {{#if active}}class="active"{{/if}}>{{label}}</a></li>
    {{/each}}
  </ul>
</nav>`
            },
            {
                name: 'vertical-sidebar',
                html: `<aside class="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <a href="index.html">{{company-name}}</a>
    </div>
    <button class="sidebar-toggle">
      <span></span>
    </button>
  </div>
  <nav class="sidebar-nav">
    <ul>
      {{#each nav-items}}
      <li>
        <a href="{{link}}" {{#if active}}class="active"{{/if}}>
          <i class="{{icon}}"></i>
          <span>{{label}}</span>
        </a>
      </li>
      {{/each}}
    </ul>
  </nav>
</aside>`
            }
        ];
    }
    
    /**
     * Load hero components
     * @returns {Array} Hero components
     */
    function loadHeroComponents() {
        return [
            {
                name: 'simple-hero',
                html: `<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1>{{hero-title}}</h1>
      <p>{{hero-subtitle}}</p>
      <a href="{{cta-link}}" class="btn btn-primary">{{cta-text}}</a>
    </div>
  </div>
</section>`
            },
            {
                name: 'hero-with-image',
                html: `<section class="hero hero-with-image">
  <div class="container">
    <div class="hero-content">
      <h1>{{hero-title}}</h1>
      <p>{{hero-subtitle}}</p>
      <div class="hero-actions">
        <a href="{{primary-cta-link}}" class="btn btn-primary">{{primary-cta-text}}</a>
        <a href="{{secondary-cta-link}}" class="btn btn-secondary">{{secondary-cta-text}}</a>
      </div>
    </div>
    <div class="hero-image">
      <img src="{{hero-image}}" alt="{{hero-image-alt}}">
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load feature components
     * @returns {Array} Feature components
     */
    function loadFeatureComponents() {
        return [
            {
                name: 'features-grid',
                html: `<section class="features">
  <div class="container">
    <div class="section-header">
      <h2>{{section-title}}</h2>
      <p>{{section-subtitle}}</p>
    </div>
    <div class="features-grid">
      {{#each features}}
      <div class="feature">
        <div class="feature-icon">
          <i class="{{icon}}"></i>
        </div>
        <h3>{{title}}</h3>
        <p>{{description}}</p>
      </div>
      {{/each}}
    </div>
  </div>
</section>`
            },
            {
                name: 'features-with-image',
                html: `<section class="features-with-image">
  <div class="container">
    <div class="features-content">
      <div class="section-header">
        <h2>{{section-title}}</h2>
        <p>{{section-subtitle}}</p>
      </div>
      <div class="features-list">
        {{#each features}}
        <div class="feature">
          <div class="feature-icon">
            <i class="{{icon}}"></i>
          </div>
          <div class="feature-content">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
          </div>
        </div>
        {{/each}}
      </div>
    </div>
    <div class="features-image">
      <img src="{{features-image}}" alt="{{features-image-alt}}">
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load pricing components
     * @returns {Array} Pricing components
     */
    function loadPricingComponents() {
        return [
            {
                name: 'pricing-plans',
                html: `<section class="pricing">
  <div class="container">
    <div class="section-header">
      <h2>{{section-title}}</h2>
      <p>{{section-subtitle}}</p>
    </div>
    <div class="pricing-plans">
      {{#each plans}}
      <div class="pricing-plan {{#if featured}}featured{{/if}}">
        <div class="plan-header">
          <h3>{{name}}</h3>
          <div class="plan-price">
            <span class="currency">{{currency}}</span>
            <span class="amount">{{amount}}</span>
            <span class="period">{{period}}</span>
          </div>
        </div>
        <div class="plan-features">
          <ul>
            {{#each features}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        <div class="plan-action">
          <a href="{{cta-link}}" class="btn {{#if featured}}btn-primary{{else}}btn-secondary{{/if}}">{{cta-text}}</a>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load testimonial components
     * @returns {Array} Testimonial components
     */
    function loadTestimonialComponents() {
        return [
            {
                name: 'testimonials-slider',
                html: `<section class="testimonials">
  <div class="container">
    <div class="section-header">
      <h2>{{section-title}}</h2>
      <p>{{section-subtitle}}</p>
    </div>
    <div class="testimonials-slider">
      {{#each testimonials}}
      <div class="testimonial">
        <div class="testimonial-content">
          <p>{{content}}</p>
        </div>
        <div class="testimonial-author">
          <div class="author-image">
            <img src="{{author-image}}" alt="{{author-name}}">
          </div>
          <div class="author-info">
            <h4>{{author-name}}</h4>
            <p>{{author-title}}</p>
          </div>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load contact components
     * @returns {Array} Contact components
     */
    function loadContactComponents() {
        return [
            {
                name: 'contact-form',
                html: `<section class="contact">
  <div class="container">
    <div class="section-header">
      <h2>{{section-title}}</h2>
      <p>{{section-subtitle}}</p>
    </div>
    <div class="contact-content">
      <div class="contact-info">
        <div class="contact-item">
          <div class="contact-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="contact-text">
            <h3>Address</h3>
            <p>{{address}}</p>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">
            <i class="fas fa-phone"></i>
          </div>
          <div class="contact-text">
            <h3>Phone</h3>
            <p>{{phone}}</p>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="contact-text">
            <h3>Email</h3>
            <p>{{email}}</p>
          </div>
        </div>
      </div>
      <div class="contact-form">
        <form>
          <div class="form-group">
            <input type="text" placeholder="Your Name" required>
          </div>
          <div class="form-group">
            <input type="email" placeholder="Your Email" required>
          </div>
          <div class="form-group">
            <input type="text" placeholder="Subject">
          </div>
          <div class="form-group">
            <textarea placeholder="Your Message" rows="5" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">{{submit-text}}</button>
        </form>
      </div>
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load authentication components
     * @returns {Array} Authentication components
     */
    function loadAuthComponents() {
        return [
            {
                name: 'login-form',
                html: `<section class="auth">
  <div class="container">
    <div class="auth-form">
      <h2>{{form-title}}</h2>
      <form>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Your email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Your password" required>
        </div>
        <div class="form-group">
          <div class="form-check">
            <input type="checkbox" id="remember">
            <label for="remember">Remember me</label>
          </div>
          <a href="{{forgot-password-link}}" class="forgot-password">Forgot password?</a>
        </div>
        <button type="submit" class="btn btn-primary btn-block">{{submit-text}}</button>
      </form>
      <div class="auth-footer">
        <p>{{footer-text}} <a href="{{register-link}}">{{register-text}}</a></p>
      </div>
    </div>
  </div>
</section>`
            },
            {
                name: 'register-form',
                html: `<section class="auth">
  <div class="container">
    <div class="auth-form">
      <h2>{{form-title}}</h2>
      <form>
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" placeholder="Your full name" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Your email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Your password" required>
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input type="password" id="confirm-password" placeholder="Confirm your password" required>
        </div>
        <div class="form-group">
          <div class="form-check">
            <input type="checkbox" id="terms" required>
            <label for="terms">I agree to the <a href="{{terms-link}}">Terms of Service</a> and <a href="{{privacy-link}}">Privacy Policy</a></label>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">{{submit-text}}</button>
      </form>
      <div class="auth-footer">
        <p>{{footer-text}} <a href="{{login-link}}">{{login-text}}</a></p>
      </div>
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Load dashboard components
     * @returns {Array} Dashboard components
     */
    function loadDashboardComponents() {
        return [
            {
                name: 'stats-cards',
                html: `<section class="stats-cards">
  <div class="container">
    <div class="stats-grid">
      {{#each stats}}
      <div class="stat-card">
        <div class="stat-icon">
          <i class="{{icon}}"></i>
        </div>
        <div class="stat-content">
          <h3>{{value}}</h3>
          <p>{{label}}</p>
        </div>
        {{#if change}}
        <div class="stat-change {{change-class}}">
          <i class="{{change-icon}}"></i>
          <span>{{change}}</span>
        </div>
        {{/if}}
      </div>
      {{/each}}
    </div>
  </div>
</section>`
            },
            {
                name: 'data-table',
                html: `<section class="data-table-section">
  <div class="container">
    <div class="table-header">
      <h3>{{table-title}}</h3>
      <div class="table-actions">
        <div class="search-box">
          <input type="text" placeholder="Search...">
          <button class="search-btn"><i class="fas fa-search"></i></button>
        </div>
        <div class="table-filters">
          <select>
            <option value="">All</option>
            {{#each filter-options}}
            <option value="{{value}}">{{label}}</option>
            {{/each}}
          </select>
        </div>
      </div>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            {{#each columns}}
            <th>{{this}}</th>
            {{/each}}
          </tr>
        </thead>
        <tbody>
          {{#each rows}}
          <tr>
            {{#each this}}
            <td>{{this}}</td>
            {{/each}}
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
    <div class="table-pagination">
      <span>Showing {{start}} to {{end}} of {{total}} entries</span>
      <div class="pagination">
        <button class="pagination-btn prev" {{#unless has-prev}}disabled{{/unless}}><i class="fas fa-chevron-left"></i></button>
        {{#each pages}}
        <button class="pagination-btn {{#if active}}active{{/if}}">{{page}}</button>
        {{/each}}
        <button class="pagination-btn next" {{#unless has-next}}disabled{{/unless}}><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
  </div>
</section>`
            }
        ];
    }
    
    /**
     * Generate an index.html file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @param {Object} colorPalette - Color palette
     * @returns {string} HTML content
     */
    function generateIndexHtml(demoId, options, colorPalette) {
        // This would typically be a more complex template generation
        // For simplicity, this is a basic implementation
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.name}</title>
    <meta name="description" content="${options.description}">
    <link rel="stylesheet" href="css/styles.css">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <a href="index.html">${options.name}</a>
            </div>
            <nav class="nav">
                <ul>
                    <li><a href="index.html" class="active">Home</a></li>
                    <li><a href="about.html">About</a></li>
                    <li><a href="contact.html">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>${options.name}</h1>
                <p>${options.description}</p>
                <a href="#features" class="btn btn-primary">Learn More</a>
            </div>
        </div>
    </section>

    <section id="features" class="features">
        <div class="container">
            <div class="section-header">
                <h2>Features</h2>
                <p>Discover what makes us different</p>
            </div>
            <div class="features-grid">
                ${options.features.map((feature, index) => `
                <div class="feature">
                    <div class="feature-icon">
                        <i class="fas fa-${['star', 'chart-line', 'cog', 'shield-alt', 'rocket', 'brain', 'lightbulb'][index % 7]}"></i>
                    </div>
                    <h3>${feature}</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="copyright">
                &copy; ${new Date().getFullYear()} ${options.name}. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>`;
    }
    
    /**
     * Generate a main CSS file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @param {Object} colorPalette - Color palette
     * @returns {string} CSS content
     */
    function generateMainCss(demoId, options, colorPalette) {
        return `/* 
 * Main styles for ${options.name}
 * Generated by NexusGrid Demo Generator
 */

/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: ${colorPalette.background};
}

a {
    color: ${colorPalette.primary};
    text-decoration: none;
    transition: color 0.3s ease;
}

a:hover {
    color: ${colorPalette.accent};
}

.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 15px;
}

/* Button styles */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: ${colorPalette.primary};
    color: #fff;
}

.btn-primary:hover {
    background-color: ${colorPalette.accent};
}

.btn-secondary {
    background-color: ${colorPalette.secondary};
    color: #fff;
}

.btn-secondary:hover {
    opacity: 0.9;
}

/* Header styles */
.header {
    background-color: ${colorPalette.surface};
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 20px 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo a {
    font-size: 24px;
    font-weight: 700;
    color: ${colorPalette.text};
}

.nav ul {
    display: flex;
    list-style: none;
}

.nav li {
    margin-left: 30px;
}

.nav a {
    font-weight: 500;
}

.nav a.active {
    color: ${colorPalette.primary};
}

/* Hero section */
.hero {
    padding: 100px 0;
    background-color: ${colorPalette.surface};
    text-align: center;
}

.hero-content {
    max-width: 700px;
    margin: 0 auto;
}

.hero h1 {
    font-size: 48px;
    margin-bottom: 20px;
    color: ${colorPalette.text};
}

.hero p {
    font-size: 20px;
    margin-bottom: 30px;
    color: ${colorPalette.text};
    opacity: 0.8;
}

/* Features section */
.features {
    padding: 80px 0;
    background-color: ${colorPalette.background};
}

.section-header {
    text-align: center;
    margin-bottom: 50px;
}

.section-header h2 {
    font-size: 36px;
    margin-bottom: 15px;
    color: ${colorPalette.text};
}

.section-header p {
    font-size: 18px;
    color: ${colorPalette.text};
    opacity: 0.8;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.feature {
    background-color: ${colorPalette.surface};
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
    text-align: center;
    transition: transform 0.3s ease;
}

.feature:hover {
    transform: translateY(-5px);
}

.feature-icon {
    margin-bottom: 20px;
}

.feature-icon i {
    font-size: 48px;
    color: ${colorPalette.primary};
}

.feature h3 {
    font-size: 24px;
    margin-bottom: 15px;
    color: ${colorPalette.text};
}

.feature p {
    color: ${colorPalette.text};
    opacity: 0.8;
}

/* Footer styles */
.footer {
    background-color: ${colorPalette.surface};
    padding: 30px 0;
    text-align: center;
    margin-top: 80px;
    border-top: 1px solid ${colorPalette.border};
}

.copyright {
    color: ${colorPalette.text};
    opacity: 0.7;
}

/* Responsive styles */
@media screen and (max-width: 768px) {
    .hero h1 {
        font-size: 36px;
    }
    
    .hero p {
        font-size: 18px;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
}`;
    }
    
    /**
     * Generate a main JavaScript file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {string} JavaScript content
     */
    function generateMainJs(demoId, options) {
        return `/**
 * Main JavaScript for ${options.name}
 * Generated by NexusGrid Demo Generator
 */

(function() {
    'use strict';
    
    // Initialize when document is fully loaded
    document.addEventListener('DOMContentLoaded', init);
    
    /**
     * Initialize the application
     */
    function init() {
        console.log('${options.name} - Application initialized');
        
        // Set up navigation highlighting
        setupNavigation();
        
        // Set up any interactive elements
        setupInteractiveElements();
        
        // Load data if needed
        if (shouldLoadData()) {
            loadData();
        }
    }
    
    /**
     * Set up navigation highlighting
     */
    function setupNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav a');
        
        navLinks.forEach(link => {
            // Remove active class from all links
            link.classList.remove('active');
            
            // If link href matches current path, add active class
            if (link.getAttribute('href') === currentPath || 
                (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Set up interactive elements
     */
    function setupInteractiveElements() {
        // Example: Smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    /**
     * Check if data should be loaded
     * @returns {boolean} Whether data should be loaded
     */
    function shouldLoadData() {
        // Example implementation - check if we're on a page that needs data
        return document.querySelector('[data-load-data]') !== null;
    }
    
    /**
     * Load data from server or local storage
     */
    function loadData() {
        console.log('Loading data...');
        
        // Example implementation - fetch data from a JSON file
        fetch('data/items.json')
            .then(response => response.json())
            .then(data => {
                console.log('Data loaded successfully:', data);
                processData(data);
            })
            .catch(error => {
                console.error('Error loading data:', error);
            });
    }
    
    /**
     * Process loaded data
     * @param {Object} data - The loaded data
     */
    function processData(data) {
        // Example implementation - update UI with data
        const dataContainer = document.querySelector('[data-content]');
        
        if (dataContainer && data.items) {
            let html = '';
            
            data.items.forEach(item => {
                html += \`
                    <div class="item">
                        <h3>\${item.name}</h3>
                        <p>\${item.description}</p>
                    </div>
                \`;
            });
            
            dataContainer.innerHTML = html;
        }
    }
})();`;
    }
    
    /**
     * Generate a react package.json file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {string} Package JSON content
     */
    function generateReactPackageJson(demoId, options) {
        return JSON.stringify({
            name: demoId,
            version: '1.0.0',
            private: true,
            dependencies: {
                '@testing-library/jest-dom': '^5.16.5',
                '@testing-library/react': '^13.4.0',
                '@testing-library/user-event': '^13.5.0',
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'react-router-dom': '^6.4.3',
                'react-scripts': '5.0.1',
                'web-vitals': '^2.1.4'
            },
            scripts: {
                'start': 'react-scripts start',
                'build': 'react-scripts build',
                'test': 'react-scripts test',
                'eject': 'react-scripts eject'
            },
            eslintConfig: {
                extends: [
                    'react-app',
                    'react-app/jest'
                ]
            },
            browserslist: {
                production: [
                    '>0.2%',
                    'not dead',
                    'not op_mini all'
                ],
                development: [
                    'last 1 chrome version',
                    'last 1 firefox version',
                    'last 1 safari version'
                ]
            }
        }, null, 2);
    }
    
    /**
     * Generate a react index.html file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {string} HTML content
     */
    function generateReactIndexHtml(demoId, options) {
        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${options.description}" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>${options.name}</title>
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
    }
    
    /**
     * Generate a react index.js file
     * @param {string} demoId - Demo ID
     * @param {Object} options - Generation options
     * @returns {string} JavaScript content
     */
    function generateReactIndexJs(demoId, options) {
        return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();`;
    }
    
    
    
    /**
 * NexusGrid Infinite Demo Generator System - Part 2
 * 
 * Continuation of the demo generation implementation
 */

// Continuation of the generateReactAppJs function
function generateReactAppJs(demoId, options, template) {
    // Import statements for all components
    const componentImports = template.defaultComponents.map(component => {
        const componentName = formatComponentName(component);
        return `import ${componentName} from './components/${componentName}';`;
    }).join('\n');
    
    // Import statements for all pages
    const pageImports = template.structure.pages ? template.structure.pages.map(page => {
        const pageName = formatComponentName(page.name);
        return `import ${pageName} from './pages/${pageName}';`;
    }).join('\n') : '';
    
    // Generate routes
    const routes = template.structure.pages ? template.structure.pages.map(page => {
        const pageName = formatComponentName(page.name);
        const path = page.name === 'home' ? '/' : `/${page.name}`;
        return `<Route path="${path}" element={<${pageName} />} />`;
    }).join('\n        ') : '';
    
    return `import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
${componentImports}
${pageImports}

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
        ${routes}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;`;
}

/**
 * Generate a React App.css file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} CSS content
 */
function generateReactAppCss(demoId, options, colorPalette) {
    return `/* 
 * Main styles for ${options.name}
 * Generated by NexusGrid Demo Generator
 */

:root {
  --primary-color: ${colorPalette.primary};
  --secondary-color: ${colorPalette.secondary};
  --accent-color: ${colorPalette.accent};
  --text-color: ${colorPalette.text};
  --background-color: ${colorPalette.background};
  --surface-color: ${colorPalette.surface};
  --border-color: ${colorPalette.border};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.App {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--accent-color);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: #fff;
}

.btn-primary:hover {
  background-color: var(--accent-color);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: #fff;
}

.btn-secondary:hover {
  opacity: 0.9;
}

.section {
  padding: 80px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-header h2 {
  font-size: 36px;
  margin-bottom: 15px;
}

.section-header p {
  font-size: 18px;
  opacity: 0.8;
}

/* Responsive styles */
@media screen and (max-width: 768px) {
  .section {
    padding: 50px 0;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .section-header p {
    font-size: 16px;
  }
}`;
}

/**
 * Generate a React component JS file
 * @param {string} demoId - Demo ID
 * @param {string} component - Component name
 * @param {Object} options - Generation options
 * @returns {string} JavaScript content
 */
function generateReactComponentJs(demoId, component, options) {
    // Component name in PascalCase
    const componentName = formatComponentName(component);
    
    // Generate component content based on type
    let componentContent = '';
    
    switch (component) {
        case 'header':
            componentContent = generateReactHeaderComponent(options);
            break;
        case 'footer':
            componentContent = generateReactFooterComponent(options);
            break;
        case 'navigation':
            componentContent = generateReactNavigationComponent(options);
            break;
        case 'hero':
            componentContent = generateReactHeroComponent(options);
            break;
        case 'features':
            componentContent = generateReactFeaturesComponent(options);
            break;
        default:
            // Generic component
            componentContent = `return (
    <div className="${component}">
      <div className="container">
        <h2>${formatTitle(component)}</h2>
        <p>This is the ${formatTitle(component)} component.</p>
      </div>
    </div>
  );`;
    }
    
    // Generate full component
    return `import React from 'react';
import { Link } from 'react-router-dom';
import './${componentName}.css';

function ${componentName}(props) {
  ${componentContent}
}

export default ${componentName};`;
}

/**
 * Generate a React header component
 * @param {Object} options - Generation options
 * @returns {string} Component content
 */
function generateReactHeaderComponent(options) {
    return `
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">${options.name}</Link>
        </div>
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );`;
}

/**
 * Generate a React footer component
 * @param {Object} options - Generation options
 * @returns {string} Component content
 */
function generateReactFooterComponent(options) {
    return `
  return (
    <footer className="footer">
      <div className="container">
        <div className="copyright">
          &copy; ${new Date().getFullYear()} ${options.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );`;
}

/**
 * Generate a React navigation component
 * @param {Object} options - Generation options
 * @returns {string} Component content
 */
function generateReactNavigationComponent(options) {
    return `
  return (
    <nav className="navigation">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );`;
}

/**
 * Generate a React hero component
 * @param {Object} options - Generation options
 * @returns {string} Component content
 */
function generateReactHeroComponent(options) {
    return `
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>${options.name}</h1>
          <p>${options.description}</p>
          <Link to="/features" className="btn btn-primary">Learn More</Link>
        </div>
      </div>
    </section>
  );`;
}

/**
 * Generate a React features component
 * @param {Object} options - Generation options
 * @returns {string} Component content
 */
function generateReactFeaturesComponent(options) {
    return `
  const features = [
    ${options.features.map((feature, i) => `{
      id: ${i + 1},
      title: "${feature}",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      icon: "${['star', 'chart-line', 'cog', 'shield-alt', 'rocket', 'brain', 'lightbulb'][i % 7]}"
    }`).join(',\n    ')}
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="section-header">
          <h2>Features</h2>
          <p>Discover what makes us different</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature" key={feature.id}>
              <div className="feature-icon">
                <i className={\`fas fa-\${feature.icon}\`}></i>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );`;
}

/**
 * Generate a React component CSS file
 * @param {string} demoId - Demo ID
 * @param {string} component - Component name
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} CSS content
 */
function generateReactComponentCss(demoId, component, options, colorPalette) {
    // Generate CSS based on component type
    switch (component) {
        case 'header':
            return `/* Header styles */
.header {
  background-color: var(--surface-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo a {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
}

.nav ul {
  display: flex;
  list-style: none;
}

.nav li {
  margin-left: 30px;
}

.nav a {
  font-weight: 500;
}

.nav a.active {
  color: var(--primary-color);
}

@media screen and (max-width: 768px) {
  .nav ul {
    flex-direction: column;
    position: absolute;
    top: 100%;
    right: 0;
    background-color: var(--surface-color);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    padding: 20px;
    display: none;
  }
  
  .nav li {
    margin: 10px 0;
  }
}`;
            
        case 'footer':
            return `/* Footer styles */
.footer {
  background-color: var(--surface-color);
  padding: 30px 0;
  text-align: center;
  border-top: 1px solid var(--border-color);
}

.copyright {
  color: var(--text-color);
  opacity: 0.7;
}`;
            
        case 'hero':
            return `/* Hero styles */
.hero {
  padding: 100px 0;
  background-color: var(--surface-color);
  text-align: center;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 20px;
}

.hero p {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.8;
}

@media screen and (max-width: 768px) {
  .hero {
    padding: 80px 0;
  }
  
  .hero h1 {
    font-size: 36px;
  }
  
  .hero p {
    font-size: 18px;
  }
}`;
            
        case 'features':
            return `/* Features styles */
.features {
  padding: 80px 0;
  background-color: var(--background-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature {
  background-color: var(--surface-color);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
}

.feature-icon {
  margin-bottom: 20px;
}

.feature-icon i {
  font-size: 48px;
  color: var(--primary-color);
}

.feature h3 {
  font-size: 24px;
  margin-bottom: 15px;
}

.feature p {
  opacity: 0.8;
}

@media screen and (max-width: 768px) {
  .features {
    padding: 50px 0;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}`;
            
        default:
            // Generic component styles
            return `/* ${formatTitle(component)} styles */
.${component} {
  padding: 80px 0;
  background-color: var(--background-color);
}

@media screen and (max-width: 768px) {
  .${component} {
    padding: 50px 0;
  }
}`;
    }
}

/**
 * Generate a React page component
 * @param {string} demoId - Demo ID
 * @param {string} pageName - Page name
 * @param {Object} options - Generation options
 * @param {Object} template - Template information
 * @returns {string} JavaScript content
 */
function generateReactPageJs(demoId, pageName, options, template) {
    // Format page name correctly
    const formattedPageName = formatComponentName(pageName);
    
    // Generate content based on page type
    let pageContent = '';
    
    switch (pageName) {
        case 'home':
            pageContent = `
  return (
    <>
      <Hero />
      <Features />
    </>
  );`;
            break;
            
        case 'about':
            pageContent = `
  return (
    <section className="about section">
      <div className="container">
        <div className="section-header">
          <h2>About Us</h2>
          <p>Learn more about our company</p>
        </div>
        <div className="about-content">
          <div className="about-text">
            <h3>Our Story</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <h3>Our Mission</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        </div>
      </div>
    </section>
  );`;
            break;
            
        case 'contact':
            pageContent = `
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted! This is a demo application.');
  };

  return (
    <section className="contact section">
      <div className="container">
        <div className="section-header">
          <h2>Contact Us</h2>
          <p>Get in touch with our team</p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="contact-text">
                <h3>Address</h3>
                <p>123 Demo Street, City, Country</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-phone"></i>
              </div>
              <div className="contact-text">
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="contact-text">
                <h3>Email</h3>
                <p>info@${demoId}.com</p>
              </div>
            </div>
          </div>
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input type="text" placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Your Email" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Subject" />
              </div>
              <div className="form-group">
                <textarea placeholder="Your Message" rows="5" required></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );`;
            break;
            
        default:
            // Generic page
            pageContent = `
  return (
    <section className="${pageName} section">
      <div className="container">
        <div className="section-header">
          <h2>${formatTitle(pageName)}</h2>
          <p>This is the ${formatTitle(pageName)} page</p>
        </div>
        <div className="${pageName}-content">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
      </div>
    </section>
  );`;
    }
    
    return `import React from 'react';
import './${formattedPageName}.css';
${pageName === 'home' ? `import Hero from '../components/Hero';
import Features from '../components/Features';` : ''}

function ${formattedPageName}() {
  ${pageContent}
}

export default ${formattedPageName};`;
}

/**
 * Generate a React page CSS file
 * @param {string} demoId - Demo ID
 * @param {string} pageName - Page name
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} CSS content
 */
function generateReactPageCss(demoId, pageName, options, colorPalette) {
    // Generate CSS based on page type
    switch (pageName) {
        case 'about':
            return `/* About page styles */
.about {
  background-color: var(--background-color);
}

.about-content {
  background-color: var(--surface-color);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.about-text h3 {
  font-size: 24px;
  margin-bottom: 15px;
  margin-top: 30px;
}

.about-text h3:first-child {
  margin-top: 0;
}

.about-text p {
  margin-bottom: 20px;
  line-height: 1.8;
}`;
            
        case 'contact':
            return `/* Contact page styles */
.contact {
  background-color: var(--background-color);
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
}

.contact-item {
  display: flex;
  margin-bottom: 30px;
}

.contact-icon {
  font-size: 24px;
  color: var(--primary-color);
  margin-right: 20px;
}

.contact-text h3 {
  font-size: 20px;
  margin-bottom: 5px;
}

.contact-form {
  background-color: var(--surface-color);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 20px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
}

.form-group textarea {
  resize: vertical;
}

.contact-form .btn {
  width: 100%;
}

@media screen and (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
  }
}`;
            
        default:
            // Generic page styles
            return `/* ${formatTitle(pageName)} page styles */
.${pageName} {
  background-color: var(--background-color);
}

.${pageName}-content {
  background-color: var(--surface-color);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}`;
    }
}

/**
 * Generate a Vue package.json file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} Package JSON content
 */
function generateVuePackageJson(demoId, options) {
    return JSON.stringify({
        name: demoId,
        version: '1.0.0',
        private: true,
        scripts: {
            'serve': 'vue-cli-service serve',
            'build': 'vue-cli-service build',
            'lint': 'vue-cli-service lint'
        },
        dependencies: {
            'core-js': '^3.8.3',
            'vue': '^3.2.13',
            'vue-router': '^4.0.3'
        },
        devDependencies: {
            '@babel/core': '^7.12.16',
            '@babel/eslint-parser': '^7.12.16',
            '@vue/cli-plugin-babel': '~5.0.0',
            '@vue/cli-plugin-eslint': '~5.0.0',
            '@vue/cli-plugin-router': '~5.0.0',
            '@vue/cli-service': '~5.0.0',
            'eslint': '^7.32.0',
            'eslint-plugin-vue': '^8.0.3'
        }
    }, null, 2);
}

/**
 * Generate a Vue index.html file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} HTML content
 */
function generateVueIndexHtml(demoId, options) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="icon" href="<%= BASE_URL %>favicon.ico">
    <title>${options.name}</title>
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
  </head>
  <body>
    <noscript>
      <strong>We're sorry but ${options.name} doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>`;
}

/**
 * Generate a Vue main.js file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} JavaScript content
 */
function generateVueMainJs(demoId, options) {
    return `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')`;
}

/**
 * Generate a Vue App.vue file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} template - Template information
 * @returns {string} Vue template content
 */
function generateVueAppVue(demoId, options, template) {
    return `<template>
  <div id="app">
    <TheHeader />
    <router-view/>
    <TheFooter />
  </div>
</template>

<script>
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'

export default {
  name: 'App',
  components: {
    TheHeader,
    TheFooter
  }
}
</script>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --accent-color: #e74c3c;
  --text-color: #333333;
  --background-color: #f5f5f5;
  --surface-color: #ffffff;
  --border-color: #dddddd;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: #fff;
}

.btn-primary:hover {
  background-color: var(--accent-color);
}

.section {
  padding: 80px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-header h2 {
  font-size: 36px;
  margin-bottom: 15px;
}

.section-header p {
  font-size: 18px;
  opacity: 0.8;
}

@media screen and (max-width: 768px) {
  .section {
    padding: 50px 0;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .section-header p {
    font-size: 16px;
  }
}
</style>`;
}

/**
 * Generate a Vue component file
 * @param {string} demoId - Demo ID
 * @param {string} component - Component name
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} Vue component content
 */
function generateVueComponentVue(demoId, component, options, colorPalette) {
    let template = '';
    let script = '';
    let style = '';
    
    // Generate component content based on type
    switch (component) {
        case 'header':
            template = `<template>
  <header class="header">
    <div class="container">
      <div class="logo">
        <router-link to="/">{{ appName }}</router-link>
      </div>
      <nav class="nav">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/about">About</router-link></li>
          <li><router-link to="/contact">Contact</router-link></li>
        </ul>
      </nav>
    </div>
  </header>
</template>`;

            script = `<script>
export default {
  name: 'TheHeader',
  data() {
    return {
      appName: '${options.name}'
    }
  }
}
</script>`;

            style = `<style scoped>
.header {
  background-color: var(--surface-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo a {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  text-decoration: none;
}

.nav ul {
  display: flex;
  list-style: none;
}

.nav li {
  margin-left: 30px;
}

.nav a {
  font-weight: 500;
  color: var(--text-color);
  text-decoration: none;
}

.nav a.router-link-active {
  color: var(--primary-color);
}
</style>`;
            break;
            
        case 'footer':
            template = `<template>
  <footer class="footer">
    <div class="container">
      <div class="copyright">
        &copy; {{ currentYear }} {{ appName }}. All rights reserved.
      </div>
    </div>
  </footer>
</template>`;

            script = `<script>
export default {
  name: 'TheFooter',
  data() {
    return {
      appName: '${options.name}'
    }
  },
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script>`;

            style = `<style scoped>
.footer {
  background-color: var(--surface-color);
  padding: 30px 0;
  text-align: center;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
}

.copyright {
  color: var(--text-color);
  opacity: 0.7;
}
</style>`;
            break;
            
        case 'hero':
            template = `<template>
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <router-link to="/about" class="btn btn-primary">Learn More</router-link>
      </div>
    </div>
  </section>
</template>`;

            script = `<script>
export default {
  name: 'HeroSection',
  data() {
    return {
      title: '${options.name}',
      description: '${options.description}'
    }
  }
}
</script>`;

            style = `<style scoped>
.hero {
  padding: 100px 0;
  background-color: var(--surface-color);
  text-align: center;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 20px;
  color: var(--text-color);
}

.hero p {
  font-size: 20px;
  margin-bottom: 30px;
  color: var(--text-color);
  opacity: 0.8;
}

@media screen and (max-width: 768px) {
  .hero {
    padding: 80px 0;
  }
  
  .hero h1 {
    font-size: 36px;
  }
  
  .hero p {
    font-size: 18px;
  }
}
</style>`;
            break;
            
        default:
            // Generic component
            template = `<template>
  <div class="${component}">
    <div class="container">
      <h2>${formatTitle(component)}</h2>
      <p>This is the ${formatTitle(component)} component.</p>
    </div>
  </div>
</template>`;

            script = `<script>
export default {
  name: '${formatComponentName(component)}'
}
</script>`;

            style = `<style scoped>
.${component} {
  padding: 40px 0;
}
</style>`;
    }
    
    return template + '\n\n' + script + '\n\n' + style;
}

/**
 * Generate an Angular package.json file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} Package JSON content
 */
function generateAngularPackageJson(demoId, options) {
    return JSON.stringify({
        name: demoId,
        version: '1.0.0',
        scripts: {
            ng: 'ng',
            start: 'ng serve',
            build: 'ng build',
            watch: 'ng build --watch --configuration development',
            test: 'ng test'
        },
        private: true,
        dependencies: {
            '@angular/animations': '^14.2.0',
            '@angular/common': '^14.2.0',
            '@angular/compiler': '^14.2.0',
            '@angular/core': '^14.2.0',
            '@angular/forms': '^14.2.0',
            '@angular/platform-browser': '^14.2.0',
            '@angular/platform-browser-dynamic': '^14.2.0',
            '@angular/router': '^14.2.0',
            'rxjs': '~7.5.0',
            'tslib': '^2.3.0',
            'zone.js': '~0.11.4'
        },
        devDependencies: {
            '@angular-devkit/build-angular': '^14.2.8',
            '@angular/cli': '^14.2.8',
            '@angular/compiler-cli': '^14.2.0',
            '@types/jasmine': '~4.0.0',
            'jasmine-core': '~4.3.0',
            'karma': '~6.4.0',
            'karma-chrome-launcher': '~3.1.0',
            'karma-coverage': '~2.2.0',
            'karma-jasmine': '~5.1.0',
            'karma-jasmine-html-reporter': '~2.0.0',
            'typescript': '~4.7.2'
        }
    }, null, 2);
}

/**
 * Generate an Angular index.html file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} HTML content
 */
function generateAngularIndexHtml(demoId, options) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${options.name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${options.description}">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
</head>
<body>
  <app-root></app-root>
</body>
</html>`;
}

/**
 * Generate an Angular main.ts file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} TypeScript content
 */
function generateAngularMainTs(demoId, options) {
    return `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));`;
}

/**
 * Generate an Angular app module file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} template - Template information
 * @returns {string} TypeScript content
 */
function generateAngularAppModule(demoId, options, template) {
    // Generate component imports
    const componentImports = template.defaultComponents.map(component => {
        const componentName = formatComponentName(component) + 'Component';
        return `import { ${componentName} } from './components/${formatComponentName(component).toLowerCase()}/${formatComponentName(component).toLowerCase()}.component';`;
    }).join('\n');
    
    // Generate page imports
    const pageImports = template.structure.pages ? template.structure.pages.map(page => {
        const pageName = formatComponentName(page.name) + 'Component';
        return `import { ${pageName} } from './pages/${formatComponentName(page.name).toLowerCase()}/${formatComponentName(page.name).toLowerCase()}.component';`;
    }).join('\n') : '';
    
    // Generate component declarations
    const componentDeclarations = template.defaultComponents.map(component => {
        return `    ${formatComponentName(component)}Component`;
    }).join(',\n');
    
    // Generate page declarations
    const pageDeclarations = template.structure.pages ? template.structure.pages.map(page => {
        return `    ${formatComponentName(page.name)}Component`;
    }).join(',\n') : '';
    
    // Generate routes
    const routes = template.structure.pages ? template.structure.pages.map(page => {
        const path = page.name === 'home' ? '' : page.name;
        return `  { path: '${path}', component: ${formatComponentName(page.name)}Component }`;
    }).join(',\n') : '';
    
    return `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
${componentImports}
${pageImports}

const routes: Routes = [
${routes},
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
${componentDeclarations},
${pageDeclarations}
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;
}

/**
 * Generate an Angular app component file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} TypeScript content
 */
function generateAngularAppComponent(demoId, options) {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '${options.name}';
}`;
}

/**
 * Generate an Angular app component template
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} template - Template information
 * @returns {string} HTML content
 */
function generateAngularAppTemplate(demoId, options, template) {
    return `<app-header></app-header>
<main class="main-content">
  <router-outlet></router-outlet>
</main>
<app-footer></app-footer>`;
}

/**
 * Generate a PHP index file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} template - Template information
 * @returns {string} PHP content
 */
function generatePHPIndex(demoId, options, template) {
    return `<?php
// Application configuration
require_once 'config/config.php';

// Get the requested page
$page = isset($_GET['page']) ? $_GET['page'] : 'home';

// Security check - prevent directory traversal
$page = preg_replace('/[^a-zA-Z0-9-_]/', '', $page);

// Check if page file exists
$page_file = "pages/{$page}.php";
if (!file_exists($page_file)) {
    $page = 'home';
    $page_file = "pages/home.php";
}

// Include header
include_once 'includes/header.php';

// Include page content
include_once $page_file;

// Include footer
include_once 'includes/footer.php';
?>`;
}

/**
 * Generate a .htaccess file
 * @returns {string} .htaccess content
 */
function generateHtaccess() {
    return `RewriteEngine On
RewriteBase /

# If the request is not for a valid file or directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all requests to index.php
RewriteRule ^(.*)$ index.php?page=$1 [L,QSA]

# Prevent directory listing
Options -Indexes

# Set default character set
AddDefaultCharset UTF-8

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Set caching headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 1 week"
</IfModule>`;
}

/**
 * Generate a PHP header file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} PHP content
 */
function generatePHPHeader(demoId, options, colorPalette) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - <?php echo isset($page_title) ? $page_title : 'Welcome'; ?></title>
    <meta name="description" content="<?php echo APP_DESCRIPTION; ?>">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>assets/css/styles.css">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <a href="<?php echo BASE_URL; ?>"><?php echo APP_NAME; ?></a>
            </div>
            <nav class="nav">
                <ul>
                    <li><a href="<?php echo BASE_URL; ?>" class="<?php echo $page === 'home' ? 'active' : ''; ?>">Home</a></li>
                    <li><a href="<?php echo BASE_URL; ?>about" class="<?php echo $page === 'about' ? 'active' : ''; ?>">About</a></li>
                    <li><a href="<?php echo BASE_URL; ?>contact" class="<?php echo $page === 'contact' ? 'active' : ''; ?>">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">`;
}

/**
 * Generate a PHP footer file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} PHP content
 */
function generatePHPFooter(demoId, options) {
    return `    </main>

    <footer class="footer">
        <div class="container">
            <div class="copyright">
                &copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="<?php echo BASE_URL; ?>assets/js/main.js"></script>
</body>
</html>`;
}

/**
 * Generate a PHP config file
 * @param {string} demoId - Demo ID
 * @param {Object} options - Generation options
 * @returns {string} PHP content
 */
function generatePHPConfig(demoId, options) {
    return `<?php
// Application configuration

// Basic application settings
define('APP_NAME', '${options.name}');
define('APP_DESCRIPTION', '${options.description}');
define('APP_VERSION', '1.0.0');

// Base URL (remember the trailing slash)
define('BASE_URL', '/');

// Database settings (if used)
define('DB_HOST', 'localhost');
define('DB_NAME', '${demoId.replace(/-/g, '_')}');
define('DB_USER', 'root');
define('DB_PASS', '');

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set default timezone
date_default_timezone_set('UTC');

// Start session
session_start();
?>`;
}

/**
 * Generate a PHP page file
 * @param {string} demoId - Demo ID
 * @param {string} pageName - Page name
 * @param {Object} options - Generation options
 * @param {Object} colorPalette - Color palette
 * @returns {string} PHP content
 */
function generatePHPPage(demoId, pageName, options, colorPalette) {
    switch (pageName) {
        case 'home':
            return `<?php
// Set page title
$page_title = 'Home';
?>

<section class="hero">
    <div class="container">
        <div class="hero-content">
            <h1><?php echo APP_NAME; ?></h1>
            <p><?php echo APP_DESCRIPTION; ?></p>
            <a href="<?php echo BASE_URL; ?>about" class="btn btn-primary">Learn More</a>
        </div>
    </div>
</section>

<section id="features" class="features">
    <div class="container">
        <div class="section-header">
            <h2>Features</h2>
            <p>Discover what makes us different</p>
        </div>
        <div class="features-grid">
            <?php
            $features = [
                ${options.features.map((feature, i) => `['title' => '${feature}', 'description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', 'icon' => '${['star', 'chart-line', 'cog', 'shield-alt', 'rocket', 'brain', 'lightbulb'][i % 7]}']`).join(",\n                ")}
            ];
            
            foreach ($features as $feature) {
                include 'includes/components/feature.php';
            }
            ?>
        </div>
    </div>
</section>`;
            
        case 'about':
            return `<?php
// Set page title
$page_title = 'About Us';
?>

<section class="about section">
    <div class="container">
        <div class="section-header">
            <h2>About Us</h2>
            <p>Learn more about our company</p>
        </div>
        <div class="about-content">
            <div class="about-text">
                <h3>Our Story</h3>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <h3>Our Mission</h3>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
            </div>
        </div>
    </div>
</section>`;
            
        case 'contact':
            return `<?php
// Set page title
$page_title = 'Contact Us';

// Process form submission
$form_submitted = false;
$form_error = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Simple validation
    if (
        !empty($_POST['name']) &&
        !empty($_POST['email']) &&
        !empty($_POST['message']) &&
        filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)
    ) {
        // In a real application, you would process the form data here
        // For demo purposes, we just set a success flag
        $form_submitted = true;
    } else {
        $form_error = true;
    }
}
?>

<section class="contact section">
    <div class="container">
        <div class="section-header">
            <h2>Contact Us</h2>
            <p>Get in touch with our team</p>
        </div>
        
        <?php if ($form_submitted): ?>
        <div class="alert alert-success">
            <p>Thank you for your message! We will get back to you soon.</p>
        </div>
        <?php endif; ?>
        
        <?php if ($form_error): ?>
        <div class="alert alert-error">
            <p>Please fill in all required fields with valid information.</p>
        </div>
        <?php endif; ?>
        
        <div class="contact-content">
            <div class="contact-info">
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="contact-text">
                        <h3>Address</h3>
                        <p>123 Demo Street, City, Country</p>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="contact-text">
                        <h3>Phone</h3>
                        <p>+1 (555) 123-4567</p>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="contact-text">
                        <h3>Email</h3>
                        <p>info@<?php echo strtolower(str_replace(' ', '', APP_NAME)); ?>.com</p>
                    </div>
                </div>
            </div>
            <div class="contact-form">
                <form method="post" action="">
                    <div class="form-group">
                        <input type="text" name="name" placeholder="Your Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Your Email" required>
                    </div>
                    <div class="form-group">
                        <input type="text" name="subject" placeholder="Subject">
                    </div>
                    <div class="form-group">
                        <textarea name="message" placeholder="Your Message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </div>
</section>`;
            
        default:
            // Generic page
            return `<?php
// Set page title
$page_title = '${formatTitle(pageName)}';
?>

<section class="${pageName} section">
    <div class="container">
        <div class="section-header">
            <h2>${formatTitle(pageName)}</h2>
            <p>This is the ${formatTitle(pageName)} page</p>
        </div>
        <div class="${pageName}-content">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
    </div>
</section>`;
    }
}

/**
 * Generate a PHP component file
 * @param {string} demoId - Demo ID
 * @param {string} component - Component name
 * @param {Object} options - Generation options
 * @returns {string} PHP content
 */
function generatePHPComponent(demoId, component, options) {
    switch (component) {
        case 'feature':
            return `<div class="feature">
    <div class="feature-icon">
        <i class="fas fa-<?php echo $feature['icon']; ?>"></i>
    </div>
    <h3><?php echo $feature['title']; ?></h3>
    <p><?php echo $feature['description']; ?></p>
</div>`;
            
        default:
            // Generic component
            return `<div class="${component}">
    <h3><?php echo isset($title) ? $title : '${formatTitle(component)}'; ?></h3>
    <div class="${component}-content">
        <?php echo isset($content) ? $content : 'This is the ${formatTitle(component)} component.'; ?>
    </div>
</div>`;
    }
}

/**
 * Generate customers data
 * @param {Object} options - Generation options
 * @returns {Object} Generated data
 */
function generateCustomersData(options) {
    const customers = [];
    const count = Math.floor(Math.random() * 50) + 50; // 50-100 customers
    
    for (let i = 1; i <= count; i++) {
        customers.push({
            id: i,
            name: `Customer ${i}`,
            email: `customer${i}@example.com`,
            phone: `(555) ${100 + i}-${1000 + i}`,
            address: `${1000 + i} Main St, City, State, ${10000 + i}`,
            created_at: new Date(Date.now() - Math.random() * 31536000000).toISOString() // Within the last year
        });
    }
    
    return {
        customers,
        total: customers.length,
        last_updated: new Date().toISOString()
    };
}

/**
 * Generate products data
 * @param {Object} options - Generation options
 * @returns {Object} Generated data
 */
function generateProductsData(options) {
    const products = [];
    const count = Math.floor(Math.random() * 30) + 20; // 20-50 products
    
    for (let i = 1; i <= count; i++) {
        products.push({
            id: i,
            name: `Product ${i}`,
            description: `This is product ${i}. It has many features and benefits.`,
            price: (Math.random() * 1000 + 10).toFixed(2),
            category: ['Electronics', 'Clothing', 'Home', 'Office', 'Food'][Math.floor(Math.random() * 5)],
            stock: Math.floor(Math.random() * 1000),
            image: `https://placehold.co/600x400?text=Product+${i}`
        });
    }
    
    return {
        products,
        total: products.length,
        last_updated: new Date().toISOString()
    };
}

/**
 * Generate orders data
 * @param {Object} options - Generation options
 * @returns {Object} Generated data
 */
function generateOrdersData(options) {
    const orders = [];
    const count = Math.floor(Math.random() * 100) + 100; // 100-200 orders
    
    for (let i = 1; i <= count; i++) {
        const customerId = Math.floor(Math.random() * 100) + 1;
        const numItems = Math.floor(Math.random() * 5) + 1;
        const items = [];
        let total = 0;
        
        for (let j = 1; j <= numItems; j++) {
            const productId = Math.floor(Math.random() * 50) + 1;
            const price = (Math.random() * 1000 + 10).toFixed(2);
            const quantity = Math.floor(Math.random() * 5) + 1;
            const subtotal = (price * quantity).toFixed(2);
            
            items.push({
                product_id: productId,
                price,
                quantity,
                subtotal
            });
            
            total += parseFloat(subtotal);
        }
        
        orders.push({
            id: i,
            customer_id: customerId,
            status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
            total: total.toFixed(2),
            items,
            date: new Date(Date.now() - Math.random() * 31536000000).toISOString() // Within the last year
        });
    }
    
    return {
        orders,
        total: orders.length,
        last_updated: new Date().toISOString()
    };
}

/**
 * Generate users data
 * @param {Object} options - Generation options
 * @returns {Object} Generated data
 */
function generateUsersData(options) {
    const users = [];
    const count = Math.floor(Math.random() * 50) + 50; // 50-100 users
    
    for (let i = 1; i <= count; i++) {
        users.push({
            id: i,
            username: `user${i}`,
            email: `user${i}@example.com`,
            name: `User ${i}`,
            created_at: new Date(Date.now() - Math.random() * 31536000000).toISOString() // Within the last year
        });
    }
    
    return {
        users,
        total: users.length,
        last_updated: new Date().toISOString()
    };
}

/**
 * Generate items data
 * @param {Object} options - Generation options
 * @returns {Object} Generated data
 */
function generateItemsData(options) {
    const items = [];
    const count = Math.floor(Math.random() * 30) + 20; // 20-50 items
    
    for (let i = 1; i <= count; i++) {
        items.push({
            id: i,
            name: `Item ${i}`,
            description: `This is item ${i}. It has many features and benefits.`,
            category: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'][Math.floor(Math.random() * 5)],
            image: `https://placehold.co/600x400?text=Item+${i}`
        });
    }
    
    return {
        items,
        total: items.length,
        last_updated: new Date().toISOString()
    };
}

/**
 * Format a title
 * @param {string} str - Input string
 * @returns {string} Formatted title
 */
function formatTitle(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format a component name
 * @param {string} name - Component name
 * @returns {string} Formatted component name
 */
function formatComponentName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Get a random item from an array
 * @param {Array} array - Array of items
 * @returns {*} Random item
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Export relevant functions for the main module
module.exports = {
    generateReactAppJs,
    generateReactAppCss,
    generateReactComponentJs,
    generateReactComponentCss,
    generateReactPageJs,
    generateReactPageCss,
    generateVueComponentVue,
    generatePHPPage,
    generatePHPComponent,
    generateCustomersData,
    generateProductsData,
    generateOrdersData,
    generateUsersData,
    generateItemsData,
    formatTitle,
    formatComponentName,
    getRandomItem
};