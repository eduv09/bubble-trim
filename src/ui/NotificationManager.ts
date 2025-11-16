/**
 * NotificationManager - Displays temporary notifications to the user
 */
export class NotificationManager {
    private static instance: NotificationManager;
    private container: HTMLElement | null = null;

    private constructor() {
        this.createContainer();
    }

    /**
     * Gets the singleton instance
     */
    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Creates the notification container
     */
    private createContainer(): void {
        let container = document.getElementById('notification-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        this.container = container;
    }

    /**
     * Shows a notification message
     * @param message - The message to display
     * @param type - The type of notification (info, warning, error)
     * @param duration - How long to show the notification in milliseconds
     */
    show(message: string, type: 'info' | 'warning' | 'error' = 'info', duration: number = 5000): void {
        if (!this.container) {
            this.createContainer();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        this.container!.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Shows an offline/upload failed message
     * @param message - Custom message or default
     */
    showOfflineMessage(message?: string): void {
        this.show(
            message || 'You are offline. Game data was not uploaded.',
            'warning',
            5000
        );
    }
}
