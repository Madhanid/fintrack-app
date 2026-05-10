"use client";
import React, {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'warning' | 'info' | 'alert';

export interface Toast {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {},
});

// ── Toast Item ────────────────────────────────────────────────────────────────
const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode; glow: string }> = {
  success: {
    bg: 'from-emerald-900/80 to-emerald-800/60',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
    icon: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
  },
  warning: {
    bg: 'from-amber-900/80 to-amber-800/60',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/20',
    icon: <AlertTriangle size={18} className="text-amber-400 shrink-0" />,
  },
  alert: {
    bg: 'from-rose-900/80 to-rose-800/60',
    border: 'border-rose-500/40',
    glow: 'shadow-rose-500/20',
    icon: <Zap size={18} className="text-rose-400 shrink-0" />,
  },
  info: {
    bg: 'from-blue-900/80 to-blue-800/60',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-500/20',
    icon: <Info size={18} className="text-blue-400 shrink-0" />,
  },
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const styles = variantStyles[toast.variant];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    const t = setTimeout(onRemove, duration);
    return () => clearTimeout(t);
  }, [duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`
        relative flex items-start gap-3 w-80 p-4 rounded-2xl
        bg-gradient-to-br ${styles.bg}
        border ${styles.border}
        shadow-xl ${styles.glow}
        backdrop-blur-md overflow-hidden
      `}
    >
      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 bg-current opacity-30`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />

      {styles.icon}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{toast.title}</p>
        <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 text-gray-500 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${counterRef.current++}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed top-24 right-6 z-[9999] flex flex-col gap-3"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
