import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type FeedbackTone = 'error' | 'success' | 'info';

type FeedbackAlertProps = {
  message: string;
  tone?: FeedbackTone;
  onDismiss?: () => void;
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info
};

export function FeedbackAlert({ message, tone = 'info', onDismiss }: FeedbackAlertProps) {
  if (!message) {
    return null;
  }

  const Icon = icons[tone];

  return (
    <div
      className={`feedback-alert feedback-alert-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Icon size={18} aria-hidden />
      <p>{message}</p>
      {onDismiss ? (
        <button type="button" className="feedback-alert-dismiss" onClick={onDismiss} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
