/**
 * useToast — notificaciones efímeras con soporte para undo inline.
 */

import { useState, useCallback, useRef } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warn';

export interface Toast {
  id: string;
  msg: string;
  type: ToastType;
  duration: number;
}

let _counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t !== undefined) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (msg: string, type: ToastType = 'info', duration = 3000): string => {
      const id = `toast-${++_counter}`;
      const toast: Toast = { id, msg, type, duration };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}
