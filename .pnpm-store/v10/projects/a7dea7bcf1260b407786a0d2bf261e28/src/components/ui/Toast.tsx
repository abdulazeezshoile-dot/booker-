'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type ToastTone = 'success' | 'error';
type ToastItem = { id: number; message: string; tone: ToastTone };
const ToastContext = createContext<{ show: (message: string, tone?: ToastTone) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4500);
  }, []);
  useEffect(() => {
    const onApiError = (event: Event) => show((event as CustomEvent<string>).detail || 'Something went wrong', 'error');
    window.addEventListener('bizrecord:api-error', onApiError);
    return () => window.removeEventListener('bizrecord:api-error', onApiError);
  }, [show]);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-[380px]">
        {items.map((item) => (
          <div key={item.id} role="status" className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-3 shadow-panel ${item.tone === 'success' ? 'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'border-rose-500/30 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100'}`}>
            {item.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
            <p className="flex-1 text-sm font-medium">{item.message}</p>
            <button onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))} className="rounded p-0.5" aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
