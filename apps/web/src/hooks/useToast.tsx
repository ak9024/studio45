import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { Toast, ToastTitle, ToastDescription } from '@/components/ui/toast'

interface ToastMessage {
  id: string
  title?: string
  description: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = {
      id,
      duration: 5000,
      ...message,
    }

    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }

  const success = (message: string, title?: string) => {
    toast({ title, description: message, variant: 'success' })
  }

  const error = (message: string, title?: string) => {
    toast({ title: title || 'Error', description: message, variant: 'destructive' })
  }

  const warning = (message: string, title?: string) => {
    toast({ title: title || 'Warning', description: message, variant: 'warning' })
  }

  const value: ToastContextType = {
    toast,
    success,
    error,
    warning,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onClose={() => removeToast(toast.id)}
            className="w-96 animate-in slide-in-from-bottom-2"
          >
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}