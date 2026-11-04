'use client';

import React, { useState } from 'react';
import {
  StudentScore,
  ExamTemplate,
  QuestionMark,
} from '@/types';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Wand2,
  Filter,
  Check,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { ImageViewer } from './ImageViewer';
import { calculateSum, checkIfAbsent, validateUsn } from '@/lib/templates';

interface ReviewStepProps {
  students: StudentScore[];
  setStudents: React.Dispatch<React.SetStateAction<StudentScore[]>>;
  template: ExamTemplate;
  onProceedToExport: () => void;
  onReExtractSinglePage: (studentId: string) => void;
  reExtractingId?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  students,
  setStudents,
  template,
  onProceedToExport,
  onReExtractSinglePage,
  reExtractingId,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<
    'all' | 'mismatches' | 'low_confidence' | 'absent'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileImageModal, setShowMobileImageModal] = useState(false);

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // Helper to update student record and recalculate totals/flags
  const updateStudent = (
    id: string,
    updater: (prev: StudentScore) => StudentScore
  ) => {
    setStudents((prevList) =>
      prevList.map((st) => {
        if (st.id !== id) return st;
        const updated = updater({ ...st });

        // Recalculate computedTotal
        const computed = calculateSum(updated.questions);
        updated.computedTotal = computed;

        // Check if absent
        updated.isAbsent = checkIfAbsent(updated.questions, updated.total);

        // Check total mismatch
        if (updated.isAbsent) {
          updated.totalMismatch = false;
        } else {
          const writtenNum =
            typeof updated.total === 'number'
              ? updated.total
              : parseFloat(String(updated.total));
          if (!isNaN(writtenNum)) {
            updated.totalMismatch = Math.abs(writtenNum - computed) > 0.05;
            if (updated.totalMismatch) {
              updated.totalMismatchReason = `Written total (${writtenNum}) ≠ Computed sum (${computed})`;
            } else {
              updated.totalMismatchReason = undefined;
            }
          } else {
            updated.totalMismatch = false;
          }
        }

        // Validate USN
        updated.usnValid = validateUsn(updated.usn, template.usnPattern);

        return updated;
      })
    );
  };

  const handleCellChange = (
    studentId: string,
    field: 'name' | 'usn' | 'total',
    value: string
  ) => {
    updateStudent(studentId, (st) => ({
      ...st,
      [field]: field === 'total' ? (isNaN(Number(value)) ? value : Number(value)) : value,
    }));
  };

  const handleQuestionMarkChange = (
    studentId: string,
    q_no: string,
    valStr: string
  ) => {
    updateStudent(studentId, (st) => {
      const questions = [...st.questions];
      const idx = questions.findIndex(
        (q) => q.q_no.toLowerCase().trim() === q_no.toLowerCase().trim()
      );

      let parsedVal: number | string = valStr.trim();
      const num = parseFloat(parsedVal);
      if (!isNaN(num) && parsedVal !== 'A' && parsedVal !== '-') {
        parsedVal = num;
      }

      if (idx >= 0) {
        questions[idx] = { ...questions[idx], marks: parsedVal };
      } else {
        // Add new question if not present
        const tq = template.questions.find((t) => t.q_no === q_no);
        questions.push({
          q_no,
          marks: parsedVal,
          max_marks: tq?.max_marks || 10,
        });
      }

      return {
        ...st,
        questions,
      };
    });
  };

  const handleAddRow = () => {
    const newId = `manual-student-${Date.now()}`;
    const newStudent: StudentScore = {
      id: newId,
      pageNumber: students.length + 1,
      fileName: 'Manual Entry',
      imageUrl: '',
      name: 'NEW STUDENT',
      usn: '',
      questions: template.questions.map((tq) => ({
        q_no: tq.q_no,
        marks: 0,
        max_marks: tq.max_marks,
      })),
      total: 0,
      computedTotal: 0,
      confidence: 1.0,
      uncertain_fields: [],
      totalMismatch: false,
      usnValid: false,
      isAbsent: false,
      status: 'success',
    };
    setStudents((prev) => [...prev, newStudent]);
    setSelectedStudentId(newId);
  };

  const handleDeleteRow = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this student entry?')) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (selectedStudentId === studentId) {
        const remaining = students.filter((s) => s.id !== studentId);
        if (remaining.length > 0) setSelectedStudentId(remaining[0].id);
      }
    }
  };

  const handleAutoFixAllMismatches = () => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.totalMismatch && !s.isAbsent) {
          return {
            ...s,
            total: s.computedTotal,
            totalMismatch: false,
            totalMismatchReason: undefined,
          };
        }
        return s;
      })
    );
  };

  // Filter students based on filterType and search query
  const filteredStudents = students.filter((s) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = s.name.toLowerCase().includes(q);
      const matchUsn = s.usn.toLowerCase().includes(q);
      if (!matchName && !matchUsn) return false;
    }

    if (filterType === 'mismatches') return s.totalMismatch;
    if (filterType === 'low_confidence') return s.confidence < 0.8;
    if (filterType === 'absent') return s.isAbsent;
    return true;
  });

  const mismatchCount = students.filter((s) => s.totalMismatch).length;
  const lowConfidenceCount = students.filter((s) => s.confidence < 0.8).length;
  const absentCount = students.filter((s) => s.isAbsent).length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Audit Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search USN or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* Filter Pills */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All ({students.length})
          </button>

          <button
            onClick={() => setFilterType('mismatches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'mismatches'
                ? 'bg-red-600 text-white shadow-xs'
                : mismatchCount > 0
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Mismatches ({mismatchCount})
          </button>

          <button
            onClick={() => setFilterType('low_confidence')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              filterType === 'low_confidence'
                ? 'bg-amber-600 text-white shadow-xs'
                : lowConfidenceCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Uncertain ({lowConfidenceCount})
          </button>

          <button
            onClick={() => setFilterType('absent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterType === 'absent'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Absent ({absentCount})
          </button>
        </div>

        {/* Right action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {mismatchCount > 0 && (
            <button
              onClick={handleAutoFixAllMismatches}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
              title="Replace written total with computed sum for all mismatched rows"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
              Auto-Fix Totals ({mismatchCount})
            </button>
          )}

          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            Add Row
          </button>

          <button
            onClick={onProceedToExport}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition"
          >
            Next: Export Excel
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Image on Left / Modal, Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE: Sticky Image Inspector (5 cols on lg) */}
        <div className="lg:col-span-5 sticky top-20 hidden lg:block h-[calc(100vh-140px)] min-h-[520px]">
          <ImageViewer
            imageUrl={selectedStudent?.imageUrl}
            studentName={selectedStudent?.name}
            usn={selectedStudent?.usn}
            uncertainFields={selectedStudent?.uncertain_fields}
          />
        </div>

        {/* RIGHT PANE: Verification Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Header toolbar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Showing {filteredStudents.length} of {students.length} students
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Total Mismatch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Low Confidence
              </span>
            </div>
          </div>

          {/* Responsive Scrollable Table */}
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Student Name</th>
                  <th className="py-2.5 px-3 min-w-[120px]">USN / Reg No</th>
                  {template.questions.map((q) => (
                    <th key={q.q_no} className="py-2.5 px-2 text-center min-w-[55px]">
                      {q.q_no}
                      <span className="block text-[9px] font-normal text-slate-400">
                        /{q.max_marks}
                      </span>
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center min-w-[70px] bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                    Sum
                  </th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">Written</th>
                  <th className="py-2.5 px-2 text-center w-16">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6 + template.questions.length}
                      className="text-center py-8 text-slate-400"
                    >
                      No student records match the active filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, index) => {
                    const isSelected = st.id === selectedStudentId;
                    const isMismatch = st.totalMismatch;
                    const isLowConf = st.confidence < 0.8;
                    const isReExtracting = reExtractingId === st.id;

                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500'
                            : isMismatch
                            ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50'
                            : isLowConf
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Row Index */}
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) =>
                              handleCellChange(st.id, 'name', e.target.value.toUpperCase())
                            }
                            className={`w-full bg-transparent px-1.5 py-1 rounded font-semibold text-slate-800 dark:text-slate-100 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition ${
                              st.uncertain_fields.some((f) => f.toLowerCase().includes('name'))
                                ? 'bg-amber-100/60 dark:bg-amber-950/60 text-amber-900'
                                : ''
                            }`}
                          />
                        </td>

                        {/* USN / Reg No */}
                        <td className="py-2 px-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={st.usn}
                              onChange={(e) =>
                                handleCellChange(st.id, 'usn', e.target.value.toUpperCase())
                              }
                              className={`w-full bg-transparent px-1.5 py-1 rounded font-mono font-bold text-slate-800 dark:text-slate-100 border focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition ${
                                !st.usnValid && st.usn.length > 0
                                  ? 'border-amber-400 bg-amber-50/50 text-amber-800'
                                  : 'border-transparent hover:border-slate-300 focus:border-indigo-500'
                              }`}
                              title={
                                !st.usnValid && st.usn.length > 0
                                  ? `Expected pattern: ${template.usnHint}`
                                  : undefined
                              }
                            />
                            {!st.usnValid && st.usn.length > 0 && (
                              <span
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500"
                                title={`Does not match standard pattern (${template.usnHint})`}
                              />
                            )}
                          </div>
                        </td>

                        {/* Question Mark Cells */}
                        {template.questions.map((tq) => {
                          const qMark = st.questions.find(
                            (q) => q.q_no.toLowerCase().trim() === tq.q_no.toLowerCase().trim()
                          );
                          const val = qMark ? qMark.marks : '-';
                          const isUncertain = st.uncertain_fields.some((f) =>
                            f.toLowerCase().includes(tq.q_no.toLowerCase())
                          );

                          return (
                            <td key={tq.q_no} className="py-2 px-1 text-center">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  handleQuestionMarkChange(st.id, tq.q_no, e.target.value)
                                }
                                className={`w-12 text-center py-1 rounded font-bold transition border ${
                                  isUncertain
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300'
                                    : String(val).toUpperCase() === 'A'
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 font-normal'
                                    : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Computed Sum Column */}
                        <td className="py-2 px-2 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                          {st.isAbsent ? 'A' : st.computedTotal}
                        </td>

                        {/* Written Total Column (Highlighted if Mismatch!) */}
                        <td className="py-2 px-2 text-center">
                          <div className="relative inline-block">
                            <input
                              type="text"
                              value={st.total}
                              onChange={(e) => handleCellChange(st.id, 'total', e.target.value)}
                              className={`w-14 text-center py-1 rounded font-bold transition border ${
                                isMismatch
                                  ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-400 ring-2 ring-red-400/20'
                                  : 'bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 text-slate-800 dark:text-slate-100'
                              }`}
                              title={
                                isMismatch
                                  ? `Mismatch! Written is ${st.total}, but sum of questions is ${st.computedTotal}`
                                  : undefined
                              }
                            />
                            {isMismatch && (
                              <span
                                className="absolute -top-1 -right-1 flex h-2 w-2"
                                title={st.totalMismatchReason}
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Mobile View Image Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId(st.id);
                                setShowMobileImageModal(true);
                              }}
                              className="lg:hidden p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="View Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Re-extract single page */}
                            <button
                              type="button"
                              disabled={isReExtracting || !st.imageUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReExtractSinglePage(st.id);
                              }}
                              className={`p-1 rounded text-slate-400 hover:text-indigo-600 transition ${
                                isReExtracting ? 'animate-spin text-indigo-600' : ''
                              }`}
                              title="Re-run AI extraction on this page"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete row */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRow(st.id, e)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Modal for Image Inspection */}
      {showMobileImageModal && selectedStudent && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 flex flex-col p-4">
          <div className="flex justify-between items-center text-white mb-2">
            <h3 className="font-bold text-sm">
              {selectedStudent.name} ({selectedStudent.usn})
            </h3>
            <button
              onClick={() => setShowMobileImageModal(false)}
              className="px-3 py-1 bg-slate-800 rounded text-xs font-semibold"
            >
              Close
            </button>
          </div>
          <div className="flex-1">
            <ImageViewer
              imageUrl={selectedStudent.imageUrl}
              studentName={selectedStudent.name}
              usn={selectedStudent.usn}
              uncertainFields={selectedStudent.uncertain_fields}
            />
          </div>
        </div>
      )}
    </div>
  );
};
