import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = React.memo(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`bg-white rounded-3xl p-8 w-full ${sizeClasses[size]} relative max-h-[90vh] overflow-y-auto`}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="モーダルを閉じる"
              >
                <MdClose className="text-2xl" />
              </button>
            )}
            
            <h2 id="modal-title" className="text-2xl font-bold mb-4">{title}</h2>
            
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

export default Modal;
