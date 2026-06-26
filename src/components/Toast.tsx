import type { ToastMessage } from '../types/game';

interface ToastProps {
  toasts: ToastMessage[];
}

export function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
