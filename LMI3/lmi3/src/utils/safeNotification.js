// Wrapper around the browser Notification API with graceful degradation
// Provides: isSupported(), requestPermission(), show(title, options)
// Automatically logs reasons if not shown.

import { clientLogger } from './clientLogger';

export const safeNotification = {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },
  permission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },
  async requestPermission() {
    if (!this.isSupported()) {
      clientLogger.warn('Notification API not supported', { api: false });
      return 'unsupported';
    }
    if (Notification.permission !== 'default') return Notification.permission;
    try {
      const perm = await Notification.requestPermission();
      clientLogger.info('Notification permission result', { perm });
      return perm;
    } catch (e) {
      clientLogger.error('Notification permission error', { message: e.message });
      return 'error';
    }
  },
  show(title, options = {}) {
    if (!this.isSupported()) {
      clientLogger.warn('Notification show skipped - unsupported');
      return null;
    }
    if (Notification.permission !== 'granted') {
      clientLogger.info('Notification show skipped - permission not granted', { perm: Notification.permission });
      return null;
    }
    try {
      const n = new Notification(title, options);
      clientLogger.debug('Notification displayed', { title, tag: options.tag });
      return n;
    } catch (e) {
      clientLogger.error('Notification show error', { message: e.message });
      return null;
    }
  }
};
