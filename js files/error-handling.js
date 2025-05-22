// Global Error Handling and Toast Notification System for AlgorithmPress

(function() {
    'use strict';

    // Function to inject styles for toasts
    function injectToastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toast {
                padding: 15px 20px;
                border-radius: 5px;
                color: #fff;
                font-family: Arial, sans-serif;
                font-size: 14px;
                opacity: 0.9;
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                transform: translateX(100%); /* Start off-screen */
            }
            .toast.show {
                transform: translateX(0); /* Slide in */
            }
            .toast.success {
                background-color: #28a745; /* Green */
            }
            .toast.error {
                background-color: #dc3545; /* Red */
            }
            .toast.warning {
                background-color: #ffc107; /* Yellow */
                color: #333;
            }
            .toast.info {
                background-color: #17a2b8; /* Blue */
            }
        `;
        document.head.appendChild(style);
    }

    // Create a container for toasts if it doesn't exist
    let toastContainer = document.getElementById('toast-container-main');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-main';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    /**
     * Displays a toast notification.
     * @param {string} message - The message to display.
     * @param {string} [type='info'] - Type of toast: 'success', 'error', 'warning', 'info'.
     * @param {number} [duration=3000] - Duration in milliseconds for the toast to be visible.
     */
    function showToast(message, type = 'info', duration = 3000) {
        if (!['success', 'error', 'warning', 'info'].includes(type)) {
            type = 'info';
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger the slide-in animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Small delay to allow CSS transition to catch the change

        // Remove the toast after the specified duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)'; // Slide out
            setTimeout(() => {
                if (toast.parentElement === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300); // Allow time for slide-out animation
        }, duration);
    }

    /**
     * Global error handler.
     * Displays an error message using the toast notification system.
     * @param {Error|string} error - The error object or error message string.
     * @param {string} [context=''] - Additional context about the error.
     */
    function handleError(error, context = '') {
        let errorMessage = 'An unexpected error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        const fullMessage = context ? `Error: ${errorMessage} (Context: ${context})` : `Error: ${errorMessage}`;
        console.error(fullMessage, error); // Also log to console for developers
        showToast(fullMessage, 'error', 5000); // Show error toasts for a bit longer
    }

    // Expose showToast and handleError to the global scope
    window.showToast = showToast;
    window.AP = window.AP || {}; // AlgorithmPress global namespace
    window.AP.handleError = handleError;
    window.AP.showToast = showToast; // Also placing it under AP namespace for consistency

    // Inject styles once the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToastStyles);
    } else {
        injectToastStyles();
    }

    console.log('Error handling module loaded. Use window.showToast(message, type) or window.AP.handleError(error, context).');

})();
