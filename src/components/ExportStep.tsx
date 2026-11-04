'use client';

import React, { useState } from 'react';
import {
  StudentScore,
  ExamTemplate,
} from '@/types';
import {
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react';
import { generateMarksSheetWorkbook, downloadBlob } from '@/lib/excel';

interface ExportStepProps {
  students: StudentScore[];
  template: ExamTemplate;
  onBackToReview: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  students,
  template,
  onBackToReview,
}) => {
  const [sortBy, setSortBy] = useState<'usn' | 'name' | 'slno'>('usn');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);

  // Compute stats
  const totalStudents = students.length;
  const presentStudents = students.filter((s) => !s.isAbsent);
  const absentCount = totalStudents - presentStudents.length;

  const validScores = presentStudents.map((s) => s.computedTotal);
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const topScorer = students.find((s) => s.computedTotal === highestScore && !s.isAbsent);

  const averageScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : 0;

  const passedCount = validScores.filter((score) => score >= template.passMarks).length;
  const passPercentage =
    validScores.length > 0 ? Math.round((passedCount / validScores.length) * 1000) / 10 : 0;

  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await generateMarksSheetWorkbook(students, template, sortBy);
      const filename = `${template.subjectCode || 'MarksSheet'}_${
        template.examName.replace(/[^a-zA-Z0-9]/g, '_') || 'Assessment'
      }_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Failed to generate Excel file:', err);
      alert('Could not generate Excel spreadsheet. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(students, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `markssheet_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleCopyTsv = () => {
    // Generate TSV header
    const headers = ['Sl No', 'Student Name', 'USN'];
    template.questions.forEach((q) => headers.push(q.q_no));
    headers.push('Total (Computed)', 'Total (Written)', 'Status');

    const lines = [headers.join('\t')];

    // Sorted students
    const sorted = [...students].sort((a, b) => {
      if (sortBy === 'usn') return (a.usn || '').localeCompare(b.usn || '');
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

    sorted.forEach((s, idx) => {
      const qVals = template.questions.map((tq) => {
        const q = s.questions.find(
          (sq) => sq.q_no.toLowerCase().trim() === tq.q_no.toLowerCase().trim()
        );
        return q ? q.marks : '-';
      });

      const line = [
        idx + 1,
        s.name,
        s.usn,
        ...qVals,
        s.computedTotal,
        s.total,
        s.isAbsent ? 'ABSENT' : s.totalMismatch ? 'MISMATCH' : 'OK',
      ];
      lines.push(line.join('\t'));
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Total Students</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalStudents}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {presentStudents.length} Present • {absentCount} Absent
          </div>
        </div>

        {/* Class Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Class Average</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {averageScore}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Out of {template.maxTotalMarks} marks
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Highest Score</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {highestScore}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5" title={topScorer?.name}>
            {topScorer?.name || '-'}
          </div>
        </div>

        {/* Lowest Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <TrendingUp className="w-4 h-4 text-slate-400 rotate-180" />
            <span>Lowest Score</span>
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
            {lowestScore}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Evaluated minimum</div>
        </div>

        {/* Pass Percentage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>Pass Rate</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {passPercentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Threshold: ≥ {template.passMarks}
          </div>
        </div>

        {/* Mismatches check */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-purple-500" />
            <span>Audit Status</span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {students.filter((s) => s.totalMismatch).length === 0 ? 'Verified' : 'Flagged'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {students.filter((s) => s.totalMismatch).length} Mismatch(es)
          </div>
        </div>
      </div>

      {/* Question-Wise Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Question-Wise Analytics & Difficulty Rating
          </h4>
          <span className="text-xs text-slate-400">Included automatically in Excel Sheet 2</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {template.questions.map((tq) => {
            let attemptCount = 0;
            let sumScore = 0;
            students.forEach((s) => {
              const match = s.questions.find(
                (q) => q.q_no.toLowerCase().trim() === tq.q_no.toLowerCase().trim()
              );
              if (match && typeof match.marks === 'number') {
                attemptCount++;
                sumScore += match.marks;
              }
            });

            const avg = attemptCount > 0 ? Math.round((sumScore / attemptCount) * 10) / 10 : 0;
            const rate = tq.max_marks > 0 ? Math.round((avg / tq.max_marks) * 100) : 0;
            let rating = 'Moderate';
            let color = 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200';
            if (rate >= 75) {
              rating = 'Easy';
              color = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
            } else if (rate < 50) {
              rating = 'Challenging';
              color = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
            }

            return (
              <div
                key={tq.q_no}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    Question {tq.q_no}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${color}`}>
                    {rating} ({rate}%)
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs text-slate-600 dark:text-slate-400">
                  <span>
                    Avg: <b className="text-slate-900 dark:text-white">{avg}</b> / {tq.max_marks}
                  </span>
                  <span className="text-[11px]">
                    Attempted: <b>{attemptCount}</b>/{presentStudents.length}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Options & Download Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
              Download Formatted Excel Workbook
            </h3>
            <p className="text-indigo-200/80 text-xs sm:text-sm mt-1 max-w-xl">
              Includes <b>Sheet 1 (Marks Sheet)</b> with dynamic <code className="text-amber-300">=SUM()</code> formulas,
              color highlights, absent student markers, and <b>Sheet 2 (Summary & Analytics)</b> with class metrics.
            </p>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 bg-indigo-800/40 p-1.5 rounded-xl border border-indigo-700/60 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-300 ml-1.5" />
            <span className="text-indigo-200">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-indigo-950/80 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="usn">USN (1MS23CS001...)</option>
              <option value="name">Student Name (A-Z)</option>
              <option value="slno">Original Page Order</option>
            </select>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-black text-sm shadow-lg shadow-black/30 hover:scale-[1.01] transition transform active:scale-95"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            {isExporting ? 'Generating .xlsx...' : 'Download Excel (.xlsx)'}
          </button>

          <button
            onClick={handleCopyTsv}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-600/50 text-white font-semibold text-xs sm:text-sm transition"
          >
            {copiedTsv ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
            {copiedTsv ? 'Copied to Clipboard!' : 'Copy TSV (Paste to Google Sheets)'}
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-800/40 hover:bg-indigo-800/80 border border-indigo-700/50 text-indigo-200 font-semibold text-xs sm:text-sm transition"
          >
            <FileJson className="w-4 h-4 text-indigo-300" />
            Download JSON
          </button>

          <button
            onClick={onBackToReview}
            className="ml-auto text-xs text-indigo-300 hover:text-white underline underline-offset-4"
          >
            ← Back to Table Review
          </button>
        </div>
      </div>
    </div>
  );
};
