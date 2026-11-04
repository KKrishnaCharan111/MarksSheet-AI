'use client';

import React, { useState } from 'react';
import {
  ExamTemplate,
} from '@/types';
import {
  X,
  Settings,
  Plus,
  Trash2,
  Save,
  Check,
  BookmarkPlus,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_TEMPLATES, saveTemplates, setActiveTemplateId } from '@/lib/templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ExamTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ExamTemplate[]>>;
  activeTemplate: ExamTemplate;
  setActiveTemplate: (t: ExamTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  setTemplates,
  activeTemplate,
  setActiveTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeTemplate.id);
  const [editingTemplate, setEditingTemplate] = useState<ExamTemplate>({ ...activeTemplate });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setEditingTemplate({ ...found });
    }
  };

  const handleAddQuestion = () => {
    const qCount = editingTemplate.questions.length;
    const nextQNo = `Q${qCount + 1}`;
    const updatedQuestions = [
      ...editingTemplate.questions,
      { q_no: nextQNo, max_marks: 10 },
    ];
    const totalMax = updatedQuestions.reduce((acc, q) => acc + q.max_marks, 0);

    setEditingTemplate({
      ...editingTemplate,
      questions: updatedQuestions,
      maxTotalMarks: totalMax,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (editingTemplate.questions.length <= 1) {
      alert('At least one question is required');
      return;
    }
    const updated = editingTemplate.questions.filter((_, idx) => idx !== index);
    const totalMax = updated.reduce((acc, q) => acc + q.max_marks, 0);
    setEditingTemplate({
      ...editingTemplate,
      questions: updated,
      maxTotalMarks: totalMax,
    });
  };

  const handleQuestionChange = (
    index: number,
    field: 'q_no' | 'max_marks',
    val: string
  ) => {
    const updated = [...editingTemplate.questions];
    if (field === 'max_marks') {
      const num = parseFloat(val) || 0;
      updated[index] = { ...updated[index], max_marks: num };
    } else {
      updated[index] = { ...updated[index], q_no: val };
    }
    const totalMax = updated.reduce((acc, q) => acc + q.max_marks, 0);
    setEditingTemplate({
      ...editingTemplate,
      questions: updated,
      maxTotalMarks: totalMax,
    });
  };

  const handleSaveAndApply = () => {
    // Update in templates list
    const updatedList = templates.map((t) =>
      t.id === editingTemplate.id ? { ...editingTemplate } : t
    );
    // If not found in list, append
    if (!updatedList.some((t) => t.id === editingTemplate.id)) {
      updatedList.push({ ...editingTemplate });
    }

    setTemplates(updatedList);
    saveTemplates(updatedList);
    setActiveTemplate(editingTemplate);
    setActiveTemplateId(editingTemplate.id);

    setSaveSuccessMessage('Template saved & applied to current batch!');
    setTimeout(() => {
      setSaveSuccessMessage('');
      onClose();
    }, 900);
  };

  const handleSaveAsNew = () => {
    const newName = prompt('Enter a name for this new template:', `${editingTemplate.name} (Copy)`);
    if (!newName) return;

    const newTemplate: ExamTemplate = {
      ...editingTemplate,
      id: `custom-template-${Date.now()}`,
      name: newName,
    };

    const updatedList = [...templates, newTemplate];
    setTemplates(updatedList);
    saveTemplates(updatedList);
    setActiveTemplate(newTemplate);
    setActiveTemplateId(newTemplate.id);
    setSelectedTemplateId(newTemplate.id);
    setEditingTemplate(newTemplate);

    setSaveSuccessMessage('Saved as new template & applied!');
    setTimeout(() => {
      setSaveSuccessMessage('');
      onClose();
    }, 900);
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset templates to default factory presets?')) {
      setTemplates(DEFAULT_TEMPLATES);
      saveTemplates(DEFAULT_TEMPLATES);
      setActiveTemplate(DEFAULT_TEMPLATES[0]);
      setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
      setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
      setEditingTemplate({ ...DEFAULT_TEMPLATES[0] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Exam Template & Question Layout Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define the question layout once and reuse it across multiple batches.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Select or Load Template:
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.questions.length} Questions, {t.maxTotalMarks} Marks)
                </option>
              ))}
            </select>
          </div>

          {/* General Metadata Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Template Name
              </label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Institution Name
              </label>
              <input
                type="text"
                value={editingTemplate.institutionName}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, institutionName: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Subject Code & Title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="BCS301"
                  value={editingTemplate.subjectCode}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subjectCode: e.target.value })
                  }
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium uppercase font-mono"
                />
                <input
                  type="text"
                  placeholder="Data Structures"
                  value={editingTemplate.subjectName}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subjectName: e.target.value })
                  }
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Assessment / Exam Name
              </label>
              <input
                type="text"
                value={editingTemplate.examName}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, examName: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
              />
            </div>
          </div>

          {/* Question Structure Configuration */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Questions & Maximum Marks
                </h4>
                <p className="text-xs text-slate-500">
                  Total Max Marks: <b className="text-indigo-600 dark:text-indigo-400">{editingTemplate.maxTotalMarks}</b> | Passing Marks: <b className="text-emerald-600">{editingTemplate.passMarks}</b>
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
              {editingTemplate.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <input
                    type="text"
                    value={q.q_no}
                    onChange={(e) => handleQuestionChange(idx, 'q_no', e.target.value)}
                    className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-center font-bold text-xs"
                    placeholder="Q1a"
                  />
                  <div className="flex items-center text-xs text-slate-400">/</div>
                  <input
                    type="number"
                    value={q.max_marks}
                    onChange={(e) => handleQuestionChange(idx, 'max_marks', e.target.value)}
                    className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-center font-bold text-xs"
                    min={1}
                    max={100}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Rules: USN RegEx & Passing Threshold */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="font-bold text-slate-900 dark:text-white">
              Validation & Threshold Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Passing Marks Threshold
                </label>
                <input
                  type="number"
                  value={editingTemplate.passMarks}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      passMarks: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Student USN / Roll No RegEx Pattern
                </label>
                <input
                  type="text"
                  value={editingTemplate.usnPattern}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, usnPattern: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono"
                />
                <div className="flex gap-2 text-[10px] text-slate-400 pt-1">
                  <span>Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTemplate({
                        ...editingTemplate,
                        usnPattern: '^1[A-Za-z]{2}\\d{2}[A-Za-z]{2}\\d{3}$',
                        usnHint: 'VTU 10-char USN (1MS23CS001)',
                      })
                    }
                    className="text-indigo-600 dark:text-indigo-400 underline"
                  >
                    VTU (1MS23CS001)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTemplate({
                        ...editingTemplate,
                        usnPattern: '^[A-Za-z0-9\\-]+$',
                        usnHint: 'Any Alphanumeric ID',
                      })
                    }
                    className="text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Any Alphanumeric
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            {saveSuccessMessage && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                {saveSuccessMessage}
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveAsNew}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200 transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-500" />
              Save As New
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
