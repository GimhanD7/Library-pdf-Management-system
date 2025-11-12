import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types/page-props';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastStyles = {
  success: 'bg-green-100 border-green-500 text-green-700',
  error: 'bg-red-100 border-red-500 text-red-700',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  info: 'bg-blue-100 border-blue-500 text-blue-700',
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border-l-4 ${toastStyles[type]} shadow-lg z-50`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { flash } = usePage<PageProps>().props;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');

  useEffect(() => {
    if (flash) {
      // Handle array of flash messages
      if (Array.isArray(flash)) {
        const lastFlash = flash[flash.length - 1];
        if (lastFlash?.message) {
          setToastMessage(lastFlash.message);
          setToastType((lastFlash.type as ToastType) || 'info');
          setShowToast(true);
        }
      } 
      // Handle single flash message object
      else if (typeof flash === 'object' && flash.message) {
        setToastMessage(flash.message);
        setToastType((flash.type as ToastType) || 'info');
        setShowToast(true);
      }

      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [flash]);

  if (!showToast) return null;

  return (
    <Toast
      message={toastMessage}
      type={toastType}
      onClose={() => setShowToast(false)}
    />
  );
}
