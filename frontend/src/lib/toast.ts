type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  timestamp: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private idCounter = 0;

  private generateId(): string {
    return `toast-${++this.idCounter}-${Date.now()}`;
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(options: ToastOptions): string {
    const toast: Toast = {
      ...options,
      id: this.generateId(),
      timestamp: Date.now(),
      duration: options.duration || 5000,
    };

    this.toasts.push(toast);
    this.notify();

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, toast.duration);

    return toast.id;
  }

  remove(id: string) {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Convenience methods
  success(title: string, message?: string, duration?: number) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number) {
    return this.show({ type: 'error', title, message, duration: duration || 8000 });
  }

  info(title: string, message?: string, duration?: number) {
    return this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show({ type: 'warning', title, message, duration });
  }
}

export const toast = new ToastManager();
export type { Toast, ToastType };