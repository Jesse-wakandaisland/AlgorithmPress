<?php
add_action('wp_ajax_nara_get_data', 'nara_get_data');
// add_action('wp_ajax_nopriv_nara_get_data', 'nara_get_data'); // Removed for public access restriction

function nara_get_data() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Permission denied. You do not have sufficient privileges to perform this action.'), 403);
        wp_die(); // this is required to terminate immediately and return a proper response
    }

    $options = get_option('nara_settings');
    $endpoints = isset($options['nara_api_endpoints']) ? $options['nara_api_endpoints'] : [];

    if (empty($endpoints)) {
        wp_send_json_error('No endpoints configured');
    }

    $responses = [];

    foreach ($endpoints as $endpoint) {
        $api_url = esc_url($endpoint['url']);
        $response = wp_remote_get($api_url);

        if (is_wp_error($response)) {
            $responses[] = ['url' => $api_url, 'error' => $response->get_error_message()];
        } else {
            $responses[] = ['url' => $api_url, 'data' => wp_remote_retrieve_body($response)];
        }
    }

    wp_send_json_success($responses);
}
