class Notifier {
    constructor() {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.className = 'notification-container';
      document.body.appendChild(this.notificationContainer);
    }
  
    show(message, type = 'info', duration = 3000) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span class="notification-icon">${this.getIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <span class="notification-close">&times;</span>
      `;
      
      this.notificationContainer.appendChild(notification);
      
      // Auto-remove after duration
      const timer = setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, duration);
      
      // Manual close
      notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timer);
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      });
    }
  
    getIcon(type) {
      const icons = {
        success: '✓',
        error: '!',
        warning: '⚠',
        info: 'i',
        admin: '⚙'
      };
      return icons[type] || '';
    }
  }
  
  export default Notifier;