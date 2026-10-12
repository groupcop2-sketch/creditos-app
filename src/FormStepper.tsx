import React, { useState, useEffect } from 'react';

export interface StepItem {
  id: string | number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  isValid?: boolean;
}

interface FormStepperProps {
  steps: StepItem[];
  submitButtonText?: string;
  submitButtonDisabled?: boolean;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
  showSubmitAlways?: boolean;
  extraHeaderActions?: React.ReactNode;
  validateBeforeNext?: boolean;
  onCancel?: () => void;
  extraFooterActions?: React.ReactNode;
}

export function FormStepper({
  steps,
  submitButtonText = 'Guardar',
  submitButtonDisabled = false,
  onStepChange,
  className = '',
  showSubmitAlways = false,
  extraHeaderActions,
  validateBeforeNext = false,
  onCancel,
  extraFooterActions
}: FormStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  if (!steps || steps.length === 0) return null;

  // Reset to initial step if currentStep is out of bounds
  const activeIndex = Math.min(currentStep, steps.length - 1);
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === steps.length - 1;
  const progressPercent = Math.round(((activeIndex + 1) / steps.length) * 100);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateBeforeNext && !e.currentTarget.closest('form')?.reportValidity()) return;
    if (!isLastStep) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isFirstStep) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleStepClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (validateBeforeNext && index > activeIndex && !event.currentTarget.closest('form')?.reportValidity()) return;
    setCurrentStep(index);
  };

  return (
    <div className={`form-stepper-container ${className}`}>
      {/* Header bar with step indicators */}
      <div className="stepper-header">
        <div className="stepper-progress-bar">
          <div className="stepper-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="stepper-steps">
          {steps.map((step, idx) => {
            const isActive = idx === activeIndex;
            const isCompleted = idx < activeIndex;
            return (
              <button
                key={step.id || idx}
                type="button"
                className={`stepper-step-badge ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={(event) => handleStepClick(idx, event)}
                disabled={validateBeforeNext && submitButtonDisabled}
                title={step.title}
              >
                <div className="step-number">
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="step-labels">
                  <span className="step-title">{step.title}</span>
                  {step.subtitle && <span className="step-subtitle">{step.subtitle}</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="stepper-meta">
          <span>Paso {activeIndex + 1} de {steps.length} — {steps[activeIndex]?.title}</span>
          {extraHeaderActions && <div className="stepper-extra-header">{extraHeaderActions}</div>}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="stepper-content">
        {steps[activeIndex]?.content}
      </div>

      {/* Navigation Footer Controls */}
      <div className="stepper-actions">
        <button
          type="button"
          className="stepper-btn stepper-btn-prev"
          onClick={isFirstStep && onCancel ? onCancel : handlePrev}
          disabled={(isFirstStep && !onCancel) || (validateBeforeNext && submitButtonDisabled)}
        >
          {isFirstStep && onCancel ? 'Cancelar' : '← Anterior'}
        </button>

        <div className="stepper-actions-right">
          {extraFooterActions}
          {!isLastStep && (
            <button
              type="button"
              className="stepper-btn stepper-btn-next"
              onClick={handleNext}
              disabled={validateBeforeNext && submitButtonDisabled}
            >
              Siguiente →
            </button>
          )}

          {(isLastStep || showSubmitAlways) && (
            <button
              type="submit"
              className="stepper-btn stepper-btn-submit"
              disabled={submitButtonDisabled}
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
