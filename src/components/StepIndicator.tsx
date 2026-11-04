'use client';

import React from 'react';
import { Upload, CheckCircle2, Download, ChevronRight } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  canNavigateToReview: boolean;
  canNavigateToExport: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onSelectStep,
  canNavigateToReview,
  canNavigateToExport,
}) => {
  const steps = [
    { id: 1, label: '1. Upload & Extract', icon: Upload, enabled: true },
    { id: 2, label: '2. Review & Verify', icon: CheckCircle2, enabled: canNavigateToReview },
    { id: 3, label: '3. Analytics & Export', icon: Download, enabled: canNavigateToExport },
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between sm:justify-center sm:gap-6">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            const isClickable = s.enabled;

            return (
              <React.Fragment key={s.id}>
                <button
                  disabled={!isClickable}
                  onClick={() => onSelectStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                      : isCompleted
                      ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                      : isClickable
                      ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{s.label}</span>
                </button>

                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
