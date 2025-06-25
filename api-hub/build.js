const { execSync, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Terser = require('terser');

const API_HUB_DIR = __dirname; // Assumes build.js is in api-hub/
const PROJECT_ROOT = path.resolve(API_HUB_DIR, '..');
const NEXT_OUT_DIR = path.join(API_HUB_DIR, 'out');
const NEXT_STATIC_DIR = path.join(NEXT_OUT_DIR, '_next', 'static');

const OUTPUT_API_HUB_JS_FILE = path.join(PROJECT_ROOT, 'api-hub.min.js');
const OUTPUT_API_HUB_CSS_FILE = path.join(PROJECT_ROOT, 'api-hub.min.css');

const OUTPUT_CMS_JS_FILE = path.join(PROJECT_ROOT, 'cms.all.min.js');
const OUTPUT_CMS_CSS_FILE = path.join(PROJECT_ROOT, 'cms.all.min.css');

// Define core CMS JS files in their correct loading order
// This list needs to be maintained carefully.
const CMS_JS_FILES = [
  "architecture-overview.js",
  "NaraUI.js", // NaraUI should be early if other scripts might use it on init
  "rainbow-indicator.js", // This is duplicated later, ensure only one instance or loaded if needed by multiple
  "module-framework.js",
  "error-monitoring-system.js",
  "unified-storage-interface.js",
  "storage-config-manager.js",
  "production-integration-diagnostics.js",
  "production-integration-helper.js",
  "production-initialization.js", // Must be after its dependencies
  "debug-validation-logs.js",
  "php-wasm-builder.js",
  "dock-functionality.js", // Core dock logic
  "dock-integration.js",   // Integrates dock with PHPWasmBuilder
  "wordpress-context-menu.js",
  "wordpress-connector.js",
  "demo-system-module.js",
  "api-gateway.js",
  "plugin-system-module.js",
  "php-component-templates.js",
  "php-wasm-integration.js",
  "voice-control-system.js",
  "php-wasm-exporter.js",
  "voice-component.js",
  "publishing-system.js",
  // "rainbow-indicator.js", // Already listed
  "implementation-example-module.js",
  "cubbit-storage-integration.js",
  "storage-provider-implementations.js", // Contains actual provider logic
  "storage-providers.js", // Might be definitions or interfaces
  "web3-storage-providers.js",
  "modules-integration.js",
  "nue-integration.js",
  "desktop-integration.js",
  "dock-desktop-integration.js",
  "command-palette.js",
  "command-palette-integration.js",
  "litespeed-plugin.js"
].map(f => path.join(PROJECT_ROOT, f)); // Prepend root path

// Define core CMS CSS files
const CMS_CSS_FILES = [
  "command-palette-css.css",
  "litespeed-css.css"
  // Any other global CSS files for the CMS part
].map(f => path.join(PROJECT_ROOT, f));


async function buildProject() {
  console.log('Starting full project build process...');

  try {
    // --- Part 1: Build API Hub (Next.js app) ---
    console.log('\n--- Building API Hub ---');
    if (!fs.existsSync(path.join(API_HUB_DIR, 'node_modules'))) {
      console.log('Running npm install in api-hub...');
      execSync('npm install', { cwd: API_HUB_DIR, stdio: 'inherit' });
    }
    console.log('Running Next.js build (npm run build)...');
    execSync('npm run build', { cwd: API_HUB_DIR, stdio: 'inherit' });

    if (!fs.existsSync(NEXT_OUT_DIR)) {
      console.error(`ERROR: Next.js output directory "${NEXT_OUT_DIR}" not found.`);
      process.exit(1);
    }

    // Concatenate API Hub CSS
    console.log('Concatenating API Hub CSS files...');
    const apiHubCssDir = path.join(NEXT_STATIC_DIR, 'css');
    let apiHubCssContent = `/* API Hub CSS - Generated ${new Date().toISOString()} */\n\n`;
    if (fs.existsSync(apiHubCssDir)) {
      const cssFiles = fs.readdirSync(apiHubCssDir).filter(file => file.endsWith('.css'));
      for (const file of cssFiles) {
        apiHubCssContent += fs.readFileSync(path.join(apiHubCssDir, file), 'utf-8') + '\n\n';
      }
    }
    fs.writeFileSync(OUTPUT_API_HUB_CSS_FILE, apiHubCssContent);
    console.log(`API Hub CSS bundled into ${OUTPUT_API_HUB_CSS_FILE}`);

    // Concatenate API Hub JS (heuristic)
    console.log('Concatenating API Hub JS files...');
    const apiHubChunksDir = path.join(NEXT_STATIC_DIR, 'chunks');
    let apiHubJsContent = `/* API Hub JS - Generated ${new Date().toISOString()} */\n`;
    apiHubJsContent += `console.log('API Hub bundle loading...');\n`;
    if (fs.existsSync(apiHubChunksDir)) {
      const jsFiles = fs.readdirSync(apiHubChunksDir).filter(file => file.endsWith('.js'));
      const orderedFiles = [
        ...jsFiles.filter(f => f.startsWith('webpack-')).sort(),
        ...jsFiles.filter(f => f.startsWith('framework-')).sort(),
        ...jsFiles.filter(f => f.startsWith('main-')).sort(),
        ...jsFiles.filter(f => f.startsWith('app-') || f.includes('pages/_app-')).sort(),
        ...jsFiles.filter(f => f.startsWith('pages-') && !f.includes('pages/_app-')).sort(),
        ...jsFiles.filter(f => !f.startsWith('webpack-') && !f.startsWith('framework-') && !f.startsWith('main-') && !f.startsWith('app-') && !f.startsWith('pages-')).sort()
      ];
      for (const file of orderedFiles) {
        apiHubJsContent += fs.readFileSync(path.join(apiHubChunksDir, file), 'utf-8') + '\n\n';
      }
    }
     const pagesJsDir = path.join(NEXT_STATIC_DIR, 'pages');
     if (fs.existsSync(pagesJsDir)) {
         const pageJsFiles = fs.readdirSync(pagesJsDir).filter(file => file.endsWith('.js') && file !== '_app.js' && file !== 'index.js' /* index.tsx main entry */);
         for (const file of pageJsFiles) {
            apiHubJsContent += fs.readFileSync(path.join(pagesJsDir, file), 'utf-8') + '\n\n';
        }
     }
    apiHubJsContent += `console.log('API Hub bundle loaded.');\n`;
    fs.writeFileSync(OUTPUT_API_HUB_JS_FILE, apiHubJsContent);
    console.log(`API Hub JS bundled into ${OUTPUT_API_HUB_JS_FILE}`);
    console.log('--- API Hub build finished ---');


    // --- Part 2: Build Core CMS Assets ---
    console.log('\n--- Building Core CMS Assets ---');

    // Concatenate and Minify CMS JS
    console.log('Concatenating and minifying CMS JS files...');
    let cmsJsCombinedContent = `/* Core CMS JS - Generated ${new Date().toISOString()} */\n\n`;
    for (const filePath of CMS_JS_FILES) {
      if (fs.existsSync(filePath)) {
        console.log(`  Adding CMS JS: ${path.basename(filePath)}`);
        cmsJsCombinedContent += fs.readFileSync(filePath, 'utf-8') + '\n\n';
      } else {
        console.warn(`  WARNING: CMS JS file not found: ${filePath}`);
      }
    }
    const terserResult = await Terser.minify(cmsJsCombinedContent);
    if (terserResult.error) {
      console.error('Terser minification failed:', terserResult.error);
      throw terserResult.error;
    }
    fs.writeFileSync(OUTPUT_CMS_JS_FILE, terserResult.code);
    console.log(`Core CMS JS bundled and minified into ${OUTPUT_CMS_JS_FILE}`);

    // Concatenate and Minify CMS CSS
    console.log('Concatenating and minifying CMS CSS files...');
    let cmsCssCombinedContent = `/* Core CMS CSS - Generated ${new Date().toISOString()} */\n\n`;
    for (const filePath of CMS_CSS_FILES) {
      if (fs.existsSync(filePath)) {
        console.log(`  Adding CMS CSS: ${path.basename(filePath)}`);
        cmsCssCombinedContent += fs.readFileSync(filePath, 'utf-8') + '\n\n';
      } else {
        console.warn(`  WARNING: CMS CSS file not found: ${filePath}`);
      }
    }
    // Use csso-cli via exec as direct API can be tricky with async/await
    const tempCssPath = path.join(PROJECT_ROOT, 'temp.cms.css');
    fs.writeFileSync(tempCssPath, cmsCssCombinedContent);

    try {
        execSync(`npx csso ${tempCssPath} -o ${OUTPUT_CMS_CSS_FILE}`, { stdio: 'inherit' });
        console.log(`Core CMS CSS bundled and minified into ${OUTPUT_CMS_CSS_FILE}`);
    } catch(cssError) {
        console.error('CSSO minification failed:', cssError);
        // As a fallback, write the unminified version
        fs.writeFileSync(OUTPUT_CMS_CSS_FILE, cmsCssCombinedContent);
        console.warn(`Wrote unminified CMS CSS to ${OUTPUT_CMS_CSS_FILE} due to csso error.`);
    } finally {
        fs.removeSync(tempCssPath); // Clean up temp file
    }
    console.log('--- Core CMS Assets build finished ---');

    console.log('\nFull project build process completed successfully!');

  } catch (error) {
    console.error('\nFull project build process failed:');
    console.error(error.message || error);
    if (error.stdout) console.error('STDOUT:', error.stdout.toString());
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
    process.exit(1);
  }
}

buildProject();
