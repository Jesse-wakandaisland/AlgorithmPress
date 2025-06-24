<?php
/*
Plugin Name: NARA Data Integration
Description: A plugin to sync and manage NARA data via Custom Post Types (CPT).
Version: 1.2
Author: ConvoBuilder CMS + AlgorithmPress = ConvoBuilder OS
*/

// Prevent direct access
defined('ABSPATH') or die('No script kiddies please!');

// Register Custom Post Type for NARA Data
function nara_register_post_type() {
    $args = array(
        'public' => true,
        'label'  => 'NARA Data',
        'supports' => array('title', 'editor', 'custom-fields'),
        'menu_icon' => 'dashicons-admin-generic',
        'rewrite'   => array('slug' => 'nara-data'),
    );
    register_post_type('nara_data', $args);
}
add_action('init', 'nara_register_post_type');

// Save or Update Data as Custom Post Type
function nara_save_or_update_data_as_post($data) {
    $existing_posts = get_posts(array(
        'post_type'  => 'nara_data',
        'meta_key'   => 'nara_api_url',
        'meta_value' => $data['url'],
        'post_status'=> 'publish',
        'fields'     => 'ids'
    ));

    if (!empty($existing_posts)) {
        $post_id = $existing_posts[0];
        $post_data = array(
            'ID'          => $post_id,
            'post_title'  => sanitize_text_field($data['title']),
            'post_content'=> sanitize_text_field($data['content']),
        );
        wp_update_post($post_data);
        update_post_meta($post_id, 'nara_api_url', sanitize_text_field($data['url']));
        update_post_meta($post_id, 'nara_dom_selector', sanitize_text_field($data['selector']));
    } else {
        $post_data = array(
            'post_title'  => sanitize_text_field($data['title']),
            'post_content'=> sanitize_text_field($data['content']),
            'post_type'   => 'nara_data',
            'post_status' => 'publish',
        );
        $post_id = wp_insert_post($post_data);

        if ($post_id) {
            update_post_meta($post_id, 'nara_api_url', sanitize_text_field($data['url']));
            update_post_meta($post_id, 'nara_dom_selector', sanitize_text_field($data['selector']));
        }
    }
}

// Hook into the 'save_post' action to trigger synchronization
function nara_trigger_sync_on_save($post_id) {
    if (get_post_type($post_id) === 'nara_data' && !wp_is_post_revision($post_id)) {
        nara_sync_cpt_to_settings();
    }
}
add_action('save_post', 'nara_trigger_sync_on_save');

// Synchronize CPT data with NARA settings
function nara_sync_cpt_to_settings() {
    $args = array(
        'post_type' => 'nara_data',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );

    $query = new WP_Query($args);
    $settings = array();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $url = get_post_meta(get_the_ID(), 'nara_api_url', true);
            $selector = get_post_meta(get_the_ID(), 'nara_dom_selector', true);

            $settings['nara_api_endpoints'][] = array(
                'url'     => $url,
                'selector'=> $selector,
            );
        }
        update_option('nara_settings', array('nara_api_endpoints' => $settings['nara_api_endpoints']));
    }

    wp_reset_postdata();
}

// Add custom cron schedule for every minute (Consider making this configurable)
function custom_cron_schedules_nara($schedules) { // Renamed to avoid conflicts
    // Default to hourly, can be overridden by other plugins or settings if needed.
    if (!isset($schedules['hourly'])) {
        $schedules['hourly'] = array(
            'interval' => 3600,
            'display'  => __('Once Hourly')
        );
    }
    // Example for a more frequent schedule if needed, but default to less frequent.
    // $schedules['every_five_minutes'] = array(
    //     'interval' => 300,
    //     'display'  => __('Every Five Minutes')
    // );
    return $schedules;
}
add_filter('cron_schedules', 'custom_cron_schedules_nara');

// Schedule the cron job if not already scheduled
// TODO: Make the schedule interval configurable via plugin settings. Defaulting to 'hourly'.
if (!wp_next_scheduled('nara_sync_cron_event')) {
    wp_schedule_event(time(), 'hourly', 'nara_sync_cron_event');
}

// Define the function to run for syncing from Google Sheets
function nara_sync_from_google_sheets() {
    // Update sync status to active
    update_option('nara_sync_status', 'active');
    
    $options = get_option('nara_data_integration_settings');
    $csv_url = isset($options['google_sheet_url']) ? $options['google_sheet_url'] : '';

    if (empty($csv_url)) {
        error_log('NARA Data Integration: Google Sheet URL is not configured. Sync aborted.');
        update_option('nara_sync_status', 'idle');
        // Optionally, add an admin notice here if this is a manually triggered sync context
        // For cron, error_log is appropriate.
        return;
    }
    
    $response = wp_remote_get($csv_url);

    if (is_wp_error($response)) {
        error_log('Error fetching CSV: ' . $response->get_error_message());
        update_option('nara_sync_status', 'idle');
        return;
    }

    $csv_data = wp_remote_retrieve_body($response);
    if (empty($csv_data)) {
        error_log('No data received from CSV URL.');
        update_option('nara_sync_status', 'idle');
        return;
    }

    $lines = explode("\n", $csv_data);
    if (empty($lines)) {
        error_log('CSV data is empty.');
        update_option('nara_sync_status', 'idle');
        return;
    }

    foreach ($lines as $index => $line) {
        if ($index === 0) continue; // Skip header row
        $row = str_getcsv($line);

        if (count($row) >= 2) {
            $data = array(
                'title'   => sanitize_text_field($row[0]),
                'content' => 'Auto-generated content for ' . sanitize_text_field($row[0]),
                'url'     => sanitize_text_field($row[0]),
                'selector'=> sanitize_text_field(isset($row[1]) ? $row[1] : ''),
            );
            nara_save_or_update_data_as_post($data);
        }
    }

    // Update sync status to idle when done
    update_option('nara_sync_status', 'idle');
}

// Hook the sync function to the cron event
add_action('nara_sync_cron_event', 'nara_sync_from_google_sheets');

// Add sync button to admin bar
function nara_add_sync_button_to_admin_bar($wp_admin_bar) {
    $args = array(
        'id'    => 'nara_sync_status',
        'title' => '<span class="ab-icon dashicons dashicons-update"></span><span class="ab-label">NARA Sync</span>',
        'href'  => '#',
        'meta'  => array(
            'class' => 'nara-sync-idle',
            'title' => 'NARA Sync Status'
        )
    );
    $wp_admin_bar->add_node($args);
}
add_action('admin_bar_menu', 'nara_add_sync_button_to_admin_bar', 100);

// Add styles for the admin bar button
function nara_add_admin_bar_styles() {
    echo '
    <style>
        #wp-admin-bar-nara_sync_status .ab-icon {
            float: left;
            width: 20px;
            height: 30px;
            margin-right: 5px;
        }
        #wp-admin-bar-nara_sync_status.nara-sync-idle .ab-icon {
            color: #888;
        }
        #wp-admin-bar-nara_sync_status.nara-sync-active .ab-icon {
            color: #00a0d2;
            animation: nara-spin 2s linear infinite;
        }
        @keyframes nara-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>';
}
add_action('admin_head', 'nara_add_admin_bar_styles');
add_action('wp_head', 'nara_add_admin_bar_styles');

// AJAX handler to update sync status
function nara_update_sync_status() {
    $status = get_option('nara_sync_status', 'idle');
    wp_send_json_success(array('status' => $status));
}
add_action('wp_ajax_nara_update_sync_status', 'nara_update_sync_status');

// Add JavaScript to periodically check sync status
function nara_add_admin_bar_script() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        function updateSyncStatus() {
            $.ajax({
                url: ajaxurl,
                data: { action: 'nara_update_sync_status' },
                success: function(response) {
                    if (response.success) {
                        $('#wp-admin-bar-nara_sync_status')
                            .removeClass('nara-sync-idle nara-sync-active')
                            .addClass('nara-sync-' + response.data.status);
                    }
                }
            });
        }

        // Check status every 5 seconds
        setInterval(updateSyncStatus, 5000);
    });
    </script>
    <?php
}
add_action('admin_footer', 'nara_add_admin_bar_script');

// Activation hook
function nara_plugin_activate() {
    nara_register_post_type();
    nara_sync_from_google_sheets();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'nara_plugin_activate');

// Deactivation hook
function nara_clear_cron() {
    wp_clear_scheduled_hook('nara_sync_cron_event');
}
register_deactivation_hook(__FILE__, 'nara_clear_cron');

// Admin Menu and Settings Page
add_action('admin_menu', 'nara_data_integration_add_admin_menu');
function nara_data_integration_add_admin_menu() {
    add_options_page(
        'NARA Data Integration Settings',
        'NARA Data Sync',
        'manage_options',
        'nara-data-integration',
        'nara_data_integration_settings_page'
    );
}

add_action('admin_init', 'nara_data_integration_settings_init');
function nara_data_integration_settings_init() {
    register_setting(
        'nara_data_integration_settings_group', // Option group
        'nara_data_integration_settings',       // Option name
        'nara_data_integration_settings_sanitize' // Sanitization callback
    );

    add_settings_section(
        'nara_data_integration_section_main', // ID
        'Google Sheet Configuration',         // Title
        'nara_data_integration_section_main_callback', // Callback
        'nara-data-integration'               // Page
    );

    add_settings_field(
        'google_sheet_url',                     // ID
        'Google Sheet CSV URL',                 // Title
        'nara_data_integration_google_sheet_url_render', // Callback
        'nara-data-integration',                // Page
        'nara_data_integration_section_main'  // Section
    );
}

function nara_data_integration_settings_sanitize($input) {
    $sanitized_input = array();
    if (isset($input['google_sheet_url'])) {
        $sanitized_input['google_sheet_url'] = esc_url_raw(trim($input['google_sheet_url']));
        // Basic validation: check if it looks like a URL and contains 'docs.google.com' and 'pub?output=csv'
        if (!empty($sanitized_input['google_sheet_url']) && 
            (!filter_var($sanitized_input['google_sheet_url'], FILTER_VALIDATE_URL) ||
             strpos($sanitized_input['google_sheet_url'], 'docs.google.com') === false ||
             strpos($sanitized_input['google_sheet_url'], 'pub?output=csv') === false)) {
            add_settings_error(
                'google_sheet_url',
                'invalid_google_sheet_url',
                'The provided URL does not seem to be a valid Google Sheet "Publish to the web" CSV URL. Please check the format.',
                'error'
            );
            // Return old value if new one is invalid to prevent saving bad URL
            $options = get_option('nara_data_integration_settings');
            return isset($options['google_sheet_url']) ? $options : array('google_sheet_url' => ''); 
        }
    }
    return $sanitized_input;
}

function nara_data_integration_section_main_callback() {
    echo '<p>Configure the settings for the NARA Data Integration plugin. Ensure the Google Sheet is published to the web as a CSV file.</p>';
    echo '<p><strong>Instructions for Google Sheets:</strong></p>';
    echo '<ol>';
    echo '<li>Open your Google Sheet.</li>';
    echo '<li>Go to "File" > "Share" > "Publish to web".</li>';
    echo '<li>In the "Link" tab, select the specific sheet you want to publish.</li>';
    echo '<li>Choose "Comma-separated values (.csv)" as the format.</li>';
    echo '<li>Click "Publish".</li>';
    echo '<li>Copy the generated URL and paste it into the field below.</li>';
    echo '</ol>';
}

function nara_data_integration_google_sheet_url_render() {
    $options = get_option('nara_data_integration_settings');
    $url = isset($options['google_sheet_url']) ? $options['google_sheet_url'] : '';
    ?>
    <input type='text' name='nara_data_integration_settings[google_sheet_url]' value='<?php echo esc_attr($url); ?>' class='regular-text'>
    <p class="description">Enter the full URL of the Google Sheet published as a CSV file.</p>
    <?php
}

function nara_data_integration_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields('nara_data_integration_settings_group');
            do_settings_sections('nara-data-integration');
            submit_button('Save Settings');
            ?>
        </form>
    </div>
    <?php
}
?>
