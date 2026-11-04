'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Moon,
  Sun,
  Settings,
  Sparkles,
  RotateCcw,
  Key,
} from 'lucide-react';
import { ExamTemplate } from '@/types';

interface NavbarProps {
  currentStep: number;
  template: ExamTemplate;
  onOpenTemplateModal: () => void;
  onOpenApiKeyModal: () => void;
  onResetBatch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  template,
  onOpenTemplateModal,
  onOpenApiKeyModal,
  onResetBatch,
  isDarkMode,
  onToggleDarkMode,
  totalStudents,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
                MarksSheet AI
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Answer Sheet Marks Extraction & Excel Export
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">API Key</span>
          </button>

          {/* Active Template Badge & Button */}
          <button
            onClick={onOpenTemplateModal}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Configure Exam Template & Layout"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline font-semibold text-slate-500 dark:text-slate-400">Template:</span>
            <span className="truncate max-w-[120px] sm:max-w-[170px] font-semibold">{template.name}</span>
          </button>

          {/* Reset Batch (if students exist) */}
          {totalStudents > 0 && (
            <button
              onClick={onResetBatch}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
              title="Reset Batch & Start New"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
