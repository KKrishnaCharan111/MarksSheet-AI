'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Camera,
  Play,
  Trash2,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { ExamTemplate } from '@/types';
import { renderPdfToImages, readImageAsDataUrl } from '@/lib/pdf';
import { SAMPLE_SHEETS_DATA, createSampleScoreSheetImage } from '@/lib/sampleSheets';

export interface PendingPageItem {
  id: string;
  sourceName: string;
  pageNumber: number;
  totalPages: number;
  dataUrl: string;
  status: 'idle' | 'extracting' | 'completed' | 'error';
  errorMessage?: string;
}

interface UploadStepProps {
  template: ExamTemplate;
  pages: PendingPageItem[];
  setPages: React.Dispatch<React.SetStateAction<PendingPageItem[]>>;
  isProcessing: boolean;
  progressPercent: number;
  currentProcessingText: string;
  concurrency: number;
  setConcurrency: (c: number) => void;
  onStartExtraction: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  template,
  pages,
  setPages,
  isProcessing,
  progressPercent,
  currentProcessingText,
  concurrency,
  setConcurrency,
  onStartExtraction,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [readingStatus, setReadingStatus] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsReadingFiles(true);
    setReadingStatus('Loading selected files...');

    const newPages: PendingPageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      try {
        if (isPdf) {
          setReadingStatus(`Rendering PDF pages: ${file.name}...`);
          const rendered = await renderPdfToImages(file, (curr, total) => {
            setReadingStatus(`Rendering ${file.name} (page ${curr} of ${total})...`);
          });

          rendered.forEach((p) => {
            newPages.push({
              id: `${file.name}-p${p.pageNumber}-${Date.now()}-${Math.random()}`,
              sourceName: file.name,
              pageNumber: p.pageNumber,
              totalPages: rendered.length,
              dataUrl: p.dataUrl,
              status: 'idle',
            });
          });
        } else {
          // Image file
          setReadingStatus(`Reading image: ${file.name}...`);
          const dataUrl = await readImageAsDataUrl(file);
          newPages.push({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            sourceName: file.name,
            pageNumber: 1,
            totalPages: 1,
            dataUrl,
            status: 'idle',
          });
        }
      } catch (err: any) {
        console.error('Failed to process file:', file.name, err);
        alert(`Could not read file ${file.name}: ${err?.message || 'Unsupported format'}`);
      }
    }

    setPages((prev) => [...prev, ...newPages]);
    setIsReadingFiles(false);
    setReadingStatus('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleLoadSampleSheets = () => {
    setIsReadingFiles(true);
    setReadingStatus('Generating realistic test score sheets...');

    setTimeout(() => {
      const samplePages: PendingPageItem[] = SAMPLE_SHEETS_DATA.map((s, idx) => {
        const dataUrl = createSampleScoreSheetImage(s);
        return {
          id: `sample-${s.usn}-${idx}`,
          sourceName: `Sample_${s.name.replace(/\s+/g, '_')}.jpg`,
          pageNumber: idx + 1,
          totalPages: SAMPLE_SHEETS_DATA.length,
          dataUrl,
          status: 'idle',
        };
      });

      setPages((prev) => [...prev, ...samplePages]);
      setIsReadingFiles(false);
      setReadingStatus('');
    }, 150);
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Clear all uploaded pages?')) {
      setPages([]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Zero-Retention Privacy Guarantee:</span> Answer sheet scans
          are processed directly in-memory and transient API vision calls. No student names, marks,
          or answer sheets are permanently stored or logged on any server.
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/jpeg,image/png,image/webp,image/heic,.heic"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Drag & Drop student score sheets here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Multi-page PDF files, separate student PDFs, or photos (JPG, PNG, WebP). Each page is
              automatically isolated and processed.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition"
            >
              <FileText className="w-4 h-4" />
              Browse Files (PDF / Images)
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              Take Photo with Camera
            </button>

            <button
              type="button"
              onClick={handleLoadSampleSheets}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 font-semibold text-sm transition"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Load Sample Score Sheets
            </button>
          </div>
        </div>

        {/* Loading overlay while reading PDF */}
        {isReadingFiles && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center gap-2 z-10 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{readingStatus}</p>
          </div>
        )}
      </div>

      {/* Pages Preview & Queue Section */}
      {pages.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Score Sheets Ready for Extraction ({pages.length} page
                {pages.length === 1 ? '' : 's'})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exam Template: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{template.name}</span>{' '}
                ({template.questions.length} questions, {template.maxTotalMarks} marks max)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Concurrency Selector */}
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>Parallel Pages:</span>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  disabled={isProcessing}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 at a time</option>
                  <option value={3}>3 at a time (Recommended)</option>
                  <option value={4}>4 at a time</option>
                  <option value={5}>5 at a time (Fast)</option>
                </select>
              </div>

              {!isProcessing && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar (Visible during processing) */}
          {isProcessing && (
            <div className="space-y-2 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {currentProcessingText || 'Extracting marks with Vision AI...'}
                </span>
                <span className="text-indigo-900 dark:text-indigo-200">{progressPercent}%</span>
              </div>
              <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid of thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className={`group relative rounded-xl border overflow-hidden transition-all bg-slate-50 dark:bg-slate-800/50 ${
                  p.status === 'extracting'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : p.status === 'completed'
                    ? 'border-emerald-500/60'
                    : p.status === 'error'
                    ? 'border-red-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {/* Thumbnail image */}
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <img
                    src={p.dataUrl}
                    alt={p.sourceName}
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Status Overlay */}
                  {p.status === 'extracting' && (
                    <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Extracting...</span>
                    </div>
                  )}

                  {p.status === 'completed' && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {p.status === 'error' && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow" title={p.errorMessage}>
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Remove button (when idle) */}
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() => handleRemovePage(p.id)}
                      className="absolute top-2 left-2 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow"
                      title="Remove page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-2 text-[11px] space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {p.sourceName}
                  </div>
                  <div className="text-slate-400 dark:text-slate-500">
                    Page {p.pageNumber} {p.totalPages > 1 ? `of ${p.totalPages}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Each page will be analyzed for student Name, USN, question-wise marks, and grand total.
            </span>

            <button
              type="button"
              disabled={isProcessing || pages.length === 0}
              onClick={onStartExtraction}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition ${
                isProcessing || pages.length === 0
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Start AI Extraction ({pages.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
