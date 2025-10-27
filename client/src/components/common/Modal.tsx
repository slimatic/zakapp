import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Accessible Modal Dialog Component using Radix UI
 * 
 * Features:
 * - Focus trapping (focus stays within modal when open)
 * - Escape key to close
 * - ARIA labels and descriptions
 * - Restore focus on close
 * - Keyboard navigation
 * - Screen reader announcements
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto p-6 data-[state=open]:animate-fade-in focus:outline-none`}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Dialog.Title id="modal-title" className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </Dialog.Title>
          
          <div id="modal-description">
            {children}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-600 rounded-full p-1"
              aria-label="Close dialog"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
