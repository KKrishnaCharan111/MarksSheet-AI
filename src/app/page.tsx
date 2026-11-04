'use client';

import React, { useState, useEffect } from 'react';
import {
  StudentScore,
  ExamTemplate,
  ExtractionResponse,
} from '@/types';
import {
  DEFAULT_TEMPLATES,
  getSavedTemplates,
  getActiveTemplateId,
  calculateSum,
  checkIfAbsent,
  validateUsn,
} from '@/lib/templates';
import { processInParallel, QueueTask } from '@/lib/queue';
import { extractMarksWithVision } from '@/lib/gemini';
import { Navbar } from '@/components/Navbar';
import { StepIndicator } from '@/components/StepIndicator';
import { UploadStep, PendingPageItem } from '@/components/UploadStep';
import { ReviewStep } from '@/components/ReviewStep';
import { ExportStep } from '@/components/ExportStep';
import { TemplateModal } from '@/components/TemplateModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [pages, setPages] = useState<PendingPageItem[]>([]);
  const [students, setStudents] = useState<StudentScore[]>([]);

  // Templates
  const [templates, setTemplates] = useState<ExamTemplate[]>(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState<ExamTemplate>(DEFAULT_TEMPLATES[0]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Extraction Queue State
  const [concurrency, setConcurrency] = useState<number>(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentProcessingText, setCurrentProcessingText] = useState('');
  const [reExtractingId, setReExtractingId] = useState<string | undefined>(undefined);

  // Initialize templates and dark mode on mount
  useEffect(() => {
    const saved = getSavedTemplates();
    setTemplates(saved);
    const activeId = getActiveTemplateId();
    const found = saved.find((t) => t.id === activeId) || saved[0];
    setActiveTemplate(found);

    const savedDark = localStorage.getItem('markssheet_ai_dark_mode') === 'true';
    setIsDarkMode(savedDark);
    if (savedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('markssheet_ai_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Run Batch Extraction directly in browser
  const handleStartExtraction = async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setCurrentProcessingText(`Preparing extraction queue (Concurrency: ${concurrency})...`);

    // Mark all pages as idle
    setPages((prev) => prev.map((p) => ({ ...p, status: 'idle' })));

    const extractedStudents: StudentScore[] = [];

    // Create parallel tasks
    const tasks: QueueTask<PendingPageItem, ExtractionResponse>[] = pages.map((page) => ({
      id: page.id,
      item: page,
      retries: 1,
      execute: async (item) => {
        setPages((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'extracting' } : p))
        );

        // Call Gemini Vision directly (works client-side & static export)
        return await extractMarksWithVision(item.dataUrl, 'image/jpeg', {
          questions: activeTemplate.questions,
          usnPattern: activeTemplate.usnPattern,
        });
      },
    }));

    // Process with concurrency pool
    const results = await processInParallel<PendingPageItem, ExtractionResponse>(
      tasks,
      concurrency,
      (prog) => {
        setProgressPercent(prog.percent);
        setCurrentProcessingText(
          `Extracting marks: ${prog.completed} of ${prog.total} complete (${prog.activeCount} running in parallel)...`
        );
      }
    );

    // Convert results to StudentScore array
    pages.forEach((page, index) => {
      const taskResult = results.get(page.id);
      if (taskResult?.result) {
        const raw = taskResult.result;
        const computed = calculateSum(raw.questions);
        const isAbsent = checkIfAbsent(raw.questions, raw.total);

        let totalMismatch = false;
        let totalMismatchReason: string | undefined = undefined;

        if (!isAbsent) {
          const writtenNum =
            typeof raw.total === 'number' ? raw.total : parseFloat(String(raw.total));
          if (!isNaN(writtenNum)) {
            totalMismatch = Math.abs(writtenNum - computed) > 0.05;
            if (totalMismatch) {
              totalMismatchReason = `Written total (${writtenNum}) ≠ Computed sum of questions (${computed})`;
            }
          }
        }

        const usnValid = validateUsn(raw.usn, activeTemplate.usnPattern);

        extractedStudents.push({
          id: page.id,
          pageNumber: page.pageNumber,
          fileName: page.sourceName,
          imageUrl: page.dataUrl,
          name: raw.name || `STUDENT ${index + 1}`,
          usn: raw.usn || '',
          questions: raw.questions,
          total: raw.total,
          computedTotal: computed,
          confidence: raw.confidence || 0.9,
          uncertain_fields: raw.uncertain_fields || [],
          totalMismatch,
          totalMismatchReason,
          usnValid,
          isAbsent,
          status: 'success',
        });

        // Mark page as completed
        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...p, status: 'completed' } : p))
        );
      } else {
        const errMsg = taskResult?.error?.message || 'Extraction failed';
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, status: 'error', errorMessage: errMsg } : p
          )
        );

        extractedStudents.push({
          id: page.id,
          pageNumber: page.pageNumber,
          fileName: page.sourceName,
          imageUrl: page.dataUrl,
          name: `UNKNOWN (PAGE ${page.pageNumber})`,
          usn: '',
          questions: activeTemplate.questions.map((q) => ({
            q_no: q.q_no,
            marks: 0,
            max_marks: q.max_marks,
          })),
          total: 0,
          computedTotal: 0,
          confidence: 0.1,
          uncertain_fields: ['AI extraction failed, please verify manually'],
          totalMismatch: false,
          usnValid: false,
          isAbsent: false,
          status: 'error',
          errorMessage: errMsg,
        });
      }
    });

    setStudents(extractedStudents);
    setIsProcessing(false);
    setCurrentProcessingText('');

    // Transition to Review step
    setCurrentStep(2);
  };

  // Re-extract single page
  const handleReExtractSinglePage = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.imageUrl) return;

    setReExtractingId(studentId);

    try {
      const raw = await extractMarksWithVision(student.imageUrl, 'image/jpeg', {
        questions: activeTemplate.questions,
        usnPattern: activeTemplate.usnPattern,
      });

      const computed = calculateSum(raw.questions);
      const isAbsent = checkIfAbsent(raw.questions, raw.total);

      let totalMismatch = false;
      let totalMismatchReason: string | undefined = undefined;

      if (!isAbsent) {
        const writtenNum =
          typeof raw.total === 'number' ? raw.total : parseFloat(String(raw.total));
        if (!isNaN(writtenNum)) {
          totalMismatch = Math.abs(writtenNum - computed) > 0.05;
          if (totalMismatch) {
            totalMismatchReason = `Written total (${writtenNum}) ≠ Computed sum (${computed})`;
          }
        }
      }

      const usnValid = validateUsn(raw.usn, activeTemplate.usnPattern);

      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            name: raw.name,
            usn: raw.usn,
            questions: raw.questions,
            total: raw.total,
            computedTotal: computed,
            confidence: raw.confidence,
            uncertain_fields: raw.uncertain_fields,
            totalMismatch,
            totalMismatchReason,
            usnValid,
            isAbsent,
            status: 'success',
            errorMessage: undefined,
          };
        })
      );
    } catch (err: any) {
      alert(`Could not re-extract page: ${err.message}`);
    } finally {
      setReExtractingId(undefined);
    }
  };

  const handleResetBatch = () => {
    if (confirm('Start a new batch? This will clear all uploaded pages and extracted scores.')) {
      setPages([]);
      setStudents([]);
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentStep={currentStep}
        template={activeTemplate}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onResetBatch={handleResetBatch}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        totalStudents={students.length}
      />

      {/* 3-Step Wizard Indicator */}
      <StepIndicator
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        canNavigateToReview={students.length > 0}
        canNavigateToExport={students.length > 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <UploadStep
            template={activeTemplate}
            pages={pages}
            setPages={setPages}
            isProcessing={isProcessing}
            progressPercent={progressPercent}
            currentProcessingText={currentProcessingText}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            onStartExtraction={handleStartExtraction}
          />
        )}

        {currentStep === 2 && (
          <ReviewStep
            students={students}
            setStudents={setStudents}
            template={activeTemplate}
            onProceedToExport={() => setCurrentStep(3)}
            onReExtractSinglePage={handleReExtractSinglePage}
            reExtractingId={reExtractingId}
          />
        )}

        {currentStep === 3 && (
          <ExportStep
            students={students}
            template={activeTemplate}
            onBackToReview={() => setCurrentStep(2)}
          />
        )}
      </main>

      {/* Template Settings Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        setTemplates={setTemplates}
        activeTemplate={activeTemplate}
        setActiveTemplate={setActiveTemplate}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MarksSheet AI • Intelligent Exam OCR & Excel Exporter</span>
          <span className="text-slate-400">Processed locally in browser & direct Gemini Vision API</span>
        </div>
      </footer>
    </div>
  );
}
