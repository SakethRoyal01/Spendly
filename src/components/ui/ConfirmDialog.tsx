import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
            isDestructive
              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
              : 'bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
        </div>

        <h3 className="font-journal text-lg font-normal text-[var(--text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
