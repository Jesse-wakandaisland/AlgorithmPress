/**
 * AlgorithmPress PHP-WASM Export and Deployment Module
 * Handles exporting projects to different formats and deploying to various platforms
 */

const PHPWasmExporter = (function() {
  'use strict';
  
  // Dependencies
  let JSZip;
  
  // Available export formats
  const EXPORT_FORMATS = {
    STANDALONE_HTML: 'standalone_html',
    PHP_FILES: 'php_files',
    WORDPRESS_PLUGIN: 'wordpress_plugin',
    NODEJS_EXPRESS: 'nodejs_express',
    DOCKER_CONTAINER: 'docker_container'
  };
  
  // Available deployment targets
  const DEPLOYMENT_TARGETS = {
    CUBBIT: 'cubbit',
    GITHUB_PAGES: 'github_pages',
    FILE_DOWNLOAD: 'file_download',
    FTP: 'ftp'
  };
  
  /**
   * Initialize the exporter module
   * @returns {Promise} - Promise that resolves when initialized
   */
  function initialize() {
    return new Promise((resolve, reject) => {
      // Load JSZip library
      if (typeof JSZip === 'undefined') {
        loadJSZip()
          .then(() => {
            console.log('JSZip loaded successfully');
            resolve();
          })
          .catch(error => {
            console.error('Failed to load JSZip:', error);
            reject(error);
          });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Load JSZip library
   * @returns {Promise} - Promise that resolves when JSZip is loaded
   */
  function loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        JSZip = window.JSZip;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load JSZip'));
      };
      document.head.appendChild(script);
    });
  }
  
  /**
   * Export a project
   * @param {Object} project - Project object
   * @param {string} format - Export format (from EXPORT_FORMATS)
   * @param {Object} options - Additional export options
   * @returns {Promise} - Promise that resolves with the exported project
   */
  function exportProject(project, format, options = {}) {
    if (!project) {
      return Promise.reject(new Error('No project to export'));
    }
    
    switch (format) {
      case EXPORT_FORMATS.STANDALONE_HTML:
        return exportStandaloneHtml(project, options);
      case EXPORT_FORMATS.PHP_FILES:
        return exportPhpFiles(project, options);
      case EXPORT_FORMATS.WORDPRESS_PLUGIN:
        return exportWordPressPlugin(project, options);
      case EXPORT_FORMATS.NODEJS_EXPRESS:
        return exportNodeJsExpress(project, options);
      case EXPORT_FORMATS.DOCKER_CONTAINER:
        return exportDockerContainer(project, options);
      default:
        return Promise.reject(new Error('Unknown export format: ' + format));
    }
  }
  
  /**
   * Export as standalone HTML with PHP-WASM
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Promise that resolves with HTML blob
   */
  function exportStandaloneHtml(project, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Generate HTML
        const html = generateStandaloneHtml(project, options);
        
        // Create blob
        const blob = new Blob([html], { type: 'text/html' });
        
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Generate standalone HTML with PHP-WASM
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated HTML
   */
  function generateStandaloneHtml(project, options = {}) {
    // Generate components HTML
    let componentsHtml = '';
    
    if (project.components && project.components.length > 0) {
      componentsHtml = project.components.map(component => {
        const componentTemplate = options.componentTemplates.find(t => t.id === component.componentId);
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
    let themeJsScript = '';
    
    switch (project.theme) {
      case 'bootstrap':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet">';
        themeJsScript = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js"></script>';
        break;
      case 'material':
        themeCssLink = '<link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">';
        themeJsScript = '<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>';
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
  <title>${escapeHtml(project.name)}</title>
  
  <!-- PHP-WASM Script -->
  <script async type="module" src="https://cdn.jsdelivr.net/npm/php-wasm/php-tags.jsdelivr.mjs"></script>
  
  <!-- Theme CSS -->
  ${themeCssLink}
  
  <!-- Custom Styles -->
  <style>
  ${project.customStyles || ''}
  </style>
</head>
<body>
  <div class="container py-4">
    ${componentsHtml}
  </div>
  
  <!-- Theme Scripts -->
  ${themeJsScript}
  
  <!-- Custom Scripts -->
  <script>
  ${project.customScripts || ''}
  </script>
</body>
</html>`;
  }
  
  /**
   * Export as PHP files
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Promise that resolves with ZIP blob
   */
  function exportPhpFiles(project, options = {}) {
    return new Promise((resolve, reject) => {
      if (!JSZip) {
        reject(new Error('JSZip is not loaded'));
        return;
      }
      
      try {
        const zip = new JSZip();
        
        // Add main index.php
        zip.file('index.php', generateMainPhpFile(project, options));
        
        // Add custom PHP files
        zip.file('custom.php', project.customPhp || '<?php\n// Custom PHP code\n?>');
        
        // Create includes directory
        const includesDir = zip.folder('includes');
        
        // Add header.php
        includesDir.file('header.php', generateHeaderPhp(project, options));
        
        // Add footer.php
        includesDir.file('footer.php', generateFooterPhp(project, options));
        
        // Add functions.php
        includesDir.file('functions.php', generateFunctionsPhp(project, options));
        
        // Add stylesheets
        const cssDir = zip.folder('css');
        cssDir.file('style.css', project.customStyles || '/* Custom styles */');
        
        // Add scripts
        const jsDir = zip.folder('js');
        jsDir.file('main.js', project.customScripts || '/* Custom scripts */');
        
        // Add component-specific files
        if (project.components && project.components.length > 0) {
          const componentsDir = zip.folder('components');
          
          project.components.forEach(component => {
            const componentTemplate = options.componentTemplates.find(t => t.id === component.componentId);
            if (!componentTemplate) return;
            
            // Create component PHP file
            let componentCode = componentTemplate.template;
            
            // Replace placeholders with values
            Object.entries(component.props).forEach(([key, value]) => {
              const regex = new RegExp(`{{ ${key} }}`, 'g');
              componentCode = componentCode.replace(regex, value);
            });
            
            componentsDir.file(`${component.componentId}-${component.id}.php`, componentCode);
          });
        }
        
        // Generate zip file
        zip.generateAsync({ type: 'blob' })
          .then(blob => {
            resolve(blob);
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
   * Generate main PHP file
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateMainPhpFile(project, options = {}) {
    return `<?php
/**
 * ${escapeHtml(project.name)}
 * Generated by PHP-WASM Builder
 */

// Start session
session_start();

// Include functions
require_once __DIR__ . '/includes/functions.php';

// Include header
require_once __DIR__ . '/includes/header.php';

// Include custom PHP
require_once __DIR__ . '/custom.php';

// Main content
?>
<div class="container py-4">
  <?php
  ${generateComponentsIncludeCode(project, options)}
  ?>
</div>
<?php

// Include footer
require_once __DIR__ . '/includes/footer.php';
?>`;
  }
  
  /**
   * Generate components include code
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP include code
   */
  function generateComponentsIncludeCode(project, options = {}) {
    if (!project.components || project.components.length === 0) {
      return '// No components';
    }
    
    return project.components.map(component => {
      return `// Include ${component.componentId} component
include __DIR__ . '/components/${component.componentId}-${component.id}.php';`;
    }).join('\n  ');
  }
  
  /**
   * Generate header PHP file
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateHeaderPhp(project, options = {}) {
    // Get theme CSS link
    let themeCssLink = '';
    
    switch (project.theme) {
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
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars('${escapeHtml(project.name)}'); ?></title>
  
  <!-- Theme CSS -->
  ${themeCssLink}
  
  <!-- Custom Styles -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>`;
  }
  
  /**
   * Generate footer PHP file
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateFooterPhp(project, options = {}) {
    // Get theme JS script
    let themeJsScript = '';
    
    switch (project.theme) {
      case 'bootstrap':
        themeJsScript = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js"></script>';
        break;
      case 'material':
        themeJsScript = '<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>';
        break;
    }
    
    return `  <!-- Theme Scripts -->
  ${themeJsScript}
  
  <!-- Custom Scripts -->
  <script src="js/main.js"></script>
</body>
</html>`;
  }
  
  /**
   * Generate functions PHP file
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateFunctionsPhp(project, options = {}) {
    return `<?php
/**
 * Functions for ${escapeHtml(project.name)}
 * Generated by PHP-WASM Builder
 */

/**
 * Format a date string
 * @param string $dateString Date string
 * @param string $format Format (default: 'Y-m-d H:i:s')
 * @return string Formatted date
 */
function formatDate($dateString, $format = 'Y-m-d H:i:s') {
  $date = new DateTime($dateString);
  return $date->format($format);
}

/**
 * Get a truncated string
 * @param string $string String to truncate
 * @param int $length Maximum length
 * @param string $append String to append if truncated
 * @return string Truncated string
 */
function truncateString($string, $length = 100, $append = '...') {
  if (strlen($string) <= $length) {
    return $string;
  }
  
  return substr($string, 0, $length) . $append;
}

/**
 * Generate a random string
 * @param int $length Length of the string
 * @return string Random string
 */
function generateRandomString($length = 10) {
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $randomString = '';
  
  for ($i = 0; $i < $length; $i++) {
    $index = rand(0, strlen($characters) - 1);
    $randomString .= $characters[$index];
  }
  
  return $randomString;
}

// Add any custom functions below
`;
  }
  
  /**
   * Export as WordPress plugin
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Promise that resolves with ZIP blob
   */
  function exportWordPressPlugin(project, options = {}) {
    return new Promise((resolve, reject) => {
      if (!JSZip) {
        reject(new Error('JSZip is not loaded'));
        return;
      }
      
      try {
        const pluginSlug = slugify(project.name);
        const zip = new JSZip();
        const pluginDir = zip.folder(pluginSlug);
        
        // Add main plugin file
        pluginDir.file(`${pluginSlug}.php`, generateMainPluginFile(project, pluginSlug, options));
        
        // Add readme.txt
        pluginDir.file('readme.txt', generateReadmeTxt(project, options));
        
        // Add includes directory
        const includesDir = pluginDir.folder('includes');
        includesDir.file('class-main.php', generateMainClass(project, pluginSlug, options));
        includesDir.file('class-shortcodes.php', generateShortcodesClass(project, pluginSlug, options));
        
        // Add templates directory
        const templatesDir = pluginDir.folder('templates');
        
        // Add component templates
        if (project.components && project.components.length > 0) {
          project.components.forEach((component, index) => {
            const componentTemplate = options.componentTemplates.find(t => t.id === component.componentId);
            if (!componentTemplate) return;
            
            // Create component PHP file
            let componentCode = componentTemplate.template;
            
            // Replace placeholders with values
            Object.entries(component.props).forEach(([key, value]) => {
              const regex = new RegExp(`{{ ${key} }}`, 'g');
              componentCode = componentCode.replace(regex, value);
            });
            
            templatesDir.file(`component-${index + 1}.php`, componentCode);
          });
        }
        
        // Add assets directory
        const assetsDir = pluginDir.folder('assets');
        
        // Add CSS
        const cssDir = assetsDir.folder('css');
        cssDir.file('style.css', project.customStyles || '/* Custom styles */');
        
        // Add JS
        const jsDir = assetsDir.folder('js');
        jsDir.file('main.js', project.customScripts || '/* Custom scripts */');
        
        // Generate zip file
        zip.generateAsync({ type: 'blob' })
          .then(blob => {
            resolve(blob);
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
   * Generate main plugin file
   * @param {Object} project - Project object
   * @param {string} pluginSlug - Plugin slug
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateMainPluginFile(project, pluginSlug, options = {}) {
    const pluginName = project.name;
    const className = toCamelCase(pluginSlug, true);
    
    return `<?php
/**
 * Plugin Name: ${escapeHtml(pluginName)}
 * Plugin URI: https://example.com/${pluginSlug}
 * Description: ${escapeHtml(project.description || 'A plugin generated by PHP-WASM Builder')}
 * Version: 1.0.0
 * Author: ${escapeHtml(options.author || 'PHP-WASM Builder')}
 * Author URI: https://example.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: ${pluginSlug}
 * Domain Path: /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
  die;
}

define('${className.toUpperCase()}_VERSION', '1.0.0');
define('${className.toUpperCase()}_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('${className.toUpperCase()}_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include the main class
require_once plugin_dir_path(__FILE__) . 'includes/class-main.php';

// Include the shortcodes class
require_once plugin_dir_path(__FILE__) . 'includes/class-shortcodes.php';

/**
 * Begin execution of the plugin.
 */
function run_${pluginSlug}() {
  $plugin = new ${className}();
  $plugin->run();
  
  $shortcodes = new ${className}_Shortcodes();
  $shortcodes->register_shortcodes();
}

run_${pluginSlug}();
`;
  }
  
  /**
   * Generate readme.txt
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated readme.txt
   */
  function generateReadmeTxt(project, options = {}) {
    return `=== ${escapeHtml(project.name)} ===
Contributors: phpwasmbuilder
Tags: custom, php-wasm
Requires at least: 5.0
Tested up to: 6.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

${escapeHtml(project.description || 'A custom plugin generated by PHP-WASM Builder.')}

== Description ==

This plugin was automatically generated from a PHP-WASM Builder project.

Features:

* Custom components and functionality
* Easy integration with WordPress
* Shortcodes for adding components to pages and posts

== Installation ==

1. Upload the plugin files to the '/wp-content/plugins/${slugify(project.name)}' directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Use the provided shortcodes to add components to your pages and posts.

== Frequently Asked Questions ==

= How do I use this plugin? =

Use the shortcodes provided by the plugin to add components to your pages and posts.

== Changelog ==

= 1.0.0 =
* Initial release
`;
  }
  
  /**
   * Generate main class
   * @param {Object} project - Project object
   * @param {string} pluginSlug - Plugin slug
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateMainClass(project, pluginSlug, options = {}) {
    const className = toCamelCase(pluginSlug, true);
    
    return `<?php
/**
 * The main plugin class.
 */
class ${className} {
  /**
   * Initialize the plugin.
   */
  public function __construct() {
    $this->load_dependencies();
    $this->set_locale();
    $this->define_admin_hooks();
    $this->define_public_hooks();
  }
  
  /**
   * Load the required dependencies for this plugin.
   */
  private function load_dependencies() {
    // No additional dependencies needed for now
  }
  
  /**
   * Set the locale for internationalization.
   */
  private function set_locale() {
    add_action('plugins_loaded', array($this, 'load_plugin_textdomain'));
  }
  
  /**
   * Register all of the hooks related to the admin area functionality.
   */
  private function define_admin_hooks() {
    add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));
    add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    add_action('admin_menu', array($this, 'add_admin_menu'));
  }
  
  /**
   * Register all of the hooks related to the public-facing functionality.
   */
  private function define_public_hooks() {
    add_action('wp_enqueue_scripts', array($this, 'enqueue_public_styles'));
    add_action('wp_enqueue_scripts', array($this, 'enqueue_public_scripts'));
  }
  
  /**
   * Load the plugin text domain for translation.
   */
  public function load_plugin_textdomain() {
    load_plugin_textdomain('${pluginSlug}', false, dirname(dirname(plugin_basename(__FILE__))) . '/languages/');
  }
  
  /**
   * Register the stylesheets for the admin area.
   */
  public function enqueue_admin_styles() {
    wp_enqueue_style('${pluginSlug}', plugin_dir_url(dirname(__FILE__)) . 'assets/css/style.css', array(), ${className.toUpperCase()}_VERSION, 'all');
  }
  
  /**
   * Register the JavaScript for the admin area.
   */
  public function enqueue_admin_scripts() {
    wp_enqueue_script('${pluginSlug}', plugin_dir_url(dirname(__FILE__)) . 'assets/js/main.js', array('jquery'), ${className.toUpperCase()}_VERSION, false);
  }
  
  /**
   * Register the stylesheets for the public-facing side of the site.
   */
  public function enqueue_public_styles() {
    wp_enqueue_style('${pluginSlug}', plugin_dir_url(dirname(__FILE__)) . 'assets/css/style.css', array(), ${className.toUpperCase()}_VERSION, 'all');
    
    // Enqueue theme CSS if needed
    ${generateThemeCssEnqueue(project)}
  }
  
  /**
   * Register the JavaScript for the public-facing side of the site.
   */
  public function enqueue_public_scripts() {
    wp_enqueue_script('${pluginSlug}', plugin_dir_url(dirname(__FILE__)) . 'assets/js/main.js', array('jquery'), ${className.toUpperCase()}_VERSION, false);
    
    // Enqueue theme JS if needed
    ${generateThemeJsEnqueue(project)}
  }
  
  /**
   * Add admin menu pages.
   */
  public function add_admin_menu() {
    add_menu_page(
      '${escapeHtml(project.name)}',
      '${escapeHtml(project.name)}',
      'manage_options',
      '${pluginSlug}',
      array($this, 'display_admin_page'),
      'dashicons-admin-generic',
      100
    );
  }
  
  /**
   * Display the admin page.
   */
  public function display_admin_page() {
    include plugin_dir_path(dirname(__FILE__)) . 'templates/admin-page.php';
  }
  
  /**
   * Run the plugin.
   */
  public function run() {
    // Nothing to do here for now
  }
}
`;
  }
  
  /**
   * Generate theme CSS enqueue code
   * @param {Object} project - Project object
   * @returns {string} - Generated PHP code
   */
  function generateThemeCssEnqueue(project) {
    switch (project.theme) {
      case 'bootstrap':
        return "wp_enqueue_style('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css', array(), '5.0.0', 'all');";
      case 'material':
        return "wp_enqueue_style('materialize', 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css', array(), '1.0.0', 'all');";
      case 'bulma':
        return "wp_enqueue_style('bulma', 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css', array(), '0.9.3', 'all');";
      case 'tailwind':
        return "wp_enqueue_style('tailwind', 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css', array(), '2.2.19', 'all');";
      default:
        return '// No theme CSS to enqueue';
    }
  }
  
  /**
   * Generate theme JS enqueue code
   * @param {Object} project - Project object
   * @returns {string} - Generated PHP code
   */
  function generateThemeJsEnqueue(project) {
    switch (project.theme) {
      case 'bootstrap':
        return "wp_enqueue_script('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js', array('jquery'), '5.0.0', true);";
      case 'material':
        return "wp_enqueue_script('materialize', 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js', array('jquery'), '1.0.0', true);";
      default:
        return '// No theme JS to enqueue';
    }
  }
  
  /**
   * Generate shortcodes class
   * @param {Object} project - Project object
   * @param {string} pluginSlug - Plugin slug
   * @param {Object} options - Export options
   * @returns {string} - Generated PHP code
   */
  function generateShortcodesClass(project, pluginSlug, options = {}) {
    const className = toCamelCase(pluginSlug, true);
    
    let shortcodeMethods = '';
    let shortcodeRegistrations = '';
    
    // Generate shortcode methods for each component
    if (project.components && project.components.length > 0) {
      project.components.forEach((component, index) => {
        const componentTemplate = options.componentTemplates.find(t => t.id === component.componentId);
        if (!componentTemplate) return;
        
        const shortcodeName = `${pluginSlug}_component_${index + 1}`;
        
        shortcodeMethods += `
  /**
   * Render component ${index + 1} (${componentTemplate.name})
   * @param array $atts Shortcode attributes
   * @param string $content Shortcode content
   * @return string Rendered HTML
   */
  public function render_component_${index + 1}($atts = array(), $content = null) {
    // Start output buffering
    ob_start();
    
    // Include template
    include ${className.toUpperCase()}_PLUGIN_DIR . 'templates/component-${index + 1}.php';
    
    // Return buffered content
    return ob_get_clean();
  }
`;
        
        shortcodeRegistrations += `    add_shortcode('${shortcodeName}', array($this, 'render_component_${index + 1}'));\n`;
      });
    }
    
    return `<?php
/**
 * The shortcodes functionality of the plugin.
 */
class ${className}_Shortcodes {
  /**
   * Register all shortcodes.
   */
  public function register_shortcodes() {
${shortcodeRegistrations}  }
${shortcodeMethods}}
`;
  }
  
  /**
   * Export as Node.js Express app
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Promise that resolves with ZIP blob
   */
  function exportNodeJsExpress(project, options = {}) {
    return new Promise((resolve, reject) => {
      if (!JSZip) {
        reject(new Error('JSZip is not loaded'));
        return;
      }
      
      try {
        const appName = slugify(project.name);
        const zip = new JSZip();
        
        // Add package.json
        zip.file('package.json', generatePackageJson(project, appName, options));
        
        // Add app.js
        zip.file('app.js', generateAppJs(project, options));
        
        // Add .env
        zip.file('.env', 'PORT=3000\nNODE_ENV=development\n');
        
        // Add .gitignore
        zip.file('.gitignore', 'node_modules/\n.env\n');
        
        // Add README.md
        zip.file('README.md', generateReadmeMd(project, appName, options));
        
        // Add views directory
        const viewsDir = zip.folder('views');
        viewsDir.file('index.ejs', generateIndexEjs(project, options));
        
        // Add component views
        if (project.components && project.components.length > 0) {
          const componentsDir = viewsDir.folder('components');
          
          project.components.forEach((component, index) => {
            const componentTemplate = options.componentTemplates.find(t => t.id === component.componentId);
            if (!componentTemplate) return;
            
            // Convert PHP template to EJS
            let componentCode = componentTemplate.template;
            
            // Replace PHP tags with EJS tags
            componentCode = componentCode.replace(/\<\?php\s*echo\s*(.*?);?\s*\?\>/g, '<%= $1 %>');
            componentCode = componentCode.replace(/\<\?php\s*if\s*\((.*?)\)\s*:\s*\?\>/g, '<% if ($1) { %>');
            componentCode = componentCode.replace(/\<\?php\s*else\s*:\s*\?\>/g, '<% } else { %>');
            componentCode = componentCode.replace(/\<\?php\s*elseif\s*\((.*?)\)\s*:\s*\?\>/g, '<% } else if ($1) { %>');
            componentCode = componentCode.replace(/\<\?php\s*endif;\s*\?\>/g, '<% } %>');
            componentCode = componentCode.replace(/\<\?php\s*foreach\s*\((.*?)\s+as\s+(.*?)\)\s*:\s*\?\>/g, '<% $1.forEach(function($2) { %>');
            componentCode = componentCode.replace(/\<\?php\s*endforeach;\s*\?\>/g, '<% }); %>');
            
            // Replace placeholders with values
            Object.entries(component.props).forEach(([key, value]) => {
              const regex = new RegExp(`{{ ${key} }}`, 'g');
              componentCode = componentCode.replace(regex, value);
            });
            
            componentsDir.file(`component-${index + 1}.ejs`, componentCode);
          });
        }
        
        // Add public directory
        const publicDir = zip.folder('public');
        
        // Add CSS
        const cssDir = publicDir.folder('css');
        cssDir.file('style.css', project.customStyles || '/* Custom styles */');
        
        // Add JS
        const jsDir = publicDir.folder('js');
        jsDir.file('main.js', project.customScripts || '/* Custom scripts */');
        
        // Generate zip file
        zip.generateAsync({ type: 'blob' })
          .then(blob => {
            resolve(blob);
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
   * Generate package.json for Node.js app
   * @param {Object} project - Project object
   * @param {string} appName - App name
   * @param {Object} options - Export options
   * @returns {string} - Generated JSON
   */
  function generatePackageJson(project, appName, options = {}) {
    const packageJson = {
      name: appName,
      version: '1.0.0',
      description: project.description || 'A Node.js app generated by PHP-WASM Builder',
      main: 'app.js',
      scripts: {
        start: 'node app.js',
        dev: 'nodemon app.js'
      },
      dependencies: {
        'dotenv': '^16.0.1',
        'ejs': '^3.1.8',
        'express': '^4.18.1',
        'express-session': '^1.17.3',
        'body-parser': '^1.20.0',
        'sqlite3': '^5.1.6'
      },
      devDependencies: {
        'nodemon': '^2.0.19'
      },
      author: options.author || 'PHP-WASM Builder',
      license: 'MIT'
    };
    
    return JSON.stringify(packageJson, null, 2);
  }
  
  /**
   * Generate app.js for Node.js app
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated JavaScript code
   */
  function generateAppJs(project, options = {}) {
    return `/**
 * ${escapeHtml(project.name)}
 * Generated by PHP-WASM Builder
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: '${generateRandomString(32)}',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Database setup
const db = new sqlite3.Database(':memory:');

// Helper functions
${generateNodeHelperFunctions()}

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: '${escapeHtml(project.name)}',
    req: req
  });
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
`;
  }
  
  /**
   * Generate helper functions for Node.js app
   * @returns {string} - Generated JavaScript code
   */
  function generateNodeHelperFunctions() {
    return `
// Format date
function formatDate(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = new Date(dateString);
  
  // Simple format replacements
  return format
    .replace('YYYY', date.getFullYear())
    .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
    .replace('DD', String(date.getDate()).padStart(2, '0'))
    .replace('HH', String(date.getHours()).padStart(2, '0'))
    .replace('mm', String(date.getMinutes()).padStart(2, '0'))
    .replace('ss', String(date.getSeconds()).padStart(2, '0'));
}

// Truncate string
function truncateString(string, length = 100, append = '...') {
  if (string.length <= length) {
    return string;
  }
  
  return string.substring(0, length) + append;
}

// Generate random string
function generateRandomString(length = 10) {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}`;
  }
  
  /**
   * Generate README.md for Node.js app
   * @param {Object} project - Project object
   * @param {string} appName - App name
   * @param {Object} options - Export options
   * @returns {string} - Generated Markdown
   */
  function generateReadmeMd(project, appName, options = {}) {
    return `# ${escapeHtml(project.name)}

${project.description || 'A Node.js application generated by PHP-WASM Builder.'}

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a \`.env\` file (or use the provided example)
4. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

## Development

For development with auto-restart:
\`\`\`bash
npm run dev
\`\`\`

## Features

- Express.js web server
- EJS templating engine
- SQLite database
- Session management
- Static file serving

## License

MIT
`;
  }
  
  /**
   * Generate index.ejs for Node.js app
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated EJS template
   */
  function generateIndexEjs(project, options = {}) {
    // Get theme CSS link
    let themeCssLink = '';
    let themeJsScript = '';
    
    switch (project.theme) {
      case 'bootstrap':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet">';
        themeJsScript = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js"></script>';
        break;
      case 'material':
        themeCssLink = '<link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">';
        themeJsScript = '<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>';
        break;
      case 'bulma':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css" rel="stylesheet">';
        break;
      case 'tailwind':
        themeCssLink = '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">';
        break;
    }
    
    // Generate component includes
    let componentIncludes = '';
    
    if (project.components && project.components.length > 0) {
      componentIncludes = project.components.map((component, index) => {
        return `<%- include('components/component-${index + 1}') %>`;
      }).join('\n    ');
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  
  <!-- Theme CSS -->
  ${themeCssLink}
  
  <!-- Custom Styles -->
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="container py-4">
    <h1><%= title %></h1>
    
    <!-- Components -->
    ${componentIncludes}
  </div>
  
  <!-- Theme Scripts -->
  ${themeJsScript}
  
  <!-- Custom Scripts -->
  <script src="/js/main.js"></script>
</body>
</html>`;
  }
  
  /**
   * Export as Docker container
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Promise that resolves with ZIP blob
   */
  function exportDockerContainer(project, options = {}) {
    return new Promise((resolve, reject) => {
      if (!JSZip) {
        reject(new Error('JSZip is not loaded'));
        return;
      }
      
      try {
        const zip = new JSZip();
        
        // First, generate PHP files
        exportPhpFiles(project, options)
          .then(phpFilesBlob => {
            // Extract PHP files to a temp folder
            const reader = new FileReader();
            
            reader.onload = function(e) {
              const phpZip = new JSZip();
              
              phpZip.loadAsync(e.target.result)
                .then(phpZipContent => {
                  // Create Docker container files
                  
                  // Add Dockerfile
                  zip.file('Dockerfile', generateDockerfile(project, options));
                  
                  // Add docker-compose.yml
                  zip.file('docker-compose.yml', generateDockerCompose(project, options));
                  
                  // Add .dockerignore
                  zip.file('.dockerignore', 'node_modules\nnpm-debug.log\nDockerfile\ndocker-compose.yml\n.git\n.gitignore\n');
                  
                  // Add README.md
                  zip.file('README.md', generateDockerReadme(project, options));
                  
                  // Add PHP files to app directory
                  const appDir = zip.folder('app');
                  
                  // Copy all PHP files
                  const promises = [];
                  
                  Object.keys(phpZipContent.files).forEach(fileName => {
                    if (!phpZipContent.files[fileName].dir) {
                      const promise = phpZipContent.files[fileName].async('nodebuffer')
                        .then(content => {
                          appDir.file(fileName, content);
                        });
                      
                      promises.push(promise);
                    } else {
                      appDir.folder(fileName);
                    }
                  });
                  
                  // Wait for all files to be copied
                  Promise.all(promises)
                    .then(() => {
                      // Generate zip file
                      zip.generateAsync({ type: 'blob' })
                        .then(blob => {
                          resolve(blob);
                        })
                        .catch(error => {
                          reject(error);
                        });
                    })
                    .catch(error => {
                      reject(error);
                    });
                })
                .catch(error => {
                  reject(error);
                });
            };
            
            reader.onerror = function(error) {
              reject(error);
            };
            
            reader.readAsArrayBuffer(phpFilesBlob);
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
   * Generate Dockerfile
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated Dockerfile
   */
  function generateDockerfile(project, options = {}) {
    return `FROM php:8.0-apache

# Install PHP extensions
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    intl \
    pdo_mysql \
    zip \
    gd \
    exif

# Enable Apache modules
RUN a2enmod rewrite headers

# Set up Apache document root
ENV APACHE_DOCUMENT_ROOT /var/www/html/
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy application files
COPY ./app/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
`;
  }
  
  /**
   * Generate docker-compose.yml
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated docker-compose.yml
   */
  function generateDockerCompose(project, options = {}) {
    return `version: '3'

services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./app:/var/www/html
    restart: always
    environment:
      - PHP_MEMORY_LIMIT=256M
      - UPLOAD_MAX_FILESIZE=64M
      - POST_MAX_SIZE=64M
`;
  }
  
  /**
   * Generate Docker README.md
   * @param {Object} project - Project object
   * @param {Object} options - Export options
   * @returns {string} - Generated README.md
   */
  function generateDockerReadme(project, options = {}) {
    return `# ${escapeHtml(project.name)} - Docker Container

${project.description || 'A Docker container generated by PHP-WASM Builder.'}

## Running with Docker

### Prerequisites

- Docker
- Docker Compose

### Starting the Container

1. Clone this repository
2. Run Docker Compose:
   \`\`\`bash
   docker-compose up -d
   \`\`\`
3. Access the application at http://localhost:8080

### Stopping the Container

\`\`\`bash
docker-compose down
\`\`\`

## Development

The application files are located in the \`app\` directory. Changes to these files will be reflected in real-time due to the volume mapping in \`docker-compose.yml\`.

## Customization

- You can modify the PHP version or add additional extensions in the \`Dockerfile\`.
- Adjust memory limits and other PHP settings in the \`docker-compose.yml\` file.

## Production Deployment

For production deployment, it's recommended to:

1. Remove volume mappings from \`docker-compose.yml\`
2. Set appropriate environment variables for production
3. Implement proper security measures (HTTPS, etc.)
`;
  }
  
  /**
   * Deploy a project
   * @param {Object} project - Project object
   * @param {string} exportFormat - Export format (from EXPORT_FORMATS)
   * @param {string} target - Deployment target (from DEPLOYMENT_TARGETS)
   * @param {Object} options - Additional deployment options
   * @returns {Promise} - Promise that resolves with the deployment result
   */
  function deployProject(project, exportFormat, target, options = {}) {
    if (!project) {
      return Promise.reject(new Error('No project to deploy'));
    }
    
    // First export the project
    return exportProject(project, exportFormat, options)
      .then(exportedContent => {
        // Then deploy it
        switch (target) {
          case DEPLOYMENT_TARGETS.CUBBIT:
            return deployToCubbit(project, exportFormat, exportedContent, options);
          case DEPLOYMENT_TARGETS.GITHUB_PAGES:
            return deployToGitHubPages(project, exportFormat, exportedContent, options);
          case DEPLOYMENT_TARGETS.FILE_DOWNLOAD:
            return deployAsFileDownload(project, exportFormat, exportedContent, options);
          case DEPLOYMENT_TARGETS.FTP:
            return deployToFtp(project, exportFormat, exportedContent, options);
          default:
            return Promise.reject(new Error('Unknown deployment target: ' + target));
        }
      });
  }
  
  /**
   * Deploy to Cubbit DS3
   * @param {Object} project - Project object
   * @param {string} exportFormat - Export format
   * @param {Blob} exportedContent - Exported content blob
   * @param {Object} options - Deployment options
   * @returns {Promise} - Promise that resolves with the deployment result
   */
  function deployToCubbit(project, exportFormat, exportedContent, options = {}) {
    if (!CubbitStorage || !CubbitStorage.isInitialized()) {
      return Promise.reject(new Error('Cubbit storage is not initialized'));
    }
    
    // Determine file name and content type based on export format
    let fileName = slugify(project.name);
    let contentType = 'application/octet-stream';
    
    switch (exportFormat) {
      case EXPORT_FORMATS.STANDALONE_HTML:
        fileName += '.html';
        contentType = 'text/html';
        break;
      case EXPORT_FORMATS.PHP_FILES:
      case EXPORT_FORMATS.WORDPRESS_PLUGIN:
      case EXPORT_FORMATS.NODEJS_EXPRESS:
      case EXPORT_FORMATS.DOCKER_CONTAINER:
        fileName += '.zip';
        contentType = 'application/zip';
        break;
    }
    
    // Deploy folder path
    const folderPath = options.folderPath || 'deployments/';
    const filePath = folderPath + fileName;
    
    // Upload to Cubbit
    return CubbitStorage.uploadFile(filePath, exportedContent, contentType, {
      project: project.id,
      name: project.name,
      format: exportFormat
    }).then(result => {
      return result;
    });
  }
  
  /**
   * Deploy to GitHub Pages
   * @param {Object} project - Project object
   * @param {string} exportFormat - Export format
   * @param {Blob} exportedContent - Exported content blob
   * @param {Object} options - Deployment options
   * @returns {Promise} - Promise that resolves with the deployment result
   */
  function deployToGitHubPages(project, exportFormat, exportedContent, options = {}) {
    // GitHub Pages only supports static content, so we can only deploy standalone HTML
    if (exportFormat !== EXPORT_FORMATS.STANDALONE_HTML) {
      return Promise.reject(new Error('GitHub Pages only supports standalone HTML deployment'));
    }
    
    // This would require GitHub API integration
    return Promise.reject(new Error('GitHub Pages deployment not implemented yet'));
  }
  
  /**
   * Deploy as file download
   * @param {Object} project - Project object
   * @param {string} exportFormat - Export format
   * @param {Blob} exportedContent - Exported content blob
   * @param {Object} options - Deployment options
   * @returns {Promise} - Promise that resolves with the deployment result
   */
  function deployAsFileDownload(project, exportFormat, exportedContent, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Determine file extension based on export format
        let fileExtension = '.txt';
        
        switch (exportFormat) {
          case EXPORT_FORMATS.STANDALONE_HTML:
            fileExtension = '.html';
            break;
          case EXPORT_FORMATS.PHP_FILES:
          case EXPORT_FORMATS.WORDPRESS_PLUGIN:
          case EXPORT_FORMATS.NODEJS_EXPRESS:
          case EXPORT_FORMATS.DOCKER_CONTAINER:
            fileExtension = '.zip';
            break;
        }
        
        // Create a download link
        const fileName = slugify(project.name) + fileExtension;
        const url = URL.createObjectURL(exportedContent);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        resolve({
          success: true,
          fileName: fileName,
          type: 'download'
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Deploy to FTP
   * @param {Object} project - Project object
   * @param {string} exportFormat - Export format
   * @param {Blob} exportedContent - Exported content blob
   * @param {Object} options - Deployment options
   * @returns {Promise} - Promise that resolves with the deployment result
   */
  function deployToFtp(project, exportFormat, exportedContent, options = {}) {
    // FTP deployment would require a server-side component
    return Promise.reject(new Error('FTP deployment requires a server-side component'));
  }
  
  /**
   * Helper function to convert string to slug
   * @param {string} text - Text to convert
   * @returns {string} - Slugified text
   */
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  
  /**
   * Helper function to convert string to camelCase
   * @param {string} text - Text to convert
   * @param {boolean} capitalizeFirstLetter - Whether to capitalize the first letter
   * @returns {string} - CamelCase text
   */
  function toCamelCase(text, capitalizeFirstLetter = false) {
    const camelCase = text
      .toString()
      .replace(/^([A-Z])|[\s-_](\w)/g, function(match, p1, p2) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
      });
    
    if (capitalizeFirstLetter) {
      return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    }
    
    return camelCase;
  }
  
  /**
   * Helper function to escape HTML
   * @param {string} text - Text to escape
   * @returns {string} - Escaped HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    
    return text
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Helper function to generate random string
   * @param {number} length - Length of the string
   * @returns {string} - Random string
   */
  function generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
  
  // Public API
  return {
    initialize,
    exportProject,
    deployProject,
    EXPORT_FORMATS,
    DEPLOYMENT_TARGETS
  };
})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHPWasmExporter;
}
